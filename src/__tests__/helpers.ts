import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Create a test Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const testSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Test user credentials - create a test user for testing
const TEST_EMAIL = 'test-migration@chicktest.local'
const TEST_PASSWORD = 'TestPassword123!'

export interface TestSession {
  access_token: string
  user: {
    id: string
    email: string
  }
}

let cachedSession: TestSession | null = null

/**
 * Get or create a test user session for authenticated API calls
 */
export async function getTestSession(): Promise<TestSession | null> {
  if (cachedSession) return cachedSession

  // Try to sign in first
  const { data: signInData, error: signInError } = await testSupabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (signInData?.session) {
    cachedSession = {
      access_token: signInData.session.access_token,
      user: {
        id: signInData.user!.id,
        email: signInData.user!.email!,
      },
    }
    return cachedSession
  }

  // If sign in fails, try to create the user
  const { data: signUpData, error: signUpError } = await testSupabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    options: {
      data: {
        name: 'Test User',
        role: 'OWNER',
      },
    },
  })

  if (signUpData?.session) {
    cachedSession = {
      access_token: signUpData.session.access_token,
      user: {
        id: signUpData.user!.id,
        email: signUpData.user!.email!,
      },
    }

    // Create profile for the user
    await testSupabase.from('profiles').upsert({
      id: signUpData.user!.id,
      email: signUpData.user!.email!,
      name: 'Test User',
      role: 'OWNER',
    })

    return cachedSession
  }

  console.error('Failed to create test session:', signInError || signUpError)
  return null
}

/**
 * Clear the cached test session
 */
export async function clearTestSession(): Promise<void> {
  cachedSession = null
  await testSupabase.auth.signOut()
}

/**
 * Make an authenticated request to an API route
 */
export async function makeAuthenticatedRequest(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
  } = {}
): Promise<Response> {
  const session = await getTestSession()
  if (!session) {
    throw new Error('No test session available')
  }

  const baseUrl = 'http://localhost:3000'
  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Cookie: `sb-access-token=${session.access_token}`,
  }

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  }

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  return fetch(url, fetchOptions)
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now()
  return {
    birdName: `Test Bird ${timestamp}`,
    breedName: `Test Breed ${timestamp}`,
    coopName: `Test Coop ${timestamp}`,
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData(ids: {
  birdIds?: string[]
  breedIds?: string[]
  coopIds?: string[]
}): Promise<void> {
  const session = await getTestSession()
  if (!session) return

  if (ids.birdIds?.length) {
    await testSupabase.from('birds').delete().in('id', ids.birdIds)
  }
  if (ids.breedIds?.length) {
    await testSupabase.from('breeds').delete().in('id', ids.breedIds)
  }
  if (ids.coopIds?.length) {
    await testSupabase.from('coops').delete().in('id', ids.coopIds)
  }
}
