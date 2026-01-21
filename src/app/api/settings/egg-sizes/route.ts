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

    const categories = await prisma.eggSizeCategory.findMany({
      orderBy: { minWeightG: "asc" },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("GET /api/settings/egg-sizes error:", error)
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
    const { name, nameTl, minWeightG, maxWeightG } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const category = await prisma.eggSizeCategory.create({
      data: {
        name,
        nameTl: nameTl || null,
        minWeightG: minWeightG ? parseFloat(minWeightG) : null,
        maxWeightG: maxWeightG ? parseFloat(maxWeightG) : null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("POST /api/settings/egg-sizes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
