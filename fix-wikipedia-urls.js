#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Cache configuration
const CACHE_FILE = path.join(__dirname, '.wikipedia-cache.json');
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Load cache from file
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(cacheData);
    }
  } catch (error) {
    // Silently fail if cache can't be loaded
  }
  return {};
}

// Save cache to file
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (error) {
    // Silently fail if cache can't be saved
  }
}

// Check if cache entry is still valid
function isCacheValid(entry) {
  if (!entry.timestamp) return false;
  return Date.now() - entry.timestamp < CACHE_MAX_AGE;
}

// Make HTTP request with promise
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Catholic-History-Atlas/1.0 (https://github.com/example/catholic-history-atlas)',
        ...options.headers
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.timeout) {
      req.setTimeout(options.timeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    }

    req.end();
  });
}

// Check if Wikipedia URL is valid
async function checkWikipediaUrl(url, cache) {
  const cacheKey = `check_${url}`;

  if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
    return cache[cacheKey].result;
  }

  try {
    const response = await makeRequest(url, { timeout: 10000 });
    const result = response.status === 200 && !response.data.includes('Wikipedia does not have an article with this exact name');
    cache[cacheKey] = { result, timestamp: Date.now() };
    return result;
  } catch (error) {
    cache[cacheKey] = { result: false, timestamp: Date.now() };
    return false;
  }
}

// Search Wikipedia for articles
async function searchWikipedia(query, cache) {
  const cacheKey = `search_${query}`;

  if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
    return cache[cacheKey].results;
  }

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`;
    const response = await makeRequest(searchUrl, { timeout: 10000 });

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      const results = data[1] || [];
      cache[cacheKey] = { results, timestamp: Date.now() };
      return results;
    }
  } catch (error) {
    // Search failed, return empty results
  }

  cache[cacheKey] = { results: [], timestamp: Date.now() };
  return [];
}

// Find best Wikipedia URL for a saint
async function findBestWikipediaUrl(saintName, currentUrl, cache) {
  // First check if current URL is valid
  if (currentUrl && await checkWikipediaUrl(currentUrl, cache)) {
    return currentUrl;
  }

  // Try searching for the saint with more specific terms
  const baseName = saintName.replace(/^St\.?\s+/, '').replace(/\s*\([^)]*\)$/, ''); // Remove "St." prefix and parentheticals
  const searchTerms = [
    `${baseName} (saint)`,
    `${baseName} (Catholic saint)`,
    `Saint ${baseName}`,
    baseName,
    saintName
  ];

  for (const term of searchTerms) {
    const results = await searchWikipedia(term, cache);
    for (const result of results) {
      // Skip results that are clearly not about the saint
      if (result.toLowerCase().includes('croizier') ||
          result.toLowerCase().includes('storia') ||
          result.toLowerCase().includes('dos santos') ||
          result === 'Italy') {
        continue;
      }

      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(result.replace(/ /g, '_'))}`;
      if (await checkWikipediaUrl(url, cache)) {
        return url;
      }
    }
  }

  // If no good results found, return the original URL
  return currentUrl;
}

// Process all person JSON files
async function processAllSaints() {
  console.log(`${colors.blue}Finding all person JSON files...${colors.reset}`);

  const peopleDir = path.join(__dirname, 'src', 'data', 'people');
  const personFiles = [];

  // Find all person JSON files
  function findPersonFiles(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && item.startsWith('century-')) {
        findPersonFiles(fullPath);
      } else if (stat.isFile() && item.endsWith('.json') && item !== 'index.ts') {
        personFiles.push(fullPath);
      }
    }
  }

  findPersonFiles(peopleDir);

  console.log(`Found ${personFiles.length} person files`);

  const cache = loadCache();
  let fixed = 0;
  let skipped = 0;

  for (let i = 0; i < personFiles.length; i++) {
    const filePath = personFiles[i];
    const relativePath = path.relative(__dirname, filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const person = JSON.parse(content);

      if (!person.wikipediaUrl) {
        console.log(`${colors.yellow}Skipping ${relativePath} - no wikipediaUrl${colors.reset}`);
        skipped++;
        continue;
      }

      console.log(`${colors.cyan}Processing: ${person.name} (${person.id})${colors.reset}`);
      console.log(`  File: ${relativePath}`);

      const bestUrl = await findBestWikipediaUrl(person.name, person.wikipediaUrl, cache);

      if (bestUrl !== person.wikipediaUrl) {
        console.log(`  ${colors.yellow}Current: ${person.wikipediaUrl}${colors.reset}`);
        console.log(`  ${colors.green}Updated: ${bestUrl}${colors.reset}`);

        person.wikipediaUrl = bestUrl;

        // Write back the updated JSON
        fs.writeFileSync(filePath, JSON.stringify(person, null, 2), 'utf8');
        console.log(`  ${colors.green}✓ Updated${colors.reset}`);
        fixed++;
      } else {
        console.log(`  ${colors.blue}✓ Already correct${colors.reset}`);
        skipped++;
      }

    } catch (error) {
      console.log(`${colors.red}Error processing ${relativePath}: ${error.message}${colors.reset}`);
      skipped++;
    }
  }

  saveCache(cache);

  console.log(`\n${colors.green}=== SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}Fixed: ${fixed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);

  console.log(`\n${colors.cyan}Cache updated: ${Object.keys(cache).length} entries${colors.reset}`);
}

async function processSpecificSaints(saintIds) {
  console.log(`${colors.blue}Processing specific saints...${colors.reset}`);

  const peopleDir = path.join(__dirname, 'src', 'data', 'people');
  const cache = loadCache();
  let fixed = 0;
  let skipped = 0;

  for (const saintId of saintIds) {
    // Find the file for this saint
    let found = false;
    let foundPath = null;

    function findSaintFile(dir) {
      if (found) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && item.startsWith('century-')) {
          findSaintFile(fullPath);
        } else if (stat.isFile() && item === `${saintId}.json`) {
          found = true;
          foundPath = fullPath;
          return;
        }
      }
    }

    findSaintFile(peopleDir);

    if (!found) {
      console.log(`${colors.red}Saint not found: ${saintId}${colors.reset}`);
      continue;
    }

    const relativePath = path.relative(__dirname, foundPath);

    try {
      const content = fs.readFileSync(foundPath, 'utf8');
      const person = JSON.parse(content);

      if (!person.wikipediaUrl) {
        console.log(`${colors.yellow}Skipping ${relativePath} - no wikipediaUrl${colors.reset}`);
        skipped++;
        continue;
      }

      console.log(`${colors.cyan}Processing: ${person.name} (${person.id})${colors.reset}`);
      console.log(`  File: ${relativePath}`);

      const bestUrl = await findBestWikipediaUrl(person.name, person.wikipediaUrl, cache);

      if (bestUrl !== person.wikipediaUrl) {
        console.log(`  ${colors.yellow}Current: ${person.wikipediaUrl}${colors.reset}`);
        console.log(`  ${colors.green}Updated: ${bestUrl}${colors.reset}`);

        person.wikipediaUrl = bestUrl;

        // Write back the updated JSON
        fs.writeFileSync(foundPath, JSON.stringify(person, null, 2), 'utf8');
        console.log(`  ${colors.green}✓ Updated${colors.reset}`);
        fixed++;
      } else {
        console.log(`  ${colors.blue}✓ Already correct${colors.reset}`);
        skipped++;
      }

    } catch (error) {
      console.log(`${colors.red}Error processing ${relativePath}: ${error.message}${colors.reset}`);
      skipped++;
    }
  }

  saveCache(cache);

  console.log(`\n${colors.green}=== SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}Fixed: ${fixed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);

  console.log(`\n${colors.cyan}Cache updated: ${Object.keys(cache).length} entries${colors.reset}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Process all saints
    await processAllSaints();
  } else {
    // Process specific saints
    await processSpecificSaints(args);
  }
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
