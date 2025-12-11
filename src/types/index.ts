export type { Person, PersonLocation, OrthodoxyStatus } from './person';
export type { Event, EventType } from './event';
export type { Place } from './place';

import type { Person } from './person';
import type { Event } from './event';
import type { Place } from './place';

export interface AppData {
  people: Person[];
  events: Event[];
  places: Place[];
}
