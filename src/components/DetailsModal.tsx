import { Person, Event } from '../types';
import { FigurePortrait } from './FigurePortrait';

interface DetailsModalProps {
  item: Person | Event | null;
  onClose: () => void;
}

export function DetailsModal({ item, onClose }: DetailsModalProps) {
  if (!item) return null;

  const isPerson = 'orthodoxyStatus' in item;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          ×
        </button>

        {isPerson ? (
          <PersonDetails person={item as Person} />
        ) : (
          <EventDetails event={item as Event} />
        )}
      </div>
    </div>
  );
}

function PersonDetails({ person }: { person: Person }) {
  const years = person.birthYear
    ? `c. ${person.birthYear}–${person.deathYear}`
    : `d. ${person.deathYear}`;

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {person.imageUrl && (
          <FigurePortrait
            name={person.name}
            imageUrl={person.imageUrl}
            orthodoxyStatus={person.orthodoxyStatus}
            isMartyr={person.isMartyr}
            size="large"
          />
        )}
        <div>
          <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>{person.name}</h2>
          <p style={{ margin: 0, color: '#aaa' }}>{years}</p>
          {person.roles && person.roles.length > 0 && (
            <p style={{ margin: '0.5rem 0', color: '#aaa' }}>
              {person.roles.join(', ')}
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p>{person.summary}</p>
      </div>

      {person.keyQuotes && person.keyQuotes.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3>Key Themes</h3>
          <ul>
            {person.keyQuotes.map((quote, idx) => (
              <li key={idx}>{quote}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        {person.newAdventUrl && (
          <a
            href={person.newAdventUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4a9eff' }}
          >
            New Advent →
          </a>
        )}
        {person.wikipediaUrl && (
          <a
            href={person.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4a9eff' }}
          >
            Wikipedia →
          </a>
        )}
      </div>
    </div>
  );
}

function EventDetails({ event }: { event: Event }) {
  const years = event.endYear
    ? `${event.startYear}–${event.endYear}`
    : event.startYear.toString();

  return (
    <div>
      <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>{event.name}</h2>
      <p style={{ margin: 0, color: '#aaa', marginBottom: '1rem' }}>
        {years} • {event.type}
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <p>{event.summary}</p>
      </div>

      {event.keyDocuments && event.keyDocuments.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3>Key Documents</h3>
          <ul>
            {event.keyDocuments.map((doc, idx) => (
              <li key={idx}>{doc}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        {event.newAdventUrl && (
          <a
            href={event.newAdventUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4a9eff' }}
          >
            New Advent →
          </a>
        )}
        {event.wikipediaUrl && (
          <a
            href={event.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4a9eff' }}
          >
            Wikipedia →
          </a>
        )}
      </div>
    </div>
  );
}
