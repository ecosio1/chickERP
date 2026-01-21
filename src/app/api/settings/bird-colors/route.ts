import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const colors = await prisma.birdColor.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ colors })
  } catch (error) {
    console.error("Error fetching bird colors:", error)
    return NextResponse.json(
      { error: "Failed to fetch bird colors" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, nameTl, hexCode, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Color name is required" },
        { status: 400 }
      )
    }

    // Check for duplicate
    const existing = await prisma.birdColor.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A color with this name already exists" },
        { status: 400 }
      )
    }

    const color = await prisma.birdColor.create({
      data: {
        name: name.trim(),
        nameTl: nameTl?.trim() || null,
        hexCode: hexCode?.trim() || null,
        description: description?.trim() || null,
      },
    })

    return NextResponse.json(color, { status: 201 })
  } catch (error) {
    console.error("Error creating bird color:", error)
    return NextResponse.json(
      { error: "Failed to create bird color" },
      { status: 500 }
    )
  }
}
