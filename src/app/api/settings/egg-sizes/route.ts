import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

export async function GET() {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { data: categories, error } = await supabase
      .from('egg_size_categories')
      .select()
      .order('min_weight_g', { ascending: true })

    if (error) {
      console.error("GET /api/settings/egg-sizes error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("GET /api/settings/egg-sizes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const body = await req.json()
    const { name, nameTl, minWeightG, maxWeightG } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: category, error } = await supabase
      .from('egg_size_categories')
      .insert({
        name,
        name_tl: nameTl || null,
        min_weight_g: minWeightG ? parseFloat(minWeightG) : null,
        max_weight_g: maxWeightG ? parseFloat(maxWeightG) : null,
      })
      .select()
      .single()

    if (error) {
      console.error("POST /api/settings/egg-sizes error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("POST /api/settings/egg-sizes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
