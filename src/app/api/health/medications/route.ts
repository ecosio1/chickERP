import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createMedicationSchema = z.object({
  birdIds: z.array(z.string()).min(1, "At least one bird is required"),
  healthIncidentId: z.string().nullable().optional(),
  medicationName: z.string().min(1, "Medication name is required"),
  dosage: z.string().nullable().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().nullable().optional().transform((str) => str ? new Date(str) : undefined),
  withdrawalDays: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(req.url)
    const birdId = searchParams.get("birdId")
    const healthIncidentId = searchParams.get("healthIncidentId")

    let query = supabase
      .from('medications')
      .select(`
        *,
        medication_birds (
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
        health_incident:health_incidents (
          id,
          diagnosis
        ),
        administered_by:profiles!medications_administered_by_fkey (
          id,
          name
        )
      `)
      .order('start_date', { ascending: false })

    if (healthIncidentId) {
      query = query.eq('health_incident_id', healthIncidentId)
    }

    const { data: medications, error } = await query

    if (error) {
      console.error("GET /api/health/medications error:", error)
      return errorResponse("Internal server error", 500)
    }

    // Filter by birdId if provided (need to do this after fetch due to nested relation)
    let filteredMedications = medications || []
    if (birdId) {
      filteredMedications = filteredMedications.filter((m: { medication_birds?: Array<{ bird_id: string }> }) =>
        m.medication_birds?.some((mb: { bird_id: string }) => mb.bird_id === birdId)
      )
    }

    // Transform to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformed = filteredMedications.map((m: any) => ({
      id: m.id,
      medicationName: m.medication_name,
      dosage: m.dosage,
      startDate: m.start_date,
      endDate: m.end_date,
      withdrawalDays: m.withdrawal_days,
      notes: m.notes,
      healthIncidentId: m.health_incident_id,
      administeredById: m.administered_by,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      birds: m.medication_birds?.map((mb: any) => ({
        birdId: mb.bird_id,
        bird: {
          id: mb.birds.id,
          name: mb.birds.name,
          identifiers: mb.birds.bird_identifiers?.map((bi: any) => ({
            idType: bi.id_type,
            idValue: bi.id_value,
          })) || [],
        },
      })) || [],
      healthIncident: m.health_incident ? {
        id: m.health_incident.id,
        diagnosis: m.health_incident.diagnosis,
      } : null,
      administeredBy: m.administered_by ? {
        id: m.administered_by.id,
        name: m.administered_by.name,
      } : null,
    }))

    return successResponse(transformed)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/health/medications error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()

    const body = await req.json()
    const data = createMedicationSchema.parse(body)

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

    // Create medication
    const { data: medication, error: medicationError } = await supabase
      .from('medications')
      .insert({
        health_incident_id: data.healthIncidentId || null,
        medication_name: data.medicationName,
        dosage: data.dosage || null,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate?.toISOString() || null,
        withdrawal_days: data.withdrawalDays ?? null,
        notes: data.notes || null,
        administered_by: session.user.id,
      })
      .select()
      .single()

    if (medicationError || !medication) {
      console.error("Error creating medication:", medicationError)
      return errorResponse("Internal server error", 500)
    }

    // Create medication_birds entries
    const medicationBirds = data.birdIds.map((birdId) => ({
      medication_id: medication.id,
      bird_id: birdId,
    }))

    const { error: medicationBirdsError } = await supabase
      .from('medication_birds')
      .insert(medicationBirds)

    if (medicationBirdsError) {
      console.error("Error creating medication_birds:", medicationBirdsError)
      return errorResponse("Internal server error", 500)
    }

    // Fetch the complete medication with relations
    const { data: completeMedication, error: fetchError } = await supabase
      .from('medications')
      .select(`
        *,
        medication_birds (
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
        health_incident:health_incidents (
          id,
          diagnosis
        ),
        administered_by:profiles!medications_administered_by_fkey (
          id,
          name
        )
      `)
      .eq('id', medication.id)
      .single()

    if (fetchError || !completeMedication) {
      console.error("Error fetching complete medication:", fetchError)
      return errorResponse("Internal server error", 500)
    }

    // Transform to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const med: any = completeMedication
    const transformed = {
      id: med.id,
      medicationName: med.medication_name,
      dosage: med.dosage,
      startDate: med.start_date,
      endDate: med.end_date,
      withdrawalDays: med.withdrawal_days,
      notes: med.notes,
      healthIncidentId: med.health_incident_id,
      administeredById: med.administered_by,
      createdAt: med.created_at,
      updatedAt: med.updated_at,
      birds: med.medication_birds?.map((mb: any) => ({
        birdId: mb.bird_id,
        bird: {
          id: mb.birds.id,
          name: mb.birds.name,
          identifiers: mb.birds.bird_identifiers?.map((bi: any) => ({
            idType: bi.id_type,
            idValue: bi.id_value,
          })) || [],
        },
      })) || [],
      healthIncident: med.health_incident ? {
        id: med.health_incident.id,
        diagnosis: med.health_incident.diagnosis,
      } : null,
      administeredBy: med.administered_by ? {
        id: med.administered_by.id,
        name: med.administered_by.name,
      } : null,
    }

    return successResponse(transformed, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/health/medications")
  }
}
