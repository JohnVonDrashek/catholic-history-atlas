import { FaScroll } from 'react-icons/fa';
import type { Person } from '../../types';
import { FigurePortrait } from '../FigurePortrait';

interface PersonDetailsProps {
  person: Person;
}

export function PersonDetails({ person }: PersonDetailsProps) {
  const years = person.birthYear
    ? `c. ${person.birthYear}–${person.deathYear}`
    : `d. ${person.deathYear}`;

  // Build subtitle from roles and primary location
  const primaryLocation = person.locations[0]?.description;
  const rolesText = person.roles?.filter((r) => r !== 'Apostolic Father').join(', ') || '';
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
        <div
          style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}
        >
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
            <h2
              style={{
                margin: 0,
                marginBottom: '0.5rem',
                fontSize: '1.75rem',
                color: '#fff',
                lineHeight: '1.2',
              }}
            >
              {person.name}
            </h2>
            <p
              style={{
                margin: 0,
                color: '#aaa',
                fontSize: '0.95rem',
                marginBottom: '0.5rem',
              }}
            >
              {years}
            </p>
            {subtitle && (
              <p
                style={{
                  margin: 0,
                  color: '#4a9eff',
                  fontSize: '1rem',
                  fontWeight: 500,
                  marginBottom: '0.5rem',
                }}
              >
                {subtitle}
              </p>
            )}
            {(isDoctor || isApostolicFather) && (
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                {isDoctor && (
                  <span
                    style={{
                      backgroundColor: '#d4af37',
                      color: '#000',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                    }}
                  >
                    Doctor of the Church
                  </span>
                )}
                {isApostolicFather && (
                  <span
                    style={{
                      backgroundColor: '#4a9eff',
                      color: '#fff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                    }}
                  >
                    Apostolic Father
                  </span>
                )}
              </div>
            )}
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
          {person.summary}
        </p>
      </div>

      {/* Highlights Section */}
      {person.keyQuotes && person.keyQuotes.length > 0 && (
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
            Key Contributions & Themes
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.5rem',
              listStyle: 'none',
            }}
          >
            {person.keyQuotes.map((quote, idx) => (
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
                {quote}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Spiritual Reflection Section */}
      {spiritualReflection && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: 'rgba(74, 158, 255, 0.1)',
            borderRadius: '8px',
            borderLeft: '3px solid #4a9eff',
          }}
        >
          <p
            style={{
              margin: 0,
              fontStyle: 'italic',
              color: '#bbb',
              lineHeight: '1.6',
            }}
          >
            <strong style={{ color: '#4a9eff' }}>Reflection:</strong> {spiritualReflection}
          </p>
        </div>
      )}

      {/* Writings Section */}
      {person.writings && person.writings.length > 0 && (
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
                <FaScroll
                  style={{
                    fontSize: '1rem',
                    marginRight: '0.5rem',
                    color: '#00D9FF',
                    filter:
                      'drop-shadow(0 0 2px rgba(0, 217, 255, 0.8)) drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000) drop-shadow(1px 1px 0 #000)',
                    stroke: '#000',
                    strokeWidth: '0.5px',
                    paintOrder: 'stroke fill',
                  }}
                />
                {writing.title}
                <span style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>→</span>
              </a>
            ))}
          </div>
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
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
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
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Wikipedia
              <span style={{ fontSize: '0.85rem' }}>→</span>
            </a>
          )}
          {person.myCatholicLifeUrl && (
            <a
              href={person.myCatholicLifeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#d4af37',
                textDecoration: 'none',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              My Catholic Life
              <span style={{ fontSize: '0.85rem' }}>→</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
