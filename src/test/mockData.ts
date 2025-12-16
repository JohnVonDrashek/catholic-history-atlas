import type { Person, Event, Place, See, Basilica } from '../types';

export const mockPerson: Person = {
  id: 'test-person',
  name: 'St. Test',
  birthYear: 300,
  deathYear: 350,
  orthodoxyStatus: 'canonized',
  isMartyr: false,
  summary: 'A test person for unit tests',
  locations: [
    {
      placeId: 'rome',
      description: 'Bishop of Rome',
      startYear: 300,
      endYear: 350,
    },
  ],
  roles: ['bishop'],
  primaryTradition: 'Latin',
  imageUrl: 'https://example.com/test.jpg',
};

export const mockMartyr: Person = {
  id: 'test-martyr',
  name: 'St. Test Martyr',
  birthYear: 250,
  deathYear: 304,
  orthodoxyStatus: 'canonized',
  isMartyr: true,
  summary: 'A test martyr',
  locations: [
    {
      placeId: 'rome',
      startYear: 250,
      endYear: 304,
    },
  ],
};

export const mockEvent: Event = {
  id: 'test-event',
  name: 'Test Council',
  startYear: 325,
  type: 'council',
  summary: 'A test council event',
  locationId: 'nicaea',
};

export const mockPlace: Place = {
  id: 'rome',
  name: 'Rome',
  lat: 41.9028,
  lng: 12.4964,
  region: 'Latium',
  modernCountry: 'Italy',
};

export const mockSee: See = {
  id: 'rome-see',
  name: 'See of Rome',
  placeId: 'rome',
  type: 'apostolic-see',
  startYear: 30,
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Holy_See',
  newAdventUrl: 'https://www.newadvent.org/cathen/14258a.htm',
};

export const mockBasilica: Basilica = {
  id: 'st-peters',
  name: "St. Peter's Basilica",
  placeId: 'rome',
  type: 'papal-basilica',
  startYear: 326,
  description: 'Major basilica in Vatican City',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/St._Peter%27s_Basilica',
  imageUrl: 'https://example.com/st-peters.jpg',
};
