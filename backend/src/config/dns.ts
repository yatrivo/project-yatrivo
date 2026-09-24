import dns from "node:dns";
import { logger } from "./logger";

// Campus / institutional fallback DNS servers
const FALLBACK_DNS_SERVERS = ["172.16.1.2", "172.16.1.3", "1.1.1.1", "8.8.8.8"];

const originalLookup = dns.lookup;
const dnsCache = new Map<string, string>();

let fallbackResolver: dns.promises.Resolver | null = null;

function getFallbackResolver(): dns.promises.Resolver {
  if (!fallbackResolver) {
    fallbackResolver = new dns.promises.Resolver();
    try {
      fallbackResolver.setServers(FALLBACK_DNS_SERVERS);
    } catch {
      // Ignore if system restricts setting servers
    }
  }
  return fallbackResolver;
}

/**
 * Enhanced DNS lookup to protect against institutional network DNS sinkholes
 * (e.g., campus networks mapping external AWS/Neon hosts to 192.0.2.1 via broken IPv6 DNS).
 */
const patchedLookup = function (
  hostname: string,
  options: any,
  callback?: any
): void {
  let cb: any;
  let opts: any;

  if (typeof options === "function") {
    cb = options;
    opts = {};
  } else if (typeof options === "number") {
    cb = callback!;
    opts = { family: options };
  } else {
    cb = callback!;
    opts = options || {};
  }

  // Neon Database and Object Storage domains
  const isNeonHost = typeof hostname === "string" && hostname.includes("neon.tech");

  if (isNeonHost) {
    const cachedIp = dnsCache.get(hostname);
    if (cachedIp) {
      if (opts.all) {
        return cb(null, [{ address: cachedIp, family: 4 }], 4);
      }
      return cb(null, cachedIp, 4);
    }

    // Direct IPv4 resolution bypasses OS getaddrinfo IPv6 priority
    dns.resolve4(hostname, async (err, addresses) => {
      if (!err && addresses && addresses.length > 0 && addresses[0] !== "192.0.2.1") {
        const ip = addresses[0];
        dnsCache.set(hostname, ip);
        if (opts.all) {
          return cb(null, [{ address: ip, family: 4 }], 4);
        }
        return cb(null, ip, 4);
      }

      // If default resolver fails or returns sinkhole, query fallback resolver
      try {
        const fallbackIps = await getFallbackResolver().resolve4(hostname);
        if (fallbackIps && fallbackIps.length > 0) {
          const ip = fallbackIps[0];
          dnsCache.set(hostname, ip);
          if (opts.all) {
            return cb(null, [{ address: ip, family: 4 }], 4);
          }
          return cb(null, ip, 4);
        }
      } catch {
        // Fall back to original lookup
      }

      originalLookup(hostname, opts, cb as any);
    });
    return;
  }

  // Default lookup for all other hostnames
  originalLookup(hostname, opts, async (err, address, family) => {
    // Detect 192.0.2.1 sinkhole
    if (!err && address === "192.0.2.1") {
      try {
        const fallbackIps = await getFallbackResolver().resolve4(hostname);
        if (fallbackIps && fallbackIps.length > 0) {
          const ip = fallbackIps[0];
          dnsCache.set(hostname, ip);
          if (opts.all) {
            return cb(null, [{ address: ip, family: 4 }], 4);
          }
          return cb(null, ip, 4);
        }
      } catch {
        // Continue with original sinkhole response if fallback fails
      }
    }

    cb(err, address, family);
  });
};

(patchedLookup as any).__promisify__ = (originalLookup as any).__promisify__;
(dns as any).lookup = patchedLookup;

logger.info("Resilient DNS resolver initialized");
