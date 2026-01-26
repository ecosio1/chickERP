import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

export async function GET() {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: types, error } = await supabase
      .from('exercise_types')
      .select()
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error("Failed to fetch exercise types:", error)
      return NextResponse.json({ error: "Failed to fetch exercise types" }, { status: 500 })
    }

    return NextResponse.json({ types })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch exercise types:", error)
    return NextResponse.json({ error: "Failed to fetch exercise types" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, nameTl, description } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the highest sort order
    const { data: lastType } = await supabase
      .from('exercise_types')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = (lastType?.sort_order || 0) + 1

    const { data: exerciseType, error } = await supabase
      .from('exercise_types')
      .insert({
        name,
        name_tl: nameTl || null,
        description: description || null,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create exercise type:", error)
      return NextResponse.json({ error: "Failed to create exercise type" }, { status: 500 })
    }

    return NextResponse.json(exerciseType, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to create exercise type:", error)
    return NextResponse.json({ error: "Failed to create exercise type" }, { status: 500 })
  }
}
