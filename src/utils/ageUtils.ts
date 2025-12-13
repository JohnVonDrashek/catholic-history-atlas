import type { Person } from '../types';

export type LifeStage = 'young' | 'prime' | 'elder';

/**
 * Calculate a person's age at a given year
 */
export function calculateAge(person: Person, year: number): number | null {
  const birth = person.birthYear ?? (person.deathYear - 80);
  if (year < birth || year > person.deathYear) {
    return null; // Person wasn't alive at this year
  }
  return year - birth;
}

/**
 * Determine life stage based on age
 * - young: < 30 years old
 * - prime: 30-60 years old (most active/leadership years)
 * - elder: > 60 years old
 */
export function getLifeStage(age: number | null): LifeStage | null {
  if (age === null) return null;
  if (age < 30) return 'young';
  if (age <= 60) return 'prime';
  return 'elder';
}

/**
 * Get the size multiplier for a life stage
 * - young: 0.875x (35px base)
 * - prime: 1.25x (50px base) - most prominent
 * - elder: 0.875x (35px base)
 */
export function getSizeForLifeStage(stage: LifeStage | null, baseSize: number = 40): number {
  if (!stage) return baseSize;
  switch (stage) {
    case 'young':
      return Math.round(baseSize * 0.875); // 35px
    case 'prime':
      return Math.round(baseSize * 1.25); // 50px
    case 'elder':
      return Math.round(baseSize * 0.875); // 35px
  }
}

/**
 * Get border width multiplier for a life stage
 * Prime age gets thicker borders (3-4px), others get thinner (2px)
 */
export function getBorderWidthForLifeStage(
  stage: LifeStage | null,
  baseBorderWidth: number = 2
): number {
  if (!stage) return baseBorderWidth;
  switch (stage) {
    case 'young':
      return baseBorderWidth; // 2px
    case 'prime':
      return baseBorderWidth + 1; // 3px (or +2 for 4px if base is 2)
    case 'elder':
      return baseBorderWidth; // 2px
  }
}


