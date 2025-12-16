import { describe, it, expect } from 'vitest';
import { getEventColor } from '../eventColors';

describe('eventColors', () => {
  describe('getEventColor', () => {
    it('returns dark red color scheme for persecution events', () => {
      const result = getEventColor('persecution');
      expect(result).toEqual({
        fill: '#8b0000',
        stroke: '#b91c1c',
        textColor: '#fff',
        label: 'Persecution',
      });
    });

    it('returns purple color scheme for schism events', () => {
      const result = getEventColor('schism');
      expect(result).toEqual({
        fill: '#9b59b6',
        stroke: '#bb7dd9',
        textColor: '#fff',
        label: 'Schism',
      });
    });

    it('returns gold color scheme for council events', () => {
      const result = getEventColor('council');
      expect(result).toEqual({
        fill: '#ffd700',
        stroke: '#ffed4e',
        textColor: '#000',
        label: 'Council',
      });
    });

    it('returns orange color scheme for heresy events', () => {
      const result = getEventColor('heresy');
      expect(result).toEqual({
        fill: '#ff6b35',
        stroke: '#ff8c5a',
        textColor: '#fff',
        label: 'Heresy',
      });
    });

    it('returns green color scheme for reform events', () => {
      const result = getEventColor('reform');
      expect(result).toEqual({
        fill: '#2ecc71',
        stroke: '#58d68d',
        textColor: '#fff',
        label: 'Reform',
      });
    });

    it('returns steel gray color scheme for war events', () => {
      const result = getEventColor('war');
      expect(result).toEqual({
        fill: '#708090',
        stroke: '#8fa0b0',
        textColor: '#fff',
        label: 'War',
      });
    });

    it('returns sky blue color scheme for apparition events', () => {
      const result = getEventColor('apparition');
      expect(result).toEqual({
        fill: '#87CEEB',
        stroke: '#B0E0E6',
        textColor: '#fff',
        label: 'Apparition',
      });
    });

    it('returns light blue color scheme for other event types', () => {
      const result = getEventColor('other');
      expect(result).toEqual({
        fill: '#4a9eff',
        stroke: '#6bb3ff',
        textColor: '#fff',
        label: 'Other',
      });
    });
  });
});
