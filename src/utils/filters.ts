import type { Person, Event } from '../types';

/**
 * Check if a person was alive during a given year
 */
export function isPersonActive(person: Person, year: number): boolean {
  // If birth year is unknown, estimate it (typically 80 years before death)
  // Only show person in the estimated lifespan, not from the beginning of time
  const birth = person.birthYear ?? (person.deathYear - 80);
  const death = person.deathYear;
  return year >= birth && year <= death;
}

/**
 * Check if an event occurred during a given year
 */
export function isEventActive(event: Event, year: number): boolean {
  const start = event.startYear;
  const end = event.endYear ?? event.startYear;
  return year >= start && year <= end;
}

/**
 * Get all people active in a given year
 */
export function getActivePeople(people: Person[], year: number): Person[] {
  return people.filter(person => isPersonActive(person, year));
}

/**
 * Get all events active in a given year
 */
export function getActiveEvents(events: Event[], year: number): Event[] {
  return events.filter(event => isEventActive(event, year));
}
