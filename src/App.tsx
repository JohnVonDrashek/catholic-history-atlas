import { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { YearSelector } from './components/YearSelector';
import { Timeline } from './components/Timeline';
import { MapView } from './components/MapView';
import { DetailsModal } from './components/DetailsModal';
import type { Person, Event } from './types';
import initialData from './data/initial-data.json';
import './styles/main.css';

function App() {
  const [currentYear, setCurrentYear] = useState(325); // Start at Nicaea
  const [selectedItem, setSelectedItem] = useState<Person | Event | null>(null);
  const [view, setView] = useState<'timeline' | 'map'>('timeline');

  const data = initialData as {
    people: Person[];
    events: Event[];
    places: import('./types').Place[];
  };

  return (
    <HashRouter>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <YearSelector
          year={currentYear}
          onYearChange={setCurrentYear}
          minYear={30}
          maxYear={2000}
          step={10}
        />

        <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
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
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {view === 'timeline' ? (
            <Timeline
              people={data.people}
              events={data.events}
              currentYear={currentYear}
              onItemClick={setSelectedItem}
            />
          ) : (
            <MapView
              people={data.people}
              events={data.events}
              places={data.places}
              currentYear={currentYear}
              onItemClick={setSelectedItem}
            />
          )}
        </div>

        <DetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      </div>
    </HashRouter>
  );
}

export default App;
