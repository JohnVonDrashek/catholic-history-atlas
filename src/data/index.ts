import century1People from './people/century-1';
import century2People from './people/century-2';
import century3People from './people/century-3';
import century4People from './people/century-4';
import century5People from './people/century-5';
import century6People from './people/century-6';
import century7People from './people/century-7';
import century8People from './people/century-8';
import century9People from './people/century-9';
import century10People from './people/century-10';
import century11People from './people/century-11';
import century12People from './people/century-12';
import century13People from './people/century-13';
import century14People from './people/century-14';
import century15People from './people/century-15';
import century16People from './people/century-16';
import century17People from './people/century-17';
import century18People from './people/century-18';
import century19People from './people/century-19';
import century20People from './people/century-20';

import century1Events from './events/century-1';
import century2Events from './events/century-2';
import century3Events from './events/century-3';
import century4Events from './events/century-4';
import century5Events from './events/century-5';
import century6Events from './events/century-6';
import century7Events from './events/century-7';
import century8Events from './events/century-8';
import century9Events from './events/century-9';
import century10Events from './events/century-10';
import century11Events from './events/century-11';
import century13Events from './events/century-13';
import century14Events from './events/century-14';
import century15Events from './events/century-15';
import century16Events from './events/century-16';
import century17Events from './events/century-17';
import century18Events from './events/century-18';
import century19Events from './events/century-19';
import century20Events from './events/century-20';

import places from './places.json';
import sees from './sees.json';
import basilicas from './basilicas.json';

import type { Person, Event, Place, See, Basilica } from '../types';

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
  sees: sees as See[],
  basilicas: basilicas as Basilica[],
};

export default initialData;
