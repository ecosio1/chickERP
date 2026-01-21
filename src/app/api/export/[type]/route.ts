import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse } from "@/lib/api-utils"
import { generateCSV, createCSVResponse, formatDateForCSV, getBirdDisplayName, ExportType } from "@/lib/export-utils"

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
  const where: Record<string, unknown> = {}
  if (status && status !== "all") {
    where.status = status
  }

  const birds = await prisma.bird.findMany({
    where,
    include: {
      identifiers: true,
      coop: { select: { name: true } },
      color: { select: { name: true } },
      sire: { select: { name: true, identifiers: true } },
      dam: { select: { name: true, identifiers: true } },
    },
    orderBy: { createdAt: "desc" },
  })

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

  const rows = birds.map((bird) => {
    const bandNumber = bird.identifiers.find((id) => id.idType.toLowerCase().includes("band"))?.idValue || ""
    return [
      bird.name || "",
      bird.sex,
      formatDateForCSV(bird.hatchDate),
      bird.status,
      bird.color?.name || "",
      bird.combType || "",
      bird.coop?.name || "",
      getBirdDisplayName(bird.sire),
      getBirdDisplayName(bird.dam),
      bandNumber,
      bird.earlyLifeNotes || "",
    ]
  })

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `birds_export_${timestamp}`)
}

async function exportWeights(startDate: string | null, endDate: string | null) {
  const where: Record<string, unknown> = {}
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  }

  const weights = await prisma.weightRecord.findMany({
    where,
    include: {
      bird: {
        select: {
          id: true,
          name: true,
          identifiers: true,
        },
      },
    },
    orderBy: { date: "desc" },
  })

  const headers = ["bird_id", "bird_name", "date", "weight_grams", "milestone", "notes"]

  const rows = weights.map((w) => [
    w.birdId,
    getBirdDisplayName(w.bird),
    formatDateForCSV(w.date),
    w.weightGrams,
    w.milestone || "",
    w.notes || "",
  ])

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `weight_records_${timestamp}`)
}

async function exportEggs(startDate: string | null, endDate: string | null) {
  const where: Record<string, unknown> = {}
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    }
  }

  const eggs = await prisma.eggRecord.findMany({
    where,
    include: {
      bird: {
        select: {
          id: true,
          name: true,
          identifiers: true,
        },
      },
    },
    orderBy: { date: "desc" },
  })

  const headers = ["bird_id", "bird_name", "date", "egg_mark", "weight_grams", "shell_quality", "notes"]

  const rows = eggs.map((e) => [
    e.birdId,
    getBirdDisplayName(e.bird),
    formatDateForCSV(e.date),
    e.eggMark || "",
    e.weightGrams || "",
    e.shellQuality || "",
    e.notes || "",
  ])

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `egg_records_${timestamp}`)
}

async function exportVaccinations() {
  const vaccinations = await prisma.vaccination.findMany({
    include: {
      birds: {
        include: {
          bird: {
            select: {
              id: true,
              name: true,
              identifiers: true,
            },
          },
        },
      },
    },
    orderBy: { dateGiven: "desc" },
  })

  const headers = ["bird_id", "bird_name", "vaccine_name", "date_given", "next_due_date", "dosage", "method", "notes"]

  // Flatten the many-to-many relationship - one row per bird per vaccination
  const rows: (string | number | null | undefined)[][] = []
  for (const v of vaccinations) {
    for (const birdVax of v.birds) {
      rows.push([
        birdVax.bird.id,
        getBirdDisplayName(birdVax.bird),
        v.vaccineName,
        formatDateForCSV(v.dateGiven),
        formatDateForCSV(v.nextDueDate),
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
  const where: Record<string, unknown> = {}
  if (outcome && outcome !== "all") {
    where.outcome = outcome
  }

  const incidents = await prisma.healthIncident.findMany({
    where,
    include: {
      birds: {
        include: {
          bird: {
            select: {
              id: true,
              name: true,
              identifiers: true,
            },
          },
        },
      },
    },
    orderBy: { dateNoticed: "desc" },
  })

  const headers = ["bird_id", "bird_name", "date", "symptoms", "diagnosis", "treatment", "outcome", "notes"]

  // Flatten the many-to-many relationship - one row per bird per incident
  const rows: (string | number | null | undefined)[][] = []
  for (const i of incidents) {
    for (const birdInc of i.birds) {
      rows.push([
        birdInc.bird.id,
        getBirdDisplayName(birdInc.bird),
        formatDateForCSV(i.dateNoticed),
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
  const fights = await prisma.fightRecord.findMany({
    include: {
      bird: {
        select: {
          id: true,
          name: true,
          identifiers: true,
        },
      },
    },
    orderBy: { date: "desc" },
  })

  const headers = ["bird_id", "bird_name", "date", "outcome", "location", "notes"]

  const rows = fights.map((f) => [
    f.birdId,
    getBirdDisplayName(f.bird),
    formatDateForCSV(f.date),
    f.outcome,
    f.location || "",
    f.notes || "",
  ])

  const csv = generateCSV(headers, rows)
  const timestamp = new Date().toISOString().split("T")[0]
  return createCSVResponse(csv, `fight_records_${timestamp}`)
}
