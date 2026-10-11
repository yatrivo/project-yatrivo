import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { PublicGalleryItem } from "@/api/gallery";

interface GalleryLightboxProps {
  items: PublicGalleryItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function GalleryLightbox({ items, initialIndex, onClose }: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, items.length - 1))
  );
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const total = items.length;
  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
    setTouchDeltaX(0);
  }, [total]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
    setTouchDeltaX(0);
  }, [total]);

  // Lock body scroll and restore on unmount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  // Mobile Touch Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsSwiping(false);
    setTouchDeltaX(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX;
    const deltaY = currentY - touchStartY;

    // Detect horizontal swipe vs vertical scroll
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
      setTouchDeltaX(deltaX);
    }
  };

  const onTouchEnd = () => {
    if (isSwiping) {
      const swipeThreshold = 50; // pixels
      if (touchDeltaX > swipeThreshold) {
        handlePrev();
      } else if (touchDeltaX < -swipeThreshold) {
        handleNext();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchDeltaX(0);
    setIsSwiping(false);
  };

  // 5 to 7 photos carousel window calculation
  const carouselItems = useMemo(() => {
    if (total <= 7) {
      return items.map((item, idx) => ({ item, index: idx }));
    }

    // Target a window of 7 items with currentIndex in the middle (3 before, 3 after)
    let start = currentIndex - 3;
    let end = currentIndex + 3;

    if (start < 0) {
      start = 0;
      end = 6;
    } else if (end >= total) {
      end = total - 1;
      start = total - 7;
    }

    const windowItems: { item: PublicGalleryItem; index: number }[] = [];
    for (let i = start; i <= end; i++) {
      windowItems.push({ item: items[i], index: i });
    }
    return windowItems;
  }, [items, total, currentIndex]);

  if (!currentItem) return null;

  const currentTitle = currentItem.title || currentItem.altText || "Mountain Moment";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery lightbox"
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95 select-none touch-none backdrop-blur-md"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Bar: Counter (Left), Image Title (Center), Close (Right) */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/95 via-black/60 to-transparent">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Left: Counter */}
          <span className="text-white/90 text-xs sm:text-sm font-semibold tracking-wider px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 shrink-0">
            {currentIndex + 1} / {total}
          </span>

          {/* Center: Image Name / Title on the top */}
          <div className="flex-1 min-w-0 text-center px-2">
            <h2
              className="text-white text-sm sm:text-base md:text-lg font-bold truncate drop-shadow-sm"
              style={{ fontFamily: "var(--font-serif, serif)" }}
              title={currentTitle}
            >
              {currentTitle}
            </h2>
          </div>

          {/* Right: Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
            className="p-2 sm:p-2.5 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#e8622a] cursor-pointer shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 relative flex items-center justify-center p-2 sm:p-8 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Desktop floating previous arrow */}
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
            className="hidden sm:flex absolute left-4 sm:left-6 z-20 w-11 h-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e8622a] cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Main Image Container with touch swipe transform */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: isSwiping ? `translateX(${touchDeltaX}px)` : "translateX(0px)",
            opacity: isSwiping ? Math.max(0.6, 1 - Math.abs(touchDeltaX) / 400) : 1
          }}
        >
          <img
            key={currentItem.id}
            src={currentItem.url}
            alt={currentItem.altText || currentItem.title || "Gallery Moment"}
            className="max-h-[68vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition duration-300"
            draggable={false}
          />
        </div>

        {/* Desktop floating next arrow */}
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
            className="hidden sm:flex absolute right-4 sm:right-6 z-20 w-11 h-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e8622a] cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Area: 5-7 Photos Carousel */}
      <div className="z-30 px-3 sm:px-6 pb-4 sm:pb-6 pt-2 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {/* Carousel View of 5 to 7 photos */}
          {total > 1 && (
            <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2.5 py-1">
              {carouselItems.map((thumb) => {
                const isActive = thumb.index === currentIndex;
                return (
                  <button
                    key={thumb.item.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(thumb.index);
                      setTouchDeltaX(0);
                    }}
                    aria-label={`View photo ${thumb.index + 1}: ${thumb.item.title || "Moment"}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`relative rounded-lg overflow-hidden transition-all duration-200 cursor-pointer shrink-0 ${
                      isActive
                        ? "w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-[#e8622a] border-2 border-white scale-105 shadow-xl opacity-100 z-10"
                        : "w-10 h-10 sm:w-13 sm:h-13 border border-white/25 opacity-45 hover:opacity-90 hover:scale-105"
                    }`}
                  >
                    <img
                      src={thumb.item.url}
                      alt={thumb.item.title || `Photo ${thumb.index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
