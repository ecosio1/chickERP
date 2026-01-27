import { vi, beforeAll, afterAll, beforeEach } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'

// Track test state
let testUserId: string | null = null
let testBirdId: string | null = null

export const getTestState = () => ({
  testUserId,
  testBirdId,
})

export const setTestState = (state: { testUserId?: string; testBirdId?: string }) => {
  if (state.testUserId !== undefined) testUserId = state.testUserId
  if (state.testBirdId !== undefined) testBirdId = state.testBirdId
}

// Global test timeout
vi.setConfig({ testTimeout: 30000 })

beforeAll(() => {
  console.log('Starting Supabase Migration Tests...')
})

afterAll(() => {
  console.log('Tests completed.')
})
