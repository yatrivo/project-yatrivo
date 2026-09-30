import React, { useState } from "react";

export interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatioClass?: string;
  priority?: boolean; // If true, eager loading for hero/above-the-fold
  fallbackIcon?: string;
  showSkeleton?: boolean;
}

/**
 * ProgressiveImage provides:
 * 1. Immediate structural presence without waiting for the network.
 * 2. Elegant, non-jarring mountain placeholder / skeleton while loading.
 * 3. Native loading="lazy" for below-the-fold assets, loading="eager" for priority/hero assets.
 * 4. Smooth opacity fade-in once decoded, preventing layout shift or flashing.
 * 5. Clean brand fallback if image is missing or errors out.
 */
export default function ProgressiveImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "relative w-full h-full overflow-hidden",
  aspectRatioClass = "",
  priority = false,
  fallbackIcon = "🏔️",
  showSkeleton = true,
  onLoad,
  onError,
  ...imgProps
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // If no source is provided or image errored, show elegant mountain brand fallback
  if (!src || hasError) {
    return (
      <div
        className={`${containerClassName} ${aspectRatioClass} bg-gradient-to-br from-[#071712] via-[#0f2922] to-[#1a4a39] flex items-center justify-center select-none`}
        aria-label={alt}
      >
        <span className="text-white/20 text-3xl font-serif">{fallbackIcon}</span>
      </div>
    );
  }

  return (
    <div className={`${containerClassName} ${aspectRatioClass}`}>
      {/* Background skeleton placeholder while image downloads / decodes */}
      {showSkeleton && !isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#071712] via-[#0f2922] to-[#122e26] animate-pulse pointer-events-none z-0"
        />
      )}

      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`${className} transition-opacity duration-500 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setHasError(true);
          onError?.(e);
        }}
        {...imgProps}
      />
    </div>
  );
}
