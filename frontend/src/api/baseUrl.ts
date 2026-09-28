/**
 * Dynamically resolves the API base URL.
 * In development, if accessing the frontend via a network IP/domain (e.g., http://10.129.4.62:3000),
 * any 'localhost' in VITE_API_BASE_URL is automatically replaced with the current network hostname.
 */
export function getApiBaseUrl(): string {
  const envBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

  if (
    typeof window !== "undefined" &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    if (envBase.includes("localhost") || envBase.includes("127.0.0.1")) {
      return envBase.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
    }
    if (!envBase) {
      return `${window.location.protocol}//${window.location.hostname}:4000`;
    }
  }

  return envBase;
}

export const API_BASE = getApiBaseUrl();
