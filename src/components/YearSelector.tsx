import { useState, useRef, useEffect } from 'react';

interface YearSelectorProps {
  year: number;
  onYearChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  step?: number;
}

export function YearSelector({
  year,
  onYearChange,
  minYear = 30,
  maxYear = 2100,
  step = 10,
}: YearSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(year.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(year.toString());
  }, [year]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDecrement = () => {
    const newYear = Math.max(minYear, year - step);
    onYearChange(newYear);
  };

  const handleIncrement = () => {
    const newYear = Math.min(maxYear, year + step);
    onYearChange(newYear);
  };

  const handleInputClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const newYear = parseInt(inputValue, 10);
    if (!isNaN(newYear) && newYear >= minYear && newYear <= maxYear) {
      onYearChange(newYear);
    } else {
      // Reset to current year if invalid
      setInputValue(year.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setInputValue(year.toString());
      setIsEditing(false);
    }
  };

  const formatYear = (y: number) => {
    if (y < 0) return `${Math.abs(y)} BC`;
    if (y === 0) return '1 BC';
    return `${y} AD`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
      }}
    >
      <button
        onClick={handleDecrement}
        disabled={year <= minYear}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1.2rem',
          cursor: year <= minYear ? 'not-allowed' : 'pointer',
          opacity: year <= minYear ? 0.5 : 1,
          backgroundColor: 'transparent',
          border: 'none',
          color: '#fff',
        }}
      >
        ←
      </button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          min={minYear}
          max={maxYear}
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            width: '150px',
            backgroundColor: '#2a2a2a',
            color: '#fff',
            border: '2px solid #4a9eff',
            borderRadius: '4px',
            padding: '0.25rem',
          }}
        />
      ) : (
        <span
          onClick={handleInputClick}
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            minWidth: '150px',
            textAlign: 'center',
            color: '#fff',
          }}
          title="Click to enter a specific year"
        >
          {formatYear(year)}
        </span>
      )}
      <button
        onClick={handleIncrement}
        disabled={year >= maxYear}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1.2rem',
          cursor: year >= maxYear ? 'not-allowed' : 'pointer',
          opacity: year >= maxYear ? 0.5 : 1,
          backgroundColor: 'transparent',
          border: 'none',
          color: '#fff',
        }}
      >
        →
      </button>
    </div>
  );
}
