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

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Get upcoming vaccinations (next 30 days)
    const upcomingVaccinations = await prisma.vaccination.findMany({
      where: {
        nextDueDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        birds: true,
      },
      orderBy: { nextDueDate: "asc" },
      take: 10,
    })

    // Get active health incidents
    const activeIncidents = await prisma.healthIncident.findMany({
      where: {
        outcome: "ONGOING",
      },
      include: {
        birds: true,
      },
      orderBy: { dateNoticed: "desc" },
      take: 10,
    })

    // Get recent vaccinations (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentVaccinations = await prisma.vaccination.findMany({
      where: {
        dateGiven: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        birds: true,
      },
      orderBy: { dateGiven: "desc" },
      take: 10,
    })

    return NextResponse.json({
      upcomingVaccinations: upcomingVaccinations.map((v) => ({
        id: v.id,
        vaccineName: v.vaccineName,
        nextDueDate: v.nextDueDate,
        birdCount: v.birds.length,
      })),
      activeIncidents: activeIncidents.map((i) => ({
        id: i.id,
        dateNoticed: i.dateNoticed,
        symptoms: i.symptoms,
        outcome: i.outcome,
        birdCount: i.birds.length,
      })),
      recentVaccinations: recentVaccinations.map((v) => ({
        id: v.id,
        vaccineName: v.vaccineName,
        dateGiven: v.dateGiven,
        birdCount: v.birds.length,
      })),
    })
  } catch (error) {
    console.error("Failed to fetch health summary:", error)
    return NextResponse.json({ error: "Failed to fetch health summary" }, { status: 500 })
  }
}
