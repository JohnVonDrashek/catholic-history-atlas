import type { EventType } from '../types/event';

export interface EventColorScheme {
  fill: string;
  stroke: string;
  textColor: string;
  label: string;
}

export const eventTypeColors: Record<EventType, EventColorScheme> = {
  council: {
    fill: '#ffd700', // Gold
    stroke: '#ffed4e',
    textColor: '#000',
    label: 'Council',
  },
  schism: {
    fill: '#9b59b6', // Purple
    stroke: '#bb7dd9',
    textColor: '#fff',
    label: 'Schism',
  },
  persecution: {
    fill: '#8b0000', // Dark Red
    stroke: '#b91c1c',
    textColor: '#fff',
    label: 'Persecution',
  },
  reform: {
    fill: '#2ecc71', // Green
    stroke: '#58d68d',
    textColor: '#fff',
    label: 'Reform',
  },
  heresy: {
    fill: '#ff6b35', // Orange
    stroke: '#ff8c5a',
    textColor: '#fff',
    label: 'Heresy',
  },
  war: {
    fill: '#708090', // Steel Gray
    stroke: '#8fa0b0',
    textColor: '#fff',
    label: 'War',
  },
  apparition: {
    fill: '#87CEEB', // Sky Blue
    stroke: '#B0E0E6',
    textColor: '#fff',
    label: 'Apparition',
  },
  other: {
    fill: '#4a9eff', // Light Blue
    stroke: '#6bb3ff',
    textColor: '#fff',
    label: 'Other',
  },
};

export function getEventColor(type: EventType): EventColorScheme {
  return eventTypeColors[type];
}





