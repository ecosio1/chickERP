import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

export async function GET() {
  try {
    await requireAuth()
    const supabase = await createClient()
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get upcoming vaccinations (next 30 days)
    const { data: upcomingVaccinations, error: upcomingError } = await supabase
      .from('vaccinations')
      .select(`
        id,
        vaccine_name,
        next_due_date,
        vaccination_birds (bird_id)
      `)
      .gte('next_due_date', now.toISOString())
      .lte('next_due_date', thirtyDaysFromNow.toISOString())
      .order('next_due_date', { ascending: true })
      .limit(10)

    if (upcomingError) {
      console.error("Error fetching upcoming vaccinations:", upcomingError)
    }

    // Get active health incidents
    const { data: activeIncidents, error: activeError } = await supabase
      .from('health_incidents')
      .select(`
        id,
        date_noticed,
        symptoms,
        outcome,
        health_incident_birds (bird_id)
      `)
      .eq('outcome', 'ONGOING')
      .order('date_noticed', { ascending: false })
      .limit(10)

    if (activeError) {
      console.error("Error fetching active incidents:", activeError)
    }

    // Get recent vaccinations (last 30 days)
    const { data: recentVaccinations, error: recentError } = await supabase
      .from('vaccinations')
      .select(`
        id,
        vaccine_name,
        date_given,
        vaccination_birds (bird_id)
      `)
      .gte('date_given', thirtyDaysAgo.toISOString())
      .order('date_given', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error("Error fetching recent vaccinations:", recentError)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({
      upcomingVaccinations: (upcomingVaccinations || []).map((v: any) => ({
        id: v.id,
        vaccineName: v.vaccine_name,
        nextDueDate: v.next_due_date,
        birdCount: v.vaccination_birds?.length || 0,
      })),
      activeIncidents: (activeIncidents || []).map((i: any) => ({
        id: i.id,
        dateNoticed: i.date_noticed,
        symptoms: i.symptoms,
        outcome: i.outcome,
        birdCount: i.health_incident_birds?.length || 0,
      })),
      recentVaccinations: (recentVaccinations || []).map((v: any) => ({
        id: v.id,
        vaccineName: v.vaccine_name,
        dateGiven: v.date_given,
        birdCount: v.vaccination_birds?.length || 0,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch health summary:", error)
    return NextResponse.json({ error: "Failed to fetch health summary" }, { status: 500 })
  }
}
