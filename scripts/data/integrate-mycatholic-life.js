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
const CACHE_FILE = path.join(__dirname, '../../.cache/mycatholic-cache.json');
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

// Extract saint data from My Catholic Life! page
async function extractSaintData(url, cache) {
  const cacheKey = `saint_data_${url}`;

  if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
    return cache[cacheKey].data;
  }

  try {
    let finalUrl = url;
    let response = await makeRequest(url, { timeout: 15000 });

    // Handle redirects
    if (response.status === 301 || response.status === 302) {
      const redirectUrl = response.headers.location;
      if (redirectUrl) {
        console.log(`  Following redirect: ${redirectUrl}`);
        finalUrl = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, url).href;
        response = await makeRequest(finalUrl, { timeout: 15000 });
      }
    }

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = response.data;

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(' | My Catholic Life!', '').trim() : null;

    // Extract main content (simplified extraction)
    const contentMatch = html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>(.*?)<\/div>/is);
    const content = contentMatch ? contentMatch[1] : null;

    // Extract image
    const imageMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*wp-image-[^"]*"[^>]*>/i);
    const imageUrl = imageMatch ? imageMatch[1] : null;

    // Extract feast day
    const feastMatch = html.match(/Feast[^:]*:\s*([^<\n]+)/i);
    const feastDay = feastMatch ? feastMatch[1].trim() : null;

    // Extract birth/death years
    const yearMatch = html.match(/(\d{1,4})\s*[-–]\s*(\d{1,4})/);
    const birthYear = yearMatch ? parseInt(yearMatch[1]) : null;
    const deathYear = yearMatch ? parseInt(yearMatch[2]) : null;

    const data = {
      title,
      content,
      imageUrl,
      feastDay,
      birthYear,
      deathYear,
      url: finalUrl
    };

    cache[cacheKey] = { data, timestamp: Date.now() };
    return data;

  } catch (error) {
    console.log(`${colors.red}Error extracting data from ${url}: ${error.message}${colors.reset}`);
    cache[cacheKey] = { data: null, timestamp: Date.now() };
    return null;
  }
}

// Get saint data from My Catholic Life! A-Z page
async function getSaintDataFromMainPage(saintName, cache) {
  const cacheKey = 'main_page_data';

  if (!cache[cacheKey] || !isCacheValid(cache[cacheKey])) {
    console.log(`  Fetching main saints page...`);
    try {
      const response = await makeRequest('https://mycatholic.life/saints/', { timeout: 30000 });
      if (response.status === 200) {
        cache[cacheKey] = { data: response.data, timestamp: Date.now() };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`${colors.red}Error fetching main page: ${error.message}${colors.reset}`);
      return null;
    }
  }

  const html = cache[cacheKey].data;

  // Remove "St." prefix for matching
  const cleanName = saintName.replace(/^St\.?\s+/, '').trim();
  const searchName = cleanName.toLowerCase();

  // Look for liturgical calendar saint pages that specifically mention our saint
  // First try: exact saint name in both URL and link text
  let liturgicalPattern = new RegExp(`<a[^>]*href="([^"]*saints-of-the-liturgical-year[^"]*${searchName}[^"]*)"[^>]*>[^<]*${cleanName}[^<]*</a>`, 'i');
  let linkMatch = html.match(liturgicalPattern);

  if (!linkMatch) {
    // Second try: saint name variations in URL
    const nameVariations = [searchName, searchName.replace(/\s+/g, '-'), searchName.replace(/\s+/g, '')];
    for (const variation of nameVariations) {
      liturgicalPattern = new RegExp(`<a[^>]*href="([^"]*saints-of-the-liturgical-year[^"]*${variation}[^"]*)"[^>]*>[^<]*${cleanName}[^<]*</a>`, 'i');
      linkMatch = html.match(liturgicalPattern);
      if (linkMatch) break;
    }
  }

  if (!linkMatch) {
    // Third try: look for URLs that contain the saint's name anywhere in the pattern
    liturgicalPattern = new RegExp(`<a[^>]*href="([^"]*saints-of-the-liturgical-year[^"]*)"[^>]*>[^<]*(?:Saint|St\.?\\s*)${cleanName}[^<]*</a>`, 'i');
    linkMatch = html.match(liturgicalPattern);
  }

  if (linkMatch) {
    const saintUrl = linkMatch[1];
    let fullUrl = saintUrl;

    if (!saintUrl.startsWith('http')) {
      fullUrl = saintUrl.startsWith('/') ? `https://mycatholic.life${saintUrl}` : `https://mycatholic.life/saints/${saintUrl}`;
    }

    console.log(`  Found potential liturgical saint page: ${fullUrl}`);

    // For liturgical calendar URLs, trust the URL pattern since they follow a consistent format
    // These URLs contain the saint name and are highly likely to be correct
    const urlContainsSaint = fullUrl.includes('saints-of-the-liturgical-year') &&
                            (fullUrl.toLowerCase().includes(searchName.toLowerCase()) ||
                             fullUrl.toLowerCase().includes(cleanName.toLowerCase()) ||
                             // Handle hyphenated names like "francis-xavier" for "francis xavier"
                             fullUrl.toLowerCase().includes(searchName.replace(/\s+/g, '-').toLowerCase()) ||
                             fullUrl.toLowerCase().includes(cleanName.replace(/\s+/g, '-').toLowerCase()));

    if (urlContainsSaint) {
      console.log(`  ${colors.green}Using trusted liturgical calendar URL${colors.reset}`);
      return {
        title: saintName,
        content: null,
        url: fullUrl,
        imageUrl: null,
        feastDay: null,
        birthYear: null,
        deathYear: null
      };
    }

    // Fallback verification for other URLs
    try {
      const testResponse = await makeRequest(fullUrl, { timeout: 10000 });
      if (testResponse.status === 200) {
        // Quick check if this page is about our saint
        const pageContent = testResponse.data;
        const saintCheck = pageContent.toLowerCase().includes(searchName) ||
                          pageContent.toLowerCase().includes(`st. ${searchName}`) ||
                          pageContent.toLowerCase().includes(`saint ${searchName}`);

        if (saintCheck) {
          return {
            title: saintName,
            content: null,
            url: fullUrl,
            imageUrl: null,
            feastDay: null,
            birthYear: null,
            deathYear: null
          };
        } else {
          console.log(`  ${colors.yellow}Page found but not about our saint${colors.reset}`);
        }
      }
    } catch (error) {
      console.log(`  ${colors.yellow}URL not accessible: ${fullUrl}${colors.reset}`);
    }
  }

  // Only add links if we're absolutely sure the saint exists
  // Be very conservative - require exact matches
  const saintExists = html.includes(`St. ${cleanName}`) ||
                     html.includes(`Saint ${cleanName}`) ||
                     (html.includes(cleanName) &&
                      (html.includes(`St. ${cleanName.split(' ')[0]}`) ||
                       html.includes(`Saint ${cleanName.split(' ')[0]}`)));

  if (saintExists) {
    // Create anchor link to the saint on the main page
    // Find the letter the saint starts with for anchor
    const firstLetter = cleanName.charAt(0).toUpperCase();
    const anchorUrl = `https://mycatholic.life/saints/#TOC-${firstLetter}`;

    console.log(`  Found saint on main page, using anchor link: ${anchorUrl}`);

    return {
      title: saintName,
      content: null,
      url: anchorUrl,
      imageUrl: null,
      feastDay: null,
      birthYear: null,
      deathYear: null
    };
  }

  console.log(`  Saint not found on My Catholic Life`);
  return null;
}

// Process all person JSON files and add My Catholic Life! data
async function processAllSaints() {
  console.log(`${colors.blue}Finding all person JSON files...${colors.reset}`);

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
  let enhanced = 0;
  let skipped = 0;

  for (let i = 0; i < personFiles.length; i++) {
    const filePath = personFiles[i];
    const relativePath = path.relative(__dirname, filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const person = JSON.parse(content);

      console.log(`${colors.cyan}Processing: ${person.name} (${person.id})${colors.reset}`);
      console.log(`  File: ${relativePath}`);

      const saintData = await getSaintDataFromMainPage(person.name, cache);

      if (saintData) {
        // Add My Catholic Life! data to the person object
        const oldUrl = person.myCatholicLifeUrl;
        person.myCatholicLifeUrl = saintData.url;

        // Log if URL was updated
        if (oldUrl && oldUrl !== saintData.url) {
          console.log(`  ${colors.green}Updated URL: ${oldUrl} → ${saintData.url}${colors.reset}`);
        }

        // Add a note that detailed content is available
        if (!person.summary || person.summary.length < 200) {
          person.myCatholicLifeNote = 'Detailed biographical content available at My Catholic Life!';
        }

        // Add image if we don't have one or if theirs might be better
        if (saintData.imageUrl && (!person.imageUrl || person.imageUrl.includes('wikipedia'))) {
          console.log(`  ${colors.green}Found image: ${saintData.imageUrl}${colors.reset}`);
          person.myCatholicLifeImageUrl = saintData.imageUrl;
        }

        // Write back the enhanced JSON
        fs.writeFileSync(filePath, JSON.stringify(person, null, 2), 'utf8');
        console.log(`  ${colors.green}✓ Enhanced with My Catholic Life! data${colors.reset}`);
        enhanced++;
      } else {
        console.log(`  ${colors.yellow}No My Catholic Life! page found${colors.reset}`);
        skipped++;
      }

    } catch (error) {
      console.log(`${colors.red}Error processing ${relativePath}: ${error.message}${colors.reset}`);
      skipped++;
    }
  }

  saveCache(cache);

  console.log(`\n${colors.green}=== SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}Enhanced: ${enhanced}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);

  console.log(`\n${colors.cyan}Cache updated: ${Object.keys(cache).length} entries${colors.reset}`);
}

// Process specific saints
async function processSpecificSaints(saintIds) {
  console.log(`${colors.blue}Processing specific saints...${colors.reset}`);

  const peopleDir = path.join(__dirname, '../..', 'src', 'data', 'people');
  const cache = loadCache();
  let enhanced = 0;
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

      console.log(`${colors.cyan}Processing: ${person.name} (${person.id})${colors.reset}`);
      console.log(`  File: ${relativePath}`);

      const saintData = await getSaintDataFromMainPage(person.name, cache);

      if (saintData) {
        const oldUrl = person.myCatholicLifeUrl;
        person.myCatholicLifeUrl = saintData.url;

        // Log if URL was updated
        if (oldUrl && oldUrl !== saintData.url) {
          console.log(`  ${colors.green}Updated URL: ${oldUrl} → ${saintData.url}${colors.reset}`);
        }

        if (!person.summary || person.summary.length < 200) {
          person.myCatholicLifeNote = 'Detailed biographical content available at My Catholic Life!';
        }

        if (saintData.imageUrl && (!person.imageUrl || person.imageUrl.includes('wikipedia'))) {
          console.log(`  ${colors.green}Found image: ${saintData.imageUrl}${colors.reset}`);
          person.myCatholicLifeImageUrl = saintData.imageUrl;
        }

        fs.writeFileSync(foundPath, JSON.stringify(person, null, 2), 'utf8');
        console.log(`  ${colors.green}✓ Enhanced with My Catholic Life! data${colors.reset}`);
        enhanced++;
      } else {
        console.log(`  ${colors.yellow}No My Catholic Life! page found${colors.reset}`);
        skipped++;
      }

    } catch (error) {
      console.log(`${colors.red}Error processing ${relativePath}: ${error.message}${colors.reset}`);
      skipped++;
    }
  }

  saveCache(cache);

  console.log(`\n${colors.green}=== SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}Enhanced: ${enhanced}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);

  console.log(`\n${colors.cyan}Cache updated: ${Object.keys(cache).length} entries${colors.reset}`);
}

// Remove all My Catholic Life links (for cleanup)
async function removeAllLinks() {
  console.log(`${colors.yellow}Removing all My Catholic Life links...${colors.reset}`);

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

  let removed = 0;

  for (const filePath of personFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const person = JSON.parse(content);

      if (person.myCatholicLifeUrl) {
        delete person.myCatholicLifeUrl;
        delete person.myCatholicLifeNote;
        delete person.myCatholicLifeImageUrl;
        delete person.myCatholicLifeContent;

        fs.writeFileSync(filePath, JSON.stringify(person, null, 2), 'utf8');
        removed++;
      }
    } catch (error) {
      console.log(`${colors.red}Error processing ${filePath}: ${error.message}${colors.reset}`);
    }
  }

  console.log(`${colors.green}Removed My Catholic Life links from ${removed} saints${colors.reset}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--remove-all') {
    await removeAllLinks();
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
