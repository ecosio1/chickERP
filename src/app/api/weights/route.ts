import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const createWeightSchema = z.object({
  birdId: z.string().min(1, "Bird is required"),
  date: z.string().transform((str) => new Date(str)),
  weightGrams: z.number().positive("Weight must be positive"),
  milestone: z.enum([
    "HATCH", "WEEK_1", "WEEK_2", "WEEK_4", "WEEK_6",
    "WEEK_8", "WEEK_12", "WEEK_16", "WEEK_20", "ADULT", "OTHER"
  ]).optional(),
  notes: z.string().optional(),
})

// GET /api/weights - List weight records
export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(req.url)
    const birdId = searchParams.get("birdId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = parseInt(searchParams.get("limit") || "100")

    const where: Record<string, unknown> = {}

    if (birdId) {
      where.birdId = birdId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const weights = await prisma.weightRecord.findMany({
      where,
      include: {
        bird: {
          select: {
            id: true,
            name: true,
            identifiers: true,
          },
        },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      take: limit,
    })

    return successResponse(weights)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/weights error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/weights - Record new weight
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const data = createWeightSchema.parse(body)

    // Verify bird exists
    const bird = await prisma.bird.findUnique({ where: { id: data.birdId } })
    if (!bird) {
      return errorResponse("Bird not found", 404)
    }

    const weight = await prisma.weightRecord.create({
      data: {
        birdId: data.birdId,
        date: data.date,
        weightGrams: data.weightGrams,
        milestone: data.milestone,
        notes: data.notes,
        recordedById: session.user.id,
      },
      include: {
        bird: {
          select: { id: true, name: true, identifiers: true },
        },
        recordedBy: { select: { id: true, name: true } },
      },
    })

    return successResponse(weight, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/weights error:", error)
    return errorResponse("Internal server error", 500)
  }
}
