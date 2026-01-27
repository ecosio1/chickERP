import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createConsumptionSchema = z.object({
  coopId: z.string().min(1, "Coop is required"),
  feedInventoryId: z.string().min(1, "Feed type is required"),
  date: z.string().transform((str) => new Date(str)),
  quantityKg: z.number().positive("Quantity must be positive"),
  notes: z.string().nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const supabase = await createClient()

    const { searchParams } = new URL(req.url)
    const coopId = searchParams.get("coopId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let query = supabase
      .from('feed_consumption')
      .select(`
        *,
        coop:coops(id, name),
        feed_inventory:feed_inventory(id, feed_type, brand),
        recorded_by:profiles!feed_consumption_recorded_by_fkey(id, name)
      `)
      .order('date', { ascending: false })
      .limit(100)

    if (coopId) {
      query = query.eq('coop_id', coopId)
    }

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data: consumptions, error } = await query

    if (error) {
      console.error("GET /api/feed/consumption error:", error)
      return errorResponse("Internal server error", 500)
    }

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

    const supabase = await createClient()

    const body = await req.json()
    const data = createConsumptionSchema.parse(body)

    // Check feed inventory exists and has sufficient quantity
    const { data: feedInventory, error: findError } = await supabase
      .from('feed_inventory')
      .select()
      .eq('id', data.feedInventoryId)
      .single()

    if (findError || !feedInventory) {
      return errorResponse("Feed not found", 404)
    }

    if (feedInventory.quantity_kg < data.quantityKg) {
      return errorResponse("Insufficient feed in inventory", 400)
    }

    // Create consumption record
    const { data: consumption, error: createError } = await supabase
      .from('feed_consumption')
      .insert({
        coop_id: data.coopId,
        feed_inventory_id: data.feedInventoryId,
        date: data.date.toISOString(),
        quantity_kg: data.quantityKg,
        notes: data.notes,
        recorded_by: session.user.id,
      })
      .select(`
        *,
        coop:coops(id, name),
        feed_inventory:feed_inventory(id, feed_type, brand),
        recorded_by:profiles!feed_consumption_recorded_by_fkey(id, name)
      `)
      .single()

    if (createError) {
      console.error("POST /api/feed/consumption create error:", createError)
      return errorResponse("Internal server error", 500)
    }

    // Update inventory quantity
    const { error: updateError } = await supabase
      .from('feed_inventory')
      .update({
        quantity_kg: feedInventory.quantity_kg - data.quantityKg,
      })
      .eq('id', data.feedInventoryId)

    if (updateError) {
      console.error("POST /api/feed/consumption update error:", updateError)
      // Note: consumption was created but inventory wasn't updated
      // In production, this should use a transaction or be handled differently
    }

    return successResponse(consumption, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/feed/consumption")
  }
}
