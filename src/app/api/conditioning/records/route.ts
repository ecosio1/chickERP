import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

export async function GET(req: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const birdId = searchParams.get("birdId")

    const supabase = await createClient()

    let query = supabase
      .from('exercise_records')
      .select(`
        *,
        bird:birds (
          id,
          name,
          identifiers:bird_identifiers (
            id_type,
            id_value
          )
        ),
        exercise_type:exercise_types (
          id,
          name,
          name_tl
        )
      `)
      .order('date', { ascending: false })
      .limit(limit)

    if (birdId) {
      query = query.eq('bird_id', birdId)
    }

    const { data: records, error } = await query

    if (error) {
      console.error("Failed to fetch exercise records:", error)
      return NextResponse.json({ error: "Failed to fetch exercise records" }, { status: 500 })
    }

    return NextResponse.json({ records })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch exercise records:", error)
    return NextResponse.json({ error: "Failed to fetch exercise records" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth()

    const body = await req.json()
    const { birdId, exerciseTypeId, date, durationMinutes, intensity, notes } = body

    if (!birdId || !exerciseTypeId || !date) {
      return NextResponse.json({ error: "Bird, exercise type, and date are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify bird exists
    const { data: bird, error: birdError } = await supabase
      .from('birds')
      .select('id')
      .eq('id', birdId)
      .single()

    if (birdError || !bird) {
      return NextResponse.json({ error: "Bird not found" }, { status: 404 })
    }

    // Verify exercise type exists
    const { data: exerciseType, error: typeError } = await supabase
      .from('exercise_types')
      .select('id')
      .eq('id', exerciseTypeId)
      .single()

    if (typeError || !exerciseType) {
      return NextResponse.json({ error: "Exercise type not found" }, { status: 404 })
    }

    const { data: record, error } = await supabase
      .from('exercise_records')
      .insert({
        bird_id: birdId,
        exercise_type_id: exerciseTypeId,
        date: new Date(date).toISOString(),
        duration_minutes: durationMinutes || null,
        intensity: intensity || null,
        notes: notes || null,
      })
      .select(`
        *,
        bird:birds (
          id,
          name,
          identifiers:bird_identifiers (
            id_type,
            id_value
          )
        ),
        exercise_type:exercise_types (
          id,
          name,
          name_tl
        )
      `)
      .single()

    if (error) {
      console.error("Failed to create exercise record:", error)
      return NextResponse.json({ error: "Failed to create exercise record" }, { status: 500 })
    }

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to create exercise record:", error)
    return NextResponse.json({ error: "Failed to create exercise record" }, { status: 500 })
  }
}
