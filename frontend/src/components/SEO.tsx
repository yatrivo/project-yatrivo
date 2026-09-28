import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noindex?: boolean;
}

const DEFAULT_ORIGIN = "https://yatrivo.co.in";
const DEFAULT_IMAGE = "https://yatrivo.co.in/favicon.png";

function setMetaTag(attrName: "name" | "property", attrValue: string, content: string | undefined) {
  if (typeof document === "undefined") return;
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!content) {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(href: string | undefined) {
  if (typeof document === "undefined") return;
  let element = document.querySelector('link[rel="canonical"]');
  if (!href) {
    if (element) element.remove();
    return;
  }
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export default function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  noindex = false,
}: SEOProps) {
  const { siteSettings } = useApp();
  const location = useLocation();

  // Read admin customized values from siteSettings
  const adminTagline = siteSettings?.general?.tagline?.trim();
  const adminDescription = siteSettings?.general?.siteDescription?.trim();

  const brandTagline = adminTagline || "Explore More. Travel Better.";
  const defaultDesc =
    adminDescription ||
    "Uttarakhand's premium travel collective for mindful explorers. We design high-fidelity mountain retreats, spiritual pilgrimages, and raw alpine treks.";

  // Compute final title and description
  const finalTitle = title
    ? title.includes("Yatrivo")
      ? title
      : `${title} | Yatrivo`
    : `Yatrivo — ${brandTagline}`;

  const finalDesc = description || defaultDesc;

  const currentOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : DEFAULT_ORIGIN;

  const finalUrl = url || `${currentOrigin}${location.pathname}`;
  const finalImage = image
    ? image.startsWith("http")
      ? image
      : `${currentOrigin}${image.startsWith("/") ? "" : "/"}${image}`
    : DEFAULT_IMAGE;

  useEffect(() => {
    // 1. Document Title
    document.title = finalTitle;

    // 2. Primary Meta Tags
    setMetaTag("name", "description", finalDesc);
    setMetaTag(
      "name",
      "keywords",
      keywords ||
        "Yatrivo, Uttarakhand treks, Kedarnath, Chopta Tungnath, Chandrashila, Himalayan expeditions, Uttarakhand travel, alpine treks"
    );
    setMetaTag(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );
    setMetaTag("name", "author", "Yatrivo Himalayan Collective");

    // 3. Canonical Link
    setCanonical(finalUrl);

    // 4. OpenGraph Tags (Facebook, WhatsApp, LinkedIn, Google)
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:site_name", "Yatrivo");
    setMetaTag("property", "og:title", finalTitle);
    setMetaTag("property", "og:description", finalDesc);
    setMetaTag("property", "og:url", finalUrl);
    setMetaTag("property", "og:image", finalImage);
    setMetaTag("property", "og:locale", "en_IN");

    // 5. Twitter Card Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:site", "@yatrivo");
    setMetaTag("name", "twitter:creator", "@yatrivo");
    setMetaTag("name", "twitter:title", finalTitle);
    setMetaTag("name", "twitter:description", finalDesc);
    setMetaTag("name", "twitter:image", finalImage);
  }, [finalTitle, finalDesc, finalUrl, finalImage, keywords, noindex, type]);

  return null;
}
