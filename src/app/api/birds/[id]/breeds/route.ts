import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"

// GET /api/birds/[id]/breeds - Get breed composition for a bird
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    const { data: bird, error } = await supabase
      .from('birds')
      .select('breed_composition')
      .eq('id', id)
      .single()

    if (error || !bird) {
      return errorResponse("Bird not found", 404)
    }

    return successResponse(bird.breed_composition || [])
  } catch (error) {
    console.error("Error fetching bird breeds:", error)
    return errorResponse("Failed to fetch bird breeds", 500)
  }
}
