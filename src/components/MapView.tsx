import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Person, Event, Place } from '../types';
import { getActivePeople, getActiveEvents } from '../utils/filters';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  people: Person[];
  events: Event[];
  places: Place[];
  currentYear: number;
  onItemClick: (item: Person | Event) => void;
}

export function MapView({ people, events, places, currentYear, onItemClick }: MapViewProps) {
  const activePeople = getActivePeople(people, currentYear);
  const activeEvents = getActiveEvents(events, currentYear);

  // Get places for active people and events
  const activePlaceIds = new Set<string>();
  activePeople.forEach(person => {
    person.locations.forEach(loc => activePlaceIds.add(loc.placeId));
  });
  activeEvents.forEach(event => {
    if (event.locationId) activePlaceIds.add(event.locationId);
  });

  const activePlaces = places.filter(p => activePlaceIds.has(p.id));

  // Default to Mediterranean view for early centuries
  const center: [number, number] = currentYear < 1000 ? [38, 20] : [50, 10];
  const zoom = currentYear < 1000 ? 4 : 5;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {activePlaces.map((place) => {
          const placePeople = activePeople.filter(p =>
            p.locations.some(loc => loc.placeId === place.id)
          );
          const placeEvents = activeEvents.filter(e => e.locationId === place.id);

          return (
            <Marker key={place.id} position={[place.lat, place.lng]}>
              <Popup>
                <div>
                  <strong>{place.name}</strong>
                  {placePeople.length > 0 && (
                    <div>
                      <p>People:</p>
                      <ul>
                        {placePeople.map(person => (
                          <li
                            key={person.id}
                            onClick={() => onItemClick(person)}
                            style={{ cursor: 'pointer', color: '#4a9eff' }}
                          >
                            {person.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {placeEvents.length > 0 && (
                    <div>
                      <p>Events:</p>
                      <ul>
                        {placeEvents.map(event => (
                          <li
                            key={event.id}
                            onClick={() => onItemClick(event)}
                            style={{ cursor: 'pointer', color: '#4a9eff' }}
                          >
                            {event.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
