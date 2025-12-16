#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function loadBasilicas() {
  const basilicasPath = path.join(__dirname, '../..', 'src', 'data', 'basilicas.json');
  
  if (!fs.existsSync(basilicasPath)) {
    console.error(`${colors.red}Error: ${basilicasPath} not found${colors.reset}`);
    process.exit(1);
  }
  
  try {
    const content = fs.readFileSync(basilicasPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error parsing basilicas.json: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function loadPlaces() {
  const placesPath = path.join(__dirname, '../..', 'src', 'data', 'places.json');
  
  if (!fs.existsSync(placesPath)) {
    console.error(`${colors.red}Error: ${placesPath} not found${colors.reset}`);
    process.exit(1);
  }
  
  try {
    const content = fs.readFileSync(placesPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error parsing places.json: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function findDuplicates(basilicas) {
  const idMap = new Map();
  const duplicates = [];
  
  basilicas.forEach((basilica, index) => {
    if (!basilica.id) {
      return; // Skip items without id
    }
    
    if (!idMap.has(basilica.id)) {
      idMap.set(basilica.id, []);
    }
    idMap.get(basilica.id).push({ basilica, index });
  });
  
  idMap.forEach((itemsWithId, id) => {
    if (itemsWithId.length > 1) {
      duplicates.push({
        id,
        items: itemsWithId,
      });
    }
  });
  
  return duplicates;
}

function validatePlaceIds(basilicas, places) {
  const placeIds = new Set(places.map(p => p.id));
  const invalid = [];
  
  basilicas.forEach((basilica, index) => {
    if (!basilica.placeId) {
      invalid.push({
        basilica,
        index,
        error: 'Missing placeId',
      });
    } else if (!placeIds.has(basilica.placeId)) {
      invalid.push({
        basilica,
        index,
        error: `Invalid placeId: "${basilica.placeId}" not found in places.json`,
      });
    }
  });
  
  return invalid;
}

function validateRequiredFields(basilicas) {
  const requiredFields = ['id', 'name', 'placeId', 'type'];
  const invalid = [];
  
  basilicas.forEach((basilica, index) => {
    const missing = requiredFields.filter(field => !basilica[field]);
    if (missing.length > 0) {
      invalid.push({
        basilica,
        index,
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }
  });
  
  return invalid;
}

function validateBasilicaTypes(basilicas) {
  const validTypes = ['major-basilica', 'papal-basilica', 'patriarchal-basilica', 'historic-basilica'];
  const invalid = [];
  
  basilicas.forEach((basilica, index) => {
    if (basilica.type && !validTypes.includes(basilica.type)) {
      invalid.push({
        basilica,
        index,
        error: `Invalid type: "${basilica.type}". Must be one of: ${validTypes.join(', ')}`,
      });
    }
  });
  
  return invalid;
}

function main() {
  console.log(`${colors.blue}Loading basilicas.json...${colors.reset}`);
  const basilicas = loadBasilicas();
  console.log(`Found ${basilicas.length} basilicas\n`);
  
  console.log(`${colors.blue}Loading places.json...${colors.reset}`);
  const places = loadPlaces();
  console.log(`Found ${places.length} places\n`);
  
  console.log(`${colors.blue}Checking for duplicates and validation errors...${colors.reset}\n`);
  
  // Find duplicates
  const duplicateBasilicas = findDuplicates(basilicas);
  
  // Validate placeIds
  const invalidPlaceIds = validatePlaceIds(basilicas, places);
  
  // Validate required fields
  const missingFields = validateRequiredFields(basilicas);
  
  // Validate types
  const invalidTypes = validateBasilicaTypes(basilicas);
  
  // Report results
  let hasErrors = false;
  
  if (duplicateBasilicas.length > 0) {
    console.log(`${colors.red}=== DUPLICATE BASILICA IDs ===${colors.reset}`);
    duplicateBasilicas.forEach(dup => {
      console.log(`${colors.red}✗${colors.reset} ID: ${dup.id} (found ${dup.items.length} times)`);
      dup.items.forEach(({ basilica, index }) => {
        console.log(`  - ${basilica.name}`);
        console.log(`    Index: ${index}`);
        console.log(`    Place: ${basilica.placeId || 'N/A'}`);
      });
      console.log('');
    });
    hasErrors = true;
  }
  
  if (missingFields.length > 0) {
    console.log(`${colors.red}=== MISSING REQUIRED FIELDS ===${colors.reset}`);
    missingFields.forEach(({ basilica, index, error }) => {
      console.log(`${colors.red}✗${colors.reset} Index ${index}: ${basilica.name || 'Unknown'}`);
      console.log(`  Error: ${error}`);
      console.log('');
    });
    hasErrors = true;
  }
  
  if (invalidTypes.length > 0) {
    console.log(`${colors.red}=== INVALID BASILICA TYPES ===${colors.reset}`);
    invalidTypes.forEach(({ basilica, index, error }) => {
      console.log(`${colors.red}✗${colors.reset} Index ${index}: ${basilica.name} (id: ${basilica.id})`);
      console.log(`  Error: ${error}`);
      console.log('');
    });
    hasErrors = true;
  }
  
  if (invalidPlaceIds.length > 0) {
    console.log(`${colors.red}=== INVALID OR MISSING PLACE IDs ===${colors.reset}`);
    invalidPlaceIds.forEach(({ basilica, index, error }) => {
      console.log(`${colors.red}✗${colors.reset} Index ${index}: ${basilica.name} (id: ${basilica.id})`);
      console.log(`  Error: ${error}`);
      console.log('');
    });
    hasErrors = true;
  }
  
  // Summary
  console.log(`${colors.blue}=== SUMMARY ===${colors.reset}`);
  console.log(`Basilicas checked: ${basilicas.length}`);
  console.log(`${colors.red}Duplicate IDs: ${duplicateBasilicas.length}${colors.reset}`);
  console.log(`${colors.red}Missing required fields: ${missingFields.length}${colors.reset}`);
  console.log(`${colors.red}Invalid types: ${invalidTypes.length}${colors.reset}`);
  console.log(`${colors.red}Invalid/missing placeIds: ${invalidPlaceIds.length}${colors.reset}`);
  
  if (!hasErrors) {
    console.log(`\n${colors.green}✓ No errors found! All basilicas are valid.${colors.reset}`);
  }
  
  // Exit with error code if there are errors
  if (hasErrors) {
    process.exit(1);
  }
}

main();



