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
        timeout: options.timeout || 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PopeImageFinder/1.0)',
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
 * Check if an image URL is valid
 */
async function checkImageUrl(url) {
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
        
        resolve({
          valid: isOk && isImage,
          statusCode,
          contentType,
        });
        
        res.destroy();
      });

      req.on('error', () => {
        resolve({ valid: false, statusCode: null, contentType: null });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ valid: false, statusCode: null, contentType: null });
      });

      req.end();
    });
  } catch (error) {
    return { valid: false, statusCode: null, contentType: null };
  }
}

/**
 * Check if image filename looks like a generic placeholder
 */
function isGenericImage(fileName) {
  const genericPatterns = [
    /046CupolaSPietro/i,
    /placeholder/i,
    /default/i,
    /unknown/i,
    /no_image/i,
    /question_mark/i,
  ];
  
  return genericPatterns.some(pattern => pattern.test(fileName));
}

/**
 * Search Wikipedia for the pope's page and find image
 */
async function findPopeImageFromWikipedia(wikipediaUrl, popeName) {
  if (!wikipediaUrl) return null;

  try {
    const response = await makeRequest(wikipediaUrl);
    if (response.statusCode !== 200) {
      return null;
    }

    const html = response.data;
    
    // Look for infobox image - usually the first image in the infobox
    // Pattern: /media/File:filename.jpg or /wikipedia/commons/thumb/...
    const imagePatterns = [
      /src="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^"]+\.(jpg|jpeg|png|gif|webp)[^"]*)"/gi,
      /href="(\/wiki\/File:[^"]+\.(jpg|jpeg|png|gif|webp))"/gi,
      /\/media\/File:([^"'\s]+\.(jpg|jpeg|png|gif|webp))/gi,
    ];

    const foundImages = [];
    
    for (const pattern of imagePatterns) {
      const matches = [...html.matchAll(pattern)];
      for (const match of matches) {
        let imageUrl = match[1] || match[0];
        let fileName = '';
        
        // If it's a relative URL, make it absolute
        if (imageUrl.startsWith('/wiki/File:')) {
          fileName = imageUrl.replace('/wiki/File:', '');
          imageUrl = `https://commons.wikimedia.org/wiki/File:${fileName}`;
        } else if (imageUrl.startsWith('/media/File:')) {
          fileName = imageUrl.replace('/media/File:', '');
          imageUrl = `https://commons.wikimedia.org/wiki/File:${fileName}`;
        } else if (imageUrl.includes('upload.wikimedia.org')) {
          // Extract filename from URL
          fileName = imageUrl.match(/\/([^\/]+\.(jpg|jpeg|png|gif|webp))(?:\?|$)/i)?.[1] || '';
        }
        
        // Skip generic placeholder images
        if (fileName && isGenericImage(fileName)) {
          continue;
        }
        
        // If we already have a full URL, validate it
        if (imageUrl.startsWith('https://upload.wikimedia.org')) {
          const validation = await checkImageUrl(imageUrl);
          if (validation.valid) {
            foundImages.push(imageUrl);
          }
        } else if (imageUrl.includes('commons.wikimedia.org/wiki/File:')) {
          // If it's a Commons file page, get the actual image URL
          const actualUrl = await getImageUrlFromCommonsPage(imageUrl);
          if (actualUrl && !isGenericImage(actualUrl)) {
            foundImages.push(actualUrl);
          }
        }
      }
    }

    // Return the first valid, non-generic image
    return foundImages.length > 0 ? foundImages[0] : null;
  } catch (error) {
    return null;
  }
}

/**
 * Get image URL from Wikimedia Commons file page
 */
async function getImageUrlFromCommonsPage(commonsUrl) {
  try {
    // Use Commons API to get image URL
    const fileName = commonsUrl.match(/File:([^?]+)/)?.[1];
    if (!fileName) return null;

    const apiUrl = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: `File:${fileName}`,
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: 330,
      origin: '*',
    });

    const response = await makeRequest(apiUrl);
    if (response.statusCode !== 200) {
      return null;
    }

    const data = JSON.parse(response.data);
    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    const imageInfo = page.imageinfo?.[0];
    if (!imageInfo) return null;

    const imageUrl = imageInfo.thumburl || imageInfo.url;
    if (!imageUrl) return null;

    const validation = await checkImageUrl(imageUrl);
    if (validation.valid) {
      return imageUrl;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Search Wikimedia Commons API for pope images
 */
async function searchPopeImage(popeName) {
  // Clean up the pope name for search
  let searchTerms = [popeName];
  
  // Remove "Pope" prefix and variations
  if (popeName.includes('Pope')) {
    const withoutPope = popeName.replace(/^Pope\s+/i, '').trim();
    searchTerms.push(withoutPope);
    searchTerms.push(`Pope ${withoutPope}`);
  }
  
  // Remove "St." or "Saint"
  searchTerms = searchTerms.flatMap(term => {
    const variations = [term];
    if (term.includes('St.')) {
      variations.push(term.replace('St.', 'Saint'));
      variations.push(term.replace('St.', '').trim());
    }
    if (term.includes('Saint')) {
      variations.push(term.replace('Saint', 'St.'));
    }
    return variations;
  });

  for (const searchTerm of searchTerms.slice(0, 3)) {
    try {
      const apiUrl = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: searchTerm,
        srnamespace: 6, // File namespace
        srlimit: 5,
        origin: '*',
      });

      const response = await makeRequest(apiUrl);
      if (response.statusCode !== 200) continue;

      const data = JSON.parse(response.data);
      if (!data.query?.search) continue;

      // Try to find a good image from the results
      for (const item of data.query.search.slice(0, 5)) {
        const fileName = item.title.replace('File:', '');
        
        // Skip generic placeholder images
        if (isGenericImage(fileName)) {
          continue;
        }
        
        const commonsUrl = `https://commons.wikimedia.org/wiki/File:${fileName}`;
        const imageUrl = await getImageUrlFromCommonsPage(commonsUrl);
        if (imageUrl && !isGenericImage(imageUrl)) {
          return imageUrl;
        }
        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
      }
    } catch (error) {
      continue;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  return null;
}

/**
 * Find all pope JSON files
 */
function findPopeFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findPopeFiles(filePath, fileList);
    } else if (file.endsWith('.json') && !file.includes('index')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const person = JSON.parse(content);
        // Check if this person is a pope
        const isPope = person.roles?.includes('pope') || 
                       person.roles?.includes('antipope') ||
                       person.name.toLowerCase().includes('pope');
        if (isPope) {
          fileList.push(filePath);
        }
      } catch (error) {
        // Skip invalid JSON
      }
    }
  });
  
  return fileList;
}

/**
 * Update a person's JSON file with a new image URL
 */
function updatePersonImage(filePath, imageUrl) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const person = JSON.parse(content);
    
    person.imageUrl = imageUrl;
    
    // Write back with proper formatting
    const updatedContent = JSON.stringify(person, null, 2) + '\n';
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
  const peopleDir = path.join(__dirname, 'src', 'data', 'people');
  
  if (!fs.existsSync(peopleDir)) {
    console.error(`${colors.red}Error: ${peopleDir} not found${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}Finding all pope JSON files...${colors.reset}`);
  const popeFiles = findPopeFiles(peopleDir);
  console.log(`Found ${popeFiles.length} pope files\n`);

  // First, identify popes with broken or missing images
  const needsFixing = [];
  
  console.log(`${colors.blue}Checking image URLs...${colors.reset}`);
  for (const file of popeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const person = JSON.parse(content);
    
    if (!person.imageUrl) {
      needsFixing.push({ file, person, reason: 'missing' });
    } else {
      const validation = await checkImageUrl(person.imageUrl);
      if (!validation.valid) {
        needsFixing.push({ file, person, reason: 'broken', currentUrl: person.imageUrl });
      }
    }
  }

  if (needsFixing.length === 0) {
    console.log(`${colors.green}All pope images are valid!${colors.reset}`);
    process.exit(0);
  }

  console.log(`\n${colors.yellow}Found ${needsFixing.length} pope(s) needing image fixes${colors.reset}\n`);

  let fixed = 0;
  let failed = 0;

  for (const { file, person, reason, currentUrl } of needsFixing) {
    const relativePath = path.relative(__dirname, file);
    console.log(`${colors.blue}=== ${person.name} (${person.id}) ===${colors.reset}`);
    console.log(`File: ${relativePath}`);
    if (reason === 'broken') {
      console.log(`Current URL: ${currentUrl} ${colors.red}(broken)${colors.reset}`);
    } else {
      console.log(`Status: ${colors.yellow}Missing imageUrl${colors.reset}`);
    }

    let imageUrl = null;

    // Try Wikipedia page first
    if (person.wikipediaUrl) {
      console.log(`  ${colors.cyan}Searching Wikipedia page...${colors.reset}`);
      imageUrl = await findPopeImageFromWikipedia(person.wikipediaUrl, person.name);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }

    // If no image found, try Commons search
    if (!imageUrl) {
      console.log(`  ${colors.cyan}Searching Wikimedia Commons...${colors.reset}`);
      imageUrl = await searchPopeImage(person.name);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }

    if (imageUrl) {
      console.log(`  ${colors.green}Found image: ${imageUrl}${colors.reset}`);
      
      if (updatePersonImage(file, imageUrl)) {
        console.log(`  ${colors.green}✓ Updated${colors.reset}\n`);
        fixed++;
      } else {
        console.log(`  ${colors.red}✗ Failed to update${colors.reset}\n`);
        failed++;
      }
    } else {
      console.log(`  ${colors.yellow}No image found${colors.reset}\n`);
      failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n${colors.blue}=== SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}Fixed: ${fixed}${colors.reset}`);
  console.log(`${colors.yellow}Failed/Skipped: ${failed}${colors.reset}`);
}

main().catch(console.error);

