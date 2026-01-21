import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stages = await prisma.feedStage.findMany({
      orderBy: { minAgeDays: "asc" },
    })

    return NextResponse.json({ stages })
  } catch (error) {
    console.error("GET /api/settings/feed-stages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, nameTl, feedType, minAgeDays, maxAgeDays, notes } = body

    if (!name || !feedType || minAgeDays === undefined) {
      return NextResponse.json({ error: "Name, feed type, and min age are required" }, { status: 400 })
    }

    const stage = await prisma.feedStage.create({
      data: {
        name,
        nameTl: nameTl || null,
        feedType,
        minAgeDays: parseInt(minAgeDays),
        maxAgeDays: maxAgeDays ? parseInt(maxAgeDays) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json(stage, { status: 201 })
  } catch (error) {
    console.error("POST /api/settings/feed-stages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
