interface TimelineControlsProps {
  zoomLevel: number;
  isEditingZoom: boolean;
  zoomInputValue: string;
  handlePanLeft: () => void;
  handlePanRight: () => void;
  handleZoomOut: () => void;
  handleZoomIn: () => void;
  handleZoomReset: () => void;
  handleZoomInputClick: () => void;
  handleZoomInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleZoomInputBlur: () => void;
  handleZoomInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function TimelineControls({
  zoomLevel,
  isEditingZoom,
  zoomInputValue,
  handlePanLeft,
  handlePanRight,
  handleZoomOut,
  handleZoomIn,
  handleZoomReset,
  handleZoomInputClick,
  handleZoomInputChange,
  handleZoomInputBlur,
  handleZoomInputKeyDown,
}: TimelineControlsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        padding: '0.75rem',
        borderRadius: '8px',
        zIndex: 1000,
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Pan controls (always visible, disabled at 100%) */}
      <button
        onClick={handlePanLeft}
        disabled={zoomLevel === 0}
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: zoomLevel === 0 ? '#444' : '#4a9eff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: zoomLevel === 0 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          opacity: zoomLevel === 0 ? 0.5 : 1,
        }}
        title="Pan left (earlier)"
      >
        ←
      </button>
      <button
        onClick={handlePanRight}
        disabled={zoomLevel === 0}
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: zoomLevel === 0 ? '#444' : '#4a9eff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: zoomLevel === 0 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          opacity: zoomLevel === 0 ? 0.5 : 1,
        }}
        title="Pan right (later)"
      >
        →
      </button>
      <div
        style={{ width: '1px', height: '20px', backgroundColor: '#666', margin: '0 0.25rem' }}
      ></div>
      <button
        onClick={handleZoomOut}
        disabled={zoomLevel === 0}
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: zoomLevel === 0 ? '#444' : '#4a9eff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: zoomLevel === 0 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
        }}
        title="Zoom out"
      >
        −
      </button>
      {isEditingZoom ? (
        <input
          type="number"
          value={zoomInputValue}
          onChange={handleZoomInputChange}
          onBlur={handleZoomInputBlur}
          onKeyDown={handleZoomInputKeyDown}
          min={100}
          max={3200}
          style={{
            fontSize: '14px',
            textAlign: 'center',
            width: '60px',
            backgroundColor: '#2a2a2a',
            color: '#fff',
            border: '2px solid #4a9eff',
            borderRadius: '4px',
            padding: '0.25rem',
          }}
          autoFocus
        />
      ) : (
        <span
          onClick={handleZoomInputClick}
          style={{
            color: '#aaa',
            fontSize: '14px',
            minWidth: '60px',
            textAlign: 'center',
            cursor: 'pointer',
            padding: '0.25rem',
            border: '2px solid transparent',
            borderRadius: '4px',
            backgroundColor: '#2a2a2a',
          }}
          title="Click to edit zoom percentage"
        >
          {zoomInputValue}%
        </span>
      )}
      <button
        onClick={handleZoomIn}
        disabled={zoomLevel >= 5}
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: zoomLevel >= 5 ? '#444' : '#4a9eff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: zoomLevel >= 5 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
        }}
        title="Zoom in"
      >
        +
      </button>
      <div
        style={{ width: '1px', height: '20px', backgroundColor: '#666', margin: '0 0.25rem' }}
      ></div>
      <button
        onClick={handleZoomReset}
        disabled={zoomLevel === 0}
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: zoomLevel === 0 ? '#444' : '#4a9eff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: zoomLevel === 0 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          marginLeft: '0.25rem',
          opacity: zoomLevel === 0 ? 0.5 : 1,
        }}
        title="Reset zoom"
      >
        Reset
      </button>
    </div>
  );
}
