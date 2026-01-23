import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createBirdSchema = z.object({
  name: z.string().nullable().optional(),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  hatchDate: z.string().transform((str) => new Date(str)),
  status: z.enum(["ACTIVE", "SOLD", "DECEASED", "CULLED", "LOST", "BREEDING", "RETIRED", "ARCHIVED"]).optional(),
  sireId: z.string().nullable().optional(),
  damId: z.string().nullable().optional(),
  coopId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  combType: z.enum(["SINGLE", "PEA", "ROSE", "WALNUT", "BUTTERCUP", "V_SHAPED", "CUSHION"]).nullable().optional(),
  earlyLifeNotes: z.string().nullable().optional(),
  breedComposition: z.array(z.object({
    breedId: z.string(),
    percentage: z.number().min(0).max(100),
  })).nullable().optional(),
  breedOverride: z.boolean().optional(),
  identifiers: z.array(z.object({
    idType: z.string(),
    idValue: z.string(),
    notes: z.string().nullable().optional(),
  })).nullable().optional(),
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
    const color = searchParams.get("color")
    const breedId = searchParams.get("breedId")
    const sourceFarmId = searchParams.get("sourceFarmId")
    const ageMin = searchParams.get("ageMin") // minimum age in months
    const ageMax = searchParams.get("ageMax") // maximum age in months
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build where clause
    const where: Record<string, unknown> = {}
    const andConditions: Record<string, unknown>[] = []

    if (status) {
      where.status = status
    }

    if (sex) {
      where.sex = sex
    }

    if (coopId) {
      where.coopId = coopId
    }

    if (color) {
      where.color = color
    }

    if (parentId) {
      where.OR = [
        { sireId: parentId },
        { damId: parentId },
      ]
    }

    // Search by name or any identifier
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { identifiers: { some: { idValue: { contains: search, mode: "insensitive" } } } },
        ],
      })
    }

    // Age range filter (based on hatchDate)
    if (ageMin || ageMax) {
      const now = new Date()
      const hatchDateFilter: Record<string, Date> = {}

      if (ageMin) {
        // Birds at least X months old = hatched before X months ago
        const maxHatchDate = new Date(now)
        maxHatchDate.setMonth(maxHatchDate.getMonth() - parseInt(ageMin))
        hatchDateFilter.lte = maxHatchDate
      }

      if (ageMax) {
        // Birds at most X months old = hatched after X months ago
        const minHatchDate = new Date(now)
        minHatchDate.setMonth(minHatchDate.getMonth() - parseInt(ageMax))
        hatchDateFilter.gte = minHatchDate
      }

      where.hatchDate = hatchDateFilter
    }

    // Get all birds first for breedComposition and sourceFarm filtering
    // These filters work on JSON data and need post-filtering
    let breedIdsToFilter: string[] = []

    // If filtering by source farm, get the breed IDs linked to that farm
    if (sourceFarmId) {
      const linkedBreeds = await prisma.breedSourceFarm.findMany({
        where: { sourceFarmId },
        select: { breedId: true },
      })
      breedIdsToFilter = linkedBreeds.map((b) => b.breedId)
    }

    // Combine AND conditions
    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // For breed/sourceFarm filters, we need to fetch more and filter in-memory
    // because breedComposition is stored as JSON
    const needsPostFilter = breedId || breedIdsToFilter.length > 0
    const fetchLimit = needsPostFilter ? 1000 : limit
    const fetchOffset = needsPostFilter ? 0 : offset

    let [birds, total] = await Promise.all([
      prisma.bird.findMany({
        where,
        include: {
          identifiers: true,
          coop: { select: { id: true, name: true } },
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
        take: fetchLimit,
        skip: fetchOffset,
      }),
      prisma.bird.count({ where }),
    ])

    // Post-filter for breed composition (JSON field)
    if (breedId || breedIdsToFilter.length > 0) {
      const filterBreedIds = breedId
        ? [breedId, ...breedIdsToFilter]
        : breedIdsToFilter

      birds = birds.filter((bird) => {
        const composition = bird.breedComposition as Array<{ breedId: string; percentage: number }> | null
        if (!composition || !Array.isArray(composition)) return false
        return composition.some((bc) => filterBreedIds.includes(bc.breedId))
      })

      // Update total and apply pagination
      total = birds.length
      birds = birds.slice(offset, offset + limit)
    }

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
          color: data.color,
          combType: data.combType,
          earlyLifeNotes: data.earlyLifeNotes,
          breedComposition: data.breedComposition || [],
          breedOverride: data.breedOverride || false,
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
    return handleApiError(error, "POST /api/birds")
  }
}
