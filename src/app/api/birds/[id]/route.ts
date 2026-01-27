import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const updateBirdSchema = z.object({
  name: z.string().nullable().optional(),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  status: z.enum(["ACTIVE", "SOLD", "DECEASED", "CULLED", "LOST", "BREEDING", "RETIRED", "ARCHIVED"]).optional(),
  sireId: z.string().nullable().optional(),
  damId: z.string().nullable().optional(),
  coopId: z.string().nullable().optional(),
  color: z.string().nullable().optional(), // Color ID from predefined list
  combType: z.enum(["SINGLE", "PEA", "ROSE", "WALNUT", "BUTTERCUP", "V_SHAPED", "CUSHION"]).nullable().optional(),
  earlyLifeNotes: z.string().nullable().optional(),
  breedComposition: z.array(z.object({
    breedId: z.string(),
    percentage: z.number().min(0).max(100),
  })).optional(),
  breedOverride: z.boolean().optional(),
})

// GET /api/birds/[id] - Get bird details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    // Get bird with basic relations
    const { data: bird, error } = await supabase
      .from('birds')
      .select(`
        *,
        identifiers:bird_identifiers(*),
        photos:bird_photos(*),
        coop:coops(*)
      `)
      .eq('id', id)
      .single()

    if (error || !bird) {
      console.error("Bird fetch error:", error)
      return errorResponse("Bird not found", 404)
    }

    // Run ALL additional queries in parallel for speed
    const [
      sireResult,
      damResult,
      createdByResult,
      notesResult,
      offspringAsSireResult,
      offspringAsDamResult,
      eggRecordsResult,
      weightRecordsResult,
      vaccinationsResult,
      healthIncidentsResult,
      coopAssignmentsResult,
    ] = await Promise.all([
      // Sire
      bird.sire_id
        ? supabase.from('birds').select('id, name, breed_composition, identifiers:bird_identifiers(*)').eq('id', bird.sire_id).single()
        : Promise.resolve({ data: null }),
      // Dam
      bird.dam_id
        ? supabase.from('birds').select('id, name, breed_composition, identifiers:bird_identifiers(*)').eq('id', bird.dam_id).single()
        : Promise.resolve({ data: null }),
      // Created by
      bird.created_by
        ? supabase.from('profiles').select('id, name').eq('id', bird.created_by).single()
        : Promise.resolve({ data: null }),
      // Notes
      supabase.from('bird_notes').select('*').eq('bird_id', id).order('created_at', { ascending: false }).limit(10),
      // Offspring as sire
      supabase.from('birds').select('id, name, sex, identifiers:bird_identifiers(*)').eq('sire_id', id).limit(50),
      // Offspring as dam
      supabase.from('birds').select('id, name, sex, identifiers:bird_identifiers(*)').eq('dam_id', id).limit(50),
      // Egg records
      supabase.from('egg_records').select('*').eq('bird_id', id).order('date', { ascending: false }).limit(20),
      // Weight records
      supabase.from('weight_records').select('*').eq('bird_id', id).order('date', { ascending: false }).limit(20),
      // Vaccinations
      supabase.from('vaccination_birds').select('*, vaccination:vaccinations(*)').eq('bird_id', id),
      // Health incidents
      supabase.from('health_incident_birds').select('*, incident:health_incidents(*)').eq('bird_id', id),
      // Coop assignments
      supabase.from('coop_assignments').select('*, coop:coops(*)').eq('bird_id', id).order('assigned_at', { ascending: false }).limit(10),
    ])

    // Transform parent data to camelCase
    const sire = sireResult.data ? {
      ...sireResult.data,
      breedComposition: sireResult.data.breed_composition,
    } : null
    const dam = damResult.data ? {
      ...damResult.data,
      breedComposition: damResult.data.breed_composition,
    } : null
    const createdByUser = createdByResult.data
    const notes = notesResult.data || []
    const offspringAsSire = offspringAsSireResult.data || []
    const offspringAsDam = offspringAsDamResult.data || []
    const eggRecords = eggRecordsResult.data || []
    const weightRecords = weightRecordsResult.data || []
    const vaccinations = vaccinationsResult.data || []
    const healthIncidents = healthIncidentsResult.data || []
    const coopAssignments = coopAssignmentsResult.data || []

    // Sort photos with primary first
    const sortedPhotos = (bird.photos || []).sort((a: { is_primary: boolean }, b: { is_primary: boolean }) =>
      (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
    )

    // Calculate stats
    const stats = {
      totalEggs: eggRecords?.length || 0,
      totalOffspring: (offspringAsSire?.length || 0) + (offspringAsDam?.length || 0),
      ageInDays: Math.floor((Date.now() - new Date(bird.hatch_date).getTime()) / (1000 * 60 * 60 * 24)),
    }

    // Transform to camelCase for API response
    const transformedBird = {
      ...bird,
      hatchDate: bird.hatch_date,
      sireId: bird.sire_id,
      damId: bird.dam_id,
      coopId: bird.coop_id,
      combType: bird.comb_type,
      earlyLifeNotes: bird.early_life_notes,
      breedComposition: bird.breed_composition,
      breedOverride: bird.breed_override,
      createdAt: bird.created_at,
      updatedAt: bird.updated_at,
      createdBy: createdByUser,
      sire,
      dam,
      photos: sortedPhotos,
      notes: notes || [],
      offspringAsSire: offspringAsSire || [],
      offspringAsDam: offspringAsDam || [],
      eggRecords: eggRecords || [],
      weightRecords: weightRecords || [],
      vaccinations: vaccinations || [],
      healthIncidents: healthIncidents || [],
      coopAssignments: coopAssignments || [],
      stats,
    }

    return successResponse(transformedBird)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/birds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// PUT /api/birds/[id] - Update bird
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can edit birds", 403)
    }

    const body = await req.json()
    const data = updateBirdSchema.parse(body)

    // Validate parent references if provided
    if (data.sireId) {
      const { data: sire } = await supabase
        .from('birds')
        .select('id, sex')
        .eq('id', data.sireId)
        .single()
      if (!sire) return errorResponse("Father bird not found", 400)
      if (sire.sex !== "MALE") return errorResponse("Father must be male", 400)
      if (sire.id === id) return errorResponse("Bird cannot be its own parent", 400)
    }

    if (data.damId) {
      const { data: dam } = await supabase
        .from('birds')
        .select('id, sex')
        .eq('id', data.damId)
        .single()
      if (!dam) return errorResponse("Mother bird not found", 400)
      if (dam.sex !== "FEMALE") return errorResponse("Mother must be female", 400)
      if (dam.id === id) return errorResponse("Bird cannot be its own parent", 400)
    }

    // Check for coop change
    const { data: currentBird } = await supabase
      .from('birds')
      .select('coop_id')
      .eq('id', id)
      .single()
    const coopChanged = data.coopId !== undefined && data.coopId !== currentBird?.coop_id

    // Update bird
    const { data: updated, error: updateError } = await supabase
      .from('birds')
      .update({
        name: data.name,
        sex: data.sex,
        status: data.status,
        sire_id: data.sireId,
        dam_id: data.damId,
        coop_id: data.coopId,
        color: data.color,
        comb_type: data.combType,
        early_life_notes: data.earlyLifeNotes,
        breed_composition: data.breedComposition,
        breed_override: data.breedOverride,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return errorResponse("Failed to update bird", 500)
    }

    // Update coop assignment if changed
    if (coopChanged) {
      // Close previous assignment
      await supabase
        .from('coop_assignments')
        .update({ removed_at: new Date().toISOString() })
        .eq('bird_id', id)
        .is('removed_at', null)

      // Create new assignment if assigned to a coop
      if (data.coopId) {
        await supabase
          .from('coop_assignments')
          .insert({
            bird_id: id,
            coop_id: data.coopId,
            assigned_at: new Date().toISOString(),
          })
      }
    }

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error, "PUT /api/birds/[id]")
  }
}

// DELETE /api/birds/[id] - Delete bird (archive)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can delete birds", 403)
    }

    // Soft delete - change status to archived
    const { error } = await supabase
      .from('birds')
      .update({ status: "ARCHIVED" })
      .eq('id', id)

    if (error) {
      console.error("Delete error:", error)
      return errorResponse("Failed to archive bird", 500)
    }

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("DELETE /api/birds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
