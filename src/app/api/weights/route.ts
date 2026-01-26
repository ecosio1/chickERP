import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createWeightSchema = z.object({
  birdId: z.string().min(1, "Bird is required"),
  date: z.string().transform((str) => new Date(str)),
  weightGrams: z.number().positive("Weight must be positive"),
  milestone: z.enum([
    "HATCH", "WEEK_1", "WEEK_2", "WEEK_4", "WEEK_6",
    "WEEK_8", "WEEK_12", "WEEK_16", "WEEK_20", "ADULT", "OTHER"
  ]).nullable().optional(),
  notes: z.string().nullable().optional(),
})

// GET /api/weights - List weight records
export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const supabase = await createClient()

    const { searchParams } = new URL(req.url)
    const birdId = searchParams.get("birdId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = parseInt(searchParams.get("limit") || "100")

    let query = supabase
      .from('weight_records')
      .select(`
        *,
        bird:birds(id, name, identifiers),
        recorded_by:profiles!weight_records_recorded_by_fkey(id, name)
      `)
      .order('date', { ascending: false })
      .limit(limit)

    if (birdId) {
      query = query.eq('bird_id', birdId)
    }

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data: weights, error } = await query

    if (error) {
      console.error("GET /api/weights error:", error)
      return errorResponse("Internal server error", 500)
    }

    return successResponse(weights)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/weights error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/weights - Record new weight
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const supabase = await createClient()

    const body = await req.json()
    const data = createWeightSchema.parse(body)

    // Verify bird exists
    const { data: bird, error: findError } = await supabase
      .from('birds')
      .select('id')
      .eq('id', data.birdId)
      .single()

    if (findError || !bird) {
      return errorResponse("Bird not found", 404)
    }

    const { data: weight, error: createError } = await supabase
      .from('weight_records')
      .insert({
        bird_id: data.birdId,
        date: data.date.toISOString(),
        weight_grams: data.weightGrams,
        milestone: data.milestone,
        notes: data.notes,
        recorded_by: session.user.id,
      })
      .select(`
        *,
        bird:birds(id, name, identifiers),
        recorded_by:profiles!weight_records_recorded_by_fkey(id, name)
      `)
      .single()

    if (createError) {
      console.error("POST /api/weights create error:", createError)
      return errorResponse("Internal server error", 500)
    }

    return successResponse(weight, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/weights")
  }
}
