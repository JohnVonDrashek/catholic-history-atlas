// Service Worker for image caching and resizing
const CACHE_NAME = 'image-cache-v1';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max cache size

// Default max dimensions for different contexts
const DEFAULT_SIZES = {
  map: 80,      // Map markers
  timeline: 150, // Timeline portraits
  modal: 400,   // Detail modals
  default: 300  // Fallback
};

// Helper to get max dimension from URL
function getMaxDimension(url) {
  const urlObj = new URL(url, self.location.origin);
  const sizeHint = urlObj.searchParams.get('maxSize');
  const context = urlObj.searchParams.get('context');
  
  if (sizeHint) {
    return parseInt(sizeHint, 10);
  }
  
  if (context && DEFAULT_SIZES[context]) {
    return DEFAULT_SIZES[context];
  }
  
  return DEFAULT_SIZES.default;
}

// Resize image using ImageBitmap and OffscreenCanvas (works in service worker)
async function resizeImage(blob, maxDimension) {
  try {
    // Validate blob
    if (!blob || blob.size === 0) {
      throw new Error('Invalid or empty image blob');
    }
    
    const blobType = blob.type || '';
    
    // Skip SVG images - they're vector graphics and don't need resizing
    // Also, createImageBitmap may not work reliably with SVGs
    if (blobType.includes('svg') || blobType === 'image/svg+xml') {
      throw new Error('SVG images do not need resizing');
    }
    
    // Create ImageBitmap from blob with error handling
    let imageBitmap;
    try {
      // createImageBitmap options for better compatibility
      imageBitmap = await createImageBitmap(blob, {
        imageOrientation: 'none',
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      });
    } catch (decodeError) {
      // If decoding fails, it might be a CORS issue or invalid image
      console.error('Failed to decode image:', {
        size: blob.size,
        type: blobType,
        error: decodeError.message
      });
      throw new Error(`Image decode failed: ${decodeError.message}`);
    }
    
    // Validate image dimensions
    if (imageBitmap.width === 0 || imageBitmap.height === 0) {
      imageBitmap.close();
      throw new Error('Image has zero dimensions');
    }
    
    // Calculate new dimensions maintaining aspect ratio
    let width = imageBitmap.width;
    let height = imageBitmap.height;
    
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height / width) * maxDimension);
        width = maxDimension;
      } else {
        width = Math.round((width / height) * maxDimension);
        height = maxDimension;
      }
    }
    
    // Ensure minimum dimensions
    width = Math.max(1, width);
    height = Math.max(1, height);
    
    // Create OffscreenCanvas (available in service workers)
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      imageBitmap.close();
      throw new Error('Failed to get canvas context');
    }
    
    // Draw and convert to blob
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Convert to blob (try WebP first, fallback to JPEG)
    let resizedBlob;
    try {
      resizedBlob = await canvas.convertToBlob({
        type: 'image/webp',
        quality: 0.85
      });
    } catch (error) {
      // Fallback to JPEG if WebP is not supported
      resizedBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.85
      });
    }
    
    // Clean up
    imageBitmap.close();
    
    return resizedBlob;
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
}

// Get cache size (approximate)
async function getCacheSize() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  let totalSize = 0;
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  return totalSize;
}

// Clean old cache entries if needed
async function cleanCacheIfNeeded() {
  const currentSize = await getCacheSize();
  
  if (currentSize > MAX_CACHE_SIZE) {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    // Sort by URL (simple strategy - could be improved with LRU)
    // For now, just delete oldest entries
    const keysToDelete = keys.slice(0, Math.floor(keys.length * 0.3));
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intercept image requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle image requests
  if (!url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && 
      !event.request.headers.get('accept')?.includes('image')) {
    return; // Let browser handle non-image requests
  }
  
  // Skip if it's already a data URL or blob URL
  if (url.protocol === 'data:' || url.protocol === 'blob:') {
    return;
  }
  
  // Skip SVG files - they're vector graphics and don't benefit from resizing
  if (url.pathname.match(/\.svg$/i)) {
    return; // Let browser handle SVG files directly
  }
  
  event.respondWith(
    (async () => {
      try {
        const requestUrl = new URL(event.request.url);
        const maxDimension = getMaxDimension(event.request.url);
        
        // Create cache key with maxSize
        const cacheKeyUrl = new URL(requestUrl);
        cacheKeyUrl.searchParams.set('maxSize', maxDimension.toString());
        const cacheKey = cacheKeyUrl.toString();
        
        // Check cache first
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(cacheKey);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Fetch original image (strip cache params for the fetch)
        const originalUrl = new URL(requestUrl);
        originalUrl.searchParams.delete('context');
        originalUrl.searchParams.delete('maxSize');
        
        // Create new request with proper mode for cross-origin image fetching
        const originalRequest = new Request(originalUrl.toString(), {
          method: 'GET',
          mode: 'cors', // Allow cross-origin requests for images
          cache: 'default',
        });
        
        const response = await fetch(originalRequest);
        
        if (!response.ok) {
          return response;
        }
        
        // Validate content type
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
          // Not an image, return as-is
          return response;
        }
        
        // Clone response to read blob
        const blob = await response.clone().blob();
        
        // Validate blob
        if (!blob || blob.size === 0) {
          console.warn('Empty or invalid image blob, returning original');
          return response;
        }
        
        // Try to resize image, but fallback to original if it fails
        let resizedBlob;
        try {
          resizedBlob = await resizeImage(blob, maxDimension);
        } catch (resizeError) {
          console.warn('Failed to resize image, using original:', resizeError);
          // Return original response if resizing fails
          return response;
        }
        
        // Create new response with resized image
        const resizedResponse = new Response(resizedBlob, {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': resizedBlob.type,
            'Content-Length': resizedBlob.size.toString(),
            'Cache-Control': 'public, max-age=31536000', // 1 year
          },
        });
        
        // Cache the resized version
        await cache.put(cacheKey, resizedResponse.clone());
        
        // Clean cache if needed
        await cleanCacheIfNeeded();
        
        return resizedResponse;
      } catch (error) {
        console.error('Service Worker image processing error:', error);
        // Fallback to original fetch
        return fetch(event.request);
      }
    })()
  );
});
