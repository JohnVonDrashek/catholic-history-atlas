import century1People from './century-1-people.json';
import century2People from './century-2-people.json';
import century3People from './century-3-people.json';
import century4People from './century-4-people.json';
import century5People from './century-5-people.json';
import century6People from './century-6-people.json';
import century7People from './century-7-people.json';
import century8People from './century-8-people.json';
import century9People from './century-9-people.json';
import century10People from './century-10-people.json';
import century11People from './century-11-people.json';
import century12People from './century-12-people.json';
import century13People from './century-13-people.json';
import century14People from './century-14-people.json';
import century15People from './century-15-people.json';
import century16People from './century-16-people.json';
import century17People from './century-17-people.json';
import century18People from './century-18-people.json';
import century19People from './century-19-people.json';
import century20People from './century-20-people.json';

import century1Events from './century-1-events.json';
import century2Events from './century-2-events.json';
import century3Events from './century-3-events.json';
import century4Events from './century-4-events.json';
import century5Events from './century-5-events.json';
import century6Events from './century-6-events.json';
import century7Events from './century-7-events.json';
import century8Events from './century-8-events.json';
import century9Events from './century-9-events.json';
import century10Events from './century-10-events.json';
import century11Events from './century-11-events.json';
import century17Events from './century-17-events.json';
import century13Events from './century-13-events.json';
import century14Events from './century-14-events.json';
import century15Events from './century-15-events.json';
import century16Events from './century-16-events.json';
import century18Events from './century-18-events.json';
import century19Events from './century-19-events.json';
import century20Events from './century-20-events.json';

import places from './places.json';

import type { Person, Event, Place } from '../types';

const initialData = {
  people: [
    ...century1People,
    ...century2People,
    ...century3People,
    ...century4People,
    ...century5People,
    ...century6People,
    ...century7People,
    ...century8People,
    ...century9People,
    ...century10People,
    ...century11People,
    ...century12People,
    ...century13People,
    ...century14People,
    ...century15People,
    ...century16People,
    ...century17People,
    ...century18People,
    ...century19People,
    ...century20People,
  ] as Person[],
  events: [
    ...century1Events,
    ...century2Events,
    ...century3Events,
    ...century4Events,
    ...century5Events,
    ...century6Events,
    ...century7Events,
    ...century8Events,
    ...century9Events,
    ...century10Events,
    ...century11Events,
    ...century13Events,
    ...century14Events,
    ...century15Events,
    ...century16Events,
    ...century17Events,
    ...century18Events,
    ...century19Events,
    ...century20Events,
  ] as Event[],
  places: places as Place[],
};

export default initialData;
