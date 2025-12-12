import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const peopleDir = path.join(__dirname, 'people');

// Get all century directories
const centuryDirs = fs.readdirSync(peopleDir)
  .filter(item => {
    const itemPath = path.join(peopleDir, item);
    return fs.statSync(itemPath).isDirectory() && item.startsWith('century-');
  })
  .sort((a, b) => {
    const numA = parseInt(a.match(/century-(\d+)/)?.[1] || '0');
    const numB = parseInt(b.match(/century-(\d+)/)?.[1] || '0');
    return numA - numB;
  });

console.log(`Found ${centuryDirs.length} century directories...\n`);

// Generate index.ts for each century
centuryDirs.forEach(centuryDir => {
  const centuryPath = path.join(peopleDir, centuryDir);
  const personFiles = fs.readdirSync(centuryPath)
    .filter(file => file.endsWith('.json'))
    .sort();
  
  if (personFiles.length === 0) {
    console.warn(`No person files found in ${centuryDir}`);
    return;
  }
  
  // Helper function to create valid variable name
  const createVarName = (id) => {
    let varName = id.replace(/[^a-zA-Z0-9]/g, '_');
    // If it starts with a number, prefix with 'person_'
    if (/^\d/.test(varName)) {
      varName = 'person_' + varName;
    }
    return varName;
  };
  
  // Generate import statements
  const imports = personFiles.map(file => {
    const personId = file.replace('.json', '');
    const varName = createVarName(personId);
    return `import ${varName} from './${file}';`;
  }).join('\n');
  
  // Generate export array
  const exports = personFiles.map(file => {
    const personId = file.replace('.json', '');
    const varName = createVarName(personId);
    return `  ${varName}`;
  }).join(',\n');
  
  const indexContent = `${imports}

export default [
${exports}
];
`;
  
  const indexPath = path.join(centuryPath, 'index.ts');
  fs.writeFileSync(indexPath, indexContent);
  console.log(`Generated ${indexPath} with ${personFiles.length} people`);
});

console.log('\nDone! All century index files have been generated.');
