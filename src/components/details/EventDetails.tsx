import type { Event } from '../../types';
import { getEventColor } from '../../utils/eventColors';
import { getCachedImageUrl } from '../../utils/imageCache';

interface EventDetailsProps {
  event: Event;
}

export function EventDetails({ event }: EventDetailsProps) {
  const years = event.endYear ? `${event.startYear}–${event.endYear}` : event.startYear.toString();

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}
        >
          {event.imageUrl && (
            <div style={{ flexShrink: 0, maxWidth: '300px', maxHeight: '400px' }}>
              <img
                src={getCachedImageUrl(event.imageUrl, 'modal', 400)}
                alt={event.name}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  maxHeight: '400px',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h2
              style={{
                margin: 0,
                marginBottom: '0.5rem',
                fontSize: '1.75rem',
                color: '#fff',
                lineHeight: '1.2',
              }}
            >
              {event.name}
            </h2>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '0.5rem',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#aaa',
                  fontSize: '0.95rem',
                }}
              >
                {years}
              </p>
              <span
                style={{
                  backgroundColor: getEventColor(event.type).fill,
                  color: getEventColor(event.type).textColor,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  border: `1px solid ${getEventColor(event.type).stroke}`,
                }}
              >
                {getEventColor(event.type).label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div
        style={{
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid #333',
        }}
      >
        <p
          style={{
            margin: 0,
            lineHeight: '1.7',
            color: '#ddd',
            fontSize: '1rem',
          }}
        >
          {event.summary}
        </p>
      </div>

      {/* Key Documents Section */}
      {event.keyDocuments && event.keyDocuments.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3
            style={{
              margin: 0,
              marginBottom: '1rem',
              fontSize: '1.25rem',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Key Documents
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.5rem',
              listStyle: 'none',
            }}
          >
            {event.keyDocuments.map((doc, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: '0.75rem',
                  paddingLeft: '1rem',
                  position: 'relative',
                  color: '#ddd',
                  lineHeight: '1.6',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    color: '#4a9eff',
                    fontWeight: 'bold',
                  }}
                >
                  •
                </span>
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources Section */}
      <div
        style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #333',
        }}
      >
        <h4
          style={{
            margin: 0,
            marginBottom: '0.75rem',
            fontSize: '0.95rem',
            color: '#aaa',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Sources
        </h4>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {event.newAdventUrl && (
            <a
              href={event.newAdventUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#4a9eff',
                textDecoration: 'none',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              New Advent
              <span style={{ fontSize: '0.85rem' }}>→</span>
            </a>
          )}
          {event.wikipediaUrl && (
            <a
              href={event.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#4a9eff',
                textDecoration: 'none',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Wikipedia
              <span style={{ fontSize: '0.85rem' }}>→</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
