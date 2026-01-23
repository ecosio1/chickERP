import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
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

    const { searchParams } = new URL(req.url)
    const birdId = searchParams.get("birdId")
    const healthIncidentId = searchParams.get("healthIncidentId")

    const medications = await prisma.medication.findMany({
      where: {
        ...(birdId && {
          birds: {
            some: { birdId },
          },
        }),
        ...(healthIncidentId && { healthIncidentId }),
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
        healthIncident: {
          select: { id: true, diagnosis: true },
        },
        administeredBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startDate: "desc" },
    })

    return successResponse(medications)
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

    const body = await req.json()
    const data = createMedicationSchema.parse(body)

    // Verify all birds exist
    const birds = await prisma.bird.findMany({
      where: { id: { in: data.birdIds } },
    })

    if (birds.length !== data.birdIds.length) {
      return errorResponse("One or more birds not found", 404)
    }

    const medication = await prisma.medication.create({
      data: {
        healthIncidentId: data.healthIncidentId,
        medicationName: data.medicationName,
        dosage: data.dosage,
        startDate: data.startDate,
        endDate: data.endDate,
        withdrawalDays: data.withdrawalDays,
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
        healthIncident: {
          select: { id: true, diagnosis: true },
        },
        administeredBy: {
          select: { id: true, name: true },
        },
      },
    })

    return successResponse(medication, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/health/medications")
  }
}
