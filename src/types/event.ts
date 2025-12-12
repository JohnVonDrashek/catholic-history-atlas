export type EventType =
  | 'council'
  | 'schism'
  | 'persecution'
  | 'reform'
  | 'heresy'
  | 'war'
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
  imageUrl?: string;
  summary: string;
  keyDocuments?: string[]; // e.g., "Nicaea I – Nicene Creed"
}
