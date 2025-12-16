import type { OrthodoxyStatus } from '../../types';

/**
 * Calculate offset position for markers at the same location
 * Arranges markers in a circle around the base position
 * Zoom-aware: larger offsets at lower zoom levels to prevent overlap
 */
export function calculateOffsetPosition(
  baseLat: number,
  baseLng: number,
  index: number,
  totalCount: number,
  zoom: number
): [number, number] {
  if (totalCount === 1) {
    return [baseLat, baseLng];
  }

  // Base radius in degrees - scales inversely with zoom
  // Formula: baseRadius decreases exponentially as zoom increases
  const baseRadius = 0.7 / Math.pow(1.5, zoom - 4);

  // Scale radius based on total count to prevent overlap
  const countMultiplier =
    zoom <= 6 ? Math.min(1 + totalCount * 0.4, 4.0) : Math.min(1 + totalCount * 0.3, 3.5);
  const radius = baseRadius * countMultiplier;

  // Calculate angle in radians
  const angle = (index * 2 * Math.PI) / totalCount;

  // Calculate offset (latitude and longitude)
  const latOffset = radius * Math.cos(angle);
  const lngOffset = (radius * Math.sin(angle)) / Math.cos((baseLat * Math.PI) / 180);

  return [baseLat + latOffset, baseLng + lngOffset];
}

/**
 * Get border style based on orthodoxy status and martyr status
 * Matches the portrait frame system
 */
export function getPersonBorderStyle(
  orthodoxyStatus: OrthodoxyStatus,
  isMartyr?: boolean,
  borderWidthOverride?: number
): {
  border: string;
  borderWidth: string;
  boxShadow: string;
  background?: string;
} {
  // Helper to get border width with override
  const getBorderWidth = (defaultWidth: number): number => {
    return borderWidthOverride ?? defaultWidth;
  };

  if (isMartyr && (orthodoxyStatus === 'canonized' || orthodoxyStatus === 'blessed')) {
    // Martyr: gold + red stripes
    const borderWidth = getBorderWidth(3);
    return {
      border: `${borderWidth}px solid transparent`,
      borderWidth: `${borderWidth}px`,
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      background: `repeating-linear-gradient(45deg, #d4af37, #d4af37 4px, #a11b1b 4px, #a11b1b 8px)`,
    };
  }

  switch (orthodoxyStatus) {
    case 'canonized': {
      const canonizedWidth = getBorderWidth(3);
      return {
        border: `${canonizedWidth}px solid #d4af37`,
        borderWidth: `${canonizedWidth}px`,
        boxShadow: '0 0 6px rgba(212, 175, 55, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    }
    case 'blessed': {
      const blessedWidth = getBorderWidth(2);
      return {
        border: `${blessedWidth}px solid #c0c0c0`,
        borderWidth: `${blessedWidth}px`,
        boxShadow: '0 0 4px rgba(192, 192, 192, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    }
    case 'orthodox': {
      const orthodoxWidth = getBorderWidth(2);
      return {
        border: `${orthodoxWidth}px solid #777`,
        borderWidth: `${orthodoxWidth}px`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        background: '#f7f7f7',
      };
    }
    case 'schismatic': {
      const schismaticWidth = getBorderWidth(3);
      return {
        border: `${schismaticWidth}px solid transparent`,
        borderWidth: `${schismaticWidth}px`,
        background:
          'repeating-linear-gradient(45deg, #000000 0px, #000000 6px, #ff073a 6px, #ff073a 12px)',
        boxShadow: '0 0 4px rgba(255, 7, 58, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    }
    case 'heresiarch': {
      const heresiarchWidth = getBorderWidth(3);
      return {
        border: `${heresiarchWidth}px solid transparent`,
        borderWidth: `${heresiarchWidth}px`,
        background:
          'repeating-linear-gradient(45deg, #000000 0px, #000000 6px, #39ff14 6px, #39ff14 12px)',
        boxShadow: '0 0 4px rgba(57, 255, 20, 0.6), 0 2px 6px rgba(0,0,0,0.4)',
      };
    }
    case 'secular':
    default: {
      const secularWidth = getBorderWidth(1);
      return {
        border: `${secularWidth}px solid #bbb`,
        borderWidth: `${secularWidth}px`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      };
    }
  }
}
