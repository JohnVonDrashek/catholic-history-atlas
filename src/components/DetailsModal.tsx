import { Person, Event, Basilica } from '../types';
import { isPerson, isBasilica } from '../utils/typeGuards';
import { PersonDetails } from './details/PersonDetails';
import { EventDetails } from './details/EventDetails';
import { BasilicaDetails } from './details/BasilicaDetails';

interface DetailsModalProps {
  item: Person | Event | Basilica | null;
  onClose: () => void;
}

export function DetailsModal({ item, onClose }: DetailsModalProps) {
  if (!item) return null;

  const isPersonItem = isPerson(item);
  const isBasilicaItem = isBasilica(item);

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

        {isPersonItem ? (
          <PersonDetails person={item as Person} />
        ) : isBasilicaItem ? (
          <BasilicaDetails basilica={item as Basilica} />
        ) : (
          <EventDetails event={item as Event} />
        )}
      </div>
    </div>
  );
}
