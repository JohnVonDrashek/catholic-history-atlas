#!/usr/bin/env node

import fs from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';

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
  });
}

async function verifyCenturyFile(filePath) {
  console.log(`\n${colors.blue}Checking ${filePath}...${colors.reset}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  const results = [];
  
  for (const person of data) {
    if (person.imageUrl) {
      const result = await checkImageUrl(person.imageUrl);
      results.push({
        name: person.name,
        id: person.id,
        ...result,
      });
      
      if (result.valid) {
        process.stdout.write(`${colors.green}✓${colors.reset} ${person.name}\n`);
      } else {
        process.stdout.write(`${colors.red}✗${colors.reset} ${person.name} - ${result.error || `Status: ${result.statusCode}`}\n`);
      }
    } else {
      results.push({
        name: person.name,
        id: person.id,
        url: null,
        valid: false,
        error: 'Missing imageUrl',
      });
      process.stdout.write(`${colors.yellow}⚠${colors.reset} ${person.name} - Missing imageUrl\n`);
    }
  }
  
  return results;
}

async function main() {
  const centuryFiles = [
    'src/data/century-1-people.json',
    'src/data/century-2-people.json',
    'src/data/century-3-people.json',
    'src/data/century-4-people.json',
    'src/data/century-5-people.json',
    'src/data/century-6-people.json',
    'src/data/century-7-people.json',
    'src/data/century-8-people.json',
    'src/data/century-9-people.json',
    'src/data/century-10-people.json',
    'src/data/century-11-people.json',
    'src/data/century-12-people.json',
    'src/data/century-13-people.json',
    'src/data/century-14-people.json',
    'src/data/century-15-people.json',
    'src/data/century-16-people.json',
    'src/data/century-17-people.json',
    'src/data/century-18-people.json',
    'src/data/century-19-people.json',
    'src/data/century-20-people.json',
  ];

  const allResults = [];
  
  for (const file of centuryFiles) {
    const filePath = file;
    if (fs.existsSync(filePath)) {
      const results = await verifyCenturyFile(filePath);
      allResults.push(...results);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log(`${colors.yellow}Warning: ${filePath} not found${colors.reset}`);
    }
  }
  
  // Summary
  console.log(`\n${colors.blue}=== SUMMARY ===${colors.reset}`);
  const valid = allResults.filter(r => r.valid).length;
  const invalid = allResults.filter(r => !r.valid && r.url).length;
  const missing = allResults.filter(r => !r.url).length;
  
  console.log(`${colors.green}Valid: ${valid}${colors.reset}`);
  console.log(`${colors.red}Invalid: ${invalid}${colors.reset}`);
  console.log(`${colors.yellow}Missing: ${missing}${colors.reset}`);
  
  // List invalid URLs
  if (invalid > 0) {
    console.log(`\n${colors.red}=== INVALID IMAGE URLs ===${colors.reset}`);
    allResults
      .filter(r => !r.valid && r.url)
      .forEach(r => {
        console.log(`${colors.red}✗${colors.reset} ${r.name} (${r.id})`);
        console.log(`  URL: ${r.url}`);
        console.log(`  Error: ${r.error || `Status ${r.statusCode}, Content-Type: ${r.contentType}`}`);
        console.log('');
      });
  }
  
  // List missing URLs
  if (missing > 0) {
    console.log(`\n${colors.yellow}=== MISSING IMAGE URLs ===${colors.reset}`);
    allResults
      .filter(r => !r.url)
      .forEach(r => {
        console.log(`${colors.yellow}⚠${colors.reset} ${r.name} (${r.id}) - Missing imageUrl`);
      });
  }
  
  // Exit with error code if there are issues
  if (invalid > 0 || missing > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
