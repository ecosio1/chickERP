export interface BreedComposition {
  breedId: string;
  percentage: number;
}

/**
 * Calculate child's breed composition from parents
 * Each parent contributes 50% of their genetics
 */
export function calculateChildBreedComposition(
  sireBreeds: BreedComposition[] | null | undefined,
  damBreeds: BreedComposition[] | null | undefined
): BreedComposition[] {
  const sire = sireBreeds || [];
  const dam = damBreeds || [];

  // Handle cases where one or both parents have no breed data
  if (sire.length === 0 && dam.length === 0) {
    return [];
  }

  // If only one parent has breed data, use 50% of their breeds
  if (sire.length === 0) {
    return dam.map((b) => ({
      breedId: b.breedId,
      percentage: Math.round(b.percentage * 0.5 * 10) / 10,
    }));
  }

  if (dam.length === 0) {
    return sire.map((b) => ({
      breedId: b.breedId,
      percentage: Math.round(b.percentage * 0.5 * 10) / 10,
    }));
  }

  // Both parents have breed data - combine 50% from each
  const breedMap = new Map<string, number>();

  for (const breed of sire) {
    const contribution = (breed.percentage / 100) * 50;
    breedMap.set(breed.breedId, (breedMap.get(breed.breedId) || 0) + contribution);
  }

  for (const breed of dam) {
    const contribution = (breed.percentage / 100) * 50;
    breedMap.set(breed.breedId, (breedMap.get(breed.breedId) || 0) + contribution);
  }

  // Convert back to array and round to 1 decimal
  return Array.from(breedMap.entries())
    .map(([breedId, percentage]) => ({
      breedId,
      percentage: Math.round(percentage * 10) / 10,
    }))
    .filter((b) => b.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Get the total percentage of a breed composition
 */
export function getTotalPercentage(breeds: BreedComposition[]): number {
  return breeds.reduce((sum, b) => sum + b.percentage, 0);
}

/**
 * Normalize breed percentages to sum to 100
 */
export function normalizeBreedPercentages(
  breeds: BreedComposition[]
): BreedComposition[] {
  const total = getTotalPercentage(breeds);
  if (total === 0) return [];

  return breeds.map((b) => ({
    breedId: b.breedId,
    percentage: Math.round((b.percentage / total) * 1000) / 10,
  }));
}
