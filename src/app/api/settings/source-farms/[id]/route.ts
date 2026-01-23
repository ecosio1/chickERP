import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/settings/source-farms/[id] - Delete a source farm
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only owners can delete source farms" }, { status: 403 })
    }

    const { id } = await params

    const farm = await prisma.sourceFarm.findUnique({ where: { id } })
    if (!farm) {
      return NextResponse.json({ error: "Source farm not found" }, { status: 404 })
    }

    await prisma.sourceFarm.delete({ where: { id } })

    return NextResponse.json({ message: "Source farm deleted" })
  } catch (error) {
    console.error("DELETE /api/settings/source-farms/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
