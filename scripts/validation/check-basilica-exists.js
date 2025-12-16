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

function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function findMatches(searchTerm, basilicas) {
  const normalizedSearch = normalizeString(searchTerm);
  const matches = [];

  basilicas.forEach(basilica => {
    const normalizedName = normalizeString(basilica.name);
    const normalizedId = normalizeString(basilica.id);

    // Exact match
    if (normalizedName === normalizedSearch || normalizedId === normalizedSearch) {
      matches.push({ basilica, score: 100, type: 'exact' });
      return;
    }

    // Contains match
    if (normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
      matches.push({ basilica, score: 80, type: 'contains' });
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
      matches.push({ basilica, score: 50 + wordMatches * 10, type: 'partial' });
    }
  });

  return matches.sort((a, b) => b.score - a.score);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`${colors.blue}Usage: node check-basilica-exists.js <basilica-name-1> [basilica-name-2] ...${colors.reset}`);
    console.log(`${colors.cyan}Example: node check-basilica-exists.js "Our Lady of Guadalupe" "St. Peter's Basilica"${colors.reset}\n`);
    process.exit(0);
  }

  console.log(`${colors.blue}Checking for existing basilicas...${colors.reset}\n`);

  const basilicas = loadBasilicas();

  let foundAny = false;

  args.forEach(searchTerm => {
    console.log(`${colors.cyan}Searching for: "${searchTerm}"${colors.reset}`);
    const matches = findMatches(searchTerm, basilicas);

    if (matches.length === 0) {
      console.log(`${colors.green}✓ No matches found - safe to add${colors.reset}\n`);
    } else {
      foundAny = true;
      console.log(`${colors.yellow}⚠ Found ${matches.length} potential match(es):${colors.reset}`);
      matches.forEach((match, index) => {
        const { basilica, score, type } = match;
        console.log(`  ${index + 1}. ${colors.yellow}${basilica.name}${colors.reset} (id: ${basilica.id})`);
        console.log(`     Score: ${score}% (${type} match)`);
        console.log(`     Place: ${basilica.placeId}`);
        console.log(`     Type: ${basilica.type}`);
        if (basilica.startYear) {
          console.log(`     Start year: ${basilica.startYear}`);
        }
        console.log('');
      });
    }
  });

  if (foundAny) {
    console.log(`${colors.yellow}⚠ Warning: Some basilicas may already exist. Please review before adding.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ All basilicas checked - none found. Safe to proceed with adding.${colors.reset}\n`);
    process.exit(0);
  }
}

main();



