import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createCoopSchema = z.object({
  name: z.string().min(1, "Name is required"),
  capacity: z.number().int().positive("Capacity must be positive"),
  coopType: z.enum(["BREEDING_PEN", "GROW_OUT", "LAYER_HOUSE", "BROODER", "QUARANTINE"]),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
  notes: z.string().nullable().optional(),
})

export async function GET() {
  try {
    await requireAuth()

    const coops = await prisma.coop.findMany({
      include: {
        _count: {
          select: { birds: true },
        },
        birds: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            name: true,
            sex: true,
          },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    })

    const coopsWithOccupancy = coops.map((coop) => ({
      ...coop,
      currentOccupancy: coop._count.birds,
    }))

    return successResponse(coopsWithOccupancy)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/coops error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const body = await req.json()
    const data = createCoopSchema.parse(body)

    const coop = await prisma.coop.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        coopType: data.coopType,
        status: data.status || "ACTIVE",
        notes: data.notes,
      },
    })

    return successResponse(coop, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/coops")
  }
}
