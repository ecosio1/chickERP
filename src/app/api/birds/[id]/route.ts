import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const updateBirdSchema = z.object({
  name: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  status: z.enum(["ACTIVE", "SOLD", "DECEASED", "CULLED", "LOST", "BREEDING", "RETIRED", "ARCHIVED"]).optional(),
  sireId: z.string().nullable().optional(),
  damId: z.string().nullable().optional(),
  coopId: z.string().nullable().optional(),
  colorId: z.string().nullable().optional(),
  combType: z.enum(["SINGLE", "PEA", "ROSE", "WALNUT", "BUTTERCUP", "V_SHAPED", "CUSHION"]).nullable().optional(),
  earlyLifeNotes: z.string().nullable().optional(),
  breedComposition: z.array(z.object({
    breedId: z.string(),
    percentage: z.number().min(0).max(100),
  })).optional(),
  breedOverride: z.boolean().optional(),
})

// GET /api/birds/[id] - Get bird details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const bird = await prisma.bird.findUnique({
      where: { id },
      include: {
        identifiers: true,
        photos: { orderBy: { isPrimary: "desc" } },
        notes: {
          include: { createdBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        coop: true,
        color: true,
        sire: {
          select: {
            id: true,
            name: true,
            identifiers: true,
            breedComposition: true,
            sire: { select: { id: true, name: true, identifiers: true, breedComposition: true } },
            dam: { select: { id: true, name: true, identifiers: true, breedComposition: true } },
          },
        },
        dam: {
          select: {
            id: true,
            name: true,
            identifiers: true,
            breedComposition: true,
            sire: { select: { id: true, name: true, identifiers: true, breedComposition: true } },
            dam: { select: { id: true, name: true, identifiers: true, breedComposition: true } },
          },
        },
        offspringAsSire: {
          include: { identifiers: true },
          take: 50,
        },
        offspringAsDam: {
          include: { identifiers: true },
          take: 50,
        },
        eggRecords: {
          orderBy: { date: "desc" },
          take: 30,
          include: { incubation: true },
        },
        weightRecords: {
          orderBy: { date: "desc" },
          take: 20,
        },
        vaccinations: {
          include: { vaccination: true },
        },
        healthIncidents: {
          include: { incident: true },
        },
        coopAssignments: {
          include: { coop: true },
          orderBy: { assignedAt: "desc" },
          take: 10,
        },
        createdBy: { select: { id: true, name: true } },
        hatchedFromEgg: {
          include: {
            eggRecord: {
              include: { bird: { select: { id: true, name: true, identifiers: true } } },
            },
          },
        },
      },
    })

    if (!bird) {
      return errorResponse("Bird not found", 404)
    }

    // Calculate stats
    const stats = {
      totalEggs: bird.eggRecords.length,
      totalOffspring: bird.offspringAsSire.length + bird.offspringAsDam.length,
      ageInDays: Math.floor((Date.now() - new Date(bird.hatchDate).getTime()) / (1000 * 60 * 60 * 24)),
    }

    return successResponse({ ...bird, stats })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/birds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// PUT /api/birds/[id] - Update bird
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can edit birds", 403)
    }

    const body = await req.json()
    const data = updateBirdSchema.parse(body)

    // Validate parent references if provided
    if (data.sireId) {
      const sire = await prisma.bird.findUnique({ where: { id: data.sireId } })
      if (!sire) return errorResponse("Father bird not found", 400)
      if (sire.sex !== "MALE") return errorResponse("Father must be male", 400)
      if (sire.id === id) return errorResponse("Bird cannot be its own parent", 400)
    }

    if (data.damId) {
      const dam = await prisma.bird.findUnique({ where: { id: data.damId } })
      if (!dam) return errorResponse("Mother bird not found", 400)
      if (dam.sex !== "FEMALE") return errorResponse("Mother must be female", 400)
      if (dam.id === id) return errorResponse("Bird cannot be its own parent", 400)
    }

    // Check for coop change
    const currentBird = await prisma.bird.findUnique({ where: { id } })
    const coopChanged = data.coopId !== undefined && data.coopId !== currentBird?.coopId

    const bird = await prisma.$transaction(async (tx) => {
      const updated = await tx.bird.update({
        where: { id },
        data: {
          name: data.name,
          sex: data.sex,
          status: data.status,
          sireId: data.sireId,
          damId: data.damId,
          coopId: data.coopId,
          colorId: data.colorId,
          combType: data.combType,
          earlyLifeNotes: data.earlyLifeNotes,
          breedComposition: data.breedComposition,
          breedOverride: data.breedOverride,
        },
      })

      // Update coop assignment if changed
      if (coopChanged) {
        // Close previous assignment
        await tx.coopAssignment.updateMany({
          where: { birdId: id, removedAt: null },
          data: { removedAt: new Date() },
        })

        // Create new assignment if assigned to a coop
        if (data.coopId) {
          await tx.coopAssignment.create({
            data: {
              birdId: id,
              coopId: data.coopId,
              assignedAt: new Date(),
            },
          })
        }
      }

      return updated
    })

    return successResponse(bird)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("PUT /api/birds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/birds/[id] - Delete bird (archive)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can delete birds", 403)
    }

    // Soft delete - change status to archived
    await prisma.bird.update({
      where: { id },
      data: { status: "ARCHIVED" },
    })

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("DELETE /api/birds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
