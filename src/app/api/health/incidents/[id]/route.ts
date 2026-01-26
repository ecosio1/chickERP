import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const updateIncidentSchema = z.object({
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  outcome: z.enum(["RECOVERED", "ONGOING", "DECEASED"]).optional(),
  notes: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const { data: incident, error } = await supabase
      .from('health_incidents')
      .select(`
        *,
        health_incident_birds (
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
        reported_by:profiles!health_incidents_reported_by_fkey (
          id,
          name
        ),
        medications (
          *,
          administered_by:profiles!medications_administered_by_fkey (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse("Health incident not found", 404)
      }
      console.error("GET /api/health/incidents/[id] error:", error)
      return errorResponse("Internal server error", 500)
    }

    if (!incident) {
      return errorResponse("Health incident not found", 404)
    }

    // Transform to match expected format
    const transformed = {
      id: incident.id,
      dateNoticed: incident.date_noticed,
      symptoms: incident.symptoms,
      diagnosis: incident.diagnosis,
      treatment: incident.treatment,
      outcome: incident.outcome,
      notes: incident.notes,
      reportedById: incident.reported_by,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at,
      birds: incident.health_incident_birds?.map((hib: {
        bird_id: string
        birds: {
          id: string
          name: string | null
          bird_identifiers: Array<{ id_type: string; id_value: string }>
        }
      }) => ({
        birdId: hib.bird_id,
        bird: {
          id: hib.birds.id,
          name: hib.birds.name,
          identifiers: hib.birds.bird_identifiers?.map((bi: { id_type: string; id_value: string }) => ({
            idType: bi.id_type,
            idValue: bi.id_value,
          })) || [],
        },
      })) || [],
      reportedBy: incident.reported_by ? {
        id: incident.reported_by.id,
        name: incident.reported_by.name,
      } : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      medications: incident.medications?.map((m: any) => ({
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
        administeredBy: m.administered_by ? {
          id: m.administered_by.id,
          name: m.administered_by.name,
        } : null,
      })).sort((a: { startDate: string }, b: { startDate: string }) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      ) || [],
    }

    return successResponse(transformed)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/health/incidents/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const body = await req.json()
    const data = updateIncidentSchema.parse(body)

    // Build update object with snake_case keys
    const updateData: Record<string, unknown> = {}
    if (data.symptoms !== undefined) updateData.symptoms = data.symptoms
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis
    if (data.treatment !== undefined) updateData.treatment = data.treatment
    if (data.outcome !== undefined) updateData.outcome = data.outcome
    if (data.notes !== undefined) updateData.notes = data.notes

    const { data: incident, error } = await supabase
      .from('health_incidents')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        health_incident_birds (
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
        reported_by:profiles!health_incidents_reported_by_fkey (
          id,
          name
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse("Health incident not found", 404)
      }
      console.error("PUT /api/health/incidents/[id] error:", error)
      return errorResponse("Internal server error", 500)
    }

    if (!incident) {
      return errorResponse("Health incident not found", 404)
    }

    // Transform to match expected format
    const transformed = {
      id: incident.id,
      dateNoticed: incident.date_noticed,
      symptoms: incident.symptoms,
      diagnosis: incident.diagnosis,
      treatment: incident.treatment,
      outcome: incident.outcome,
      notes: incident.notes,
      reportedById: incident.reported_by,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at,
      birds: incident.health_incident_birds?.map((hib: {
        bird_id: string
        birds: {
          id: string
          name: string | null
          bird_identifiers: Array<{ id_type: string; id_value: string }>
        }
      }) => ({
        birdId: hib.bird_id,
        bird: {
          id: hib.birds.id,
          name: hib.birds.name,
          identifiers: hib.birds.bird_identifiers?.map((bi: { id_type: string; id_value: string }) => ({
            idType: bi.id_type,
            idValue: bi.id_value,
          })) || [],
        },
      })) || [],
      reportedBy: incident.reported_by ? {
        id: incident.reported_by.id,
        name: incident.reported_by.name,
      } : null,
    }

    return successResponse(transformed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("PUT /api/health/incidents/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
