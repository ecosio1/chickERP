import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createEggSchema = z.object({
  birdId: z.string().min(1, "Bird is required"),
  date: z.string().transform((str) => new Date(str)),
  eggMark: z.string().nullable().optional(),
  weightGrams: z.number().positive().nullable().optional(),
  shellQuality: z.enum(["GOOD", "FAIR", "POOR", "SOFT"]).nullable().optional(),
  notes: z.string().nullable().optional(),
})

// GET /api/eggs - List egg records
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

    const eggs = await prisma.eggRecord.findMany({
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
        incubation: true,
      },
      orderBy: { date: "desc" },
      take: limit,
    })

    return successResponse(eggs)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/eggs error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/eggs - Record new egg
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const data = createEggSchema.parse(body)

    // Verify bird exists and is female
    const bird = await prisma.bird.findUnique({ where: { id: data.birdId } })
    if (!bird) {
      return errorResponse("Bird not found", 404)
    }
    if (bird.sex !== "FEMALE") {
      return errorResponse("Only female birds can lay eggs", 400)
    }

    const egg = await prisma.eggRecord.create({
      data: {
        birdId: data.birdId,
        date: data.date,
        eggMark: data.eggMark,
        weightGrams: data.weightGrams,
        shellQuality: data.shellQuality,
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

    return successResponse(egg, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/eggs")
  }
}
