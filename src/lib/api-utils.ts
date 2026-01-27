import { NextResponse } from "next/server"
import { createClient } from "./supabase/server"
import { z } from "zod"

export type Session = {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export async function getSession(): Promise<Session | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email!,
      name: profile?.name || user.email!.split('@')[0],
      role: profile?.role || 'WORKER',
    }
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}

// Format Zod validation errors with field names
export function formatZodError(error: z.ZodError): string {
  const firstError = error.errors[0]
  const field = firstError.path.join(".")
  return field ? `${field}: ${firstError.message}` : firstError.message
}

// Handle common API errors consistently
export function handleApiError(error: unknown, context: string) {
  if (error instanceof z.ZodError) {
    return errorResponse(formatZodError(error), 400)
  }
  if (error instanceof Error && error.message === "Unauthorized") {
    return errorResponse("Unauthorized", 401)
  }
  console.error(`${context} error:`, error)
  return errorResponse("Internal server error", 500)
}
