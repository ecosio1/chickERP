import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-utils"

// GET /api/birds/lookup?rfid={tagId} - Find bird by RFID tag ID
// This is a public endpoint (no auth required) for NFC scanning
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rfid = searchParams.get("rfid")

    if (!rfid) {
      return errorResponse("RFID tag ID required", 400)
    }

    // Find bird by RFID identifier
    const identifier = await prisma.birdIdentifier.findFirst({
      where: {
        idType: "RFID",
        idValue: rfid,
      },
      include: {
        bird: {
          select: {
            id: true,
            name: true,
            sex: true,
            status: true,
            identifiers: {
              select: {
                idType: true,
                idValue: true,
              },
            },
          },
        },
      },
    })

    if (!identifier) {
      return errorResponse("Bird not found for this tag", 404)
    }

    return successResponse({
      id: identifier.bird.id,
      name: identifier.bird.name,
      sex: identifier.bird.sex,
      status: identifier.bird.status,
      displayId: identifier.bird.identifiers[0]?.idValue || identifier.bird.name || identifier.bird.id.slice(-6),
    })
  } catch (error) {
    console.error("GET /api/birds/lookup error:", error)
    return errorResponse("Internal server error", 500)
  }
}
