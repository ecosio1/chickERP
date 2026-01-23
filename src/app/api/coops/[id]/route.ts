import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const updateCoopSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  coopType: z.enum(["BREEDING_PEN", "GROW_OUT", "LAYER_HOUSE", "BROODER", "QUARANTINE"]).optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
  notes: z.string().nullable().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const coop = await prisma.coop.findUnique({
      where: { id },
      include: {
        birds: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            name: true,
            sex: true,
            status: true,
          },
        },
        _count: {
          select: {
            birds: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    })

    if (!coop) {
      return errorResponse("Coop not found", 404)
    }

    return successResponse({
      ...coop,
      currentOccupancy: coop._count.birds,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/coops/[id] error:", error)
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
    const data = updateCoopSchema.parse(body)

    const coop = await prisma.coop.update({
      where: { id },
      data,
    })

    return successResponse(coop)
  } catch (error) {
    return handleApiError(error, "PUT /api/coops/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const activeBirds = await prisma.bird.count({
      where: { coopId: id, status: "ACTIVE" },
    })

    if (activeBirds > 0) {
      return errorResponse("Cannot delete coop with active birds", 400)
    }

    await prisma.coop.delete({
      where: { id },
    })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("DELETE /api/coops/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
