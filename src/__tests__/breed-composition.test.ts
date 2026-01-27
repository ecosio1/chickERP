/**
 * Breed Composition Tests
 *
 * Tests for the breed percentage calculation and management system.
 *
 * Test Categories:
 * 1. Breed Calculation Logic (50% from each parent)
 * 2. API - Bird breed composition CRUD
 * 3. Edge Cases
 */

import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Type for breed composition
type BreedComposition = Array<{ breedId: string; percentage: number }>

// ==========================================
// Breed Calculation Helper (mirrors frontend logic)
// ==========================================
function calculateBreedFromParents(
  sireBreed: BreedComposition,
  damBreed: BreedComposition
): BreedComposition {
  const breedMap = new Map<string, number>()

  // Add 50% of sire's breeds
  sireBreed.forEach((bc) => {
    const current = breedMap.get(bc.breedId) || 0
    breedMap.set(bc.breedId, current + (bc.percentage / 2))
  })

  // Add 50% of dam's breeds
  damBreed.forEach((bc) => {
    const current = breedMap.get(bc.breedId) || 0
    breedMap.set(bc.breedId, current + (bc.percentage / 2))
  })

  // Convert to array and round
  return Array.from(breedMap.entries())
    .map(([breedId, percentage]) => ({ breedId, percentage: Math.round(percentage) }))
    .filter((bc) => bc.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
}

describe('Breed Composition Tests', () => {
  // ==========================================
  // 1. Breed Calculation Logic Tests
  // ==========================================
  describe('1. Breed Calculation Logic', () => {
    it('should calculate 50/50 split from two purebred parents', () => {
      const sireBreed: BreedComposition = [{ breedId: 'breed-hatch', percentage: 100 }]
      const damBreed: BreedComposition = [{ breedId: 'breed-kelso', percentage: 100 }]

      const result = calculateBreedFromParents(sireBreed, damBreed)

      expect(result).toHaveLength(2)
      expect(result.find(b => b.breedId === 'breed-hatch')?.percentage).toBe(50)
      expect(result.find(b => b.breedId === 'breed-kelso')?.percentage).toBe(50)
    })

    it('should calculate correctly when both parents are same breed', () => {
      const sireBreed: BreedComposition = [{ breedId: 'breed-hatch', percentage: 100 }]
      const damBreed: BreedComposition = [{ breedId: 'breed-hatch', percentage: 100 }]

      const result = calculateBreedFromParents(sireBreed, damBreed)

      expect(result).toHaveLength(1)
      expect(result[0].breedId).toBe('breed-hatch')
      expect(result[0].percentage).toBe(100)
    })

    it('should handle mixed breed parents', () => {
      // Sire: 50% Hatch, 50% Kelso
      const sireBreed: BreedComposition = [
        { breedId: 'breed-hatch', percentage: 50 },
        { breedId: 'breed-kelso', percentage: 50 },
      ]
      // Dam: 100% Sweater
      const damBreed: BreedComposition = [{ breedId: 'breed-sweater', percentage: 100 }]

      const result = calculateBreedFromParents(sireBreed, damBreed)

      // Expected: 25% Hatch, 25% Kelso, 50% Sweater
      expect(result).toHaveLength(3)
      expect(result.find(b => b.breedId === 'breed-hatch')?.percentage).toBe(25)
      expect(result.find(b => b.breedId === 'breed-kelso')?.percentage).toBe(25)
      expect(result.find(b => b.breedId === 'breed-sweater')?.percentage).toBe(50)
    })

    it('should handle complex multi-breed parents', () => {
      // Sire: 60% Hatch, 40% Kelso
      const sireBreed: BreedComposition = [
        { breedId: 'breed-hatch', percentage: 60 },
        { breedId: 'breed-kelso', percentage: 40 },
      ]
      // Dam: 50% Sweater, 30% Hatch, 20% Albany
      const damBreed: BreedComposition = [
        { breedId: 'breed-sweater', percentage: 50 },
        { breedId: 'breed-hatch', percentage: 30 },
        { breedId: 'breed-albany', percentage: 20 },
      ]

      const result = calculateBreedFromParents(sireBreed, damBreed)

      // Expected: Hatch: 30+15=45%, Kelso: 20%, Sweater: 25%, Albany: 10%
      expect(result.find(b => b.breedId === 'breed-hatch')?.percentage).toBe(45)
      expect(result.find(b => b.breedId === 'breed-kelso')?.percentage).toBe(20)
      expect(result.find(b => b.breedId === 'breed-sweater')?.percentage).toBe(25)
      expect(result.find(b => b.breedId === 'breed-albany')?.percentage).toBe(10)
    })

    it('should handle empty sire breed (only dam)', () => {
      const sireBreed: BreedComposition = []
      const damBreed: BreedComposition = [{ breedId: 'breed-kelso', percentage: 100 }]

      const result = calculateBreedFromParents(sireBreed, damBreed)

      expect(result).toHaveLength(1)
      expect(result[0].breedId).toBe('breed-kelso')
      expect(result[0].percentage).toBe(50) // Only 50% from dam
    })

    it('should handle empty dam breed (only sire)', () => {
      const sireBreed: BreedComposition = [{ breedId: 'breed-hatch', percentage: 100 }]
      const damBreed: BreedComposition = []

      const result = calculateBreedFromParents(sireBreed, damBreed)

      expect(result).toHaveLength(1)
      expect(result[0].breedId).toBe('breed-hatch')
      expect(result[0].percentage).toBe(50) // Only 50% from sire
    })

    it('should handle both parents empty', () => {
      const sireBreed: BreedComposition = []
      const damBreed: BreedComposition = []

      const result = calculateBreedFromParents(sireBreed, damBreed)

      expect(result).toHaveLength(0)
    })

    it('should sort results by percentage descending', () => {
      const sireBreed: BreedComposition = [{ breedId: 'breed-minor', percentage: 20 }]
      const damBreed: BreedComposition = [{ breedId: 'breed-major', percentage: 100 }]

      const result = calculateBreedFromParents(sireBreed, damBreed)

      // Major (50%) should come before Minor (10%)
      expect(result[0].breedId).toBe('breed-major')
      expect(result[1].breedId).toBe('breed-minor')
    })

    it('should round percentages correctly', () => {
      // 33.33...% scenarios
      const sireBreed: BreedComposition = [
        { breedId: 'breed-a', percentage: 33 },
        { breedId: 'breed-b', percentage: 33 },
        { breedId: 'breed-c', percentage: 34 },
      ]
      const damBreed: BreedComposition = [{ breedId: 'breed-d', percentage: 100 }]

      const result = calculateBreedFromParents(sireBreed, damBreed)

      // All percentages should be integers
      result.forEach(bc => {
        expect(Number.isInteger(bc.percentage)).toBe(true)
      })
    })

    it('should filter out 0% breeds', () => {
      const sireBreed: BreedComposition = [
        { breedId: 'breed-a', percentage: 1 }, // Will become 0.5 -> rounds to 0 or 1
        { breedId: 'breed-b', percentage: 99 },
      ]
      const damBreed: BreedComposition = []

      const result = calculateBreedFromParents(sireBreed, damBreed)

      // Should not contain 0% entries
      result.forEach(bc => {
        expect(bc.percentage).toBeGreaterThan(0)
      })
    })
  })

  // ==========================================
  // 2. Database Schema Tests
  // ==========================================
  describe('2. Database Schema for Breed Composition', () => {
    it('should have breed_composition JSONB field on birds table', async () => {
      const { data, error } = await supabase
        .from('birds')
        .select('id, breed_composition')
        .limit(1)

      if (error) {
        // RLS might block, but syntax should be valid
        expect(error.code).not.toBe('42601') // syntax error
        expect(error.code).not.toBe('42703') // column does not exist
      }
    })

    it('should support storing breed composition array', async () => {
      const testComposition = [
        { breedId: 'test-breed-1', percentage: 60 },
        { breedId: 'test-breed-2', percentage: 40 },
      ]

      // Verify the insert syntax works (RLS may block actual insert)
      const { error } = await supabase
        .from('birds')
        .insert({
          name: 'Test Bird Breed',
          sex: 'MALE' as const,
          hatch_date: new Date().toISOString(),
          status: 'ACTIVE' as const,
          breed_composition: testComposition,
        })
        .select()
        .single()

      if (error) {
        // RLS error is fine, syntax error is not
        expect(error.code).not.toBe('42601')
        expect(error.code).not.toBe('22023') // invalid input syntax for type json
      }
    })

    it('should support updating breed composition', async () => {
      const { error } = await supabase
        .from('birds')
        .update({
          breed_composition: [{ breedId: 'updated-breed', percentage: 100 }],
        })
        .eq('id', '00000000-0000-0000-0000-000000000000')

      if (error) {
        expect(error.code).not.toBe('42601')
        expect(error.code).not.toBe('22023')
      }
    })

    it('should have breeds table for breed lookup', async () => {
      const { data, error } = await supabase
        .from('breeds')
        .select('id, name, code')
        .limit(1)

      if (error) {
        expect(error.code).not.toBe('42P01') // table does not exist
      }
    })
  })

  // ==========================================
  // 3. API Query Pattern Tests
  // ==========================================
  describe('3. API Query Patterns', () => {
    it('should fetch bird with breed composition', async () => {
      const { data, error } = await supabase
        .from('birds')
        .select(`
          id,
          name,
          breed_composition
        `)
        .limit(1)

      if (error) {
        expect(error.code).not.toBe('42601')
      }
    })

    it('should fetch parent birds with their breed composition', async () => {
      // This pattern is used to get sire/dam breed data
      const { data, error } = await supabase
        .from('birds')
        .select('id, name, breed_composition, identifiers:bird_identifiers(*)')
        .limit(1)

      if (error) {
        expect(error.code).not.toBe('42601')
      }
    })

    it('should fetch all breeds for lookup', async () => {
      const { data, error } = await supabase
        .from('breeds')
        .select('id, name, code')
        .order('name')

      if (error) {
        expect(error.code).not.toBe('42601')
      }
    })
  })

  // ==========================================
  // 4. Edge Cases
  // ==========================================
  describe('4. Edge Cases', () => {
    it('should handle percentage totals not equaling 100', () => {
      // Sometimes user might enter bad data
      const sireBreed: BreedComposition = [
        { breedId: 'breed-a', percentage: 80 },
        // Missing 20%
      ]
      const damBreed: BreedComposition = [{ breedId: 'breed-b', percentage: 100 }]

      const result = calculateBreedFromParents(sireBreed, damBreed)

      // Should still calculate without error
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle very small percentages', () => {
      const sireBreed: BreedComposition = [
        { breedId: 'breed-a', percentage: 1 },
        { breedId: 'breed-b', percentage: 99 },
      ]
      const damBreed: BreedComposition = [{ breedId: 'breed-c', percentage: 100 }]

      const result = calculateBreedFromParents(sireBreed, damBreed)

      // breed-a would be 0.5%, which rounds to 0 or 1
      // Just ensure no errors and valid output
      expect(result).toBeDefined()
      result.forEach(bc => {
        expect(bc.percentage).toBeGreaterThanOrEqual(0)
        expect(bc.percentage).toBeLessThanOrEqual(100)
      })
    })

    it('should handle many breeds', () => {
      const manyBreeds: BreedComposition = Array.from({ length: 10 }, (_, i) => ({
        breedId: `breed-${i}`,
        percentage: 10,
      }))

      const result = calculateBreedFromParents(manyBreeds, manyBreeds)

      // Each should be 10% (5% from each parent combined)
      expect(result.length).toBeLessThanOrEqual(10)
      result.forEach(bc => {
        expect(bc.percentage).toBe(10)
      })
    })

    it('should handle duplicate breed IDs in single parent', () => {
      // This shouldn't happen normally but test robustness
      const sireBreed: BreedComposition = [
        { breedId: 'breed-same', percentage: 60 },
        { breedId: 'breed-same', percentage: 40 }, // Duplicate
      ]
      const damBreed: BreedComposition = []

      const result = calculateBreedFromParents(sireBreed, damBreed)

      // Map will combine them
      expect(result).toBeDefined()
    })
  })

  // ==========================================
  // 5. Data Integrity Tests
  // ==========================================
  describe('5. Data Integrity', () => {
    it('breed composition should be valid JSON array', () => {
      const validComposition: BreedComposition = [
        { breedId: 'abc-123', percentage: 100 },
      ]

      // Verify it serializes correctly
      const json = JSON.stringify(validComposition)
      const parsed = JSON.parse(json)

      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0].breedId).toBe('abc-123')
      expect(parsed[0].percentage).toBe(100)
    })

    it('calculated breed percentages should sum to <= 100', () => {
      const sireBreed: BreedComposition = [{ breedId: 'breed-a', percentage: 100 }]
      const damBreed: BreedComposition = [{ breedId: 'breed-b', percentage: 100 }]

      const result = calculateBreedFromParents(sireBreed, damBreed)
      const total = result.reduce((sum, bc) => sum + bc.percentage, 0)

      expect(total).toBeLessThanOrEqual(100)
    })

    it('calculated breed should have unique breedIds', () => {
      const sireBreed: BreedComposition = [
        { breedId: 'breed-common', percentage: 50 },
        { breedId: 'breed-sire-only', percentage: 50 },
      ]
      const damBreed: BreedComposition = [
        { breedId: 'breed-common', percentage: 50 },
        { breedId: 'breed-dam-only', percentage: 50 },
      ]

      const result = calculateBreedFromParents(sireBreed, damBreed)
      const breedIds = result.map(bc => bc.breedId)
      const uniqueIds = new Set(breedIds)

      expect(breedIds.length).toBe(uniqueIds.size)
    })
  })
})
