import { describe, it, expect, beforeEach } from 'vitest';
import { getCachedImageUrl } from '../imageCache';

describe('imageCache', () => {
  beforeEach(() => {
    // Reset window.location for each test
    delete (window as { location?: unknown }).location;
    (window as { location: { origin: string } }).location = {
      origin: 'http://localhost:3000',
    };
  });

  describe('getCachedImageUrl', () => {
    it('returns undefined for undefined input', () => {
      expect(getCachedImageUrl(undefined)).toBeUndefined();
    });

    it('returns original URL for data URLs', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg';
      expect(getCachedImageUrl(dataUrl)).toBe(dataUrl);
    });

    it('returns original URL for blob URLs', () => {
      const blobUrl = 'blob:http://localhost/123-456';
      expect(getCachedImageUrl(blobUrl)).toBe(blobUrl);
    });

    it('adds context parameter to URL', () => {
      const url = 'https://example.com/image.jpg';
      const result = getCachedImageUrl(url, 'map');

      expect(result).toContain('context=map');
      expect(result).toContain('https://example.com/image.jpg');
    });

    it('adds maxSize parameter when provided', () => {
      const url = 'https://example.com/image.jpg';
      const result = getCachedImageUrl(url, 'timeline', 200);

      expect(result).toContain('context=timeline');
      expect(result).toContain('maxSize=200');
    });

    it('uses default context when not provided', () => {
      const url = 'https://example.com/image.jpg';
      const result = getCachedImageUrl(url);

      expect(result).toContain('context=default');
    });

    it('handles relative URLs', () => {
      const url = '/images/saint.jpg';
      const result = getCachedImageUrl(url, 'modal');

      expect(result).toContain('http://localhost:3000/images/saint.jpg');
      expect(result).toContain('context=modal');
    });

    it('overwrites existing query parameters', () => {
      const url = 'https://example.com/image.jpg?context=old&maxSize=100';
      const result = getCachedImageUrl(url, 'map', 300);

      expect(result).toContain('context=map');
      expect(result).toContain('maxSize=300');
      expect(result).not.toContain('context=old');
      expect(result).not.toContain('maxSize=100');
    });

    it('preserves other query parameters', () => {
      const url = 'https://example.com/image.jpg?foo=bar&baz=qux';
      const result = getCachedImageUrl(url, 'timeline');

      expect(result).toContain('foo=bar');
      expect(result).toContain('baz=qux');
      expect(result).toContain('context=timeline');
    });

    it('handles URLs with fragments', () => {
      const url = 'https://example.com/image.jpg#section';
      const result = getCachedImageUrl(url, 'modal');

      expect(result).toContain('context=modal');
      expect(result).toContain('#section');
    });

    it('returns original URL on parsing failure', () => {
      // Mock URL constructor to throw
      const originalURL = globalThis.URL;
      globalThis.URL = class {
        constructor() {
          throw new Error('Invalid URL');
        }
      } as unknown as typeof URL;

      const url = 'invalid-url';
      const result = getCachedImageUrl(url);

      expect(result).toBe(url);

      // Restore URL constructor
      globalThis.URL = originalURL;
    });
  });
});
