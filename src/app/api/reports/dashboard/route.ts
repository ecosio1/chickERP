import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"

export async function GET() {
  try {
    await requireAuth()

    const supabase = await createClient()

    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const nextSevenDays = new Date(today)
    nextSevenDays.setDate(nextSevenDays.getDate() + 7)

    const [
      totalBirdsResult,
      birdsBySexResult,
      recentDeathsResult,
      eggsLast7DaysResult,
      eggsLast30DaysResult,
      upcomingVaccinationsResult,
      activeHealthIncidentsResult,
      feedInventoryResult,
      recentActivityResult,
    ] = await Promise.all([
      // Total active birds
      supabase
        .from('birds')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE'),

      // Birds by sex (get all active birds, then group in JS)
      supabase
        .from('birds')
        .select('sex')
        .eq('status', 'ACTIVE'),

      // Deaths in last 7 days
      supabase
        .from('birds')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'DECEASED')
        .gte('updated_at', sevenDaysAgo.toISOString()),

      // Eggs in last 7 days
      supabase
        .from('egg_records')
        .select('*', { count: 'exact', head: true })
        .gte('date', sevenDaysAgo.toISOString().split('T')[0]),

      // Eggs in last 30 days
      supabase
        .from('egg_records')
        .select('*', { count: 'exact', head: true })
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]),

      // Vaccinations due in next 7 days
      supabase
        .from('vaccinations')
        .select('*', { count: 'exact', head: true })
        .gte('next_due_date', today.toISOString().split('T')[0])
        .lte('next_due_date', nextSevenDays.toISOString().split('T')[0]),

      // Active health incidents
      supabase
        .from('health_incidents')
        .select('*', { count: 'exact', head: true })
        .eq('outcome', 'ONGOING'),

      // Feed inventory with low stock check
      supabase
        .from('feed_inventory')
        .select('id, feed_type, quantity_kg, reorder_level'),

      // Recent activity (last 5 birds added)
      supabase
        .from('birds')
        .select(`
          id,
          name,
          sex,
          hatch_date,
          created_at,
          bird_identifiers (id, id_type, id_value)
        `)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    // Extract counts and data
    const totalBirds = totalBirdsResult.count || 0
    const recentDeaths = recentDeathsResult.count || 0
    const eggsLast7Days = eggsLast7DaysResult.count || 0
    const eggsLast30Days = eggsLast30DaysResult.count || 0
    const upcomingVaccinations = upcomingVaccinationsResult.count || 0
    const activeHealthIncidents = activeHealthIncidentsResult.count || 0
    const feedInventory = feedInventoryResult.data || []
    const recentActivity = recentActivityResult.data || []

    // Calculate sex distribution from birds data
    const birdsBySex = birdsBySexResult.data || []
    const sexCounts = {
      male: birdsBySex.filter((b) => b.sex === "MALE").length,
      female: birdsBySex.filter((b) => b.sex === "FEMALE").length,
      unknown: birdsBySex.filter((b) => b.sex === "UNKNOWN").length,
    }

    // Process feed inventory for low stock alerts
    const lowStockFeeds = feedInventory.filter(
      (f) => f.reorder_level && f.quantity_kg <= f.reorder_level
    )

    // Transform feed inventory to camelCase for response
    const feedInventoryResponse = feedInventory.map((f) => ({
      id: f.id,
      feedType: f.feed_type,
      quantityKg: f.quantity_kg,
      reorderLevel: f.reorder_level,
      isLowStock: f.reorder_level ? f.quantity_kg <= f.reorder_level : false,
    }))

    // Transform recent activity to camelCase for response
    const recentBirds = recentActivity.map((bird) => ({
      id: bird.id,
      name: bird.name,
      sex: bird.sex,
      hatchDate: bird.hatch_date,
      createdAt: bird.created_at,
      identifiers: (bird.bird_identifiers || []).map((id: { id: string; id_type: string; id_value: string }) => ({
        id: id.id,
        idType: id.id_type,
        idValue: id.id_value,
      })),
    }))

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
      feedInventory: feedInventoryResponse,
      recentBirds,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/reports/dashboard error:", error)
    return errorResponse("Internal server error", 500)
  }
}
