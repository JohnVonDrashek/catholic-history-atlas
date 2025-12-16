import type { Basilica } from '../../types';
import { getBasilicaColor } from '../../utils/basilicaColors';
import { getCachedImageUrl } from '../../utils/imageCache';

interface BasilicaDetailsProps {
  basilica: Basilica;
}

export function BasilicaDetails({ basilica }: BasilicaDetailsProps) {
  const years = basilica.endYear
    ? `${basilica.startYear}–${basilica.endYear}`
    : basilica.startYear?.toString() || 'Unknown';

  const basilicaTypeLabel =
    basilica.type === 'major-basilica'
      ? 'Major Basilica'
      : basilica.type === 'papal-basilica'
        ? 'Papal Basilica'
        : basilica.type === 'patriarchal-basilica'
          ? 'Patriarchal Basilica'
          : 'Historic Basilica';

  const colors = getBasilicaColor(basilica.type);

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}
        >
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
            <h2
              style={{
                margin: 0,
                marginBottom: '0.5rem',
                fontSize: '1.75rem',
                color: '#fff',
                lineHeight: '1.2',
              }}
            >
              {basilica.name}
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
                  backgroundColor: colors.fill,
                  color: '#fff',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  border: `1px solid ${colors.stroke}`,
                  boxShadow: `0 0 8px ${colors.glow}`,
                }}
              >
                {basilicaTypeLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {basilica.description && (
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
            {basilica.description}
          </p>
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
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
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
