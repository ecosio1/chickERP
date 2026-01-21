import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const createBreedSchema = z.object({
  name: z.string().min(1, "Breed name is required"),
  code: z.string().min(1, "Breed code is required").max(10),
  description: z.string().optional(),
  varieties: z.array(z.string()).optional(),
})

// GET /api/breeds - List all breeds
export async function GET() {
  try {
    await requireAuth()

    const breeds = await prisma.breed.findMany({
      orderBy: { name: "asc" },
    })

    return successResponse(breeds)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/breeds error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/breeds - Create new breed
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can manage breeds", 403)
    }

    const body = await req.json()
    const data = createBreedSchema.parse(body)

    // Check for duplicates
    const existing = await prisma.breed.findFirst({
      where: {
        OR: [
          { name: data.name },
          { code: data.code.toUpperCase() },
        ],
      },
    })

    if (existing) {
      return errorResponse("Breed with this name or code already exists", 400)
    }

    const breed = await prisma.breed.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        varieties: data.varieties || [],
      },
    })

    return successResponse(breed, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/breeds error:", error)
    return errorResponse("Internal server error", 500)
  }
}
