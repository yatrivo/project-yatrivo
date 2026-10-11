import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { PublicGalleryItem } from "@/api/gallery";
import {
  galleryPreloader,
  getThumbnailImageUrl,
  getViewerImageUrl,
  type NavigationDirection
} from "@/utils/galleryPreloader";

const REEL_SPAN_PX = 280;

interface GalleryLightboxProps {
  items: PublicGalleryItem[];
  initialIndex: number;
  onClose: () => void;
  onNearEnd?: () => void;
}

export default function GalleryLightbox({
  items,
  initialIndex,
  onClose,
  onNearEnd
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, items.length - 1)))
  );
  const [navDirection, setNavDirection] = useState<NavigationDirection>("initial");
  const [slideCycle, setSlideCycle] = useState<number>(0);
  const [exitingSlide, setExitingSlide] = useState<{
    id: string;
    src: string;
    alt: string;
    width: number | null;
    height: number | null;
    direction: "forward" | "backward";
    startX: number;
    cycle: number;
  } | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const total = items.length;
  const safeIndex = total > 0 ? Math.max(0, Math.min(currentIndex, total - 1)) : 0;
  const currentItem = items[safeIndex];

  const viewerUrl = currentItem ? getViewerImageUrl(currentItem) : "";
  const thumbUrl = currentItem ? getThumbnailImageUrl(currentItem) : "";
  const placeholderUrl = currentItem?.placeholder || null;

  // Synchronously check if viewerUrl is already decoded in our bounded LRU cache
  const [isViewerDecoded, setIsViewerDecoded] = useState<boolean>(() =>
    galleryPreloader.isDecoded(viewerUrl)
  );
  const [hasViewerError, setHasViewerError] = useState<boolean>(false);
  const [hasThumbError, setHasThumbError] = useState<boolean>(false);

  // Track active item ID and generation counter to prevent stale async loads during rapid swipes
  const activeItemIdRef = useRef<string | null>(currentItem?.id ?? null);
  const transitionGenRef = useRef<number>(0);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const incomingSlideRef = useRef<HTMLDivElement | null>(null);
  const exitingSlideRef = useRef<HTMLDivElement | null>(null);

  // Keep state synchronized immediately when currentItem changes
  useEffect(() => {
    if (!currentItem) return;
    activeItemIdRef.current = currentItem.id;
    const gen = ++transitionGenRef.current;

    const alreadyDecoded = galleryPreloader.isDecoded(viewerUrl);
    setIsViewerDecoded(alreadyDecoded);
    setHasViewerError(false);
    setHasThumbError(false);

    // Subscribe to decode completion for the active viewer URL
    const unsubscribe = galleryPreloader.subscribe(viewerUrl, (state) => {
      if (transitionGenRef.current !== gen || activeItemIdRef.current !== currentItem.id) {
        return; // Stale callback from a previous rapid swipe — ignore
      }
      if (state === "decoded") {
        setIsViewerDecoded(true);
        setHasViewerError(false);
      } else if (state === "error") {
        setHasViewerError(true);
      }
    });

    // Prioritize current image + adjacent images in navigation direction
    void galleryPreloader.prioritizeWindow(items, safeIndex, navDirection);

    return () => {
      unsubscribe();
    };
  }, [currentItem, viewerUrl, items, safeIndex, navDirection]);

  // Notify parent when approaching the end of loaded items so next page can prefetch
  useEffect(() => {
    if (onNearEnd && total > 0 && safeIndex >= total - 6) {
      onNearEnd();
    }
  }, [safeIndex, total, onNearEnd]);

  const navigateToIndex = useCallback(
    (targetIndex: number, direction: "forward" | "backward", swipeOffsetPx = 0) => {
      if (total <= 1 || targetIndex === safeIndex) return;

      const outgoingSrc =
        (isViewerDecoded && !hasViewerError ? viewerUrl : thumbUrl || placeholderUrl) || viewerUrl;

      setSlideCycle((prevCycle) => {
        const nextCycle = prevCycle + 1;
        if (currentItem && outgoingSrc) {
          setExitingSlide({
            id: currentItem.id,
            src: outgoingSrc,
            alt: currentItem.altText || currentItem.title || "Gallery Moment",
            width: currentItem.width,
            height: currentItem.height,
            direction,
            startX: swipeOffsetPx,
            cycle: nextCycle,
          });
        }
        return nextCycle;
      });

      setNavDirection(direction);
      setCurrentIndex(targetIndex);
      setTouchDeltaX(0);
    },
    [total, safeIndex, isViewerDecoded, hasViewerError, viewerUrl, thumbUrl, placeholderUrl, currentItem]
  );

  const handlePrev = useCallback(
    (swipeOffsetPx = 0) => {
      if (total <= 1) return;
      const prevIdx = safeIndex <= 0 ? total - 1 : safeIndex - 1;
      navigateToIndex(prevIdx, "backward", swipeOffsetPx);
    },
    [total, safeIndex, navigateToIndex]
  );

  const handleNext = useCallback(
    (swipeOffsetPx = 0) => {
      if (total <= 1) return;
      const nextIdx = safeIndex >= total - 1 ? 0 : safeIndex + 1;
      navigateToIndex(nextIdx, "forward", swipeOffsetPx);
    },
    [total, safeIndex, navigateToIndex]
  );

  // Synchronously animate outgoing slide continuing toward swipe direction & incoming slide emerging from opposite end
  useLayoutEffect(() => {
    if (slideCycle === 0 || navDirection === "initial") return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setExitingSlide(null);
      return;
    }

    const startX = exitingSlide?.startX ?? 0;

    const incomingEl = incomingSlideRef.current;
    if (incomingEl && typeof incomingEl.animate === "function") {
      // Forward (swiped left) -> upcoming image emerges from the RIGHT (+offset -> 0px)
      // Backward (swiped right) -> upcoming image emerges from the LEFT (-offset -> 0px)
      const enterDistance =
        startX !== 0
          ? Math.max(70, REEL_SPAN_PX - Math.min(REEL_SPAN_PX - 70, Math.abs(startX)))
          : 200;
      const enterFromX = navDirection === "forward" ? enterDistance : -enterDistance;
      const enterStartOpacity =
        startX !== 0 ? Math.min(0.85, Math.max(0.2, Math.abs(startX) / REEL_SPAN_PX)) : 0.15;

      incomingEl.animate(
        [
          { transform: `translate3d(${enterFromX}px, 0, 0)`, opacity: enterStartOpacity },
          { transform: "translate3d(0px, 0, 0)", opacity: 1 },
        ],
        {
          duration: 260,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }
      );
    }

    const exitingEl = exitingSlideRef.current;
    if (exitingEl && exitingSlide && typeof exitingEl.animate === "function") {
      // Forward (swiped left) -> current image exits further LEFT (startX -> -REEL_SPAN_PX)
      // Backward (swiped right) -> current image exits further RIGHT (startX -> +REEL_SPAN_PX)
      const exitToX =
        exitingSlide.direction === "forward"
          ? Math.min(startX - 160, -REEL_SPAN_PX)
          : Math.max(startX + 160, REEL_SPAN_PX);
      const startOpacity = Math.max(0.35, 1 - Math.abs(startX) / 420);
      exitingEl.animate(
        [
          { transform: `translate3d(${startX}px, 0, 0)`, opacity: startOpacity },
          { transform: `translate3d(${exitToX}px, 0, 0)`, opacity: 0 },
        ],
        {
          duration: 230,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      );
    }

    const activeCycle = slideCycle;
    const timer = window.setTimeout(() => {
      setExitingSlide((prev) => (prev && prev.cycle === activeCycle ? null : prev));
    }, 245);

    return () => window.clearTimeout(timer);
  }, [slideCycle, navDirection, exitingSlide]);

  // Lock body scroll while preserving exact scroll position, and manage focus on open/close
  useEffect(() => {
    const savedScrollY = window.scrollY;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Focus close button for keyboard accessibility without scrolling
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      if (Math.abs(window.scrollY - savedScrollY) > 2) {
        window.scrollTo({ top: savedScrollY, behavior: "instant" as ScrollBehavior });
      }
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        try {
          previouslyFocused.focus({ preventScroll: true });
        } catch {
          // Ignore focus errors if element unmounted
        }
      }
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
        handlePrev(0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext(0);
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
    const releaseDeltaX = touchDeltaX;
    const wasSwiping = isSwiping;

    setTouchStartX(null);
    setTouchStartY(null);
    setIsSwiping(false);

    if (wasSwiping) {
      const swipeThreshold = 45; // pixels
      if (releaseDeltaX > swipeThreshold) {
        handlePrev(releaseDeltaX);
        return;
      } else if (releaseDeltaX < -swipeThreshold) {
        handleNext(releaseDeltaX);
        return;
      }
    }

    setTouchDeltaX(0);
  };

  // 5 to 7 photos carousel window calculation
  const carouselItems = useMemo(() => {
    if (total <= 7) {
      return items.map((item, idx) => ({ item, index: idx }));
    }

    // Target a window of 7 items with safeIndex in the middle (3 before, 3 after)
    let start = safeIndex - 3;
    let end = safeIndex + 3;

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
  }, [items, total, safeIndex]);

  if (!currentItem) return null;

  const currentTitle = currentItem.title || currentItem.altText || "Mountain Moment";
  const showViewerLayer = isViewerDecoded && !hasViewerError;
  const showFallbackState = hasViewerError && (hasThumbError || !thumbUrl);

  // Live upcoming slide emerging from the opposite end while dragging on a touch device
  const dragPreview = useMemo(() => {
    if (!isSwiping || total <= 1 || Math.abs(touchDeltaX) <= 10) return null;
    const isDraggingToNext = touchDeltaX < 0;
    const previewIdx = isDraggingToNext
      ? safeIndex >= total - 1
        ? 0
        : safeIndex + 1
      : safeIndex <= 0
      ? total - 1
      : safeIndex - 1;
    const previewItem = items[previewIdx];
    if (!previewItem) return null;

    const previewViewerUrl = getViewerImageUrl(previewItem);
    const previewSrc = galleryPreloader.isDecoded(previewViewerUrl)
      ? previewViewerUrl
      : getThumbnailImageUrl(previewItem) || previewViewerUrl;

    // When dragging left (touchDeltaX < 0), upcoming Next image emerges from the RIGHT (+REEL_SPAN_PX + touchDeltaX)
    // When dragging right (touchDeltaX > 0), upcoming Prev image emerges from the LEFT (-REEL_SPAN_PX + touchDeltaX)
    const offsetX = isDraggingToNext
      ? Math.max(0, REEL_SPAN_PX + touchDeltaX)
      : Math.min(0, -REEL_SPAN_PX + touchDeltaX);
    const opacity = Math.min(0.85, Math.max(0.1, Math.abs(touchDeltaX) / REEL_SPAN_PX));

    return {
      item: previewItem,
      src: previewSrc,
      offsetX,
      opacity,
    };
  }, [isSwiping, total, touchDeltaX, safeIndex, items]);

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
            {safeIndex + 1} / {total}
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
            ref={closeButtonRef}
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
              handlePrev(0);
            }}
            aria-label="Previous image"
            className="hidden sm:flex absolute left-4 sm:left-6 z-20 w-11 h-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e8622a] cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Live Upcoming Reel Slide during active finger drag (emerges from the opposite end) */}
        {dragPreview && (
          <div
            key={`drag-preview-${dragPreview.item.id}`}
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center p-2 sm:p-8 pointer-events-none z-10"
            style={{
              transform: `translate3d(${dragPreview.offsetX}px, 0, 0)`,
              opacity: dragPreview.opacity,
            }}
          >
            <img
              src={dragPreview.src}
              alt={dragPreview.item.altText || dragPreview.item.title || "Upcoming Moment"}
              width={dragPreview.item.width || undefined}
              height={dragPreview.item.height || undefined}
              className="max-h-[68vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              draggable={false}
            />
          </div>
        )}

        {/* Outgoing Slide (completes reel exit in the direction of the swipe) */}
        {!isSwiping && exitingSlide && (
          <div
            key={`exit-${exitingSlide.id}-${exitingSlide.cycle}`}
            ref={exitingSlideRef}
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center p-2 sm:p-8 pointer-events-none z-10"
            style={{
              transform: `translate3d(${exitingSlide.startX}px, 0, 0)`,
              opacity: Math.max(0.35, 1 - Math.abs(exitingSlide.startX) / 420),
            }}
          >
            <img
              src={exitingSlide.src}
              alt={exitingSlide.alt}
              width={exitingSlide.width || undefined}
              height={exitingSlide.height || undefined}
              className="max-h-[68vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              draggable={false}
            />
          </div>
        )}

        {/* Active / Incoming Slide (emerges from the opposite end of the reel) */}
        <div
          key={`active-${currentItem.id}-${slideCycle}`}
          ref={incomingSlideRef}
          className={`relative z-15 max-w-full max-h-full flex items-center justify-center ${
            isSwiping
              ? "transition-none"
              : "transition-transform duration-200 ease-out motion-reduce:transition-none"
          }`}
          style={{
            transform: isSwiping ? `translate3d(${touchDeltaX}px, 0, 0)` : "translate3d(0px, 0, 0)",
            opacity: isSwiping ? Math.max(0.45, 1 - Math.abs(touchDeltaX) / 380) : 1
          }}
        >
          {showFallbackState ? (
            <div className="w-72 sm:w-96 h-64 rounded-2xl bg-[#0f2922]/80 border border-white/15 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <span className="text-3xl">🏔️</span>
              <p className="text-white text-sm font-semibold">{currentTitle}</p>
              <p className="text-white/60 text-xs">Image temporarily unavailable</p>
            </div>
          ) : (
            <div className="relative flex items-center justify-center max-w-full max-h-full">
              {/* Layer 1: Immediate Thumbnail / Placeholder while viewer resolution decodes */}
              {!showViewerLayer && (thumbUrl || placeholderUrl) && !hasThumbError && (
                <img
                  key={`thumb-${currentItem.id}`}
                  src={thumbUrl || placeholderUrl || ""}
                  alt={currentItem.altText || currentItem.title || "Gallery Moment"}
                  width={currentItem.width || undefined}
                  height={currentItem.height || undefined}
                  className="max-h-[68vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-opacity duration-200 motion-reduce:transition-none"
                  style={
                    !thumbUrl && placeholderUrl
                      ? { filter: "blur(12px)", transform: "scale(1.02)" }
                      : undefined
                  }
                  draggable={false}
                  onError={() => setHasThumbError(true)}
                />
              )}

              {/* Layer 2: Decoded Viewer-Resolution Image (1600w WebP) */}
              <img
                key={`viewer-${currentItem.id}`}
                src={viewerUrl}
                alt={currentItem.altText || currentItem.title || "Gallery Moment"}
                width={currentItem.width || undefined}
                height={currentItem.height || undefined}
                decoding="async"
                className={`max-h-[68vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-opacity duration-200 ease-out motion-reduce:transition-none ${
                  showViewerLayer
                    ? "opacity-100 relative"
                    : "opacity-0 absolute inset-0 pointer-events-none"
                }`}
                draggable={false}
                onLoad={() => {
                  if (activeItemIdRef.current === currentItem.id) {
                    setIsViewerDecoded(true);
                  }
                }}
                onError={() => {
                  if (activeItemIdRef.current === currentItem.id) {
                    setHasViewerError(true);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Desktop floating next arrow */}
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext(0);
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
          {currentItem.caption && (
            <p className="text-white/80 text-xs sm:text-sm text-center max-w-xl mb-2 line-clamp-2">
              {currentItem.caption}
            </p>
          )}
          {/* Carousel View of 5 to 7 photos (uses 400w thumbnailUrl!) */}
          {total > 1 && (
            <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2.5 py-1">
              {carouselItems.map((thumb) => {
                const isActive = thumb.index === safeIndex;
                const filmstripSrc = getThumbnailImageUrl(thumb.item);
                return (
                  <button
                    key={thumb.item.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (thumb.index !== safeIndex) {
                        navigateToIndex(
                          thumb.index,
                          thumb.index > safeIndex ? "forward" : "backward",
                          0
                        );
                      }
                    }}
                    aria-label={`View photo ${thumb.index + 1}: ${thumb.item.title || "Moment"}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`relative rounded-lg overflow-hidden transition-all duration-200 motion-reduce:transition-none cursor-pointer shrink-0 ${
                      isActive
                        ? "w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-[#e8622a] border-2 border-white scale-105 shadow-xl opacity-100 z-10"
                        : "w-10 h-10 sm:w-13 sm:h-13 border border-white/25 opacity-45 hover:opacity-90 hover:scale-105"
                    }`}
                  >
                    <img
                      src={filmstripSrc}
                      alt={thumb.item.title || `Photo ${thumb.index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
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
