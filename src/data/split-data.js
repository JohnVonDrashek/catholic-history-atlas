import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'initial-data.json'), 'utf8'));

// Helper function to get century from year
function getCentury(year) {
  if (year === null) return null;
  return Math.floor((year - 1) / 100) + 1;
}

// Split people by century
const peopleByCentury = {};
data.people.forEach(person => {
  const deathYear = person.deathYear;
  const birthYear = person.birthYear;
  const century = getCentury(deathYear || birthYear);
  
  if (century) {
    const key = `century-${century}`;
    if (!peopleByCentury[key]) {
      peopleByCentury[key] = [];
    }
    peopleByCentury[key].push(person);
  }
});

// Split events by century
const eventsByCentury = {};
data.events.forEach(event => {
  const startYear = event.startYear;
  const century = getCentury(startYear);
  
  if (century) {
    const key = `century-${century}`;
    if (!eventsByCentury[key]) {
      eventsByCentury[key] = [];
    }
    eventsByCentury[key].push(event);
  }
});

// Ensure subdirectories exist
const peopleDir = path.join(__dirname, 'people');
const eventsDir = path.join(__dirname, 'events');
if (!fs.existsSync(peopleDir)) {
  fs.mkdirSync(peopleDir, { recursive: true });
}
if (!fs.existsSync(eventsDir)) {
  fs.mkdirSync(eventsDir, { recursive: true });
}

// Write century files
Object.keys(peopleByCentury).forEach(century => {
  const filePath = path.join(peopleDir, `${century}-people.json`);
  fs.writeFileSync(filePath, JSON.stringify(peopleByCentury[century], null, 2));
  console.log(`Created ${filePath} with ${peopleByCentury[century].length} people`);
});

Object.keys(eventsByCentury).forEach(century => {
  const filePath = path.join(eventsDir, `${century}-events.json`);
  fs.writeFileSync(filePath, JSON.stringify(eventsByCentury[century], null, 2));
  console.log(`Created ${filePath} with ${eventsByCentury[century].length} events`);
});

// Write places file (shared across all centuries)
const placesPath = path.join(__dirname, 'places.json');
fs.writeFileSync(placesPath, JSON.stringify(data.places, null, 2));
console.log(`Created ${placesPath} with ${data.places.length} places`);

console.log('\nDone!');

