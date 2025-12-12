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

function loadPersonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const person = JSON.parse(content);
    return {
      id: person.id,
      name: person.name,
      file: filePath,
    };
  } catch (error) {
    return {
      id: null,
      name: 'Unknown',
      file: filePath,
      error: `Failed to parse JSON: ${error.message}`,
    };
  }
}

function loadEventFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const event = JSON.parse(content);
    return {
      id: event.id,
      name: event.name,
      file: filePath,
    };
  } catch (error) {
    return {
      id: null,
      name: 'Unknown',
      file: filePath,
      error: `Failed to parse JSON: ${error.message}`,
    };
  }
}

function findDuplicates(items, type) {
  const idMap = new Map();
  const duplicates = [];
  
  items.forEach(item => {
    if (!item.id) {
      return; // Skip items with parse errors
    }
    
    if (!idMap.has(item.id)) {
      idMap.set(item.id, []);
    }
    idMap.get(item.id).push(item);
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

function main() {
  const peopleDir = path.join(__dirname, 'src', 'data', 'people');
  const eventsDir = path.join(__dirname, 'src', 'data', 'events');
  
  if (!fs.existsSync(peopleDir)) {
    console.error(`${colors.red}Error: ${peopleDir} not found${colors.reset}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(eventsDir)) {
    console.error(`${colors.red}Error: ${eventsDir} not found${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.blue}Finding all person JSON files...${colors.reset}`);
  const personFiles = findJsonFiles(peopleDir);
  console.log(`Found ${personFiles.length} person files\n`);
  
  console.log(`${colors.blue}Finding all event JSON files...${colors.reset}`);
  const eventFiles = findJsonFiles(eventsDir);
  console.log(`Found ${eventFiles.length} event files\n`);
  
  console.log(`${colors.blue}Loading and checking for duplicates...${colors.reset}\n`);
  
  // Load all people
  const people = personFiles.map(loadPersonFile);
  const peopleWithErrors = people.filter(p => p.error);
  
  // Load all events
  const events = eventFiles.map(loadEventFile);
  const eventsWithErrors = events.filter(e => e.error);
  
  // Find duplicates
  const duplicatePeople = findDuplicates(people, 'person');
  const duplicateEvents = findDuplicates(events, 'event');
  
  // Report results
  let hasErrors = false;
  
  if (peopleWithErrors.length > 0) {
    console.log(`${colors.red}=== PARSE ERRORS IN PEOPLE FILES ===${colors.reset}`);
    peopleWithErrors.forEach(p => {
      console.log(`${colors.red}✗${colors.reset} ${path.relative(__dirname, p.file)}`);
      console.log(`  Error: ${p.error}`);
      console.log('');
    });
    hasErrors = true;
  }
  
  if (eventsWithErrors.length > 0) {
    console.log(`${colors.red}=== PARSE ERRORS IN EVENT FILES ===${colors.reset}`);
    eventsWithErrors.forEach(e => {
      console.log(`${colors.red}✗${colors.reset} ${path.relative(__dirname, e.file)}`);
      console.log(`  Error: ${e.error}`);
      console.log('');
    });
    hasErrors = true;
  }
  
  if (duplicatePeople.length > 0) {
    console.log(`${colors.red}=== DUPLICATE PEOPLE IDs ===${colors.reset}`);
    duplicatePeople.forEach(dup => {
      console.log(`${colors.red}✗${colors.reset} ID: ${dup.id} (found ${dup.items.length} times)`);
      dup.items.forEach(item => {
        console.log(`  - ${item.name}`);
        console.log(`    File: ${path.relative(__dirname, item.file)}`);
      });
      console.log('');
    });
    hasErrors = true;
  }
  
  if (duplicateEvents.length > 0) {
    console.log(`${colors.red}=== DUPLICATE EVENT IDs ===${colors.reset}`);
    duplicateEvents.forEach(dup => {
      console.log(`${colors.red}✗${colors.reset} ID: ${dup.id} (found ${dup.items.length} times)`);
      dup.items.forEach(item => {
        console.log(`  - ${item.name}`);
        console.log(`    File: ${path.relative(__dirname, item.file)}`);
      });
      console.log('');
    });
    hasErrors = true;
  }
  
  // Summary
  console.log(`${colors.blue}=== SUMMARY ===${colors.reset}`);
  console.log(`People checked: ${people.length}`);
  console.log(`Events checked: ${events.length}`);
  console.log(`${colors.red}Duplicate people IDs: ${duplicatePeople.length}${colors.reset}`);
  console.log(`${colors.red}Duplicate event IDs: ${duplicateEvents.length}${colors.reset}`);
  
  if (!hasErrors && duplicatePeople.length === 0 && duplicateEvents.length === 0) {
    console.log(`\n${colors.green}✓ No duplicates found!${colors.reset}`);
  }
  
  // Exit with error code if there are duplicates or parse errors
  if (hasErrors || duplicatePeople.length > 0 || duplicateEvents.length > 0) {
    process.exit(1);
  }
}

main();
