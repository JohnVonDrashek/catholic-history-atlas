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
  const handleDecrement = () => {
    const newYear = Math.max(minYear, year - step);
    onYearChange(newYear);
  };

  const handleIncrement = () => {
    const newYear = Math.min(maxYear, year + step);
    onYearChange(newYear);
  };

  const handleYearClick = () => {
    const input = prompt(`Enter a year (${minYear}-${maxYear}):`, year.toString());
    if (input) {
      const newYear = parseInt(input, 10);
      if (!isNaN(newYear) && newYear >= minYear && newYear <= maxYear) {
        onYearChange(newYear);
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: '#1a1a1a',
      borderBottom: '1px solid #333',
    }}>
      <button
        onClick={handleDecrement}
        disabled={year <= minYear}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1.2rem',
          cursor: year <= minYear ? 'not-allowed' : 'pointer',
          opacity: year <= minYear ? 0.5 : 1,
        }}
      >
        ←
      </button>
      <span
        onClick={handleYearClick}
        style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          minWidth: '120px',
          textAlign: 'center',
        }}
        title="Click to enter a specific year"
      >
        {year}
      </span>
      <button
        onClick={handleIncrement}
        disabled={year >= maxYear}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1.2rem',
          cursor: year >= maxYear ? 'not-allowed' : 'pointer',
          opacity: year >= maxYear ? 0.5 : 1,
        }}
      >
        →
      </button>
    </div>
  );
}
