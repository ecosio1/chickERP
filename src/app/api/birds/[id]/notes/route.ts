import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
})

// GET /api/birds/[id]/notes - Get notes for bird
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id: birdId } = await params
    const supabase = await createClient()

    const { data: notes, error } = await supabase
      .from('bird_notes')
      .select(`
        *,
        created_by:profiles!bird_notes_created_by_fkey(id, name)
      `)
      .eq('bird_id', birdId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Get notes error:", error)
      return errorResponse("Failed to fetch notes", 500)
    }

    return successResponse(notes || [])
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/birds/[id]/notes error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/birds/[id]/notes - Add note to bird
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id: birdId } = await params
    const supabase = await createClient()

    const body = await req.json()
    const data = noteSchema.parse(body)

    // Check if bird exists
    const { data: bird, error: birdError } = await supabase
      .from('birds')
      .select('id')
      .eq('id', birdId)
      .single()

    if (birdError || !bird) {
      return errorResponse("Bird not found", 404)
    }

    const { data: note, error: createError } = await supabase
      .from('bird_notes')
      .insert({
        bird_id: birdId,
        content: data.content,
        created_by: session.user.id,
      })
      .select(`
        *,
        created_by:profiles!bird_notes_created_by_fkey(id, name)
      `)
      .single()

    if (createError) {
      console.error("Create note error:", createError)
      return errorResponse("Failed to create note", 500)
    }

    return successResponse(note, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/birds/[id]/notes error:", error)
    return errorResponse("Internal server error", 500)
  }
}
