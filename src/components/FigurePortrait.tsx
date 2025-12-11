import type { OrthodoxyStatus } from '../types/person';
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

  return (
    <div
      className={`${baseClass} ${statusClass} ${sizeClass}`}
      aria-label={tooltip}
      title={tooltip}
    >
      <img src={imageUrl} alt={name} className="portrait-frame__image" />
    </div>
  );
}
