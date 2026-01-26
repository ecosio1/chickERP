import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createFeedSchema = z.object({
  feedType: z.enum(["STARTER", "GROWER", "LAYER", "BREEDER", "FINISHER", "SUPPLEMENT"]),
  brand: z.string().nullable().optional(),
  quantityKg: z.number().positive("Quantity must be positive"),
  costPerKg: z.number().nonnegative().nullable().optional(),
  reorderLevel: z.number().nonnegative().nullable().optional(),
})

export async function GET() {
  try {
    await requireAuth()

    const supabase = await createClient()

    const { data: inventory, error } = await supabase
      .from('feed_inventory')
      .select('*, feed_consumption(count)')
      .order('feed_type', { ascending: true })

    if (error) {
      console.error("GET /api/feed/inventory error:", error)
      return errorResponse("Internal server error", 500)
    }

    const inventoryWithAlerts = (inventory || []).map((item) => ({
      ...item,
      isLowStock: item.reorder_level ? item.quantity_kg <= item.reorder_level : false,
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

    const supabase = await createClient()

    const body = await req.json()
    const data = createFeedSchema.parse(body)

    // Check for existing feed with same type and brand
    let findQuery = supabase
      .from('feed_inventory')
      .select()
      .eq('feed_type', data.feedType)

    if (data.brand) {
      findQuery = findQuery.eq('brand', data.brand)
    } else {
      findQuery = findQuery.is('brand', null)
    }

    const { data: existingFeed, error: findError } = await findQuery.maybeSingle()

    if (findError) {
      console.error("POST /api/feed/inventory find error:", findError)
      return errorResponse("Internal server error", 500)
    }

    if (existingFeed) {
      const { data: updated, error: updateError } = await supabase
        .from('feed_inventory')
        .update({
          quantity_kg: existingFeed.quantity_kg + data.quantityKg,
          cost_per_kg: data.costPerKg ?? existingFeed.cost_per_kg,
          reorder_level: data.reorderLevel ?? existingFeed.reorder_level,
        })
        .eq('id', existingFeed.id)
        .select()
        .single()

      if (updateError) {
        console.error("POST /api/feed/inventory update error:", updateError)
        return errorResponse("Internal server error", 500)
      }

      return successResponse(updated)
    }

    const { data: feed, error: createError } = await supabase
      .from('feed_inventory')
      .insert({
        feed_type: data.feedType,
        brand: data.brand,
        quantity_kg: data.quantityKg,
        cost_per_kg: data.costPerKg,
        reorder_level: data.reorderLevel,
      })
      .select()
      .single()

    if (createError) {
      console.error("POST /api/feed/inventory create error:", createError)
      return errorResponse("Internal server error", 500)
    }

    return successResponse(feed, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/feed/inventory")
  }
}
