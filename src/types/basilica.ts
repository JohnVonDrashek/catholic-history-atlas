export type BasilicaType =
  | 'major-basilica' // One of the four major basilicas in Rome
  | 'papal-basilica' // Basilica designated by the Pope
  | 'patriarchal-basilica' // Patriarchal basilica
  | 'historic-basilica'; // Historically significant basilica

export interface Basilica {
  id: string;
  name: string;
  placeId: string; // Reference to place in places.json
  type: BasilicaType;
  startYear?: number; // When built/consecrated
  endYear?: number; // When destroyed or converted (if applicable)
  description?: string; // Brief description of the basilica's importance
  imageUrl?: string; // Optional image of the basilica
  wikipediaUrl?: string;
  newAdventUrl?: string;
}
