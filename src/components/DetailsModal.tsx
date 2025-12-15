import { FaScroll } from 'react-icons/fa';
import { Person, Event, Basilica } from '../types';
import { getEventColor } from '../utils/eventColors';
import { FigurePortrait } from './FigurePortrait';
import { getCachedImageUrl } from '../utils/imageCache';
import { getBasilicaColor } from './MapView';

interface DetailsModalProps {
  item: Person | Event | Basilica | null;
  onClose: () => void;
}

export function DetailsModal({ item, onClose }: DetailsModalProps) {
  if (!item) return null;

  const isPerson = 'orthodoxyStatus' in item;
  const isBasilica = 'type' in item && ('major-basilica' === item.type || 'papal-basilica' === item.type || 'patriarchal-basilica' === item.type || 'historic-basilica' === item.type);

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
          padding: '2.5rem',
          borderRadius: '12px',
          maxWidth: '700px',
          maxHeight: '85vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
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
        ) : isBasilica ? (
          <BasilicaDetails basilica={item as Basilica} />
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

  // Build subtitle from roles and primary location
  const primaryLocation = person.locations[0]?.description;
  const rolesText = person.roles?.filter(r => r !== 'Apostolic Father').join(', ') || '';
  const subtitle = [primaryLocation, rolesText].filter(Boolean).join(' – ');

  // Get magisterial weight (Doctor of the Church, etc.)
  const isDoctor = person.roles?.includes('doctor of the Church');
  const isApostolicFather = person.roles?.includes('Apostolic Father');

  // Generate spiritual reflection based on person's life
  const getSpiritualReflection = () => {
    if (person.isMartyr) {
      return `How does ${person.name.split(' ').pop()}'s witness of martyrdom inspire us to remain faithful even in the face of persecution?`;
    }
    if (isDoctor) {
      return `What can we learn from ${person.name.split(' ').pop()}'s theological insights and how might they deepen our understanding of the faith?`;
    }
    if (person.orthodoxyStatus === 'heresiarch') {
      return null; // Don't add spiritual reflection for heresiarchs
    }
    return `How might ${person.name.split(' ').pop()}'s example of faithfulness and service to the Church guide us in our own Christian journey?`;
  };

  const spiritualReflection = getSpiritualReflection();

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          {person.imageUrl && (
            <div style={{ flexShrink: 0, maxWidth: '300px', maxHeight: '400px' }}>
              <FigurePortrait
                name={person.name}
                imageUrl={person.imageUrl}
                orthodoxyStatus={person.orthodoxyStatus}
                isMartyr={person.isMartyr}
                size="large"
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              margin: 0, 
              marginBottom: '0.5rem',
              fontSize: '1.75rem',
              color: '#fff',
              lineHeight: '1.2',
            }}>
              {person.name}
            </h2>
            <p style={{ 
              margin: 0, 
              color: '#aaa',
              fontSize: '0.95rem',
              marginBottom: '0.5rem',
            }}>
              {years}
            </p>
            {subtitle && (
              <p style={{ 
                margin: 0, 
                color: '#4a9eff',
                fontSize: '1rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
              }}>
                {subtitle}
              </p>
            )}
            {(isDoctor || isApostolicFather) && (
              <div style={{ 
                marginTop: '0.5rem',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}>
                {isDoctor && (
                  <span style={{
                    backgroundColor: '#d4af37',
                    color: '#000',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}>
                    Doctor of the Church
                  </span>
                )}
                {isApostolicFather && (
                  <span style={{
                    backgroundColor: '#4a9eff',
                    color: '#fff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}>
                    Apostolic Father
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div style={{ 
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #333',
      }}>
        <p style={{ 
          margin: 0,
          lineHeight: '1.7',
          color: '#ddd',
          fontSize: '1rem',
        }}>
          {person.summary}
        </p>
      </div>

      {/* Highlights Section */}
      {person.keyQuotes && person.keyQuotes.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            margin: 0,
            marginBottom: '1rem',
            fontSize: '1.25rem',
            color: '#fff',
            fontWeight: 600,
          }}>
            Key Contributions & Themes
          </h3>
          <ul style={{ 
            margin: 0,
            paddingLeft: '1.5rem',
            listStyle: 'none',
          }}>
            {person.keyQuotes.map((quote, idx) => (
              <li key={idx} style={{
                marginBottom: '0.75rem',
                paddingLeft: '1rem',
                position: 'relative',
                color: '#ddd',
                lineHeight: '1.6',
              }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  color: '#4a9eff',
                  fontWeight: 'bold',
                }}>•</span>
                {quote}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Spiritual Reflection Section */}
      {spiritualReflection && (
        <div style={{ 
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: 'rgba(74, 158, 255, 0.1)',
          borderRadius: '8px',
          borderLeft: '3px solid #4a9eff',
        }}>
          <p style={{
            margin: 0,
            fontStyle: 'italic',
            color: '#bbb',
            lineHeight: '1.6',
          }}>
            <strong style={{ color: '#4a9eff' }}>Reflection:</strong> {spiritualReflection}
          </p>
        </div>
      )}

      {/* Writings Section */}
      {person.writings && person.writings.length > 0 && (
        <div style={{ 
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #333',
        }}>
          <h4 style={{
            margin: 0,
            marginBottom: '0.75rem',
            fontSize: '0.95rem',
            color: '#aaa',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Extant Writings
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {person.writings.map((writing, idx) => (
              <a
                key={idx}
                href={writing.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: '#d4af37',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                  e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                }}
              >
                <FaScroll style={{ 
                  fontSize: '1rem', 
                  marginRight: '0.5rem', 
                  color: '#00D9FF', 
                  filter: 'drop-shadow(0 0 2px rgba(0, 217, 255, 0.8)) drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
                  stroke: '#000',
                  strokeWidth: '0.5px',
                  paintOrder: 'stroke fill'
                }} />
                {writing.title}
                <span style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Sources Section */}
      <div style={{ 
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #333',
      }}>
        <h4 style={{
          margin: 0,
          marginBottom: '0.75rem',
          fontSize: '0.95rem',
          color: '#aaa',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Sources
        </h4>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {person.newAdventUrl && (
            <a
              href={person.newAdventUrl}
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
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              New Advent
              <span style={{ fontSize: '0.85rem' }}>→</span>
            </a>
          )}
          {person.wikipediaUrl && (
            <a
              href={person.wikipediaUrl}
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
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
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

function EventDetails({ event }: { event: Event }) {
  const years = event.endYear
    ? `${event.startYear}–${event.endYear}`
    : event.startYear.toString();

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
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
            <h2 style={{ 
              margin: 0, 
              marginBottom: '0.5rem',
              fontSize: '1.75rem',
              color: '#fff',
              lineHeight: '1.2',
            }}>
              {event.name}
            </h2>
            <div style={{ 
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '0.5rem',
            }}>
              <p style={{ 
                margin: 0, 
                color: '#aaa',
                fontSize: '0.95rem',
              }}>
                {years}
              </p>
              <span style={{
                backgroundColor: getEventColor(event.type).fill,
                color: getEventColor(event.type).textColor,
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                border: `1px solid ${getEventColor(event.type).stroke}`,
              }}>
                {getEventColor(event.type).label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div style={{ 
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #333',
      }}>
        <p style={{ 
          margin: 0,
          lineHeight: '1.7',
          color: '#ddd',
          fontSize: '1rem',
        }}>
          {event.summary}
        </p>
      </div>

      {/* Key Documents Section */}
      {event.keyDocuments && event.keyDocuments.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            margin: 0,
            marginBottom: '1rem',
            fontSize: '1.25rem',
            color: '#fff',
            fontWeight: 600,
          }}>
            Key Documents
          </h3>
          <ul style={{ 
            margin: 0,
            paddingLeft: '1.5rem',
            listStyle: 'none',
          }}>
            {event.keyDocuments.map((doc, idx) => (
              <li key={idx} style={{
                marginBottom: '0.75rem',
                paddingLeft: '1rem',
                position: 'relative',
                color: '#ddd',
                lineHeight: '1.6',
              }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  color: '#4a9eff',
                  fontWeight: 'bold',
                }}>•</span>
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources Section */}
      <div style={{ 
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #333',
      }}>
        <h4 style={{
          margin: 0,
          marginBottom: '0.75rem',
          fontSize: '0.95rem',
          color: '#aaa',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
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
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
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
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
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

function BasilicaDetails({ basilica }: { basilica: Basilica }) {
  const years = basilica.endYear
    ? `${basilica.startYear}–${basilica.endYear}`
    : basilica.startYear?.toString() || 'Unknown';

  const basilicaTypeLabel = basilica.type === 'major-basilica' ? 'Major Basilica' :
                            basilica.type === 'papal-basilica' ? 'Papal Basilica' :
                            basilica.type === 'patriarchal-basilica' ? 'Patriarchal Basilica' :
                            'Historic Basilica';

  const colors = getBasilicaColor(basilica.type);

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          {basilica.imageUrl && (
            <div style={{ flexShrink: 0, maxWidth: '300px', maxHeight: '400px' }}>
              <img
                src={getCachedImageUrl(basilica.imageUrl, 'modal', 400)}
                alt={basilica.name}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  maxHeight: '400px',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  objectFit: 'contain',
                  border: `3px solid ${colors.fill}`,
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              margin: 0, 
              marginBottom: '0.5rem',
              fontSize: '1.75rem',
              color: '#fff',
              lineHeight: '1.2',
            }}>
              {basilica.name}
            </h2>
            <div style={{ 
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '0.5rem',
            }}>
              <p style={{ 
                margin: 0, 
                color: '#aaa',
                fontSize: '0.95rem',
              }}>
                {years}
              </p>
              <span style={{
                backgroundColor: colors.fill,
                color: '#fff',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                border: `1px solid ${colors.stroke}`,
                boxShadow: `0 0 8px ${colors.glow}`,
              }}>
                {basilicaTypeLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {basilica.description && (
        <div style={{ 
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid #333',
        }}>
          <p style={{ 
            margin: 0,
            lineHeight: '1.7',
            color: '#ddd',
            fontSize: '1rem',
          }}>
            {basilica.description}
          </p>
        </div>
      )}

      {/* Sources Section */}
      <div style={{ 
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #333',
      }}>
        <h4 style={{
          margin: 0,
          marginBottom: '0.75rem',
          fontSize: '0.95rem',
          color: '#aaa',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Sources
        </h4>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {basilica.newAdventUrl && (
            <a
              href={basilica.newAdventUrl}
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
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              New Advent
              <span style={{ fontSize: '0.85rem' }}>→</span>
            </a>
          )}
          {basilica.wikipediaUrl && (
            <a
              href={basilica.wikipediaUrl}
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
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
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
