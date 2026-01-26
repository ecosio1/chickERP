import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

// GET /api/settings/source-farms - List all source farms
export async function GET() {
  try {
    await requireAuth()
    const supabase = await createClient()

    // Get source farms
    const { data: farms, error: farmsError } = await supabase
      .from('source_farms')
      .select('*')
      .order('name', { ascending: true })

    if (farmsError) {
      console.error("GET /api/settings/source-farms error:", farmsError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // Get breed counts for each farm
    const { data: breedCounts, error: countsError } = await supabase
      .from('breed_source_farms')
      .select('source_farm_id')

    if (countsError) {
      console.error("GET /api/settings/source-farms error:", countsError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    // Count breeds per farm
    const countMap = new Map<string, number>()
    breedCounts?.forEach((item) => {
      const farmId = item.source_farm_id
      countMap.set(farmId, (countMap.get(farmId) || 0) + 1)
    })

    // Add _count to farms
    const farmsWithCount = farms?.map((farm) => ({
      ...farm,
      _count: {
        breeds: countMap.get(farm.id) || 0,
      },
    }))

    return NextResponse.json({ farms: farmsWithCount })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("GET /api/settings/source-farms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/settings/source-farms - Create a new source farm
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only owners can add source farms" }, { status: 403 })
    }

    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Farm name is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check for duplicate name
    const { data: existing, error: checkError } = await supabase
      .from('source_farms')
      .select()
      .eq('name', name.trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected
      console.error("POST /api/settings/source-farms error:", checkError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ error: "A farm with this name already exists" }, { status: 400 })
    }

    const { data: farm, error: insertError } = await supabase
      .from('source_farms')
      .insert({
        name: name.trim(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("POST /api/settings/source-farms error:", insertError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ farm }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("POST /api/settings/source-farms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
