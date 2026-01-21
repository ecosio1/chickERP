import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if color is in use
    const birdsUsingColor = await prisma.bird.count({
      where: { colorId: id },
    })

    if (birdsUsingColor > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${birdsUsingColor} birds are using this color` },
        { status: 400 }
      )
    }

    await prisma.birdColor.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bird color:", error)
    return NextResponse.json(
      { error: "Failed to delete bird color" },
      { status: 500 }
    )
  }
}
