import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  getLifeStage,
  getSizeForLifeStage,
  getBorderWidthForLifeStage,
} from '../ageUtils';
import type { Person } from '../../types';

describe('ageUtils', () => {
  describe('calculateAge', () => {
    it('calculates age correctly when birth year is known', () => {
      const person: Partial<Person> = {
        id: 'test',
        name: 'Test',
        birthYear: 354,
        deathYear: 430,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test',
      };

      expect(calculateAge(person as Person, 354)).toBe(0);
      expect(calculateAge(person as Person, 400)).toBe(46);
      expect(calculateAge(person as Person, 430)).toBe(76);
    });

    it('estimates age when birth year is unknown', () => {
      const person: Partial<Person> = {
        id: 'test',
        name: 'Test',
        deathYear: 430,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test',
      };

      // Estimated birth: 430 - 80 = 350
      expect(calculateAge(person as Person, 350)).toBe(0);
      expect(calculateAge(person as Person, 400)).toBe(50);
      expect(calculateAge(person as Person, 430)).toBe(80);
    });

    it('returns null when year is before birth', () => {
      const person: Partial<Person> = {
        id: 'test',
        name: 'Test',
        birthYear: 354,
        deathYear: 430,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test',
      };

      expect(calculateAge(person as Person, 300)).toBeNull();
      expect(calculateAge(person as Person, 353)).toBeNull();
    });

    it('returns null when year is after death', () => {
      const person: Partial<Person> = {
        id: 'test',
        name: 'Test',
        birthYear: 354,
        deathYear: 430,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test',
      };

      expect(calculateAge(person as Person, 431)).toBeNull();
      expect(calculateAge(person as Person, 500)).toBeNull();
    });

    it('handles edge cases at exact birth and death years', () => {
      const person: Partial<Person> = {
        id: 'test',
        name: 'Test',
        birthYear: 354,
        deathYear: 430,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test',
      };

      expect(calculateAge(person as Person, 354)).toBe(0);
      expect(calculateAge(person as Person, 430)).toBe(76);
    });
  });

  describe('getLifeStage', () => {
    it('returns "young" for ages under 30', () => {
      expect(getLifeStage(0)).toBe('young');
      expect(getLifeStage(15)).toBe('young');
      expect(getLifeStage(29)).toBe('young');
    });

    it('returns "prime" for ages 30-60', () => {
      expect(getLifeStage(30)).toBe('prime');
      expect(getLifeStage(45)).toBe('prime');
      expect(getLifeStage(60)).toBe('prime');
    });

    it('returns "elder" for ages over 60', () => {
      expect(getLifeStage(61)).toBe('elder');
      expect(getLifeStage(80)).toBe('elder');
      expect(getLifeStage(100)).toBe('elder');
    });

    it('returns null for null age', () => {
      expect(getLifeStage(null)).toBeNull();
    });
  });

  describe('getSizeForLifeStage', () => {
    it('returns 87.5% of base size for young stage', () => {
      expect(getSizeForLifeStage('young', 40)).toBe(35);
      expect(getSizeForLifeStage('young', 80)).toBe(70);
    });

    it('returns 125% of base size for prime stage', () => {
      expect(getSizeForLifeStage('prime', 40)).toBe(50);
      expect(getSizeForLifeStage('prime', 80)).toBe(100);
    });

    it('returns 87.5% of base size for elder stage', () => {
      expect(getSizeForLifeStage('elder', 40)).toBe(35);
      expect(getSizeForLifeStage('elder', 80)).toBe(70);
    });

    it('returns base size for null stage', () => {
      expect(getSizeForLifeStage(null, 40)).toBe(40);
      expect(getSizeForLifeStage(null, 100)).toBe(100);
    });

    it('uses default base size of 40 when not provided', () => {
      expect(getSizeForLifeStage('young')).toBe(35);
      expect(getSizeForLifeStage('prime')).toBe(50);
      expect(getSizeForLifeStage('elder')).toBe(35);
      expect(getSizeForLifeStage(null)).toBe(40);
    });

    it('rounds result to nearest integer', () => {
      // 40 * 0.875 = 35 (exact)
      expect(getSizeForLifeStage('young', 40)).toBe(35);
      // 41 * 0.875 = 35.875 → rounds to 36
      expect(getSizeForLifeStage('young', 41)).toBe(36);
    });
  });

  describe('getBorderWidthForLifeStage', () => {
    it('returns base border width for young stage', () => {
      expect(getBorderWidthForLifeStage('young', 2)).toBe(2);
      expect(getBorderWidthForLifeStage('young', 3)).toBe(3);
    });

    it('returns base + 1 for prime stage', () => {
      expect(getBorderWidthForLifeStage('prime', 2)).toBe(3);
      expect(getBorderWidthForLifeStage('prime', 3)).toBe(4);
    });

    it('returns base border width for elder stage', () => {
      expect(getBorderWidthForLifeStage('elder', 2)).toBe(2);
      expect(getBorderWidthForLifeStage('elder', 3)).toBe(3);
    });

    it('returns base border width for null stage', () => {
      expect(getBorderWidthForLifeStage(null, 2)).toBe(2);
      expect(getBorderWidthForLifeStage(null, 5)).toBe(5);
    });

    it('uses default base of 2 when not provided', () => {
      expect(getBorderWidthForLifeStage('young')).toBe(2);
      expect(getBorderWidthForLifeStage('prime')).toBe(3);
      expect(getBorderWidthForLifeStage('elder')).toBe(2);
      expect(getBorderWidthForLifeStage(null)).toBe(2);
    });
  });
});
