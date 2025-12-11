export type OrthodoxyStatus =
  | 'canonized'
  | 'blessed'
  | 'orthodox'
  | 'schismatic'
  | 'heresiarch'
  | 'secular';

export interface Person {
  id: string;
  name: string;
  birthYear: number | null;
  deathYear: number;
  feastDay?: string;
  primaryTradition?: string; // e.g., "Latin", "Byzantine", "Syriac"
  roles?: string[]; // e.g., ["bishop", "monk", "martyr", "doctor of the Church"]
  orthodoxyStatus: OrthodoxyStatus;
  isMartyr?: boolean;
  locations: PersonLocation[];
  wikipediaUrl?: string;
  newAdventUrl?: string;
  imageUrl?: string; // From Wikipedia/Wikidata
  summary: string; // Curated text
  keyQuotes?: string[]; // Short quotations or paraphrases
}

export interface PersonLocation {
  placeId: string;
  startYear?: number;
  endYear?: number;
  description?: string; // e.g., "Bishop of Alexandria"
}
