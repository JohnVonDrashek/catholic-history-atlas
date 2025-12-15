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

function loadPersonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const person = JSON.parse(content);
    return {
      id: person.id,
      name: person.name,
      deathYear: person.deathYear,
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

function findMatches(searchTerm, people) {
  const normalizedSearch = normalizeString(searchTerm);
  const matches = [];

  people.forEach(person => {
    if (!person) return;

    const normalizedName = normalizeString(person.name);
    const normalizedId = normalizeString(person.id);

    // Exact match
    if (normalizedName === normalizedSearch || normalizedId === normalizedSearch) {
      matches.push({ person, score: 100, type: 'exact' });
      return;
    }

    // Contains match
    if (normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
      matches.push({ person, score: 80, type: 'contains' });
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
      matches.push({ person, score: 50 + wordMatches * 10, type: 'partial' });
    }
  });

  return matches.sort((a, b) => b.score - a.score);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`${colors.blue}Usage: node check-saint-exists.js <saint-name-1> [saint-name-2] ...${colors.reset}`);
    console.log(`${colors.cyan}Example: node check-saint-exists.js "Francis Xavier" "Ignatius Loyola"${colors.reset}\n`);
    process.exit(0);
  }

  const peopleDir = path.join(__dirname, 'src', 'data', 'people');

  if (!fs.existsSync(peopleDir)) {
    console.error(`${colors.red}Error: ${peopleDir} not found${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}Checking for existing saints...${colors.reset}\n`);

  const personFiles = findJsonFiles(peopleDir);
  const people = personFiles.map(loadPersonFile).filter(p => p !== null);

  let foundAny = false;

  args.forEach(searchTerm => {
    console.log(`${colors.cyan}Searching for: "${searchTerm}"${colors.reset}`);
    const matches = findMatches(searchTerm, people);

    if (matches.length === 0) {
      console.log(`${colors.green}✓ No matches found - safe to add${colors.reset}\n`);
    } else {
      foundAny = true;
      console.log(`${colors.yellow}⚠ Found ${matches.length} potential match(es):${colors.reset}`);
      matches.forEach((match, index) => {
        const { person, score, type } = match;
        const relativePath = path.relative(__dirname, person.file);
        console.log(`  ${index + 1}. ${colors.yellow}${person.name}${colors.reset} (id: ${person.id})`);
        console.log(`     Score: ${score}% (${type} match)`);
        console.log(`     Death year: ${person.deathYear || 'unknown'}`);
        console.log(`     Location: ${person.century}`);
        console.log(`     File: ${relativePath}`);
        console.log('');
      });
    }
  });

  if (foundAny) {
    console.log(`${colors.yellow}⚠ Warning: Some saints may already exist. Please review before adding.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ All saints checked - none found. Safe to proceed with adding.${colors.reset}\n`);
    process.exit(0);
  }
}

main();




