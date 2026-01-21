import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const incubationSchema = z.object({
  setDate: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
})

const updateIncubationSchema = z.object({
  actualHatch: z.string().transform((str) => new Date(str)).optional(),
  outcome: z.enum(["PENDING", "HATCHED", "INFERTILE", "DEAD_IN_SHELL", "BROKEN"]).optional(),
  chickId: z.string().optional(),
  notes: z.string().optional(),
})

// POST /api/eggs/[id]/incubation - Start incubation for an egg
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: eggRecordId } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can manage incubation", 403)
    }

    const body = await req.json()
    const data = incubationSchema.parse(body)

    // Check if egg exists
    const egg = await prisma.eggRecord.findUnique({
      where: { id: eggRecordId },
      include: { incubation: true },
    })

    if (!egg) {
      return errorResponse("Egg record not found", 404)
    }

    if (egg.incubation) {
      return errorResponse("This egg is already in incubation", 400)
    }

    // Calculate expected hatch date (21 days for chickens)
    const expectedHatch = new Date(data.setDate)
    expectedHatch.setDate(expectedHatch.getDate() + 21)

    const incubation = await prisma.incubationRecord.create({
      data: {
        eggRecordId,
        setDate: data.setDate,
        expectedHatch,
        notes: data.notes,
      },
      include: {
        eggRecord: {
          include: { bird: { select: { id: true, name: true } } },
        },
      },
    })

    return successResponse(incubation, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/eggs/[id]/incubation error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// PUT /api/eggs/[id]/incubation - Update incubation outcome
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: eggRecordId } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can manage incubation", 403)
    }

    const body = await req.json()
    const data = updateIncubationSchema.parse(body)

    const incubation = await prisma.incubationRecord.findUnique({
      where: { eggRecordId },
    })

    if (!incubation) {
      return errorResponse("Incubation record not found", 404)
    }

    const updated = await prisma.incubationRecord.update({
      where: { id: incubation.id },
      data: {
        actualHatch: data.actualHatch,
        outcome: data.outcome,
        chickId: data.chickId,
        notes: data.notes,
      },
      include: {
        eggRecord: {
          include: { bird: { select: { id: true, name: true } } },
        },
        chick: { select: { id: true, name: true } },
      },
    })

    return successResponse(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("PUT /api/eggs/[id]/incubation error:", error)
    return errorResponse("Internal server error", 500)
  }
}
