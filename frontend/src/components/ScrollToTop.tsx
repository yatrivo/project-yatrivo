import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { recordNavigationEntry, consumePendingBackHash } from "@/utils/backNavigation";

export default function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();

  useEffect(() => {
    recordNavigationEntry(pathname, search, hash, key);
  }, [pathname, search, hash, key]);

  useEffect(() => {
    const pendingHash = consumePendingBackHash();
    const effectiveHash = hash || pendingHash;
    if (effectiveHash && effectiveHash !== "#gallery-view") {
      const targetId = effectiveHash.replace("#", "");
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return;
      }
      const timer = setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
    if (effectiveHash === "#gallery-view") {
      // Do nothing to scroll position when gallery lightbox opens/closes
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}
