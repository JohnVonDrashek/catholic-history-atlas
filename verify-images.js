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
};

// Cache configuration
const CACHE_FILE = path.join(__dirname, '.image-cache.json');
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Load cache from file
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(cacheData);
    }
  } catch (error) {
    console.warn(`${colors.yellow}Warning: Could not load cache file: ${error.message}${colors.reset}`);
  }
  return {};
}

// Save cache to file
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (error) {
    console.warn(`${colors.yellow}Warning: Could not save cache file: ${error.message}${colors.reset}`);
  }
}

// Check if cache entry is still valid
function isCacheValid(entry) {
  if (!entry || !entry.timestamp) return false;
  const age = Date.now() - entry.timestamp;
  return age < CACHE_MAX_AGE;
}

function checkImageUrl(url, cache) {
  return new Promise((resolve) => {
    // Check cache first
    const cacheEntry = cache[url];
    if (isCacheValid(cacheEntry)) {
      resolve({
        url,
        valid: cacheEntry.valid,
        statusCode: cacheEntry.statusCode,
        contentType: cacheEntry.contentType,
        error: cacheEntry.error,
        cached: true,
      });
      return;
    }

    // Not in cache or expired, make HTTP request
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ImageVerifier/1.0)',
        },
      };

      const req = client.request(options, (res) => {
        const contentType = res.headers['content-type'] || '';
        const statusCode = res.statusCode;
        
        const isImage = contentType.startsWith('image/');
        const isOk = statusCode >= 200 && statusCode < 300;
        
        const result = {
          url,
          valid: isOk && isImage,
          statusCode,
          contentType,
          error: null,
          cached: false,
        };

        // Update cache
        cache[url] = {
          valid: result.valid,
          statusCode: result.statusCode,
          contentType: result.contentType,
          error: result.error,
          timestamp: Date.now(),
        };
        
        resolve(result);
        
        res.destroy();
      });

      req.on('error', (error) => {
        const result = {
          url,
          valid: false,
          statusCode: null,
          contentType: null,
          error: error.message,
          cached: false,
        };

        // Cache errors too (but with shorter TTL consideration - we'll still cache for now)
        cache[url] = {
          valid: false,
          statusCode: null,
          contentType: null,
          error: error.message,
          timestamp: Date.now(),
        };

        resolve(result);
      });

      req.on('timeout', () => {
        req.destroy();
        const result = {
          url,
          valid: false,
          statusCode: null,
          contentType: null,
          error: 'Request timeout',
          cached: false,
        };

        // Cache timeout errors
        cache[url] = {
          valid: false,
          statusCode: null,
          contentType: null,
          error: 'Request timeout',
          timestamp: Date.now(),
        };

        resolve(result);
      });

      req.end();
    } catch (error) {
      const result = {
        url,
        valid: false,
        statusCode: null,
        contentType: null,
        error: `Invalid URL: ${error.message}`,
        cached: false,
      };

      // Cache invalid URL errors
      cache[url] = {
        valid: false,
        statusCode: null,
        contentType: null,
        error: `Invalid URL: ${error.message}`,
        timestamp: Date.now(),
      };

      resolve(result);
    }
  });
}

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

async function verifyPersonFile(filePath, cache) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const person = JSON.parse(content);
    
    if (!person.imageUrl || person.imageUrl === null) {
      return {
        file: filePath,
        name: person.name,
        id: person.id,
        url: null,
        valid: false,
        error: 'Missing imageUrl',
        cached: false,
      };
    }
    
    const result = await checkImageUrl(person.imageUrl, cache);
    return {
      file: filePath,
      name: person.name,
      id: person.id,
      ...result,
    };
  } catch (error) {
    return {
      file: filePath,
      name: 'Unknown',
      id: 'unknown',
      url: null,
      valid: false,
      error: `Failed to parse JSON: ${error.message}`,
      cached: false,
    };
  }
}

async function main() {
  const peopleDir = path.join(__dirname, 'src', 'data', 'people');
  
  if (!fs.existsSync(peopleDir)) {
    console.error(`${colors.red}Error: ${peopleDir} not found${colors.reset}`);
    process.exit(1);
  }
  
  // Load cache
  console.log(`${colors.blue}Loading image cache...${colors.reset}`);
  const cache = loadCache();
  const cacheSize = Object.keys(cache).length;
  console.log(`Cache loaded: ${cacheSize} entries\n`);
  
  console.log(`${colors.blue}Finding all person JSON files...${colors.reset}`);
  const jsonFiles = findJsonFiles(peopleDir);
  console.log(`Found ${jsonFiles.length} person files\n`);
  
  const allResults = [];
  let processed = 0;
  let cachedCount = 0;
  let checkedCount = 0;
  
  for (const file of jsonFiles) {
    processed++;
    const relativePath = path.relative(__dirname, file);
    process.stdout.write(`[${processed}/${jsonFiles.length}] Checking ${relativePath}... `);
    
    const result = await verifyPersonFile(file, cache);
    allResults.push(result);
    
    if (result.cached) {
      cachedCount++;
      if (result.valid) {
        process.stdout.write(`${colors.cyan}✓ (cached)${colors.reset}\n`);
      } else if (!result.url) {
        process.stdout.write(`${colors.yellow}⚠ Missing imageUrl${colors.reset}\n`);
      } else {
        process.stdout.write(`${colors.red}✗ (cached) ${result.error || `Status: ${result.statusCode}`}${colors.reset}\n`);
      }
    } else {
      checkedCount++;
      if (result.valid) {
        process.stdout.write(`${colors.green}✓${colors.reset}\n`);
      } else if (!result.url) {
        process.stdout.write(`${colors.yellow}⚠ Missing imageUrl${colors.reset}\n`);
      } else {
        process.stdout.write(`${colors.red}✗ ${result.error || `Status: ${result.statusCode}`}${colors.reset}\n`);
      }
      
      // Small delay to avoid overwhelming servers (only for non-cached requests)
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Save cache
  console.log(`\n${colors.blue}Saving cache...${colors.reset}`);
  saveCache(cache);
  console.log(`Cache saved: ${Object.keys(cache).length} entries`);
  console.log(`  ${colors.cyan}Cached: ${cachedCount}${colors.reset}`);
  console.log(`  ${colors.blue}Checked: ${checkedCount}${colors.reset}\n`);
  
  // Summary
  console.log(`\n${colors.blue}=== SUMMARY ===${colors.reset}`);
  const valid = allResults.filter(r => r.valid).length;
  const invalid = allResults.filter(r => !r.valid && r.url).length;
  const missing = allResults.filter(r => !r.url && !r.error?.includes('parse')).length;
  const parseErrors = allResults.filter(r => r.error?.includes('parse')).length;
  
  console.log(`${colors.green}Valid: ${valid}${colors.reset}`);
  if (invalid > 0) {
    console.log(`${colors.red}Invalid: ${invalid}${colors.reset}`);
  }
  if (missing > 0) {
    console.log(`${colors.yellow}Missing imageUrl: ${missing}${colors.reset}`);
  }
  if (parseErrors > 0) {
    console.log(`${colors.red}Parse errors: ${parseErrors}${colors.reset}`);
  }
  
  // List invalid URLs
  if (invalid > 0) {
    console.log(`\n${colors.red}=== INVALID IMAGE URLs ===${colors.reset}`);
    allResults
      .filter(r => !r.valid && r.url)
      .forEach(r => {
        console.log(`${colors.red}✗${colors.reset} ${r.name} (${r.id})`);
        console.log(`  File: ${path.relative(__dirname, r.file)}`);
        console.log(`  URL: ${r.url}`);
        console.log(`  Error: ${r.error || `Status ${r.statusCode}, Content-Type: ${r.contentType}`}`);
        console.log('');
      });
  }
  
  // List missing URLs
  if (missing > 0) {
    console.log(`\n${colors.yellow}=== MISSING IMAGE URLs ===${colors.reset}`);
    allResults
      .filter(r => !r.url && !r.error?.includes('parse'))
      .forEach(r => {
        console.log(`${colors.yellow}⚠${colors.reset} ${r.name} (${r.id})`);
        console.log(`  File: ${path.relative(__dirname, r.file)}`);
        console.log('');
      });
  }
  
  // List parse errors
  if (parseErrors > 0) {
    console.log(`\n${colors.red}=== PARSE ERRORS ===${colors.reset}`);
    allResults
      .filter(r => r.error?.includes('parse'))
      .forEach(r => {
        console.log(`${colors.red}✗${colors.reset} ${path.relative(__dirname, r.file)}`);
        console.log(`  Error: ${r.error}`);
        console.log('');
      });
  }
  
  // Exit with error code if there are issues
  if (invalid > 0 || parseErrors > 0) {
    process.exit(1);
  }
  
  if (missing > 0) {
    console.log(`\n${colors.yellow}Note: Some entries are missing imageUrl but this is not an error.${colors.reset}`);
  }
}

main().catch(console.error);
