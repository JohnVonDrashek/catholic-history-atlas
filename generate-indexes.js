#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function kebabToSnakeCase(str) {
  return str.replace(/-/g, '_');
}

function generateIndexFile(centuryDir) {
  const indexPath = path.join(centuryDir, 'index.ts');
  const files = fs.readdirSync(centuryDir);
  
  // Find all JSON files (excluding index.json if it exists)
  const jsonFiles = files
    .filter(file => file.endsWith('.json') && file !== 'index.json')
    .sort(); // Sort alphabetically for consistency

  if (jsonFiles.length === 0) {
    // Create empty index file
    const content = `export default [\n];\n`;
    fs.writeFileSync(indexPath, content, 'utf8');
    return { count: 0, errors: [] };
  }

  const imports = [];
  const exports = [];
  const errors = [];

  jsonFiles.forEach(file => {
    try {
      // Read the JSON to get the ID (for validation)
      const filePath = path.join(centuryDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (!data.id) {
        errors.push(`Warning: ${file} has no 'id' field`);
      }

      // Convert kebab-case filename to snake_case import name
      const importName = kebabToSnakeCase(file.replace('.json', ''));
      
      imports.push(`import ${importName} from './${file}';`);
      exports.push(`  ${importName},`);
    } catch (error) {
      errors.push(`Error reading ${file}: ${error.message}`);
    }
  });

  // Generate the index.ts content
  const content = [
    ...imports,
    '',
    'export default [',
    ...exports,
    '];',
    ''
  ].join('\n');

  fs.writeFileSync(indexPath, content, 'utf8');

  return { count: jsonFiles.length, errors };
}

function main() {
  const peopleDir = path.join(__dirname, 'src', 'data', 'people');

  if (!fs.existsSync(peopleDir)) {
    console.error(`${colors.red}Error: ${peopleDir} not found${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}Generating index files for all century folders...${colors.reset}\n`);

  const centuryDirs = fs.readdirSync(peopleDir)
    .filter(item => {
      const itemPath = path.join(peopleDir, item);
      return fs.statSync(itemPath).isDirectory() && item.startsWith('century-');
    })
    .sort((a, b) => {
      // Sort by century number
      const numA = parseInt(a.replace('century-', ''));
      const numB = parseInt(b.replace('century-', ''));
      return numA - numB;
    });

  let totalFiles = 0;
  let totalErrors = 0;

  centuryDirs.forEach(centuryDir => {
    const centuryPath = path.join(peopleDir, centuryDir);
    const { count, errors } = generateIndexFile(centuryPath);
    
    totalFiles += count;
    totalErrors += errors.length;

    if (errors.length > 0) {
      console.log(`${colors.yellow}${centuryDir}:${colors.reset}`);
      errors.forEach(error => console.log(`  ${colors.yellow}⚠${colors.reset} ${error}`));
    } else {
      console.log(`${colors.green}✓${colors.reset} ${centuryDir}: ${count} files`);
    }
  });

  console.log(`\n${colors.green}✅ Generated index files for ${centuryDirs.length} century folders${colors.reset}`);
  console.log(`   Total files indexed: ${totalFiles}`);
  if (totalErrors > 0) {
    console.log(`${colors.yellow}   Warnings/Errors: ${totalErrors}${colors.reset}`);
  }
}

main();


