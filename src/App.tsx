import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import initialData from './data';
import './styles/main.css';

// Lazy load route components for code splitting
const AtlasView = lazy(() =>
  import('./components/AtlasView').then((module) => ({ default: module.AtlasView }))
);
const About = lazy(() =>
  import('./components/About').then((module) => ({ default: module.About }))
);

function Navigation() {
  return (
    <nav
      style={{
        backgroundColor: '#1a1a1a',
        padding: '1rem 2rem',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      <Link
        to="/"
        style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#fff',
          textDecoration: 'none',
        }}
      >
        Catholic History Atlas
      </Link>
    </nav>
  );
}

function App() {
  const data = initialData as {
    people: import('./types').Person[];
    events: import('./types').Event[];
    places: import('./types').Place[];
    sees: import('./types').See[];
    basilicas: import('./types').Basilica[];
  };

  return (
    <ErrorBoundary>
      <HashRouter>
        <Navigation />
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'calc(100vh - 60px)',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                fontSize: '1.2rem',
              }}
            >
              Loading...
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <AtlasView data={data} />
                </ErrorBoundary>
              }
            />
            <Route path="/about" element={<About />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
