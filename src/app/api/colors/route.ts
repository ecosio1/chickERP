import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, successResponse, errorResponse } from "@/lib/api-utils"
import { CHICKEN_COLORS } from "@/lib/chicken-colors"

// GET /api/colors - Get all colors, optionally sorted by breed preference
export async function GET(req: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(req.url)
    const breedIds = searchParams.get("breeds")?.split(",").filter(Boolean) || []

    // If no breeds specified, return colors as-is
    if (breedIds.length === 0) {
      return successResponse(CHICKEN_COLORS)
    }

    // Find which colors are commonly used with these breeds
    // by looking at existing birds that have these breeds in their composition
    const birdsWithBreeds = await prisma.bird.findMany({
      where: {
        color: {
          not: null,
        },
      },
      select: {
        color: true,
        breedComposition: true,
      },
    })

    // Count color usage for each breed
    const colorCounts: Record<string, number> = {}

    for (const bird of birdsWithBreeds) {
      const composition = bird.breedComposition as Array<{ breedId: string; percentage: number }> | null
      if (!composition || !bird.color) continue

      // Check if this bird has any of the specified breeds
      const hasBreed = composition.some((b) => breedIds.includes(b.breedId))
      if (hasBreed) {
        const colorId = bird.color
        colorCounts[colorId] = (colorCounts[colorId] || 0) + 1
      }
    }

    // Sort colors: breed-associated colors first (by count), then rest alphabetically
    const sortedColors = [...CHICKEN_COLORS].sort((a, b) => {
      const countA = colorCounts[a.id] || 0
      const countB = colorCounts[b.id] || 0

      // If both have counts, sort by count (descending)
      if (countA > 0 && countB > 0) {
        return countB - countA
      }

      // Colors with counts come first
      if (countA > 0) return -1
      if (countB > 0) return 1

      // Otherwise alphabetical
      return a.name.localeCompare(b.name)
    })

    // Mark which colors are "suggested" for this breed
    const colorsWithSuggestion = sortedColors.map((color) => ({
      ...color,
      suggested: (colorCounts[color.id] || 0) > 0,
      usageCount: colorCounts[color.id] || 0,
    }))

    return successResponse(colorsWithSuggestion)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/colors error:", error)
    return errorResponse("Internal server error", 500)
  }
}
