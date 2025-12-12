# Finding and Verifying Wikipedia Commons Image URLs

## Problem

When adding images from Wikipedia Commons, it's important to verify that the URLs actually work before adding them to the data files. Guessing URL structures often results in 404 errors.

## Solution: Use Commons File Pages to Get Actual URLs

### Step 1: Find the Commons File Page

1. Search for the image on Wikipedia Commons or use the Wikipedia article's image link
2. Navigate to the Commons file page (e.g., `https://commons.wikimedia.org/wiki/File:Pope_Martin_I_Illustration_(no_border).jpg`)

### Step 2: Extract the Actual Image URL

Use curl to extract the actual upload URL from the Commons file page:

```bash
curl -s "https://commons.wikimedia.org/wiki/File:Pope_Martin_I_Illustration_(no_border).jpg" | grep -o 'https://upload.wikimedia.org/wikipedia/commons/[^"]*\.jpg' | head -1
```

This will return something like:
```
https://upload.wikimedia.org/wikipedia/commons/5/59/Pope_Martin_I_Illustration_%28no_border%29.jpg
```

### Step 3: Convert to Thumbnail URL

For thumbnails (recommended for performance), convert the full URL to a thumbnail URL:

**Pattern:**
- Full URL: `https://upload.wikimedia.org/wikipedia/commons/[path]/[filename].jpg`
- Thumb URL: `https://upload.wikimedia.org/wikipedia/commons/thumb/[path]/[filename].jpg/330px-[filename].jpg`

**Example:**
- Full: `https://upload.wikimedia.org/wikipedia/commons/5/59/Pope_Martin_I_Illustration_%28no_border%29.jpg`
- Thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Pope_Martin_I_Illustration_%28no_border%29.jpg/330px-Pope_Martin_I_Illustration_%28no_border%29.jpg`

### Step 4: Verify the URL Works

Always test the URL before adding it to the data:

```bash
curl -s -o /dev/null -w "%{http_code}" "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Pope_Martin_I_Illustration_%28no_border%29.jpg/330px-Pope_Martin_I_Illustration_%28no_border%29.jpg"
```

Expected output: `200` (success)

### Step 5: Batch Processing Multiple Images

For multiple images, you can process them in a loop:

```bash
for pope in "Pope_Vitalian" "Pope_Agatho" "Pope_Leo_II"; do
  echo "=== $pope ==="
  url=$(curl -s "https://commons.wikimedia.org/wiki/File:${pope}.jpg" 2>/dev/null | grep -o 'https://upload.wikimedia.org/wikipedia/commons/[^"]*\.jpg' | head -1)
  if [ -n "$url" ]; then
    # Extract path and filename
    path=$(echo "$url" | sed 's|https://upload.wikimedia.org/wikipedia/commons/||; s|/[^/]*\.jpg$||')
    filename=$(basename "$url")
    thumb_url="https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${filename}/330px-${filename}"
    # Verify it works
    status=$(curl -s -o /dev/null -w "%{http_code}" "$thumb_url")
    echo "$thumb_url (Status: $status)"
  fi
done
```

## Important Notes

1. **Always verify URLs**: Never add image URLs without testing them first
2. **Use thumbnail URLs**: For better performance, use the `/thumb/` URLs with a size parameter (e.g., `330px`)
3. **URL encoding**: Some filenames contain special characters that need URL encoding (e.g., `%28` for `(`, `%29` for `)`)
4. **File extensions**: Make sure to preserve the correct file extension (`.jpg`, `.png`, etc.)
5. **Rate limiting**: Be aware that Wikimedia may rate limit requests if you make too many too quickly

## Alternative: Direct Commons Search

If you know the exact filename, you can also construct the URL directly:

1. Go to `https://commons.wikimedia.org/wiki/File:[filename]`
2. Click "Use this file on the web"
3. Copy the direct URL or thumbnail URL provided

## Example Workflow

```bash
# 1. Find the Commons file page URL
COMMONS_URL="https://commons.wikimedia.org/wiki/File:Pope_Martin_I_Illustration_(no_border).jpg"

# 2. Extract the actual image URL
FULL_URL=$(curl -s "$COMMONS_URL" | grep -o 'https://upload.wikimedia.org/wikipedia/commons/[^"]*\.jpg' | head -1)

# 3. Convert to thumbnail URL
PATH_PART=$(echo "$FULL_URL" | sed 's|https://upload.wikimedia.org/wikipedia/commons/||; s|/[^/]*\.jpg$||')
FILENAME=$(basename "$FULL_URL")
THUMB_URL="https://upload.wikimedia.org/wikipedia/commons/thumb/${PATH_PART}/${FILENAME}/330px-${FILENAME}"

# 4. Verify it works
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$THUMB_URL")
if [ "$STATUS" = "200" ]; then
  echo "✓ Valid URL: $THUMB_URL"
else
  echo "✗ Invalid URL (Status: $STATUS): $THUMB_URL"
fi
```

## Troubleshooting

- **404 errors**: The file might not exist with that exact name, or the path structure is wrong
- **429 errors**: Rate limiting - wait a moment before trying again
- **Special characters**: Make sure URL encoding is correct (spaces become `%20`, parentheses become `%28`/`%29`, etc.)
