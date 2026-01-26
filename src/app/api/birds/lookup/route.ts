import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { successResponse, errorResponse } from "@/lib/api-utils"

// GET /api/birds/lookup?rfid={tagId} - Find bird by RFID tag ID
// This is a public endpoint (no auth required) for NFC scanning
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rfid = searchParams.get("rfid")
    const supabase = await createClient()

    if (!rfid) {
      return errorResponse("RFID tag ID required", 400)
    }

    // Find bird by RFID identifier
    const { data: identifier, error } = await supabase
      .from('bird_identifiers')
      .select(`
        *,
        bird:birds(
          id,
          name,
          sex,
          status,
          identifiers:bird_identifiers(id_type, id_value)
        )
      `)
      .eq('id_type', 'RFID')
      .eq('id_value', rfid)
      .single()

    if (error || !identifier) {
      return errorResponse("Bird not found for this tag", 404)
    }

    return successResponse({
      id: identifier.bird.id,
      name: identifier.bird.name,
      sex: identifier.bird.sex,
      status: identifier.bird.status,
      displayId: identifier.bird.identifiers[0]?.id_value || identifier.bird.name || identifier.bird.id.slice(-6),
    })
  } catch (error) {
    console.error("GET /api/birds/lookup error:", error)
    return errorResponse("Internal server error", 500)
  }
}
