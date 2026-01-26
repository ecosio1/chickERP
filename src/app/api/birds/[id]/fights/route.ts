import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    const { data: fights, error } = await supabase
      .from('fight_records')
      .select('*')
      .eq('bird_id', id)
      .order('date', { ascending: false })

    if (error) {
      console.error("Failed to fetch fight records:", error)
      return NextResponse.json({ error: "Failed to fetch fight records" }, { status: 500 })
    }

    return NextResponse.json({ fights: fights || [] })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch fight records:", error)
    return NextResponse.json({ error: "Failed to fetch fight records" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    const body = await req.json()
    const { date, outcome, location, notes } = body

    if (!date || !outcome) {
      return NextResponse.json({ error: "Date and outcome are required" }, { status: 400 })
    }

    if (!["WIN", "LOSS", "DRAW"].includes(outcome)) {
      return NextResponse.json({ error: "Invalid outcome. Must be WIN, LOSS, or DRAW" }, { status: 400 })
    }

    // Verify bird exists
    const { data: bird, error: birdError } = await supabase
      .from('birds')
      .select('id')
      .eq('id', id)
      .single()

    if (birdError || !bird) {
      return NextResponse.json({ error: "Bird not found" }, { status: 404 })
    }

    const { data: fight, error: createError } = await supabase
      .from('fight_records')
      .insert({
        bird_id: id,
        date: new Date(date).toISOString(),
        outcome,
        location: location || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (createError) {
      console.error("Failed to create fight record:", createError)
      return NextResponse.json({ error: "Failed to create fight record" }, { status: 500 })
    }

    return NextResponse.json(fight, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to create fight record:", error)
    return NextResponse.json({ error: "Failed to create fight record" }, { status: 500 })
  }
}
