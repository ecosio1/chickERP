import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/settings/source-farms - List all source farms
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const farms = await prisma.sourceFarm.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { breeds: true },
        },
      },
    })

    return NextResponse.json({ farms })
  } catch (error) {
    console.error("GET /api/settings/source-farms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/settings/source-farms - Create a new source farm
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Only owners can add source farms" }, { status: 403 })
    }

    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Farm name is required" }, { status: 400 })
    }

    // Check for duplicate name
    const existing = await prisma.sourceFarm.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return NextResponse.json({ error: "A farm with this name already exists" }, { status: 400 })
    }

    const farm = await prisma.sourceFarm.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json({ farm }, { status: 201 })
  } catch (error) {
    console.error("POST /api/settings/source-farms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
