import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { type SiteAssetKey } from "@/api/siteAssets";

export interface SiteImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  assetKey: SiteAssetKey | string;
  fallback?: string;
  alt: string;
  className?: string;
  showSkeleton?: boolean;
}

/**
 * Hook to retrieve the current URL and metadata for any site asset key.
 */
export function useSiteAsset(assetKey: SiteAssetKey | string, fallback?: string) {
  const { siteAssets } = useApp();
  const asset = siteAssets[assetKey];
  return {
    url: asset?.imageUrl || fallback || null,
    alt: asset?.altText || "",
    isCustom: Boolean(asset?.imageUrl),
    isExternal: Boolean(asset?.imageUrl && !asset?.storageKey && !asset.imageUrl.includes("yatrivo-media")),
  };
}

/**
 * SiteImage renders an admin-managed static image.
 * - Prevents image flash by fading in smoothly once decoded.
 * - If no image is configured in the database, displays a clean brand gradient
 *   rather than requesting random external template assets.
 */
export default function SiteImage({
  assetKey,
  fallback,
  alt,
  className = "",
  showSkeleton = true,
  onLoad,
  ...rest
}: SiteImageProps) {
  const { siteAssets } = useApp();
  const [isLoaded, setIsLoaded] = useState(false);

  const asset = siteAssets[assetKey];
  const src = asset?.imageUrl || fallback || "";
  const effectiveAlt = asset?.altText || alt;

  // If no image is configured, render a clean brand forest gradient
  if (!src) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-[#0f2922] via-[#1a4a39] to-[#0f2922] flex items-center justify-center`}
        aria-label={effectiveAlt}
      >
        <span className="text-white/20 font-serif text-2xl select-none">🏔️ Yatrivo</span>
      </div>
    );
  }

  return (
    <>
      {showSkeleton && !isLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#0f2922]/20 backdrop-blur-2xs animate-pulse pointer-events-none z-0"
        />
      )}
      <img
        src={src}
        alt={effectiveAlt}
        className={`${className} transition-opacity duration-300 ${!isLoaded ? "opacity-0" : "opacity-100"}`}
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        {...rest}
      />
    </>
  );
}
