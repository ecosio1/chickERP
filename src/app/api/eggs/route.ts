import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createEggSchema = z.object({
  birdId: z.string().min(1, "Bird is required"),
  date: z.string().transform((str) => new Date(str)),
  eggMark: z.string().nullable().optional(),
  weightGrams: z.number().positive().nullable().optional(),
  shellQuality: z.enum(["GOOD", "FAIR", "POOR", "SOFT"]).nullable().optional(),
  notes: z.string().nullable().optional(),
})

// GET /api/eggs - List egg records
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
      .from('egg_records')
      .select(`
        *,
        bird:birds(id, name, identifiers:bird_identifiers(*)),
        recorded_by:profiles(id, name),
        incubation:incubation_records(*)
      `)
      .order('date', { ascending: false })
      .limit(limit)

    if (birdId) {
      query = query.eq('bird_id', birdId)
    }

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data: eggs, error } = await query

    if (error) {
      console.error("GET /api/eggs error:", error)
      return errorResponse("Failed to fetch eggs", 500)
    }

    return successResponse(eggs || [])
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/eggs error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/eggs - Record new egg
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()

    const body = await req.json()
    const data = createEggSchema.parse(body)

    // Verify bird exists and is female
    const { data: bird, error: birdError } = await supabase
      .from('birds')
      .select('id, sex')
      .eq('id', data.birdId)
      .single()

    if (birdError || !bird) {
      return errorResponse("Bird not found", 404)
    }
    if (bird.sex !== "FEMALE") {
      return errorResponse("Only female birds can lay eggs", 400)
    }

    const { data: egg, error: eggError } = await supabase
      .from('egg_records')
      .insert({
        bird_id: data.birdId,
        date: data.date.toISOString(),
        egg_mark: data.eggMark,
        weight_grams: data.weightGrams,
        shell_quality: data.shellQuality,
        notes: data.notes,
        recorded_by: session.user.id,
      })
      .select(`
        *,
        bird:birds(id, name, identifiers:bird_identifiers(*)),
        recorded_by:profiles(id, name)
      `)
      .single()

    if (eggError || !egg) {
      console.error("POST /api/eggs error:", eggError)
      return errorResponse("Failed to create egg record", 500)
    }

    return successResponse(egg, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/eggs")
  }
}
