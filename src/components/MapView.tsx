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

// Important patriarchal sees (Pentarchy)
const IMPORTANT_SEES = new Set([
  'antioch',
  'alexandria',
  'constantinople',
]);

// Create custom icons with images
const createPersonIcon = (imageUrl?: string) => {
  const size = 36;
  const fallbackHtml = '<div style="background-color: #4a9eff; width: ' + size + 'px; height: ' + size + 'px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>';
  
  if (!imageUrl) {
    return L.divIcon({
      className: 'custom-marker',
      html: fallbackHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        overflow: hidden;
        background-color: #4a9eff;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createCouncilIcon = (imageUrl?: string) => {
  const size = 40;
  const fallbackHtml = '<div style="background-color: #ffd700; width: ' + size + 'px; height: ' + size + 'px; border-radius: 0; transform: rotate(45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); color: white; font-size: 16px; font-weight: bold;">★</div></div>';
  
  if (!imageUrl) {
    return L.divIcon({
      className: 'custom-marker',
      html: fallbackHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        border-radius: 0;
        transform: rotate(45deg);
        border: 3px solid #ffd700;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        overflow: hidden;
        background-color: #ffd700;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          color: white;
          font-size: 18px;
          font-weight: bold;
          text-shadow: 0 0 4px rgba(0,0,0,0.8);
        ">★</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createImportantSeeIcon = (imageUrl?: string) => {
  const size = 44;
  const fallbackHtml = '<div style="position: relative;"><div style="background-color: #d4af37; width: ' + size + 'px; height: ' + size + 'px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ' + (size - 10) + 'px; height: ' + (size - 10) + 'px; border-radius: 50%; border: 2px solid white; background-color: transparent;"></div></div>';
  
  if (!imageUrl) {
    return L.divIcon({
      className: 'custom-marker',
      html: fallbackHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid #d4af37;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          overflow: hidden;
          background-color: #d4af37;
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size - 10}px;
          height: ${size - 10}px;
          border-radius: 50%;
          border: 2px solid white;
          background-color: transparent;
          pointer-events: none;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

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
    <div style={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative' }}>
      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        padding: '1rem',
        borderRadius: '8px',
        zIndex: 1000,
        color: '#fff',
        fontSize: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '16px' }}>Map Legend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              backgroundColor: '#ffd700',
              width: '20px',
              height: '20px',
              borderRadius: '0',
              transform: 'rotate(45deg)',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
              }}>★</div>
            </div>
            <span>Council</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              position: 'relative',
            }}>
              <div style={{
                backgroundColor: '#d4af37',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid white',
                backgroundColor: 'transparent',
              }}></div>
            </div>
            <span>Important See</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              backgroundColor: '#4a9eff',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}></div>
            <span>Person</span>
          </div>
        </div>
      </div>

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
          
          // Determine which icon to use (priority: council > important see > person)
          const hasCouncil = placeEvents.some(e => e.type === 'council');
          const isImportantSee = IMPORTANT_SEES.has(place.id.toLowerCase());
          
          // Get image URL - prefer first person's image, then first event's image
          let imageUrl: string | undefined;
          if (placePeople.length > 0 && placePeople[0].imageUrl) {
            imageUrl = placePeople[0].imageUrl;
          } else if (placeEvents.length > 0 && placeEvents[0].imageUrl) {
            imageUrl = placeEvents[0].imageUrl;
          }
          
          let icon;
          if (hasCouncil) {
            icon = createCouncilIcon(imageUrl);
          } else if (isImportantSee) {
            icon = createImportantSeeIcon(imageUrl);
          } else {
            icon = createPersonIcon(imageUrl);
          }

          return (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={icon}>
              <Popup>
                <div>
                  <strong>{place.name}</strong>
                  {isImportantSee && (
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '0.5rem' }}>
                      Important See
                    </div>
                  )}
                  {placePeople.length > 0 && (
                    <div>
                      <p style={{ margin: '0.5rem 0 0.25rem 0', fontWeight: 'bold' }}>People:</p>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                        {placePeople.map(person => (
                          <li
                            key={person.id}
                            onClick={() => onItemClick(person)}
                            style={{ cursor: 'pointer', color: '#4a9eff', marginBottom: '0.25rem' }}
                          >
                            {person.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {placeEvents.length > 0 && (
                    <div>
                      <p style={{ margin: '0.5rem 0 0.25rem 0', fontWeight: 'bold' }}>Events:</p>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                        {placeEvents.map(event => (
                          <li
                            key={event.id}
                            onClick={() => onItemClick(event)}
                            style={{ cursor: 'pointer', color: '#4a9eff', marginBottom: '0.25rem' }}
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
