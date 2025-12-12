import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const eventsDir = path.join(__dirname, 'events');

// Get all century event files
const files = fs.readdirSync(eventsDir).filter(file => file.startsWith('century-') && file.endsWith('-events.json'));

console.log(`Found ${files.length} century event files to process...\n`);

// Process each file
files.forEach(file => {
  const filePath = path.join(eventsDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Extract century number from filename (e.g., "century-1-events.json" -> "1")
  const centuryMatch = file.match(/century-(\d+)-events\.json/);
  if (!centuryMatch) {
    console.warn(`Skipping ${file} - couldn't extract century number`);
    return;
  }
  
  const century = centuryMatch[1];
  const centuryDir = path.join(eventsDir, `century-${century}`);
  
  // Create century directory
  if (!fs.existsSync(centuryDir)) {
    fs.mkdirSync(centuryDir, { recursive: true });
  }
  
  // Write each event to its own file
  let count = 0;
  data.forEach(event => {
    if (!event.id) {
      console.warn(`Skipping event without id in ${file}:`, event.name || 'Unknown');
      return;
    }
    
    const eventFile = path.join(centuryDir, `${event.id}.json`);
    fs.writeFileSync(eventFile, JSON.stringify(event, null, 2));
    count++;
  });
  
  console.log(`Processed ${file}: ${count} events -> ${centuryDir}/`);
});

console.log('\nDone! All events have been split into individual files by century.');
