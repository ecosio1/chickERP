import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const updateFeedSchema = z.object({
  brand: z.string().optional(),
  quantityKg: z.number().nonnegative().optional(),
  unitCost: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const body = await req.json()
    const data = updateFeedSchema.parse(body)

    const feed = await prisma.feedInventory.update({
      where: { id },
      data,
    })

    return successResponse(feed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("PUT /api/feed/inventory/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    await prisma.feedInventory.delete({
      where: { id },
    })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("DELETE /api/feed/inventory/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
