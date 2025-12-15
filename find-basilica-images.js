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
 * Search Wikipedia page for images
 */
async function searchWikipediaPage(wikipediaUrl) {
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
          iiurlwidth: 800, // Higher resolution for basilicas
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
              // Prefer thumbnail URL if available, otherwise full URL
              const imageUrl = imageInfo.thumburl || imageInfo.url;
              if (imageUrl) {
                const validation = await checkImageUrl(imageUrl);
                if (validation.valid) {
                  imageUrls.push({
                    fileName,
                    url: imageUrl,
                    source: 'wikipedia-page',
                    width: imageInfo.thumbwidth || imageInfo.width,
                    height: imageInfo.thumbheight || imageInfo.height,
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

    // Also try to find images via the infobox or main image
    // Look for data-src or src attributes with upload.wikimedia.org
    const uploadPattern = /(https?:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"'\s]+\.(jpg|jpeg|png|gif|webp))/gi;
    let uploadMatch;
    while ((uploadMatch = uploadPattern.exec(html)) !== null) {
      const imageUrl = uploadMatch[1];
      // Skip if already found
      if (!imageUrls.some(img => img.url === imageUrl)) {
        const validation = await checkImageUrl(imageUrl);
        if (validation.valid) {
          imageUrls.push({
            fileName: path.basename(imageUrl),
            url: imageUrl,
            source: 'wikipedia-upload',
          });
        }
      }
    }

    return imageUrls;
  } catch (error) {
    return [];
  }
}

/**
 * Search Wikimedia Commons API for images
 */
async function searchWikimediaCommons(searchTerm) {
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
          iiurlwidth: 800,
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
        const validation = await checkImageUrl(imageUrl);
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
 * Find images for a basilica
 */
async function findImagesForBasilica(basilica) {
  const results = [];
  
  // Try Wikipedia page first if available
  if (basilica.wikipediaUrl) {
    console.log(`  ${colors.cyan}Checking Wikipedia page...${colors.reset}`);
    const wikiImages = await searchWikipediaPage(basilica.wikipediaUrl);
    results.push(...wikiImages);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  // Search Wikimedia Commons by name
  console.log(`  ${colors.cyan}Searching Wikimedia Commons for "${basilica.name}"...${colors.reset}`);
  const commonsResults = await searchWikimediaCommons(basilica.name);
  results.push(...commonsResults.map(r => ({ ...r, source: 'commons-search' })));
  await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting

  // Try variations of the name
  const nameVariations = [];
  if (basilica.name.includes('Basilica of ')) {
    nameVariations.push(basilica.name.replace('Basilica of ', ''));
    nameVariations.push(basilica.name.replace('Basilica of ', 'Basilica '));
  }
  if (basilica.name.includes('St. ')) {
    nameVariations.push(basilica.name.replace('St. ', 'Saint '));
  }
  if (basilica.name.includes('Saint ')) {
    nameVariations.push(basilica.name.replace('Saint ', 'St. '));
  }

  for (const variation of nameVariations.slice(0, 2)) {
    console.log(`  ${colors.cyan}Searching for "${variation}"...${colors.reset}`);
    const variationResults = await searchWikimediaCommons(variation);
    results.push(...variationResults.map(r => ({ ...r, source: 'commons-search-variation' })));
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
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
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'fix';
  
  if (command !== 'find' && command !== 'fix' && command !== 'interactive') {
    console.log(`${colors.blue}Usage:${colors.reset}`);
    console.log(`  node find-basilica-images.js find <basilica-id>  - Find images for a specific basilica`);
    console.log(`  node find-basilica-images.js fix                 - Automatically fix all broken/missing images`);
    console.log(`  node find-basilica-images.js interactive         - Interactive mode to fix images one by one`);
    process.exit(1);
  }

  const basilicasFile = path.join(__dirname, 'src', 'data', 'basilicas.json');
  
  if (!fs.existsSync(basilicasFile)) {
    console.error(`${colors.red}Error: ${basilicasFile} not found${colors.reset}`);
    process.exit(1);
  }

  const content = fs.readFileSync(basilicasFile, 'utf8');
  const basilicas = JSON.parse(content);

  if (command === 'find') {
    // Find images for a specific basilica
    const basilicaId = args[1];
    if (!basilicaId) {
      console.error(`${colors.red}Error: Please provide a basilica ID${colors.reset}`);
      process.exit(1);
    }

    const basilica = basilicas.find(b => b.id === basilicaId);
    
    if (!basilica) {
      console.error(`${colors.red}Error: Basilica with ID "${basilicaId}" not found${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.blue}Finding images for: ${basilica.name} (${basilica.id})${colors.reset}\n`);

    const images = await findImagesForBasilica(basilica);
    
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
    console.log(`${colors.blue}Processing ${basilicas.length} basilicas...${colors.reset}\n`);

    let fixed = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < basilicas.length; i++) {
      const basilica = basilicas[i];
      console.log(`${colors.blue}[${i + 1}/${basilicas.length}] Processing: ${basilica.name} (${basilica.id})${colors.reset}`);

      // Skip if already has a valid image
      if (basilica.imageUrl) {
        const validation = await checkImageUrl(basilica.imageUrl);
        if (validation.valid) {
          console.log(`  ${colors.yellow}Already has valid image, skipping...${colors.reset}\n`);
          skipped++;
          continue;
        } else {
          console.log(`  ${colors.yellow}Current image is broken, searching for replacement...${colors.reset}`);
        }
      }

      const images = await findImagesForBasilica(basilica);
      
      if (images.length > 0) {
        const bestImage = images[0]; // Use first result
        console.log(`  ${colors.green}Found image: ${bestImage.url}${colors.reset}`);
        
        basilica.imageUrl = bestImage.url;
        fixed++;
        console.log(`  ${colors.green}✓ Will update${colors.reset}\n`);
      } else {
        console.log(`  ${colors.yellow}No images found${colors.reset}\n`);
        skipped++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Write updated basilicas back to file
    if (fixed > 0) {
      const updatedContent = JSON.stringify(basilicas, null, 2) + '\n';
      fs.writeFileSync(basilicasFile, updatedContent, 'utf8');
      console.log(`${colors.green}✓ Updated ${basilicasFile}${colors.reset}\n`);
    }

    console.log(`${colors.blue}=== SUMMARY ===${colors.reset}`);
    console.log(`${colors.green}Fixed: ${fixed}${colors.reset}`);
    console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);
    if (failed > 0) {
      console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    }
  } else if (command === 'interactive') {
    // Interactive mode
    console.log(`${colors.blue}Processing ${basilicas.length} basilicas...${colors.reset}\n`);

    // First, identify basilicas that need fixing
    const needsFixing = [];
    
    for (const basilica of basilicas) {
      if (!basilica.imageUrl || basilica.imageUrl === null) {
        needsFixing.push({ basilica, reason: 'missing' });
      } else {
        const validation = await checkImageUrl(basilica.imageUrl);
        if (!validation.valid) {
          needsFixing.push({ basilica, reason: 'broken', currentUrl: basilica.imageUrl });
        }
      }
    }

    if (needsFixing.length === 0) {
      console.log(`${colors.green}All images are valid!${colors.reset}`);
      process.exit(0);
    }

    console.log(`${colors.yellow}Found ${needsFixing.length} basilica(s) needing image fixes${colors.reset}\n`);

    for (let i = 0; i < needsFixing.length; i++) {
      const { basilica, reason, currentUrl } = needsFixing[i];
      console.log(`\n${colors.blue}=== [${i + 1}/${needsFixing.length}] ${basilica.name} (${basilica.id}) ===${colors.reset}`);
      if (reason === 'broken') {
        console.log(`Current URL: ${currentUrl} ${colors.red}(broken)${colors.reset}`);
      } else {
        console.log(`Status: ${colors.yellow}Missing imageUrl${colors.reset}`);
      }
      console.log('');

      const images = await findImagesForBasilica(basilica);
      
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

      // Use the first result automatically
      const bestImage = images[0];
      console.log(`${colors.blue}Using first result: ${bestImage.url}${colors.reset}`);
      
      basilica.imageUrl = bestImage.url;
      console.log(`${colors.green}✓ Will update${colors.reset}\n`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Write updated basilicas back to file
    const updatedContent = JSON.stringify(basilicas, null, 2) + '\n';
    fs.writeFileSync(basilicasFile, updatedContent, 'utf8');
    console.log(`${colors.green}✓ Updated ${basilicasFile}${colors.reset}\n`);
  }
}

main().catch(console.error);


