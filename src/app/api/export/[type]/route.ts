import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse } from "@/lib/api-utils"
import { generateCSV, createCSVResponse, formatDateForCSV, getBirdDisplayName, ExportType } from "@/lib/export-utils"
import { getColorById } from "@/lib/chicken-colors"
import type { Database } from "@/types/database.types"

type BirdStatus = Database["public"]["Enums"]["bird_status"]
type HealthOutcome = Database["public"]["Enums"]["health_outcome"]

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    await requireAuth()

    const exportType = params.type as ExportType
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const outcome = searchParams.get("outcome")

    switch (exportType) {
      case "birds":
        return await exportBirds(status)
      case "weights":
        return await exportWeights(startDate, endDate)
      case "eggs":
        return await exportEggs(startDate, endDate)
      case "vaccinations":
        return await exportVaccinations()
      case "health-incidents":
        return await exportHealthIncidents(outcome)
      case "fights":
        return await exportFights()
      default:
        return errorResponse("Invalid export type", 400)
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error(`GET /api/export/${params.type} error:`, error)
    return errorResponse("Internal server error", 500)
  }
}

async function exportBirds(status: string | null) {
  const supabase = await createClient()

  // First query for main bird data with coop and identifiers
  let query = supabase
    .from('birds')
    .select(`
      id,
      name,
      sex,
      hatch_date,
      status,
      color,
      comb_type,
      early_life_notes,
      sire_id,
      dam_id,
      coops:coop_id (name),
      bird_identifiers (id_type, id_value)
    `)
    .order('created_at', { ascending: false })

  if (status && status !== "all") {
    query = query.eq('status', status as BirdStatus)
  }

  const { data: birds, error } = await query

  if (error) {
    console.error("Export birds error:", error)
    return errorResponse("Failed to export birds", 500)
  }

  // Get all sire and dam IDs
  const parentIds = new Set<string>()
  ;(birds || []).forEach((bird) => {
    if (bird.sire_id) parentIds.add(bird.sire_id)
    if (bird.dam_id) parentIds.add(bird.dam_id)
  })

  // Fetch parent birds with their identifiers
  let parentsMap = new Map<string, { name: string | null; identifiers: { idType: string; idValue: string }[] }>()

  if (parentIds.size > 0) {
    const { data: parents } = await supabase
      .from('birds')
      .select(`
        id,
        name,
        bird_identifiers (id_type, id_value)
      `)
      .in('id', Array.from(parentIds))

    ;(parents || []).forEach((parent) => {
      parentsMap.set(parent.id, {
        name: parent.name,
        identifiers: (parent.bird_identifiers || []).map((id) => ({
          idType: id.id_type,
          idValue: id.id_value,
        })),
      })
    })
  }

  const headers = [
    "name",
    "sex",
    "hatch_date",
    "status",
    "color",
    "comb_type",
    "coop",
    "sire",
    "dam",
    "band_number",
    "early_life_notes",
  ]

  const rows = (birds || []).map((bird) => {
    const identifiers = bird.bird_identifiers || []
    const bandNumber = identifiers.find((id) =>
      id.id_type.toLowerCase().includes("band") || id.id_type === "LEG_NUMBER"
    )?.id_value || ""
    const colorInfo = bird.color ? getColorById(bird.color) : null

    // Get sire and dam from the map
    const sire = bird.sire_id ? parentsMap.get(bird.sire_id) ?? null : null
    const dam = bird.dam_id ? parentsMap.get(bird.dam_id) ?? null : null

    return [
      bird.name || "",
      bird.sex,
      formatDateForCSV(bird.hatch_date),
      bird.status,
      colorInfo?.name || "",
      bird.comb_type || "",
      (bird.coops as { name: string } | null)?.name || "",
      getBirdDisplayName(sire),
      getBirdDisplayName(dam),
      bandNumber,
      bird.early_life_notes || "",
    ]
  })

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `birds_export_${timestamp}`)
}

async function exportWeights(startDate: string | null, endDate: string | null) {
  const supabase = await createClient()

  let query = supabase
    .from('weight_records')
    .select(`
      id,
      bird_id,
      date,
      weight_grams,
      milestone,
      notes,
      birds:bird_id (
        id,
        name,
        bird_identifiers (id_type, id_value)
      )
    `)
    .order('date', { ascending: false })

  if (startDate && endDate) {
    query = query.gte('date', startDate).lte('date', endDate)
  }

  const { data: weights, error } = await query

  if (error) {
    console.error("Export weights error:", error)
    return errorResponse("Failed to export weights", 500)
  }

  const headers = ["bird_id", "bird_name", "date", "weight_grams", "milestone", "notes"]

  const rows = (weights || []).map((w) => {
    const bird = w.birds as { id: string; name: string | null; bird_identifiers: { id_type: string; id_value: string }[] } | null
    const birdForDisplay = bird ? {
      name: bird.name,
      identifiers: (bird.bird_identifiers || []).map((id) => ({
        idType: id.id_type,
        idValue: id.id_value,
      })),
    } : null

    return [
      w.bird_id,
      getBirdDisplayName(birdForDisplay),
      formatDateForCSV(w.date),
      w.weight_grams,
      w.milestone || "",
      w.notes || "",
    ]
  })

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `weight_records_${timestamp}`)
}

async function exportEggs(startDate: string | null, endDate: string | null) {
  const supabase = await createClient()

  let query = supabase
    .from('egg_records')
    .select(`
      id,
      bird_id,
      date,
      egg_mark,
      weight_grams,
      shell_quality,
      notes,
      birds:bird_id (
        id,
        name,
        bird_identifiers (id_type, id_value)
      )
    `)
    .order('date', { ascending: false })

  if (startDate && endDate) {
    query = query.gte('date', startDate).lte('date', endDate)
  }

  const { data: eggs, error } = await query

  if (error) {
    console.error("Export eggs error:", error)
    return errorResponse("Failed to export eggs", 500)
  }

  const headers = ["bird_id", "bird_name", "date", "egg_mark", "weight_grams", "shell_quality", "notes"]

  const rows = (eggs || []).map((e) => {
    const bird = e.birds as { id: string; name: string | null; bird_identifiers: { id_type: string; id_value: string }[] } | null
    const birdForDisplay = bird ? {
      name: bird.name,
      identifiers: (bird.bird_identifiers || []).map((id) => ({
        idType: id.id_type,
        idValue: id.id_value,
      })),
    } : null

    return [
      e.bird_id,
      getBirdDisplayName(birdForDisplay),
      formatDateForCSV(e.date),
      e.egg_mark || "",
      e.weight_grams || "",
      e.shell_quality || "",
      e.notes || "",
    ]
  })

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `egg_records_${timestamp}`)
}

async function exportVaccinations() {
  const supabase = await createClient()

  // Get vaccinations with their bird relationships
  const { data: vaccinations, error: vaccinationsError } = await supabase
    .from('vaccinations')
    .select(`
      id,
      vaccine_name,
      date_given,
      next_due_date,
      dosage,
      method,
      notes
    `)
    .order('date_given', { ascending: false })

  if (vaccinationsError) {
    console.error("Export vaccinations error:", vaccinationsError)
    return errorResponse("Failed to export vaccinations", 500)
  }

  // Get vaccination_birds junction table with bird details
  const { data: vaccinationBirds, error: junctionError } = await supabase
    .from('vaccination_birds')
    .select(`
      vaccination_id,
      bird_id,
      birds:bird_id (
        id,
        name,
        bird_identifiers (id_type, id_value)
      )
    `)

  if (junctionError) {
    console.error("Export vaccination birds error:", junctionError)
    return errorResponse("Failed to export vaccinations", 500)
  }

  const headers = ["bird_id", "bird_name", "vaccine_name", "date_given", "next_due_date", "dosage", "method", "notes"]

  // Flatten the many-to-many relationship - one row per bird per vaccination
  const rows: (string | number | null | undefined)[][] = []
  for (const v of (vaccinations || [])) {
    const birdsForVaccination = (vaccinationBirds || []).filter(vb => vb.vaccination_id === v.id)

    for (const birdVax of birdsForVaccination) {
      const bird = birdVax.birds as { id: string; name: string | null; bird_identifiers: { id_type: string; id_value: string }[] } | null
      const birdForDisplay = bird ? {
        name: bird.name,
        identifiers: (bird.bird_identifiers || []).map((id) => ({
          idType: id.id_type,
          idValue: id.id_value,
        })),
      } : null

      rows.push([
        birdVax.bird_id,
        getBirdDisplayName(birdForDisplay),
        v.vaccine_name,
        formatDateForCSV(v.date_given),
        formatDateForCSV(v.next_due_date),
        v.dosage || "",
        v.method || "",
        v.notes || "",
      ])
    }
  }

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `vaccinations_${timestamp}`)
}

async function exportHealthIncidents(outcome: string | null) {
  const supabase = await createClient()

  let query = supabase
    .from('health_incidents')
    .select(`
      id,
      date_noticed,
      symptoms,
      diagnosis,
      treatment,
      outcome,
      notes
    `)
    .order('date_noticed', { ascending: false })

  if (outcome && outcome !== "all") {
    query = query.eq('outcome', outcome as HealthOutcome)
  }

  const { data: incidents, error: incidentsError } = await query

  if (incidentsError) {
    console.error("Export health incidents error:", incidentsError)
    return errorResponse("Failed to export health incidents", 500)
  }

  // Get health_incident_birds junction table with bird details
  const { data: incidentBirds, error: junctionError } = await supabase
    .from('health_incident_birds')
    .select(`
      incident_id,
      bird_id,
      birds:bird_id (
        id,
        name,
        bird_identifiers (id_type, id_value)
      )
    `)

  if (junctionError) {
    console.error("Export health incident birds error:", junctionError)
    return errorResponse("Failed to export health incidents", 500)
  }

  const headers = ["bird_id", "bird_name", "date", "symptoms", "diagnosis", "treatment", "outcome", "notes"]

  // Flatten the many-to-many relationship - one row per bird per incident
  const rows: (string | number | null | undefined)[][] = []
  for (const i of (incidents || [])) {
    const birdsForIncident = (incidentBirds || []).filter(ib => ib.incident_id === i.id)

    for (const birdInc of birdsForIncident) {
      const bird = birdInc.birds as { id: string; name: string | null; bird_identifiers: { id_type: string; id_value: string }[] } | null
      const birdForDisplay = bird ? {
        name: bird.name,
        identifiers: (bird.bird_identifiers || []).map((id) => ({
          idType: id.id_type,
          idValue: id.id_value,
        })),
      } : null

      rows.push([
        birdInc.bird_id,
        getBirdDisplayName(birdForDisplay),
        formatDateForCSV(i.date_noticed),
        i.symptoms || "",
        i.diagnosis || "",
        i.treatment || "",
        i.outcome || "",
        i.notes || "",
      ])
    }
  }

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `health_incidents_${timestamp}`)
}

async function exportFights() {
  const supabase = await createClient()

  const { data: fights, error } = await supabase
    .from('fight_records')
    .select(`
      id,
      bird_id,
      date,
      outcome,
      location,
      notes,
      birds:bird_id (
        id,
        name,
        bird_identifiers (id_type, id_value)
      )
    `)
    .order('date', { ascending: false })

  if (error) {
    console.error("Export fights error:", error)
    return errorResponse("Failed to export fights", 500)
  }

  const headers = ["bird_id", "bird_name", "date", "outcome", "location", "notes"]

  const rows = (fights || []).map((f) => {
    const bird = f.birds as { id: string; name: string | null; bird_identifiers: { id_type: string; id_value: string }[] } | null
    const birdForDisplay = bird ? {
      name: bird.name,
      identifiers: (bird.bird_identifiers || []).map((id) => ({
        idType: id.id_type,
        idValue: id.id_value,
      })),
    } : null

    return [
      f.bird_id,
      getBirdDisplayName(birdForDisplay),
      formatDateForCSV(f.date),
      f.outcome,
      f.location || "",
      f.notes || "",
    ]
  })

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `fight_records_${timestamp}`)
}
