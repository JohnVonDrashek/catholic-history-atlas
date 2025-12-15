# Protocol for Adding Heresiarchs to Catholic History Atlas

This protocol ensures heresiarchs are added correctly without duplicates or errors.

## Step-by-Step Process

### 1. **Check if Heresiarch Already Exists** ⚠️ CRITICAL FIRST STEP

Before creating any files, always check if the heresiarch already exists:

```bash
npm run check:saint "Heresiarch Name"
```

**Note:** The `check:saint` script checks all people (saints, heresiarchs, and others), so it will find heresiarchs as well.

**Examples:**
- `npm run check:saint "Arius"`
- `npm run check:saint "Nestorius" "Pelagius"`

**If matches are found:**
- Review the existing entry
- If it's the same person, **DO NOT CREATE A DUPLICATE**
- If it's a different person with a similar name, use a more specific ID (e.g., `nestorius-constantinople` vs `nestorius-antioch`)
- Check the `orthodoxyStatus` field - if it shows `"heresiarch"`, it's already categorized correctly

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

Before creating the heresiarch JSON, identify all places mentioned in the heresiarch's locations:

```bash
# Check if places exist in places.json
grep -i "place-name" src/data/places.json
```

**If place doesn't exist:**
- Add it to `src/data/places.json` with proper coordinates
- Include: `id`, `name`, `lat`, `lng`, `region`, `modernCountry`

### 4. **Create Heresiarch JSON File**

Create file: `src/data/people/century-X/heresiarch-id.json`

**Required fields:**
- `id`: kebab-case, unique identifier (e.g., `arius`, `nestorius`)
- `name`: Full name **without** "St." prefix (e.g., `"Arius"`, `"Nestorius"`)
- `birthYear`: Number or `null`
- `deathYear`: Number (required for century placement)
- `primaryTradition`: `"Latin"`, `"Greek"`, `"Syriac"`, `"Armenian"`, etc.
- `roles`: Array of strings (e.g., `["priest", "bishop", "theologian"]`)
- `orthodoxyStatus`: **Must be `"heresiarch"`**
- `isMartyr`: Boolean (typically `false` for heresiarchs)
- `locations`: Array of location objects with `placeId` and `description`
- `wikipediaUrl`: Full Wikipedia URL
- `newAdventUrl`: Full New Advent URL (if available)
- `imageUrl`: Full image URL (preferably from Wikimedia Commons)
- `summary`: 2-3 sentence biography describing their life and teachings
- `keyQuotes`: Array of strings (optional) - notable quotes or teachings
- `writings`: Array of objects with `title` and `url` (optional)

**Important differences from saints:**
- **No `feastDay` field** - Heresiarchs do not have feast days
- **No "St." prefix** in the name
- **`orthodoxyStatus` must be `"heresiarch"`**
- **`isMartyr` is typically `false`** (though some heresiarchs may have been martyred for other reasons)

**Example structure:**
```json
{
  "id": "arius",
  "name": "Arius",
  "birthYear": 256,
  "deathYear": 336,
  "primaryTradition": "Greek",
  "roles": ["priest"],
  "orthodoxyStatus": "heresiarch",
  "isMartyr": false,
  "locations": [
    {
      "placeId": "alexandria",
      "description": "Priest of Alexandria"
    }
  ],
  "wikipediaUrl": "https://en.wikipedia.org/wiki/Arius",
  "newAdventUrl": "https://www.newadvent.org/cathen/01707c.htm",
  "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Arius_p%C3%BCsp%C3%B6k.jpg/330px-Arius_p%C3%BCsp%C3%B6k.jpg",
  "summary": "Arius was a Cyrenaic presbyter, ascetic, and priest in Alexandria, Egypt. His teachings about the nature of the Godhead, which emphasized the Father's divinity over the Son, and his opposition to what would become the Nicene Creed, made him a primary topic of the First Council of Nicaea.",
  "keyQuotes": [
    "There was a time when the Son was not."
  ],
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
import heresiarch_id from './heresiarch-id.json';
```

**Export statement:**
Add to the `export default` array:
```typescript
export default [
  // ... existing imports
  heresiarch_id,
];
```

**Important:**
- Maintain alphabetical order in imports (optional but helpful)
- Ensure comma after last item if not the last entry
- Check for missing commas

### 6. **Run Linting Checks**

After adding heresiarchs, always run:

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
- Verify `orthodoxyStatus` is set to `"heresiarch"`

## Quick Checklist

Before considering a heresiarch addition complete:

- [ ] Checked for existing heresiarchs: `npm run check:saint "Name"`
- [ ] Calculated correct century from death year
- [ ] Added missing places to `places.json`
- [ ] Created JSON file with all required fields
- [ ] Verified `orthodoxyStatus` is `"heresiarch"` (not `"canonized"` or `"blessed"`)
- [ ] Verified name does **not** have "St." prefix
- [ ] Verified no `feastDay` field (unless historically significant for other reasons)
- [ ] Generated/updated index files: `npm run generate:indexes`
- [ ] Ran `npm run lint:centuries` - no errors
- [ ] Ran `npm run lint:duplicates` - no errors
- [ ] Ran `npm run lint:images` - all images valid (or fixed with `npm run fix:images`)
- [ ] Ran `npm run build` - successful

## Common Mistakes to Avoid

1. **❌ Creating duplicates** - Always check first!
2. **❌ Wrong century folder** - Use death year, not birth year
3. **❌ Missing places** - Add all referenced places to `places.json`
4. **❌ Adding "St." prefix** - Heresiarchs should not have "St." in their name
5. **❌ Wrong orthodoxyStatus** - Must be `"heresiarch"`, not `"canonized"` or `"blessed"`
6. **❌ Including feastDay** - Heresiarchs typically don't have feast days
7. **❌ Missing commas** - Check index.ts files for syntax errors (or just run `npm run generate:indexes`)
8. **❌ Wrong import names** - Use kebab-case file name, convert to snake_case for import (or use `npm run generate:indexes`)
9. **❌ Forgetting to update index.ts** - Run `npm run generate:indexes` after adding files

## Batch Adding Heresiarchs

When adding multiple heresiarchs:

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
- Adding new heresiarchs
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

After adding heresiarchs, verify that all image URLs are valid:

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
   - Update the `imageUrl` field in the heresiarch's JSON file
   - Re-run `npm run lint:images` to verify the fix

**Note:** The image verification script checks that URLs return valid image content types. Broken links, 404 errors, or non-image content will be flagged. Always verify images after adding new heresiarchs to ensure they display correctly in the application.

## Historical Context Notes

When adding heresiarchs, consider:

- **Heresy name**: Note which heresy they are associated with (e.g., Arianism, Nestorianism, Pelagianism)
- **Council responses**: Mention which councils condemned their teachings (e.g., First Council of Nicaea, Council of Ephesus)
- **Historical impact**: Describe the influence and spread of their teachings
- **Orthodox response**: Note key orthodox figures who responded to their teachings
- **Reconciliation**: If applicable, note if they recanted or were reconciled to the Church

These details should be included in the `summary` field to provide proper historical context.

## Example: Adding a New Heresiarch

Let's say you want to add "Nestorius" (5th century):

1. **Check if it exists:**
   ```bash
   npm run check:saint "Nestorius"
   ```

2. **Determine century:**
   - Death year: ~451
   - Century: `Math.ceil(451 / 100) = 5` → `century-5`

3. **Check if places exist:**
   ```bash
   grep -i "constantinople\|antioch" src/data/places.json
   ```
   If not, add them to `places.json`.

4. **Create JSON file:** `src/data/people/century-5/nestorius.json`
   ```json
   {
     "id": "nestorius",
     "name": "Nestorius",
     "birthYear": 386,
     "deathYear": 451,
     "primaryTradition": "Greek",
     "roles": ["bishop", "theologian"],
     "orthodoxyStatus": "heresiarch",
     "isMartyr": false,
     "locations": [
       {
         "placeId": "constantinople",
         "description": "Archbishop of Constantinople"
       }
     ],
     "wikipediaUrl": "https://en.wikipedia.org/wiki/Nestorius",
     "newAdventUrl": "https://www.newadvent.org/cathen/10755a.htm",
     "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/...",
     "summary": "Nestorius was Archbishop of Constantinople from 428 to 431. His teachings about the nature of Christ, particularly his rejection of the title Theotokos (God-bearer) for Mary, led to his condemnation at the Council of Ephesus in 431. Nestorianism, named after him, was declared heretical, though modern scholarship questions whether Nestorius actually held the views attributed to him.",
     "keyQuotes": [
       "I cannot call God a two or three months old child."
     ],
     "writings": []
   }
   ```

5. **Generate indexes:**
   ```bash
   npm run generate:indexes
   ```

6. **Verify:**
   ```bash
   npm run lint:centuries
   npm run lint:duplicates
   npm run lint:images
   npm run build
   ```



