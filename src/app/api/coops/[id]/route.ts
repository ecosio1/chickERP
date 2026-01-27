import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const updateCoopSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  coopType: z.enum(["BREEDING_PEN", "GROW_OUT", "LAYER_HOUSE", "BROODER", "QUARANTINE"]).optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
  notes: z.string().nullable().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const { data: coop, error } = await supabase
      .from('coops')
      .select(`
        *,
        birds(id, name, sex, status)
      `)
      .eq('id', id)
      .single()

    if (error || !coop) {
      return errorResponse("Coop not found", 404)
    }

    // Filter to active birds only
    const activeBirds = coop.birds?.filter((b: { status: string }) => b.status === "ACTIVE") || []

    return successResponse({
      ...coop,
      birds: activeBirds.map((b: { id: string; name: string | null; sex: string; status: string }) => ({
        id: b.id,
        name: b.name,
        sex: b.sex,
        status: b.status,
      })),
      _count: { birds: activeBirds.length },
      currentOccupancy: activeBirds.length,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/coops/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const body = await req.json()
    const data = updateCoopSchema.parse(body)

    // Build update object with snake_case keys
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.capacity !== undefined) updateData.capacity = data.capacity
    if (data.coopType !== undefined) updateData.coop_type = data.coopType
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    const { data: coop, error } = await supabase
      .from('coops')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !coop) {
      console.error("PUT /api/coops/[id] error:", error)
      return errorResponse("Failed to update coop", 500)
    }

    return successResponse(coop)
  } catch (error) {
    return handleApiError(error, "PUT /api/coops/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    // Check for active birds in coop
    const { data: birds, error: birdsError } = await supabase
      .from('birds')
      .select('id')
      .eq('coop_id', id)
      .eq('status', 'ACTIVE')

    if (birdsError) {
      console.error("DELETE /api/coops/[id] error:", birdsError)
      return errorResponse("Failed to check coop birds", 500)
    }

    if (birds && birds.length > 0) {
      return errorResponse("Cannot delete coop with active birds", 400)
    }

    const { error: deleteError } = await supabase
      .from('coops')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error("DELETE /api/coops/[id] error:", deleteError)
      return errorResponse("Failed to delete coop", 500)
    }

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("DELETE /api/coops/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
