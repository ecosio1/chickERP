import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const createFeedSchema = z.object({
  feedType: z.enum(["STARTER", "GROWER", "LAYER", "BREEDER", "FINISHER", "SUPPLEMENT"]),
  brand: z.string().optional(),
  quantityKg: z.number().positive("Quantity must be positive"),
  costPerKg: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
})

export async function GET() {
  try {
    await requireAuth()

    const inventory = await prisma.feedInventory.findMany({
      include: {
        _count: {
          select: { consumptions: true },
        },
      },
      orderBy: { feedType: "asc" },
    })

    const inventoryWithAlerts = inventory.map((item) => ({
      ...item,
      isLowStock: item.reorderLevel ? item.quantityKg <= item.reorderLevel : false,
    }))

    return successResponse(inventoryWithAlerts)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/feed/inventory error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const body = await req.json()
    const data = createFeedSchema.parse(body)

    const existingFeed = await prisma.feedInventory.findFirst({
      where: {
        feedType: data.feedType,
        brand: data.brand || null,
      },
    })

    if (existingFeed) {
      const updated = await prisma.feedInventory.update({
        where: { id: existingFeed.id },
        data: {
          quantityKg: existingFeed.quantityKg + data.quantityKg,
          costPerKg: data.costPerKg ?? existingFeed.costPerKg,
          reorderLevel: data.reorderLevel ?? existingFeed.reorderLevel,
        },
      })
      return successResponse(updated)
    }

    const feed = await prisma.feedInventory.create({
      data: {
        feedType: data.feedType,
        brand: data.brand,
        quantityKg: data.quantityKg,
        costPerKg: data.costPerKg,
        reorderLevel: data.reorderLevel,
      },
    })

    return successResponse(feed, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/feed/inventory error:", error)
    return errorResponse("Internal server error", 500)
  }
}
