import Image from 'next/image';

import { PhotoStringVisibilityGate } from './PhotoStringVisibilityGate';

const row1 = ['photo1.webp', 'photo2.webp', 'photo3.webp', 'photo4.webp', 'photo5.webp'];
const row2 = ['photo6.webp', 'photo7.webp', 'photo10.webp', 'photo11.webp', 'photo12.webp'];
const row3 = ['photo13.webp', 'photo14.webp', 'photo15.webp', 'photo1.webp', 'photo3.webp'];

const rotationClasses = [
  ['photo-rotate-n4', 'photo-rotate-p2', 'photo-rotate-n1', 'photo-rotate-p3', 'photo-rotate-n2'],
  ['photo-rotate-p3', 'photo-rotate-n3', 'photo-rotate-p1', 'photo-rotate-n2', 'photo-rotate-p4'],
  ['photo-rotate-n2', 'photo-rotate-p1', 'photo-rotate-n3', 'photo-rotate-p2', 'photo-rotate-n1'],
] as const;

interface DisposablePhotoProps {
  readonly src: string;
  readonly rotationClass: string;
  readonly index: number;
}

function DisposablePhoto({ src, rotationClass, index }: DisposablePhotoProps) {
  return (
    <div className={`photo-on-string ${rotationClass}`}>
      <div className="photo-clip" aria-hidden="true">
        <div className="clip-body" />
      </div>

      <div className="disposable-frame">
        <div className="disposable-inner">
          <Image
            src={`/home/memories/${src}`}
            alt={`C1RCLE memory ${String(index + 1)}`}
            fill
            unoptimized
            sizes="(max-width: 480px) 110px, (max-width: 768px) 135px, 200px"
            className="disposable-img"
          />
        </div>
        <div className="disposable-strip">
          <span className="disposable-date">&apos;25</span>
          <span className="disposable-counter">{String(index + 1).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}

interface ScrollingRowProps {
  readonly photos: readonly string[];
  readonly direction: 'left' | 'right';
  readonly rowIndex: number;
  readonly speedClass: string;
}

function ScrollingRow({ photos, direction, rowIndex, speedClass }: ScrollingRowProps) {
  const doubled = [...photos, ...photos];
  const directionClass = direction === 'left' ? 'scroll-left' : 'scroll-right';

  return (
    <div className="string-row-wrapper">
      <div className="light-string" aria-hidden="true" />
      <div className={`string-row-track ${directionClass} ${speedClass}`}>
        {doubled.map((photo, index) => (
          <DisposablePhoto
            key={`${String(rowIndex)}-${String(index)}`}
            src={photo}
            rotationClass={rotationClasses[rowIndex]?.[index % photos.length] ?? 'photo-rotate-none'}
            index={index % photos.length}
          />
        ))}
      </div>
    </div>
  );
}

export function PhotoStringGallery() {
  return (
    <section className="photo-string-section bg-black" aria-labelledby="photo-string-heading">
      <div className="photo-string-glow" aria-hidden="true" />

      <div className="photo-string-header">
        <span className="photo-string-label">memories</span>
        <h2 id="photo-string-heading" className="photo-string-title">
          moments we live for
        </h2>
      </div>

      <PhotoStringVisibilityGate>
        <ScrollingRow photos={row1} direction="left" rowIndex={0} speedClass="photo-speed-40" />
        <ScrollingRow photos={row2} direction="right" rowIndex={1} speedClass="photo-speed-45" />
        <ScrollingRow photos={row3} direction="left" rowIndex={2} speedClass="photo-speed-38" />
      </PhotoStringVisibilityGate>
    </section>
  );
}
