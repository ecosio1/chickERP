import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
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
    const { id } = await params

    const incident = await prisma.healthIncident.findUnique({
      where: { id },
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
        reportedBy: {
          select: { id: true, name: true },
        },
        medications: {
          include: {
            administeredBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { startDate: "desc" },
        },
      },
    })

    if (!incident) {
      return errorResponse("Health incident not found", 404)
    }

    return successResponse(incident)
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
    const { id } = await params

    const body = await req.json()
    const data = updateIncidentSchema.parse(body)

    const incident = await prisma.healthIncident.update({
      where: { id },
      data,
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
        reportedBy: {
          select: { id: true, name: true },
        },
      },
    })

    return successResponse(incident)
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
