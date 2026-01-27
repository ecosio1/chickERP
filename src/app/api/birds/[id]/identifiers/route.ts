import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const identifierSchema = z.object({
  idType: z.string().min(1, "ID type is required"),
  idValue: z.string().min(1, "ID value is required"),
  notes: z.string().optional(),
})

// POST /api/birds/[id]/identifiers - Add identifier to bird
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: birdId } = await params
    const supabase = await createClient()

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can add identifiers", 403)
    }

    const body = await req.json()
    const data = identifierSchema.parse(body)

    // Check if bird exists
    const { data: bird, error: birdError } = await supabase
      .from('birds')
      .select('id')
      .eq('id', birdId)
      .single()

    if (birdError || !bird) {
      return errorResponse("Bird not found", 404)
    }

    // Check if this ID type already exists for this bird
    const { data: existing } = await supabase
      .from('bird_identifiers')
      .select('id')
      .eq('bird_id', birdId)
      .eq('id_type', data.idType)
      .single()

    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabase
        .from('bird_identifiers')
        .update({ id_value: data.idValue, notes: data.notes })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error("Update identifier error:", updateError)
        return errorResponse("Failed to update identifier", 500)
      }

      return successResponse(updated)
    }

    // Create new
    const { data: identifier, error: createError } = await supabase
      .from('bird_identifiers')
      .insert({
        bird_id: birdId,
        id_type: data.idType,
        id_value: data.idValue,
        notes: data.notes,
      })
      .select()
      .single()

    if (createError) {
      console.error("Create identifier error:", createError)
      return errorResponse("Failed to create identifier", 500)
    }

    return successResponse(identifier, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/birds/[id]/identifiers error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/birds/[id]/identifiers - Remove identifier
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: birdId } = await params
    const supabase = await createClient()

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can remove identifiers", 403)
    }

    const { searchParams } = new URL(req.url)
    const idType = searchParams.get("idType")

    if (!idType) {
      return errorResponse("ID type is required", 400)
    }

    const { error } = await supabase
      .from('bird_identifiers')
      .delete()
      .eq('bird_id', birdId)
      .eq('id_type', idType)

    if (error) {
      console.error("Delete identifier error:", error)
      return errorResponse("Failed to delete identifier", 500)
    }

    return successResponse({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("DELETE /api/birds/[id]/identifiers error:", error)
    return errorResponse("Internal server error", 500)
  }
}
