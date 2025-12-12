import { useState } from 'react';
import type { OrthodoxyStatus } from '../types/person';
import { getCachedImageUrl } from '../utils/imageCache';
import '../styles/portrait-frames.css';

interface FigurePortraitProps {
  name: string;
  imageUrl: string;
  orthodoxyStatus: OrthodoxyStatus;
  isMartyr?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function FigurePortrait({
  name,
  imageUrl,
  orthodoxyStatus,
  isMartyr = false,
  size = 'medium',
}: FigurePortraitProps) {
  const [imgError, setImgError] = useState(false);
  // Get cached image URL for timeline context (150px max)
  const cachedImageUrl = getCachedImageUrl(imageUrl, 'timeline', 150);
  const [imgSrc, setImgSrc] = useState(cachedImageUrl || imageUrl);

  const baseClass = 'portrait-frame';

  const statusClass = (() => {
    if (isMartyr && (orthodoxyStatus === 'canonized' || orthodoxyStatus === 'blessed')) {
      return 'portrait-frame--martyr';
    }

    switch (orthodoxyStatus) {
      case 'canonized':
        return 'portrait-frame--saint';
      case 'blessed':
        return 'portrait-frame--blessed';
      case 'orthodox':
        return 'portrait-frame--orthodox';
      case 'schismatic':
        return 'portrait-frame--schismatic';
      case 'heresiarch':
        return 'portrait-frame--heresiarch';
      case 'secular':
      default:
        return 'portrait-frame--secular';
    }
  })();

  const tooltip = (() => {
    if (isMartyr && (orthodoxyStatus === 'canonized' || orthodoxyStatus === 'blessed')) {
      return 'Canonized martyr';
    }
    switch (orthodoxyStatus) {
      case 'canonized':
        return 'Canonized saint in communion with the Catholic Church';
      case 'blessed':
        return 'Beatified (Blessed)';
      case 'orthodox':
        return 'Important historical figure supportive of the Church';
      case 'schismatic':
        return 'Figure associated with a schism (rupture of communion)';
      case 'heresiarch':
        return 'Teacher whose doctrines were condemned as heresy';
      case 'secular':
      default:
        return 'Secular historical figure';
    }
  })();

  const sizeClass = `portrait-frame--${size}`;

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      // Use a placeholder with the person's name
      const initials = name
        .split(' ')
        .map(n => n[0])
        .filter(Boolean)
        .slice(-2)
        .join('');
      setImgSrc(`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ccc" font-family="Arial" font-size="48">${initials}</text></svg>`)}`);
    }
  };

  return (
    <div
      className={`${baseClass} ${statusClass} ${sizeClass}`}
      aria-label={tooltip}
      title={tooltip}
    >
      <img 
        src={imgSrc} 
        alt={name} 
        className="portrait-frame__image"
        onError={handleImageError}
      />
    </div>
  );
}
