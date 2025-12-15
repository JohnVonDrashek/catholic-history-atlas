import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { AtlasView } from './components/AtlasView';
import { About } from './components/About';
import initialData from './data';
import './styles/main.css';

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
    <HashRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<AtlasView data={data} />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
