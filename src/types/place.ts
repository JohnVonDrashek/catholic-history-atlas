export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region?: string; // e.g., "Asia Minor", "Italia"
  modernCountry?: string; // Helpful for orientation
}
