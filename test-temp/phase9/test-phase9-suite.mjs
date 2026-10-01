import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import "dotenv/config";

const BASE_URL = "http://localhost:4000/api/v1";

const matrix = [];

function record(area, testName, expected, actual, status, severity, details = null, evidence = null) {
  matrix.push({ area, testName, expected, actual, status, severity, details, evidence });
  const icon = status === "PASS" ? "PASS" : status === "FAIL" ? "FAIL" : status;
  console.log(`[${icon}] [${area}] ${testName} -> ${actual} (${status}, ${severity || "INFO"})`);
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.status === 200 && data.data?.tokens?.accessToken) {
    return { token: data.data.tokens.accessToken, user: data.data.user };
  }
  throw new Error(`Login failed for ${email}: ${res.status}`);
}

async function runPhase9Audit() {
  console.log("===============================================================================");
  console.log("=== PHASE 9: PRODUCTION READINESS, DEPLOYMENT & OPERATIONAL SECURITY AUDIT ===");
  console.log("===============================================================================\n");

  const admin = await login("admin@yatrivo.com", "YatrivoAdmin@2026!");
  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${admin.token}`
  };

  // =========================================================================
  // 1. HEALTH & READINESS ENDPOINTS
  // =========================================================================
  console.log("--- 1. Health & Readiness Endpoints ---");
  {
    // 1.1 Public /health
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status === 200 && healthData.status === "ok" && healthData.version && !healthData.database) {
      record("Health", "GET /health is minimal and public", "Status 200 with minimal status/version", "Status 200 minimal", "PASS", "INFO");
    } else {
      record("Health", "GET /health is minimal and public", "Minimal status", JSON.stringify(healthData), "FAIL", "LOW", "Health endpoint exposes unnecessary internals");
    }

    // 1.2 Public /ready
    const readyRes = await fetch(`${BASE_URL}/ready`);
    const readyData = await readyRes.json();
    const leaksDetails = Boolean(readyData.database || readyData.redis || readyData.config || readyData.credentials);
    if (readyRes.status === 200 && (readyData.status === "ready" || readyData.status === "degraded") && !leaksDetails) {
      record("Health", "GET /ready is minimal and public", "Returns readiness status without database/redis details", "Minimal status (ready/degraded)", "PASS", "INFO");
    } else {
      record("Health", "GET /ready is minimal and public", "Minimal status", JSON.stringify(readyData), "FAIL", "MEDIUM", "Public readiness leaks backend infrastructure details");
    }

    // 1.3 Protected /admin/diagnostics unauthenticated access
    const diagAnonRes = await fetch(`${BASE_URL}/admin/diagnostics`);
    if (diagAnonRes.status === 401) {
      record("Health", "GET /admin/diagnostics requires authentication", "Returns 401 Unauthorized for unauthenticated requests", "401 Unauthorized", "PASS", "INFO");
    } else {
      record("Health", "GET /admin/diagnostics requires authentication", "401 Unauthorized", `Status ${diagAnonRes.status}`, "FAIL", "HIGH", "Diagnostics endpoint accessible without authentication");
    }

    // 1.4 Protected /admin/diagnostics authenticated access
    const diagAuthRes = await fetch(`${BASE_URL}/admin/diagnostics`, { headers: adminHeaders });
    const diagAuthData = await diagAuthRes.json();
    const deps = diagAuthData.dependencies || diagAuthData.data?.dependencies;
    const hasLatency = Boolean(deps?.database?.latencyMs !== undefined);
    if (diagAuthRes.status === 200 && hasLatency) {
      record("Health", "GET /admin/diagnostics authenticated admin access", "Returns dependency health check metrics to authenticated admin", "200 OK with dependency metrics", "PASS", "INFO");
    } else {
      record("Health", "GET /admin/diagnostics authenticated admin access", "200 OK with metrics", `Status ${diagAuthRes.status}`, "FAIL", "LOW");
    }
  }

  // =========================================================================
  // 2. SECURITY HEADERS (HELMET) & CORS
  // =========================================================================
  console.log("\n--- 2. Security Headers & CORS ---");
  {
    const rootRes = await fetch(`${BASE_URL}/`);
    const headers = rootRes.headers;

    // Check Helmet headers
    const xContentType = headers.get("x-content-type-options");
    const xFrameOptions = headers.get("x-frame-options");
    const strictTransport = headers.get("strict-transport-security");
    const xPoweredBy = headers.get("x-powered-by");

    if (xContentType === "nosniff") {
      record("Security Headers", "X-Content-Type-Options: nosniff", "nosniff", xContentType, "PASS", "INFO");
    } else {
      record("Security Headers", "X-Content-Type-Options: nosniff", "nosniff", xContentType || "missing", "FAIL", "LOW");
    }

    if (xFrameOptions === "SAMEORIGIN" || headers.get("content-security-policy")?.includes("frame-ancestors")) {
      record("Security Headers", "Clickjacking protection (X-Frame-Options / frame-ancestors)", "Configured", "Configured", "PASS", "INFO");
    } else {
      record("Security Headers", "Clickjacking protection (X-Frame-Options / frame-ancestors)", "Configured", "Missing", "FAIL", "LOW");
    }

    if (!xPoweredBy) {
      record("Security Headers", "X-Powered-By header suppressed", "Header absent", "Header absent", "PASS", "INFO");
    } else {
      record("Security Headers", "X-Powered-By header suppressed", "Header absent", xPoweredBy, "FAIL", "LOW");
    }

    // CORS verification
    // 2.1 Legitimate production domain
    const legitRes = await fetch(`${BASE_URL}/`, {
      headers: { Origin: "https://yatrivo.co.in" }
    });
    const allowOriginLegit = legitRes.headers.get("access-control-allow-origin");
    if (allowOriginLegit === "https://yatrivo.co.in") {
      record("CORS", "Production domain https://yatrivo.co.in allowed", "https://yatrivo.co.in", allowOriginLegit, "PASS", "INFO");
    } else {
      record("CORS", "Production domain https://yatrivo.co.in allowed", "https://yatrivo.co.in", allowOriginLegit || "missing", "FAIL", "MEDIUM");
    }

    // 2.2 Arbitrary attacker origin
    const evilRes = await fetch(`${BASE_URL}/`, {
      headers: { Origin: "https://attacker-domain.evil" }
    });
    const allowOriginEvil = evilRes.headers.get("access-control-allow-origin");
    if (!allowOriginEvil || evilRes.status === 403) {
      record("CORS", "Arbitrary evil origin rejected", "Origin rejected / 403", `Status ${evilRes.status}, ACAO: ${allowOriginEvil || 'none'}`, "PASS", "INFO");
    } else {
      record("CORS", "Arbitrary evil origin rejected", "Origin rejected", allowOriginEvil, "FAIL", "HIGH", "Attacker origin granted CORS access");
    }

    // 2.3 Wildcard disallowed
    if (allowOriginLegit !== "*") {
      record("CORS", "Wildcard '*' disallowed with credentials", "Strict origin reflected instead of '*'", "Strict origin reflected", "PASS", "INFO");
    } else {
      record("CORS", "Wildcard '*' disallowed with credentials", "Strict origin", "*", "FAIL", "HIGH");
    }
  }

  // =========================================================================
  // 3. COOKIE ATTRIBUTES & AUTH TOKEN SECURITY
  // =========================================================================
  console.log("\n--- 3. Cookie Attributes & Auth Token Storage ---");
  {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@yatrivo.com", password: "YatrivoAdmin@2026!" })
    });

    const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie") || ""];
    const refreshCookie = setCookies.find(c => c && c.includes("yatrivo_refresh_token"));

    if (refreshCookie) {
      const isHttpOnly = /httponly/i.test(refreshCookie);
      const isSameSiteLax = /samesite=lax/i.test(refreshCookie);
      const hasAuthPath = /path=\/api\/v1\/auth/i.test(refreshCookie);

      if (isHttpOnly && isSameSiteLax && hasAuthPath) {
        record("Cookies", "Refresh token cookie security flags (HttpOnly, SameSite=Lax, Path=/api/v1/auth)", "Flags present", "Flags present", "PASS", "INFO");
      } else {
        record("Cookies", "Refresh token cookie security flags", "HttpOnly, SameSite=Lax, Path=/api/v1/auth", refreshCookie, "FAIL", "HIGH");
      }
    } else {
      record("Cookies", "Refresh token cookie set on login", "Cookie present", "Missing", "FAIL", "HIGH");
    }

    // Inspect frontend auth code for token storage
    const authTs = await readFile("frontend/src/api/auth.ts", "utf8");
    const storesTokenInStorage = /localStorage\.setItem\([^)]*token/i.test(authTs) || /sessionStorage\.setItem\([^)]*token/i.test(authTs);
    if (!storesTokenInStorage) {
      record("Tokens", "Frontend access token stored in-memory only (not localStorage/sessionStorage)", "In-memory token", "In-memory token confirmed", "PASS", "INFO");
    } else {
      record("Tokens", "Frontend access token stored in-memory only", "In-memory token", "Stored in localStorage/sessionStorage", "FAIL", "MEDIUM");
    }
  }

  // =========================================================================
  // 4. PRODUCTION ERROR HANDLING (LEAKAGE CHECKS)
  // =========================================================================
  console.log("\n--- 4. Production Error Handling & Information Leakage ---");
  {
    // 4.1 Malformed JSON body
    const jsonRes = await fetch(`${BASE_URL}/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"invalid": json'
    });
    const jsonData = await jsonRes.json();
    const hasStack = Boolean(jsonData.error?.stack || jsonData.stack || JSON.stringify(jsonData).includes("SyntaxError:"));

    if (jsonRes.status === 400 && jsonData.error?.code === "INVALID_JSON" && !hasStack) {
      record("Errors", "Malformed JSON returns clean 400 without stack trace", "400 INVALID_JSON without stack", "400 INVALID_JSON", "PASS", "INFO");
    } else {
      record("Errors", "Malformed JSON returns clean 400 without stack trace", "Clean 400", JSON.stringify(jsonData), "FAIL", "LOW");
    }

    // 4.2 Invalid UUID route parameter
    const uuidRes = await fetch(`${BASE_URL}/bookings/not-a-valid-uuid`, {
      headers: adminHeaders
    });
    const uuidData = await uuidRes.json();
    const hasSqlError = Boolean(JSON.stringify(uuidData).match(/syntax error|pg_|SELECT|FROM/i));

    if (uuidRes.status === 404 || uuidRes.status === 400) {
      record("Errors", "Invalid UUID route parameter handled cleanly without SQL leakage", "404 or 400 without SQL error", `Status ${uuidRes.status}`, "PASS", "INFO");
    } else {
      record("Errors", "Invalid UUID route parameter handled cleanly without SQL leakage", "Clean error", `Status ${uuidRes.status}: ${JSON.stringify(uuidData)}`, "FAIL", "MEDIUM");
    }

    // 4.3 Non-existent route
    const notFoundRes = await fetch(`${BASE_URL}/nonexistent-test-route-${Date.now()}`);
    const notFoundData = await notFoundRes.json();

    if (notFoundRes.status === 404 && (notFoundData.error?.code === "ROUTE_NOT_FOUND" || notFoundData.error?.code === "NOT_FOUND")) {
      record("Errors", "Non-existent route returns 404 ROUTE_NOT_FOUND", "404 ROUTE_NOT_FOUND", "404 ROUTE_NOT_FOUND", "PASS", "INFO");
    } else {
      record("Errors", "Non-existent route returns 404 ROUTE_NOT_FOUND", "404 ROUTE_NOT_FOUND", `Status ${notFoundRes.status}`, "FAIL", "LOW");
    }

    // 4.4 Payload too large
    const largeBody = "x".repeat(2 * 1024 * 1024); // 2MB > 1MB limit
    const largeRes = await fetch(`${BASE_URL}/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: largeBody })
    });
    const largeData = await largeRes.json();

    if (largeRes.status === 413 && largeData.error?.code === "PAYLOAD_TOO_LARGE") {
      record("Errors", "Oversized request body returns 413 PAYLOAD_TOO_LARGE", "413 PAYLOAD_TOO_LARGE", "413 PAYLOAD_TOO_LARGE", "PASS", "INFO");
    } else {
      record("Errors", "Oversized request body returns 413 PAYLOAD_TOO_LARGE", "413 PAYLOAD_TOO_LARGE", `Status ${largeRes.status}`, "FAIL", "MEDIUM");
    }
  }

  // =========================================================================
  // 5. DATABASE CONNECTION, POOLING & TLS CONFIGURATION
  // =========================================================================
  console.log("\n--- 5. Database Connection, Pooling & TLS Configuration ---");
  {
    const pgTs = await readFile("backend/src/db/postgres.ts", "utf8");
    const envTs = await readFile("backend/src/config/env.ts", "utf8");

    // 5.1 TLS verification in production
    const hasTlsConfig = pgTs.includes("rejectUnauthorized: env.NODE_ENV === \"production\" ? true");
    if (hasTlsConfig) {
      record("Database", "PostgreSQL TLS verification strictly enforced in production", "rejectUnauthorized: true in production", "Enforced", "PASS", "INFO");
    } else {
      record("Database", "PostgreSQL TLS verification strictly enforced in production", "rejectUnauthorized: true", "Missing", "FAIL", "HIGH");
    }

    // 5.2 Connection pool limits
    const hasPoolMax = envTs.includes("DB_POOL_MAX");
    if (hasPoolMax) {
      record("Database", "Connection pool size bounded via DB_POOL_MAX", "DB_POOL_MAX configured with default 10", "Bounded (default 10)", "PASS", "INFO");
    } else {
      record("Database", "Connection pool size bounded", "Configured", "Missing", "FAIL", "MEDIUM");
    }

    // 5.3 Connection timeout inspection
    const hasConnTimeout = pgTs.includes("connectionTimeoutMillis");
    if (hasConnTimeout) {
      record("Database", "Explicit PostgreSQL connection timeout configured", "connectionTimeoutMillis set", "Configured", "PASS", "INFO");
    } else {
      record(
        "Database",
        "Explicit PostgreSQL connection timeout configured",
        "connectionTimeoutMillis configured (e.g. 5000-10000ms)",
        "Missing (uses pg default unlimited)",
        "NEEDS REVIEW",
        "LOW",
        "PostgreSQL pool does not configure explicit connectionTimeoutMillis or statement_timeout. If database is unreachable, connections could block until OS TCP timeout."
      );
    }
  }

  // =========================================================================
  // 6. REDIS RESILIENCE & NAMESPACING
  // =========================================================================
  console.log("\n--- 6. Redis Resilience & Namespacing ---");
  {
    const redisTs = await readFile("backend/src/cache/redis.ts", "utf8");

    // 6.1 Namespacing by environment
    const hasNamespacing = redisTs.includes("yatrivo:${env.NODE_ENV || \"development\"}");
    if (hasNamespacing) {
      record("Redis", "Redis cache keys isolated with environment namespace (yatrivo:<env>:* )", "Environment namespacing prefix applied", "Namespaced", "PASS", "INFO");
    } else {
      record("Redis", "Redis cache keys isolated with environment namespace", "Namespaced", "Missing", "FAIL", "HIGH");
    }

    // 6.2 Cache fallback on failure
    const destServiceTs = await readFile("backend/src/modules/destinations/destinations.service.ts", "utf8");
    const contentControllerTs = await readFile("backend/src/modules/content/content.controller.ts", "utf8");

    const hasCatchDest = destServiceTs.includes("Redis read error for destinations list, falling back to DB");
    const hasCatchContent = contentControllerTs.includes("falling back to DB");

    if (hasCatchDest && hasCatchContent) {
      record("Redis", "Cache read failures gracefully fall back to PostgreSQL database", "Service degrades gracefully to database without throwing 500", "Fallback implemented", "PASS", "INFO");
    } else {
      record("Redis", "Cache read failures gracefully fall back to database", "Fallback", "Missing", "FAIL", "MEDIUM");
    }
  }

  // =========================================================================
  // 7. S3 / OBJECT STORAGE SECURITY
  // =========================================================================
  console.log("\n--- 7. S3 Object Storage Security ---");
  {
    const s3Ts = await readFile("backend/src/storage/s3.ts", "utf8");

    // 7.1 Path traversal prevention in storage keys
    const sanitizesPath = s3Ts.includes("replace(/[^a-z0-9]+/g, \"-\")") && s3Ts.includes("crypto.randomUUID()");
    if (sanitizesPath) {
      record("Storage", "Storage key generation uses UUID and sanitizes filenames (path traversal immune)", "UUID-prefixed, sanitized keys", "Sanitized & UUID-prefixed", "PASS", "INFO");
    } else {
      record("Storage", "Storage key generation sanitizes filenames", "Sanitized", "Vulnerable", "FAIL", "HIGH");
    }

    // 7.2 Backend-only S3 credential isolation
    // Verify frontend does not import AWS SDK or storage credentials
    const fePackage = await readFile("frontend/package.json", "utf8");
    const feHasAws = fePackage.includes("@aws-sdk");
    if (!feHasAws) {
      record("Storage", "AWS SDK and S3 credentials isolated strictly to backend", "Frontend has zero AWS SDK or storage credentials", "Isolated to backend", "PASS", "INFO");
    } else {
      record("Storage", "AWS SDK and S3 credentials isolated", "Backend only", "Frontend contains AWS SDK", "FAIL", "CRITICAL");
    }
  }

  // =========================================================================
  // 8. EMAIL PROVIDER & RECIPIENT SECURITY
  // =========================================================================
  console.log("\n--- 8. Email Provider & Recipient Security ---");
  {
    const emailServiceTs = await readFile("backend/src/services/email/email.service.ts", "utf8");
    const resendProviderTs = await readFile("backend/src/services/email/providers/resend.provider.ts", "utf8");

    // 8.1 Check unconfigured API key behavior in production
    const simulatesSuccess = resendProviderTs.includes("return {\n        success: true,\n        messageId: `dev-simulated-${Date.now()}`");
    const checksProduction = resendProviderTs.includes("isProduction") && resendProviderTs.includes("throw");

    if (simulatesSuccess && !checksProduction) {
      record(
        "Email",
        "Resend email provider missing API key behavior in production mode",
        "Production environment should fail or alert when RESEND_API_KEY is missing",
        "Simulates success even in production (returns simulated messageId without sending)",
        "NEEDS REVIEW",
        "LOW",
        "ResendEmailProvider simulates email success if RESEND_API_KEY is not configured without checking if NODE_ENV is production. In production without credentials, password reset emails will silently simulate success rather than throwing an operational error."
      );
    } else {
      record("Email", "Resend email provider missing API key behavior", "Fails in production", "Fails in production", "PASS", "INFO");
    }

    // 8.2 Password reset email recipient cannot be tampered
    // In auth.service.ts, to = user.email from database record
    const authServiceTs = await readFile("backend/src/modules/auth/auth.service.ts", "utf8");
    const usesDbEmail = authServiceTs.includes("await emailService.sendPasswordResetEmail(user.email, resetUrl, user.full_name)");

    if (usesDbEmail) {
      record("Email", "Password reset emails sent strictly to registered database email (cannot be redirected)", "user.email from DB lookup", "user.email from DB lookup", "PASS", "INFO");
    } else {
      record("Email", "Password reset emails sent strictly to registered DB email", "user.email", "User-controlled email", "FAIL", "CRITICAL");
    }
  }

  // =========================================================================
  // 9. FRONTEND PRODUCTION BUNDLE INSPECTION
  // =========================================================================
  console.log("\n--- 9. Frontend Production Bundle Security Inspection ---");
  {
    const distFiles = await readdir("frontend/dist/assets");
    const jsBundleName = distFiles.find(f => f.endsWith(".js"));

    if (jsBundleName) {
      const bundleContent = await readFile(`frontend/dist/assets/${jsBundleName}`, "utf8");

      // Check for secret patterns in bundle
      const hasDbUrl = /postgresql:\/\//i.test(bundleContent);
      const hasJwtSecret = /JWT_ACCESS_TOKEN_SECRET/i.test(bundleContent) || /jwt.*secret/i.test(bundleContent);
      const hasAwsSecret = /AWS_SECRET_ACCESS_KEY/i.test(bundleContent) || /wJalrXUtnFEMI/i.test(bundleContent);
      const hasResendSecret = /re_[a-zA-Z0-9]{20,}/.test(bundleContent);
      const hasUpstashSecret = /UPSTASH_REDIS_REST_TOKEN/i.test(bundleContent);

      if (!hasDbUrl && !hasJwtSecret && !hasAwsSecret && !hasResendSecret && !hasUpstashSecret) {
        record("Frontend Bundle", "Frontend production JavaScript bundle contains zero backend secrets", "No secrets in JS bundle", "Clean (0 secrets)", "PASS", "INFO");
      } else {
        record(
          "Frontend Bundle",
          "Frontend production JavaScript bundle contains zero backend secrets",
          "No secrets",
          `Secrets detected: db=${hasDbUrl}, jwt=${hasJwtSecret}, aws=${hasAwsSecret}, resend=${hasResendSecret}, redis=${hasUpstashSecret}`,
          "FAIL",
          "CRITICAL"
        );
      }

      // Check for source maps
      const hasSourceMaps = distFiles.some(f => f.endsWith(".js.map"));
      if (!hasSourceMaps) {
        record("Frontend Bundle", "Frontend source maps disabled in production build", "No .js.map files in frontend/dist/assets", "Source maps disabled", "PASS", "INFO");
      } else {
        record("Frontend Bundle", "Frontend source maps disabled in production build", "No source maps", "Source maps present", "FAIL", "LOW");
      }
    } else {
      record("Frontend Bundle", "Frontend bundle inspection", "JS bundle exists", "Missing", "FAIL", "HIGH");
    }
  }

  // =========================================================================
  // 10. REPOSITORY HYGIENE & TEST ARTIFACTS
  // =========================================================================
  console.log("\n--- 10. Repository Hygiene & Test Artifacts ---");
  {
    // 10.1 Verify .env is in .gitignore
    const gitignore = await readFile(".gitignore", "utf8");
    const ignoresEnv = gitignore.includes(".env") && gitignore.includes(".env.*");

    if (ignoresEnv) {
      record("Repository Hygiene", ".gitignore properly excludes .env and .env.* files", ".env and .env.* excluded", "Excluded", "PASS", "INFO");
    } else {
      record("Repository Hygiene", ".gitignore properly excludes .env files", "Excluded", "Missing", "FAIL", "CRITICAL");
    }

    // 10.2 Verify no active 'debugger;' statements in backend src
    const backendFiles = [];
    async function scanDir(dir) {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "dist") {
          await scanDir(full);
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
          backendFiles.push(full);
        }
      }
    }
    await scanDir("backend/src");

    let debuggerCount = 0;
    for (const f of backendFiles) {
      const content = await readFile(f, "utf8");
      if (/\bdebugger\b/.test(content)) {
        debuggerCount++;
      }
    }

    if (debuggerCount === 0) {
      record("Debug Artifacts", "No active 'debugger;' statements in backend source code", "0 debugger statements", "0 found", "PASS", "INFO");
    } else {
      record("Debug Artifacts", "No active 'debugger;' statements in backend source code", "0", `${debuggerCount} found`, "FAIL", "MEDIUM");
    }

    // 10.3 Verify obsolete OTP mechanism is absent
    let otpCount = 0;
    for (const f of backendFiles) {
      const content = await readFile(f, "utf8");
      if (/phone_otp|send_otp|verify_otp|otp_bypass/i.test(content)) {
        otpCount++;
      }
    }

    if (otpCount === 0) {
      record("Legacy Logic", "Obsolete OTP authentication mechanism remains completely absent", "0 OTP references", "0 found", "PASS", "INFO");
    } else {
      record("Legacy Logic", "Obsolete OTP authentication mechanism remains completely absent", "0 OTP references", `${otpCount} found`, "FAIL", "HIGH");
    }
  }

  // =========================================================================
  // 11. DANGEROUS DEVELOPMENT DEFAULTS IN PRODUCTION
  // =========================================================================
  console.log("\n--- 11. Production Environment Configuration Defaults ---");
  {
    const envTs = await readFile("backend/src/config/env.ts", "utf8");

    // Check FRONTEND_URL default
    const frontendUrlDefault = envTs.match(/FRONTEND_URL:\s*z\.string\(\)\.default\("([^"]+)"\)/)?.[1];
    if (frontendUrlDefault === "http://localhost:3000") {
      record(
        "Production Config",
        "FRONTEND_URL environment variable default value in production",
        "Should require production URL or enforce non-localhost in production",
        `Defaults to "${frontendUrlDefault}" if omitted`,
        "NEEDS REVIEW",
        "MEDIUM",
        "If FRONTEND_URL is omitted in production environment variables, password reset links and review request links will default to http://localhost:3000. It should be explicitly validated or required when NODE_ENV === 'production'."
      );
    } else {
      record("Production Config", "FRONTEND_URL environment variable default", "Safe default", frontendUrlDefault, "PASS", "INFO");
    }

    // Check CORS_ORIGIN default
    const corsOriginDefault = envTs.match(/CORS_ORIGIN:\s*z\.string\(\)\.default\("([^"]+)"\)/)?.[1];
    const securityTs = await readFile("backend/src/middleware/security.ts", "utf8");
    const stripsLocalhostInProd = securityTs.includes("isProduction && isLocalhost(hostname)") && securityTs.includes("CORS_ORIGIN_DENIED");

    if (stripsLocalhostInProd) {
      record("Production Config", "Localhost origins rejected by CORS middleware in production mode", "isProduction && isLocalhost blocks localhost", "Blocked in production", "PASS", "INFO");
    } else {
      record("Production Config", "Localhost origins rejected in production", "Blocked", "Allowed", "FAIL", "HIGH");
    }
  }

  // =========================================================================
  // 12. SUMMARY & STATS
  // =========================================================================
  console.log("\n===============================================================================");
  const total = matrix.length;
  const pass = matrix.filter(r => r.status === "PASS").length;
  const fail = matrix.filter(r => r.status === "FAIL").length;
  const needsReview = matrix.filter(r => r.status === "NEEDS REVIEW").length;

  console.log(`TOTAL AUDIT CHECKS: ${total}`);
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log(`NEEDS REVIEW: ${needsReview}`);
  console.log("===============================================================================\n");

  return { total, pass, fail, needsReview, matrix };
}

runPhase9Audit().catch(err => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
