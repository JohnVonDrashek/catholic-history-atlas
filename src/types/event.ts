export type EventType =
  | 'council'
  | 'schism'
  | 'persecution'
  | 'reform'
  | 'other';

export interface Event {
  id: string;
  name: string;
  startYear: number;
  endYear?: number; // For events that span multiple years
  type: EventType;
  locationId?: string;
  wikipediaUrl?: string;
  newAdventUrl?: string;
  summary: string;
  keyDocuments?: string[]; // e.g., "Nicaea I – Nicene Creed"
}
