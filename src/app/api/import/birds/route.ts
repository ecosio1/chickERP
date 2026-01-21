import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"
import { z } from "zod"

const importBirdSchema = z.object({
  name: z.string().optional(),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  hatchDate: z.string(),
  sireId: z.string().optional(),
  damId: z.string().optional(),
  legBandNumber: z.string().optional(),
  legBandColor: z.string().optional(),
  wingBand: z.string().optional(),
  breedCode: z.string().optional(),
  breedPercentage: z.number().optional(),
})

const importSchema = z.object({
  birds: z.array(importBirdSchema),
  dryRun: z.boolean().optional(), // If true, validate only, don't insert
})

// POST /api/import/birds - Import birds from CSV data
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    if (session.user.role !== "OWNER") {
      return errorResponse("Only owners can import data", 403)
    }

    const body = await req.json()
    const data = importSchema.parse(body)

    const results = {
      total: data.birds.length,
      valid: 0,
      invalid: 0,
      errors: [] as { row: number; message: string }[],
      created: [] as string[],
    }

    // Build a map of existing birds by identifier for parent lookups
    const existingBirds = await prisma.bird.findMany({
      include: { identifiers: true },
    })

    const birdByIdentifier = new Map<string, string>()
    existingBirds.forEach((bird) => {
      bird.identifiers.forEach((id) => {
        birdByIdentifier.set(`${id.idType}:${id.idValue}`, bird.id)
      })
    })

    // Get breeds for composition
    const breeds = await prisma.breed.findMany()
    const breedByCode = new Map(breeds.map((b) => [b.code, b.id]))

    // Validate each bird
    for (let i = 0; i < data.birds.length; i++) {
      const bird = data.birds[i]
      const rowNum = i + 1

      try {
        // Validate hatch date
        const hatchDate = new Date(bird.hatchDate)
        if (isNaN(hatchDate.getTime())) {
          results.errors.push({ row: rowNum, message: "Invalid hatch date" })
          results.invalid++
          continue
        }

        // Look up parent IDs if provided
        let sireId: string | undefined
        let damId: string | undefined

        if (bird.sireId) {
          // Try to find by ID or identifier
          const sire = existingBirds.find((b) => b.id === bird.sireId) ||
            existingBirds.find((b) => b.identifiers.some((id) => id.idValue === bird.sireId))
          if (!sire) {
            results.errors.push({ row: rowNum, message: `Father not found: ${bird.sireId}` })
            results.invalid++
            continue
          }
          if (sire.sex !== "MALE") {
            results.errors.push({ row: rowNum, message: `Father must be male: ${bird.sireId}` })
            results.invalid++
            continue
          }
          sireId = sire.id
        }

        if (bird.damId) {
          const dam = existingBirds.find((b) => b.id === bird.damId) ||
            existingBirds.find((b) => b.identifiers.some((id) => id.idValue === bird.damId))
          if (!dam) {
            results.errors.push({ row: rowNum, message: `Mother not found: ${bird.damId}` })
            results.invalid++
            continue
          }
          if (dam.sex !== "FEMALE") {
            results.errors.push({ row: rowNum, message: `Mother must be female: ${bird.damId}` })
            results.invalid++
            continue
          }
          damId = dam.id
        }

        // Check for duplicate identifiers
        if (bird.legBandNumber) {
          const existing = birdByIdentifier.get(`LEG_NUMBER:${bird.legBandNumber}`)
          if (existing) {
            results.errors.push({ row: rowNum, message: `Leg band number already exists: ${bird.legBandNumber}` })
            results.invalid++
            continue
          }
        }

        results.valid++

        // If not dry run, create the bird
        if (!data.dryRun) {
          // Build breed composition
          let breedComposition: { breedId: string; percentage: number }[] = []
          if (bird.breedCode && breedByCode.has(bird.breedCode)) {
            breedComposition = [{
              breedId: breedByCode.get(bird.breedCode)!,
              percentage: bird.breedPercentage || 100,
            }]
          }

          const newBird = await prisma.bird.create({
            data: {
              name: bird.name,
              sex: bird.sex,
              hatchDate,
              sireId,
              damId,
              breedComposition,
              createdById: session.user.id,
              identifiers: {
                create: [
                  ...(bird.legBandNumber ? [{ idType: "LEG_NUMBER", idValue: bird.legBandNumber }] : []),
                  ...(bird.legBandColor ? [{ idType: "LEG_COLOR", idValue: bird.legBandColor }] : []),
                  ...(bird.wingBand ? [{ idType: "WING_BAND", idValue: bird.wingBand }] : []),
                ],
              },
            },
          })

          results.created.push(newBird.id)

          // Add to lookup map for subsequent rows
          if (bird.legBandNumber) {
            birdByIdentifier.set(`LEG_NUMBER:${bird.legBandNumber}`, newBird.id)
          }
        }
      } catch (err) {
        results.errors.push({ row: rowNum, message: `Error: ${err instanceof Error ? err.message : "Unknown"}` })
        results.invalid++
      }
    }

    return successResponse({
      dryRun: data.dryRun || false,
      results,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("POST /api/import/birds error:", error)
    return errorResponse("Internal server error", 500)
  }
}
