import { createClient } from "@/lib/supabase/server"
import { requireAuth, handleApiError, successResponse } from "@/lib/api-utils"
import { getReportColumns, type ReportType, REPORT_TYPES } from "@/lib/report-columns"
import { z } from "zod"
import type { Database } from "@/types/database.types"

type BirdStatus = Database["public"]["Enums"]["bird_status"]
type BirdSex = Database["public"]["Enums"]["bird_sex"]
type CombType = Database["public"]["Enums"]["comb_type"]

const SummaryReportSchema = z.object({
  reportType: z.enum(["birds", "eggs", "health"]),
  columns: z.array(z.string()).min(1),
  filters: z.record(z.array(z.string())).optional(),
  sortColumn: z.string().nullable().optional(),
  sortDirection: z.enum(["asc", "desc"]).nullable().optional(),
})

export async function POST(request: Request) {
  try {
    await requireAuth()

    const body = await request.json()
    const params = SummaryReportSchema.parse(body)

    const { reportType, columns, filters } = params

    const reportConfig = REPORT_TYPES.find((rt) => rt.id === reportType)
    if (!reportConfig) {
      return new Response("Invalid report type", { status: 400 })
    }

    const supabase = await createClient()

    if (reportType === "birds") {
      // Fetch all birds with the necessary data
      let query = supabase
        .from("birds")
        .select(`
          id,
          name,
          sex,
          status,
          hatch_date,
          color,
          comb_type,
          coop:coops(id, name),
          sire:birds!birds_sire_id_fkey(id, name),
          dam:birds!birds_dam_id_fkey(id, name),
          breed_composition,
          identifiers:bird_identifiers(id_type, id_value)
        `)

      // Apply filters
      if (filters) {
        if (filters.status?.length) {
          query = query.in("status", filters.status as BirdStatus[])
        }
        if (filters.sex?.length) {
          query = query.in("sex", filters.sex as BirdSex[])
        }
        if (filters.comb_type?.length) {
          query = query.in("comb_type", filters.comb_type as CombType[])
        }
        if (filters.color?.length) {
          query = query.in("color", filters.color)
        }
        if (filters.name?.length) {
          query = query.in("name", filters.name)
        }
        if (filters.coop?.length) {
          const { data: coops } = await supabase
            .from("coops")
            .select("id")
            .in("name", filters.coop)
          if (coops?.length) {
            query = query.in("coop_id", coops.map((c) => c.id))
          }
        }
        if (filters.sire?.length) {
          const { data: sires } = await supabase
            .from("birds")
            .select("id")
            .in("name", filters.sire)
          if (sires?.length) {
            query = query.in("sire_id", sires.map((s) => s.id))
          }
        }
        if (filters.dam?.length) {
          const { data: dams } = await supabase
            .from("birds")
            .select("id")
            .in("name", filters.dam)
          if (dams?.length) {
            query = query.in("dam_id", dams.map((d) => d.id))
          }
        }
        if (filters.band_number?.length) {
          const { data: identifiers } = await supabase
            .from("bird_identifiers")
            .select("bird_id")
            .eq("id_type", "BAND")
            .in("id_value", filters.band_number)
          if (identifiers?.length) {
            query = query.in("id", identifiers.map((i) => i.bird_id))
          }
        }
        if (filters.wingband_color?.length) {
          const { data: identifiers } = await supabase
            .from("bird_identifiers")
            .select("bird_id")
            .eq("id_type", "WING_BAND")
            .in("id_value", filters.wingband_color)
          if (identifiers?.length) {
            query = query.in("id", identifiers.map((i) => i.bird_id))
          }
        }
      }

      const breedFilter = filters?.breed?.length ? filters.breed : null

      const { data, error } = await query

      if (error) throw error

      // Process birds to extract field values
      const processedBirds = (data || []).map((bird) => {
        // Extract all breeds from composition
        const allBreeds: string[] = []
        let primaryBreed = "-"
        if (bird.breed_composition && typeof bird.breed_composition === "object") {
          const comp = bird.breed_composition as Record<string, number>
          Object.keys(comp).forEach((breedName) => allBreeds.push(breedName))
          const entries = Object.entries(comp).sort((a, b) => b[1] - a[1])
          if (entries.length > 0) {
            primaryBreed = entries[0][0]
          }
        }

        const sireData = bird.sire as unknown as { name: string | null } | null
        const damData = bird.dam as unknown as { name: string | null } | null
        const identifiers = bird.identifiers as Array<{ id_type: string; id_value: string }> | null

        return {
          sex: bird.sex,
          status: bird.status,
          color: bird.color || "-",
          comb_type: bird.comb_type || "-",
          coop: (bird.coop as { name: string } | null)?.name || "-",
          sire: sireData?.name || "-",
          dam: damData?.name || "-",
          breed: primaryBreed,
          band_number: identifiers?.find((id) => id.id_type === "BAND")?.id_value || "-",
          wingband_color: identifiers?.find((id) => id.id_type === "WING_BAND")?.id_value || "-",
          name: bird.name || "-",
          _allBreeds: allBreeds,
        }
      })

      // Apply breed filter in memory
      let filteredBirds = processedBirds
      if (breedFilter) {
        filteredBirds = processedBirds.filter((bird) =>
          bird._allBreeds.some((b) => breedFilter.includes(b))
        )
      }

      // Group by selected columns and count
      const groupCounts = new Map<string, number>()

      filteredBirds.forEach((bird) => {
        // Build a key from the selected column values
        const keyParts = columns.map((col) => {
          const value = bird[col as keyof typeof bird]
          if (Array.isArray(value)) return "-"
          return String(value ?? "-")
        })
        const key = keyParts.join("|||")
        groupCounts.set(key, (groupCounts.get(key) || 0) + 1)
      })

      // Convert to results array
      const results: Record<string, unknown>[] = []
      groupCounts.forEach((count, key) => {
        const values = key.split("|||")
        const row: Record<string, unknown> = { count }
        columns.forEach((col, index) => {
          row[col] = values[index]
        })
        results.push(row)
      })

      // Sort by count descending by default
      results.sort((a, b) => (b.count as number) - (a.count as number))

      // Calculate total count of birds
      const totalBirdCount = filteredBirds.length

      return successResponse({
        results,
        totalCount: results.length,
        totalBirdCount,
      })
    }

    // For eggs and health reports, return empty for now
    return successResponse({
      results: [],
      totalCount: 0,
      totalBirdCount: 0,
    })
  } catch (error) {
    return handleApiError(error, "POST /api/reports/summary")
  }
}
