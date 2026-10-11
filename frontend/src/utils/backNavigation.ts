import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface HistoryEntryRecord {
  pathname: string;
  search: string;
  hash: string;
  key: string;
}

const STORAGE_KEY = "yatrivo_in_app_history_v1";

let memoryHistoryStack: Record<number, HistoryEntryRecord> = {};
let pendingBackHash: string | null = null;
let initializedFromStorage = false;

function ensureInitialized(): void {
  if (initializedFromStorage || typeof window === "undefined") return;
  initializedFromStorage = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        memoryHistoryStack = parsed;
      }
    }
  } catch {
    // Ignore storage read errors
  }
}

function persistStack(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memoryHistoryStack));
  } catch {
    // Ignore storage write errors
  }
}

export function getHistoryIndex(): number {
  if (typeof window === "undefined") return 0;
  const idx = window.history.state?.idx;
  return typeof idx === "number" && idx >= 0 ? idx : 0;
}

export function recordNavigationEntry(
  pathname: string,
  search: string,
  hash: string,
  key: string
): void {
  ensureInitialized();
  const idx = getHistoryIndex();
  memoryHistoryStack[idx] = { pathname, search, hash, key };
  persistStack();
}

export function setPendingBackHash(hash: string | null): void {
  pendingBackHash = hash;
}

export function consumePendingBackHash(): string | null {
  const hash = pendingBackHash;
  pendingBackHash = null;
  return hash;
}

export function parseTargetUrl(to: string): {
  pathname: string;
  search: string;
  hash: string;
} {
  let pathPart = to;
  let hash = "";
  let search = "";

  const hashIdx = pathPart.indexOf("#");
  if (hashIdx !== -1) {
    hash = pathPart.slice(hashIdx);
    pathPart = pathPart.slice(0, hashIdx);
  }

  const searchIdx = pathPart.indexOf("?");
  if (searchIdx !== -1) {
    search = pathPart.slice(searchIdx);
    pathPart = pathPart.slice(0, searchIdx);
  }

  const pathname = pathPart || "/";
  return { pathname, search, hash };
}

function normalizePathname(p: string): string {
  if (!p || p === "/") return "/";
  return p.endsWith("/") ? p.slice(0, -1) : p;
}

/**
 * Checks whether the immediately preceding entry in the browser's history
 * belongs to this Yatrivo session and matches the designated target route.
 */
export function canPopToTarget(to: string): { canPop: boolean; targetHash: string } {
  ensureInitialized();
  const idx = getHistoryIndex();
  const { pathname: targetPathname, search: targetSearch, hash: targetHash } = parseTargetUrl(to);

  if (idx <= 0) {
    return { canPop: false, targetHash };
  }

  const prevEntry = memoryHistoryStack[idx - 1];
  if (!prevEntry) {
    return { canPop: false, targetHash };
  }

  const prevNorm = normalizePathname(prevEntry.pathname);
  const targetNorm = normalizePathname(targetPathname);

  if (prevNorm !== targetNorm) {
    return { canPop: false, targetHash };
  }

  // If the back target explicitly requires specific query params, match them;
  // otherwise allow popping back to the parent page with its existing query/filter state preserved.
  if (targetSearch && prevEntry.search !== targetSearch) {
    return { canPop: false, targetHash };
  }

  return { canPop: true, targetHash };
}

/**
 * Hook returning a navigation function for Back-to-section buttons.
 * - If the user arrived from the designated parent route in this session (`idx - 1`),
 *   pops back (`navigate(-1)`) so no duplicate parent entry is created and Browser Back
 *   continues to the page before the parent (e.g., Home).
 * - Otherwise (direct entry, bookmark, external referrer, or arrived from a different page),
 *   navigates to `to` with `{ replace: true }` so the detail page does not remain as a
 *   redundant entry in browser history.
 */
export function useBackNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (to: string) => {
      const { canPop, targetHash } = canPopToTarget(to);
      if (canPop) {
        if (targetHash) {
          setPendingBackHash(targetHash);
        }
        navigate(-1);
      } else {
        navigate(to, { replace: true });
      }
    },
    [navigate]
  );
}
