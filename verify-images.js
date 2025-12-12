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
};

function checkImageUrl(url) {
  return new Promise((resolve) => {
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
        
        resolve({
          url,
          valid: isOk && isImage,
          statusCode,
          contentType,
          error: null,
        });
        
        res.destroy();
      });

      req.on('error', (error) => {
        resolve({
          url,
          valid: false,
          statusCode: null,
          contentType: null,
          error: error.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          valid: false,
          statusCode: null,
          contentType: null,
          error: 'Request timeout',
        });
      });

      req.end();
    } catch (error) {
      resolve({
        url,
        valid: false,
        statusCode: null,
        contentType: null,
        error: `Invalid URL: ${error.message}`,
      });
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

async function verifyPersonFile(filePath) {
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
      };
    }
    
    const result = await checkImageUrl(person.imageUrl);
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
    };
  }
}

async function main() {
  const peopleDir = path.join(__dirname, 'src', 'data', 'people');
  
  if (!fs.existsSync(peopleDir)) {
    console.error(`${colors.red}Error: ${peopleDir} not found${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.blue}Finding all person JSON files...${colors.reset}`);
  const jsonFiles = findJsonFiles(peopleDir);
  console.log(`Found ${jsonFiles.length} person files\n`);
  
  const allResults = [];
  let processed = 0;
  
  for (const file of jsonFiles) {
    processed++;
    const relativePath = path.relative(__dirname, file);
    process.stdout.write(`[${processed}/${jsonFiles.length}] Checking ${relativePath}... `);
    
    const result = await verifyPersonFile(file);
    allResults.push(result);
    
    if (result.valid) {
      process.stdout.write(`${colors.green}✓${colors.reset}\n`);
    } else if (!result.url) {
      process.stdout.write(`${colors.yellow}⚠ Missing imageUrl${colors.reset}\n`);
    } else {
      process.stdout.write(`${colors.red}✗ ${result.error || `Status: ${result.statusCode}`}${colors.reset}\n`);
    }
    
    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
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
