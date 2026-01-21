import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fights = await prisma.fightRecord.findMany({
      where: { birdId: params.id },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({ fights })
  } catch (error) {
    console.error("Failed to fetch fight records:", error)
    return NextResponse.json({ error: "Failed to fetch fight records" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { date, outcome, location, notes } = body

    if (!date || !outcome) {
      return NextResponse.json({ error: "Date and outcome are required" }, { status: 400 })
    }

    if (!["WIN", "LOSS", "DRAW"].includes(outcome)) {
      return NextResponse.json({ error: "Invalid outcome. Must be WIN, LOSS, or DRAW" }, { status: 400 })
    }

    // Verify bird exists
    const bird = await prisma.bird.findUnique({ where: { id: params.id } })
    if (!bird) {
      return NextResponse.json({ error: "Bird not found" }, { status: 404 })
    }

    const fight = await prisma.fightRecord.create({
      data: {
        birdId: params.id,
        date: new Date(date),
        outcome,
        location: location || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(fight, { status: 201 })
  } catch (error) {
    console.error("Failed to create fight record:", error)
    return NextResponse.json({ error: "Failed to create fight record" }, { status: 500 })
  }
}
