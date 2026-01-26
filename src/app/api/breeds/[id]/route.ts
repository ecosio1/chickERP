import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const updateBreedSchema = z.object({
  sourceFarmIds: z.array(z.string()),
})

// DELETE /api/breeds/[id] - Delete a breed
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can delete breeds", 403)
    }

    const { data: breed, error: findError } = await supabase
      .from('breeds')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !breed) {
      return errorResponse("Breed not found", 404)
    }

    const { error: deleteError } = await supabase
      .from('breeds')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error("DELETE /api/breeds/[id] error:", deleteError)
      return errorResponse("Failed to delete breed", 500)
    }

    return successResponse({ message: "Breed deleted" })
  } catch (error) {
    console.error("DELETE /api/breeds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// GET /api/breeds/[id] - Get a single breed
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const { data: breed, error } = await supabase
      .from('breeds')
      .select(`
        *,
        sourceFarms:breed_source_farms(
          sourceFarm:source_farms(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !breed) {
      return errorResponse("Breed not found", 404)
    }

    // Transform to flatten sourceFarms
    const transformed = {
      ...breed,
      sourceFarms: breed.sourceFarms?.map((sf: { sourceFarm: unknown }) => sf.sourceFarm) || [],
    }

    return successResponse(transformed)
  } catch (error) {
    console.error("GET /api/breeds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// PATCH /api/breeds/[id] - Update breed farm links
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can update breeds", 403)
    }

    const { data: breed, error: findError } = await supabase
      .from('breeds')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !breed) {
      return errorResponse("Breed not found", 404)
    }

    const body = await req.json()
    const data = updateBreedSchema.parse(body)

    // Delete existing farm links
    const { error: deleteError } = await supabase
      .from('breed_source_farms')
      .delete()
      .eq('breed_id', id)

    if (deleteError) {
      console.error("Delete breed farm links error:", deleteError)
      return errorResponse("Failed to update breed", 500)
    }

    // Create new farm links
    if (data.sourceFarmIds.length > 0) {
      const { error: insertError } = await supabase
        .from('breed_source_farms')
        .insert(data.sourceFarmIds.map((farmId) => ({
          breed_id: id,
          source_farm_id: farmId,
        })))

      if (insertError) {
        console.error("Create breed farm links error:", insertError)
        return errorResponse("Failed to update breed", 500)
      }
    }

    // Fetch updated breed
    const { data: updatedBreed } = await supabase
      .from('breeds')
      .select(`
        *,
        sourceFarms:breed_source_farms(
          sourceFarm:source_farms(*)
        )
      `)
      .eq('id', id)
      .single()

    const transformed = {
      ...updatedBreed,
      sourceFarms: updatedBreed?.sourceFarms?.map((sf: { sourceFarm: unknown }) => sf.sourceFarm) || [],
    }

    return successResponse(transformed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    console.error("PATCH /api/breeds/[id] error:", error)
    return errorResponse("Internal server error", 500)
  }
}
