# Protocol for Adding Basilicas to Catholic History Atlas

This protocol ensures basilicas are added correctly without duplicates or errors.

## Step-by-Step Process

### 1. **Check if Basilica Already Exists** ⚠️ CRITICAL FIRST STEP

Before creating any entries, always check if the basilica already exists using the automated script:

```bash
# Check for existing basilicas (recommended)
npm run check:basilica "Basilica Name 1" "Basilica Name 2" ...

# Or use the script directly
node check-basilica-exists.js "Basilica Name"
```

**Examples:**
- `npm run check:basilica "St. Peter's Basilica" "Our Lady of Guadalupe"`
- `npm run check:basilica "Hagia Sophia" "Basilica of the Annunciation"`

**The script will:**
- Search for exact matches, partial matches, and similar names
- Show match scores and details (place, type, start year)
- Exit with error code if matches are found (so you can review before adding)

**If matches are found:**
- Review the existing entry details shown by the script
- If it's the same basilica, **DO NOT CREATE A DUPLICATE**
- If it's a different basilica with a similar name, use a more specific ID (e.g., `st-peter-rome` vs `st-peter-antioch`)

**If no matches found:**
- Proceed to next step

**Alternative manual check:**
```bash
# Search in basilicas.json manually
grep -i "basilica-name" src/data/basilicas.json
```

### 2. **Check Required Place**

Before creating the basilica entry, verify that the place exists in `places.json`:

```bash
# Check if place exists
grep -i "place-name" src/data/places.json
```

**If place doesn't exist:**
- Add it to `src/data/places.json` with proper coordinates
- Include: `id`, `name`, `lat`, `lng`, `region`, `modernCountry`

### 3. **Determine Basilica Type**

Choose the appropriate type based on the basilica's status:

- `"major-basilica"`: One of the four major basilicas in Rome (St. Peter's, St. John Lateran, St. Paul Outside the Walls, St. Mary Major)
- `"papal-basilica"`: Basilica designated by the Pope (minor basilicas with special papal privileges)
- `"patriarchal-basilica"`: Patriarchal basilica (e.g., Hagia Sophia, major Eastern churches)
- `"historic-basilica"`: Historically significant basilica (e.g., Holy Sepulchre, Basilica of the Nativity)

### 4. **Create Basilica Entry**

Add the entry to `src/data/basilicas.json` (maintain alphabetical order by `id` if possible).

**Required fields:**
- `id`: kebab-case, unique identifier (e.g., `st-peters-basilica`)
- `name`: Full name of the basilica (e.g., `"St. Peter's Basilica"`)
- `placeId`: Reference to a place in `places.json` (must exist)
- `type`: One of the four basilica types (see above)
- `startYear`: Number (optional) - When built/consecrated
- `endYear`: Number (optional) - When destroyed or converted (if applicable)
- `description`: String (optional) - Brief description of the basilica's importance
- `imageUrl`: String (optional) - Full image URL (preferably from Wikimedia Commons, higher resolution recommended - 800-1200px width)
- `wikipediaUrl`: String (optional) - Full Wikipedia URL
- `newAdventUrl`: String (optional) - Full New Advent URL (if available)

**Example structure:**
```json
{
  "id": "st-peters-basilica",
  "name": "St. Peter's Basilica",
  "placeId": "rome",
  "type": "major-basilica",
  "startYear": 1506,
  "description": "One of the four major basilicas of Rome, built over the tomb of St. Peter. The current basilica was constructed in the 16th-17th centuries, replacing the original Constantinian basilica.",
  "wikipediaUrl": "https://en.wikipedia.org/wiki/St._Peter%27s_Basilica",
  "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg/1200px-Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg"
}
```

**Important notes:**
- The `basilicas.json` file is a single array - add new entries to this array
- Maintain proper JSON formatting (commas, brackets)
- Keep entries in a logical order (alphabetical by `id` is recommended but not required)

### 5. **Verify JSON Syntax and Check for Duplicates**

After adding the entry, verify the JSON is valid and check for duplicates:

```bash
# Check for duplicates and validate all fields (recommended)
npm run lint:basilicas

# Or check JSON syntax manually
node -e "JSON.parse(require('fs').readFileSync('src/data/basilicas.json', 'utf8'))"
```

**The `lint:basilicas` script will check:**
- Duplicate IDs
- Missing required fields (id, name, placeId, type)
- Invalid basilica types
- Invalid or missing placeIds

**If errors are found:**
- Fix JSON syntax errors (missing commas, brackets, quotes)
- Ensure all strings are properly quoted
- Check for trailing commas
- Fix duplicate IDs (use unique IDs)
- Ensure all placeIds exist in `places.json`

### 6. **Find and Add Images** ⚠️ REQUIRED STEP

**You MUST verify and fix images after adding basilicas:**

```bash
# Automatically fix all broken/missing images (REQUIRED)
node find-basilica-images.js fix
```

This script will:
- Check all basilicas for missing or broken image URLs
- Search for replacement images from Wikipedia/Wikimedia Commons
- Update `basilicas.json` with found images
- Skip basilicas that already have valid images (using cache for speed)

**Alternative methods:**

```bash
# Find images for a specific basilica
node find-basilica-images.js find <basilica-id>

# Interactive mode to review images before updating
node find-basilica-images.js interactive
```

**Manual image search:**
- Search Wikipedia or Wikimedia Commons for images
- Prefer high-resolution images (800-1200px width for basilicas)
- Use Wikimedia Commons URLs when possible
- Verify the image URL is accessible

**Important:** The `find-basilica-images.js fix` command uses caching, so it will be fast on subsequent runs. Always run this after adding new basilicas to ensure all images are valid.

### 7. **Build and Verify**

Run the build to ensure everything compiles:

```bash
npm run build
```

**If build fails:**
- Check TypeScript errors
- Verify all `placeId` references exist in `places.json`
- Ensure JSON syntax is valid
- Check that all required fields are present

## Quick Checklist

Before considering a basilica addition complete:

- [ ] Checked for existing basilicas: `npm run check:basilica "Basilica Name"`
- [ ] Verified place exists in `places.json` (or added it)
- [ ] Determined correct basilica type
- [ ] Added entry to `basilicas.json` with all required fields
- [ ] Verified JSON syntax is valid
- [ ] Ran `npm run lint:basilicas` - no errors
- [ ] **Ran `node find-basilica-images.js fix` - verified/fixed all images** ⚠️ REQUIRED
- [ ] Ran `npm run build` - successful

## Common Mistakes to Avoid

1. **❌ Creating duplicates** - Always check first!
2. **❌ Missing placeId** - Ensure the place exists in `places.json`
3. **❌ Invalid placeId** - The `placeId` must exactly match an `id` in `places.json`
4. **❌ Wrong type** - Use the correct basilica type
5. **❌ JSON syntax errors** - Missing commas, brackets, or quotes
6. **❌ Invalid image URLs** - Verify images are accessible

## Batch Adding Basilicas

When adding multiple basilicas:

1. Check all names first: `npm run check:basilica "Name 1" "Name 2" "Name 3"`
2. Verify all places exist (or add them to `places.json`)
3. Add all entries to `basilicas.json`
4. Verify JSON syntax and check for duplicates: `npm run lint:basilicas`
5. **Find and fix images for all basilicas: `node find-basilica-images.js fix`** ⚠️ REQUIRED
6. Build and verify: `npm run build`

## Automated Tools

### Check Basilica Exists

```bash
npm run check:basilica "Basilica Name 1" "Basilica Name 2" ...
```

This will:
- Search for exact matches, partial matches, and similar names
- Show match scores and details (place, type, start year)
- Exit with error code if matches are found

**Example:**
```bash
npm run check:basilica "St. Peter's Basilica" "Our Lady of Guadalupe"
```

### Lint Basilicas (Check Duplicates and Validate)

```bash
npm run lint:basilicas
```

This will check:
- Duplicate IDs
- Missing required fields (id, name, placeId, type)
- Invalid basilica types
- Invalid or missing placeIds

**Example:**
```bash
npm run lint:basilicas
```

### Find Basilica Images

```bash
# Find images for a specific basilica
node find-basilica-images.js find <basilica-id>
```

This will:
- Search the basilica's Wikipedia page for images
- Search Wikimedia Commons for images matching the basilica name
- Try name variations (e.g., "St." vs "Saint")
- Display found images with URLs and sizes

**Example:**
```bash
node find-basilica-images.js find st-peters-basilica
```

### Fix All Broken/Missing Images

```bash
node find-basilica-images.js fix
```

This will automatically:
- Check all basilicas for missing or broken image URLs
- Search for replacement images from Wikipedia/Wikimedia Commons
- Update `basilicas.json` with found images
- Skip basilicas that already have valid images

**Note:** This process may take some time as it checks each basilica and searches for images. Be patient and let it complete.

### Interactive Image Fix

```bash
node find-basilica-images.js interactive
```

This provides an interactive interface to:
- Review basilicas that need image fixes
- See all available image options for each basilica
- Automatically use the first (best) result for each basilica

**Note:** The interactive mode currently auto-selects the first result. You can manually edit `basilicas.json` if you prefer a different image.

## Image Guidelines

- **Resolution**: Prefer higher resolution images (800-1200px width) for basilicas since they are architectural landmarks
- **Source**: Wikimedia Commons is preferred for reliable, high-quality images
- **Format**: JPG or PNG formats are preferred
- **Content**: Use exterior views of the basilica when possible, showing the main facade or a recognizable view
- **Verification**: Always verify image URLs are accessible before committing

## Example: Adding a New Basilica

Let's say you want to add "Basilica of St. Mark" in Venice:

1. **Check if it exists:**
   ```bash
   grep -i "st. mark\|san marco" src/data/basilicas.json
   ```

2. **Check if Venice exists in places.json:**
   ```bash
   grep -i "venice" src/data/places.json
   ```
   If not, add it:
   ```json
   {
     "id": "venice",
     "name": "Venice",
     "lat": 45.44,
     "lng": 12.32,
     "region": "Italy",
     "modernCountry": "Italy"
   }
   ```

3. **Add to basilicas.json:**
   ```json
   {
     "id": "st-mark-venice",
     "name": "Basilica of St. Mark",
     "placeId": "venice",
     "type": "papal-basilica",
     "startYear": 1063,
     "description": "The cathedral church of the Roman Catholic Archdiocese of Venice. Famous for its Byzantine architecture and golden mosaics.",
     "wikipediaUrl": "https://en.wikipedia.org/wiki/St_Mark%27s_Basilica",
     "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/..."
   }
   ```

4. **Find and verify images (REQUIRED):**
   ```bash
   # Fix all broken/missing images
   node find-basilica-images.js fix
   
   # Or find image for specific basilica
   node find-basilica-images.js find st-mark-venice
   ```

5. **Verify and build:**
   ```bash
   npm run lint:basilicas
   npm run build
   ```

## Notes

- Unlike saints (which are organized by century folders), basilicas are stored in a single `basilicas.json` file
- There are no index files to update for basilicas
- The `placeId` field is critical - it must match exactly with an `id` in `places.json`
- Basilica types help categorize the importance and status of each basilica
- Images are optional but highly recommended for better visualization in the atlas

