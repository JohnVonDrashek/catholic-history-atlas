#!/usr/bin/env node

/**
 * Linting script to validate that saints are placed in the correct century folder
 * based on their death year, and to check for duplicate IDs across centuries.
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PEOPLE_DIR = join(__dirname, 'src/data/people');

function getCenturyFromYear(year) {
  if (year === null || year === undefined) {
    return null;
  }
  // Centuries: 1-100 = 1st, 101-200 = 2nd, etc.
  return Math.floor((year - 1) / 100) + 1;
}

function getCenturyFromFolder(folderName) {
  const match = folderName.match(/century-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

async function getAllPeopleFiles() {
  const people = [];
  const entries = await readdir(PEOPLE_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('century-')) {
      const centuryFolder = entry.name;
      const centuryNum = getCenturyFromFolder(centuryFolder);
      const folderPath = join(PEOPLE_DIR, centuryFolder);
      const files = await readdir(folderPath);
      
      for (const file of files) {
        if (file.endsWith('.json') && file !== 'index.ts') {
          const filePath = join(folderPath, file);
          try {
            const content = await readFile(filePath, 'utf-8');
            const person = JSON.parse(content);
            people.push({
              id: person.id,
              name: person.name,
              deathYear: person.deathYear,
              expectedCentury: getCenturyFromYear(person.deathYear),
              actualCentury: centuryNum,
              filePath: filePath,
              folder: centuryFolder
            });
          } catch (error) {
            console.error(`Error reading ${filePath}:`, error.message);
          }
        }
      }
    }
  }
  
  return people;
}

async function main() {
  console.log('Checking century placement and duplicates...\n');
  
  const people = await getAllPeopleFiles();
  const errors = [];
  const warnings = [];
  const idMap = new Map();
  
  // Check for duplicates and wrong century placement
  for (const person of people) {
    // Check for duplicate IDs
    if (idMap.has(person.id)) {
      const existing = idMap.get(person.id);
      errors.push({
        type: 'duplicate',
        id: person.id,
        name: person.name,
        locations: [
          { century: existing.actualCentury, file: existing.filePath },
          { century: person.actualCentury, file: person.filePath }
        ]
      });
    } else {
      idMap.set(person.id, person);
    }
    
    // Check century placement
    if (person.deathYear === null || person.deathYear === undefined) {
      warnings.push({
        type: 'no_death_year',
        id: person.id,
        name: person.name,
        folder: person.folder,
        file: person.filePath
      });
    } else if (person.expectedCentury !== person.actualCentury) {
      errors.push({
        type: 'wrong_century',
        id: person.id,
        name: person.name,
        deathYear: person.deathYear,
        expectedCentury: person.expectedCentury,
        actualCentury: person.actualCentury,
        file: person.filePath
      });
    }
  }
  
  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed!');
    console.log(`   Found ${people.length} people in correct century folders.`);
    return 0;
  }
  
  if (errors.length > 0) {
    console.log(`❌ Found ${errors.length} error(s):\n`);
    
    const duplicates = errors.filter(e => e.type === 'duplicate');
    const wrongCentury = errors.filter(e => e.type === 'wrong_century');
    
    if (duplicates.length > 0) {
      console.log('DUPLICATE IDs:');
      for (const error of duplicates) {
        console.log(`  - ${error.name} (id: ${error.id})`);
        for (const loc of error.locations) {
          console.log(`    Found in century-${loc.century}: ${loc.file}`);
        }
      }
      console.log();
    }
    
    if (wrongCentury.length > 0) {
      console.log('WRONG CENTURY PLACEMENT:');
      for (const error of wrongCentury) {
        console.log(`  - ${error.name} (id: ${error.id})`);
        console.log(`    Death year: ${error.deathYear}`);
        console.log(`    Expected: century-${error.expectedCentury}`);
        console.log(`    Actual: century-${error.actualCentury}`);
        console.log(`    File: ${error.file}`);
      }
      console.log();
    }
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} warning(s):\n`);
    console.log('MISSING DEATH YEAR:');
    for (const warning of warnings) {
      console.log(`  - ${warning.name} (id: ${warning.id})`);
      console.log(`    Folder: ${warning.folder}`);
      console.log(`    File: ${warning.file}`);
    }
    console.log();
  }
  
  return errors.length > 0 ? 1 : 0;
}

main().then(code => process.exit(code)).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


