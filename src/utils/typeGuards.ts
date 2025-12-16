import type { Person, Event, Basilica } from '../types';

/**
 * Type guard to check if an item is a Person
 * @param item - The item to check
 * @returns true if the item is a Person
 */
export function isPerson(item: Person | Event | Basilica): item is Person {
  return 'orthodoxyStatus' in item && 'locations' in item;
}

/**
 * Type guard to check if an item is an Event
 * @param item - The item to check
 * @returns true if the item is an Event
 */
export function isEvent(item: Person | Event | Basilica): item is Event {
  return (
    'type' in item && 'startYear' in item && !('orthodoxyStatus' in item) && !('placeId' in item)
  );
}

/**
 * Type guard to check if an item is a Basilica
 * @param item - The item to check
 * @returns true if the item is a Basilica
 */
export function isBasilica(item: Person | Event | Basilica): item is Basilica {
  return (
    'type' in item && 'placeId' in item && !('orthodoxyStatus' in item) && !('startYear' in item)
  );
}
