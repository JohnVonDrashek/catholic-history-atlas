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

# Verify all Wikipedia URLs are valid
npm run fix:wikipedia

# Verify all New Advent URLs are valid
npm run lint:newadvent

# Verify all My Catholic Life links are valid
npm run integrate:mycatholic
```

**If errors are found:**
- Fix century placement using: `node fix-century-placement.js`
- Remove duplicate entries
- Fix any syntax errors in index files
- Fix broken images using: `npm run fix:images` (see "Verify and Fix Images" section below)
- Fix broken Wikipedia URLs using: `npm run fix:wikipedia` (see "Verify and Fix Wikipedia URLs" section below)
- Fix broken New Advent URLs using: `npm run lint:newadvent:fix` (see "Verify New Advent URLs" section below)

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
- [ ] Ran `npm run fix:wikipedia` - all Wikipedia URLs valid (or fixed)
- [ ] Ran `npm run lint:newadvent` - all New Advent URLs valid (or fixed)
- [ ] Ran `npm run find:newadvent` - added missing New Advent URLs where available
- [ ] Ran `npm run integrate:mycatholic` - My Catholic Life links added where available
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
   - `npm run fix:wikipedia` (fix any broken Wikipedia URLs)
   - `npm run lint:newadvent` (check New Advent URLs)
   - `npm run find:newadvent` (add missing New Advent URLs)
   - `npm run integrate:mycatholic` (add My Catholic Life links where available)
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

### Verify and Fix Wikipedia URLs

After adding saints, verify that all Wikipedia URLs are valid and point to correct articles:

```bash
npm run fix:wikipedia
```

This will:
- Check all person JSON files for `wikipediaUrl` fields
- Verify that each URL resolves to a valid Wikipedia article
- Automatically search for and fix broken or incorrect URLs
- **Use cached results** for previously verified URLs (cache expires after 30 days)

**Note:** The first run will be slower as it verifies all URLs. Subsequent runs will be much faster as results are cached in `.wikipedia-cache.json`. The cache file is automatically created and ignored by git.

**If URLs need fixing:**

1. **Automatic fix (recommended):**
   ```bash
   npm run fix:wikipedia saint-id-1 saint-id-2
   ```
   This will automatically search Wikipedia and update URLs for specific saints.

2. **Check all saints:**
   ```bash
   npm run fix:wikipedia
   ```
   This processes all saints in the database.

3. **Manual fix:**
   - Review the URLs in the saint's JSON file
   - Search Wikipedia directly for the correct article
   - Update the `wikipediaUrl` field manually
   - Re-run `npm run fix:wikipedia` to verify the fix

**Note:** The Wikipedia verification script ensures URLs point to actual saint articles, not disambiguation pages or unrelated content. Always verify Wikipedia URLs after adding new saints to ensure they link to the correct biographical information.

### Integrate My Catholic Life! Data

Add links to comprehensive biographical information from [My Catholic Life!](https://mycatholic.life/saints/), a rich resource with detailed saint biographies:

```bash
npm run integrate:mycatholic
```

This will:
- Search for individual liturgical calendar pages for each saint
- Add `myCatholicLifeUrl` field linking directly to detailed saint biographies
- **Use cached results** for previously processed saints (cache expires after 30 days)

**Enhanced JSON structure:**
```json
{
  "id": "francis-xavier",
  "name": "St. Francis Xavier",
  // ... existing fields ...
  "myCatholicLifeUrl": "https://mycatholic.life/saints/saints-of-the-liturgical-year/december-3---saint-francis-xavier-priest--memorial"
}
```

**Note:** My Catholic Life! provides extensive biographical content and high-quality images for many saints. Links go directly to individual saint pages in their liturgical calendar, offering comprehensive biographies with historical context and spiritual insights. Use `npm run integrate:mycatholic:cleanup` to remove all My Catholic Life links if needed.

### Verify New Advent URLs

Check if existing New Advent Catholic Encyclopedia links are still valid:

```bash
npm run lint:newadvent
```

This will:
- Check all person JSON files for `newAdventUrl` fields
- Verify that each URL resolves to a valid page (not 404)
- Check that page content matches the saint's name
- Cross-reference with alphabetical index pages (a.htm, b.htm, etc.)
- Report saints with broken, invalid, or incorrect New Advent links
- **Use cached results** for previously verified URLs (cache expires after 30 days)

**Example output:**
```
Valid URLs: 18
Missing URLs: 744
Invalid URLs: 0
Wrong Saint URLs: 0
```

**Validation Types:**
- **Valid URLs**: Links that work and point to Catholic Encyclopedia pages
- **Missing URLs**: Saints without any New Advent links (acceptable)
- **Invalid URLs**: Broken/missing web pages
- **Wrong Saint URLs**: Links that work but point to different saints (rare, usually removed)

**If invalid URLs are found:**

1. **Automatic cleanup (recommended):**
   ```bash
   npm run lint:newadvent:fix
   ```
   This will automatically remove invalid and incorrect New Advent URLs from saint records.

2. **Add missing URLs:**
   ```bash
   npm run find:newadvent
   ```
   This will scan New Advent's alphabetical index pages and add valid URLs for saints that have encyclopedia entries. Only verified, correct URLs are added.

2. **Manual fix:**
   - Review the invalid URLs listed by `npm run lint:newadvent`
   - Search New Advent for the correct article
   - Update the `newAdventUrl` field manually
   - Re-run `npm run lint:newadvent` to verify the fix

**Note:** The script performs comprehensive validation:
- **URL Accessibility**: Checks if links return valid HTTP responses
- **Content Matching**: Verifies the page actually describes the correct saint
- **Index Validation**: Cross-references with New Advent's alphabetical index pages (informational only)

**Important:** Valid Catholic Encyclopedia URLs are trusted even if not found on index pages, as the index parsing may be incomplete. Only clearly wrong or broken URLs are removed.

New Advent URLs can become invalid over time as the site evolves. This enhanced linting ensures all external links remain both functional and accurate. The Catholic Encyclopedia content is valuable for historical and theological context.

