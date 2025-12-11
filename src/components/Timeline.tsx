import { useMemo, useState } from 'react';
import { Person, Event } from '../types';

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
  const timelineHeight = 400;
  const padding = 60;

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
          {items.map((item) => {
            const startX = getXPosition(item.startYear);
            const endX = getXPosition(item.endYear);
            const centerX = (startX + endX) / 2;
            const isActive = currentYear >= item.startYear && currentYear <= item.endYear;
            
            // Calculate vertical position to avoid overlap
            const yearGroup = Math.floor((item.startYear + item.endYear) / 2);
            const itemsInGroup = items.filter(i => {
              const iYearGroup = Math.floor((i.startYear + i.endYear) / 2);
              return iYearGroup === yearGroup;
            });
            const itemIndex = itemsInGroup.findIndex(i => i.id === item.id);
            const verticalOffset = (itemIndex - itemsInGroup.length / 2) * 40;
            const y = timelineHeight / 2 + verticalOffset;

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
              // Render person as icon
              const iconSize = isActive ? 24 : 20;
              
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
                  
                  {/* Icon based on type */}
                  {item.icon === 'martyr' && (
                    <g
                      transform={`translate(${centerX}, ${y})`}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r={iconSize / 2}
                        fill="#a11b1b"
                        stroke={isActive ? '#4a9eff' : '#fff'}
                        strokeWidth={isActive ? 3 : 2}
                      />
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={iconSize - 8}
                        fontWeight="bold"
                      >
                        ✝
                      </text>
                    </g>
                  )}
                  
                  {item.icon === 'doctor' && (
                    <g
                      transform={`translate(${centerX}, ${y})`}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r={iconSize / 2}
                        fill="#d4af37"
                        stroke={isActive ? '#4a9eff' : '#fff'}
                        strokeWidth={isActive ? 3 : 2}
                      />
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={iconSize - 10}
                      >
                        📖
                      </text>
                    </g>
                  )}
                  
                  {item.icon === 'bishop' && (
                    <g
                      transform={`translate(${centerX}, ${y})`}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r={iconSize / 2}
                        fill="#4a9eff"
                        stroke={isActive ? '#fff' : '#333'}
                        strokeWidth={isActive ? 3 : 2}
                      />
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={iconSize - 10}
                      >
                        ⛪
                      </text>
                    </g>
                  )}
                  
                  {(!item.icon || item.icon === 'person' || item.icon === 'monk') && (
                    <g
                      transform={`translate(${centerX}, ${y})`}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r={iconSize / 2}
                        fill="#888"
                        stroke={isActive ? '#4a9eff' : '#fff'}
                        strokeWidth={isActive ? 3 : 2}
                      />
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={iconSize - 10}
                      >
                        {item.icon === 'monk' ? '⛪' : '👤'}
                      </text>
                    </g>
                  )}
                  
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
          })}
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
