import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
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
          const coop = await prisma.coop.findUnique({ where: { id: coopId } })
          if (!coop) {
            return errorResponse("Coop not found", 400)
          }
        }

        // Update birds in transaction
        await prisma.$transaction(async (tx) => {
          // Close existing coop assignments
          await tx.coopAssignment.updateMany({
            where: {
              birdId: { in: birdIds },
              removedAt: null,
            },
            data: {
              removedAt: new Date(),
            },
          })

          // Update bird coop references
          const result = await tx.bird.updateMany({
            where: { id: { in: birdIds } },
            data: { coopId },
          })
          updated = result.count

          // Create new coop assignments if moving to a coop
          if (coopId) {
            await tx.coopAssignment.createMany({
              data: birdIds.map((birdId) => ({
                birdId,
                coopId,
                assignedAt: new Date(),
              })),
            })
          }
        })
        break
      }

      case "status": {
        // Change status of birds
        const status = value as "ACTIVE" | "SOLD" | "DECEASED" | "CULLED" | "LOST" | "BREEDING" | "RETIRED" | "ARCHIVED"

        if (!["ACTIVE", "SOLD", "DECEASED", "CULLED", "LOST", "BREEDING", "RETIRED", "ARCHIVED"].includes(status)) {
          return errorResponse("Invalid status", 400)
        }

        const result = await prisma.bird.updateMany({
          where: { id: { in: birdIds } },
          data: { status },
        })
        updated = result.count
        break
      }

      case "delete": {
        // Soft delete by changing status to ARCHIVED
        const result = await prisma.bird.updateMany({
          where: { id: { in: birdIds } },
          data: { status: "ARCHIVED" },
        })
        updated = result.count
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
