/**
 * Utility to add size hints to image URLs for service worker caching
 * The service worker will resize and cache images based on these hints
 */

export type ImageContext = 'map' | 'timeline' | 'modal' | 'default';

/**
 * Adds size hint parameters to an image URL for service worker processing
 * @param imageUrl Original image URL
 * @param context Context where image will be displayed (determines default size)
 * @param maxSize Optional explicit max dimension override
 * @returns URL with size hint parameters
 */
export function getCachedImageUrl(
  imageUrl: string | undefined,
  context: ImageContext = 'default',
  maxSize?: number
): string | undefined {
  if (!imageUrl) return undefined;
  
  // Skip if already a data URL or blob URL
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  
  try {
    // Handle both absolute and relative URLs
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      // If it's a relative URL, make it absolute
      url = new URL(imageUrl, window.location.origin);
    }
    
    // Add context parameter (will overwrite if exists, which is fine)
    url.searchParams.set('context', context);
    
    // Add explicit maxSize if provided (will overwrite if exists)
    if (maxSize) {
      url.searchParams.set('maxSize', maxSize.toString());
    }
    
    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return imageUrl;
  }
}
