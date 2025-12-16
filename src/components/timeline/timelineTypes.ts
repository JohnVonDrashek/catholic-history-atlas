import type { Person, Event, OrthodoxyStatus, EventType } from '../../types';

export interface TimelineFilters {
  showPeople: boolean;
  showEvents: boolean;
  orthodoxyStatus: Set<OrthodoxyStatus>;
  showMartyrs: boolean | null; // null = show all, true = only martyrs, false = only non-martyrs
  roles: Set<string>;
  primaryTradition: Set<string>;
  eventTypes: Set<EventType>;
  showPopes: boolean | null; // null = show all, true = only popes, false = exclude popes
  showWithWritings: boolean | null; // null = show all, true = only with writings, false = only without writings
}

export interface TimelineItem {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  type: 'person' | 'event';
  data: Person | Event;
  icon?: string;
}

export interface SerializedTimelineFilters {
  showPeople: boolean;
  showEvents: boolean;
  orthodoxyStatus: OrthodoxyStatus[];
  showMartyrs: boolean | null;
  roles: string[];
  primaryTradition: string[];
  eventTypes: EventType[];
  showPopes: boolean | null;
  showWithWritings: boolean | null;
}

export const STORAGE_KEY = 'catholic-history-atlas-filters';

export const serializeFilters = (filters: TimelineFilters): SerializedTimelineFilters => {
  return {
    showPeople: filters.showPeople,
    showEvents: filters.showEvents,
    orthodoxyStatus: Array.from(filters.orthodoxyStatus),
    showMartyrs: filters.showMartyrs,
    roles: Array.from(filters.roles),
    primaryTradition: Array.from(filters.primaryTradition),
    eventTypes: Array.from(filters.eventTypes),
    showPopes: filters.showPopes,
    showWithWritings: filters.showWithWritings,
  };
};

export const deserializeFilters = (
  serialized: SerializedTimelineFilters,
  defaultRoles: Set<string>,
  defaultTraditions: Set<string>
): TimelineFilters => {
  return {
    showPeople: serialized.showPeople ?? true,
    showEvents: serialized.showEvents ?? true,
    orthodoxyStatus: new Set(
      serialized.orthodoxyStatus || [
        'canonized',
        'blessed',
        'orthodox',
        'schismatic',
        'heresiarch',
        'secular',
      ]
    ),
    showMartyrs: serialized.showMartyrs ?? null,
    roles: new Set(serialized.roles || Array.from(defaultRoles)),
    primaryTradition: new Set(serialized.primaryTradition || Array.from(defaultTraditions)),
    eventTypes: new Set(
      serialized.eventTypes || [
        'council',
        'schism',
        'persecution',
        'reform',
        'heresy',
        'war',
        'other',
      ]
    ),
    showPopes: serialized.showPopes ?? null,
    showWithWritings: serialized.showWithWritings ?? null,
  };
};
