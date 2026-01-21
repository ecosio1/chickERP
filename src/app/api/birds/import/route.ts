import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BirdSex, BirdStatus } from "@prisma/client"

interface ImportRow {
  rowNumber: number
  name: string
  sex: string
  hatchDate: string
  status: string
  coopName: string
  sireName: string
  damName: string
  bandNumber: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { birds } = body as { birds: ImportRow[] }

    if (!birds || !Array.isArray(birds) || birds.length === 0) {
      return NextResponse.json({ error: "No birds data provided" }, { status: 400 })
    }

    // Pre-fetch coops and existing birds for lookup
    const coops = await prisma.coop.findMany({
      select: { id: true, name: true },
    })
    const coopMap = new Map(coops.map((c) => [c.name.toLowerCase(), c.id]))

    // Get all birds for parent matching (by name or band number)
    const existingBirds = await prisma.bird.findMany({
      select: { id: true, name: true },
    })
    const birdByName = new Map(
      existingBirds.filter((b) => b.name).map((b) => [b.name!.toLowerCase(), b.id])
    )

    // Also check identifiers for band numbers
    const identifiers = await prisma.birdIdentifier.findMany({
      where: { type: "BAND" },
      select: { birdId: true, value: true },
    })
    const birdByBand = new Map(identifiers.map((i) => [i.value.toLowerCase(), i.birdId]))

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
    }

    // Process each bird
    for (const row of birds) {
      try {
        // Validate sex
        if (!["MALE", "FEMALE", "UNKNOWN"].includes(row.sex)) {
          results.failed++
          results.errors.push({ row: row.rowNumber, error: `Invalid sex: ${row.sex}` })
          continue
        }

        // Validate date
        const hatchDate = new Date(row.hatchDate)
        if (isNaN(hatchDate.getTime())) {
          results.failed++
          results.errors.push({ row: row.rowNumber, error: `Invalid date: ${row.hatchDate}` })
          continue
        }

        // Map status
        const statusMap: Record<string, BirdStatus> = {
          ACTIVE: BirdStatus.ACTIVE,
          SOLD: BirdStatus.SOLD,
          DECEASED: BirdStatus.DECEASED,
          CULLED: BirdStatus.CULLED,
          LOST: BirdStatus.LOST,
          BREEDING: BirdStatus.BREEDING,
          RETIRED: BirdStatus.RETIRED,
        }
        const status = statusMap[row.status] || BirdStatus.ACTIVE

        // Look up coop
        let coopId: string | null = null
        if (row.coopName) {
          coopId = coopMap.get(row.coopName.toLowerCase()) || null
          if (!coopId) {
            results.failed++
            results.errors.push({
              row: row.rowNumber,
              error: `Coop not found: ${row.coopName}`,
            })
            continue
          }
        }

        // Look up sire
        let sireId: string | null = null
        if (row.sireName) {
          sireId =
            birdByName.get(row.sireName.toLowerCase()) ||
            birdByBand.get(row.sireName.toLowerCase()) ||
            null
          if (!sireId) {
            results.failed++
            results.errors.push({
              row: row.rowNumber,
              error: `Sire not found: ${row.sireName}`,
            })
            continue
          }
        }

        // Look up dam
        let damId: string | null = null
        if (row.damName) {
          damId =
            birdByName.get(row.damName.toLowerCase()) ||
            birdByBand.get(row.damName.toLowerCase()) ||
            null
          if (!damId) {
            results.failed++
            results.errors.push({
              row: row.rowNumber,
              error: `Dam not found: ${row.damName}`,
            })
            continue
          }
        }

        // Create bird
        const bird = await prisma.bird.create({
          data: {
            name: row.name || null,
            sex: row.sex as BirdSex,
            hatchDate,
            status,
            coopId,
            sireId,
            damId,
            createdById: session.user.id,
          },
        })

        // Add band number identifier if provided
        if (row.bandNumber) {
          await prisma.birdIdentifier.create({
            data: {
              birdId: bird.id,
              type: "BAND",
              value: row.bandNumber,
            },
          })

          // Add to lookup map for subsequent rows
          birdByBand.set(row.bandNumber.toLowerCase(), bird.id)
        }

        // Add name to lookup for subsequent rows
        if (row.name) {
          birdByName.set(row.name.toLowerCase(), bird.id)
        }

        results.success++
      } catch (err) {
        results.failed++
        results.errors.push({
          row: row.rowNumber,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Failed to import birds" },
      { status: 500 }
    )
  }
}
