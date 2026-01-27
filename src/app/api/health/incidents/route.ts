import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"
import type { Database } from "@/types/database.types"

type HealthOutcome = Database['public']['Enums']['health_outcome']

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const outcome = searchParams.get("outcome")

    let query = supabase
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
        medications (*)
      `)
      .order('date_noticed', { ascending: false })

    if (outcome) {
      query = query.eq('outcome', outcome as HealthOutcome)
    }

    const { data: incidents, error } = await query

    if (error) {
      console.error("GET /api/health/incidents error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // Transform to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformed = (incidents || []).map((i: any) => ({
      id: i.id,
      dateNoticed: i.date_noticed,
      symptoms: i.symptoms,
      diagnosis: i.diagnosis,
      treatment: i.treatment,
      outcome: i.outcome,
      notes: i.notes,
      reportedById: i.reported_by,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      birds: i.health_incident_birds?.map((hib: any) => ({
        birdId: hib.bird_id,
        bird: {
          id: hib.birds.id,
          name: hib.birds.name,
          identifiers: hib.birds.bird_identifiers?.map((bi: any) => ({
            idType: bi.id_type,
            idValue: bi.id_value,
          })) || [],
        },
      })) || [],
      reportedBy: i.reported_by ? {
        id: i.reported_by.id,
        name: i.reported_by.name,
      } : null,
      medications: i.medications?.map((m: any) => ({
        id: m.id,
        medicationName: m.medication_name,
        dosage: m.dosage,
        startDate: m.start_date,
        endDate: m.end_date,
        withdrawalDays: m.withdrawal_days,
        notes: m.notes,
      })) || [],
    }))

    return NextResponse.json({ incidents: transformed })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("GET /api/health/incidents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const body = await req.json()
    const { birdIds, dateNoticed, symptoms, diagnosis, treatment, outcome, notes } = body

    if (!birdIds || birdIds.length === 0) {
      return NextResponse.json({ error: "At least one bird is required" }, { status: 400 })
    }

    if (!symptoms) {
      return NextResponse.json({ error: "Symptoms are required" }, { status: 400 })
    }

    // Verify all birds exist
    const { data: birds, error: birdsError } = await supabase
      .from('birds')
      .select('id')
      .in('id', birdIds)

    if (birdsError) {
      console.error("Error fetching birds:", birdsError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!birds || birds.length !== birdIds.length) {
      return NextResponse.json({ error: "One or more birds not found" }, { status: 404 })
    }

    // Create health incident
    const { data: incident, error: incidentError } = await supabase
      .from('health_incidents')
      .insert({
        date_noticed: new Date(dateNoticed || new Date()).toISOString(),
        symptoms,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        outcome: outcome || "ONGOING",
        notes: notes || null,
        reported_by: session.user.id,
      })
      .select()
      .single()

    if (incidentError || !incident) {
      console.error("Error creating health incident:", incidentError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // Create health_incident_birds entries
    const incidentBirds = birdIds.map((birdId: string) => ({
      health_incident_id: incident.id,
      bird_id: birdId,
    }))

    const { error: incidentBirdsError } = await supabase
      .from('health_incident_birds')
      .insert(incidentBirds)

    if (incidentBirdsError) {
      console.error("Error creating health_incident_birds:", incidentBirdsError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // Fetch the complete incident with relations
    const { data: completeIncident, error: fetchError } = await supabase
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
        )
      `)
      .eq('id', incident.id)
      .single()

    if (fetchError || !completeIncident) {
      console.error("Error fetching complete incident:", fetchError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // Transform to match expected format
    const transformed = {
      id: completeIncident.id,
      dateNoticed: completeIncident.date_noticed,
      symptoms: completeIncident.symptoms,
      diagnosis: completeIncident.diagnosis,
      treatment: completeIncident.treatment,
      outcome: completeIncident.outcome,
      notes: completeIncident.notes,
      reportedById: completeIncident.reported_by,
      createdAt: completeIncident.created_at,
      updatedAt: completeIncident.updated_at,
      birds: completeIncident.health_incident_birds?.map((hib: {
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
    }

    return NextResponse.json(transformed, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("POST /api/health/incidents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
