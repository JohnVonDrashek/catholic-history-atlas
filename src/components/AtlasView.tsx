import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Timeline } from './Timeline';
import { MapView } from './MapView';
import { DetailsModal } from './DetailsModal';
import { FrameLegend } from './FrameLegend';
import type { Person, Event, Basilica } from '../types';

interface AtlasViewProps {
  data: {
    people: Person[];
    events: Event[];
    places: import('../types').Place[];
    sees: import('../types').See[];
    basilicas: import('../types').Basilica[];
  };
}

export function AtlasView({ data }: AtlasViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const minYear = 30;
  const maxYear = 2100;
  
  // Read initial values from URL params or use defaults, with validation
  const yearParam = searchParams.get('year');
  const initialYear = yearParam 
    ? Math.max(minYear, Math.min(maxYear, parseInt(yearParam, 10) || 325))
    : 325;
  
  const viewParam = searchParams.get('view');
  const initialView = (viewParam === 'map' ? 'map' : 'timeline') as 'timeline' | 'map';
  
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [selectedItem, setSelectedItem] = useState<Person | Event | Basilica | null>(null);
  const [view, setView] = useState<'timeline' | 'map'>(initialView);
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [inputValue, setInputValue] = useState(currentYear.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const step = 10;

  // Update URL params when year or view changes (for shareable links)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('year', currentYear.toString());
    params.set('view', view);
    setSearchParams(params, { replace: true });
  }, [currentYear, view, setSearchParams]);

  useEffect(() => {
    setInputValue(currentYear.toString());
  }, [currentYear]);

  useEffect(() => {
    if (isEditingYear && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingYear]);

  const handleDecrement = () => {
    const newYear = Math.max(minYear, currentYear - step);
    setCurrentYear(newYear);
  };

  const handleIncrement = () => {
    const newYear = Math.min(maxYear, currentYear + step);
    setCurrentYear(newYear);
  };

  const handleInputClick = () => {
    setIsEditingYear(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditingYear(false);
    const newYear = parseInt(inputValue, 10);
    if (!isNaN(newYear) && newYear >= minYear && newYear <= maxYear) {
      setCurrentYear(newYear);
    } else {
      setInputValue(currentYear.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setInputValue(currentYear.toString());
      setIsEditingYear(false);
    }
  };

  const formatYear = (y: number) => {
    if (y < 0) return `${Math.abs(y)} BC`;
    if (y === 0) return '1 BC';
    return `${y} AD`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        gap: '2rem',
      }}>
        {/* Year Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <button
            onClick={handleDecrement}
            disabled={currentYear <= minYear}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1.2rem',
              cursor: currentYear <= minYear ? 'not-allowed' : 'pointer',
              opacity: currentYear <= minYear ? 0.5 : 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
            }}
          >
            ←
          </button>
          {isEditingYear ? (
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              min={minYear}
              max={maxYear}
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                textAlign: 'center',
                width: '150px',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                border: '2px solid #4a9eff',
                borderRadius: '4px',
                padding: '0.25rem',
              }}
            />
          ) : (
            <span
              onClick={handleInputClick}
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: '150px',
                textAlign: 'center',
                color: '#fff',
              }}
              title="Click to enter a specific year"
            >
              {formatYear(currentYear)}
            </span>
          )}
          <button
            onClick={handleIncrement}
            disabled={currentYear >= maxYear}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1.2rem',
              cursor: currentYear >= maxYear ? 'not-allowed' : 'pointer',
              opacity: currentYear >= maxYear ? 0.5 : 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
            }}
          >
            →
          </button>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setView('timeline')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: view === 'timeline' ? '#4a9eff' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Timeline
          </button>
          <button
            onClick={() => setView('map')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: view === 'map' ? '#4a9eff' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Map
          </button>
          <Link
            to="/about"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#333',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            About
          </Link>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {view === 'timeline' ? (
          <Timeline
            people={data.people}
            events={data.events}
            currentYear={currentYear}
            onItemClick={setSelectedItem}
            onYearChange={setCurrentYear}
          />
        ) : (
          <MapView
            people={data.people}
            events={data.events}
            places={data.places}
            sees={data.sees}
            basilicas={data.basilicas}
            currentYear={currentYear}
            onItemClick={setSelectedItem}
          />
        )}
      </div>

      <DetailsModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <FrameLegend />
    </div>
  );
}

