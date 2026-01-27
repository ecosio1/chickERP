import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

export async function GET() {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { data: stages, error } = await supabase
      .from('feed_stages')
      .select()
      .order('min_age_days', { ascending: true })

    if (error) {
      console.error("GET /api/settings/feed-stages error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ stages })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("GET /api/settings/feed-stages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const body = await req.json()
    const { name, nameTl, feedType, minAgeDays, maxAgeDays, notes } = body

    if (!name || !feedType || minAgeDays === undefined) {
      return NextResponse.json({ error: "Name, feed type, and min age are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: stage, error } = await supabase
      .from('feed_stages')
      .insert({
        name,
        name_tl: nameTl || null,
        feed_type: feedType,
        min_age_days: parseInt(minAgeDays),
        max_age_days: maxAgeDays ? parseInt(maxAgeDays) : null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("POST /api/settings/feed-stages error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json(stage, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("POST /api/settings/feed-stages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
