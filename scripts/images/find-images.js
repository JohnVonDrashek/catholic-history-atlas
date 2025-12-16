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
const CACHE_FILE = path.join(__dirname, '../../.cache/image-cache.json');
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

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
  if (!entry || !entry.timestamp) return false;
  const age = Date.now() - entry.timestamp;
  return age < CACHE_MAX_AGE;
}

/**
 * Make an HTTP/HTTPS request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        timeout: options.timeout || 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ImageFinder/1.0)',
          ...options.headers,
        },
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if an image URL is valid (with caching)
 */
async function checkImageUrl(url, cache) {
  // Check cache first
  const cacheEntry = cache[url];
  if (isCacheValid(cacheEntry)) {
    return {
      valid: cacheEntry.valid,
      statusCode: cacheEntry.statusCode,
      contentType: cacheEntry.contentType,
      cached: true,
    };
  }

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

    return new Promise((resolve) => {
      const req = client.request(options, (res) => {
        const contentType = res.headers['content-type'] || '';
        const statusCode = res.statusCode;
        
        const isImage = contentType.startsWith('image/');
        const isOk = statusCode >= 200 && statusCode < 300;
        
        const result = {
          valid: isOk && isImage,
          statusCode,
          contentType,
          cached: false,
        };

        // Update cache
        cache[url] = {
          valid: result.valid,
          statusCode: result.statusCode,
          contentType: result.contentType,
          timestamp: Date.now(),
        };
        
        resolve(result);
        
        res.destroy();
      });

      req.on('error', () => {
        const result = { valid: false, statusCode: null, contentType: null, cached: false };
        
        // Cache errors too
        cache[url] = {
          valid: false,
          statusCode: null,
          contentType: null,
          timestamp: Date.now(),
        };
        
        resolve(result);
      });

      req.on('timeout', () => {
        req.destroy();
        const result = { valid: false, statusCode: null, contentType: null, cached: false };
        
        // Cache timeout errors
        cache[url] = {
          valid: false,
          statusCode: null,
          contentType: null,
          timestamp: Date.now(),
        };
        
        resolve(result);
      });

      req.end();
    });
  } catch (error) {
    const result = { valid: false, statusCode: null, contentType: null, cached: false };
    
    // Cache invalid URL errors
    cache[url] = {
      valid: false,
      statusCode: null,
      contentType: null,
      timestamp: Date.now(),
    };
    
    return result;
  }
}

/**
 * Search Wikimedia Commons API for images
 */
async function searchWikimediaCommons(searchTerm, cache) {
  try {
    const apiUrl = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
      action: 'query',
      format: 'json',
      list: 'search',
      srsearch: searchTerm,
      srnamespace: 6, // File namespace
      srlimit: 10,
      origin: '*',
    });

    const response = await makeRequest(apiUrl);
    if (response.statusCode !== 200) {
      return [];
    }

    const data = JSON.parse(response.data);
    if (!data.query || !data.query.search) {
      return [];
    }

    const fileNames = data.query.search.map(item => item.title.replace('File:', ''));
    
    // Get image info for each file
    const imageInfoPromises = fileNames.slice(0, 5).map(async (fileName) => {
      try {
        const infoUrl = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
          action: 'query',
          format: 'json',
          titles: `File:${fileName}`,
          prop: 'imageinfo',
          iiprop: 'url|size|mime',
          iiurlwidth: 330,
          origin: '*',
        });

        const infoResponse = await makeRequest(infoUrl);
        if (infoResponse.statusCode !== 200) {
          return null;
        }

        const infoData = JSON.parse(infoResponse.data);
        const pages = infoData.query?.pages;
        if (!pages) return null;

        const page = Object.values(pages)[0];
        const imageInfo = page.imageinfo?.[0];
        if (!imageInfo) return null;

        // Prefer thumbnail URL if available, otherwise full URL
        const imageUrl = imageInfo.thumburl || imageInfo.url;
        const mimeType = imageInfo.mime || '';

        if (!imageUrl || !mimeType.startsWith('image/')) {
          return null;
        }

        // Validate the image
        const validation = await checkImageUrl(imageUrl, cache);
        if (!validation.valid) {
          return null;
        }

        return {
          fileName,
          url: imageUrl,
          width: imageInfo.thumbwidth || imageInfo.width,
          height: imageInfo.thumbheight || imageInfo.height,
        };
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(imageInfoPromises);
    return results.filter(r => r !== null);
  } catch (error) {
    console.error(`${colors.red}Error searching Wikimedia Commons: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Search Wikipedia page for images
 */
async function searchWikipediaPage(wikipediaUrl, cache) {
  if (!wikipediaUrl) return [];

  try {
    const response = await makeRequest(wikipediaUrl);
    if (response.statusCode !== 200) {
      return [];
    }

    const html = response.data;
    const imageUrls = [];

    // Look for image URLs in the HTML
    // Pattern: /media/File:filename.jpg
    const mediaFilePattern = /\/media\/File:([^"'\s]+\.(jpg|jpeg|png|gif|webp))/gi;
    let match;
    while ((match = mediaFilePattern.exec(html)) !== null) {
      const fileName = match[1];
      // Convert to Wikimedia Commons URL
      const commonsUrl = `https://commons.wikimedia.org/wiki/File:${fileName}`;
      
      // Get the actual image URL from Commons API
      try {
        const apiUrl = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
          action: 'query',
          format: 'json',
          titles: `File:${fileName}`,
          prop: 'imageinfo',
          iiprop: 'url',
          iiurlwidth: 330,
          origin: '*',
        });

        const apiResponse = await makeRequest(apiUrl);
        if (apiResponse.statusCode === 200) {
          const apiData = JSON.parse(apiResponse.data);
          const pages = apiData.query?.pages;
          if (pages) {
            const page = Object.values(pages)[0];
            const imageInfo = page.imageinfo?.[0];
            if (imageInfo) {
              const imageUrl = imageInfo.thumburl || imageInfo.url;
              if (imageUrl) {
                const validation = await checkImageUrl(imageUrl, cache);
                if (validation.valid) {
                  imageUrls.push({
                    fileName,
                    url: imageUrl,
                    source: 'wikipedia-page',
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        // Skip this image
      }
    }

    return imageUrls;
  } catch (error) {
    return [];
  }
}

/**
 * Find images for a person or event
 */
async function findImagesForEntity(entity, cache, entityType = 'person') {
  const results = [];

  // Try Wikipedia page first if available
  if (entity.wikipediaUrl) {
    console.log(`  ${colors.cyan}Checking Wikipedia page...${colors.reset}`);
    const wikiImages = await searchWikipediaPage(entity.wikipediaUrl, cache);
    results.push(...wikiImages);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  // Search Wikimedia Commons by name - use more specific search terms
  const searchTerms = [entity.name];

  // If name has multiple words, also try with quotes for exact match
  if (entity.name.split(' ').length > 1) {
    searchTerms.push(`"${entity.name}"`); // Exact phrase match
  }

  // Try variations of the name
  const nameVariations = [];
  if (entity.name.includes('St.')) {
    nameVariations.push(entity.name.replace('St.', 'Saint'));
    nameVariations.push(entity.name.replace('St.', '').trim());
  }
  if (entity.name.includes('Saint')) {
    nameVariations.push(entity.name.replace('Saint', 'St.'));
  }

  // Add variations to search terms
  searchTerms.push(...nameVariations.slice(0, 2));
  
  // Search with each term, prioritizing exact matches
  for (const searchTerm of searchTerms.slice(0, 3)) {
    console.log(`  ${colors.cyan}Searching Wikimedia Commons for "${searchTerm}"...${colors.reset}`);
    const commonsResults = await searchWikimediaCommons(searchTerm, cache);

    // Score results: prioritize those where filename contains the full name
    const scoredResults = commonsResults.map(r => {
      const fileNameLower = r.fileName.toLowerCase();
      const nameLower = entity.name.toLowerCase();
      let score = 0;

      // Higher score if filename contains full name
      if (fileNameLower.includes(nameLower)) {
        score += 10;
      }

      // Even higher if it's an exact match in filename
      if (fileNameLower.includes(nameLower.replace(/\s+/g, '_')) ||
          fileNameLower.includes(nameLower.replace(/\s+/g, '-'))) {
        score += 5;
      }

      // Lower score if filename contains common false matches
      const falseMatches = ['coolidge', 'klein', 'hobbes', 'valentine', 'firefly', 'language'];
      if (entityType === 'person' && falseMatches.some(fm => fileNameLower.includes(fm))) {
        score -= 20;
      }

      return { ...r, score, source: 'commons-search' };
    });
    
    // Sort by score (highest first) and take top results
    scoredResults.sort((a, b) => b.score - a.score);
    results.push(...scoredResults.slice(0, 3).map(r => {
      const { score, ...rest } = r;
      return rest;
    }));
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    
    // If we found good results, break early
    if (scoredResults.length > 0 && scoredResults[0].score > 0) {
      break;
    }
  }

  // Remove duplicates based on URL
  const uniqueResults = [];
  const seenUrls = new Set();
  for (const result of results) {
    if (!seenUrls.has(result.url)) {
      seenUrls.add(result.url);
      uniqueResults.push(result);
    }
  }

  return uniqueResults;
}

/**
 * Find all JSON files
 */
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

/**
 * Update an entity's JSON file with a new image URL
 */
function updateEntityImage(filePath, imageUrl) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const entity = JSON.parse(content);

    entity.imageUrl = imageUrl;

    // Write back with proper formatting
    const updatedContent = JSON.stringify(entity, null, 2) + '\n';
    fs.writeFileSync(filePath, updatedContent, 'utf8');

    return true;
  } catch (error) {
    console.error(`${colors.red}Error updating file: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || (command !== 'find' && command !== 'fix' && command !== 'interactive')) {
    console.log(`${colors.blue}Usage:${colors.reset}`);
    console.log(`  node find-images.js find <id> [--type=people|events]   - Find images for a specific entity`);
    console.log(`  node find-images.js fix [--type=people|events]         - Automatically fix all broken/missing images`);
    console.log(`  node find-images.js interactive [--type=people|events] - Interactive mode to fix images one by one`);
    console.log(``);
    console.log(`${colors.cyan}Options:${colors.reset}`);
    console.log(`  --type=people  - Work with people/saints (default)`);
    console.log(`  --type=events  - Work with events/councils`);
    process.exit(1);
  }

  // Parse type flag
  const typeFlag = args.find(arg => arg.startsWith('--type='));
  const dataType = typeFlag ? typeFlag.split('=')[1] : 'people';

  if (dataType !== 'people' && dataType !== 'events') {
    console.error(`${colors.red}Error: Invalid type "${dataType}". Must be "people" or "events"${colors.reset}`);
    process.exit(1);
  }

  const entityType = dataType === 'events' ? 'event' : 'person';
  const entityTypePlural = dataType;

  // Load cache
  const cache = loadCache();
  const cacheSize = Object.keys(cache).length;
  if (cacheSize > 0) {
    console.log(`${colors.cyan}Loaded ${cacheSize} cached image verification results${colors.reset}\n`);
  }

  const dataDir = path.join(__dirname, '../..', 'src', 'data', dataType);

  if (!fs.existsSync(dataDir)) {
    console.error(`${colors.red}Error: ${dataDir} not found${colors.reset}`);
    process.exit(1);
  }

  if (command === 'find') {
    // Find images for a specific entity
    const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));
    const entityId = nonFlagArgs[1]; // First is command, second is the ID
    if (!entityId) {
      console.error(`${colors.red}Error: Please provide an ${entityType} ID${colors.reset}`);
      process.exit(1);
    }

    const jsonFiles = findJsonFiles(dataDir);
    const entityFile = jsonFiles.find(f => path.basename(f, '.json') === entityId);

    if (!entityFile) {
      console.error(`${colors.red}Error: ${entityType} with ID "${entityId}" not found${colors.reset}`);
      process.exit(1);
    }

    const content = fs.readFileSync(entityFile, 'utf8');
    const entity = JSON.parse(content);

    console.log(`${colors.blue}Finding images for: ${entity.name} (${entity.id})${colors.reset}\n`);

    const images = await findImagesForEntity(entity, cache, entityType);
    
    if (images.length === 0) {
      console.log(`${colors.yellow}No images found${colors.reset}`);
    } else {
      console.log(`\n${colors.green}Found ${images.length} image(s):${colors.reset}\n`);
      images.forEach((img, index) => {
        console.log(`${colors.cyan}${index + 1}.${colors.reset} ${img.fileName || 'Unknown'}`);
        console.log(`   URL: ${img.url}`);
        console.log(`   Source: ${img.source}`);
        if (img.width && img.height) {
          console.log(`   Size: ${img.width}x${img.height}`);
        }
        console.log('');
      });
    }
  } else if (command === 'fix') {
    // Automatically fix all broken/missing images
    console.log(`${colors.blue}Finding all ${entityType} JSON files...${colors.reset}`);
    const jsonFiles = findJsonFiles(dataDir);
    console.log(`Found ${jsonFiles.length} ${entityType} files\n`);

    let fixed = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of jsonFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const entity = JSON.parse(content);
      const relativePath = path.relative(__dirname, file);

      // Skip if already has a valid image
      if (entity.imageUrl) {
        const validation = await checkImageUrl(entity.imageUrl, cache);
        if (validation.valid) {
          skipped++;
          continue;
        }
      }

      console.log(`${colors.blue}Processing: ${entity.name} (${entity.id})${colors.reset}`);
      console.log(`  File: ${relativePath}`);

      const images = await findImagesForEntity(entity, cache, entityType);

      if (images.length > 0) {
        const bestImage = images[0]; // Use first result
        console.log(`  ${colors.green}Found image: ${bestImage.url}${colors.reset}`);

        if (updateEntityImage(file, bestImage.url)) {
          console.log(`  ${colors.green}✓ Updated${colors.reset}\n`);
          fixed++;
        } else {
          console.log(`  ${colors.red}✗ Failed to update${colors.reset}\n`);
          failed++;
        }
      } else {
        console.log(`  ${colors.yellow}No images found${colors.reset}\n`);
        skipped++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n${colors.blue}=== SUMMARY ===${colors.reset}`);
    console.log(`${colors.green}Fixed: ${fixed}${colors.reset}`);
    console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);
    if (failed > 0) {
      console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    }
  } else if (command === 'interactive') {
    // Interactive mode
    console.log(`${colors.blue}Finding all ${entityType} JSON files...${colors.reset}`);
    const jsonFiles = findJsonFiles(dataDir);
    console.log(`Found ${jsonFiles.length} ${entityType} files\n`);

    // First, identify files that need fixing
    const needsFixing = [];

    for (const file of jsonFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const entity = JSON.parse(content);

      if (!entity.imageUrl || entity.imageUrl === null) {
        needsFixing.push({ file, entity, reason: 'missing' });
      } else {
        const validation = await checkImageUrl(entity.imageUrl, cache);
        if (!validation.valid) {
          needsFixing.push({ file, entity, reason: 'broken', currentUrl: entity.imageUrl });
        }
      }
    }

    if (needsFixing.length === 0) {
      console.log(`${colors.green}All images are valid!${colors.reset}`);
      process.exit(0);
    }

    console.log(`${colors.yellow}Found ${needsFixing.length} ${entityType}(s) needing image fixes${colors.reset}\n`);

    for (const { file, entity, reason, currentUrl } of needsFixing) {
      const relativePath = path.relative(__dirname, file);
      console.log(`\n${colors.blue}=== ${entity.name} (${entity.id}) ===${colors.reset}`);
      console.log(`File: ${relativePath}`);
      if (reason === 'broken') {
        console.log(`Current URL: ${currentUrl} ${colors.red}(broken)${colors.reset}`);
      } else {
        console.log(`Status: ${colors.yellow}Missing imageUrl${colors.reset}`);
      }
      console.log('');

      const images = await findImagesForEntity(entity, cache, entityType);
      
      if (images.length === 0) {
        console.log(`${colors.yellow}No images found. Skipping...${colors.reset}\n`);
        continue;
      }

      console.log(`${colors.green}Found ${images.length} image(s):${colors.reset}\n`);
      images.forEach((img, index) => {
        console.log(`${colors.cyan}${index + 1}.${colors.reset} ${img.fileName || 'Unknown'}`);
        console.log(`   URL: ${img.url}`);
        console.log(`   Source: ${img.source}`);
        if (img.width && img.height) {
          console.log(`   Size: ${img.width}x${img.height}`);
        }
        console.log('');
      });

      // In interactive mode, we'll use the first result automatically
      // (In a real interactive mode, you'd use readline to ask the user)
      const bestImage = images[0];
      console.log(`${colors.blue}Using first result: ${bestImage.url}${colors.reset}`);

      if (updateEntityImage(file, bestImage.url)) {
        console.log(`${colors.green}✓ Updated${colors.reset}\n`);
      } else {
        console.log(`${colors.red}✗ Failed to update${colors.reset}\n`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Save cache at the end
  saveCache(cache);
  const finalCacheSize = Object.keys(cache).length;
  if (finalCacheSize > cacheSize) {
    console.log(`\n${colors.cyan}Cache updated: ${finalCacheSize} entries${colors.reset}`);
  }
}

main().catch(console.error);
