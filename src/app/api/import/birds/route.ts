import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, errorResponse, successResponse, handleApiError } from "@/lib/api-utils"
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
  breedName: z.string().optional(), // For auto-creating breeds
  breedPercentage: z.number().optional(),
  coopName: z.string().optional(), // For auto-creating/assigning coops
  color: z.string().optional(),
})

const importSchema = z.object({
  birds: z.array(importBirdSchema),
  dryRun: z.boolean().optional(), // If true, validate only, don't insert
  autoCreate: z.boolean().optional(), // If true, auto-create missing breeds/coops
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
      autoCreated: {
        breeds: [] as { code: string; name: string }[],
        coops: [] as { name: string }[],
      },
      wouldAutoCreate: {
        breeds: [] as { code: string; name: string }[],
        coops: [] as { name: string }[],
      },
    }

    const autoCreate = data.autoCreate ?? true // Default to auto-create
    const isDryRun = data.dryRun ?? false

    // Track what would be created during dry run (to avoid duplicates in the list)
    const pendingBreeds = new Set<string>()
    const pendingCoops = new Set<string>()

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
    const breedByName = new Map(breeds.map((b) => [b.name.toLowerCase(), b.id]))

    // Get coops
    const coops = await prisma.coop.findMany()
    const coopByName = new Map(coops.map((c) => [c.name.toLowerCase(), c.id]))

    // Helper to generate breed code from name
    const generateBreedCode = (name: string): string => {
      const words = name.trim().split(/\s+/)
      if (words.length === 1) {
        return name.substring(0, 4).toUpperCase()
      }
      return words.map(w => w[0]).join("").toUpperCase().substring(0, 6)
    }

    // Helper to get or create breed
    const getOrCreateBreed = async (code: string | undefined, name: string | undefined, forDryRun = false): Promise<string | null> => {
      if (!code && !name) return null

      // Try to find by code first
      if (code) {
        const existingId = breedByCode.get(code.toUpperCase())
        if (existingId) return existingId
      }

      // Try to find by name
      if (name) {
        const existingId = breedByName.get(name.toLowerCase())
        if (existingId) return existingId
      }

      // Auto-create if enabled and we have a name
      if (autoCreate && name) {
        const newCode = code?.toUpperCase() || generateBreedCode(name)

        // Check if generated code already exists
        let finalCode = newCode
        let counter = 1
        while (breedByCode.has(finalCode)) {
          finalCode = `${newCode}${counter}`
          counter++
        }

        // If dry run, just track what would be created
        if (forDryRun || isDryRun) {
          const key = name.toLowerCase()
          if (!pendingBreeds.has(key)) {
            pendingBreeds.add(key)
            results.wouldAutoCreate.breeds.push({ code: finalCode, name: name })
          }
          return "pending"
        }

        const newBreed = await prisma.breed.create({
          data: {
            name: name,
            code: finalCode,
            varieties: [],
          },
        })

        breedByCode.set(finalCode, newBreed.id)
        breedByName.set(name.toLowerCase(), newBreed.id)
        results.autoCreated.breeds.push({ code: finalCode, name: name })

        return newBreed.id
      }

      return null
    }

    // Helper to get or create coop
    const getOrCreateCoop = async (name: string | undefined, forDryRun = false): Promise<string | null> => {
      if (!name) return null

      const existingId = coopByName.get(name.toLowerCase())
      if (existingId) return existingId

      // Auto-create if enabled
      if (autoCreate) {
        // If dry run, just track what would be created
        if (forDryRun || isDryRun) {
          const key = name.toLowerCase()
          if (!pendingCoops.has(key)) {
            pendingCoops.add(key)
            results.wouldAutoCreate.coops.push({ name: name })
          }
          return "pending"
        }

        const newCoop = await prisma.coop.create({
          data: {
            name: name,
            capacity: 20, // Default capacity
            coopType: "GROW_OUT", // Default type
            status: "ACTIVE",
          },
        })

        coopByName.set(name.toLowerCase(), newCoop.id)
        results.autoCreated.coops.push({ name: name })

        return newCoop.id
      }

      return null
    }

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

        // For dry run, track what would be auto-created
        if (isDryRun) {
          await getOrCreateBreed(bird.breedCode, bird.breedName, true)
          await getOrCreateCoop(bird.coopName, true)
          continue
        }

        // Create the bird
        // Build breed composition (auto-create breed if needed)
        let breedComposition: { breedId: string; percentage: number }[] = []
        const breedId = await getOrCreateBreed(bird.breedCode, bird.breedName)
        if (breedId) {
          breedComposition = [{
            breedId,
            percentage: bird.breedPercentage || 100,
          }]
        }

        // Get or create coop
        const coopId = await getOrCreateCoop(bird.coopName)

        const newBird = await prisma.bird.create({
          data: {
            name: bird.name,
            sex: bird.sex,
            hatchDate,
            sireId,
            damId,
            coopId,
            color: bird.color,
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
    return handleApiError(error, "POST /api/import/birds")
  }
}
