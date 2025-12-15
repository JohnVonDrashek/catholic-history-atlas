# Protocol for Adding Councils

## Interactive Method (Recommended)

Run the interactive helper script:

```bash
npm run add:council
```

The script will:
1. ✓ Check for duplicates automatically
2. ✓ Calculate century from start year
3. ✓ Verify location exists in places.json (or help you add it)
4. ✓ Create properly formatted JSON file
5. ✓ Update index files automatically
6. ✓ Run duplicate checks

Follow the prompts to enter:
- Council name
- Start/end years
- Location
- URLs (Wikipedia, New Advent, image)
- Summary (2-3 sentences)
- Key documents

**After the script completes:**
```bash
npm run lint:images        # REQUIRED: Check/fix image URLs
npm run build              # Verify everything compiles
```

**IMPORTANT:** All councils must have valid images. If images are missing or broken:
```bash
npm run fix:images         # Auto-find and fix images
```

---

## Manual Method

If you need to create/edit files manually:

### 1. Check for Duplicates
```bash
npm run check:council "Council Name"
```

### 2. Create JSON File

**Location:** `src/data/events/century-X/council-name.json`
- Century = `Math.ceil(startYear / 100)`
- Councils use **start year** (not end year like saints)

**Template:** See `templates/council-template.json`

**Required fields:**
- `id` (kebab-case)
- `name`
- `startYear`
- `endYear`
- `type: "council"`

**Optional but recommended:**
- `locationId` (must exist in `places.json`)
- `wikipediaUrl`
- `newAdventUrl`
- `imageUrl`
- `summary`
- `keyDocuments` (array)

### 3. Update Indexes
```bash
node src/data/generate-events-indexes.js
```

### 4. Verify
```bash
npm run lint:duplicates    # Check for duplicate IDs
npm run lint:images        # REQUIRED: Verify image URLs
npm run fix:images         # Auto-fix any broken images
npm run build              # Verify TypeScript compilation
```

**All councils MUST have valid images before completion.**

---

## Adding Places

If location doesn't exist in `places.json`, add it:

```json
{
  "id": "place-id",
  "name": "Place Name",
  "lat": 0.0,
  "lng": 0.0,
  "region": "Region Name",
  "modernCountry": "Country"
}
```

Places are sorted alphabetically by `id`.

---

## Common Issues

- **Duplicates:** Always check first with `npm run check:council`
- **Wrong century:** Use start year, not end year
- **Missing location:** Add to `places.json` before referencing
- **Type field:** Must be `"council"` exactly
- **Index out of sync:** Run `node src/data/generate-events-indexes.js`

---

## Batch Adding

For multiple councils, use the interactive script multiple times, then run checks once at the end:

```bash
npm run add:council        # Repeat for each council
npm run lint:duplicates
npm run lint:images
npm run fix:images         # Fix any broken/missing images
npm run build
```

---

## Finding and Fixing Images

### All councils MUST have valid images

After adding councils, verify images:

```bash
npm run lint:images
```

This checks all `imageUrl` fields and reports:
- Broken/404 URLs
- Invalid image content
- Missing images

### Auto-fix broken images:

```bash
npm run fix:images         # Automatic fix
npm run fix:images:interactive  # Review before applying
```

The script will:
- Search Wikipedia/Wikimedia Commons
- Find appropriate council images
- Update JSON files automatically

### Manual image search:

1. Find council on Wikipedia
2. Look for historical depictions, manuscripts, or location images
3. Use Wikimedia Commons URLs (preferred)
4. Add to `imageUrl` field in JSON

**Best image sources:**
- Historical manuscripts/illuminations of the council
- Paintings depicting the council
- Buildings/locations where council met
- Contemporary artwork related to the council

