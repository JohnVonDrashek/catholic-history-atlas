import { describe, it, expect } from 'vitest';
import { isPersonActive, isEventActive, getActivePeople, getActiveEvents } from '../filters';
import type { Person, Event } from '../../types';

describe('filters', () => {
  describe('isPersonActive', () => {
    it('returns true when person is alive in given year', () => {
      const person: Partial<Person> = {
        id: 'test-1',
        name: 'Test Person',
        birthYear: 100,
        deathYear: 150,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test',
      };

      expect(isPersonActive(person as Person, 125)).toBe(true);
      expect(isPersonActive(person as Person, 100)).toBe(true);
      expect(isPersonActive(person as Person, 150)).toBe(true);
    });

    it('returns false when person is not alive in given year', () => {
      const person: Partial<Person> = {
        id: 'test-1',
        name: 'Test Person',
        birthYear: 100,
        deathYear: 150,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test',
      };

      expect(isPersonActive(person as Person, 50)).toBe(false);
      expect(isPersonActive(person as Person, 200)).toBe(false);
      expect(isPersonActive(person as Person, 99)).toBe(false);
      expect(isPersonActive(person as Person, 151)).toBe(false);
    });

    it('estimates birth year when not provided (80 years before death)', () => {
      const person: Partial<Person> = {
        id: 'test-1',
        name: 'Test Person',
        deathYear: 150,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test',
      };

      // Estimated birth: 150 - 80 = 70
      expect(isPersonActive(person as Person, 70)).toBe(true);
      expect(isPersonActive(person as Person, 100)).toBe(true);
      expect(isPersonActive(person as Person, 150)).toBe(true);
      expect(isPersonActive(person as Person, 69)).toBe(false);
      expect(isPersonActive(person as Person, 151)).toBe(false);
    });

    it('handles edge cases with birth year estimation', () => {
      const person: Partial<Person> = {
        id: 'test-1',
        name: 'Test Person',
        deathYear: 50,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test',
      };

      // Estimated birth: 50 - 80 = -30 (before Christ)
      expect(isPersonActive(person as Person, -30)).toBe(true);
      expect(isPersonActive(person as Person, 0)).toBe(true);
      expect(isPersonActive(person as Person, 50)).toBe(true);
      expect(isPersonActive(person as Person, -31)).toBe(false);
    });
  });

  describe('isEventActive', () => {
    it('returns true for single-year events', () => {
      const event: Partial<Event> = {
        id: 'test-event',
        name: 'Test Event',
        startYear: 325,
        type: 'council',
        summary: 'Test',
      };

      expect(isEventActive(event as Event, 325)).toBe(true);
      expect(isEventActive(event as Event, 324)).toBe(false);
      expect(isEventActive(event as Event, 326)).toBe(false);
    });

    it('returns true for multi-year events within range', () => {
      const event: Partial<Event> = {
        id: 'test-event',
        name: 'Test Event',
        startYear: 1545,
        endYear: 1563,
        type: 'council',
        summary: 'Test',
      };

      expect(isEventActive(event as Event, 1545)).toBe(true);
      expect(isEventActive(event as Event, 1550)).toBe(true);
      expect(isEventActive(event as Event, 1563)).toBe(true);
      expect(isEventActive(event as Event, 1544)).toBe(false);
      expect(isEventActive(event as Event, 1564)).toBe(false);
    });

    it('handles events without endYear as single-year events', () => {
      const event: Partial<Event> = {
        id: 'test-event',
        name: 'Test Event',
        startYear: 400,
        type: 'council',
        summary: 'Test',
      };

      expect(isEventActive(event as Event, 400)).toBe(true);
      expect(isEventActive(event as Event, 399)).toBe(false);
      expect(isEventActive(event as Event, 401)).toBe(false);
    });
  });

  describe('getActivePeople', () => {
    const people: Person[] = [
      {
        id: 'person-1',
        name: 'Person 1',
        birthYear: 100,
        deathYear: 150,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test 1',
      },
      {
        id: 'person-2',
        name: 'Person 2',
        birthYear: 200,
        deathYear: 250,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test 2',
      },
      {
        id: 'person-3',
        name: 'Person 3',
        birthYear: 120,
        deathYear: 180,
        orthodoxyStatus: 'canonized',
        locations: [],
        summary: 'Test 3',
      },
    ];

    it('filters people active in given year', () => {
      const active = getActivePeople(people, 125);
      expect(active).toHaveLength(2);
      expect(active.map((p) => p.id)).toEqual(['person-1', 'person-3']);
    });

    it('returns all people when year overlaps with all', () => {
      const active = getActivePeople(people, 150);
      expect(active).toHaveLength(2);
      expect(active.map((p) => p.id)).toEqual(['person-1', 'person-3']);
    });

    it('returns empty array when no people are active', () => {
      const active = getActivePeople(people, 50);
      expect(active).toHaveLength(0);
    });

    it('returns empty array for empty input', () => {
      const active = getActivePeople([], 125);
      expect(active).toHaveLength(0);
    });
  });

  describe('getActiveEvents', () => {
    const events: Event[] = [
      {
        id: 'event-1',
        name: 'Event 1',
        startYear: 325,
        type: 'council',
        summary: 'Test 1',
      },
      {
        id: 'event-2',
        name: 'Event 2',
        startYear: 1545,
        endYear: 1563,
        type: 'council',
        summary: 'Test 2',
      },
      {
        id: 'event-3',
        name: 'Event 3',
        startYear: 500,
        type: 'council',
        summary: 'Test 3',
      },
    ];

    it('filters events active in given year', () => {
      const active = getActiveEvents(events, 1550);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('event-2');
    });

    it('returns multiple active events', () => {
      const active = getActiveEvents(events, 325);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('event-1');
    });

    it('returns empty array when no events are active', () => {
      const active = getActiveEvents(events, 1000);
      expect(active).toHaveLength(0);
    });

    it('returns empty array for empty input', () => {
      const active = getActiveEvents([], 325);
      expect(active).toHaveLength(0);
    });
  });
});
