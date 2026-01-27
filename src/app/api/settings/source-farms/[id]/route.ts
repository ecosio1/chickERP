import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

// DELETE /api/settings/source-farms/[id] - Delete a source farm
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only owners can delete source farms" }, { status: 403 })
    }

    const { id } = await params

    const supabase = await createClient()

    // Check if farm exists
    const { data: farm, error: findError } = await supabase
      .from('source_farms')
      .select()
      .eq('id', id)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error("DELETE /api/settings/source-farms/[id] error:", findError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    if (!farm) {
      return NextResponse.json({ error: "Source farm not found" }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('source_farms')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error("DELETE /api/settings/source-farms/[id] error:", deleteError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ message: "Source farm deleted" })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("DELETE /api/settings/source-farms/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
