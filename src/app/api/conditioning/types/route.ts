import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const types = await prisma.exerciseType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ types })
  } catch (error) {
    console.error("Failed to fetch exercise types:", error)
    return NextResponse.json({ error: "Failed to fetch exercise types" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, nameTl, description } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Get the highest sort order
    const lastType = await prisma.exerciseType.findFirst({
      orderBy: { sortOrder: "desc" },
    })
    const sortOrder = (lastType?.sortOrder || 0) + 1

    const exerciseType = await prisma.exerciseType.create({
      data: {
        name,
        nameTl: nameTl || null,
        description: description || null,
        sortOrder,
      },
    })

    return NextResponse.json(exerciseType, { status: 201 })
  } catch (error) {
    console.error("Failed to create exercise type:", error)
    return NextResponse.json({ error: "Failed to create exercise type" }, { status: 500 })
  }
}
