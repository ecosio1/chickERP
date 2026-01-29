import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, handleApiError, successResponse } from "@/lib/api-utils"
import { getReportColumns, type ReportType } from "@/lib/report-columns"

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const reportType = (searchParams.get("type") || "birds") as ReportType
    const columnId = searchParams.get("column")

    if (!columnId) {
      return NextResponse.json({ error: "Column parameter required" }, { status: 400 })
    }

    const columns = getReportColumns(reportType)
    const column = columns.find((c) => c.id === columnId)

    if (!column) {
      return NextResponse.json({ error: "Invalid column" }, { status: 400 })
    }

    const supabase = await createClient()
    let values: string[] = []

    // Get distinct values from database based on report type and column
    // Always fetch actual values from the database, not predefined options
    if (reportType === "birds") {
      if (columnId === "sex") {
        // Get actual sex values used in the database
        const { data } = await supabase
          .from("birds")
          .select("sex")
          .not("sex", "is", null)
        const sexSet = new Set(data?.map((b) => b.sex).filter(Boolean) as string[])
        values = Array.from(sexSet).sort()
      } else if (columnId === "status") {
        // Get actual status values used in the database
        const { data } = await supabase
          .from("birds")
          .select("status")
          .not("status", "is", null)
        const statusSet = new Set(data?.map((b) => b.status).filter(Boolean) as string[])
        values = Array.from(statusSet).sort()
      } else if (columnId === "comb_type") {
        // Get actual comb type values used in the database
        const { data } = await supabase
          .from("birds")
          .select("comb_type")
          .not("comb_type", "is", null)
        const combSet = new Set(data?.map((b) => b.comb_type).filter(Boolean) as string[])
        values = Array.from(combSet).sort()
      } else if (columnId === "coop") {
        // Get coops that actually have birds assigned
        const { data: birdsWithCoops } = await supabase
          .from("birds")
          .select("coop:coops(name)")
          .not("coop_id", "is", null)
        const coopSet = new Set(
          birdsWithCoops?.map((b) => (b.coop as { name: string } | null)?.name).filter(Boolean) as string[]
        )
        values = Array.from(coopSet).sort()
      } else if (columnId === "breed") {
        // Extract unique breed names from breed_composition JSONB field
        const { data } = await supabase
          .from("birds")
          .select("breed_composition")
          .not("breed_composition", "is", null)

        const breedSet = new Set<string>()
        data?.forEach((bird) => {
          if (bird.breed_composition && typeof bird.breed_composition === "object") {
            const comp = bird.breed_composition as Record<string, number>
            Object.keys(comp).forEach((breedName) => {
              if (breedName) breedSet.add(breedName)
            })
          }
        })
        values = Array.from(breedSet).sort()
      } else if (columnId === "sire") {
        // Get birds that are actually used as sires
        const { data } = await supabase
          .from("birds")
          .select("sire:birds!birds_sire_id_fkey(name)")
          .not("sire_id", "is", null)
        const sireSet = new Set(
          data?.map((b) => (b.sire as unknown as { name: string } | null)?.name).filter(Boolean) as string[]
        )
        values = Array.from(sireSet).sort()
      } else if (columnId === "dam") {
        // Get birds that are actually used as dams
        const { data } = await supabase
          .from("birds")
          .select("dam:birds!birds_dam_id_fkey(name)")
          .not("dam_id", "is", null)
        const damSet = new Set(
          data?.map((b) => (b.dam as unknown as { name: string } | null)?.name).filter(Boolean) as string[]
        )
        values = Array.from(damSet).sort()
      } else if (columnId === "color") {
        const { data } = await supabase
          .from("birds")
          .select("color")
          .not("color", "is", null)
        const colorSet = new Set(data?.map((b) => b.color).filter(Boolean) as string[])
        values = Array.from(colorSet).sort()
      } else if (columnId === "band_number") {
        const { data } = await supabase
          .from("bird_identifiers")
          .select("id_value")
          .eq("id_type", "BAND")
          .not("id_value", "is", null)
        const bandSet = new Set(data?.map((b) => b.id_value).filter(Boolean) as string[])
        values = Array.from(bandSet).sort()
      } else if (columnId === "wingband_color") {
        const { data } = await supabase
          .from("bird_identifiers")
          .select("id_value")
          .eq("id_type", "WING_BAND")
          .not("id_value", "is", null)
        const wingbandSet = new Set(data?.map((b) => b.id_value).filter(Boolean) as string[])
        values = Array.from(wingbandSet).sort()
      } else if (columnId === "name") {
        // Get actual bird names
        const { data } = await supabase
          .from("birds")
          .select("name")
          .not("name", "is", null)
          .order("name")
          .limit(200)
        values = data?.map((b) => b.name).filter(Boolean) as string[] || []
      }
    } else if (reportType === "eggs") {
      if (columnId === "bird_name") {
        // Get birds that actually have egg records
        const { data } = await supabase
          .from("egg_records")
          .select("bird:birds(name)")
          .not("bird_id", "is", null)
        const birdSet = new Set(
          data?.map((e) => (e.bird as { name: string } | null)?.name).filter(Boolean) as string[]
        )
        values = Array.from(birdSet).sort()
      } else if (columnId === "shell_quality") {
        // Get actual shell quality values used
        const { data } = await supabase
          .from("egg_records")
          .select("shell_quality")
          .not("shell_quality", "is", null)
        const qualitySet = new Set(data?.map((e) => e.shell_quality).filter(Boolean) as string[])
        values = Array.from(qualitySet).sort()
      } else if (columnId === "egg_mark") {
        // Get actual egg marks used
        const { data } = await supabase
          .from("egg_records")
          .select("egg_mark")
          .not("egg_mark", "is", null)
        const markSet = new Set(data?.map((e) => e.egg_mark).filter(Boolean) as string[])
        values = Array.from(markSet).sort()
      }
    } else if (reportType === "health") {
      if (columnId === "bird_name") {
        // Get birds that actually have health incidents
        const { data } = await supabase
          .from("health_incident_birds")
          .select("bird:birds(name)")
        const birdSet = new Set(
          data?.map((h) => (h.bird as { name: string } | null)?.name).filter(Boolean) as string[]
        )
        values = Array.from(birdSet).sort()
      } else if (columnId === "outcome") {
        // Get actual outcome values used
        const { data } = await supabase
          .from("health_incidents")
          .select("outcome")
          .not("outcome", "is", null)
        const outcomeSet = new Set(data?.map((h) => h.outcome).filter(Boolean) as string[])
        values = Array.from(outcomeSet).sort()
      } else if (columnId === "symptoms" || columnId === "diagnosis" || columnId === "treatment") {
        const { data } = await supabase
          .from("health_incidents")
          .select(columnId)
          .not(columnId, "is", null)
        const valueSet = new Set(data?.map((h) => h[columnId as keyof typeof h]).filter(Boolean) as string[])
        values = Array.from(valueSet).sort()
      }
    }

    return successResponse({ values })
  } catch (error) {
    return handleApiError(error, "GET /api/reports/values")
  }
}
