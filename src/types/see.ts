export type SeeType = 
  | 'patriarchate' // One of the five patriarchates (Pentarchy)
  | 'major-see'    // Important archbishopric/metropolitan see
  | 'apostolic-see'; // See founded by an apostle

export interface See {
  id: string;
  name: string;
  placeId: string; // Reference to place in places.json
  type: SeeType;
  startYear?: number; // When the see was established or became important
  endYear?: number; // When the see lost importance or was suppressed (optional)
  description?: string; // Brief description of the see's importance
  wikipediaUrl?: string;
  newAdventUrl?: string;
}
