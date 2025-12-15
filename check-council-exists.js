#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

    // Exact match
    if (normalizedName === normalizedSearch || normalizedId === normalizedSearch) {
      matches.push({ event, score: 100, type: 'exact' });
      return;
    }

    // Contains match
    if (normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
      matches.push({ event, score: 80, type: 'contains' });
      return;
    }

    // Partial word match
    const searchWords = normalizedSearch.split(/\s+/);
    const nameWords = normalizedName.split(/\s+/);
    const idWords = normalizedId.split(/[-_]/);

    let wordMatches = 0;
    searchWords.forEach(searchWord => {
      if (nameWords.some(word => word.includes(searchWord) || searchWord.includes(word))) {
        wordMatches++;
      }
      if (idWords.some(word => word.includes(searchWord) || searchWord.includes(word))) {
        wordMatches++;
      }
    });

    if (wordMatches > 0) {
      matches.push({ event, score: 50 + wordMatches * 10, type: 'partial' });
    }
  });

  return matches.sort((a, b) => b.score - a.score);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`${colors.blue}Usage: node check-council-exists.js <council-name-1> [council-name-2] ...${colors.reset}`);
    console.log(`${colors.cyan}Example: node check-council-exists.js "Council of Trent" "First Council of Nicaea"${colors.reset}\n`);
    process.exit(0);
  }

  const eventsDir = path.join(__dirname, 'src', 'data', 'events');

  if (!fs.existsSync(eventsDir)) {
    console.error(`${colors.red}Error: ${eventsDir} not found${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}Checking for existing councils...${colors.reset}\n`);

  const eventFiles = findJsonFiles(eventsDir);
  const events = eventFiles.map(loadEventFile).filter(e => e !== null);

  let foundAny = false;

  args.forEach(searchTerm => {
    console.log(`${colors.cyan}Searching for: "${searchTerm}"${colors.reset}`);
    const matches = findMatches(searchTerm, events);

    if (matches.length === 0) {
      console.log(`${colors.green}✓ No matches found - safe to add${colors.reset}\n`);
    } else {
      foundAny = true;
      console.log(`${colors.yellow}⚠ Found ${matches.length} potential match(es):${colors.reset}`);
      matches.forEach((match, index) => {
        const { event, score, type } = match;
        const relativePath = path.relative(__dirname, event.file);
        console.log(`  ${index + 1}. ${colors.yellow}${event.name}${colors.reset} (id: ${event.id})`);
        console.log(`     Score: ${score}% (${type} match)`);
        console.log(`     Years: ${event.startYear}${event.endYear && event.endYear !== event.startYear ? `-${event.endYear}` : ''}`);
        console.log(`     Location: ${event.century}`);
        console.log(`     File: ${relativePath}`);
        console.log('');
      });
    }
  });

  if (foundAny) {
    console.log(`${colors.yellow}⚠ Warning: Some councils may already exist. Please review before adding.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ All councils checked - none found. Safe to proceed with adding.${colors.reset}\n`);
    process.exit(0);
  }
}

main();


