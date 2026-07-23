'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type LightboxImage = { url: string; alt?: string | null };

/**
 * Full-screen image preview:
 * - click backdrop / ✕ / Esc to close
 * - ←/→ keys or arrows to navigate, thumbnail bar when multiple
 * - double-click (or double-tap) toggles zoom at the clicked point
 */
export default function ImageLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  // Pan offset while zoomed (drag to look around).
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const current = images[index];
  const count = images.length;

  const resetView = useCallback(() => {
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (delta: number) => {
      resetView();
      onNavigate((index + delta + count) % count);
    },
    [index, count, onNavigate, resetView],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && count > 1) go(-1);
      if (e.key === 'ArrowRight' && count > 1) go(1);
    }
    window.addEventListener('keydown', onKey);
    // Lock body scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose, count]);

  if (!current) return null;

  function toggleZoom(e: React.MouseEvent) {
    e.stopPropagation();
    if (!zoomed && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setOrigin(`${x}% ${y}%`);
      setZoomed(true);
    } else {
      resetView();
    }
  }

  // Drag-to-pan while zoomed.
  function onPointerDown(e: React.PointerEvent) {
    if (!zoomed) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: pan.x, baseY: pan.y };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!zoomed || !dragRef.current) return;
    e.preventDefault();
    setPan({
      x: dragRef.current.baseX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.baseY + (e.clientY - dragRef.current.startY),
    });
  }
  function onPointerUp() {
    dragRef.current = null;
    setDragging(false);
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm text-white/70">
          {count > 1 ? `${index + 1} / ${count}` : ''}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        {count > 1 && (
          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ‹
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={current.url}
          alt={current.alt ?? ''}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={toggleZoom}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          draggable={false}
          className={`max-h-full max-w-full select-none object-contain ${
            dragging ? '' : 'transition-transform duration-200'
          } ${zoomed ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
          style={{
            transformOrigin: origin,
            transform: zoomed
              ? `translate(${pan.x}px, ${pan.y}px) scale(2.5)`
              : undefined,
            touchAction: zoomed ? 'none' : undefined,
          }}
          title="Double-click to zoom, drag to pan"
        />
        {count > 1 && (
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
          >
            ›
          </button>
        )}
      </div>

      {/* Thumbnail bar */}
      {count > 1 && (
        <div
          className="flex justify-center gap-2 overflow-x-auto px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={img.alt ?? ''}
              onClick={() => {
                resetView();
                onNavigate(i);
              }}
              className={`h-14 w-14 flex-shrink-0 cursor-pointer rounded border-2 object-cover ${
                i === index ? 'border-brand-400' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
