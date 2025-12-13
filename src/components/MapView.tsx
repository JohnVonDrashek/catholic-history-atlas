import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaScroll, FaCrown } from 'react-icons/fa';
import type { Person, Event, Place, OrthodoxyStatus } from '../types';
import type { EventType } from '../types/event';
import { getActivePeople, getActiveEvents } from '../utils/filters';
import { getCachedImageUrl } from '../utils/imageCache';
import { getEventColor } from '../utils/eventColors';
import { calculateAge, getLifeStage, getSizeForLifeStage } from '../utils/ageUtils';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Note: Important sees are now defined in sees.json data file

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
  // Adjusted to provide more spacing at lower zoom levels (zoom 6 and below)
  // At zoom 2: ~1.8 degrees (~200km)
  // At zoom 4: ~0.8 degrees (~89km)
  // At zoom 6: ~0.35 degrees (~39km) - increased from ~0.2
  // At zoom 7: ~0.18 degrees (~20km) - fine as is
  // At zoom 8: ~0.08 degrees (~8.8km)
  // At zoom 10: ~0.032 degrees (~3.5km)
  // At zoom 12: ~0.013 degrees (~1.4km)
  // Formula: baseRadius decreases exponentially as zoom increases
  // Increased base multiplier and adjusted exponent for better spacing at lower zooms
  const baseRadius = 0.7 / Math.pow(1.5, zoom - 4);
  
  // Scale radius based on total count to prevent overlap
  // More aggressive scaling for larger groups, especially at lower zoom levels
  const countMultiplier = zoom <= 6 ? Math.min(1 + totalCount * 0.4, 4.0) : Math.min(1 + totalCount * 0.3, 3.5);
  const radius = baseRadius * countMultiplier;

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
// borderWidthOverride: if provided, overrides the default border width
function getPersonBorderStyle(
  orthodoxyStatus: OrthodoxyStatus,
  isMartyr?: boolean,
  borderWidthOverride?: number
): {
  border: string;
  borderWidth: string;
  boxShadow: string;
  background?: string;
} {
  // Helper to get border width with override
  const getBorderWidth = (defaultWidth: number): number => {
    return borderWidthOverride ?? defaultWidth;
  };

  if (isMartyr && (orthodoxyStatus === 'canonized' || orthodoxyStatus === 'blessed')) {
    // Martyr: gold + red stripes
    const borderWidth = getBorderWidth(3);
    return {
      border: `${borderWidth}px solid transparent`,
      borderWidth: `${borderWidth}px`,
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      background: `repeating-linear-gradient(45deg, #d4af37, #d4af37 4px, #a11b1b 4px, #a11b1b 8px)`,
    };
  }

  switch (orthodoxyStatus) {
    case 'canonized':
      // Canonized saint: solid gold
      const canonizedWidth = getBorderWidth(3);
      return {
        border: `${canonizedWidth}px solid #d4af37`,
        borderWidth: `${canonizedWidth}px`,
        boxShadow: '0 0 6px rgba(212, 175, 55, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    case 'blessed':
      // Blessed: softer gold / silver
      const blessedWidth = getBorderWidth(2);
      return {
        border: `${blessedWidth}px solid #c0c0c0`,
        borderWidth: `${blessedWidth}px`,
        boxShadow: '0 0 4px rgba(192, 192, 192, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    case 'orthodox':
      // Orthodox-but-not-saint: stone/gray
      const orthodoxWidth = getBorderWidth(2);
      return {
        border: `${orthodoxWidth}px solid #777`,
        borderWidth: `${orthodoxWidth}px`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        background: '#f7f7f7',
      };
    case 'schismatic':
      // Schismatic: black and neon red diagonal stripes
      const schismaticWidth = getBorderWidth(3);
      return {
        border: `${schismaticWidth}px solid transparent`,
        borderWidth: `${schismaticWidth}px`,
        background: 'repeating-linear-gradient(45deg, #000000 0px, #000000 6px, #ff073a 6px, #ff073a 12px)',
        boxShadow: '0 0 4px rgba(255, 7, 58, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    case 'heresiarch':
      // Heresiarch: black and neon green diagonal stripes
      const heresiarchWidth = getBorderWidth(3);
      return {
        border: `${heresiarchWidth}px solid transparent`,
        borderWidth: `${heresiarchWidth}px`,
        background: 'repeating-linear-gradient(45deg, #000000 0px, #000000 6px, #39ff14 6px, #39ff14 12px)',
        boxShadow: '0 0 4px rgba(57, 255, 20, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    case 'secular':
    default:
      // Secular: thin neutral border
      const secularWidth = getBorderWidth(1);
      return {
        border: `${secularWidth}px solid #bbb`,
        borderWidth: `${secularWidth}px`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      };
  }
}

// Create custom icons with images and frame colors matching portrait frames
// Now supports aspect ratio for rectangular images and age-based sizing
const createPersonIcon = (
  imageUrl: string | undefined,
  orthodoxyStatus: OrthodoxyStatus | undefined,
  isMartyr: boolean | undefined,
  aspectRatio: number,
  hasWritings: boolean,
  isPope: boolean,
  person: Person,
  currentYear: number
) => {
  // Calculate age and life stage for size/border adjustments
  const age = calculateAge(person, currentYear);
  const lifeStage = getLifeStage(age);
  const baseSize = 40;
  const maxSize = getSizeForLifeStage(lifeStage, baseSize); // Adjust size based on life stage
  
  // Determine border width based on life stage and orthodoxy status
  // Prime age (30-60) gets thicker borders to indicate they're in their most active years
  const getBorderWidthForStatus = (status: OrthodoxyStatus | undefined, martyr: boolean | undefined): number => {
    const isPrime = lifeStage === 'prime';
    
    if (martyr && (status === 'canonized' || status === 'blessed')) {
      return isPrime ? 4 : 3;
    }
    
    switch (status) {
      case 'canonized': return isPrime ? 4 : 3;
      case 'blessed': return isPrime ? 3 : 2;
      case 'orthodox': return isPrime ? 3 : 2;
      case 'schismatic': return isPrime ? 4 : 3;
      case 'heresiarch': return isPrime ? 4 : 3;
      case 'secular':
      default: return isPrime ? 2 : 1;
    }
  };
  
  const borderWidthOverride = orthodoxyStatus ? getBorderWidthForStatus(orthodoxyStatus, isMartyr) : (lifeStage === 'prime' ? 2 : 1);
  
  const borderStyle = orthodoxyStatus
    ? getPersonBorderStyle(orthodoxyStatus, isMartyr, borderWidthOverride)
    : {
        border: `${borderWidthOverride ?? 2}px solid #4a9eff`,
        borderWidth: `${borderWidthOverride ?? 2}px`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      };

  const fallbackColor = orthodoxyStatus === 'canonized' ? '#d4af37' :
                        orthodoxyStatus === 'blessed' ? '#c0c0c0' :
                        orthodoxyStatus === 'orthodox' ? '#777' :
                        orthodoxyStatus === 'schismatic' ? '#000000' :
                        orthodoxyStatus === 'heresiarch' ? '#000000' :
                        '#4a9eff';

  // Calculate dimensions based on aspect ratio
  let width = maxSize;
  let height = maxSize;
  if (aspectRatio > 1) {
    // Wider than tall
    height = maxSize / aspectRatio;
  } else if (aspectRatio < 1) {
    // Taller than wide
    width = maxSize * aspectRatio;
  }

  const borderRadius = 4; // Small rounded corners instead of circle
  const framePadding = (orthodoxyStatus === 'canonized' && !isMartyr) ? 2 : 4;
  const frameWidth = width + framePadding * 2;
  const frameHeight = height + framePadding * 2;
  
  // Add translucency for young people - apply to entire marker
  const markerOpacity = lifeStage === 'young' ? 0.6 : 1.0;

  // Crown icon HTML (if person is pope) - using react-icons component
  const crownIconHtml = isPope ? renderToStaticMarkup(
    <div style={{
      position: 'absolute',
      top: `${framePadding}px`,
      left: `${framePadding}px`,
      width: '14px',
      height: '14px',
      zIndex: 10,
      filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.8))',
    }}>
      <FaCrown style={{ 
        color: '#FFD700', 
        fontSize: '14px',
        filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
        stroke: '#000',
        strokeWidth: '0.5px',
        paintOrder: 'stroke fill'
      }} />
    </div>
  ) : '';

  // Scroll icon HTML (if person has writings) - using react-icons component
  const scrollIconHtml = hasWritings ? renderToStaticMarkup(
    <div style={{
      position: 'absolute',
      top: `${framePadding}px`,
      right: `${framePadding}px`,
      width: '14px',
      height: '14px',
      zIndex: 10,
      filter: 'drop-shadow(0 0 2px rgba(0, 217, 255, 0.8))',
    }}>
      <FaScroll style={{ 
        color: '#00D9FF', 
        fontSize: '14px',
        filter: 'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
        stroke: '#000',
        strokeWidth: '0.5px',
        paintOrder: 'stroke fill'
      }} />
    </div>
  ) : '';

  const fallbackHtml = `<div style="position: relative; background-color: ${fallbackColor}; width: ${frameWidth}px; height: ${frameHeight}px; border-radius: ${borderRadius}px; ${borderStyle.border}; box-shadow: ${borderStyle.boxShadow}; opacity: ${markerOpacity};">${crownIconHtml}${scrollIconHtml}</div>`;
  
  if (!imageUrl) {
    return L.divIcon({
      className: 'custom-marker',
      html: fallbackHtml,
      iconSize: [frameWidth, frameHeight],
      iconAnchor: [frameWidth / 2, frameHeight / 2],
    });
  }

  // For striped backgrounds (martyrs), we need a layered approach
  if (borderStyle.background) {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          position: relative;
          width: ${frameWidth}px;
          height: ${frameHeight}px;
          border-radius: ${borderRadius}px;
          ${borderStyle.border};
          background: ${borderStyle.background};
          box-shadow: ${borderStyle.boxShadow};
          padding: ${framePadding}px;
          opacity: ${markerOpacity};
        ">
          <div style="
            width: ${width}px;
            height: ${height}px;
            border-radius: ${borderRadius - 2}px;
            background-image: url('${imageUrl}');
            background-size: cover;
            background-position: center;
            border: 2px solid white;
          "></div>
          ${crownIconHtml}${scrollIconHtml}
        </div>
      `,
      iconSize: [frameWidth, frameHeight],
      iconAnchor: [frameWidth / 2, frameHeight / 2],
    });
  }

  // For solid borders
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: ${frameWidth}px;
        height: ${frameHeight}px;
        border-radius: ${borderRadius}px;
        ${borderStyle.border};
        box-shadow: ${borderStyle.boxShadow};
        overflow: visible;
        background-color: ${fallbackColor};
        padding: ${framePadding}px;
        box-sizing: border-box;
        opacity: ${markerOpacity};
      ">
        <div style="
          width: ${width}px;
          height: ${height}px;
          border-radius: ${borderRadius - 2}px;
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
        "></div>
        ${crownIconHtml}${scrollIconHtml}
      </div>
    `,
    iconSize: [frameWidth, frameHeight],
    iconAnchor: [frameWidth / 2, frameHeight / 2],
  });
};

const createEventIcon = (eventType: EventType, imageUrl?: string) => {
  const size = 40;
  const color = getEventColor(eventType);
  const symbol = eventType === 'council' ? '★' : 
                 eventType === 'schism' ? '⚡' :
                 eventType === 'persecution' ? '✟' :
                 eventType === 'reform' ? '♻' :
                 eventType === 'heresy' ? '⚠' :
                 eventType === 'war' ? '⚔' : '●';
  const isDiamond = eventType === 'council';
  
  // For events without images, show the colored symbol on a white circular background
  if (!imageUrl) {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background-color: white;
            border: 2px solid ${color.fill};
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              color: ${color.fill};
              font-size: ${isDiamond ? '24px' : '20px'};
              font-weight: bold;
              line-height: 1;
            ">${symbol}</div>
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // For councils, use the diamond shape with image
  if (eventType === 'council') {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          border-radius: 0;
          transform: rotate(45deg);
          border: 3px solid ${color.fill};
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          overflow: hidden;
          background-color: ${color.fill};
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            color: ${color.textColor};
            font-size: 18px;
            font-weight: bold;
            text-shadow: 0 0 4px rgba(0,0,0,0.8);
          ">${symbol}</div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // For other event types, use circular icon with colored border
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid ${color.fill};
        box-shadow: 0 2px 6px rgba(0,0,0,0.4), 0 0 8px ${color.fill}80;
        overflow: hidden;
        background-color: ${color.fill};
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: ${color.textColor};
          font-size: 18px;
          font-weight: bold;
          text-shadow: 0 0 4px rgba(0,0,0,0.8);
        ">${symbol}</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createImportantSeeIcon = () => {
  const size = 44;
  // Church icon SVG - cathedral/church building with cross
  const churchIconSvg = `
    <svg width="${size - 8}" height="${size - 8}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
      <!-- Church building -->
      <path d="M12 2L3 7V20H21V7L12 2Z" fill="#d4af37" stroke="#8b6914" stroke-width="1.2"/>
      <!-- Door -->
      <rect x="10" y="14" width="4" height="6" fill="#8b6914" rx="1"/>
      <!-- Windows -->
      <rect x="5" y="10" width="3" height="3" fill="#fff" rx="0.5"/>
      <rect x="16" y="10" width="3" height="3" fill="#fff" rx="0.5"/>
      <!-- Cross on top -->
      <path d="M12 2L12 0M9 2L12 2M15 2L12 2" stroke="#8b6914" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="2" r="1.5" fill="#8b6914"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid #d4af37;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4), 0 0 8px rgba(212, 175, 55, 0.6);
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        box-sizing: border-box;
      ">
        ${churchIconSvg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

import type { See } from '../types';

interface MapViewProps {
  people: Person[];
  events: Event[];
  places: Place[];
  sees: See[];
  currentYear: number;
  onItemClick: (item: Person | Event) => void;
}

// Component to display zoom level
function ZoomDisplay() {
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
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(26, 26, 26, 0.9)',
      padding: '0.5rem 0.75rem',
      borderRadius: '8px',
      zIndex: 1000,
      color: '#fff',
      fontSize: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      fontFamily: 'monospace',
    }}>
      Zoom: {zoom.toFixed(1)}
    </div>
  );
}

// Component to track zoom level and render markers
function ZoomAwareMarkers({
  itemsByPlace,
  placeMap,
  activeSees,
  onItemClick,
  currentYear,
}: {
  itemsByPlace: Map<string, Array<{ type: 'person'; data: Person } | { type: 'event'; data: Event }>>;
  placeMap: Map<string, Place>;
  activeSees: See[];
  onItemClick: (item: Person | Event) => void;
  currentYear: number;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [imageAspectRatios, setImageAspectRatios] = useState<Map<string, number>>(new Map());

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

  // Load images and calculate aspect ratios
  useEffect(() => {
    const loadImageAspectRatios = async () => {
      const newRatios = new Map<string, number>();
      const promises: Promise<void>[] = [];

      // Collect all unique image URLs
      const imageUrls = new Set<string>();
      Array.from(itemsByPlace.values()).flat().forEach(item => {
        if (item.data.imageUrl) {
          imageUrls.add(item.data.imageUrl);
        }
      });

      // Load aspect ratios for images we don't have yet
      imageUrls.forEach(imageUrl => {
        if (!imageAspectRatios.has(imageUrl)) {
          const promise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const ratio = img.naturalWidth / img.naturalHeight;
              newRatios.set(imageUrl, ratio);
              resolve();
            };
            img.onerror = () => {
              // Default to 1:1 if image fails to load
              newRatios.set(imageUrl, 1);
              resolve();
            };
            img.src = imageUrl;
          });
          promises.push(promise);
        }
      });

      await Promise.all(promises);
      
      if (newRatios.size > 0) {
        setImageAspectRatios(prev => {
          const merged = new Map(prev);
          newRatios.forEach((ratio, url) => merged.set(url, ratio));
          return merged;
        });
      }
    };

    loadImageAspectRatios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsByPlace]);

  return (
    <>
      {/* Render sees as independent markers - always centered */}
      {activeSees.map(see => {
        const place = placeMap.get(see.placeId);
        if (!place) return null;

        // Sees are always positioned at the exact center (base location)
        const lat = place.lat;
        const lng = place.lng;

        const seeTypeLabel = see.type === 'patriarchate' ? 'Patriarchate' : 
                            see.type === 'major-see' ? 'Major See' : 
                            'Apostolic See';

        return (
          <Marker key={`see-${see.id}`} position={[lat, lng]} icon={createImportantSeeIcon()}>
            <Popup>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '0.25rem', color: '#4a9eff' }}>
                  {see.name}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '0.25rem' }}>
                  {place.name}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                  {seeTypeLabel}
                </div>
                {see.description && (
                  <div style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.4' }}>
                    {see.description}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Render people and events */}
      {Array.from(itemsByPlace.entries()).map(([placeId, items]) => {
        const place = placeMap.get(placeId);
        if (!place) return null;

        return items.map((item, index) => {
          // Calculate phantom positions to ensure well-formed circle
          // Pattern: 1 real → 3 phantoms, 2 real → 2 phantoms, 3 real → 1 phantom, 4+ real → 0 phantoms
          // This ensures at least 4 positions on the circle for better visual distribution
          const realCount = items.length;
          let phantomCount = 0;
          if (realCount === 1) {
            phantomCount = 3; // 1 real + 3 phantoms = 4 total
          } else if (realCount === 2) {
            phantomCount = 2; // 2 real + 2 phantoms = 4 total
          } else if (realCount === 3) {
            phantomCount = 1; // 3 real + 1 phantom = 4 total
          }
          // 4+ real markers: no phantoms needed
          
          // For places with sees, the see is at the center, so we don't count it in the circle positions
          // Total positions on the circle = real markers + phantom positions
          const totalCount = realCount + phantomCount;
          
          const [lat, lng] = calculateOffsetPosition(
            place.lat,
            place.lng,
            index,
            totalCount,
            zoom
          );

          // Determine icon type and image URL
          let icon;
          let imageUrl: string | undefined;
          let itemName: string;
          let aspectRatio = 1; // Default to square

          if (item.type === 'event') {
            const event = item.data;
            itemName = event.name;
            imageUrl = event.imageUrl;
            if (imageUrl) {
              aspectRatio = imageAspectRatios.get(imageUrl) || 1;
            }

            // Get cached image URL for map context (80px max)
            const cachedImageUrl = getCachedImageUrl(imageUrl, 'map', 80);

            // Events get colored icons based on type
            icon = createEventIcon(event.type, cachedImageUrl);
          } else {
            const person = item.data;
            itemName = person.name;
            imageUrl = person.imageUrl;
            if (imageUrl) {
              aspectRatio = imageAspectRatios.get(imageUrl) || 1;
            }

            const hasWritings = !!(person.writings && person.writings.length > 0);

            // Get cached image URL for map context (80px max)
            const cachedImageUrl = getCachedImageUrl(imageUrl, 'map', 80);

            // Always use frame colors based on orthodoxy status and martyr status
            // Important sees will be shown as separate independent markers
            const isPope = person.roles?.includes('pope') || false;
            icon = createPersonIcon(cachedImageUrl, person.orthodoxyStatus, person.isMartyr, aspectRatio, hasWritings, isPope, person, currentYear);
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
                  {item.type === 'event' && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: getEventColor(item.data.type).fill,
                      fontStyle: 'italic',
                      fontWeight: 'bold'
                    }}>
                      {getEventColor(item.data.type).label}
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

export function MapView({ people, events, places, sees, currentYear, onItemClick }: MapViewProps) {
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

  // Filter sees that are active in the current year
  const activeSees = sees.filter(see => {
    const start = see.startYear ?? -Infinity;
    const end = see.endYear ?? Infinity;
    return currentYear >= start && currentYear <= end;
  });

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(['council', 'schism', 'persecution', 'reform', 'heresy', 'war', 'other'] as EventType[]).map(type => {
                const color = getEventColor(type);
                const symbol = type === 'council' ? '★' : 
                               type === 'schism' ? '⚡' :
                               type === 'persecution' ? '✟' :
                               type === 'reform' ? '♻' :
                               type === 'heresy' ? '⚠' :
                               type === 'war' ? '⚔' : '●';
                const isDiamond = type === 'council';
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      backgroundColor: color.fill,
                      width: '18px',
                      height: '18px',
                      borderRadius: isDiamond ? '0' : '50%',
                      transform: isDiamond ? 'rotate(45deg)' : 'none',
                      border: `2px solid ${color.stroke}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      position: 'relative',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) ${isDiamond ? 'rotate(-45deg)' : 'none'}`,
                        color: color.textColor,
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}>{symbol}</div>
                    </div>
                    <span style={{ fontSize: '12px' }}>{color.label}</span>
                  </div>
                );
              })}
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
          activeSees={activeSees}
          onItemClick={onItemClick}
          currentYear={currentYear}
        />
        <ZoomDisplay />
      </MapContainer>
    </div>
  );
}
