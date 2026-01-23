import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { z } from "zod"

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
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
