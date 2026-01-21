import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const createBirdSchema = z.object({
  name: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  hatchDate: z.string().transform((str) => new Date(str)),
  status: z.enum(["ACTIVE", "SOLD", "DECEASED", "CULLED", "LOST", "BREEDING", "RETIRED", "ARCHIVED"]).optional(),
  sireId: z.string().optional().nullable(),
  damId: z.string().optional().nullable(),
  coopId: z.string().optional().nullable(),
  colorId: z.string().optional().nullable(),
  combType: z.enum(["SINGLE", "PEA", "ROSE", "WALNUT", "BUTTERCUP", "V_SHAPED", "CUSHION"]).optional().nullable(),
  earlyLifeNotes: z.string().optional().nullable(),
  breedComposition: z.array(z.object({
    breedId: z.string(),
    percentage: z.number().min(0).max(100),
  })).optional(),
  identifiers: z.array(z.object({
    idType: z.string(),
    idValue: z.string(),
    notes: z.string().optional(),
  })).optional(),
})

// GET /api/birds - List birds with search and filters
export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const sex = searchParams.get("sex")
    const coopId = searchParams.get("coopId")
    const parentId = searchParams.get("parentId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build where clause
    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (sex) {
      where.sex = sex
    }

    if (coopId) {
      where.coopId = coopId
    }

    if (parentId) {
      where.OR = [
        { sireId: parentId },
        { damId: parentId },
      ]
    }

    // Search by name or any identifier
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { identifiers: { some: { idValue: { contains: search, mode: "insensitive" } } } },
      ]
    }

    const [birds, total] = await Promise.all([
      prisma.bird.findMany({
        where,
        include: {
          identifiers: true,
          coop: { select: { id: true, name: true } },
          color: { select: { id: true, name: true, nameTl: true, hexCode: true } },
          sire: { select: { id: true, name: true, identifiers: true } },
          dam: { select: { id: true, name: true, identifiers: true } },
          photos: { where: { isPrimary: true }, take: 1 },
          _count: {
            select: {
              eggRecords: true,
              offspringAsSire: true,
              offspringAsDam: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.bird.count({ where }),
    ])

    return successResponse({ birds, total, limit, offset })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/birds error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/birds - Create new bird
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    // Only OWNER can create birds
    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can add birds", 403)
    }

    const body = await req.json()
    const data = createBirdSchema.parse(body)

    // Validate parent references exist
    if (data.sireId) {
      const sire = await prisma.bird.findUnique({ where: { id: data.sireId } })
      if (!sire) return errorResponse("Father bird not found", 400)
      if (sire.sex !== "MALE") return errorResponse("Father must be male", 400)
    }

    if (data.damId) {
      const dam = await prisma.bird.findUnique({ where: { id: data.damId } })
      if (!dam) return errorResponse("Mother bird not found", 400)
      if (dam.sex !== "FEMALE") return errorResponse("Mother must be female", 400)
    }

    // Create bird with identifiers in transaction
    const bird = await prisma.$transaction(async (tx) => {
      const newBird = await tx.bird.create({
        data: {
          name: data.name,
          sex: data.sex,
          hatchDate: data.hatchDate,
          status: data.status || "ACTIVE",
          sireId: data.sireId,
          damId: data.damId,
          coopId: data.coopId,
          colorId: data.colorId,
          combType: data.combType,
          earlyLifeNotes: data.earlyLifeNotes,
          breedComposition: data.breedComposition || [],
          createdById: session.user.id,
        },
      })

      // Add identifiers if provided
      if (data.identifiers && data.identifiers.length > 0) {
        await tx.birdIdentifier.createMany({
          data: data.identifiers.map((id) => ({
            birdId: newBird.id,
            idType: id.idType,
            idValue: id.idValue,
            notes: id.notes,
          })),
        })
      }

      // Create coop assignment record if assigned
      if (data.coopId) {
        await tx.coopAssignment.create({
          data: {
            birdId: newBird.id,
            coopId: data.coopId,
            assignedAt: new Date(),
          },
        })
      }

      return newBird
    })

    // Fetch complete bird with relations
    const completeBird = await prisma.bird.findUnique({
      where: { id: bird.id },
      include: {
        identifiers: true,
        coop: { select: { id: true, name: true } },
        sire: { select: { id: true, name: true } },
        dam: { select: { id: true, name: true } },
      },
    })

    return successResponse(completeBird, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/birds error:", error)
    return errorResponse("Internal server error", 500)
  }
}
