import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { createPortal } from "react-dom";
import type { PublicGalleryItem } from "@/api/gallery";
import {
  galleryPreloader,
  getThumbnailImageUrl,
  getViewerImageUrl,
  type NavigationDirection,
} from "@/utils/galleryPreloader";

interface GalleryLightboxProps {
  items: PublicGalleryItem[];
  initialIndex: number;
  onClose: () => void;
  onNearEnd?: () => void;
}

const SLIDE_DURATION_MS = 285;
const SNAP_BACK_DURATION_MS = 240;
const SLIDE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function wrapIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

function isReducedMotionPreferred(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface GallerySlideProps {
  item: PublicGalleryItem;
  isActive: boolean;
  onBackdropClick: () => void;
}

/**
 * Individual slide occupying 100% of the lightbox viewport width inside the horizontal track.
 * Preserves decoded state across slide recycling so adjacent pre-decoded slides never flash.
 */
const GallerySlide = memo(function GallerySlide({
  item,
  isActive,
  onBackdropClick,
}: GallerySlideProps) {
  const viewerUrl = getViewerImageUrl(item);
  const thumbUrl = getThumbnailImageUrl(item);
  const placeholderUrl = item.placeholder || null;

  const [isViewerDecoded, setIsViewerDecoded] = useState<boolean>(() =>
    galleryPreloader.isDecoded(viewerUrl)
  );
  const [hasViewerError, setHasViewerError] = useState<boolean>(false);
  const [hasThumbError, setHasThumbError] = useState<boolean>(false);

  const itemIdRef = useRef<string>(item.id);

  useEffect(() => {
    itemIdRef.current = item.id;
    const alreadyDecoded = galleryPreloader.isDecoded(viewerUrl);
    setIsViewerDecoded(alreadyDecoded);
    setHasViewerError(false);
    setHasThumbError(false);

    const unsubscribe = galleryPreloader.subscribe(viewerUrl, (state) => {
      if (itemIdRef.current !== item.id) return;
      if (state === "decoded") {
        setIsViewerDecoded(true);
        setHasViewerError(false);
      } else if (state === "error") {
        setHasViewerError(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [item.id, viewerUrl]);

  const title = item.title || item.altText || "Mountain Moment";
  const showViewerLayer = isViewerDecoded && !hasViewerError;
  const showFallbackState = hasViewerError && (hasThumbError || !thumbUrl);

  return (
    <div
      className="w-full h-full shrink-0 basis-full flex items-center justify-center p-2 sm:p-8 select-none"
      aria-hidden={!isActive}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onBackdropClick();
        }
      }}
    >
      {showFallbackState ? (
        <div className="w-72 sm:w-96 h-64 rounded-2xl bg-[#0f2922]/80 border border-white/15 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <span className="text-3xl">🏔️</span>
          <p className="text-white text-sm font-semibold">{title}</p>
          <p className="text-white/60 text-xs">Image temporarily unavailable</p>
        </div>
      ) : (
        <div className="relative flex items-center justify-center max-w-full max-h-full">
          {/* Layer 1: Immediate Thumbnail / Placeholder while viewer resolution decodes */}
          {!showViewerLayer && (thumbUrl || placeholderUrl) && !hasThumbError && (
            <img
              src={thumbUrl || placeholderUrl || ""}
              alt={item.altText || item.title || "Gallery Moment"}
              width={item.width || undefined}
              height={item.height || undefined}
              className="max-h-[68vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl select-none"
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
            src={viewerUrl}
            alt={item.altText || item.title || "Gallery Moment"}
            width={item.width || undefined}
            height={item.height || undefined}
            decoding="async"
            className={`max-h-[68vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl select-none ${
              showViewerLayer
                ? "opacity-100 relative"
                : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
            draggable={false}
            onLoad={() => {
              if (itemIdRef.current === item.id) {
                setIsViewerDecoded(true);
              }
            }}
            onError={() => {
              if (itemIdRef.current === item.id) {
                setHasViewerError(true);
              }
            }}
          />
        </div>
      )}
    </div>
  );
});

export default function GalleryLightbox({
  items,
  initialIndex,
  onClose,
  onNearEnd,
}: GalleryLightboxProps) {
  const total = items.length;

  // Virtual monotonic index allows infinite wrapping around [0 .. total - 1]
  // while keeping unique, stable React keys (virtualIndex - 1, virtualIndex, virtualIndex + 1)
  // across the 3-slide window even when total === 2.
  const [virtualIndex, setVirtualIndex] = useState<number>(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, total - 1)))
  );
  // Optional step override when clicking a non-adjacent thumbnail in the bottom filmstrip
  const [customStepDelta, setCustomStepDelta] = useState<number | null>(null);

  const safeIndex = wrapIndex(virtualIndex, total);
  const currentItem = total > 0 ? items[safeIndex] : undefined;

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Track active slide transition state without triggering unnecessary React re-renders
  const navDirectionRef = useRef<NavigationDirection>("initial");
  const pendingStepRef = useRef<number>(0);
  const queuedStepRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const suppressBackdropClickRef = useRef<boolean>(false);

  // Pointer / touch drag state stored in ref so touchmove updates transform at 60-120fps with 0 React re-renders
  const dragRef = useRef<{
    active: boolean;
    isHorizontal: boolean | null;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    velocityX: number;
    deltaX: number;
  }>({
    active: false,
    isHorizontal: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    velocityX: 0,
    deltaX: 0,
  });

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  // Synchronously set the track to neutral center slide (-100%) without animation
  const setTrackNeutralImmediate = useCallback(() => {
    const trackEl = trackRef.current;
    if (!trackEl) return;
    trackEl.style.transition = "none";
    trackEl.style.transform =
      total > 1 ? "translate3d(-100%, 0, 0)" : "translate3d(0px, 0, 0)";
  }, [total]);

  // Finalize an in-flight slide transition and recycle the 3-slide window around the new virtualIndex
  const commitSlideTransition = useCallback(() => {
    clearTransitionTimer();
    const step = pendingStepRef.current;
    if (step === 0) return;
    pendingStepRef.current = 0;
    setCustomStepDelta(null);
    setVirtualIndex((prev) => prev + step);
  }, [clearTransitionTimer]);

  // Animate the horizontal track to the left slot (-1), center slot (0), or right slot (+1)
  const animateTrackToSlot = useCallback(
    (slotDirection: -1 | 0 | 1, velocityPxPerMs = 0, explicitStep?: number) => {
      const trackEl = trackRef.current;
      if (!trackEl) return;

      if (slotDirection === 0 || total <= 1) {
        pendingStepRef.current = 0;
        clearTransitionTimer();
        if (isReducedMotionPreferred()) {
          setTrackNeutralImmediate();
        } else {
          trackEl.style.transition = `transform ${SNAP_BACK_DURATION_MS}ms ${SLIDE_EASING}`;
          trackEl.style.transform =
            total > 1 ? "translate3d(-100%, 0, 0)" : "translate3d(0px, 0, 0)";
        }
        return;
      }

      const step = explicitStep ?? slotDirection;
      const dir: NavigationDirection = step > 0 ? "forward" : "backward";
      navDirectionRef.current = dir;

      // Immediately prioritize preloading for the incoming target index and its neighbors
      const targetIndex = wrapIndex(virtualIndex + step, total);
      void galleryPreloader.prioritizeWindow(items, targetIndex, dir);

      if (isReducedMotionPreferred()) {
        pendingStepRef.current = 0;
        setCustomStepDelta(null);
        setVirtualIndex((prev) => prev + step);
        return;
      }

      pendingStepRef.current = step;

      // Adapt duration slightly when user performs a fast flick
      const speedFactor = Math.min(65, Math.floor(Math.abs(velocityPxPerMs) * 40));
      const durationMs = Math.max(210, SLIDE_DURATION_MS - speedFactor);

      // Slide to Slot 0 (0%) when going backward, or Slot 2 (-200%) when going forward
      const targetTransform =
        slotDirection > 0
          ? "translate3d(-200%, 0, 0)"
          : "translate3d(0%, 0, 0)";

      trackEl.style.transition = `transform ${durationMs}ms ${SLIDE_EASING}`;
      trackEl.style.transform = targetTransform;

      clearTransitionTimer();
      transitionTimerRef.current = window.setTimeout(() => {
        commitSlideTransition();
      }, durationMs + 35);
    },
    [total, virtualIndex, items, clearTransitionTimer, setTrackNeutralImmediate, commitSlideTransition]
  );

  // Trigger a 1-slide or multi-slide horizontal transition (used by arrows, keyboard, and filmstrip)
  const triggerNavigationStep = useCallback(
    (step: number) => {
      if (total <= 1 || step === 0) return;

      // If a slide is already mid-flight, queue the next step and immediately commit the current one
      if (pendingStepRef.current !== 0) {
        queuedStepRef.current = step;
        commitSlideTransition();
        return;
      }

      if (Math.abs(step) > 1) {
        setCustomStepDelta(step);
        return;
      }

      const trackEl = trackRef.current;
      if (trackEl) {
        // Ensure neutral transform is committed before starting CSS transition
        setTrackNeutralImmediate();
        void trackEl.offsetWidth;
      }

      animateTrackToSlot(step > 0 ? 1 : -1, 0, step);
    },
    [total, commitSlideTransition, setTrackNeutralImmediate, animateTrackToSlot]
  );

  // When customStepDelta is set (e.g. jumping via filmstrip), start the slide once the target neighbor slot mounts
  useLayoutEffect(() => {
    if (customStepDelta === null || customStepDelta === 0) return;
    const trackEl = trackRef.current;
    if (trackEl) {
      setTrackNeutralImmediate();
      void trackEl.offsetWidth;
    }
    animateTrackToSlot(customStepDelta > 0 ? 1 : -1, 0, customStepDelta);
  }, [customStepDelta, setTrackNeutralImmediate, animateTrackToSlot]);

  // Synchronously reposition the track to neutral (-100%) before browser paint when virtualIndex updates!
  // Because the newly selected slide keeps the exact same React key (virtualIndex), its DOM node and decoded <img>
  // stay mounted in place while shifting from Slot 0/2 to Slot 1 at the exact same instant the track shifts to -100%.
  useLayoutEffect(() => {
    setTrackNeutralImmediate();

    if (queuedStepRef.current !== null && total > 1) {
      const nextStep = queuedStepRef.current;
      queuedStepRef.current = null;
      if (Math.abs(nextStep) > 1) {
        setCustomStepDelta(nextStep);
        return;
      }
      const trackEl = trackRef.current;
      if (trackEl) {
        void trackEl.offsetWidth;
      }
      animateTrackToSlot(nextStep > 0 ? 1 : -1, 0, nextStep);
    }
  }, [virtualIndex, total, setTrackNeutralImmediate, animateTrackToSlot]);

  // Preload current image + adjacent images in navigation direction
  useEffect(() => {
    if (total === 0) return;
    void galleryPreloader.prioritizeWindow(items, safeIndex, navDirectionRef.current);
  }, [items, safeIndex, total]);

  // Notify parent when approaching the end of loaded items so next cursor page can prefetch
  useEffect(() => {
    if (onNearEnd && total > 0 && safeIndex >= total - 6) {
      onNearEnd();
    }
  }, [safeIndex, total, onNearEnd]);

  const handlePrev = useCallback(() => {
    triggerNavigationStep(-1);
  }, [triggerNavigationStep]);

  const handleNext = useCallback(() => {
    triggerNavigationStep(1);
  }, [triggerNavigationStep]);

  // Clean up any active timer on unmount
  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  // Handle mobile natural back button / browser back button:
  // When the lightbox opens, append #gallery-view to window.location.
  // When user taps natural/browser back button, hash change triggers closing the lightbox cleanly.
  useEffect(() => {
    // If hash not present, push hash so back button pops it
    const originalHash = window.location.hash;
    if (!window.location.hash.includes("gallery-view")) {
      window.location.hash = "gallery-view";
    }

    const handleHashChange = () => {
      if (!window.location.hash.includes("gallery-view")) {
        onClose();
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      // Clean up hash if lightbox is closed via close button or backdrop click
      if (window.location.hash.includes("gallery-view")) {
        if (originalHash && originalHash !== "#gallery-view") {
          window.location.hash = originalHash;
        } else {
          // Remove hash without adding another history entry or navigating back
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname + window.location.search
          );
        }
      }
    };
  }, [onClose]);

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
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  // Finger-following Touch Handlers on the viewport (0 React state updates during move)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("button")) return;

      // If a transition was in flight when the user touched the screen, commit it immediately
      if (pendingStepRef.current !== 0) {
        queuedStepRef.current = null;
        commitSlideTransition();
      }

      const touch = e.touches[0];
      const now = performance.now();
      dragRef.current = {
        active: true,
        isHorizontal: null,
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastTime: now,
        velocityX: 0,
        deltaX: 0,
      };
      suppressBackdropClickRef.current = false;
    },
    [commitSlideTransition]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag.active || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const dx = touch.clientX - drag.startX;
      const dy = touch.clientY - drag.startY;

      if (drag.isHorizontal === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        drag.isHorizontal = Math.abs(dx) > Math.abs(dy);
        if (!drag.isHorizontal) {
          drag.active = false;
          return;
        }
      }

      if (!drag.isHorizontal) return;

      const now = performance.now();
      const dt = Math.max(1, now - drag.lastTime);
      const instantVelocity = (touch.clientX - drag.lastX) / dt; // px/ms
      drag.velocityX = drag.velocityX * 0.35 + instantVelocity * 0.65;
      drag.lastX = touch.clientX;
      drag.lastTime = now;
      drag.deltaX = dx;

      if (Math.abs(dx) > 8) {
        suppressBackdropClickRef.current = true;
      }

      const trackEl = trackRef.current;
      if (!trackEl) return;

      // Clamp drag displacement to a single viewport width so the user never drags beyond the 3-slide window
      const vw = viewportRef.current?.clientWidth || window.innerWidth || 360;
      const clampedDx = Math.max(-vw, Math.min(vw, dx));

      trackEl.style.transition = "none";
      if (total <= 1) {
        trackEl.style.transform = `translate3d(${clampedDx * 0.2}px, 0, 0)`;
      } else {
        trackEl.style.transform = `translate3d(calc(-100% + ${clampedDx}px), 0, 0)`;
      }
    },
    [total]
  );

  const handleTouchEndOrCancel = useCallback(() => {
    const drag = dragRef.current;
    if (!drag.active) return;

    const wasHorizontal = drag.isHorizontal === true;
    const dx = drag.deltaX;
    const vx = drag.velocityX;

    drag.active = false;
    drag.isHorizontal = null;
    drag.deltaX = 0;
    drag.velocityX = 0;

    if (!wasHorizontal) return;

    if (total <= 1) {
      animateTrackToSlot(0);
      return;
    }

    const vw = viewportRef.current?.clientWidth || window.innerWidth || 360;
    const distanceThreshold = Math.min(85, vw * 0.18);
    const isFlickNext = vx < -0.35 && dx < -18;
    const isFlickPrev = vx > 0.35 && dx > 18;

    if (dx < -distanceThreshold || isFlickNext) {
      // Finger dragged left -> advance to Next slide (Slot 2)
      animateTrackToSlot(1, vx, 1);
    } else if (dx > distanceThreshold || isFlickPrev) {
      // Finger dragged right -> go to Previous slide (Slot 0)
      animateTrackToSlot(-1, vx, -1);
    } else {
      // Gesture was not decisive -> smoothly return to Current slide (Slot 1)
      animateTrackToSlot(0);
    }
  }, [total, animateTrackToSlot]);

  const handleTrackTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== trackRef.current || e.propertyName !== "transform") return;
      if (pendingStepRef.current !== 0) {
        commitSlideTransition();
      }
    },
    [commitSlideTransition]
  );

  const handleBackdropClick = useCallback(() => {
    if (suppressBackdropClickRef.current) {
      suppressBackdropClickRef.current = false;
      return;
    }
    onClose();
  }, [onClose]);

  // Bounded 3-slide window: [Previous, Current, Next]
  const slideWindow = useMemo(() => {
    if (total === 0) return [];
    if (total === 1) {
      return [{ vIndex: virtualIndex, item: items[0], isActive: true }];
    }

    const prevStep =
      customStepDelta !== null && customStepDelta < 0 ? customStepDelta : -1;
    const nextStep =
      customStepDelta !== null && customStepDelta > 0 ? customStepDelta : 1;

    const prevVIndex = virtualIndex + prevStep;
    const nextVIndex = virtualIndex + nextStep;

    return [
      {
        vIndex: prevVIndex,
        item: items[wrapIndex(prevVIndex, total)],
        isActive: false,
      },
      {
        vIndex: virtualIndex,
        item: items[wrapIndex(virtualIndex, total)],
        isActive: true,
      },
      {
        vIndex: nextVIndex,
        item: items[wrapIndex(nextVIndex, total)],
        isActive: false,
      },
    ];
  }, [items, total, virtualIndex, customStepDelta]);

  // 5 to 7 photos filmstrip carousel window calculation
  const carouselItems = useMemo(() => {
    if (total <= 7) {
      return items.map((item, idx) => ({ item, index: idx }));
    }

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery lightbox"
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95 select-none touch-none backdrop-blur-md"
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

      {/* Main Clipped Viewport */}
      <div
        ref={viewportRef}
        className="flex-1 relative w-full h-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEndOrCancel}
        onTouchCancel={handleTouchEndOrCancel}
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
            className="hidden sm:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e8622a] cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Continuous Horizontal Track: [Prev Slide, Current Slide, Next Slide] */}
        <div
          ref={trackRef}
          onTransitionEnd={handleTrackTransitionEnd}
          className="flex w-full h-full will-change-transform"
        >
          {slideWindow.map((slide) => (
            <GallerySlide
              key={slide.vIndex}
              item={slide.item}
              isActive={slide.isActive}
              onBackdropClick={handleBackdropClick}
            />
          ))}
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
            className="hidden sm:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e8622a] cursor-pointer"
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
            <div className="w-full flex items-center justify-center gap-1 min-[380px]:gap-1.5 sm:gap-2.5 py-1">
              {carouselItems.map((thumb) => {
                const isActive = thumb.index === safeIndex;
                const filmstripSrc = getThumbnailImageUrl(thumb.item);
                return (
                  <button
                    key={thumb.item.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const delta = thumb.index - safeIndex;
                      if (delta !== 0) {
                        triggerNavigationStep(delta);
                      }
                    }}
                    aria-label={`View photo ${thumb.index + 1}: ${thumb.item.title || "Moment"}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`relative rounded-lg overflow-hidden transition-all duration-200 motion-reduce:transition-none cursor-pointer shrink-0 ${
                      isActive
                        ? "w-11 h-11 min-[380px]:w-12 min-[380px]:h-12 sm:w-16 sm:h-16 ring-2 ring-[#e8622a] border-2 border-white scale-105 shadow-xl opacity-100 z-10"
                        : "w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 sm:w-13 sm:h-13 border border-white/25 opacity-45 hover:opacity-90 hover:scale-105"
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
