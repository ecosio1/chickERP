import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
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

    const { searchParams } = new URL(req.url)
    const birdId = searchParams.get("birdId")
    const upcoming = searchParams.get("upcoming")

    const whereClause: Record<string, unknown> = {}
    if (birdId) {
      whereClause.birds = {
        some: { birdId },
      }
    }
    if (upcoming === "true") {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      whereClause.nextDueDate = {
        gte: new Date(),
        lte: nextWeek,
      }
    }

    const vaccinations = await prisma.vaccination.findMany({
      where: whereClause,
      include: {
        birds: {
          include: {
            bird: {
              select: {
                id: true,
                name: true,
                identifiers: {
                  select: { idType: true, idValue: true },
                },
              },
            },
          },
        },
        administeredBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: upcoming === "true" ? { nextDueDate: "asc" } : { dateGiven: "desc" },
    })

    return successResponse(vaccinations)
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

    const body = await req.json()
    const data = createVaccinationSchema.parse(body)

    // Verify all birds exist
    const birds = await prisma.bird.findMany({
      where: { id: { in: data.birdIds } },
    })

    if (birds.length !== data.birdIds.length) {
      return errorResponse("One or more birds not found", 404)
    }

    const vaccination = await prisma.vaccination.create({
      data: {
        vaccineName: data.vaccineName,
        dateGiven: data.dateGiven,
        dosage: data.dosage,
        method: data.method,
        nextDueDate: data.nextDueDate,
        notes: data.notes,
        administeredById: session.user.id,
        birds: {
          create: data.birdIds.map((birdId) => ({
            birdId,
          })),
        },
      },
      include: {
        birds: {
          include: {
            bird: {
              select: {
                id: true,
                name: true,
                identifiers: {
                  select: { idType: true, idValue: true },
                },
              },
            },
          },
        },
        administeredBy: {
          select: { id: true, name: true },
        },
      },
    })

    return successResponse(vaccination, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/health/vaccinations")
  }
}
