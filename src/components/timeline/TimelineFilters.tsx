import { useMemo } from 'react';
import type { Person, Event } from '../../types';
import type { OrthodoxyStatus } from '../../types/person';
import type { EventType } from '../../types/event';
import { getEventColor } from '../../utils/eventColors';
import type { TimelineFilters } from './timelineTypes';

interface TimelineFiltersProps {
  filters: TimelineFilters;
  setFilters: React.Dispatch<React.SetStateAction<TimelineFilters>>;
  showFilters: boolean;
  filteredPeople: Person[];
  filteredEvents: Event[];
  allRoles: Set<string>;
  allTraditions: Set<string>;
}

export function TimelineFiltersPanel({
  filters,
  setFilters,
  showFilters,
  filteredPeople,
  filteredEvents,
  allRoles,
  allTraditions,
}: TimelineFiltersProps) {
  const allRolesArray = useMemo(() => {
    return Array.from(allRoles).sort();
  }, [allRoles]);

  const allTraditionsArray = useMemo(() => {
    return Array.from(allTraditions).sort();
  }, [allTraditions]);

  const toggleOrthodoxyStatus = (status: OrthodoxyStatus) => {
    setFilters((prev) => {
      const newSet = new Set(prev.orthodoxyStatus);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return { ...prev, orthodoxyStatus: newSet };
    });
  };

  const toggleRole = (role: string) => {
    setFilters((prev) => {
      const newSet = new Set(prev.roles);
      if (newSet.has(role)) {
        newSet.delete(role);
      } else {
        newSet.add(role);
      }
      return { ...prev, roles: newSet };
    });
  };

  const toggleTradition = (tradition: string) => {
    setFilters((prev) => {
      const newSet = new Set(prev.primaryTradition);
      if (newSet.has(tradition)) {
        newSet.delete(tradition);
      } else {
        newSet.add(tradition);
      }
      return { ...prev, primaryTradition: newSet };
    });
  };

  const toggleEventType = (type: EventType) => {
    setFilters((prev) => {
      const newSet = new Set(prev.eventTypes);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return { ...prev, eventTypes: newSet };
    });
  };

  const resetFilters = () => {
    setFilters({
      showPeople: true,
      showEvents: true,
      orthodoxyStatus: new Set<OrthodoxyStatus>([
        'canonized',
        'blessed',
        'orthodox',
        'schismatic',
        'heresiarch',
        'secular',
      ]),
      showMartyrs: null,
      roles: new Set(allRoles),
      primaryTradition: new Set(allTraditions),
      eventTypes: new Set<EventType>([
        'council',
        'schism',
        'persecution',
        'reform',
        'heresy',
        'war',
        'other',
      ]),
      showPopes: null,
      showWithWritings: null,
    });
  };

  if (!showFilters) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50px',
        right: '10px',
        width: '400px',
        maxHeight: 'calc(100vh - 100px)',
        padding: '1.5rem',
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        borderRadius: '8px',
        zIndex: 1000,
        color: '#fff',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Filters</h3>
        <button
          onClick={resetFilters}
          style={{
            padding: '0.4rem 0.8rem',
            backgroundColor: '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Reset All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Show/Hide Toggles */}
        <div>
          <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '14px' }}>
            Show/Hide
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={filters.showPeople}
              onChange={(e) => setFilters((prev) => ({ ...prev, showPeople: e.target.checked }))}
            />
            <span>People</span>
          </label>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={filters.showEvents}
              onChange={(e) => setFilters((prev) => ({ ...prev, showEvents: e.target.checked }))}
            />
            <span>Events</span>
          </label>
        </div>

        {/* Orthodoxy Status */}
        {filters.showPeople && (
          <div>
            <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '14px' }}>
              Orthodoxy Status
            </div>
            {(
              [
                'canonized',
                'blessed',
                'orthodox',
                'schismatic',
                'heresiarch',
                'secular',
              ] as OrthodoxyStatus[]
            ).map((status) => (
              <label
                key={status}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.orthodoxyStatus.has(status)}
                  onChange={() => toggleOrthodoxyStatus(status)}
                />
                <span style={{ textTransform: 'capitalize' }}>{status}</span>
              </label>
            ))}
          </div>
        )}

        {/* Martyr Filter */}
        {filters.showPeople && (
          <div>
            <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '14px' }}>
              Martyr Status
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="martyrFilter"
                  checked={filters.showMartyrs === null}
                  onChange={() => setFilters((prev) => ({ ...prev, showMartyrs: null }))}
                />
                <span>All</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="martyrFilter"
                  checked={filters.showMartyrs === true}
                  onChange={() => setFilters((prev) => ({ ...prev, showMartyrs: true }))}
                />
                <span>Martyrs Only</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="martyrFilter"
                  checked={filters.showMartyrs === false}
                  onChange={() => setFilters((prev) => ({ ...prev, showMartyrs: false }))}
                />
                <span>Non-Martyrs Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Pope Filter */}
        {filters.showPeople && (
          <div>
            <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '14px' }}>
              Pope Status
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="popeFilter"
                  checked={filters.showPopes === null}
                  onChange={() => setFilters((prev) => ({ ...prev, showPopes: null }))}
                />
                <span>All</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="popeFilter"
                  checked={filters.showPopes === true}
                  onChange={() => setFilters((prev) => ({ ...prev, showPopes: true }))}
                />
                <span>Popes Only</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="popeFilter"
                  checked={filters.showPopes === false}
                  onChange={() => setFilters((prev) => ({ ...prev, showPopes: false }))}
                />
                <span>Exclude Popes</span>
              </label>
            </div>
          </div>
        )}

        {/* Writings Filter */}
        {filters.showPeople && (
          <div>
            <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '14px' }}>
              Writings
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="writingsFilter"
                  checked={filters.showWithWritings === null}
                  onChange={() => setFilters((prev) => ({ ...prev, showWithWritings: null }))}
                />
                <span>All</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="writingsFilter"
                  checked={filters.showWithWritings === true}
                  onChange={() => setFilters((prev) => ({ ...prev, showWithWritings: true }))}
                />
                <span>With Writings</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="writingsFilter"
                  checked={filters.showWithWritings === false}
                  onChange={() => setFilters((prev) => ({ ...prev, showWithWritings: false }))}
                />
                <span>Without Writings</span>
              </label>
            </div>
          </div>
        )}

        {/* Roles */}
        {filters.showPeople && allRolesArray.length > 0 && (
          <div>
            <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '14px' }}>
              Roles
            </div>
            {allRolesArray.map((role) => (
              <label
                key={role}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.roles.has(role)}
                  onChange={() => toggleRole(role)}
                />
                <span style={{ textTransform: 'capitalize' }}>{role}</span>
              </label>
            ))}
          </div>
        )}

        {/* Traditions */}
        {filters.showPeople && allTraditionsArray.length > 0 && (
          <div>
            <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '14px' }}>
              Primary Tradition
            </div>
            {allTraditionsArray.map((tradition) => (
              <label
                key={tradition}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.primaryTradition.has(tradition)}
                  onChange={() => toggleTradition(tradition)}
                />
                <span style={{ textTransform: 'capitalize' }}>{tradition}</span>
              </label>
            ))}
          </div>
        )}

        {/* Event Types */}
        {filters.showEvents && (
          <div>
            <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '14px' }}>
              Event Types
            </div>
            {(
              [
                'council',
                'schism',
                'persecution',
                'reform',
                'heresy',
                'war',
                'apparition',
                'other',
              ] as EventType[]
            ).map((type) => {
              const color = getEventColor(type);
              return (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.eventTypes.has(type)}
                    onChange={() => toggleEventType(type)}
                  />
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: color.fill,
                      border: `1px solid ${color.stroke}`,
                      borderRadius: '3px',
                      flexShrink: 0,
                    }}
                    title={color.label}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{type}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Filter Summary */}
      <div
        style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #444',
          fontSize: '12px',
          color: '#aaa',
        }}
      >
        Showing: {filteredPeople.length} people, {filteredEvents.length} events
      </div>
    </div>
  );
}
