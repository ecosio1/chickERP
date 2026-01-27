import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const incubationSchema = z.object({
  setDate: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
})

const updateIncubationSchema = z.object({
  actualHatch: z.string().transform((str) => new Date(str)).optional(),
  outcome: z.enum(["PENDING", "HATCHED", "INFERTILE", "DEAD_IN_SHELL", "BROKEN"]).optional(),
  chickId: z.string().optional(),
  notes: z.string().optional(),
})

// POST /api/eggs/[id]/incubation - Start incubation for an egg
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const { id: eggRecordId } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can manage incubation", 403)
    }

    const body = await req.json()
    const data = incubationSchema.parse(body)

    // Check if egg exists
    const { data: egg, error: eggError } = await supabase
      .from('egg_records')
      .select('id')
      .eq('id', eggRecordId)
      .single()

    if (eggError || !egg) {
      return errorResponse("Egg record not found", 404)
    }

    // Check if already in incubation
    const { data: existingIncubation } = await supabase
      .from('incubation_records')
      .select('id')
      .eq('egg_record_id', eggRecordId)
      .single()

    if (existingIncubation) {
      return errorResponse("This egg is already in incubation", 400)
    }

    // Calculate expected hatch date (21 days for chickens)
    const expectedHatch = new Date(data.setDate)
    expectedHatch.setDate(expectedHatch.getDate() + 21)

    const { data: incubation, error: incubationError } = await supabase
      .from('incubation_records')
      .insert({
        egg_record_id: eggRecordId,
        set_date: data.setDate.toISOString(),
        expected_hatch: expectedHatch.toISOString(),
        notes: data.notes,
      })
      .select(`
        *,
        egg_record:egg_records(
          *,
          bird:birds(id, name)
        )
      `)
      .single()

    if (incubationError || !incubation) {
      console.error("POST /api/eggs/[id]/incubation error:", incubationError)
      return errorResponse("Failed to create incubation record", 500)
    }

    return successResponse(incubation, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/eggs/[id]/incubation error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// PUT /api/eggs/[id]/incubation - Update incubation outcome
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const supabase = await createClient()
    const { id: eggRecordId } = await params

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can manage incubation", 403)
    }

    const body = await req.json()
    const data = updateIncubationSchema.parse(body)

    // Find incubation record by egg_record_id
    const { data: incubation, error: findError } = await supabase
      .from('incubation_records')
      .select('id')
      .eq('egg_record_id', eggRecordId)
      .single()

    if (findError || !incubation) {
      return errorResponse("Incubation record not found", 404)
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (data.actualHatch !== undefined) updateData.actual_hatch = data.actualHatch.toISOString()
    if (data.outcome !== undefined) updateData.outcome = data.outcome
    if (data.chickId !== undefined) updateData.chick_id = data.chickId
    if (data.notes !== undefined) updateData.notes = data.notes

    const { data: updated, error: updateError } = await supabase
      .from('incubation_records')
      .update(updateData)
      .eq('id', incubation.id)
      .select(`
        *,
        egg_record:egg_records(
          *,
          bird:birds(id, name)
        ),
        chick:birds(id, name)
      `)
      .single()

    if (updateError || !updated) {
      console.error("PUT /api/eggs/[id]/incubation error:", updateError)
      return errorResponse("Failed to update incubation record", 500)
    }

    return successResponse(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("PUT /api/eggs/[id]/incubation error:", error)
    return errorResponse("Internal server error", 500)
  }
}
