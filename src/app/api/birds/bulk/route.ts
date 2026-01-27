import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const bulkActionSchema = z.object({
  action: z.enum(["move", "status", "delete"]),
  birdIds: z.array(z.string()).min(1),
  value: z.string().optional(),
})

// POST /api/birds/bulk - Perform bulk operations on birds
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()

    // Only OWNER can perform bulk operations
    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can perform bulk operations", 403)
    }

    const body = await req.json()
    const { action, birdIds, value } = bulkActionSchema.parse(body)

    let updated = 0

    switch (action) {
      case "move": {
        // Move birds to a coop (or remove from coop if value is empty)
        const coopId = value || null

        // Validate coop exists if provided
        if (coopId) {
          const { data: coop } = await supabase
            .from('coops')
            .select('id')
            .eq('id', coopId)
            .single()
          if (!coop) {
            return errorResponse("Coop not found", 400)
          }
        }

        // Close existing coop assignments
        await supabase
          .from('coop_assignments')
          .update({ removed_at: new Date().toISOString() })
          .in('bird_id', birdIds)
          .is('removed_at', null)

        // Update bird coop references
        const { data: updatedBirds, error: updateError } = await supabase
          .from('birds')
          .update({ coop_id: coopId })
          .in('id', birdIds)
          .select('id')

        if (updateError) {
          console.error("Bulk move error:", updateError)
          return errorResponse("Failed to move birds", 500)
        }

        updated = updatedBirds?.length || 0

        // Create new coop assignments if moving to a coop
        if (coopId && birdIds.length > 0) {
          await supabase
            .from('coop_assignments')
            .insert(birdIds.map((birdId) => ({
              bird_id: birdId,
              coop_id: coopId,
              assigned_at: new Date().toISOString(),
            })))
        }
        break
      }

      case "status": {
        // Change status of birds
        const status = value as "ACTIVE" | "SOLD" | "DECEASED" | "CULLED" | "LOST" | "BREEDING" | "RETIRED" | "ARCHIVED"

        if (!["ACTIVE", "SOLD", "DECEASED", "CULLED", "LOST", "BREEDING", "RETIRED", "ARCHIVED"].includes(status)) {
          return errorResponse("Invalid status", 400)
        }

        const { data: updatedBirds, error: updateError } = await supabase
          .from('birds')
          .update({ status })
          .in('id', birdIds)
          .select('id')

        if (updateError) {
          console.error("Bulk status error:", updateError)
          return errorResponse("Failed to update status", 500)
        }

        updated = updatedBirds?.length || 0
        break
      }

      case "delete": {
        // Soft delete by changing status to ARCHIVED
        const { data: updatedBirds, error: updateError } = await supabase
          .from('birds')
          .update({ status: "ARCHIVED" })
          .in('id', birdIds)
          .select('id')

        if (updateError) {
          console.error("Bulk delete error:", updateError)
          return errorResponse("Failed to archive birds", 500)
        }

        updated = updatedBirds?.length || 0
        break
      }

      default:
        return errorResponse("Invalid action", 400)
    }

    return successResponse({ success: true, updated, action })
  } catch (error) {
    return handleApiError(error, "POST /api/birds/bulk")
  }
}
