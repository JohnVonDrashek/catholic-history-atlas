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
const CACHE_FILE = path.join(__dirname, '../../.cache/newadvent-find-cache.json');
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

// Extract saint URLs from an alphabetical index page
async function extractSaintUrlsFromIndex(firstLetter, cache) {
  const indexUrl = `https://www.newadvent.org/cathen/${firstLetter.toLowerCase()}.htm`;
  const cacheKey = `index_extract_${indexUrl}`;

  if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
    return cache[cacheKey].saints;
  }

  try {
    const response = await makeRequest(indexUrl, { timeout: 10000 });

    if (response.status === 200) {
      const indexContent = response.data;
      const saints = {};

      // Extract saint links from the index page
      // Look for patterns like: <a href="01234a.htm">Saint Name</a>
      // Skip navigation links and only extract encyclopedia entries
      const linkRegex = /<a[^>]*href="([^"]*\.htm)"[^>]*>([^<]+)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(indexContent)) !== null) {
        const url = match[1];
        const linkText = match[2].trim();

        // Skip navigation links (they often contain &nbsp; or are very short)
        if (linkText.includes('&nbsp;') || linkText.length < 3) {
          continue;
        }

        // For now, include all entries that might be saints
        // We'll filter during the search phase
        const lowerLinkText = linkText.toLowerCase();
        const isLikelySaint = lowerLinkText.includes('saint') ||
                             lowerLinkText.includes('st.') ||
                             lowerLinkText.includes('pope') ||
                             lowerLinkText.includes('bishop') ||
                             lowerLinkText.includes('blessed') ||
                             lowerLinkText.includes('martyr') ||
                             lowerLinkText.includes('virgin') ||
                             lowerLinkText.includes('apostle') ||
                             lowerLinkText.includes('father') ||
                             // Include entries that look like names (contain commas followed by titles)
                             lowerLinkText.includes(', saint') ||
                             lowerLinkText.includes(', st.') ||
                             lowerLinkText.includes(', pope') ||
                             lowerLinkText.includes(', bishop');

        if (!isLikelySaint) {
          continue;
        }

        // Clean up the link text (remove extra spaces, normalize)
        const cleanLinkText = linkText.replace(/\s+/g, ' ').toLowerCase();

        // Construct full URL properly
        let fullUrl;
        if (url.startsWith('../')) {
          // Handle relative URLs like ../cathen/01234a.htm
          fullUrl = `https://www.newadvent.org/${url.substring(3)}`;
        } else if (url.startsWith('/')) {
          // Handle absolute paths
          fullUrl = `https://www.newadvent.org${url}`;
        } else if (url.includes('/')) {
          // URL already contains path like cathen/01234a.htm
          fullUrl = `https://www.newadvent.org/${url}`;
        } else {
          // Just filename like 01234a.htm
          fullUrl = `https://www.newadvent.org/cathen/${url}`;
        }

        // Store the mapping
        saints[cleanLinkText] = {
          url: fullUrl,
          linkText: linkText
        };

        // Debug: show entries that might be Augustine
        if (cleanLinkText.includes('augustine') || linkText.toLowerCase().includes('augustine')) {
          console.log(`  Found Augustine-related entry: "${cleanLinkText}" → ${fullUrl}`);
        }
      }

      cache[cacheKey] = { saints, timestamp: Date.now() };
      return saints;
    }
  } catch (error) {
    console.log(`${colors.yellow}Failed to fetch index for ${firstLetter}: ${error.message}${colors.reset}`);
  }

  return {};
}

// Find New Advent URL for a saint
async function findNewAdventUrl(saintName, cache) {
  const cleanSaintName = saintName.replace(/^St\.?\s+/, '').replace(/^Saint\s+/, '').toLowerCase().trim();
  const firstLetter = cleanSaintName.charAt(0).toUpperCase();

  // Skip non-alphabetic names
  if (!/[A-Z]/.test(firstLetter)) {
    return null;
  }

  // Check multiple index pages for saints with "of" in their name
  const indexPagesToCheck = [firstLetter];
  if (cleanSaintName.includes(' of ')) {
    // Also check the first letter of the place name
    const placeName = cleanSaintName.split(' of ')[1];
    const placeFirstLetter = placeName.charAt(0).toUpperCase();
    if (placeFirstLetter !== firstLetter && /[A-Z]/.test(placeFirstLetter)) {
      indexPagesToCheck.push(placeFirstLetter);
    }
  }

  for (const letter of indexPagesToCheck) {
    const indexSaints = await extractSaintUrlsFromIndex(letter, cache);

    // Try multiple variations of the saint name
    const searchVariations = [
      cleanSaintName,
      `${cleanSaintName}, saint`,
      `saint ${cleanSaintName}`,
      `${cleanSaintName}, st.`,
      `st. ${cleanSaintName}`,
      saintName.toLowerCase(),
      // Handle specific cases like "Augustine of Hippo, Saint"
      `${cleanSaintName} of hippo, saint`,
      `${cleanSaintName} of hippo`,
      `${cleanSaintName}, saint`,
      `saint ${cleanSaintName},`,
      // Try partial matches for names with additional descriptors
      `${cleanSaintName},`,
      // Try without "of [place]" for saints like "Ignatius of Loyola"
      cleanSaintName.replace(/\s+of\s+.*/, ''),
      `${cleanSaintName.replace(/\s+of\s+.*/, '')}, saint`,
      `saint ${cleanSaintName.replace(/\s+of\s+.*/, '')}`
    ];

    for (const variation of searchVariations) {
      if (indexSaints[variation]) {
        return {
          url: indexSaints[variation].url,
          linkText: indexSaints[variation].linkText
        };
      }
    }

    // Try partial matching for saints with additional descriptors
    for (const [key, value] of Object.entries(indexSaints)) {
      if (key.includes(cleanSaintName) || key.includes(saintName.toLowerCase())) {
        return {
          url: value.url,
          linkText: value.linkText
        };
      }
      // Special handling for saints with "of [place]" in their name
      if (cleanSaintName.includes(' of ')) {
        const saintBase = cleanSaintName.split(' of ')[0];
        const place = cleanSaintName.split(' of ')[1];
        if (key.includes(saintBase) && key.includes(place)) {
          return {
            url: value.url,
            linkText: value.linkText
          };
        }
      }
    }
  }

  return null;
}

// Process all person JSON files and find missing New Advent URLs
async function processAllSaints() {
  console.log(`${colors.blue}Finding missing New Advent URLs for all saints...${colors.reset}`);

  const peopleDir = path.join(__dirname, '../..', 'src', 'data', 'people');
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
  let found = 0;
  let alreadyHave = 0;
  let noMatch = 0;

  for (let i = 0; i < personFiles.length; i++) {
    const filePath = personFiles[i];
    const relativePath = path.relative(__dirname, filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const person = JSON.parse(content);

      if (person.newAdventUrl) {
        alreadyHave++;
        continue;
      }

      const result = await findNewAdventUrl(person.name, cache);

      if (result) {
        // Add the New Advent URL to the person data
        person.newAdventUrl = result.url;

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(person, null, 2), 'utf8');

        console.log(`${colors.green}✓ Added: ${person.name} → ${result.url}${colors.reset}`);
        console.log(`  Found as: "${result.linkText}"`);
        found++;
      } else {
        console.log(`${colors.yellow}⚠ No match: ${person.name}${colors.reset}`);
        noMatch++;
      }

    } catch (error) {
      console.log(`${colors.red}Error processing ${relativePath}: ${error.message}${colors.reset}`);
    }
  }

  saveCache(cache);

  console.log(`\n${colors.green}=== NEW ADVENT URL DISCOVERY COMPLETE ===${colors.reset}`);
  console.log(`${colors.green}URLs Added: ${found}${colors.reset}`);
  console.log(`${colors.cyan}Already Had URLs: ${alreadyHave}${colors.reset}`);
  console.log(`${colors.yellow}No Matches Found: ${noMatch}${colors.reset}`);

  console.log(`\n${colors.cyan}Cache updated: ${Object.keys(cache).length} entries${colors.reset}`);

  return { found, alreadyHave, noMatch };
}

// Process specific saints
async function processSpecificSaints(saintIds) {
  console.log(`${colors.blue}Finding New Advent URLs for specific saints...${colors.reset}`);

  const peopleDir = path.join(__dirname, '../..', 'src', 'data', 'people');
  const cache = loadCache();
  let found = 0;
  let alreadyHave = 0;
  let noMatch = 0;

  for (const saintId of saintIds) {
    // Find the file for this saint
    let foundFile = false;
    let foundPath = null;

    function findSaintFile(dir) {
      if (foundFile) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && item.startsWith('century-')) {
          findSaintFile(fullPath);
        } else if (stat.isFile() && item === `${saintId}.json`) {
          foundFile = true;
          foundPath = fullPath;
          return;
        }
      }
    }

    findSaintFile(peopleDir);

    if (!foundFile) {
      console.log(`${colors.red}Saint not found: ${saintId}${colors.reset}`);
      continue;
    }

    const relativePath = path.relative(__dirname, foundPath);

    try {
      const content = fs.readFileSync(foundPath, 'utf8');
      const person = JSON.parse(content);

      if (person.newAdventUrl) {
        console.log(`${colors.cyan}Already has URL: ${person.name} → ${person.newAdventUrl}${colors.reset}`);
        alreadyHave++;
        continue;
      }

      const result = await findNewAdventUrl(person.name, cache);

      if (result) {
        // Add the New Advent URL to the person data
        person.newAdventUrl = result.url;

        // Write back to file
        fs.writeFileSync(foundPath, JSON.stringify(person, null, 2), 'utf8');

        console.log(`${colors.green}✓ Added: ${person.name} → ${result.url}${colors.reset}`);
        console.log(`  Found as: "${result.linkText}"`);
        found++;
      } else {
        console.log(`${colors.yellow}⚠ No match found: ${person.name}${colors.reset}`);
        noMatch++;
      }

    } catch (error) {
      console.log(`${colors.red}Error processing ${relativePath}: ${error.message}${colors.reset}`);
    }
  }

  saveCache(cache);

  console.log(`\n${colors.green}=== SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}URLs Added: ${found}${colors.reset}`);
  console.log(`${colors.cyan}Already Had URLs: ${alreadyHave}${colors.reset}`);
  console.log(`${colors.yellow}No Matches Found: ${noMatch}${colors.reset}`);

  return { found, alreadyHave, noMatch };
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
