import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"

export async function GET() {
  try {
    await requireAuth()

    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const nextSevenDays = new Date(today)
    nextSevenDays.setDate(nextSevenDays.getDate() + 7)

    const [
      totalBirds,
      birdsBySex,
      recentDeaths,
      eggsLast7Days,
      eggsLast30Days,
      upcomingVaccinations,
      activeHealthIncidents,
      feedInventory,
      recentActivity,
    ] = await Promise.all([
      // Total active birds
      prisma.bird.count({ where: { status: "ACTIVE" } }),

      // Birds by sex
      prisma.bird.groupBy({
        by: ["sex"],
        where: { status: "ACTIVE" },
        _count: true,
      }),

      // Deaths in last 7 days
      prisma.bird.count({
        where: {
          status: "DECEASED",
          updatedAt: { gte: sevenDaysAgo },
        },
      }),

      // Eggs in last 7 days
      prisma.eggRecord.count({
        where: { date: { gte: sevenDaysAgo } },
      }),

      // Eggs in last 30 days
      prisma.eggRecord.count({
        where: { date: { gte: thirtyDaysAgo } },
      }),

      // Vaccinations due in next 7 days
      prisma.vaccination.count({
        where: {
          nextDueDate: {
            gte: today,
            lte: nextSevenDays,
          },
        },
      }),

      // Active health incidents
      prisma.healthIncident.count({
        where: { outcome: "ONGOING" },
      }),

      // Feed inventory with low stock check
      prisma.feedInventory.findMany({
        select: {
          id: true,
          feedType: true,
          quantityKg: true,
          reorderLevel: true,
        },
      }),

      // Recent activity (last 10 birds added)
      prisma.bird.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          sex: true,
          hatchDate: true,
          createdAt: true,
          identifiers: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    // Process feed inventory for low stock alerts
    const lowStockFeeds = feedInventory.filter(
      (f) => f.reorderLevel && f.quantityKg <= f.reorderLevel
    )

    // Calculate sex distribution
    const sexCounts = {
      male: birdsBySex.find((b) => b.sex === "MALE")?._count || 0,
      female: birdsBySex.find((b) => b.sex === "FEMALE")?._count || 0,
      unknown: birdsBySex.find((b) => b.sex === "UNKNOWN")?._count || 0,
    }

    return successResponse({
      summary: {
        totalBirds,
        males: sexCounts.male,
        females: sexCounts.female,
        recentDeaths,
        eggsLast7Days,
        eggsLast30Days,
      },
      alerts: {
        upcomingVaccinations,
        activeHealthIncidents,
        lowStockFeedsCount: lowStockFeeds.length,
      },
      feedInventory: feedInventory.map((f) => ({
        ...f,
        isLowStock: f.reorderLevel ? f.quantityKg <= f.reorderLevel : false,
      })),
      recentBirds: recentActivity,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/reports/dashboard error:", error)
    return errorResponse("Internal server error", 500)
  }
}
