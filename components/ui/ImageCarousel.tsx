'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/lib/types';

// Small in-card image carousel: ‹ › arrows + dot indicator when there is
// more than one image. Slides horizontally with a translate transition.
// Safe to place inside a <Link> — arrow clicks do not trigger navigation.
export default function ImageCarousel({
  images,
  alt,
  sizes = '(max-width: 768px) 50vw, 25vw',
  className = '',
  imageClassName = 'object-cover',
}: {
  images: ProductImage[];
  alt: string;
  sizes?: string;
  className?: string;
  imageClassName?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  function go(e: React.MouseEvent, delta: number) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + count) % count);
  }

  const arrow =
    'absolute top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-sm text-neutral-700 shadow transition-opacity hover:bg-white';

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {count > 0 ? (
        // Sliding track: all slides side by side, translated by the index.
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((img, i) => (
            <div key={i} className="relative h-full w-full flex-shrink-0">
              <Image
                src={img.url}
                alt={img.alt ?? alt}
                fill
                sizes={sizes}
                className={imageClassName}
                // Only eagerly load the first slide; the rest load lazily.
                loading={i === 0 ? undefined : 'lazy'}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid h-full w-full place-items-center bg-neutral-100 text-xs text-neutral-400">
          No image
        </div>
      )}

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous image" onClick={(e) => go(e, -1)} className={`${arrow} left-1.5`}>
            ‹
          </button>
          <button type="button" aria-label="Next image" onClick={(e) => go(e, 1)} className={`${arrow} right-1.5`}>
            ›
          </button>
          <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-brand-600' : 'bg-white/80 shadow'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
