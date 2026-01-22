import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"

// DELETE /api/breeds/[id] - Delete a breed
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can delete breeds", 403)
    }

    const breed = await prisma.breed.findUnique({ where: { id } })
    if (!breed) {
      return errorResponse("Breed not found", 404)
    }

    await prisma.breed.delete({ where: { id } })

    return successResponse({ message: "Breed deleted" })
  } catch (error) {
    console.error("DELETE /api/breeds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// GET /api/breeds/[id] - Get a single breed
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const breed = await prisma.breed.findUnique({ where: { id } })
    if (!breed) {
      return errorResponse("Breed not found", 404)
    }

    return successResponse(breed)
  } catch (error) {
    console.error("GET /api/breeds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
