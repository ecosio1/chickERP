import { createClient } from "@/lib/supabase/server"
import { requireAuth, handleApiError } from "@/lib/api-utils"
import { getReportColumns, type ReportType, REPORT_TYPES } from "@/lib/report-columns"
import { generateCSV, createCSVResponse, formatDateForCSV } from "@/lib/export-utils"
import { z } from "zod"
import type { Database } from "@/types/database.types"

type BirdStatus = Database["public"]["Enums"]["bird_status"]
type BirdSex = Database["public"]["Enums"]["bird_sex"]
type CombType = Database["public"]["Enums"]["comb_type"]
type ShellQuality = Database["public"]["Enums"]["shell_quality"]
type HealthOutcome = Database["public"]["Enums"]["health_outcome"]

const ExportReportSchema = z.object({
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
    const params = ExportReportSchema.parse(body)

    const { reportType, columns, filters, sortColumn, sortDirection } = params

    const reportConfig = REPORT_TYPES.find((rt) => rt.id === reportType)
    if (!reportConfig) {
      return new Response("Invalid report type", { status: 400 })
    }

    const supabase = await createClient()
    let results: Record<string, unknown>[] = []

    // Execute query similar to execute route but without pagination
    if (reportType === "birds") {
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
          created_at,
          coop:coops(id, name),
          sire:birds!birds_sire_id_fkey(id, name),
          dam:birds!birds_dam_id_fkey(id, name),
          breed_composition,
          identifiers:bird_identifiers(id_type, id_value)
        `)

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

      // Track if we need to filter by breed in memory (JSONB field)
      const breedFilter = filters?.breed?.length ? filters.breed : null

      if (sortColumn && sortDirection) {
        const dbColumn = sortColumn === "coop" ? "coop_id" : sortColumn
        query = query.order(dbColumn, { ascending: sortDirection === "asc" })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      // Process all results first
      let processedData = (data || []).map((bird) => {
        const hatchDate = bird.hatch_date ? new Date(bird.hatch_date) : null
        const ageInMonths = hatchDate
          ? Math.floor((Date.now() - hatchDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
          : null

        // Extract all breeds from composition
        const allBreeds: string[] = []
        if (bird.breed_composition && typeof bird.breed_composition === "object") {
          const comp = bird.breed_composition as Record<string, number>
          Object.keys(comp).forEach((breedName) => allBreeds.push(breedName))
        }

        // Get primary breed (highest percentage)
        let breed = ""
        if (allBreeds.length > 0 && bird.breed_composition) {
          const comp = bird.breed_composition as Record<string, number>
          const entries = Object.entries(comp).sort((a, b) => b[1] - a[1])
          if (entries.length > 0) {
            breed = entries[0][0]
          }
        }

        // Handle sire/dam - they come back from the self-referential join
        const sireData = bird.sire as unknown as { name: string | null } | null
        const damData = bird.dam as unknown as { name: string | null } | null

        // Extract identifiers
        const identifiers = bird.identifiers as Array<{ id_type: string; id_value: string }> | null
        const bandNumber = identifiers?.find((id) => id.id_type === "BAND")?.id_value || ""
        const wingbandColor = identifiers?.find((id) => id.id_type === "WING_BAND")?.id_value || ""

        return {
          id: bird.id,
          band_number: bandNumber,
          wingband_color: wingbandColor,
          name: bird.name || "",
          sex: bird.sex,
          status: bird.status,
          hatch_date: formatDateForCSV(bird.hatch_date),
          color: bird.color || "",
          comb_type: bird.comb_type || "",
          coop: (bird.coop as { name: string } | null)?.name || "",
          sire: sireData?.name || "",
          dam: damData?.name || "",
          breed: breed || "",
          age: ageInMonths?.toString() || "",
          created_at: formatDateForCSV(bird.created_at),
          _allBreeds: allBreeds, // Temporary for filtering
        }
      })

      // Apply breed filter in memory (since it's a JSONB field)
      if (breedFilter) {
        processedData = processedData.filter((bird) =>
          bird._allBreeds.some((b) => breedFilter.includes(b))
        )
      }

      // Remove temporary _allBreeds field
      results = processedData.map(({ _allBreeds, ...bird }) => bird)
    } else if (reportType === "eggs") {
      let query = supabase
        .from("egg_records")
        .select(`
          id,
          date,
          egg_mark,
          weight_grams,
          shell_quality,
          notes,
          bird:birds(id, name)
        `)

      if (filters) {
        if (filters.shell_quality?.length) {
          query = query.in("shell_quality", filters.shell_quality as ShellQuality[])
        }
        if (filters.egg_mark?.length) {
          query = query.in("egg_mark", filters.egg_mark)
        }
        if (filters.bird_name?.length) {
          const { data: birds } = await supabase
            .from("birds")
            .select("id")
            .in("name", filters.bird_name)
          if (birds?.length) {
            query = query.in("bird_id", birds.map((b) => b.id))
          }
        }
      }

      if (sortColumn && sortDirection) {
        query = query.order(sortColumn, { ascending: sortDirection === "asc" })
      } else {
        query = query.order("date", { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      results = (data || []).map((egg) => ({
        id: egg.id,
        bird_name: (egg.bird as { name: string } | null)?.name || "",
        date: formatDateForCSV(egg.date),
        egg_mark: egg.egg_mark || "",
        weight_grams: egg.weight_grams?.toString() || "",
        shell_quality: egg.shell_quality || "",
        notes: egg.notes || "",
      }))
    } else if (reportType === "health") {
      let query = supabase
        .from("health_incidents")
        .select(`
          id,
          date_noticed,
          symptoms,
          diagnosis,
          treatment,
          outcome,
          notes,
          health_incident_birds(
            bird:birds(id, name)
          )
        `)

      if (filters) {
        if (filters.outcome?.length) {
          query = query.in("outcome", filters.outcome as HealthOutcome[])
        }
      }

      if (sortColumn && sortDirection) {
        query = query.order(sortColumn, { ascending: sortDirection === "asc" })
      } else {
        query = query.order("date_noticed", { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      results = (data || []).map((incident) => {
        const birdNames = (incident.health_incident_birds as Array<{ bird: { name: string } | null }> || [])
          .map((hib) => hib.bird?.name)
          .filter(Boolean)
          .join(", ")

        return {
          id: incident.id,
          bird_name: birdNames || "",
          date_noticed: formatDateForCSV(incident.date_noticed),
          symptoms: incident.symptoms || "",
          diagnosis: incident.diagnosis || "",
          treatment: incident.treatment || "",
          outcome: incident.outcome,
          notes: incident.notes || "",
        }
      })
    }

    // Get column metadata for headers
    const reportColumns = getReportColumns(reportType)
    const validColumns = columns.filter((col) =>
      reportColumns.some((rc) => rc.id === col)
    )

    // Create headers from column labels
    const headers = validColumns.map((colId) => {
      const col = reportColumns.find((c) => c.id === colId)
      return col?.label || colId
    })

    // Create rows with only selected columns
    const rows = results.map((row) =>
      validColumns.map((col) => {
        const value = row[col]
        return value !== null && value !== undefined ? String(value) : ""
      })
    )

    const csvContent = generateCSV(headers, rows)
    const filename = `${reportType}-report-${new Date().toISOString().split("T")[0]}`

    return createCSVResponse(csvContent, filename)
  } catch (error) {
    return handleApiError(error, "POST /api/reports/export")
  }
}
