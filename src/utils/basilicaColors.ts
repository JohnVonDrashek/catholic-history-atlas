import type { BasilicaType } from '../types/basilica';

// Get color scheme for basilica type
export const getBasilicaColor = (
  type: BasilicaType
): { fill: string; stroke: string; glow: string } => {
  switch (type) {
    case 'major-basilica':
      return { fill: '#8B4CBF', stroke: '#6B2A9F', glow: 'rgba(139, 76, 191, 0.6)' }; // Purple
    case 'papal-basilica':
      return { fill: '#D4AF37', stroke: '#B8941F', glow: 'rgba(212, 175, 55, 0.6)' }; // Gold
    case 'patriarchal-basilica':
      return { fill: '#4A90E2', stroke: '#2E6BB8', glow: 'rgba(74, 144, 226, 0.6)' }; // Blue
    case 'historic-basilica':
    default:
      return { fill: '#CD7F32', stroke: '#A06628', glow: 'rgba(205, 127, 50, 0.6)' }; // Bronze
  }
};
