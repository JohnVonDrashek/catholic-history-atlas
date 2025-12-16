import { useMemo, useState, useRef, useEffect } from 'react';
import { FaScroll, FaCrown } from 'react-icons/fa';
import { Person, Event } from '../types';
import type { OrthodoxyStatus } from '../types/person';
import type { EventType } from '../types/event';
import { getEventColor } from '../utils/eventColors';
import { storage } from '../utils/storage';
import {
  type TimelineFilters,
  type TimelineItem,
  type SerializedTimelineFilters,
  STORAGE_KEY,
  serializeFilters,
  deserializeFilters,
} from './timeline/timelineTypes';
import { filterPeople, filterEvents } from './timeline/filterUtils';
import { TimelineFiltersPanel } from './timeline/TimelineFilters';
import { TimelineControls } from './timeline/TimelineControls';

interface TimelineProps {
  people: Person[];
  events: Event[];
  currentYear: number;
  onItemClick: (item: Person | Event) => void;
  onYearChange: (year: number) => void;
}

export function Timeline({
  people,
  events,
  currentYear,
  onItemClick,
  onYearChange,
}: TimelineProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [imageAspectRatios, setImageAspectRatios] = useState<Map<string, number>>(new Map());
  const [zoomLevel, setZoomLevel] = useState(0); // 0 = full range, higher = more zoomed in
  const [viewCenter, setViewCenter] = useState<number | null>(null); // Center year of the view
  const [showFilters, setShowFilters] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInputValue, setZoomInputValue] = useState('100');

  // Collect all unique roles and traditions from people (needed for defaults)
  const allRoles = useMemo(() => {
    const roles = new Set<string>();
    people.forEach((p) => p.roles?.forEach((r) => roles.add(r)));
    return roles;
  }, [people]);

  const allTraditions = useMemo(() => {
    const traditions = new Set<string>();
    people.forEach((p) => {
      if (p.primaryTradition) traditions.add(p.primaryTradition);
    });
    return traditions;
  }, [people]);

  // Initialize filters with all options enabled, loading from localStorage if available
  const [filters, setFilters] = useState<TimelineFilters>(() => {
    // Collect all unique roles and traditions from people
    const defaultRoles = new Set<string>();
    const defaultTraditions = new Set<string>();
    people.forEach((p) => {
      p.roles?.forEach((r) => defaultRoles.add(r));
      if (p.primaryTradition) defaultTraditions.add(p.primaryTradition);
    });

    // Try to load from localStorage using safe storage wrapper
    const stored = storage.getItem<SerializedTimelineFilters | null>(STORAGE_KEY, null);
    if (stored) {
      return deserializeFilters(stored, defaultRoles, defaultTraditions);
    }

    // Return defaults if nothing stored
    return {
      showPeople: true,
      showEvents: true,
      orthodoxyStatus: new Set<OrthodoxyStatus>([
        'canonized',
        'blessed',
        'orthodox',
        'schismatic',
        'heresiarch',
        'secular',
      ]),
      showMartyrs: null, // null = show all
      roles: defaultRoles,
      primaryTradition: defaultTraditions,
      eventTypes: new Set<EventType>([
        'council',
        'schism',
        'persecution',
        'reform',
        'heresy',
        'war',
        'other',
      ]),
      showPopes: null, // null = show all
      showWithWritings: null, // null = show all
    };
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const serialized = serializeFilters(filters);
    storage.setItem(STORAGE_KEY, serialized);
  }, [filters]);

  // Filter people and events based on filter criteria
  const filteredPeople = useMemo(() => filterPeople(people, filters), [people, filters]);
  const filteredEvents = useMemo(() => filterEvents(events, filters), [events, filters]);

  // Calculate the time range for the timeline
  const { minYear, maxYear, items } = useMemo(() => {
    const allItems: TimelineItem[] = [];

    // Add filtered people
    filteredPeople.forEach((person) => {
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

    // Add filtered events
    filteredEvents.forEach((event) => {
      allItems.push({
        id: event.id,
        name: event.name,
        startYear: event.startYear,
        endYear: event.endYear ?? event.startYear,
        type: 'event',
        data: event,
      });
    });

    const minYear = Math.min(...allItems.map((item) => item.startYear));
    const calculatedMaxYear = Math.max(...allItems.map((item) => item.endYear));
    const maxYear = Math.max(calculatedMaxYear, 2100); // Extend timeline to 2100

    return { minYear, maxYear, items: allItems };
  }, [filteredPeople, filteredEvents]);

  // Use container dimensions for responsive sizing
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Use actual container dimensions, with reasonable minimums
        const newWidth = Math.max(rect.width || 1000, 800);
        const newHeight = Math.max(rect.height || 600, 400);
        setContainerSize({ width: newWidth, height: newHeight });
      }
    };
    // Initial size - use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateSize, 0);
    // Update on window resize with debounce
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateSize, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const timelineWidth = containerSize.width;
  const timelineHeight = containerSize.height;
  const padding = 60;
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
        return { stroke: 'url(#schismaticPattern)', strokeWidth: 3, fill: 'none' };
      case 'heresiarch':
        return { stroke: 'url(#heresiarchPattern)', strokeWidth: 3, fill: 'none' };
      case 'secular':
      default:
        return { stroke: '#bbb', strokeWidth: 1, fill: 'none' };
    }
  };

  // Calculate visible year range based on zoom level
  const visibleRange = useMemo(() => {
    const fullRange = maxYear - minYear;
    if (fullRange === 0) return { start: minYear, end: maxYear };

    // Zoom factor: 1 = full range, 0.5 = half range, 0.25 = quarter range, etc.
    const zoomFactor = Math.pow(0.5, zoomLevel);
    const visibleSpan = fullRange * zoomFactor;

    // Center the view on current year or viewCenter, defaulting to currentYear
    const center = viewCenter ?? currentYear;
    const start = Math.max(minYear, center - visibleSpan / 2);
    const end = Math.min(maxYear, start + visibleSpan);

    // Adjust start if we hit the max boundary
    const adjustedStart = Math.max(minYear, end - visibleSpan);

    return { start: adjustedStart, end };
  }, [minYear, maxYear, zoomLevel, viewCenter, currentYear]);

  const getXPosition = (year: number) => {
    const range = visibleRange.end - visibleRange.start;
    if (range === 0) return padding;
    const relativeYear = year - visibleRange.start;
    return padding + (relativeYear / range) * (timelineWidth - 2 * padding);
  };

  const getYearFromX = (x: number) => {
    const range = visibleRange.end - visibleRange.start;
    const relativeX = x - padding;
    return Math.round(visibleRange.start + (relativeX / (timelineWidth - 2 * padding)) * range);
  };

  // Set up non-passive wheel event listener to allow preventDefault
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      const newZoom = Math.max(0, Math.min(5, zoomLevel + delta));
      setZoomLevel(newZoom);

      // Calculate year from mouse position
      const rect = svgElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const range = visibleRange.end - visibleRange.start;
      const relativeX = x - padding;
      const year = Math.round(
        visibleRange.start + (relativeX / (timelineWidth - 2 * padding)) * range
      );

      if (viewCenter === null && newZoom > 0) {
        // Center zoom on the mouse position
        setViewCenter(year);
      } else if (viewCenter !== null) {
        // Adjust view center based on mouse position when zooming
        setViewCenter(year);
      }
    };

    svgElement.addEventListener('wheel', handleWheelNative, { passive: false });

    return () => {
      svgElement.removeEventListener('wheel', handleWheelNative);
    };
  }, [zoomLevel, viewCenter, visibleRange, timelineWidth, padding]);

  // Update zoom input value when zoom level changes
  useEffect(() => {
    const zoomPercent = Math.round(Math.pow(2, zoomLevel) * 100);
    setZoomInputValue(zoomPercent.toString());
  }, [zoomLevel]);

  const handleZoomInputClick = () => {
    setIsEditingZoom(true);
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInputValue(e.target.value);
  };

  const handleZoomInputBlur = () => {
    setIsEditingZoom(false);
    const percent = parseInt(zoomInputValue, 10);
    if (!isNaN(percent) && percent >= 100 && percent <= 3200) {
      // Convert percentage to zoom level
      // zoomLevel = log2(percent / 100)
      const newZoomLevel = Math.max(0, Math.min(5, Math.round(Math.log2(percent / 100))));
      setZoomLevel(newZoomLevel);
      // Update input to match actual zoom level
      const actualPercent = Math.round(Math.pow(2, newZoomLevel) * 100);
      setZoomInputValue(actualPercent.toString());
    } else {
      // Reset to current zoom level if invalid
      const zoomPercent = Math.round(Math.pow(2, zoomLevel) * 100);
      setZoomInputValue(zoomPercent.toString());
    }
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      const zoomPercent = Math.round(Math.pow(2, zoomLevel) * 100);
      setZoomInputValue(zoomPercent.toString());
      setIsEditingZoom(false);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 1, 5); // Max zoom level
    setZoomLevel(newZoom);
    if (viewCenter === null) {
      setViewCenter(currentYear);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 1, 0);
    setZoomLevel(newZoom);
    if (newZoom === 0) {
      setViewCenter(null); // Reset to full range
    }
  };

  const handleZoomReset = () => {
    setZoomLevel(0);
    setViewCenter(null);
  };

  const handlePanLeft = () => {
    if (zoomLevel === 0) return;
    const visibleSpan = visibleRange.end - visibleRange.start;
    const panAmount = visibleSpan * 0.3; // Pan by 30% of visible range
    const newCenter = Math.max(
      minYear + visibleSpan / 2,
      Math.min(maxYear - visibleSpan / 2, (viewCenter ?? currentYear) - panAmount)
    );
    setViewCenter(newCenter);
  };

  const handlePanRight = () => {
    if (zoomLevel === 0) return;
    const visibleSpan = visibleRange.end - visibleRange.start;
    const panAmount = visibleSpan * 0.3; // Pan by 30% of visible range
    const newCenter = Math.max(
      minYear + visibleSpan / 2,
      Math.min(maxYear - visibleSpan / 2, (viewCenter ?? currentYear) + panAmount)
    );
    setViewCenter(newCenter);
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; year: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    if (zoomLevel === 0) {
      // When not zoomed, allow normal clicking
      setHasDragged(false);
      return;
    }
    // When zoomed, start drag tracking
    setIsDragging(true);
    setHasDragged(false);
    const year = getYearFromX(e.nativeEvent.offsetX);
    setDragStart({ x: e.nativeEvent.offsetX, year });
    e.preventDefault(); // Prevent text selection
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStart || zoomLevel === 0) return;

    const deltaX = Math.abs(e.nativeEvent.offsetX - dragStart.x);
    // Only consider it a drag if mouse moved more than 5 pixels
    if (deltaX > 5) {
      setHasDragged(true);
      const deltaYears =
        ((e.nativeEvent.offsetX - dragStart.x) / (timelineWidth - 2 * padding)) *
        (visibleRange.end - visibleRange.start);
      const newYear = dragStart.year - deltaYears;
      const visibleSpan = visibleRange.end - visibleRange.start;
      const newCenter = Math.max(
        minYear + visibleSpan / 2,
        Math.min(maxYear - visibleSpan / 2, newYear)
      );
      setViewCenter(newCenter);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    const wasDragging = isDragging;
    setIsDragging(false);
    setDragStart(null);

    // If we were dragging, prevent the click handler from firing
    if (wasDragging && hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      setHasDragged(false);
    }
  };

  // handleWheel is now handled by native event listener with { passive: false }
  // This function is kept for compatibility but won't be called
  const handleWheel = () => {
    // This should not be called since we use native listener with { passive: false }
    // The native listener handles preventDefault correctly
  };

  const handleItemClick = (item: TimelineItem) => {
    // Jump to the start year of the item
    onYearChange(item.startYear);
    // Open the detail modal
    onItemClick(item.data);
  };

  const handleTimelineClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Don't handle click if we just finished dragging
    if (hasDragged) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const year = getYearFromX(x);
    onYearChange(year);
  };

  // Calculate number of active filters (filters that differ from defaults)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    const defaultOrthodoxyStatus = new Set<OrthodoxyStatus>([
      'canonized',
      'blessed',
      'orthodox',
      'schismatic',
      'heresiarch',
      'secular',
    ]);
    const defaultEventTypes = new Set<EventType>([
      'council',
      'schism',
      'persecution',
      'reform',
      'heresy',
      'war',
      'other',
    ]);

    // Check showPeople
    if (!filters.showPeople) count++;

    // Check showEvents
    if (!filters.showEvents) count++;

    // Check orthodoxyStatus (if not all 6 are selected)
    if (
      filters.orthodoxyStatus.size !== defaultOrthodoxyStatus.size ||
      !Array.from(defaultOrthodoxyStatus).every((s) => filters.orthodoxyStatus.has(s))
    ) {
      count++;
    }

    // Check showMartyrs
    if (filters.showMartyrs !== null) count++;

    // Check roles (if not all roles are selected)
    if (
      filters.roles.size !== allRoles.size ||
      !Array.from(allRoles).every((r) => filters.roles.has(r))
    ) {
      count++;
    }

    // Check primaryTradition (if not all traditions are selected)
    if (
      filters.primaryTradition.size !== allTraditions.size ||
      !Array.from(allTraditions).every((t) => filters.primaryTradition.has(t))
    ) {
      count++;
    }

    // Check eventTypes (if not all 7 are selected)
    if (
      filters.eventTypes.size !== defaultEventTypes.size ||
      !Array.from(defaultEventTypes).every((t) => filters.eventTypes.has(t))
    ) {
      count++;
    }

    // Check showPopes
    if (filters.showPopes !== null) count++;

    // Check showWithWritings
    if (filters.showWithWritings !== null) count++;

    return count;
  }, [filters, allRoles, allTraditions]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',
      }}
    >
      {/* Zoom/Pan Controls */}
      <TimelineControls
        zoomLevel={zoomLevel}
        isEditingZoom={isEditingZoom}
        zoomInputValue={zoomInputValue}
        handlePanLeft={handlePanLeft}
        handlePanRight={handlePanRight}
        handleZoomOut={handleZoomOut}
        handleZoomIn={handleZoomIn}
        handleZoomReset={handleZoomReset}
        handleZoomInputClick={handleZoomInputClick}
        handleZoomInputChange={handleZoomInputChange}
        handleZoomInputBlur={handleZoomInputBlur}
        handleZoomInputKeyDown={handleZoomInputKeyDown}
      />

      {/* Filter Toggle Button - Top Right */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 1001,
        }}
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: showFilters ? '#4a9eff' : 'rgba(26, 26, 26, 0.9)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            position: 'relative',
          }}
        >
          {showFilters ? 'Hide Filters' : 'Filters'}
        </button>
        {activeFilterCount > 0 && (
          <div
            style={{
              backgroundColor: '#ff4444',
              color: '#fff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            title={`${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`}
          >
            {activeFilterCount}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <TimelineFiltersPanel
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        filteredPeople={filteredPeople}
        filteredEvents={filteredEvents}
        allRoles={allRoles}
        allTraditions={allTraditions}
      />

      {/* Event Type Legend - Bottom Right */}
      {filters.showEvents && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            padding: '0.75rem',
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            border: '1px solid #444',
          }}
        >
          <div
            style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '13px', color: '#fff' }}
          >
            Event Types
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {(
              [
                'council',
                'schism',
                'persecution',
                'reform',
                'heresy',
                'war',
                'other',
              ] as EventType[]
            ).map((type) => {
              const color = getEventColor(type);
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      backgroundColor: color.fill,
                      border: `1px solid ${color.stroke}`,
                      borderRadius: '3px',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                    {color.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Range Indicator - Bottom Left (when zoomed) */}
      {zoomLevel > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            padding: '0.75rem',
            backgroundColor: 'rgba(26, 26, 26, 0.9)',
            borderRadius: '8px',
            color: '#aaa',
            fontSize: '14px',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Viewing:{' '}
          {(() => {
            const start = Math.round(visibleRange.start);
            const end = Math.round(visibleRange.end);
            const formatYear = (y: number) =>
              y < 0 ? `${Math.abs(y)} BC` : y === 0 ? '1 BC' : `${y} AD`;
            return `${formatYear(start)} – ${formatYear(end)}`;
          })()}
          ({Math.round(visibleRange.end - visibleRange.start)} years)
        </div>
      )}

      {/* Timeline SVG Container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${timelineWidth} ${timelineHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            display: 'block',
            cursor: isDragging ? 'grabbing' : zoomLevel > 0 ? 'grab' : 'pointer',
          }}
          onClick={handleTimelineClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={(e) => {
            handleMouseUp(e);
            setHasDragged(false);
          }}
        >
          {/* Definitions for patterns and gradients */}
          <defs>
            {/* Martyr pattern: gold and red diagonal stripes */}
            <pattern
              id="martyrPattern"
              patternUnits="userSpaceOnUse"
              width="12"
              height="12"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="12" fill="#d4af37" />
              <rect x="6" width="6" height="12" fill="#a11b1b" />
            </pattern>
            {/* Schismatic pattern: black and neon red diagonal stripes */}
            <pattern
              id="schismaticPattern"
              patternUnits="userSpaceOnUse"
              width="12"
              height="12"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="12" fill="#000000" />
              <rect x="6" width="6" height="12" fill="#ff073a" />
            </pattern>
            {/* Heresiarch pattern: black and neon green diagonal stripes */}
            <pattern
              id="heresiarchPattern"
              patternUnits="userSpaceOnUse"
              width="12"
              height="12"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="12" fill="#000000" />
              <rect x="6" width="6" height="12" fill="#39ff14" />
            </pattern>
          </defs>

          {/* Timeline line */}
          <line
            x1={0}
            y1={timelineHeight / 2}
            x2={timelineWidth}
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
          <circle cx={getXPosition(currentYear)} cy={timelineHeight / 2} r="8" fill="#4a9eff" />
          <text
            x={getXPosition(currentYear)}
            y={timelineHeight / 2 - 30}
            textAnchor="middle"
            fill="#4a9eff"
            fontSize="14"
            fontWeight="bold"
          >
            {currentYear < 0
              ? `${Math.abs(currentYear)} BC`
              : currentYear === 0
                ? '1 BC'
                : `${currentYear} AD`}
          </text>

          {/* Year markers */}
          {(() => {
            const markers = [];
            const visibleSpan = visibleRange.end - visibleRange.start;
            // Adjust step based on visible range - more markers when zoomed in
            const step = Math.max(1, Math.ceil(visibleSpan / 20));
            const startYear = Math.floor(visibleRange.start / step) * step;
            for (let year = startYear; year <= visibleRange.end; year += step) {
              const x = getXPosition(year);
              if (x < padding || x > timelineWidth - padding) continue;
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
                    {year < 0 ? `${Math.abs(year)} BC` : year === 0 ? '1 BC' : `${year} AD`}
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

            // Separate popes, events, and other people
            const popes = sortedItems.filter(
              (item) => item.type === 'person' && (item.data as Person).roles?.includes('pope')
            );
            const events = sortedItems.filter((item) => item.type === 'event');
            const otherPeople = sortedItems.filter(
              (item) => item.type === 'person' && !(item.data as Person).roles?.includes('pope')
            );

            // Define 3 rows above timeline (including pope row) and 3 below (including events row)
            const timelineCenter = timelineHeight / 2;

            // 3 rows above timeline: closest, middle, furthest (popes on top)
            const row1Above = timelineCenter - 50; // Row 1 above (closest to timeline)
            const row2Above = timelineCenter - 100; // Row 2 above (middle)
            const row3Above = timelineCenter - 150; // Row 3 above (furthest) - popes go here

            // 3 rows below timeline: closest, middle, furthest (events on bottom)
            const row1Below = timelineCenter + 50; // Row 1 below (closest to timeline)
            const row2Below = timelineCenter + 100; // Row 2 below (middle)
            const row3Below = timelineCenter + 150; // Row 3 below (furthest) - events go here

            // Place all popes on row 3 above (furthest row above timeline - top)
            popes.forEach((item) => {
              itemPositions.set(item.id, row3Above);
            });

            // Place all events on row 3 below (furthest row below timeline - bottom)
            events.forEach((item) => {
              itemPositions.set(item.id, row3Below);
            });

            // For other people, use the remaining 4 rows (2 above, 2 below)
            const availableRows = [
              row1Above, // Row 1 above
              row2Above, // Row 2 above (middle)
              row1Below, // Row 1 below
              row2Below, // Row 2 below (middle)
            ];
            const allRows = availableRows;

            // Sort items by start year for consistent assignment
            const sortedOtherPeople = [...otherPeople].sort((a, b) => a.startYear - b.startYear);

            // Track which items are assigned to which row
            const rowAssignments = new Map<
              number,
              Array<{ item: TimelineItem; startX: number; endX: number }>
            >();
            allRows.forEach((rowY) => rowAssignments.set(rowY, []));

            // Assign items to rows, avoiding horizontal overlaps
            sortedOtherPeople.forEach((item) => {
              const startX = getXPosition(item.startYear);
              const endX = getXPosition(item.endYear);

              // Find the best row that doesn't have overlapping items
              let bestRow: number | null = null;
              let minOverlaps = Infinity;

              for (const rowY of allRows) {
                // No need to skip - we've already excluded pope and event rows from allRows

                const itemsInRow = rowAssignments.get(rowY)!;
                let overlapCount = 0;

                // Check for horizontal overlaps with items already in this row
                for (const existing of itemsInRow) {
                  const horizontalOverlap = !(endX < existing.startX || startX > existing.endX);
                  if (horizontalOverlap) {
                    overlapCount++;
                  }
                }

                // Prefer rows with fewer overlaps, and prefer rows closer to timeline center
                if (
                  overlapCount < minOverlaps ||
                  (overlapCount === minOverlaps &&
                    (bestRow === null ||
                      Math.abs(rowY - timelineCenter) < Math.abs(bestRow - timelineCenter)))
                ) {
                  minOverlaps = overlapCount;
                  bestRow = rowY;
                }
              }

              // Assign to best row (or first available if all have overlaps)
              if (bestRow !== null) {
                rowAssignments.get(bestRow)!.push({ item, startX, endX });
                itemPositions.set(item.id, bestRow);
              } else {
                // Fallback: assign to first available row
                const fallbackRow = allRows[0] || row1Above;
                rowAssignments.get(fallbackRow)!.push({ item, startX, endX });
                itemPositions.set(item.id, fallbackRow);
              }
            });

            // Filter items to only show those in the visible range
            const visibleItems = sortedItems.filter((item) => {
              return !(item.endYear < visibleRange.start || item.startYear > visibleRange.end);
            });

            return visibleItems.map((item) => {
              const startX = getXPosition(item.startYear);
              const endX = getXPosition(item.endYear);
              const centerX = (startX + endX) / 2;
              // For people, connect line at death year; for events, use center
              const connectX = item.type === 'person' ? endX : centerX;
              const isActive = currentYear >= item.startYear && currentYear <= item.endYear;
              const y = itemPositions.get(item.id) || timelineHeight / 2;

              if (item.type === 'event') {
                const event = item.data as Event;

                // Render councils with images like people
                if (event.type === 'council' && event.imageUrl) {
                  const baseImageSize = isActive ? portraitSize + 4 : portraitSize;
                  const aspectRatio = imageAspectRatios.get(item.id) || 1;

                  // Calculate image dimensions based on aspect ratio
                  let imageWidth = baseImageSize;
                  let imageHeight = baseImageSize;
                  if (aspectRatio > 1) {
                    imageHeight = baseImageSize / aspectRatio;
                  } else if (aspectRatio < 1) {
                    imageWidth = baseImageSize * aspectRatio;
                  }

                  const framePadding = 6;
                  const frameWidth = imageWidth + framePadding * 2;
                  const frameHeight = imageHeight + framePadding * 2;

                  return (
                    <g key={item.id}>
                      {/* Line connecting to timeline - events use center */}
                      <line
                        x1={centerX}
                        y1={timelineHeight / 2}
                        x2={centerX}
                        y2={y}
                        stroke={isActive ? '#4a9eff' : '#666'}
                        strokeWidth={isActive ? 2 : 1}
                        strokeDasharray={isActive ? '0' : '3,3'}
                      />

                      {/* Council portrait with frame */}
                      <g
                        transform={`translate(${centerX}, ${y})`}
                        onClick={() => handleItemClick(item)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Define clip path for this item */}
                        <defs>
                          <clipPath id={`clip-event-${item.id}`}>
                            <rect
                              x={-imageWidth / 2}
                              y={-imageHeight / 2}
                              width={imageWidth}
                              height={imageHeight}
                              rx="4"
                            />
                          </clipPath>
                        </defs>

                        {/* Frame border - color based on event type */}
                        <rect
                          x={-frameWidth / 2}
                          y={-frameHeight / 2}
                          width={frameWidth}
                          height={frameHeight}
                          rx="8"
                          fill="none"
                          stroke={getEventColor(event.type).fill}
                          strokeWidth="3"
                          style={{
                            filter: `drop-shadow(0 0 6px ${getEventColor(event.type).fill}80)`,
                          }}
                        />

                        {/* Council image with clipping */}
                        <g clipPath={`url(#clip-event-${item.id})`}>
                          <image
                            href={event.imageUrl}
                            x={-imageWidth / 2}
                            y={-imageHeight / 2}
                            width={imageWidth}
                            height={imageHeight}
                            onLoad={() => {
                              // Calculate aspect ratio when image loads
                              const tempImg = new Image();
                              tempImg.onload = () => {
                                const ratio = tempImg.naturalWidth / tempImg.naturalHeight;
                                setImageAspectRatios((prev) => {
                                  const newMap = new Map(prev);
                                  newMap.set(item.id, ratio);
                                  return newMap;
                                });
                              };
                              tempImg.src = event.imageUrl || '';
                            }}
                            onError={(e) => {
                              // Fallback to placeholder if image fails
                              const target = e.target as SVGImageElement;
                              const initials = event.name
                                .split(' ')
                                .map((n) => n[0])
                                .filter(Boolean)
                                .slice(-2)
                                .join('');
                              target.href.baseVal = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${baseImageSize}" height="${baseImageSize}"><rect width="${baseImageSize}" height="${baseImageSize}" fill="#ffd700"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#000" font-family="Arial" font-size="${baseImageSize / 2}">${initials}</text></svg>`)}`;
                            }}
                          />
                        </g>

                        {/* Star overlay for council */}
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#fff"
                          fontSize={frameWidth / 2}
                          fontWeight="bold"
                          style={{
                            textShadow: '0 0 4px rgba(0,0,0,0.8)',
                            pointerEvents: 'none',
                          }}
                        >
                          ★
                        </text>

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
                            x={connectX - 80}
                            y={y - 50}
                            width="160"
                            height="35"
                            fill="#000"
                            fillOpacity="0.9"
                            rx="4"
                          />
                          <text
                            x={connectX}
                            y={y - 30}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="12"
                            fontWeight="bold"
                          >
                            {item.name}
                          </text>
                          <text
                            x={connectX}
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

                // Render other events as bars
                const width = Math.max(20, endX - startX);
                const eventColor = getEventColor(event.type);

                return (
                  <g key={item.id}>
                    <rect
                      x={startX}
                      y={y - 10}
                      width={width}
                      height="20"
                      fill={eventColor.fill}
                      stroke={isActive ? '#4a9eff' : eventColor.stroke}
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
                        <text x={centerX} y={y - 22} textAnchor="middle" fill="#fff" fontSize="12">
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

                // Use tighter padding for canonized saints (non-martyrs) to make gold border fit closer
                const framePadding =
                  person.orthodoxyStatus === 'canonized' && !person.isMartyr ? 2 : 6;
                const frameWidth = imageWidth + framePadding * 2;
                const frameHeight = imageHeight + framePadding * 2;
                const frameStyle = getFrameStyle(person.orthodoxyStatus, person.isMartyr);

                return (
                  <g key={item.id}>
                    {/* Line connecting to timeline */}
                    <line
                      x1={connectX}
                      y1={timelineHeight / 2}
                      x2={connectX}
                      y2={y}
                      stroke={isActive ? '#4a9eff' : '#666'}
                      strokeWidth={isActive ? 2 : 1}
                      strokeDasharray={isActive ? '0' : '3,3'}
                    />

                    {/* Portrait with frame */}
                    <g
                      transform={`translate(${connectX}, ${y})`}
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

                      {/* White inner border for martyrs only */}
                      {person.isMartyr &&
                        (person.orthodoxyStatus === 'canonized' ||
                          person.orthodoxyStatus === 'blessed') && (
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
                                setImageAspectRatios((prev) => {
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
                                .map((n) => n[0])
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

                      {/* Crown icon for popes - top left */}
                      {person.roles?.includes('pope') && (
                        <foreignObject
                          x={-frameWidth / 2 + framePadding}
                          y={-frameHeight / 2 + framePadding}
                          width="14"
                          height="14"
                          style={{ overflow: 'visible' }}
                        >
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.8))',
                            }}
                          >
                            <FaCrown
                              style={{
                                color: '#FFD700',
                                fontSize: '14px',
                                display: 'block',
                                filter:
                                  'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
                                stroke: '#000',
                                strokeWidth: '0.5px',
                                paintOrder: 'stroke fill',
                              }}
                            />
                          </div>
                        </foreignObject>
                      )}

                      {/* Scroll icon for saints with writings - top right */}
                      {person.writings && person.writings.length > 0 && (
                        <foreignObject
                          x={frameWidth / 2 - 14 - framePadding}
                          y={-frameHeight / 2 + framePadding}
                          width="14"
                          height="14"
                          style={{ overflow: 'visible' }}
                        >
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              filter: 'drop-shadow(0 0 2px rgba(0, 217, 255, 0.8))',
                            }}
                          >
                            <FaScroll
                              style={{
                                color: '#00D9FF',
                                fontSize: '14px',
                                display: 'block',
                                filter:
                                  'drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
                                stroke: '#000',
                                strokeWidth: '0.5px',
                                paintOrder: 'stroke fill',
                              }}
                            />
                          </div>
                        </foreignObject>
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
                        <text x={centerX} y={y - 15} textAnchor="middle" fill="#aaa" fontSize="11">
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

      {/* Legend Overlay - Bottom Right */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          padding: '1rem',
          backgroundColor: 'rgba(26, 26, 26, 0.9)',
          borderRadius: '8px',
          zIndex: 1000,
          color: '#aaa',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          maxWidth: '300px',
        }}
      >
        <div
          style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '14px', color: '#fff' }}
        >
          Legend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCrown style={{ color: '#FFD700', fontSize: '14px' }} />
            <span>Pope</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaScroll style={{ color: '#00D9FF', fontSize: '14px' }} />
            <span>Writings</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '20px',
                height: '12px',
                backgroundColor: '#ffd700',
                borderRadius: '4px',
              }}
            ></div>
            <span>Council</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '20px',
                height: '12px',
                backgroundColor: '#ff6b6b',
                borderRadius: '4px',
              }}
            ></div>
            <span>Other Event</span>
          </div>
        </div>
      </div>
    </div>
  );
}
