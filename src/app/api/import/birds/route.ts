import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const importBirdSchema = z.object({
  name: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  hatchDate: z.string(),
  sireId: z.string().optional(),
  damId: z.string().optional(),
  legBandNumber: z.string().optional(),
  legBandColor: z.string().optional(),
  wingBand: z.string().optional(),
  breedCode: z.string().optional(),
  breedName: z.string().optional(), // For auto-creating breeds
  breedPercentage: z.number().optional(),
  coopName: z.string().optional(), // For auto-creating/assigning coops
  color: z.string().optional(),
})

const importSchema = z.object({
  birds: z.array(importBirdSchema),
  dryRun: z.boolean().optional(), // If true, validate only, don't insert
  autoCreate: z.boolean().optional(), // If true, auto-create missing breeds/coops
})

// POST /api/import/birds - Import birds from CSV data
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can import data", 403)
    }

    const supabase = await createClient()

    const body = await req.json()
    const data = importSchema.parse(body)

    const results = {
      total: data.birds.length,
      valid: 0,
      invalid: 0,
      errors: [] as { row: number; message: string }[],
      created: [] as string[],
      autoCreated: {
        breeds: [] as { code: string; name: string }[],
        coops: [] as { name: string }[],
      },
      wouldAutoCreate: {
        breeds: [] as { code: string; name: string }[],
        coops: [] as { name: string }[],
      },
    }

    const autoCreate = data.autoCreate ?? true // Default to auto-create
    const isDryRun = data.dryRun ?? false

    // Track what would be created during dry run (to avoid duplicates in the list)
    const pendingBreeds = new Set<string>()
    const pendingCoops = new Set<string>()

    // Build a map of existing birds by identifier for parent lookups
    const { data: existingBirds, error: birdsError } = await supabase
      .from('birds')
      .select(`
        id,
        sex,
        bird_identifiers (id_type, id_value)
      `)

    if (birdsError) {
      console.error("Failed to fetch existing birds:", birdsError)
      return errorResponse("Failed to fetch existing birds", 500)
    }

    const birdByIdentifier = new Map<string, string>()
    const birdById = new Map<string, { id: string; sex: string }>()
    ;(existingBirds || []).forEach((bird) => {
      birdById.set(bird.id, { id: bird.id, sex: bird.sex })
      ;(bird.bird_identifiers || []).forEach((id: { id_type: string; id_value: string }) => {
        birdByIdentifier.set(`${id.id_type}:${id.id_value}`, bird.id)
      })
    })

    // Get breeds for composition
    const { data: breeds, error: breedsError } = await supabase
      .from('breeds')
      .select('id, code, name')

    if (breedsError) {
      console.error("Failed to fetch breeds:", breedsError)
      return errorResponse("Failed to fetch breeds", 500)
    }

    const breedByCode = new Map((breeds || []).map((b) => [b.code, b.id]))
    const breedByName = new Map((breeds || []).map((b) => [b.name.toLowerCase(), b.id]))

    // Get coops
    const { data: coops, error: coopsError } = await supabase
      .from('coops')
      .select('id, name')

    if (coopsError) {
      console.error("Failed to fetch coops:", coopsError)
      return errorResponse("Failed to fetch coops", 500)
    }

    const coopByName = new Map((coops || []).map((c) => [c.name.toLowerCase(), c.id]))

    // Helper to generate breed code from name
    const generateBreedCode = (name: string): string => {
      const words = name.trim().split(/\s+/)
      if (words.length === 1) {
        return name.substring(0, 4).toUpperCase()
      }
      return words.map(w => w[0]).join("").toUpperCase().substring(0, 6)
    }

    // Helper to get or create breed
    const getOrCreateBreed = async (code: string | undefined, name: string | undefined, forDryRun = false): Promise<string | null> => {
      if (!code && !name) return null

      // Try to find by code first
      if (code) {
        const existingId = breedByCode.get(code.toUpperCase())
        if (existingId) return existingId
      }

      // Try to find by name
      if (name) {
        const existingId = breedByName.get(name.toLowerCase())
        if (existingId) return existingId
      }

      // Auto-create if enabled and we have a name
      if (autoCreate && name) {
        const newCode = code?.toUpperCase() || generateBreedCode(name)

        // Check if generated code already exists
        let finalCode = newCode
        let counter = 1
        while (breedByCode.has(finalCode)) {
          finalCode = `${newCode}${counter}`
          counter++
        }

        // If dry run, just track what would be created
        if (forDryRun || isDryRun) {
          const key = name.toLowerCase()
          if (!pendingBreeds.has(key)) {
            pendingBreeds.add(key)
            results.wouldAutoCreate.breeds.push({ code: finalCode, name: name })
          }
          return "pending"
        }

        const { data: newBreed, error: createError } = await supabase
          .from('breeds')
          .insert({
            name: name,
            code: finalCode,
            varieties: [],
          })
          .select('id')
          .single()

        if (createError || !newBreed) {
          console.error("Failed to create breed:", createError)
          return null
        }

        breedByCode.set(finalCode, newBreed.id)
        breedByName.set(name.toLowerCase(), newBreed.id)
        results.autoCreated.breeds.push({ code: finalCode, name: name })

        return newBreed.id
      }

      return null
    }

    // Helper to get or create coop
    const getOrCreateCoop = async (name: string | undefined, forDryRun = false): Promise<string | null> => {
      if (!name) return null

      const existingId = coopByName.get(name.toLowerCase())
      if (existingId) return existingId

      // Auto-create if enabled
      if (autoCreate) {
        // If dry run, just track what would be created
        if (forDryRun || isDryRun) {
          const key = name.toLowerCase()
          if (!pendingCoops.has(key)) {
            pendingCoops.add(key)
            results.wouldAutoCreate.coops.push({ name: name })
          }
          return "pending"
        }

        const { data: newCoop, error: createError } = await supabase
          .from('coops')
          .insert({
            name: name,
            capacity: 20, // Default capacity
            coop_type: "GROW_OUT", // Default type
            status: "ACTIVE",
          })
          .select('id')
          .single()

        if (createError || !newCoop) {
          console.error("Failed to create coop:", createError)
          return null
        }

        coopByName.set(name.toLowerCase(), newCoop.id)
        results.autoCreated.coops.push({ name: name })

        return newCoop.id
      }

      return null
    }

    // Validate each bird
    for (let i = 0; i < data.birds.length; i++) {
      const bird = data.birds[i]
      const rowNum = i + 1

      try {
        // Validate hatch date
        const hatchDate = new Date(bird.hatchDate)
        if (isNaN(hatchDate.getTime())) {
          results.errors.push({ row: rowNum, message: "Invalid hatch date" })
          results.invalid++
          continue
        }

        // Look up parent IDs if provided
        let sireId: string | undefined
        let damId: string | undefined

        if (bird.sireId) {
          // Try to find by ID or identifier
          const sireById = birdById.get(bird.sireId)
          let sire: { id: string; sex: string } | undefined

          if (sireById) {
            sire = sireById
          } else {
            // Search by identifier value
            const entries = Array.from(birdByIdentifier.entries())
            for (const [key, id] of entries) {
              if (key.includes(bird.sireId)) {
                const foundBird = birdById.get(id)
                if (foundBird) {
                  sire = foundBird
                  break
                }
              }
            }
          }

          if (!sire) {
            results.errors.push({ row: rowNum, message: `Father not found: ${bird.sireId}` })
            results.invalid++
            continue
          }
          if (sire.sex !== "MALE") {
            results.errors.push({ row: rowNum, message: `Father must be male: ${bird.sireId}` })
            results.invalid++
            continue
          }
          sireId = sire.id
        }

        if (bird.damId) {
          const damById = birdById.get(bird.damId)
          let dam: { id: string; sex: string } | undefined

          if (damById) {
            dam = damById
          } else {
            // Search by identifier value
            const entries = Array.from(birdByIdentifier.entries())
            for (const [key, id] of entries) {
              if (key.includes(bird.damId)) {
                const foundBird = birdById.get(id)
                if (foundBird) {
                  dam = foundBird
                  break
                }
              }
            }
          }

          if (!dam) {
            results.errors.push({ row: rowNum, message: `Mother not found: ${bird.damId}` })
            results.invalid++
            continue
          }
          if (dam.sex !== "FEMALE") {
            results.errors.push({ row: rowNum, message: `Mother must be female: ${bird.damId}` })
            results.invalid++
            continue
          }
          damId = dam.id
        }

        // Check for duplicate identifiers
        if (bird.legBandNumber) {
          const existing = birdByIdentifier.get(`LEG_NUMBER:${bird.legBandNumber}`)
          if (existing) {
            results.errors.push({ row: rowNum, message: `Leg band number already exists: ${bird.legBandNumber}` })
            results.invalid++
            continue
          }
        }

        results.valid++

        // For dry run, track what would be auto-created
        if (isDryRun) {
          await getOrCreateBreed(bird.breedCode, bird.breedName, true)
          await getOrCreateCoop(bird.coopName, true)
          continue
        }

        // Create the bird
        // Build breed composition (auto-create breed if needed)
        let breedComposition: { breedId: string; percentage: number }[] = []
        const breedId = await getOrCreateBreed(bird.breedCode, bird.breedName)
        if (breedId) {
          breedComposition = [{
            breedId,
            percentage: bird.breedPercentage || 100,
          }]
        }

        // Get or create coop
        const coopId = await getOrCreateCoop(bird.coopName)

        const { data: newBird, error: createBirdError } = await supabase
          .from('birds')
          .insert({
            name: bird.name,
            sex: bird.sex,
            hatch_date: hatchDate.toISOString().split('T')[0],
            sire_id: sireId,
            dam_id: damId,
            coop_id: coopId,
            color: bird.color,
            breed_composition: breedComposition,
            created_by: session.user.id,
          })
          .select('id')
          .single()

        if (createBirdError || !newBird) {
          results.errors.push({ row: rowNum, message: `Error creating bird: ${createBirdError?.message || "Unknown"}` })
          results.invalid++
          continue
        }

        // Create identifiers
        const identifiersToCreate = [
          ...(bird.legBandNumber ? [{ bird_id: newBird.id, id_type: "LEG_NUMBER", id_value: bird.legBandNumber }] : []),
          ...(bird.legBandColor ? [{ bird_id: newBird.id, id_type: "LEG_COLOR", id_value: bird.legBandColor }] : []),
          ...(bird.wingBand ? [{ bird_id: newBird.id, id_type: "WING_BAND", id_value: bird.wingBand }] : []),
        ]

        if (identifiersToCreate.length > 0) {
          const { error: identifierError } = await supabase
            .from('bird_identifiers')
            .insert(identifiersToCreate)

          if (identifierError) {
            console.error("Failed to create identifiers:", identifierError)
            // Bird was created, so we still count it as success but log the error
          }
        }

        results.created.push(newBird.id)

        // Add to lookup map for subsequent rows
        birdById.set(newBird.id, { id: newBird.id, sex: bird.sex })
        if (bird.legBandNumber) {
          birdByIdentifier.set(`LEG_NUMBER:${bird.legBandNumber}`, newBird.id)
        }
      } catch (err) {
        results.errors.push({ row: rowNum, message: `Error: ${err instanceof Error ? err.message : "Unknown"}` })
        results.invalid++
      }
    }

    return successResponse({
      dryRun: data.dryRun || false,
      results,
    })
  } catch (error) {
    return handleApiError(error, "POST /api/import/birds")
  }
}
