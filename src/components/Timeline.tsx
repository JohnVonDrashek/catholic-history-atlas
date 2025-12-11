import { Person, Event } from '../types';
import { getActivePeople, getActiveEvents } from '../utils/filters';

interface TimelineProps {
  people: Person[];
  events: Event[];
  currentYear: number;
  onItemClick: (item: Person | Event) => void;
}

export function Timeline({ people, events, currentYear, onItemClick }: TimelineProps) {
  const activePeople = getActivePeople(people, currentYear);
  const activeEvents = getActiveEvents(events, currentYear);

  // For now, a simple list view. Can be enhanced with a visual timeline later
  return (
    <div style={{ padding: '1rem' }}>
      <h2>Timeline View ({currentYear})</h2>
      
      {activePeople.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>People</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {activePeople.map((person) => (
              <div
                key={person.id}
                onClick={() => onItemClick(person)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {person.name} ({person.birthYear ?? '?'}–{person.deathYear})
              </div>
            ))}
          </div>
        </div>
      )}

      {activeEvents.length > 0 && (
        <div>
          <h3>Events</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {activeEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onItemClick(event)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {event.name} ({event.startYear})
              </div>
            ))}
          </div>
        </div>
      )}

      {activePeople.length === 0 && activeEvents.length === 0 && (
        <p style={{ color: '#666' }}>No people or events found for this year.</p>
      )}
    </div>
  );
}
