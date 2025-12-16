import { useState } from 'react';
import { FigurePortrait } from './FigurePortrait';

interface FrameLegendProps {
  onClose?: () => void;
}

export function FrameLegend({ onClose }: FrameLegendProps) {
  const [isOpen, setIsOpen] = useState(false);

  const placeholderImage =
    'data:image/svg+xml,' +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect width="100" height="100" fill="#666"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial" font-size="24">👤</text>
    </svg>
  `);

  const legendItems = [
    {
      frame: 'saint',
      orthodoxyStatus: 'canonized' as const,
      isMartyr: false,
      title: 'Canonized Saint',
      description: 'A saint officially canonized by the Catholic Church',
      example: 'St. Augustine, St. Athanasius',
    },
    {
      frame: 'martyr',
      orthodoxyStatus: 'canonized' as const,
      isMartyr: true,
      title: 'Martyr',
      description: 'A canonized saint who died for the faith',
      example: 'St. Ignatius of Antioch, St. Polycarp',
    },
    {
      frame: 'blessed',
      orthodoxyStatus: 'blessed' as const,
      isMartyr: false,
      title: 'Blessed',
      description: 'A person who has been beatified but not yet canonized',
      example: 'Various beatified individuals',
    },
    {
      frame: 'orthodox',
      orthodoxyStatus: 'orthodox' as const,
      isMartyr: false,
      title: 'Orthodox Figure',
      description: 'Important historical figure supportive of the Church but not canonized',
      example: 'Emperors, sympathetic rulers',
    },
    {
      frame: 'schismatic',
      orthodoxyStatus: 'schismatic' as const,
      isMartyr: false,
      title: 'Schismatic',
      description: 'Figure associated with a schism (rupture of communion)',
      example: 'Leaders of major schisms',
    },
    {
      frame: 'heresiarch',
      orthodoxyStatus: 'heresiarch' as const,
      isMartyr: false,
      title: 'Heresiarch',
      description: 'Teacher whose doctrines were condemned as heresy by an ecumenical council',
      example: 'Arius, Nestorius',
    },
    {
      frame: 'secular',
      orthodoxyStatus: 'secular' as const,
      isMartyr: false,
      title: 'Secular Figure',
      description: 'Secular historical figure not primarily a Church figure',
      example: 'Roman officials, philosophers',
    },
  ];

  if (!isOpen && !onClose) {
    // Button mode - show a button to open the legend
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#4a9eff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 100,
        }}
        title="Show frame legend"
      >
        Frame Legend
      </button>
    );
  }

  // Modal/overlay mode
  return (
    <>
      {!isOpen && !onClose && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4a9eff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 100,
          }}
        >
          Frame Legend
        </button>
      )}

      {(isOpen || onClose) && (
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
          onClick={() => {
            setIsOpen(false);
            onClose?.();
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
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
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#fff',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ×
            </button>

            <h2 style={{ margin: 0, marginBottom: '1.5rem', color: '#fff', fontSize: '1.75rem' }}>
              Portrait Frame Legend
            </h2>
            <p style={{ margin: 0, marginBottom: '2rem', color: '#aaa', lineHeight: '1.6' }}>
              The frames around portraits indicate the person's status in relation to the Catholic
              Church. This visual system helps you quickly identify different types of historical
              figures.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {legendItems.map((item) => (
                <div
                  key={item.frame}
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'flex-start',
                    padding: '1rem',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    <FigurePortrait
                      name={item.title}
                      imageUrl={placeholderImage}
                      orthodoxyStatus={item.orthodoxyStatus}
                      isMartyr={item.isMartyr}
                      size="medium"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: 0,
                        marginBottom: '0.5rem',
                        color: '#fff',
                        fontSize: '1.1rem',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        marginBottom: '0.5rem',
                        color: '#ddd',
                        lineHeight: '1.6',
                      }}
                    >
                      {item.description}
                    </p>
                    <p
                      style={{ margin: 0, color: '#888', fontSize: '0.9rem', fontStyle: 'italic' }}
                    >
                      Examples: {item.example}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
