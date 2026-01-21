import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const createConsumptionSchema = z.object({
  coopId: z.string().min(1, "Coop is required"),
  feedInventoryId: z.string().min(1, "Feed type is required"),
  date: z.string().transform((str) => new Date(str)),
  quantityKg: z.number().positive("Quantity must be positive"),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(req.url)
    const coopId = searchParams.get("coopId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const consumptions = await prisma.feedConsumption.findMany({
      where: {
        ...(coopId && { coopId }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        coop: {
          select: { id: true, name: true },
        },
        feedInventory: {
          select: { id: true, feedType: true, brand: true },
        },
        recordedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "desc" },
      take: 100,
    })

    return successResponse(consumptions)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/feed/consumption error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const data = createConsumptionSchema.parse(body)

    const feedInventory = await prisma.feedInventory.findUnique({
      where: { id: data.feedInventoryId },
    })

    if (!feedInventory) {
      return errorResponse("Feed not found", 404)
    }

    if (feedInventory.quantityKg < data.quantityKg) {
      return errorResponse("Insufficient feed in inventory", 400)
    }

    const [consumption] = await prisma.$transaction([
      prisma.feedConsumption.create({
        data: {
          coopId: data.coopId,
          feedInventoryId: data.feedInventoryId,
          date: data.date,
          quantityKg: data.quantityKg,
          notes: data.notes,
          recordedById: session.user.id,
        },
        include: {
          coop: {
            select: { id: true, name: true },
          },
          feedInventory: {
            select: { id: true, feedType: true, brand: true },
          },
          recordedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.feedInventory.update({
        where: { id: data.feedInventoryId },
        data: {
          quantityKg: feedInventory.quantityKg - data.quantityKg,
        },
      }),
    ])

    return successResponse(consumption, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/feed/consumption error:", error)
    return errorResponse("Internal server error", 500)
  }
}
