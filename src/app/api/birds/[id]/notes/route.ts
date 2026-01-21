import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
})

// GET /api/birds/[id]/notes - Get notes for bird
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id: birdId } = await params

    const notes = await prisma.birdNote.findMany({
      where: { birdId },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return successResponse(notes)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/birds/[id]/notes error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/birds/[id]/notes - Add note to bird
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: birdId } = await params

    const body = await req.json()
    const data = noteSchema.parse(body)

    // Check if bird exists
    const bird = await prisma.bird.findUnique({ where: { id: birdId } })
    if (!bird) {
      return errorResponse("Bird not found", 404)
    }

    const note = await prisma.birdNote.create({
      data: {
        birdId,
        content: data.content,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    })

    return successResponse(note, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/birds/[id]/notes error:", error)
    return errorResponse("Internal server error", 500)
  }
}
