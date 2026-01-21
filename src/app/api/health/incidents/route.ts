import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const outcome = searchParams.get("outcome")

    const incidents = await prisma.healthIncident.findMany({
      where: {
        ...(outcome && { outcome: outcome as "RECOVERED" | "ONGOING" | "DECEASED" }),
      },
      include: {
        birds: {
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
          },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        medications: true,
      },
      orderBy: { dateNoticed: "desc" },
    })

    return NextResponse.json({ incidents })
  } catch (error) {
    console.error("GET /api/health/incidents error:", error)
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
    const { birdIds, dateNoticed, symptoms, diagnosis, treatment, outcome, notes } = body

    if (!birdIds || birdIds.length === 0) {
      return NextResponse.json({ error: "At least one bird is required" }, { status: 400 })
    }

    if (!symptoms) {
      return NextResponse.json({ error: "Symptoms are required" }, { status: 400 })
    }

    // Verify all birds exist
    const birds = await prisma.bird.findMany({
      where: { id: { in: birdIds } },
    })

    if (birds.length !== birdIds.length) {
      return NextResponse.json({ error: "One or more birds not found" }, { status: 404 })
    }

    const incident = await prisma.healthIncident.create({
      data: {
        dateNoticed: new Date(dateNoticed || new Date()),
        symptoms,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        outcome: outcome || "ONGOING",
        notes: notes || null,
        reportedById: session.user.id,
        birds: {
          create: birdIds.map((birdId: string) => ({
            birdId,
          })),
        },
      },
      include: {
        birds: {
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
          },
        },
      },
    })

    return NextResponse.json(incident, { status: 201 })
  } catch (error) {
    console.error("POST /api/health/incidents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
