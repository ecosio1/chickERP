import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createVaccinationSchema = z.object({
  birdIds: z.array(z.string()).min(1, "At least one bird is required"),
  vaccineName: z.string().min(1, "Vaccine name is required"),
  dateGiven: z.string().transform((str) => new Date(str)),
  dosage: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
  nextDueDate: z.string().nullable().optional().transform((str) => str ? new Date(str) : undefined),
  notes: z.string().nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(req.url)
    const birdId = searchParams.get("birdId")
    const upcoming = searchParams.get("upcoming")

    let query = supabase
      .from('vaccinations')
      .select(`
        *,
        vaccination_birds (
          bird_id,
          birds (
            id,
            name,
            bird_identifiers (
              id_type,
              id_value
            )
          )
        ),
        administered_by:profiles!vaccinations_administered_by_fkey (
          id,
          name
        )
      `)

    if (upcoming === "true") {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      query = query
        .gte('next_due_date', new Date().toISOString())
        .lte('next_due_date', nextWeek.toISOString())
        .order('next_due_date', { ascending: true })
    } else {
      query = query.order('date_given', { ascending: false })
    }

    const { data: vaccinations, error } = await query

    if (error) {
      console.error("GET /api/health/vaccinations error:", error)
      return errorResponse("Internal server error", 500)
    }

    // Filter by birdId if provided (need to do this after fetch due to nested relation)
    let filteredVaccinations = vaccinations || []
    if (birdId) {
      filteredVaccinations = filteredVaccinations.filter((v: { vaccination_birds?: Array<{ bird_id: string }> }) =>
        v.vaccination_birds?.some((vb: { bird_id: string }) => vb.bird_id === birdId)
      )
    }

    // Transform to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformed = filteredVaccinations.map((v: any) => ({
      id: v.id,
      vaccineName: v.vaccine_name,
      dateGiven: v.date_given,
      dosage: v.dosage,
      method: v.method,
      nextDueDate: v.next_due_date,
      notes: v.notes,
      administeredById: v.administered_by,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      birds: v.vaccination_birds?.map((vb: any) => ({
        birdId: vb.bird_id,
        bird: {
          id: vb.birds.id,
          name: vb.birds.name,
          identifiers: vb.birds.bird_identifiers?.map((bi: any) => ({
            idType: bi.id_type,
            idValue: bi.id_value,
          })) || [],
        },
      })) || [],
      administeredBy: v.administered_by ? {
        id: v.administered_by.id,
        name: v.administered_by.name,
      } : null,
    }))

    return successResponse(transformed)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/health/vaccinations error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()

    const body = await req.json()
    const data = createVaccinationSchema.parse(body)

    // Verify all birds exist
    const { data: birds, error: birdsError } = await supabase
      .from('birds')
      .select('id')
      .in('id', data.birdIds)

    if (birdsError) {
      console.error("Error fetching birds:", birdsError)
      return errorResponse("Internal server error", 500)
    }

    if (!birds || birds.length !== data.birdIds.length) {
      return errorResponse("One or more birds not found", 404)
    }

    // Create vaccination
    const { data: vaccination, error: vaccinationError } = await supabase
      .from('vaccinations')
      .insert({
        vaccine_name: data.vaccineName,
        date_given: data.dateGiven.toISOString(),
        dosage: data.dosage || null,
        method: data.method || null,
        next_due_date: data.nextDueDate?.toISOString() || null,
        notes: data.notes || null,
        administered_by: session.user.id,
      })
      .select()
      .single()

    if (vaccinationError || !vaccination) {
      console.error("Error creating vaccination:", vaccinationError)
      return errorResponse("Internal server error", 500)
    }

    // Create vaccination_birds entries
    const vaccinationBirds = data.birdIds.map((birdId) => ({
      vaccination_id: vaccination.id,
      bird_id: birdId,
    }))

    const { error: vaccinationBirdsError } = await supabase
      .from('vaccination_birds')
      .insert(vaccinationBirds)

    if (vaccinationBirdsError) {
      console.error("Error creating vaccination_birds:", vaccinationBirdsError)
      return errorResponse("Internal server error", 500)
    }

    // Fetch the complete vaccination with relations
    const { data: completeVaccination, error: fetchError } = await supabase
      .from('vaccinations')
      .select(`
        *,
        vaccination_birds (
          bird_id,
          birds (
            id,
            name,
            bird_identifiers (
              id_type,
              id_value
            )
          )
        ),
        administered_by:profiles!vaccinations_administered_by_fkey (
          id,
          name
        )
      `)
      .eq('id', vaccination.id)
      .single()

    if (fetchError || !completeVaccination) {
      console.error("Error fetching complete vaccination:", fetchError)
      return errorResponse("Internal server error", 500)
    }

    // Transform to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vacc: any = completeVaccination
    const transformed = {
      id: vacc.id,
      vaccineName: vacc.vaccine_name,
      dateGiven: vacc.date_given,
      dosage: vacc.dosage,
      method: vacc.method,
      nextDueDate: vacc.next_due_date,
      notes: vacc.notes,
      administeredById: vacc.administered_by,
      createdAt: vacc.created_at,
      updatedAt: vacc.updated_at,
      birds: vacc.vaccination_birds?.map((vb: any) => ({
        birdId: vb.bird_id,
        bird: {
          id: vb.birds.id,
          name: vb.birds.name,
          identifiers: vb.birds.bird_identifiers?.map((bi: any) => ({
            idType: bi.id_type,
            idValue: bi.id_value,
          })) || [],
        },
      })) || [],
      administeredBy: vacc.administered_by ? {
        id: vacc.administered_by.id,
        name: vacc.administered_by.name,
      } : null,
    }

    return successResponse(transformed, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/health/vaccinations")
  }
}
