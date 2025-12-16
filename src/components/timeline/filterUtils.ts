import type { Person, Event } from '../../types';
import type { TimelineFilters } from './timelineTypes';

/**
 * Filter people based on timeline filter criteria
 */
export function filterPeople(people: Person[], filters: TimelineFilters): Person[] {
  if (!filters.showPeople) return [];

  return people.filter((person) => {
    // Filter by orthodoxy status
    if (!filters.orthodoxyStatus.has(person.orthodoxyStatus)) {
      return false;
    }

    // Filter by martyr status
    if (filters.showMartyrs !== null) {
      if (filters.showMartyrs && !person.isMartyr) return false;
      if (!filters.showMartyrs && person.isMartyr) return false;
    }

    // Filter by roles (if roles filter is set, person must have at least one selected role)
    if (filters.roles.size > 0) {
      if (!person.roles || person.roles.length === 0) return false;
      const hasSelectedRole = person.roles.some((role) => filters.roles.has(role));
      if (!hasSelectedRole) return false;
    }

    // Filter by primary tradition (if tradition filter is set, person must have a selected tradition)
    if (filters.primaryTradition.size > 0) {
      if (!person.primaryTradition) return false;
      if (!filters.primaryTradition.has(person.primaryTradition)) return false;
    }

    // Filter by pope status
    if (filters.showPopes !== null) {
      const isPope = person.roles?.includes('pope') ?? false;
      if (filters.showPopes && !isPope) return false;
      if (!filters.showPopes && isPope) return false;
    }

    // Filter by writings
    if (filters.showWithWritings !== null) {
      const hasWritings = person.writings && person.writings.length > 0;
      if (filters.showWithWritings && !hasWritings) return false;
      if (!filters.showWithWritings && hasWritings) return false;
    }

    return true;
  });
}

/**
 * Filter events based on timeline filter criteria
 */
export function filterEvents(events: Event[], filters: TimelineFilters): Event[] {
  if (!filters.showEvents) return [];

  return events.filter((event) => {
    return filters.eventTypes.has(event.type);
  });
}
