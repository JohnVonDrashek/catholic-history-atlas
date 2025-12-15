import { Link } from 'react-router-dom';
import { FigurePortrait } from './FigurePortrait';
import type { OrthodoxyStatus } from '../types';

export function About() {
  const placeholderImage = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect width="100" height="100" fill="#666"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial" font-size="24">👤</text>
    </svg>
  `);

  const legendItems = [
    {
      frame: 'saint',
      orthodoxyStatus: 'canonized' as OrthodoxyStatus,
      isMartyr: false,
      title: 'Canonized Saint',
      description: 'A saint officially canonized by the Catholic Church',
      example: 'St. Augustine, St. Athanasius',
    },
    {
      frame: 'martyr',
      orthodoxyStatus: 'canonized' as OrthodoxyStatus,
      isMartyr: true,
      title: 'Martyr',
      description: 'A canonized saint who died for the faith',
      example: 'St. Ignatius of Antioch, St. Polycarp',
    },
    {
      frame: 'blessed',
      orthodoxyStatus: 'blessed' as OrthodoxyStatus,
      isMartyr: false,
      title: 'Blessed',
      description: 'A person who has been beatified but not yet canonized',
      example: 'Various beatified individuals',
    },
    {
      frame: 'orthodox',
      orthodoxyStatus: 'orthodox' as OrthodoxyStatus,
      isMartyr: false,
      title: 'Orthodox Figure',
      description: 'Important historical figure supportive of the Church but not canonized',
      example: 'Emperors, sympathetic rulers',
    },
    {
      frame: 'schismatic',
      orthodoxyStatus: 'schismatic' as OrthodoxyStatus,
      isMartyr: false,
      title: 'Schismatic',
      description: 'Figure associated with a schism (rupture of communion)',
      example: 'Leaders of major schisms',
    },
    {
      frame: 'heresiarch',
      orthodoxyStatus: 'heresiarch' as OrthodoxyStatus,
      isMartyr: false,
      title: 'Heresiarch',
      description: 'Teacher whose doctrines were condemned as heresy by an ecumenical council',
      example: 'Arius, Nestorius',
    },
    {
      frame: 'secular',
      orthodoxyStatus: 'secular' as OrthodoxyStatus,
      isMartyr: false,
      title: 'Secular Figure',
      description: 'Secular historical figure not primarily a Church figure',
      example: 'Roman officials, philosophers',
    },
  ];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Toolbar matching AtlasView */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        gap: '2rem',
      }}>
        {/* Empty space on left to match AtlasView layout */}
        <div style={{ flex: 1 }}></div>
        
        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/"
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
            Atlas
          </Link>
          <Link
            to="/about"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4a9eff',
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

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#1a1a1a',
          color: '#fff',
          padding: '2rem',
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff' }}>
          Catholic History Atlas
        </h1>

      <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#ddd', marginBottom: '2rem' }}>
        An interactive Catholic history atlas that allows you to explore the Christian world through time, 
        with timeline and map views showing saints, councils, and major events. Navigate through centuries 
        to discover how the Church spread across the Mediterranean and beyond, from the early Church fathers 
        to the modern era. Visualize the geographical distribution of saints and events, explore detailed 
        biographies with images from Wikipedia, and trace the development of Christian doctrine through 
        councils and key historical moments.
      </p>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#fff', borderBottom: '2px solid #4a9eff', paddingBottom: '0.5rem' }}>
          How to Use
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#4a9eff' }}>
              Year Navigation
            </h3>
            <p style={{ lineHeight: '1.8', color: '#ddd' }}>
              Navigate through history using the year selector at the top. Use the left/right controls 
              to move through time, or click the year display to jump to a specific date. The default 
              starting point is the Council of Nicaea (325 AD).
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#4a9eff' }}>
              Timeline View
            </h3>
            <p style={{ lineHeight: '1.8', color: '#ddd' }}>
              See all people and events active in a given year laid out chronologically. This view helps 
              you understand what was happening simultaneously in different parts of the Christian world.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#4a9eff' }}>
              Map View
            </h3>
            <p style={{ lineHeight: '1.8', color: '#ddd' }}>
              Visualize the geographical distribution of saints, events, basilicas, and ecclesiastical sees. 
              Explore how Christianity spread across the Mediterranean and beyond, and see the locations 
              of major historical events.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#4a9eff' }}>
              Detail Modals
            </h3>
            <p style={{ lineHeight: '1.8', color: '#ddd' }}>
              Click on any person or event to see detailed information, including images from Wikipedia, 
              links to New Advent and Wikipedia, and curated summaries with key quotes. Each entry provides 
              historical context and significance.
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#fff', borderBottom: '2px solid #4a9eff', paddingBottom: '0.5rem' }}>
          Visual Categorization
        </h2>
        <p style={{ lineHeight: '1.8', color: '#ddd', marginBottom: '1.5rem' }}>
          The frames around portraits indicate a person's status in relation to the Catholic Church. 
          This visual system helps you quickly identify different types of historical figures.
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
                <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#fff', fontSize: '1.1rem' }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, marginBottom: '0.5rem', color: '#ddd', lineHeight: '1.6' }}>
                  {item.description}
                </p>
                <p style={{ margin: 0, color: '#888', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Examples: {item.example}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#fff', borderBottom: '2px solid #4a9eff', paddingBottom: '0.5rem' }}>
          Data Sources
        </h2>
        <p style={{ lineHeight: '1.8', color: '#ddd', marginBottom: '1rem' }}>
          This atlas draws from a variety of historical sources:
        </p>
        <ul style={{ lineHeight: '2', color: '#ddd', paddingLeft: '1.5rem' }}>
          <li><strong>Wikipedia</strong> - Images and biographical information</li>
          <li><strong>New Advent Catholic Encyclopedia</strong> - Historical context and theological significance</li>
          <li><strong>Historical records</strong> - Dates, locations, and key events from scholarly sources</li>
        </ul>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#fff', borderBottom: '2px solid #4a9eff', paddingBottom: '0.5rem' }}>
          Resources
        </h2>
        <ul style={{ lineHeight: '2', color: '#ddd', paddingLeft: '1.5rem' }}>
          <li>
            <a 
              href="https://www.newadvent.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#4a9eff', textDecoration: 'none' }}
            >
              New Advent Catholic Encyclopedia
            </a>
          </li>
          <li>
            <a 
              href="https://en.wikipedia.org/wiki/Catholic_Church" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#4a9eff', textDecoration: 'none' }}
            >
              Wikipedia - Catholic Church
            </a>
          </li>
        </ul>
      </section>

      <footer style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #333', color: '#888', textAlign: 'center' }}>
        <p style={{ margin: 0 }}>
          Catholic History Atlas © {new Date().getFullYear()}
        </p>
      </footer>
      </div>
    </div>
  );
}

