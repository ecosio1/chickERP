import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"
import type { Database } from "@/types/database.types"

type BirdStatus = Database['public']['Enums']['bird_status']
type BirdSex = Database['public']['Enums']['bird_sex']

const createBirdSchema = z.object({
  name: z.string().nullable().optional(),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  hatchDate: z.string(),
  status: z.enum(["ACTIVE", "SOLD", "DECEASED", "CULLED", "LOST", "BREEDING", "RETIRED", "ARCHIVED"]).optional(),
  sireId: z.string().nullable().optional(),
  damId: z.string().nullable().optional(),
  coopId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  combType: z.enum(["SINGLE", "PEA", "ROSE", "WALNUT", "BUTTERCUP", "V_SHAPED", "CUSHION"]).nullable().optional(),
  earlyLifeNotes: z.string().nullable().optional(),
  breedComposition: z.array(z.object({
    breedId: z.string(),
    percentage: z.number().min(0).max(100),
  })).nullable().optional(),
  breedOverride: z.boolean().optional(),
  identifiers: z.array(z.object({
    idType: z.string(),
    idValue: z.string(),
    notes: z.string().nullable().optional(),
  })).nullable().optional(),
})

// GET /api/birds - List birds with search and filters
export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const sex = searchParams.get("sex")
    const coopId = searchParams.get("coopId")
    const parentId = searchParams.get("parentId")
    const color = searchParams.get("color")
    const breedId = searchParams.get("breedId")
    const sourceFarmId = searchParams.get("sourceFarmId")
    const ageMin = searchParams.get("ageMin")
    const ageMax = searchParams.get("ageMax")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Get breed IDs linked to source farm if filtering
    let breedIdsToFilter: string[] = []
    if (sourceFarmId) {
      const { data: linkedBreeds } = await supabase
        .from('breed_source_farms')
        .select('breed_id')
        .eq('source_farm_id', sourceFarmId)
      breedIdsToFilter = (linkedBreeds || []).map((b) => b.breed_id)
    }

    // Build query - simplified to avoid self-join issues
    let query = supabase
      .from('birds')
      .select(`
        *,
        identifiers:bird_identifiers(*),
        coop:coops(id, name),
        photos:bird_photos(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) query = query.eq('status', status as BirdStatus)
    if (sex) query = query.eq('sex', sex as BirdSex)
    if (coopId) query = query.eq('coop_id', coopId)
    if (color) query = query.eq('color', color)

    if (parentId) {
      query = query.or(`sire_id.eq.${parentId},dam_id.eq.${parentId}`)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%`)
    }

    // Age range filter
    if (ageMin || ageMax) {
      const now = new Date()
      if (ageMin) {
        const maxHatchDate = new Date(now)
        maxHatchDate.setMonth(maxHatchDate.getMonth() - parseInt(ageMin))
        query = query.lte('hatch_date', maxHatchDate.toISOString())
      }
      if (ageMax) {
        const minHatchDate = new Date(now)
        minHatchDate.setMonth(minHatchDate.getMonth() - parseInt(ageMax))
        query = query.gte('hatch_date', minHatchDate.toISOString())
      }
    }

    // For breed/sourceFarm filters, fetch more for post-filtering
    const needsPostFilter = breedId || breedIdsToFilter.length > 0
    const fetchLimit = needsPostFilter ? 1000 : limit
    const fetchOffset = needsPostFilter ? 0 : offset

    query = query.range(fetchOffset, fetchOffset + fetchLimit - 1)

    const { data: birds, count, error } = await query

    if (error) {
      console.error("GET /api/birds error:", error)
      return errorResponse("Failed to fetch birds", 500)
    }

    let filteredBirds = birds || []
    let total = count || 0

    // Post-filter for breed composition (JSON field)
    if (breedId || breedIdsToFilter.length > 0) {
      const filterBreedIds = breedId
        ? [breedId, ...breedIdsToFilter]
        : breedIdsToFilter

      filteredBirds = filteredBirds.filter((bird) => {
        const composition = bird.breed_composition as Array<{ breedId: string; percentage: number }> | null
        if (!composition || !Array.isArray(composition)) return false
        return composition.some((bc) => filterBreedIds.includes(bc.breedId))
      })

      total = filteredBirds.length
      filteredBirds = filteredBirds.slice(offset, offset + limit)
    }

    // Search by identifier value (post-filter since it's a nested query)
    if (search) {
      filteredBirds = filteredBirds.filter((bird) => {
        const nameMatch = bird.name?.toLowerCase().includes(search.toLowerCase())
        const idMatch = bird.identifiers?.some((id: { id_value: string }) =>
          id.id_value?.toLowerCase().includes(search.toLowerCase())
        )
        return nameMatch || idMatch
      })
    }

    // Fetch parent info separately to avoid self-join issues
    const parentIds = new Set<string>()
    filteredBirds.forEach((bird) => {
      if (bird.sire_id) parentIds.add(bird.sire_id)
      if (bird.dam_id) parentIds.add(bird.dam_id)
    })

    let parentMap: Record<string, { id: string; name: string | null }> = {}
    if (parentIds.size > 0) {
      const { data: parents } = await supabase
        .from('birds')
        .select('id, name')
        .in('id', Array.from(parentIds))

      if (parents) {
        parentMap = Object.fromEntries(parents.map((p) => [p.id, p]))
      }
    }

    // Add parent info to birds
    const birdsWithParents = filteredBirds.map((bird) => ({
      ...bird,
      sire: bird.sire_id ? parentMap[bird.sire_id] || null : null,
      dam: bird.dam_id ? parentMap[bird.dam_id] || null : null,
    }))

    return successResponse({ birds: birdsWithParents, total, limit, offset })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/birds error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/birds - Create new bird
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can add birds", 403)
    }

    const body = await req.json()
    const data = createBirdSchema.parse(body)

    // Validate parent references
    if (data.sireId) {
      const { data: sire } = await supabase
        .from('birds')
        .select('id, sex')
        .eq('id', data.sireId)
        .single()
      if (!sire) return errorResponse("Father bird not found", 400)
      if (sire.sex !== "MALE") return errorResponse("Father must be male", 400)
    }

    if (data.damId) {
      const { data: dam } = await supabase
        .from('birds')
        .select('id, sex')
        .eq('id', data.damId)
        .single()
      if (!dam) return errorResponse("Mother bird not found", 400)
      if (dam.sex !== "FEMALE") return errorResponse("Mother must be female", 400)
    }

    // Create bird
    const { data: newBird, error: birdError } = await supabase
      .from('birds')
      .insert({
        name: data.name,
        sex: data.sex,
        hatch_date: data.hatchDate,
        status: data.status || "ACTIVE",
        sire_id: data.sireId,
        dam_id: data.damId,
        coop_id: data.coopId,
        color: data.color,
        comb_type: data.combType,
        early_life_notes: data.earlyLifeNotes,
        breed_composition: data.breedComposition || [],
        breed_override: data.breedOverride || false,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (birdError || !newBird) {
      console.error("Create bird error:", birdError)
      return errorResponse("Failed to create bird", 500)
    }

    // Add identifiers if provided
    if (data.identifiers && data.identifiers.length > 0) {
      const { error: idError } = await supabase
        .from('bird_identifiers')
        .insert(data.identifiers.map((id) => ({
          bird_id: newBird.id,
          id_type: id.idType,
          id_value: id.idValue,
          notes: id.notes,
        })))

      if (idError) {
        console.error("Create identifiers error:", idError)
      }
    }

    // Create coop assignment record if assigned
    if (data.coopId) {
      await supabase
        .from('coop_assignments')
        .insert({
          bird_id: newBird.id,
          coop_id: data.coopId,
          assigned_at: new Date().toISOString(),
        })
    }

    // Fetch complete bird with relations
    const { data: completeBird } = await supabase
      .from('birds')
      .select(`
        *,
        identifiers:bird_identifiers(*),
        coop:coops(id, name)
      `)
      .eq('id', newBird.id)
      .single()

    // Fetch parent info separately
    let sire = null
    let dam = null
    if (completeBird?.sire_id) {
      const { data } = await supabase.from('birds').select('id, name').eq('id', completeBird.sire_id).single()
      sire = data
    }
    if (completeBird?.dam_id) {
      const { data } = await supabase.from('birds').select('id, name').eq('id', completeBird.dam_id).single()
      dam = data
    }

    return successResponse({ ...completeBird, sire, dam }, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/birds")
  }
}
