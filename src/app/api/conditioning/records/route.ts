import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const birdId = searchParams.get("birdId")

    const where: Record<string, unknown> = {}
    if (birdId) {
      where.birdId = birdId
    }

    const records = await prisma.exerciseRecord.findMany({
      where,
      include: {
        bird: {
          select: {
            id: true,
            name: true,
            identifiers: {
              select: { idType: true, idValue: true },
            },
          },
        },
        exerciseType: {
          select: {
            id: true,
            name: true,
            nameTl: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: limit,
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Failed to fetch exercise records:", error)
    return NextResponse.json({ error: "Failed to fetch exercise records" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { birdId, exerciseTypeId, date, durationMinutes, intensity, notes } = body

    if (!birdId || !exerciseTypeId || !date) {
      return NextResponse.json({ error: "Bird, exercise type, and date are required" }, { status: 400 })
    }

    // Verify bird exists
    const bird = await prisma.bird.findUnique({ where: { id: birdId } })
    if (!bird) {
      return NextResponse.json({ error: "Bird not found" }, { status: 404 })
    }

    // Verify exercise type exists
    const exerciseType = await prisma.exerciseType.findUnique({ where: { id: exerciseTypeId } })
    if (!exerciseType) {
      return NextResponse.json({ error: "Exercise type not found" }, { status: 404 })
    }

    const record = await prisma.exerciseRecord.create({
      data: {
        birdId,
        exerciseTypeId,
        date: new Date(date),
        durationMinutes: durationMinutes || null,
        intensity: intensity || null,
        notes: notes || null,
      },
      include: {
        bird: {
          select: {
            id: true,
            name: true,
            identifiers: {
              select: { idType: true, idValue: true },
            },
          },
        },
        exerciseType: {
          select: {
            id: true,
            name: true,
            nameTl: true,
          },
        },
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error("Failed to create exercise record:", error)
    return NextResponse.json({ error: "Failed to create exercise record" }, { status: 500 })
  }
}
