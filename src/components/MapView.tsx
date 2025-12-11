import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import type { Person, Event, Place, OrthodoxyStatus } from '../types';
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

// Calculate offset position for markers at the same location
// Arranges markers in a circle around the base position
// Zoom-aware: larger offsets at lower zoom levels to prevent overlap
function calculateOffsetPosition(
  baseLat: number,
  baseLng: number,
  index: number,
  totalCount: number,
  zoom: number
): [number, number] {
  if (totalCount === 1) {
    return [baseLat, baseLng];
  }

  // Base radius in degrees - scales inversely with zoom
  // Much larger offsets at lower zoom levels to prevent overlap
  // At zoom 2: ~1.2 degrees (~133km)
  // At zoom 4: ~0.5 degrees (~55km)
  // At zoom 6: ~0.2 degrees (~22km)
  // At zoom 8: ~0.08 degrees (~8.8km)
  // At zoom 10: ~0.032 degrees (~3.5km)
  // At zoom 12: ~0.013 degrees (~1.4km)
  // Formula: baseRadius decreases exponentially as zoom increases
  const baseRadius = 0.5 / Math.pow(1.4, zoom - 4);
  
  // Scale radius based on total count to prevent overlap
  // More aggressive scaling for larger groups
  const radius = baseRadius * Math.min(1 + totalCount * 0.3, 3.5);

  // Calculate angle in radians
  const angle = (index * 2 * Math.PI) / totalCount;

  // Calculate offset (latitude and longitude)
  // For latitude: 1 degree ≈ 111 km
  // For longitude: depends on latitude, but we'll use a simple approximation
  const latOffset = radius * Math.cos(angle);
  const lngOffset = radius * Math.sin(angle) / Math.cos(baseLat * Math.PI / 180);

  return [baseLat + latOffset, baseLng + lngOffset];
}

// Get border style based on orthodoxy status and martyr status
// Matches the portrait frame system
function getPersonBorderStyle(orthodoxyStatus: OrthodoxyStatus, isMartyr?: boolean): {
  border: string;
  borderWidth: string;
  boxShadow: string;
  background?: string;
} {
  if (isMartyr && (orthodoxyStatus === 'canonized' || orthodoxyStatus === 'blessed')) {
    // Martyr: gold + red stripes
    return {
      border: '3px solid transparent',
      borderWidth: '3px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      background: `repeating-linear-gradient(45deg, #d4af37, #d4af37 4px, #a11b1b 4px, #a11b1b 8px)`,
    };
  }

  switch (orthodoxyStatus) {
    case 'canonized':
      // Canonized saint: solid gold
      return {
        border: '3px solid #d4af37',
        borderWidth: '3px',
        boxShadow: '0 0 6px rgba(212, 175, 55, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    case 'blessed':
      // Blessed: softer gold / silver
      return {
        border: '2px solid #c0c0c0',
        borderWidth: '2px',
        boxShadow: '0 0 4px rgba(192, 192, 192, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    case 'orthodox':
      // Orthodox-but-not-saint: stone/gray
      return {
        border: '2px solid #777',
        borderWidth: '2px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        background: '#f7f7f7',
      };
    case 'schismatic':
      // Schismatic: split border effect (gray + red)
      return {
        border: '3px solid transparent',
        borderWidth: '3px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        background: `linear-gradient(to right, #777 0%, #777 50%, #b03a2e 50%, #b03a2e 100%)`,
      };
    case 'heresiarch':
      // Heresiarch: dark, sharp
      return {
        border: '3px solid #5b1a1a',
        borderWidth: '3px',
        boxShadow: '0 0 4px rgba(91, 26, 26, 0.8), 0 2px 6px rgba(0,0,0,0.4)',
      };
    case 'secular':
    default:
      // Secular: thin neutral border
      return {
        border: '1px solid #bbb',
        borderWidth: '1px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      };
  }
}

// Create custom icons with images and frame colors matching portrait frames
const createPersonIcon = (
  imageUrl?: string,
  orthodoxyStatus?: OrthodoxyStatus,
  isMartyr?: boolean
) => {
  const size = 36;
  const borderStyle = orthodoxyStatus
    ? getPersonBorderStyle(orthodoxyStatus, isMartyr)
    : {
        border: '2px solid #4a9eff',
        borderWidth: '2px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      };

  const fallbackColor = orthodoxyStatus === 'canonized' ? '#d4af37' :
                        orthodoxyStatus === 'blessed' ? '#c0c0c0' :
                        orthodoxyStatus === 'orthodox' ? '#777' :
                        orthodoxyStatus === 'schismatic' ? '#777' :
                        orthodoxyStatus === 'heresiarch' ? '#5b1a1a' :
                        '#4a9eff';

  const fallbackHtml = `<div style="background-color: ${fallbackColor}; width: ${size}px; height: ${size}px; border-radius: 50%; ${borderStyle.border}; box-shadow: ${borderStyle.boxShadow};"></div>`;
  
  if (!imageUrl) {
    return L.divIcon({
      className: 'custom-marker',
      html: fallbackHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // For striped backgrounds (martyrs), we need a layered approach
  if (borderStyle.background) {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          ${borderStyle.border};
          background: ${borderStyle.background};
          box-shadow: ${borderStyle.boxShadow};
          padding: 2px;
        ">
          <div style="
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-image: url('${imageUrl}');
            background-size: cover;
            background-position: center;
            border: 2px solid white;
          "></div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // For solid borders
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        ${borderStyle.border};
        box-shadow: ${borderStyle.boxShadow};
        overflow: hidden;
        background-color: ${fallbackColor};
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

// Component to track zoom level and render markers
function ZoomAwareMarkers({
  itemsByPlace,
  placeMap,
  onItemClick,
}: {
  itemsByPlace: Map<string, Array<{ type: 'person'; data: Person } | { type: 'event'; data: Event }>>;
  placeMap: Map<string, Place>;
  onItemClick: (item: Person | Event) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const updateZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', updateZoom);
    updateZoom(); // Initial zoom

    return () => {
      map.off('zoomend', updateZoom);
    };
  }, [map]);

  return (
    <>
      {Array.from(itemsByPlace.entries()).map(([placeId, items]) => {
        const place = placeMap.get(placeId);
        if (!place) return null;

        const isImportantSee = IMPORTANT_SEES.has(place.id.toLowerCase());

        return items.map((item, index) => {
          // Calculate offset position for this item with current zoom
          const [lat, lng] = calculateOffsetPosition(
            place.lat,
            place.lng,
            index,
            items.length,
            zoom
          );

          // Determine icon type and image URL
          let icon;
          let imageUrl: string | undefined;
          let itemName: string;

          if (item.type === 'event') {
            const event = item.data;
            itemName = event.name;
            imageUrl = event.imageUrl;

            // Councils get special icon
            if (event.type === 'council') {
              icon = createCouncilIcon(imageUrl);
            } else {
              // Other events use person icon style (no frame colors for events)
              icon = createPersonIcon(imageUrl);
            }
          } else {
            const person = item.data;
            itemName = person.name;
            imageUrl = person.imageUrl;

            // People at important sees get special icon
            if (isImportantSee) {
              icon = createImportantSeeIcon(imageUrl);
            } else {
              // Use frame colors based on orthodoxy status and martyr status
              icon = createPersonIcon(imageUrl, person.orthodoxyStatus, person.isMartyr);
            }
          }

          // Create unique key combining place, type, and item id
          const markerKey = `${placeId}-${item.type}-${item.data.id}-${index}`;

          return (
            <Marker key={markerKey} position={[lat, lng]} icon={icon}>
              <Popup>
                <div>
                  <div
                    onClick={() => onItemClick(item.data)}
                    style={{
                      cursor: 'pointer',
                      color: '#4a9eff',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {itemName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '0.25rem' }}>
                    {place.name}
                  </div>
                  {item.type === 'event' && item.data.type === 'council' && (
                    <div style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic' }}>
                      Council
                    </div>
                  )}
                  {isImportantSee && item.type === 'person' && (
                    <div style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic' }}>
                      Important See
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        });
      }).flat().filter(Boolean)}
    </>
  );
}

export function MapView({ people, events, places, currentYear, onItemClick }: MapViewProps) {
  const activePeople = getActivePeople(people, currentYear);
  const activeEvents = getActiveEvents(events, currentYear);

  // Create a map of placeId -> items at that place for offset calculation
  type MapItem = { type: 'person'; data: Person } | { type: 'event'; data: Event };
  const itemsByPlace = new Map<string, MapItem[]>();

  // Group people by place
  activePeople.forEach(person => {
    person.locations.forEach(loc => {
      if (!itemsByPlace.has(loc.placeId)) {
        itemsByPlace.set(loc.placeId, []);
      }
      itemsByPlace.get(loc.placeId)!.push({ type: 'person', data: person });
    });
  });

  // Group events by place
  activeEvents.forEach(event => {
    if (event.locationId) {
      if (!itemsByPlace.has(event.locationId)) {
        itemsByPlace.set(event.locationId, []);
      }
      itemsByPlace.get(event.locationId)!.push({ type: 'event', data: event });
    }
  });

  // Create a lookup map for places
  const placeMap = new Map<string, Place>();
  places.forEach(place => placeMap.set(place.id, place));

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Event Types */}
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '0.5rem', fontWeight: 'bold' }}>Events</div>
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
                <span style={{ fontSize: '13px' }}>Council</span>
              </div>
            </div>
          </div>

          {/* Special Locations */}
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '0.5rem', fontWeight: 'bold' }}>Locations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                <span style={{ fontSize: '13px' }}>Important See</span>
              </div>
            </div>
          </div>

          {/* People Frame Types */}
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '0.5rem', fontWeight: 'bold' }}>People</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '3px solid #d4af37',
                  boxShadow: '0 0 6px rgba(212, 175, 55, 0.6)',
                  backgroundColor: '#333',
                }}></div>
                <span style={{ fontSize: '13px' }}>Canonized Saint</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  background: 'repeating-linear-gradient(45deg, #d4af37, #d4af37 3px, #a11b1b 3px, #a11b1b 6px)',
                  padding: '2px',
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#333',
                    border: '1px solid white',
                  }}></div>
                </div>
                <span style={{ fontSize: '13px' }}>Martyr</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #c0c0c0',
                  boxShadow: '0 0 4px rgba(192, 192, 192, 0.6)',
                  backgroundColor: '#333',
                }}></div>
                <span style={{ fontSize: '13px' }}>Blessed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #777',
                  backgroundColor: '#f7f7f7',
                }}></div>
                <span style={{ fontSize: '13px' }}>Orthodox Figure</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  background: 'linear-gradient(to right, #777 0%, #777 50%, #b03a2e 50%, #b03a2e 100%)',
                  backgroundColor: '#333',
                }}></div>
                <span style={{ fontSize: '13px' }}>Schismatic</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '3px solid #5b1a1a',
                  boxShadow: '0 0 4px rgba(91, 26, 26, 0.8)',
                  backgroundColor: '#333',
                }}></div>
                <span style={{ fontSize: '13px' }}>Heresiarch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '1px solid #bbb',
                  backgroundColor: '#333',
                }}></div>
                <span style={{ fontSize: '13px' }}>Secular Figure</span>
              </div>
            </div>
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
        <ZoomAwareMarkers
          itemsByPlace={itemsByPlace}
          placeMap={placeMap}
          onItemClick={onItemClick}
        />
      </MapContainer>
    </div>
  );
}
