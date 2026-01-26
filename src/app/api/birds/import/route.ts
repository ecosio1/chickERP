import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

type BirdSex = "MALE" | "FEMALE" | "UNKNOWN"
type BirdStatus = "ACTIVE" | "SOLD" | "DECEASED" | "CULLED" | "LOST" | "BREEDING" | "RETIRED" | "ARCHIVED"

interface ImportRow {
  rowNumber: number
  name: string
  sex: string
  hatchDate: string
  status: string
  coopName: string
  sireName: string
  damName: string
  bandNumber: string
  breedName?: string
  breedCode?: string
  color?: string
  notes?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await req.json()
    const { birds } = body as { birds: ImportRow[] }

    if (!birds || !Array.isArray(birds) || birds.length === 0) {
      return NextResponse.json({ error: "No birds data provided" }, { status: 400 })
    }

    // Pre-fetch coops for lookup
    const { data: coops } = await supabase
      .from('coops')
      .select('id, name')

    const coopMap = new Map((coops || []).map((c) => [c.name.toLowerCase(), c.id]))

    // Pre-fetch breeds for lookup
    const { data: breeds } = await supabase
      .from('breeds')
      .select('id, name, code')

    const breedByCode = new Map((breeds || []).map((b) => [b.code.toLowerCase(), b.id]))
    const breedByName = new Map((breeds || []).map((b) => [b.name.toLowerCase(), b.id]))

    // Get all birds for parent matching (by name or band number)
    const { data: existingBirds } = await supabase
      .from('birds')
      .select('id, name')

    const birdByName = new Map(
      (existingBirds || []).filter((b) => b.name).map((b) => [b.name!.toLowerCase(), b.id])
    )

    // Also check identifiers for band numbers
    const { data: identifiers } = await supabase
      .from('bird_identifiers')
      .select('bird_id, id_value')
      .eq('id_type', 'BAND')

    const birdByBand = new Map((identifiers || []).map((i) => [i.id_value.toLowerCase(), i.bird_id]))

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
      autoCreated: {
        coops: [] as string[],
        breeds: [] as string[],
        sires: [] as string[],
        dams: [] as string[],
      },
    }

    // Helper to generate breed code from name
    const generateBreedCode = (name: string): string => {
      const words = name.trim().split(/\s+/)
      if (words.length === 1) {
        return name.substring(0, 4).toUpperCase()
      }
      return words.map(w => w[0]).join("").toUpperCase().substring(0, 6)
    }

    // Helper to get or create coop
    const getOrCreateCoop = async (name: string): Promise<string> => {
      const key = name.toLowerCase()
      const existingId = coopMap.get(key)
      if (existingId) return existingId

      // Auto-create the coop
      const { data: newCoop, error } = await supabase
        .from('coops')
        .insert({
          name: name,
          capacity: 20,
          coop_type: "GROW_OUT",
          status: "ACTIVE",
        })
        .select()
        .single()

      if (error || !newCoop) {
        throw new Error(`Failed to create coop: ${name}`)
      }

      coopMap.set(key, newCoop.id)
      results.autoCreated.coops.push(name)
      return newCoop.id
    }

    // Helper to get or create breed
    const getOrCreateBreed = async (code: string | undefined, name: string | undefined): Promise<string | null> => {
      if (!code && !name) return null

      // Try to find by code first
      if (code) {
        const existingId = breedByCode.get(code.toLowerCase())
        if (existingId) return existingId
      }

      // Try to find by name
      if (name) {
        const existingId = breedByName.get(name.toLowerCase())
        if (existingId) return existingId
      }

      // Auto-create if we have a name
      if (name) {
        let newCode = code?.toUpperCase() || generateBreedCode(name)

        // Ensure unique code
        let counter = 1
        while (breedByCode.has(newCode.toLowerCase())) {
          newCode = `${code?.toUpperCase() || generateBreedCode(name)}${counter}`
          counter++
        }

        const { data: newBreed, error } = await supabase
          .from('breeds')
          .insert({
            name: name,
            code: newCode,
            varieties: [],
          })
          .select()
          .single()

        if (error || !newBreed) {
          throw new Error(`Failed to create breed: ${name}`)
        }

        breedByCode.set(newCode.toLowerCase(), newBreed.id)
        breedByName.set(name.toLowerCase(), newBreed.id)
        results.autoCreated.breeds.push(name)
        return newBreed.id
      }

      return null
    }

    // Helper to get or create parent bird (sire/dam)
    const getOrCreateParentBird = async (
      name: string,
      sex: "MALE" | "FEMALE",
      type: "sire" | "dam"
    ): Promise<string> => {
      const key = name.toLowerCase()

      // Check by name first
      const existingByName = birdByName.get(key)
      if (existingByName) return existingByName

      // Check by band number
      const existingByBand = birdByBand.get(key)
      if (existingByBand) return existingByBand

      // Auto-create placeholder parent bird
      const { data: newBird, error } = await supabase
        .from('birds')
        .insert({
          name: name,
          sex: sex,
          status: "ACTIVE",
          hatch_date: new Date().toISOString(), // Unknown, use current date
          breed_composition: [],
          created_by: session.user.id,
        })
        .select()
        .single()

      if (error || !newBird) {
        throw new Error(`Failed to create ${type}: ${name}`)
      }

      // Add to lookup maps
      birdByName.set(key, newBird.id)

      if (type === "sire") {
        results.autoCreated.sires.push(name)
      } else {
        results.autoCreated.dams.push(name)
      }

      return newBird.id
    }

    // Process each bird
    for (const row of birds) {
      try {
        // Validate sex
        if (!["MALE", "FEMALE", "UNKNOWN"].includes(row.sex)) {
          results.failed++
          results.errors.push({ row: row.rowNumber, error: `Invalid sex: ${row.sex}` })
          continue
        }

        // Validate date
        const hatchDate = new Date(row.hatchDate)
        if (isNaN(hatchDate.getTime())) {
          results.failed++
          results.errors.push({ row: row.rowNumber, error: `Invalid date: ${row.hatchDate}` })
          continue
        }

        // Map status
        const statusMap: Record<string, BirdStatus> = {
          ACTIVE: "ACTIVE",
          SOLD: "SOLD",
          DECEASED: "DECEASED",
          CULLED: "CULLED",
          LOST: "LOST",
          BREEDING: "BREEDING",
          RETIRED: "RETIRED",
        }
        const status = statusMap[row.status] || "ACTIVE"

        // Get or create coop
        let coopId: string | null = null
        if (row.coopName) {
          coopId = await getOrCreateCoop(row.coopName)
        }

        // Get or create breed
        let breedComposition: { breedId: string; percentage: number }[] = []
        const breedId = await getOrCreateBreed(row.breedCode, row.breedName)
        if (breedId) {
          breedComposition = [{ breedId, percentage: 100 }]
        }

        // Look up or create sire
        let sireId: string | null = null
        if (row.sireName) {
          sireId = await getOrCreateParentBird(row.sireName, "MALE", "sire")
        }

        // Look up or create dam
        let damId: string | null = null
        if (row.damName) {
          damId = await getOrCreateParentBird(row.damName, "FEMALE", "dam")
        }

        // Create bird
        const { data: bird, error: birdError } = await supabase
          .from('birds')
          .insert({
            name: row.name || null,
            sex: row.sex as BirdSex,
            hatch_date: hatchDate.toISOString(),
            status,
            coop_id: coopId,
            sire_id: sireId,
            dam_id: damId,
            color: row.color || null,
            breed_composition: breedComposition,
            created_by: session.user.id,
          })
          .select()
          .single()

        if (birdError || !bird) {
          results.failed++
          results.errors.push({
            row: row.rowNumber,
            error: birdError?.message || "Failed to create bird",
          })
          continue
        }

        // Add band number identifier if provided
        if (row.bandNumber) {
          await supabase
            .from('bird_identifiers')
            .insert({
              bird_id: bird.id,
              id_type: "BAND",
              id_value: row.bandNumber,
            })

          // Add to lookup map for subsequent rows
          birdByBand.set(row.bandNumber.toLowerCase(), bird.id)
        }

        // Add name to lookup for subsequent rows
        if (row.name) {
          birdByName.set(row.name.toLowerCase(), bird.id)
        }

        results.success++
      } catch (err) {
        results.failed++
        results.errors.push({
          row: row.rowNumber,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Failed to import birds" },
      { status: 500 }
    )
  }
}
