'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProductImage from './ProductImage';
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  name: string;
  fallback: string;
  stockStatus?: string;
}

export default function ProductGallery({ images, name, fallback, stockStatus }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const active = images[activeIndex] || fallback;

  // Wraps around in both directions so the viewer keeps looping through all
  // product images (last → first, first → last) until the user closes it.
  const goTo = (i: number) => setActiveIndex((i + images.length) % images.length);

  // Keyboard navigation while the lightbox is open (desktop): ← / → move
  // between images, Esc closes the viewer.
  useEffect(() => {
    if (!zoomOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(activeIndex - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(activeIndex + 1); }
      else if (e.key === 'Escape') { setZoomOpen(false); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomOpen, activeIndex, images.length]);

  // Swipe left/right to navigate on mobile/touch devices while zoomed in.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) goTo(activeIndex - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(activeIndex + 1);
    touchStartX.current = null;
  };

  return (
    <div className="space-y-3">
      {/* Main image — equal-sized container, image never cropped or stretched */}
      <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="absolute inset-0 w-full h-full flex items-center justify-center p-6 cursor-zoom-in group"
          aria-label="Zoom image"
        >
          <ProductImage
            src={active}
            alt={name}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            fallback={fallback}
          />
          <span className="absolute bottom-3 right-3 bg-white/90 border border-gray-200 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </span>
        </button>

        {stockStatus && (
          <span className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded shadow text-white ${
            stockStatus === 'In Stock'
              ? 'bg-green-600'
              : stockStatus === 'Low Stock'
                ? 'bg-yellow-600'
                : 'bg-red-600'
          }`}>
            {stockStatus}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-sm"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-sm"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((imgUrl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`aspect-square bg-white border rounded overflow-hidden flex items-center justify-center p-1.5 transition-colors ${
                i === activeIndex ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ProductImage
                src={imgUrl}
                alt={`${name} view ${i + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                fallback={fallback}
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      {zoomOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 sm:p-10"
          onClick={() => setZoomOpen(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
            aria-label="Close zoom"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <ProductImage
              src={active}
              alt={name}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              fallback={fallback}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex - 1)}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex + 1)}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/90 text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full">
                  {activeIndex + 1} / {images.length}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
