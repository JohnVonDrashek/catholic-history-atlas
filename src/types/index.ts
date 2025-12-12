export type { Person, PersonLocation, OrthodoxyStatus } from './person';
export type { Event, EventType } from './event';
export type { Place } from './place';
export type { See, SeeType } from './see';

import type { Person } from './person';
import type { Event } from './event';
import type { Place } from './place';
import type { See } from './see';

export interface AppData {
  people: Person[];
  events: Event[];
  places: Place[];
  sees: See[];
}
