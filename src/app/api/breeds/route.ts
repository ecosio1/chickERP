import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const createBreedSchema = z.object({
  name: z.string().min(1, "Breed name is required"),
  code: z.string().min(1, "Breed code is required").max(10),
  description: z.string().nullable().optional(),
  varieties: z.array(z.string()).nullable().optional(),
  sourceFarmIds: z.array(z.string()).nullable().optional(),
})

// GET /api/breeds - List all breeds
export async function GET() {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: breeds, error } = await supabase
      .from('breeds')
      .select(`
        *,
        sourceFarms:breed_source_farms(
          sourceFarm:source_farms(*)
        )
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error("GET /api/breeds error:", error)
      return errorResponse("Failed to fetch breeds", 500)
    }

    // Transform to flatten sourceFarms
    const transformed = (breeds || []).map((breed) => ({
      ...breed,
      sourceFarms: breed.sourceFarms?.map((sf: { sourceFarm: unknown }) => sf.sourceFarm) || [],
    }))

    return successResponse(transformed)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/breeds error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/breeds - Create new breed
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can manage breeds", 403)
    }

    const body = await req.json()
    const data = createBreedSchema.parse(body)

    // Check for duplicates by name
    const { data: existingByName } = await supabase
      .from('breeds')
      .select('id')
      .eq('name', data.name)
      .single()

    if (existingByName) {
      return errorResponse("Breed with this name or code already exists", 400)
    }

    // Check for duplicates by code
    const { data: existingByCode } = await supabase
      .from('breeds')
      .select('id')
      .eq('code', data.code.toUpperCase())
      .single()

    if (existingByCode) {
      return errorResponse("Breed with this name or code already exists", 400)
    }

    // Create breed
    const { data: breed, error: breedError } = await supabase
      .from('breeds')
      .insert({
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        varieties: data.varieties || [],
      })
      .select()
      .single()

    if (breedError || !breed) {
      console.error("Create breed error:", breedError)
      return errorResponse("Failed to create breed", 500)
    }

    // Create source farm links if provided
    if (data.sourceFarmIds && data.sourceFarmIds.length > 0) {
      const { error: linkError } = await supabase
        .from('breed_source_farms')
        .insert(data.sourceFarmIds.map((farmId) => ({
          breed_id: breed.id,
          source_farm_id: farmId,
        })))

      if (linkError) {
        console.error("Create breed farm links error:", linkError)
      }
    }

    // Fetch complete breed with relations
    const { data: completedBreed } = await supabase
      .from('breeds')
      .select(`
        *,
        sourceFarms:breed_source_farms(
          sourceFarm:source_farms(*)
        )
      `)
      .eq('id', breed.id)
      .single()

    // Transform to flatten sourceFarms
    const transformed = {
      ...completedBreed,
      sourceFarms: completedBreed?.sourceFarms?.map((sf: { sourceFarm: unknown }) => sf.sourceFarm) || [],
    }

    return successResponse(transformed, 201)
  } catch (error) {
    return handleApiError(error, "POST /api/breeds")
  }
}
