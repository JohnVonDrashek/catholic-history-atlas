import { describe, it, expect } from 'vitest';
import { getBasilicaColor } from '../basilicaColors';
import type { BasilicaType } from '../../types/basilica';

describe('basilicaColors', () => {
  describe('getBasilicaColor', () => {
    it('returns purple colors for major-basilica', () => {
      const result = getBasilicaColor('major-basilica');
      expect(result).toEqual({
        fill: '#8B4CBF',
        stroke: '#6B2A9F',
        glow: 'rgba(139, 76, 191, 0.6)',
      });
    });

    it('returns gold colors for papal-basilica', () => {
      const result = getBasilicaColor('papal-basilica');
      expect(result).toEqual({
        fill: '#D4AF37',
        stroke: '#B8941F',
        glow: 'rgba(212, 175, 55, 0.6)',
      });
    });

    it('returns blue colors for patriarchal-basilica', () => {
      const result = getBasilicaColor('patriarchal-basilica');
      expect(result).toEqual({
        fill: '#4A90E2',
        stroke: '#2E6BB8',
        glow: 'rgba(74, 144, 226, 0.6)',
      });
    });

    it('returns bronze colors for historic-basilica', () => {
      const result = getBasilicaColor('historic-basilica');
      expect(result).toEqual({
        fill: '#CD7F32',
        stroke: '#A06628',
        glow: 'rgba(205, 127, 50, 0.6)',
      });
    });

    it('returns bronze colors for unknown types (default case)', () => {
      const result = getBasilicaColor('unknown-type' as BasilicaType);
      expect(result).toEqual({
        fill: '#CD7F32',
        stroke: '#A06628',
        glow: 'rgba(205, 127, 50, 0.6)',
      });
    });
  });
});
