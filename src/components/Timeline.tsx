import { useMemo, useState } from 'react';
import { Person, Event } from '../types';
import type { OrthodoxyStatus } from '../types/person';

interface TimelineProps {
  people: Person[];
  events: Event[];
  currentYear: number;
  onItemClick: (item: Person | Event) => void;
  onYearChange: (year: number) => void;
}

interface TimelineItem {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  type: 'person' | 'event';
  data: Person | Event;
  icon?: string;
}

export function Timeline({ people, events, currentYear, onItemClick, onYearChange }: TimelineProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [imageAspectRatios, setImageAspectRatios] = useState<Map<string, number>>(new Map());

  // Calculate the time range for the timeline
  const { minYear, maxYear, items } = useMemo(() => {
    const allItems: TimelineItem[] = [];

    // Add people
    people.forEach((person) => {
      const start = person.birthYear ?? person.deathYear - 80; // Estimate if no birth year
      const end = person.deathYear;
      
      // Determine icon based on roles
      let icon = 'person';
      if (person.isMartyr) {
        icon = 'martyr';
      } else if (person.roles?.includes('doctor of the Church')) {
        icon = 'doctor';
      } else if (person.roles?.includes('bishop')) {
        icon = 'bishop';
      } else if (person.roles?.includes('monk')) {
        icon = 'monk';
      }

      allItems.push({
        id: person.id,
        name: person.name,
        startYear: start,
        endYear: end,
        type: 'person',
        data: person,
        icon,
      });
    });

    // Add events
    events.forEach((event) => {
      allItems.push({
        id: event.id,
        name: event.name,
        startYear: event.startYear,
        endYear: event.endYear ?? event.startYear,
        type: 'event',
        data: event,
      });
    });

    const minYear = Math.min(...allItems.map(item => item.startYear));
    const maxYear = Math.max(...allItems.map(item => item.endYear));
    
    return { minYear, maxYear, items: allItems };
  }, [people, events]);

  const timelineWidth = 1000; // Fixed width for the timeline
  const timelineHeight = 600; // Increased height for more vertical space
  const padding = 60;
  const maxVerticalOffset = 200; // Maximum distance above/below timeline
  const portraitSize = 40; // Size of portrait images on timeline

  // Get frame style for portrait based on orthodoxy status
  const getFrameStyle = (orthodoxyStatus: OrthodoxyStatus, isMartyr?: boolean) => {
    if (isMartyr && (orthodoxyStatus === 'canonized' || orthodoxyStatus === 'blessed')) {
      return {
        stroke: 'none',
        fill: 'url(#martyrPattern)',
        strokeWidth: 0,
      };
    }

    switch (orthodoxyStatus) {
      case 'canonized':
        return { stroke: '#d4af37', strokeWidth: 3, fill: 'none' };
      case 'blessed':
        return { stroke: '#c0c0c0', strokeWidth: 2, fill: 'none' };
      case 'orthodox':
        return { stroke: '#777', strokeWidth: 2, fill: '#f7f7f7' };
      case 'schismatic':
        return { stroke: 'url(#schismaticGradient)', strokeWidth: 3, fill: 'none' };
      case 'heresiarch':
        return { stroke: '#5b1a1a', strokeWidth: 3, fill: 'none' };
      case 'secular':
      default:
        return { stroke: '#bbb', strokeWidth: 1, fill: 'none' };
    }
  };

  const getXPosition = (year: number) => {
    const range = maxYear - minYear;
    if (range === 0) return padding;
    return padding + ((year - minYear) / range) * (timelineWidth - 2 * padding);
  };

  const getYearFromX = (x: number) => {
    const range = maxYear - minYear;
    const relativeX = x - padding;
    return Math.round(minYear + (relativeX / (timelineWidth - 2 * padding)) * range);
  };

  const handleItemClick = (item: TimelineItem) => {
    // Jump to the start year of the item
    onYearChange(item.startYear);
    // Open the detail modal
    onItemClick(item.data);
  };

  const handleTimelineClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const year = getYearFromX(x);
    onYearChange(year);
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#1a1a1a', minHeight: '100%' }}>
      <h2 style={{ marginBottom: '2rem', color: '#fff' }}>Timeline View</h2>
      
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '2rem', 
        borderRadius: '8px',
        overflowX: 'auto',
      }}>
        <svg
          width={timelineWidth}
          height={timelineHeight}
          onClick={handleTimelineClick}
          style={{ cursor: 'pointer' }}
        >
          {/* Definitions for patterns and gradients */}
          <defs>
            {/* Martyr pattern: gold and red diagonal stripes */}
            <pattern id="martyrPattern" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
              <rect width="6" height="12" fill="#d4af37" />
              <rect x="6" width="6" height="12" fill="#a11b1b" />
            </pattern>
            {/* Schismatic gradient: gray to red split */}
            <linearGradient id="schismaticGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#777" />
              <stop offset="50%" stopColor="#777" />
              <stop offset="50%" stopColor="#b03a2e" />
              <stop offset="100%" stopColor="#b03a2e" />
            </linearGradient>
          </defs>

          {/* Timeline line */}
          <line
            x1={padding}
            y1={timelineHeight / 2}
            x2={timelineWidth - padding}
            y2={timelineHeight / 2}
            stroke="#666"
            strokeWidth="2"
          />

          {/* Current year indicator */}
          <line
            x1={getXPosition(currentYear)}
            y1={timelineHeight / 2 - 20}
            x2={getXPosition(currentYear)}
            y2={timelineHeight / 2 + 20}
            stroke="#4a9eff"
            strokeWidth="3"
          />
          <circle
            cx={getXPosition(currentYear)}
            cy={timelineHeight / 2}
            r="8"
            fill="#4a9eff"
          />
          <text
            x={getXPosition(currentYear)}
            y={timelineHeight / 2 - 30}
            textAnchor="middle"
            fill="#4a9eff"
            fontSize="14"
            fontWeight="bold"
          >
            {currentYear}
          </text>

          {/* Year markers */}
          {(() => {
            const markers = [];
            const step = Math.max(50, Math.ceil((maxYear - minYear) / 10));
            for (let year = minYear; year <= maxYear; year += step) {
              const x = getXPosition(year);
              markers.push(
                <g key={year}>
                  <line
                    x1={x}
                    y1={timelineHeight / 2 - 5}
                    x2={x}
                    y2={timelineHeight / 2 + 5}
                    stroke="#888"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={timelineHeight / 2 + 25}
                    textAnchor="middle"
                    fill="#aaa"
                    fontSize="12"
                  >
                    {year}
                  </text>
                </g>
              );
            }
            return markers;
          })()}

          {/* Render items */}
          {(() => {
            // Improved vertical positioning algorithm
            // Sort items by start year, then by end year for consistent ordering
            const sortedItems = [...items].sort((a, b) => {
              if (a.startYear !== b.startYear) return a.startYear - b.startYear;
              return a.endYear - b.endYear;
            });

            // Calculate vertical positions to avoid overlaps
            const itemPositions = new Map<string, number>();

            sortedItems.forEach((item) => {
              const startX = getXPosition(item.startYear);
              const endX = getXPosition(item.endYear);
              
              // Find a vertical position that doesn't overlap with nearby items
              let bestY = timelineHeight / 2;
              let minOverlap = Infinity;

              // Try different vertical offsets
              for (let offset = 0; offset <= maxVerticalOffset; offset += 30) {
                // Try both above and below
                for (const direction of [-1, 1]) {
                  const testY = timelineHeight / 2 + (offset * direction);
                  
                  // Check for overlaps with nearby items
                  let overlapCount = 0;
                  sortedItems.forEach((otherItem) => {
                    if (otherItem.id === item.id || !itemPositions.has(otherItem.id)) return;
                    
                    const otherY = itemPositions.get(otherItem.id)!;
                    const otherStartX = getXPosition(otherItem.startYear);
                    const otherEndX = getXPosition(otherItem.endYear);
                    
                    // Check if items overlap horizontally
                    const horizontalOverlap = !(endX < otherStartX || startX > otherEndX);
                    
                    // Check if items are too close vertically
                    const verticalDistance = Math.abs(testY - otherY);
                    const minVerticalDistance = 35; // Minimum spacing between items
                    
                    if (horizontalOverlap && verticalDistance < minVerticalDistance) {
                      overlapCount++;
                    }
                  });
                  
                  if (overlapCount < minOverlap) {
                    minOverlap = overlapCount;
                    bestY = testY;
                  }
                }
              }

              // If still overlapping, try alternating pattern
              if (minOverlap > 0) {
                const itemIndex = sortedItems.findIndex(i => i.id === item.id);
                const alternatingOffset = ((itemIndex % 4) - 1.5) * 50;
                bestY = timelineHeight / 2 + alternatingOffset;
              }

              itemPositions.set(item.id, bestY);
            });

            return sortedItems.map((item) => {
              const startX = getXPosition(item.startYear);
              const endX = getXPosition(item.endYear);
              const centerX = (startX + endX) / 2;
              const isActive = currentYear >= item.startYear && currentYear <= item.endYear;
              const y = itemPositions.get(item.id) || timelineHeight / 2;

            if (item.type === 'event') {
              // Render event as a bar
              const event = item.data as Event;
              const width = Math.max(20, endX - startX);
              
              return (
                <g key={item.id}>
                  <rect
                    x={startX}
                    y={y - 10}
                    width={width}
                    height="20"
                    fill={event.type === 'council' ? '#ffd700' : '#ff6b6b'}
                    stroke={isActive ? '#4a9eff' : '#333'}
                    strokeWidth={isActive ? 2 : 1}
                    rx="4"
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ cursor: 'pointer' }}
                  />
                  {hoveredItem === item.id && (
                    <g>
                      <rect
                        x={centerX - 60}
                        y={y - 40}
                        width="120"
                        height="25"
                        fill="#000"
                        fillOpacity="0.8"
                        rx="4"
                      />
                      <text
                        x={centerX}
                        y={y - 22}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="12"
                      >
                        {item.name} ({item.startYear})
                      </text>
                    </g>
                  )}
                </g>
              );
            } else {
              // Render person as portrait with frame
              const person = item.data as Person;
              const baseImageSize = isActive ? portraitSize + 4 : portraitSize;
              
              // Get aspect ratio for this image (default to 1:1 if not loaded yet)
              const aspectRatio = imageAspectRatios.get(item.id) || 1;
              
              // Calculate image dimensions based on aspect ratio
              // Keep the larger dimension at baseImageSize
              let imageWidth = baseImageSize;
              let imageHeight = baseImageSize;
              if (aspectRatio > 1) {
                // Wider than tall
                imageHeight = baseImageSize / aspectRatio;
              } else if (aspectRatio < 1) {
                // Taller than wide
                imageWidth = baseImageSize * aspectRatio;
              }
              
              const framePadding = 6;
              const frameWidth = imageWidth + framePadding * 2;
              const frameHeight = imageHeight + framePadding * 2;
              const frameStyle = getFrameStyle(person.orthodoxyStatus, person.isMartyr);
              
              return (
                <g key={item.id}>
                  {/* Line connecting to timeline */}
                  <line
                    x1={centerX}
                    y1={timelineHeight / 2}
                    x2={centerX}
                    y2={y}
                    stroke={isActive ? '#4a9eff' : '#666'}
                    strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={isActive ? '0' : '3,3'}
                  />
                  
                  {/* Portrait with frame */}
                  <g
                    transform={`translate(${centerX}, ${y})`}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Define clip path for this item */}
                    <defs>
                      <clipPath id={`clip-${item.id}`}>
                        <rect
                          x={-imageWidth / 2}
                          y={-imageHeight / 2}
                          width={imageWidth}
                          height={imageHeight}
                          rx="4"
                        />
                      </clipPath>
                    </defs>
                    
                    {/* Frame border/background */}
                    <rect
                      x={-frameWidth / 2}
                      y={-frameHeight / 2}
                      width={frameWidth}
                      height={frameHeight}
                      rx="8"
                      {...frameStyle}
                    />
                    
                    {/* White inner border for martyrs */}
                    {(person.isMartyr && (person.orthodoxyStatus === 'canonized' || person.orthodoxyStatus === 'blessed')) && (
                      <rect
                        x={-imageWidth / 2 - 2}
                        y={-imageHeight / 2 - 2}
                        width={imageWidth + 4}
                        height={imageHeight + 4}
                        rx="6"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      />
                    )}
                    
                    {/* Person image with clipping */}
                    <g clipPath={`url(#clip-${item.id})`}>
                      {person.imageUrl ? (
                        <image
                          href={person.imageUrl}
                          x={-imageWidth / 2}
                          y={-imageHeight / 2}
                          width={imageWidth}
                          height={imageHeight}
                          onLoad={() => {
                            // Calculate aspect ratio when image loads
                            // Use a temporary HTML image to get natural dimensions
                            const tempImg = new Image();
                            tempImg.onload = () => {
                              const ratio = tempImg.naturalWidth / tempImg.naturalHeight;
                              setImageAspectRatios(prev => {
                                const newMap = new Map(prev);
                                newMap.set(item.id, ratio);
                                return newMap;
                              });
                            };
                            tempImg.src = person.imageUrl || '';
                          }}
                          onError={(e) => {
                            // Fallback to placeholder if image fails
                            const target = e.target as SVGImageElement;
                            const initials = person.name
                              .split(' ')
                              .map(n => n[0])
                              .filter(Boolean)
                              .slice(-2)
                              .join('');
                            target.href.baseVal = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${baseImageSize}" height="${baseImageSize}"><rect width="${baseImageSize}" height="${baseImageSize}" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ccc" font-family="Arial" font-size="${baseImageSize / 2}">${initials}</text></svg>`)}`;
                          }}
                        />
                      ) : (
                        // Fallback placeholder
                        <rect
                          x={-imageWidth / 2}
                          y={-imageHeight / 2}
                          width={imageWidth}
                          height={imageHeight}
                          rx="4"
                          fill="#333"
                        />
                      )}
                    </g>
                    
                    {/* Active indicator - use ellipse for non-square frames */}
                    {isActive && (
                      <ellipse
                        cx="0"
                        cy="0"
                        rx={frameWidth / 2 + 2}
                        ry={frameHeight / 2 + 2}
                        fill="none"
                        stroke="#4a9eff"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                    )}
                  </g>
                  
                  {hoveredItem === item.id && (
                    <g>
                      <rect
                        x={centerX - 80}
                        y={y - 50}
                        width="160"
                        height="35"
                        fill="#000"
                        fillOpacity="0.9"
                        rx="4"
                      />
                      <text
                        x={centerX}
                        y={y - 30}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        {item.name}
                      </text>
                      <text
                        x={centerX}
                        y={y - 15}
                        textAnchor="middle"
                        fill="#aaa"
                        fontSize="11"
                      >
                        {item.startYear}–{item.endYear}
                      </text>
                    </g>
                  )}
                </g>
              );
            }
            });
          })()}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '2rem', color: '#aaa', fontSize: '14px' }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Legend</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#a11b1b', fontSize: '20px' }}>✝</span>
            <span>Martyr</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#d4af37', fontSize: '20px' }}>📖</span>
            <span>Doctor of the Church</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#4a9eff', fontSize: '20px' }}>⛪</span>
            <span>Bishop</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#888', fontSize: '20px' }}>👤</span>
            <span>Other</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '30px', height: '15px', backgroundColor: '#ffd700', borderRadius: '4px' }}></div>
            <span>Council</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '30px', height: '15px', backgroundColor: '#ff6b6b', borderRadius: '4px' }}></div>
            <span>Other Event</span>
          </div>
        </div>
      </div>
    </div>
  );
}
