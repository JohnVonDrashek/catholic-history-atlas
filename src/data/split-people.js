import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const peopleDir = path.join(__dirname, 'people');

// Get all century people files
const files = fs.readdirSync(peopleDir).filter(file => file.startsWith('century-') && file.endsWith('-people.json'));

console.log(`Found ${files.length} century people files to process...\n`);

// Process each file
files.forEach(file => {
  const filePath = path.join(peopleDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Extract century number from filename (e.g., "century-1-people.json" -> "1")
  const centuryMatch = file.match(/century-(\d+)-people\.json/);
  if (!centuryMatch) {
    console.warn(`Skipping ${file} - couldn't extract century number`);
    return;
  }
  
  const century = centuryMatch[1];
  const centuryDir = path.join(peopleDir, `century-${century}`);
  
  // Create century directory
  if (!fs.existsSync(centuryDir)) {
    fs.mkdirSync(centuryDir, { recursive: true });
  }
  
  // Write each person to their own file
  let count = 0;
  data.forEach(person => {
    if (!person.id) {
      console.warn(`Skipping person without id in ${file}:`, person.name || 'Unknown');
      return;
    }
    
    const personFile = path.join(centuryDir, `${person.id}.json`);
    fs.writeFileSync(personFile, JSON.stringify(person, null, 2));
    count++;
  });
  
  console.log(`Processed ${file}: ${count} people -> ${centuryDir}/`);
});

console.log('\nDone! All people have been split into individual files by century.');
