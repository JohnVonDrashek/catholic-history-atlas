# Protocol for Adding Saints to Catholic History Atlas

This protocol ensures saints are added correctly without duplicates or errors.

## Step-by-Step Process

### 1. **Check if Saint Already Exists** ⚠️ CRITICAL FIRST STEP

Before creating any files, always check if the saint already exists:

```bash
npm run check:saint "Saint Name"
```

**Examples:**
- `npm run check:saint "Francis Xavier"`
- `npm run check:saint "Thomas Aquinas" "Augustine"`

**If matches are found:**
- Review the existing entry
- If it's the same person, **DO NOT CREATE A DUPLICATE**
- If it's a different person with a similar name, use a more specific ID (e.g., `thomas-aquinas` vs `thomas-india`)

**If no matches found:**
- Proceed to next step

### 2. **Determine Correct Century Folder**

Calculate the century based on **death year**:
- Death year 1-100 → `century-1`
- Death year 101-200 → `century-2`
- Death year 201-300 → `century-3`
- etc.

**Formula:** `century = Math.ceil(deathYear / 100)`

**If death year is unknown:**
- Use best estimate or place in appropriate century based on historical context
- Note in the JSON that death year is approximate

### 3. **Check Required Places**

Before creating the saint JSON, identify all places mentioned in the saint's locations:

```bash
# Check if places exist in places.json
grep -i "place-name" src/data/places.json
```

**If place doesn't exist:**
- Add it to `src/data/places.json` with proper coordinates
- Include: `id`, `name`, `lat`, `lng`, `region`, `modernCountry`

### 4. **Create Saint JSON File**

Create file: `src/data/people/century-X/saint-id.json`

**Required fields:**
- `id`: kebab-case, unique identifier (e.g., `francis-xavier`)
- `name`: Full name with "St." prefix (e.g., `"St. Francis Xavier"`)
- `birthYear`: Number or `null`
- `deathYear`: Number (required for century placement)
- `feastDay`: String (e.g., `"December 3"`)
- `primaryTradition`: `"Latin"`, `"Greek"`, `"Syriac"`, `"Armenian"`, etc.
- `roles`: Array of strings (e.g., `["priest", "missionary"]`)
- `orthodoxyStatus`: `"canonized"` or `"blessed"`
- `isMartyr`: Boolean
- `locations`: Array of location objects with `placeId` and `description`
- `wikipediaUrl`: Full Wikipedia URL
- `newAdventUrl`: Full New Advent URL (if available)
- `imageUrl`: Full image URL (preferably from Wikimedia Commons)
- `summary`: 2-3 sentence biography
- `keyQuotes`: Array of strings (optional)
- `writings`: Array of objects with `title` and `url` (optional)

**Example structure:**
```json
{
  "id": "francis-xavier",
  "name": "St. Francis Xavier",
  "birthYear": 1506,
  "deathYear": 1552,
  "feastDay": "December 3",
  "primaryTradition": "Latin",
  "roles": ["missionary", "priest"],
  "orthodoxyStatus": "canonized",
  "isMartyr": false,
  "locations": [
    {
      "placeId": "india",
      "description": "Missionary to India, Goa"
    }
  ],
  "wikipediaUrl": "https://en.wikipedia.org/wiki/Francis_Xavier",
  "newAdventUrl": "https://www.newadvent.org/cathen/06228a.htm",
  "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Francis_Xavier.jpg/330px-Francis_Xavier.jpg",
  "summary": "Francis Xavier was a Spanish Jesuit missionary...",
  "keyQuotes": [],
  "writings": []
}
```

### 5. **Update Index File**

**Option A: Automatic (Recommended)**
After creating all JSON files, run:
```bash
npm run generate:indexes
```

This will automatically:
- Scan all century folders
- Generate import statements for all JSON files
- Generate export arrays
- Update all `index.ts` files

**Option B: Manual**
If you prefer to update manually, add import and export to `src/data/people/century-X/index.ts`:

**Import statement:**
```typescript
import saint_id from './saint-id.json';
```

**Export statement:**
Add to the `export default` array:
```typescript
export default [
  // ... existing imports
  saint_id,
];
```

**Important:**
- Maintain alphabetical order in imports (optional but helpful)
- Ensure comma after last item if not the last entry
- Check for missing commas

### 6. **Run Linting Checks**

After adding saints, always run:

```bash
# Check for duplicates and correct century placement
npm run lint:centuries

# Check for duplicate IDs
npm run lint:duplicates

# Verify all image URLs are valid
npm run lint:images
```

**If errors are found:**
- Fix century placement using: `node fix-century-placement.js`
- Remove duplicate entries
- Fix any syntax errors in index files
- Fix broken images using: `npm run fix:images` (see "Verify and Fix Images" section below)

### 7. **Build and Verify**

Run the build to ensure everything compiles:

```bash
npm run build
```

**If build fails:**
- Check TypeScript errors
- Verify all imports are correct
- Check for missing commas in index files
- Ensure all referenced places exist in `places.json`

## Quick Checklist

Before considering a saint addition complete:

- [ ] Checked for existing saints: `npm run check:saint "Name"`
- [ ] Calculated correct century from death year
- [ ] Added missing places to `places.json`
- [ ] Created JSON file with all required fields
- [ ] Generated/updated index files: `npm run generate:indexes`
- [ ] Ran `npm run lint:centuries` - no errors
- [ ] Ran `npm run lint:duplicates` - no errors
- [ ] Ran `npm run lint:images` - all images valid (or fixed with `npm run fix:images`)
- [ ] Ran `npm run build` - successful

## Common Mistakes to Avoid

1. **❌ Creating duplicates** - Always check first!
2. **❌ Wrong century folder** - Use death year, not birth year
3. **❌ Missing places** - Add all referenced places to `places.json`
4. **❌ Missing commas** - Check index.ts files for syntax errors (or just run `npm run generate:indexes`)
5. **❌ Wrong import names** - Use kebab-case file name, convert to snake_case for import (or use `npm run generate:indexes`)
6. **❌ Forgetting to update index.ts** - Run `npm run generate:indexes` after adding files

## Batch Adding Saints

When adding multiple saints:

1. Check all names first: `npm run check:saint "Name1" "Name2" "Name3"`
2. Create all JSON files
3. Add all missing places to `places.json`
4. **Generate/update all index files automatically:** `npm run generate:indexes`
5. Run linting once at the end:
   - `npm run lint:centuries`
   - `npm run lint:duplicates`
   - `npm run lint:images` (fix any issues with `npm run fix:images`)
6. Build and verify

## Automated Tools

### Generate/Update Index Files
```bash
npm run generate:indexes
```
Automatically generates all `index.ts` files from JSON files in each century folder. Run this after:
- Adding new saints
- Moving files between centuries
- Any time index files might be out of sync

### Fix Century Placement
```bash
node fix-century-placement.js
```

This will automatically:
- Move files to correct century folders
- Update index files (add/remove imports)

**Note:** After running `fix-century-placement.js`, you may want to run `npm run generate:indexes` to ensure all index files are properly formatted.

### Verify and Fix Images

After adding saints, verify that all image URLs are valid:

```bash
npm run lint:images
```

This will:
- Check all person JSON files for `imageUrl` fields
- Verify that each URL is accessible and returns a valid image
- Report any broken, missing, or invalid image URLs
- **Use cached results** for previously verified images (cache expires after 7 days)

**Note:** The first run will be slower as it verifies all images. Subsequent runs will be much faster as results are cached in `.image-cache.json`. The cache file is automatically created and ignored by git.

**If images fail verification:**

1. **Automatic fix (recommended):**
   ```bash
   npm run fix:images
   ```
   This will automatically search for and update broken image URLs with working alternatives from Wikipedia/Wikimedia Commons.

2. **Interactive fix:**
   ```bash
   npm run fix:images:interactive
   ```
   This provides an interactive interface to review and approve image replacements before they're applied.

3. **Manual fix:**
   - Review the invalid URLs listed by `npm run lint:images`
   - Search for alternative images on Wikipedia or Wikimedia Commons
   - Update the `imageUrl` field in the saint's JSON file
   - Re-run `npm run lint:images` to verify the fix

**Note:** The image verification script checks that URLs return valid image content types. Broken links, 404 errors, or non-image content will be flagged. Always verify images after adding new saints to ensure they display correctly in the application.

