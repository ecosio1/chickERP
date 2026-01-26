import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth, errorResponse, successResponse } from "@/lib/api-utils"

// GET /api/birds/search - Fast bird lookup by any identifier
export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")

    if (!q || q.length < 1) {
      return successResponse([])
    }

    // Search across name - Supabase ilike for case-insensitive search
    const { data: birdsByName, error: nameError } = await supabase
      .from('birds')
      .select(`
        *,
        identifiers:bird_identifiers(*),
        photos:bird_photos(*),
        coop:coops(id, name)
      `)
      .ilike('name', `%${q}%`)
      .order('status', { ascending: true })
      .order('name', { ascending: true })
      .limit(20)

    if (nameError) {
      console.error("Search by name error:", nameError)
    }

    // Search by identifier values
    const { data: identifierMatches, error: idError } = await supabase
      .from('bird_identifiers')
      .select('bird_id')
      .ilike('id_value', `%${q}%`)
      .limit(20)

    if (idError) {
      console.error("Search by identifier error:", idError)
    }

    // Get birds matching identifiers (if any)
    let birdsByIdentifier: typeof birdsByName = []
    if (identifierMatches && identifierMatches.length > 0) {
      const birdIds = identifierMatches.map(i => i.bird_id)
      const { data: birds } = await supabase
        .from('birds')
        .select(`
          *,
          identifiers:bird_identifiers(*),
          photos:bird_photos(*),
          coop:coops(id, name)
        `)
        .in('id', birdIds)
        .order('status', { ascending: true })
        .order('name', { ascending: true })

      birdsByIdentifier = birds || []
    }

    // Combine and deduplicate results
    const allBirds = [...(birdsByName || []), ...birdsByIdentifier]
    const uniqueBirds = allBirds.filter((bird, index, self) =>
      index === self.findIndex(b => b.id === bird.id)
    ).slice(0, 20)

    // Format for quick display
    const results = uniqueBirds.map((bird) => {
      // Get primary photo
      const primaryPhoto = bird.photos?.find((p: { is_primary: boolean }) => p.is_primary) || bird.photos?.[0]

      return {
        id: bird.id,
        name: bird.name,
        sex: bird.sex,
        status: bird.status,
        hatchDate: bird.hatch_date,
        photoUrl: primaryPhoto?.url || null,
        coop: bird.coop?.name || null,
        identifiers: bird.identifiers?.map((id: { id_type: string; id_value: string }) => ({
          idType: id.id_type,
          idValue: id.id_value,
        })) || [],
        // Primary display ID (first identifier or name)
        displayId: bird.identifiers?.[0]?.id_value || bird.name || bird.id.slice(-6),
        breedComposition: bird.breed_composition,
      }
    })

    return successResponse(results)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("GET /api/birds/search error:", error)
    return errorResponse("Internal server error", 500)
  }
}
