import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, handleApiError, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const CreatePresetSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  reportType: z.enum(["birds", "eggs", "health"]),
  config: z.object({
    columns: z.array(z.string()),
    filters: z.record(z.array(z.string())).optional(),
    sortColumn: z.string().nullable().optional(),
    sortDirection: z.enum(["asc", "desc"]).nullable().optional(),
  }),
  isDefault: z.boolean().optional(),
})

// GET - List all presets for the current user
export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")

    const supabase = await createClient()

    let query = supabase
      .from("saved_reports")
      .select("*")
      .eq("created_by", session.user.id)
      .order("updated_at", { ascending: false })

    if (reportType) {
      query = query.eq("report_type", reportType)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform to camelCase
    const presets = (data || []).map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      reportType: preset.report_type,
      config: preset.config,
      isDefault: preset.is_default,
      createdAt: preset.created_at,
      updatedAt: preset.updated_at,
    }))

    return successResponse({ presets })
  } catch (error) {
    return handleApiError(error, "GET /api/reports/presets")
  }
}

// POST - Create a new preset
export async function POST(request: Request) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const params = CreatePresetSchema.parse(body)

    const supabase = await createClient()

    // If setting as default, unset other defaults for this report type
    if (params.isDefault) {
      await supabase
        .from("saved_reports")
        .update({ is_default: false })
        .eq("created_by", session.user.id)
        .eq("report_type", params.reportType)
    }

    const { data, error } = await supabase
      .from("saved_reports")
      .insert({
        name: params.name,
        description: params.description || null,
        report_type: params.reportType,
        config: params.config,
        is_default: params.isDefault || false,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) throw error

    return successResponse({
      preset: {
        id: data.id,
        name: data.name,
        description: data.description,
        reportType: data.report_type,
        config: data.config,
        isDefault: data.is_default,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/reports/presets")
  }
}
