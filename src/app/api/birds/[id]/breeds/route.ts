import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"

// GET /api/birds/[id]/breeds - Get breed composition for a bird
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const bird = await prisma.bird.findUnique({
      where: { id },
      select: { breedComposition: true },
    })

    if (!bird) {
      return errorResponse("Bird not found", 404)
    }

    return successResponse(bird.breedComposition || [])
  } catch (error) {
    console.error("Error fetching bird breeds:", error)
    return errorResponse("Failed to fetch bird breeds", 500)
  }
}
