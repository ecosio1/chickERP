import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, handleApiError, successResponse, errorResponse } from "@/lib/api-utils"
import { z } from "zod"

const UpdatePresetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  config: z.object({
    columns: z.array(z.string()),
    filters: z.record(z.array(z.string())).optional(),
    sortColumn: z.string().nullable().optional(),
    sortDirection: z.enum(["asc", "desc"]).nullable().optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
})

// GET - Get a single preset
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("saved_reports")
      .select("*")
      .eq("id", id)
      .eq("created_by", session.user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return errorResponse("Preset not found", 404)
      }
      throw error
    }

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
    })
  } catch (error) {
    return handleApiError(error, "GET /api/reports/presets/[id]")
  }
}

// PUT - Update a preset
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const body = await request.json()
    const updates = UpdatePresetSchema.parse(body)

    const supabase = await createClient()

    // Check if preset exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("saved_reports")
      .select("id, report_type")
      .eq("id", id)
      .eq("created_by", session.user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return errorResponse("Preset not found", 404)
      }
      throw fetchError
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await supabase
        .from("saved_reports")
        .update({ is_default: false })
        .eq("created_by", session.user.id)
        .eq("report_type", existing.report_type)
        .neq("id", id)
    }

    const updateData: Record<string, unknown> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.config !== undefined) updateData.config = updates.config
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault

    const { data, error } = await supabase
      .from("saved_reports")
      .update(updateData)
      .eq("id", id)
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
    })
  } catch (error) {
    return handleApiError(error, "PUT /api/reports/presets/[id]")
  }
}

// DELETE - Delete a preset
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const supabase = await createClient()

    const { error } = await supabase
      .from("saved_reports")
      .delete()
      .eq("id", id)
      .eq("created_by", session.user.id)

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/reports/presets/[id]")
  }
}
