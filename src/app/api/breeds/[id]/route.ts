import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const updateBreedSchema = z.object({
  sourceFarmIds: z.array(z.string()),
})

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

    const breed = await prisma.breed.findUnique({
      where: { id },
      include: {
        sourceFarms: {
          include: {
            sourceFarm: true,
          },
        },
      },
    })
    if (!breed) {
      return errorResponse("Breed not found", 404)
    }

    // Transform to flatten sourceFarms
    const transformed = {
      ...breed,
      sourceFarms: breed.sourceFarms.map((sf) => sf.sourceFarm),
    }

    return successResponse(transformed)
  } catch (error) {
    console.error("GET /api/breeds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// PATCH /api/breeds/[id] - Update breed farm links
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can update breeds", 403)
    }

    const breed = await prisma.breed.findUnique({ where: { id } })
    if (!breed) {
      return errorResponse("Breed not found", 404)
    }

    const body = await req.json()
    const data = updateBreedSchema.parse(body)

    // Delete existing farm links and create new ones
    await prisma.$transaction([
      prisma.breedSourceFarm.deleteMany({
        where: { breedId: id },
      }),
      ...data.sourceFarmIds.map((farmId) =>
        prisma.breedSourceFarm.create({
          data: {
            breedId: id,
            sourceFarmId: farmId,
          },
        })
      ),
    ])

    // Fetch updated breed
    const updatedBreed = await prisma.breed.findUnique({
      where: { id },
      include: {
        sourceFarms: {
          include: {
            sourceFarm: true,
          },
        },
      },
    })

    const transformed = {
      ...updatedBreed,
      sourceFarms: updatedBreed?.sourceFarms.map((sf) => sf.sourceFarm) || [],
    }

    return successResponse(transformed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    console.error("PATCH /api/breeds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
