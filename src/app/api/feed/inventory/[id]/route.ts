import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
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

    const supabase = await createClient()

    const body = await req.json()
    const data = updateFeedSchema.parse(body)

    // Map camelCase to snake_case
    const updateData: Record<string, unknown> = {}
    if (data.brand !== undefined) updateData.brand = data.brand
    if (data.quantityKg !== undefined) updateData.quantity_kg = data.quantityKg
    if (data.unitCost !== undefined) updateData.cost_per_kg = data.unitCost
    if (data.reorderLevel !== undefined) updateData.reorder_level = data.reorderLevel

    const { data: feed, error } = await supabase
      .from('feed_inventory')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error("PUT /api/feed/inventory/[id] error:", error)
      return errorResponse("Internal server error", 500)
    }

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

    const supabase = await createClient()

    const { error } = await supabase
      .from('feed_inventory')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("DELETE /api/feed/inventory/[id] error:", error)
      return errorResponse("Internal server error", 500)
    }

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("DELETE /api/feed/inventory/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
