#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function findMatches(searchTerm, events) {
  const normalizedSearch = normalizeString(searchTerm);
  const matches = [];

  events.forEach(event => {
    if (!event || event.type !== 'council') return;

    const normalizedName = normalizeString(event.name);
    const normalizedId = normalizeString(event.id);

    if (normalizedName === normalizedSearch || normalizedId === normalizedSearch) {
      matches.push({ event, score: 100, type: 'exact' });
      return;
    }

    if (normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
      matches.push({ event, score: 80, type: 'contains' });
      return;
    }
  });

  return matches.sort((a, b) => b.score - a.score);
}

function findJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json') && !file.includes('index')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function loadEventFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const event = JSON.parse(content);
    return {
      id: event.id,
      name: event.name,
      startYear: event.startYear,
      endYear: event.endYear,
      type: event.type,
      file: filePath,
      century: path.basename(path.dirname(filePath)),
    };
  } catch (error) {
    return null;
  }
}

function calculateCentury(year) {
  return Math.ceil(year / 100);
}

function kebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadPlaces() {
  const placesPath = path.join(__dirname, '../..', 'src', 'data', 'places.json');
  return JSON.parse(fs.readFileSync(placesPath, 'utf8'));
}

function findPlace(searchTerm, places) {
  const normalized = normalizeString(searchTerm);
  return places.filter(place => {
    const normalizedName = normalizeString(place.name);
    const normalizedId = normalizeString(place.id);
    return normalizedName.includes(normalized) || normalized.includes(normalizedName) ||
           normalizedId.includes(normalized) || normalized.includes(normalizedId);
  });
}

async function promptForPlace(locationName) {
  const places = loadPlaces();
  const matches = findPlace(locationName, places);

  if (matches.length === 0) {
    console.log(`${colors.yellow}⚠ Location "${locationName}" not found in places.json${colors.reset}`);
    const addPlace = await question(`Would you like to add it? (y/n): `);

    if (addPlace.toLowerCase() === 'y') {
      const placeId = kebabCase(locationName);
      console.log(`\n${colors.cyan}Enter coordinates for ${locationName}:${colors.reset}`);
      const lat = await question('Latitude: ');
      const lng = await question('Longitude: ');
      const region = await question('Region (e.g., "Asia Minor", "Italy"): ');
      const modernCountry = await question('Modern Country: ');

      const newPlace = {
        id: placeId,
        name: locationName,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        region,
        modernCountry,
      };

      places.push(newPlace);
      places.sort((a, b) => a.id.localeCompare(b.id));

      const placesPath = path.join(__dirname, '../..', 'src', 'data', 'places.json');
      fs.writeFileSync(placesPath, JSON.stringify(places, null, 2) + '\n', 'utf8');
      console.log(`${colors.green}✓ Added "${locationName}" to places.json${colors.reset}\n`);

      return placeId;
    }
    return null;
  } else if (matches.length === 1) {
    console.log(`${colors.green}✓ Found location: ${matches[0].name} (${matches[0].id})${colors.reset}`);
    return matches[0].id;
  } else {
    console.log(`${colors.yellow}Found ${matches.length} matching locations:${colors.reset}`);
    matches.forEach((place, idx) => {
      console.log(`  ${idx + 1}. ${place.name} (${place.id}) - ${place.region}, ${place.modernCountry}`);
    });
    const choice = await question(`Select a location (1-${matches.length}), or 0 to skip: `);
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < matches.length) {
      return matches[index].id;
    }
    return null;
  }
}

async function main() {
  console.log(`${colors.bold}${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║  Add Council to Catholic History Atlas ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

  // Step 1: Get council name and check for duplicates
  const councilName = await question(`${colors.cyan}Council name:${colors.reset} `);

  console.log(`\n${colors.blue}Checking for existing councils...${colors.reset}`);
  const eventsDir = path.join(__dirname, '../..', 'src', 'data', 'events');
  const eventFiles = findJsonFiles(eventsDir);
  const events = eventFiles.map(loadEventFile).filter(e => e !== null);
  const matches = findMatches(councilName, events);

  if (matches.length > 0) {
    console.log(`${colors.red}⚠ Found ${matches.length} potential match(es):${colors.reset}`);
    matches.forEach((match, index) => {
      const { event } = match;
      console.log(`  ${index + 1}. ${event.name} (${event.id}) - ${event.startYear}`);
    });
    const proceed = await question(`\n${colors.yellow}A similar council may already exist. Continue anyway? (y/n):${colors.reset} `);
    if (proceed.toLowerCase() !== 'y') {
      console.log(`${colors.yellow}Cancelled.${colors.reset}`);
      rl.close();
      return;
    }
  } else {
    console.log(`${colors.green}✓ No duplicates found${colors.reset}`);
  }

  // Step 2: Get years
  const startYearInput = await question(`\n${colors.cyan}Start year:${colors.reset} `);
  const startYear = parseInt(startYearInput);

  const endYearInput = await question(`${colors.cyan}End year (press Enter if same as start):${colors.reset} `);
  const endYear = endYearInput ? parseInt(endYearInput) : startYear;

  const century = calculateCentury(startYear);
  console.log(`${colors.green}✓ Will be placed in century-${century}${colors.reset}`);

  // Step 3: Generate ID
  const suggestedId = kebabCase(councilName);
  const councilId = await question(`\n${colors.cyan}Council ID [${suggestedId}]:${colors.reset} `) || suggestedId;

  // Step 4: Get location
  const locationInput = await question(`\n${colors.cyan}Location (city/place):${colors.reset} `);
  let locationId = null;
  if (locationInput) {
    locationId = await promptForPlace(locationInput);
  }

  // Step 5: Get URLs
  const wikipediaUrl = await question(`\n${colors.cyan}Wikipedia URL (optional):${colors.reset} `);
  const newAdventUrl = await question(`${colors.cyan}New Advent URL (optional):${colors.reset} `);
  const imageUrl = await question(`${colors.cyan}Image URL (optional):${colors.reset} `);

  // Step 6: Get summary
  console.log(`\n${colors.cyan}Summary (2-3 sentences):${colors.reset}`);
  const summary = await question('> ');

  // Step 7: Get key documents
  console.log(`\n${colors.cyan}Key documents (comma-separated, press Enter to skip):${colors.reset}`);
  const keyDocsInput = await question('> ');
  const keyDocuments = keyDocsInput
    ? keyDocsInput.split(',').map(d => d.trim()).filter(d => d)
    : [];

  // Step 8: Create the JSON object
  const councilData = {
    id: councilId,
    name: councilName,
    startYear,
    endYear,
    type: 'council',
  };

  if (locationId) councilData.locationId = locationId;
  if (wikipediaUrl) councilData.wikipediaUrl = wikipediaUrl;
  if (newAdventUrl) councilData.newAdventUrl = newAdventUrl;
  if (imageUrl) councilData.imageUrl = imageUrl;
  if (summary) councilData.summary = summary;
  if (keyDocuments.length > 0) councilData.keyDocuments = keyDocuments;

  // Step 9: Show preview and confirm
  console.log(`\n${colors.bold}${colors.yellow}Preview:${colors.reset}`);
  console.log(JSON.stringify(councilData, null, 2));

  const confirm = await question(`\n${colors.cyan}Create this council? (y/n):${colors.reset} `);
  if (confirm.toLowerCase() !== 'y') {
    console.log(`${colors.yellow}Cancelled.${colors.reset}`);
    rl.close();
    return;
  }

  // Step 10: Write the file
  const centuryDir = path.join(__dirname, '../..', 'src', 'data', 'events', `century-${century}`);
  if (!fs.existsSync(centuryDir)) {
    fs.mkdirSync(centuryDir, { recursive: true });
  }

  const fileName = `${councilId}.json`;
  const filePath = path.join(centuryDir, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`${colors.red}Error: File ${fileName} already exists in century-${century}${colors.reset}`);
    rl.close();
    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(councilData, null, 2) + '\n', 'utf8');
  console.log(`${colors.green}✓ Created ${filePath}${colors.reset}`);

  // Step 11: Update indexes
  console.log(`\n${colors.blue}Updating index files...${colors.reset}`);
  try {
    execSync('node src/data/generate-events-indexes.js', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Index files updated${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠ Warning: Could not auto-update indexes. Run manually: node src/data/generate-events-indexes.js${colors.reset}`);
  }

  // Step 12: Run linting
  console.log(`\n${colors.blue}Running linting checks...${colors.reset}`);

  try {
    execSync('npm run lint:duplicates', { stdio: 'inherit' });
    console.log(`${colors.green}✓ No duplicates found${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Duplicate check failed - please review${colors.reset}`);
  }

  console.log(`\n${colors.bold}${colors.green}✅ Council added successfully!${colors.reset}`);
  console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
  console.log(`  1. Run: ${colors.yellow}npm run build${colors.reset} to verify`);
  console.log(`  2. Run: ${colors.yellow}npm run lint:images${colors.reset} to check image URL`);
  console.log(`  3. Review the file: ${colors.yellow}${path.relative(__dirname, filePath)}${colors.reset}\n`);

  rl.close();
}

main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});
