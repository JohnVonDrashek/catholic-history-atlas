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
const CACHE_FILE = path.join(__dirname, '.newadvent-cache.json');
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

// Check if New Advent URL is valid and matches the saint
async function checkNewAdventUrl(url, saintName, cache) {
  const cacheKey = `check_${url}`;

  if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
    return cache[cacheKey].result;
  }

  try {
    const response = await makeRequest(url, { timeout: 10000 });

    // Basic validity check
    const isValid = response.status === 200 &&
                   !response.data.includes('404 Not Found') &&
                   !response.data.includes('Page Not Found') &&
                   !response.data.includes('The requested URL was not found');

    if (!isValid) {
      cache[cacheKey] = { result: false, timestamp: Date.now() };
      return false;
    }

    // Advanced content check - verify the page is actually about this saint
    const pageContent = response.data.toLowerCase();
    const cleanSaintName = saintName.replace(/^St\.?\s+/, '').toLowerCase();

    // Check if saint name appears in title or main content
    const titleMatch = response.data.match(/<title[^>]*>([^<]*)<\/title>/i);
    const hasSaintInTitle = titleMatch && (
      titleMatch[1].toLowerCase().includes(cleanSaintName) ||
      titleMatch[1].toLowerCase().includes(`saint ${cleanSaintName}`) ||
      titleMatch[1].toLowerCase().includes(`st. ${cleanSaintName}`)
    );

    // Check if saint name appears in the main content
    const hasSaintInContent = pageContent.includes(`saint ${cleanSaintName}`) ||
                             pageContent.includes(`st. ${cleanSaintName}`) ||
                             (pageContent.includes(cleanSaintName) &&
                              (pageContent.includes('saint') || pageContent.includes('catholic')));

    // URL must be valid AND match the saint
    // If it has "catholic encyclopedia" in title, assume it's a valid encyclopedia entry
    const isCatholicEncyclopedia = titleMatch && titleMatch[1].toLowerCase().includes('catholic encyclopedia');
    const isCorrectSaint = hasSaintInTitle || hasSaintInContent || isCatholicEncyclopedia;

    const result = {
      isValid: true,
      isCorrectSaint: isCorrectSaint,
      title: titleMatch ? titleMatch[1] : 'Unknown'
    };

    cache[cacheKey] = { result, timestamp: Date.now() };
    return result;
  } catch (error) {
    cache[cacheKey] = { result: false, timestamp: Date.now() };
    return false;
  }
}

// Extract saint URLs from the alphabetical index page
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

      // Extract all links from the index page
      // Look for patterns like: <a href="01234a.htm">Saint Name</a>
      const linkRegex = /<a[^>]*href="([^"]*\.htm)"[^>]*>([^<]+)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(indexContent)) !== null) {
        const url = match[1];
        const linkText = match[2].trim();

        // Skip if it's not a cathen URL or doesn't contain 'htm'
        if (!url.includes('.htm') || url.includes('index')) {
          continue;
        }

        // Clean up the link text (remove extra spaces, normalize)
        const cleanLinkText = linkText.replace(/\s+/g, ' ').toLowerCase();

        // Construct full URL properly
        let fullUrl;
        if (url.startsWith('../')) {
          // Handle relative URLs like ../cathen/01234a.htm
          fullUrl = `https://www.newadvent.org/cathen/${url.substring(3)}`;
        } else if (url.startsWith('/')) {
          // Handle absolute paths
          fullUrl = `https://www.newadvent.org${url}`;
        } else {
          // Handle relative paths
          fullUrl = `https://www.newadvent.org/cathen/${url}`;
        }

        // Store the mapping
        saints[cleanLinkText] = {
          url: fullUrl,
          linkText: linkText
        };
      }

      cache[cacheKey] = { saints, timestamp: Date.now() };
      return saints;
    }
  } catch (error) {
    console.log(`${colors.yellow}Could not fetch index page ${indexUrl}: ${error.message}${colors.reset}`);
  }

  return {};
}

// Check if saint appears on the alphabetical index page and get their URL
async function checkSaintOnIndexPage(saintName, cache) {
  const cleanSaintName = saintName.replace(/^St\.?\s+/, '').replace(/^Saint\s+/, '').toLowerCase().trim();
  const firstLetter = cleanSaintName.charAt(0).toUpperCase();

  // Skip non-alphabetic names
  if (!/[A-Z]/.test(firstLetter)) {
    return { exists: false, url: null };
  }

  const indexSaints = await extractSaintUrlsFromIndex(firstLetter, cache);

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
    // Try partial matches for names with additional descriptors
    `${cleanSaintName},`
  ];

  for (const variation of searchVariations) {
    if (indexSaints[variation]) {
      return {
        exists: true,
        url: indexSaints[variation].url,
        linkText: indexSaints[variation].linkText
      };
    }
  }

  // Try partial matching for saints with additional descriptors
  for (const [key, value] of Object.entries(indexSaints)) {
    if (key.includes(cleanSaintName) || key.includes(saintName.toLowerCase())) {
      return {
        exists: true,
        url: value.url,
        linkText: value.linkText
      };
    }
  }

  return { exists: false, url: null };
}

// Process all person JSON files and check New Advent URLs
async function processAllSaints() {
  console.log(`${colors.blue}Checking New Advent URLs for all saints...${colors.reset}`);

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
  let valid = 0;
  let invalid = 0;
  let wrongSaint = 0;
  let missing = 0;
  const invalidUrls = [];
  const wrongSaintUrls = [];

  for (let i = 0; i < personFiles.length; i++) {
    const filePath = personFiles[i];
    const relativePath = path.relative(__dirname, filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const person = JSON.parse(content);

      if (!person.newAdventUrl) {
        missing++;
        continue;
      }

      const result = await checkNewAdventUrl(person.newAdventUrl, person.name, cache);
      const indexInfo = await checkSaintOnIndexPage(person.name, cache);

      if (result === false) {
        // URL is completely invalid
        invalid++;
        invalidUrls.push({
          name: person.name,
          id: person.id,
          url: person.newAdventUrl,
          file: relativePath,
          issue: 'invalid_url'
        });
        console.log(`${colors.red}✗ Invalid URL: ${person.name} (${person.id}): ${person.newAdventUrl}${colors.reset}`);
      } else if (!result.isCorrectSaint) {
        // URL is valid but wrong saint
        wrongSaint++;
        wrongSaintUrls.push({
          name: person.name,
          id: person.id,
          url: person.newAdventUrl,
          file: relativePath,
          actualTitle: result.title,
          issue: 'wrong_saint'
        });
        console.log(`${colors.yellow}⚠ Wrong saint: ${person.name} (${person.id}) - URL points to: ${result.title}${colors.reset}`);
      } else if (result.isCorrectSaint && !indexInfo.exists) {
        // URL seems correct but saint doesn't appear on alphabetical index
        // Trust the Catholic Encyclopedia URL for now - index parsing might be incomplete
        console.log(`${colors.yellow}⚠ Not on index: ${person.name} (${person.id}) - keeping valid Catholic Encyclopedia URL${colors.reset}`);
        valid++;
      } else {
        // URL is valid and correct
        valid++;
      }

    } catch (error) {
      console.log(`${colors.red}Error processing ${relativePath}: ${error.message}${colors.reset}`);
    }
  }

  saveCache(cache);

  console.log(`\n${colors.green}=== NEW ADVENT URL REPORT ===${colors.reset}`);
  console.log(`${colors.green}Valid URLs: ${valid}${colors.reset}`);
  console.log(`${colors.yellow}Missing URLs: ${missing}${colors.reset}`);
  console.log(`${colors.red}Invalid URLs: ${invalid}${colors.reset}`);
  console.log(`${colors.yellow}Wrong Saint URLs: ${wrongSaint}${colors.reset}`);

  if (invalidUrls.length > 0) {
    console.log(`\n${colors.red}=== INVALID NEW ADVENT URLs ===${colors.reset}`);
    invalidUrls.forEach(item => {
      console.log(`${colors.red}• ${item.name} (${item.id}): ${item.url}${colors.reset}`);
      console.log(`  File: ${item.file}`);
    });
  }

  if (wrongSaintUrls.length > 0) {
    console.log(`\n${colors.yellow}=== WRONG SAINT NEW ADVENT URLs ===${colors.reset}`);
    wrongSaintUrls.forEach(item => {
      console.log(`${colors.yellow}• ${item.name} (${item.id}): ${item.url}${colors.reset}`);
      console.log(`  Actually points to: ${item.actualTitle}`);
      console.log(`  File: ${item.file}`);
    });
  }

  console.log(`\n${colors.cyan}Cache updated: ${Object.keys(cache).length} entries${colors.reset}`);

  return { valid, invalid, wrongSaint, missing, invalidUrls, wrongSaintUrls };
}

// Process specific saints
async function processSpecificSaints(saintIds) {
  console.log(`${colors.blue}Checking New Advent URLs for specific saints...${colors.reset}`);

  const peopleDir = path.join(__dirname, 'src', 'data', 'people');
  const cache = loadCache();
  let valid = 0;
  let invalid = 0;
  let wrongSaint = 0;
  let missing = 0;
  const invalidUrls = [];
  const wrongSaintUrls = [];

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

      if (!person.newAdventUrl) {
        console.log(`${colors.yellow}No New Advent URL: ${person.name} (${person.id})${colors.reset}`);
        missing++;
        continue;
      }

      const result = await checkNewAdventUrl(person.newAdventUrl, person.name, cache);
      const indexInfo = await checkSaintOnIndexPage(person.name, cache);

      if (result === false) {
        console.log(`${colors.red}✗ Invalid URL: ${person.name} (${person.id}): ${person.newAdventUrl}${colors.reset}`);
        invalid++;
        invalidUrls.push({
          name: person.name,
          id: person.id,
          url: person.newAdventUrl,
          file: relativePath,
          issue: 'invalid_url'
        });
      } else if (!result.isCorrectSaint) {
        console.log(`${colors.yellow}⚠ Wrong saint: ${person.name} (${person.id}) - URL points to: ${result.title}${colors.reset}`);
        wrongSaint++;
        wrongSaintUrls.push({
          name: person.name,
          id: person.id,
          url: person.newAdventUrl,
          file: relativePath,
          actualTitle: result.title,
          issue: 'wrong_saint'
        });
      } else if (result.isCorrectSaint && !indexInfo.exists) {
        console.log(`${colors.yellow}⚠ Not on index: ${person.name} (${person.id}) - keeping valid Catholic Encyclopedia URL${colors.reset}`);
        valid++;
      } else {
        console.log(`${colors.green}✓ Valid: ${person.name} (${person.id})${colors.reset}`);
        valid++;
      }

    } catch (error) {
      console.log(`${colors.red}Error processing ${relativePath}: ${error.message}${colors.reset}`);
    }
  }

  saveCache(cache);

  console.log(`\n${colors.green}=== SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}Valid URLs: ${valid}${colors.reset}`);
  console.log(`${colors.yellow}Missing URLs: ${missing}${colors.reset}`);
  console.log(`${colors.red}Invalid URLs: ${invalid}${colors.reset}`);
  console.log(`${colors.yellow}Wrong Saint URLs: ${wrongSaint}${colors.reset}`);

  return { valid, invalid, wrongSaint, missing, invalidUrls, wrongSaintUrls };
}

// Remove invalid and wrong saint New Advent URLs
async function removeInvalidUrls() {
  console.log(`${colors.yellow}Removing invalid and wrong saint New Advent URLs...${colors.reset}`);

  const result = await processAllSaints();
  const invalidUrls = result.invalidUrls || [];
  const wrongSaintUrls = result.wrongSaintUrls || [];

  const allToRemove = [...invalidUrls, ...wrongSaintUrls];
  let removed = 0;

  for (const item of allToRemove) {
    try {
      const filePath = path.join(__dirname, item.file);
      const content = fs.readFileSync(filePath, 'utf8');
      const person = JSON.parse(content);

      if (person.newAdventUrl) {
        delete person.newAdventUrl;
        fs.writeFileSync(filePath, JSON.stringify(person, null, 2), 'utf8');
        removed++;
        console.log(`${colors.green}Removed ${item.issue} URL from: ${item.name}${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}Error removing URL from ${item.file}: ${error.message}${colors.reset}`);
    }
  }

  console.log(`${colors.green}Removed ${removed} problematic New Advent URLs${colors.reset}`);
}

// Add missing New Advent URLs for saints that have entries
async function addMissingUrls() {
  console.log(`${colors.blue}Finding and adding missing New Advent URLs...${colors.reset}`);

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
  let added = 0;

  for (let i = 0; i < personFiles.length; i++) {
    const filePath = personFiles[i];
    const relativePath = path.relative(__dirname, filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const person = JSON.parse(content);

      // Skip if already has a New Advent URL
      if (person.newAdventUrl) {
        continue;
      }

      // Check if saint exists on index page
      const indexInfo = await checkSaintOnIndexPage(person.name, cache);

      if (indexInfo.exists && indexInfo.url) {
        // Verify the URL actually works and points to the right saint
        const urlResult = await checkNewAdventUrl(indexInfo.url, person.name, cache);

        if (urlResult && urlResult.isCorrectSaint) {
          // Add the URL
          person.newAdventUrl = indexInfo.url;
          fs.writeFileSync(filePath, JSON.stringify(person, null, 2), 'utf8');
          added++;
          console.log(`${colors.green}✓ Added New Advent URL for: ${person.name} → ${indexInfo.url}${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠ Found on index but URL invalid: ${person.name} (${indexInfo.linkText})${colors.reset}`);
        }
      }

    } catch (error) {
      console.log(`${colors.red}Error processing ${relativePath}: ${error.message}${colors.reset}`);
    }
  }

  saveCache(cache);
  console.log(`${colors.green}Added ${added} New Advent URLs${colors.reset}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--remove-invalid') {
    await removeInvalidUrls();
  } else if (args[0] === '--add-missing') {
    await addMissingUrls();
  } else if (args.length === 0) {
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
