import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const identifierSchema = z.object({
  idType: z.string().min(1, "ID type is required"),
  idValue: z.string().min(1, "ID value is required"),
  notes: z.string().optional(),
})

// POST /api/birds/[id]/identifiers - Add identifier to bird
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: birdId } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can add identifiers", 403)
    }

    const body = await req.json()
    const data = identifierSchema.parse(body)

    // Check if bird exists
    const bird = await prisma.bird.findUnique({ where: { id: birdId } })
    if (!bird) {
      return errorResponse("Bird not found", 404)
    }

    // Check if this ID type already exists for this bird
    const existing = await prisma.birdIdentifier.findUnique({
      where: { birdId_idType: { birdId, idType: data.idType } },
    })

    if (existing) {
      // Update existing
      const updated = await prisma.birdIdentifier.update({
        where: { id: existing.id },
        data: { idValue: data.idValue, notes: data.notes },
      })
      return successResponse(updated)
    }

    // Create new
    const identifier = await prisma.birdIdentifier.create({
      data: {
        birdId,
        idType: data.idType,
        idValue: data.idValue,
        notes: data.notes,
      },
    })

    return successResponse(identifier, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/birds/[id]/identifiers error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/birds/[id]/identifiers - Remove identifier
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: birdId } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can remove identifiers", 403)
    }

    const { searchParams } = new URL(req.url)
    const idType = searchParams.get("idType")

    if (!idType) {
      return errorResponse("ID type is required", 400)
    }

    await prisma.birdIdentifier.delete({
      where: { birdId_idType: { birdId, idType } },
    })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("DELETE /api/birds/[id]/identifiers error:", error)
    return errorResponse("Internal server error", 500)
  }
}
