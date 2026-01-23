import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"

// GET /api/birds/search - Fast bird lookup by any identifier
export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")

    if (!q || q.length < 1) {
      return successResponse([])
    }

    // Search across name and all identifier types
    // Note: SQLite doesn't support mode: "insensitive", but LIKE is case-insensitive by default
    const birds = await prisma.bird.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { identifiers: { some: { idValue: { contains: q } } } },
        ],
      },
      include: {
        identifiers: true,
        photos: { where: { isPrimary: true }, take: 1 },
        coop: { select: { id: true, name: true } },
      },
      take: 20,
      orderBy: [
        { status: "asc" }, // Active birds first
        { name: "asc" },
      ],
    })

    // Format for quick display
    const results = birds.map((bird) => ({
      id: bird.id,
      name: bird.name,
      sex: bird.sex,
      status: bird.status,
      hatchDate: bird.hatchDate,
      photoUrl: bird.photos[0]?.url || null,
      coop: bird.coop?.name || null,
      identifiers: bird.identifiers.map((id: { idType: string; idValue: string }) => ({
        idType: id.idType,
        idValue: id.idValue,
      })),
      // Primary display ID (first identifier or name)
      displayId: bird.identifiers[0]?.idValue || bird.name || bird.id.slice(-6),
      breedComposition: bird.breedComposition,
    }))

    return successResponse(results)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/birds/search error:", error)
    return errorResponse("Internal server error", 500)
  }
}
