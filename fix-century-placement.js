#!/usr/bin/env node

/**
 * Script to automatically move people files to the correct century folder
 * based on their death year.
 */

import { readdir, readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PEOPLE_DIR = join(__dirname, 'src/data/people');

function getCenturyFromYear(year) {
  if (year === null || year === undefined) {
    return null;
  }
  return Math.floor((year - 1) / 100) + 1;
}

function getCenturyFromFolder(folderName) {
  const match = folderName.match(/century-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

async function updateIndexFile(centuryFolder, personId, fileName, action = 'add') {
  const indexPath = join(PEOPLE_DIR, centuryFolder, 'index.ts');
  
  try {
    let content = await readFile(indexPath, 'utf-8');
    const importName = personId.replace(/-/g, '_');
    const importLine = `import ${importName} from './${fileName}';`;
    const exportLine = `  ${importName},`;
    
    if (action === 'add') {
      // Add import if not present
      if (!content.includes(importLine)) {
        // Find a good place to insert (alphabetically or at the end)
        const lines = content.split('\n');
        let insertIndex = lines.findIndex(line => line.startsWith('import ') && line > importLine);
        if (insertIndex === -1) insertIndex = lines.findIndex(line => line.startsWith('export default'));
        lines.splice(insertIndex, 0, importLine);
        content = lines.join('\n');
      }
      
      // Add to export if not present
      if (!content.includes(exportLine)) {
        const lines = content.split('\n');
        let insertIndex = lines.findIndex(line => line.includes(importName) && line.includes('//'));
        if (insertIndex === -1) {
          insertIndex = lines.findIndex(line => line.trim() === '];');
        }
        lines.splice(insertIndex, 0, exportLine);
        content = lines.join('\n');
      }
    } else if (action === 'remove') {
      // Remove import
      content = content.replace(new RegExp(`import ${importName} from '[^']+';\\n?`, 'g'), '');
      // Remove from export
      content = content.replace(new RegExp(`  ${importName},\\n?`, 'g'), '');
    }
    
    await writeFile(indexPath, content, 'utf-8');
  } catch (error) {
    console.error(`Error updating index file ${indexPath}:`, error.message);
  }
}

async function movePersonFile(filePath, fromCentury, toCentury) {
  const fileName = basename(filePath);
  const personId = fileName.replace('.json', '');
  const fromFolder = `century-${fromCentury}`;
  const toFolder = `century-${toCentury}`;
  
  const toDir = join(PEOPLE_DIR, toFolder);
  const toPath = join(toDir, fileName);
  
  try {
    // Ensure target directory exists
    if (!existsSync(toDir)) {
      await mkdir(toDir, { recursive: true });
    }
    
    // Read the file
    const content = await readFile(filePath, 'utf-8');
    
    // Write to new location
    await writeFile(toPath, content, 'utf-8');
    
    // Update index files
    await updateIndexFile(toFolder, personId, fileName, 'add');
    await updateIndexFile(fromFolder, personId, fileName, 'remove');
    
    // Delete old file
    const { unlink } = await import('fs/promises');
    await unlink(filePath);
    
    console.log(`✓ Moved ${personId} from ${fromFolder} to ${toFolder}`);
    return true;
  } catch (error) {
    console.error(`✗ Error moving ${personId}:`, error.message);
    return false;
  }
}

async function main() {
  const entries = await readdir(PEOPLE_DIR, { withFileTypes: true });
  const moves = [];
  
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('century-')) {
      const centuryFolder = entry.name;
      const actualCentury = getCenturyFromFolder(centuryFolder);
      const folderPath = join(PEOPLE_DIR, centuryFolder);
      const files = await readdir(folderPath);
      
      for (const file of files) {
        if (file.endsWith('.json') && file !== 'index.ts') {
          const filePath = join(folderPath, file);
          try {
            const content = await readFile(filePath, 'utf-8');
            const person = JSON.parse(content);
            const expectedCentury = getCenturyFromYear(person.deathYear);
            
            if (expectedCentury && expectedCentury !== actualCentury) {
              moves.push({
                filePath,
                personId: person.id,
                fileName: file,
                fromCentury: actualCentury,
                toCentury: expectedCentury,
                name: person.name
              });
            }
          } catch (error) {
            console.error(`Error reading ${filePath}:`, error.message);
          }
        }
      }
    }
  }
  
  if (moves.length === 0) {
    console.log('No files need to be moved.');
    return;
  }
  
  console.log(`Found ${moves.length} files to move:\n`);
  for (const move of moves) {
    console.log(`  ${move.name} (${move.personId})`);
    console.log(`    From: century-${move.fromCentury} → To: century-${move.toCentury}`);
  }
  console.log();
  
  // Perform moves
  let successCount = 0;
  for (const move of moves) {
    const success = await movePersonFile(
      move.filePath,
      move.fromCentury,
      move.toCentury
    );
    if (success) successCount++;
  }
  
  console.log(`\n✓ Successfully moved ${successCount}/${moves.length} files.`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});




