import { useState, useCallback, useEffect } from 'react';

interface UseImageFallbackOptions {
  /** URL of the image to load */
  src?: string;
  /** Fallback URL if primary image fails to load */
  fallbackSrc?: string;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Callback when image loads successfully */
  onLoad?: () => void;
}

interface UseImageFallbackReturn {
  /** The current image source (primary or fallback) */
  imageSrc: string | undefined;
  /** Whether the image failed to load */
  failed: boolean;
  /** Whether the image is currently loading */
  loading: boolean;
  /** Error handler for img onError event */
  handleError: () => void;
  /** Load handler for img onLoad event */
  handleLoad: () => void;
}

/**
 * Hook to handle image loading with fallback support
 *
 * @example
 * ```tsx
 * const { imageSrc, failed, loading, handleError, handleLoad } = useImageFallback({
 *   src: person.imageUrl,
 *   fallbackSrc: '/placeholder.png',
 * });
 *
 * return (
 *   <img
 *     src={imageSrc}
 *     onError={handleError}
 *     onLoad={handleLoad}
 *     alt={person.name}
 *   />
 * );
 * ```
 */
export function useImageFallback({
  src,
  fallbackSrc,
  onError,
  onLoad,
}: UseImageFallbackOptions): UseImageFallbackReturn {
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(!!src);
  const [usedFallback, setUsedFallback] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setImageSrc(src);
    setFailed(false);
    setLoading(!!src);
    setUsedFallback(false);
  }, [src]);

  const handleError = useCallback(() => {
    // If we haven't tried the fallback yet and one exists, use it
    if (!usedFallback && fallbackSrc) {
      setImageSrc(fallbackSrc);
      setUsedFallback(true);
      setLoading(true);
    } else {
      // No fallback or fallback also failed
      setFailed(true);
      setLoading(false);
      onError?.();
    }
  }, [fallbackSrc, usedFallback, onError]);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setFailed(false);
    onLoad?.();
  }, [onLoad]);

  return {
    imageSrc,
    failed,
    loading,
    handleError,
    handleLoad,
  };
}
