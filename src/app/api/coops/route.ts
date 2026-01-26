import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
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
    const supabase = await createClient()

    // Get coops with birds
    const { data: coops, error } = await supabase
      .from('coops')
      .select(`
        *,
        birds(id, name, sex, status)
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error("GET /api/coops error:", error)
      return errorResponse("Failed to fetch coops", 500)
    }

    // Transform to add occupancy counts and filter birds
    const coopsWithOccupancy = (coops || []).map((coop) => {
      const activeBirds = coop.birds?.filter((b: { status: string }) => b.status === "ACTIVE") || []
      return {
        ...coop,
        _count: { birds: activeBirds.length },
        birds: activeBirds.slice(0, 5).map((b: { id: string; name: string | null; sex: string }) => ({
          id: b.id,
          name: b.name,
          sex: b.sex,
        })),
        currentOccupancy: activeBirds.length,
      }
    })

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
    const supabase = await createClient()

    const body = await req.json()
    const data = createCoopSchema.parse(body)

    const { data: coop, error } = await supabase
      .from('coops')
      .insert({
        name: data.name,
        capacity: data.capacity,
        coop_type: data.coopType,
        status: data.status || "ACTIVE",
        notes: data.notes,
      })
      .select()
      .single()

    if (error || !coop) {
      console.error("POST /api/coops error:", error)
      return errorResponse("Failed to create coop", 500)
    }

    return successResponse(coop, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/coops")
  }
}
