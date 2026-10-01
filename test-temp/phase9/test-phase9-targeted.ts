import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { envSchema } from "../../backend/src/config/env";
import { ResendEmailProvider } from "../../backend/src/services/email/providers/resend.provider";
import { db, checkDatabase } from "../../backend/src/db/postgres";

console.log("=== Phase 9 Remediation Targeted Verification Suite ===");

let passed = 0;
let failed = 0;

function report(testName: string, ok: boolean, detail: string = "") {
  if (ok) {
    console.log(`  [PASS] ${testName} ${detail ? "(" + detail + ")" : ""}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${detail ? "(" + detail + ")" : ""}`);
    failed++;
  }
}

async function runTests() {
  // ---------------------------------------------------------
  // P9-01: FRONTEND_URL validation in envSchema
  // ---------------------------------------------------------
  console.log("\n--- Testing P9-01: FRONTEND_URL Validation ---");

  const baseValidEnv = {
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/yatrivo_test?sslmode=disable",
    JWT_ACCESS_TOKEN_SECRET: "this-is-a-super-secret-key-at-least-32-chars-long"
  };

  // Test A: prod with valid HTTPS URL
  try {
    const parsed = envSchema.parse({
      ...baseValidEnv,
      NODE_ENV: "production",
      FRONTEND_URL: "https://yatrivo.co.in"
    });
    report("P9-01 Test A (Prod with valid HTTPS URL accepted)", parsed.FRONTEND_URL === "https://yatrivo.co.in");
  } catch (e: any) {
    report("P9-01 Test A (Prod with valid HTTPS URL accepted)", false, e.message);
  }

  // Test B: prod with missing FRONTEND_URL
  try {
    envSchema.parse({
      ...baseValidEnv,
      NODE_ENV: "production"
    });
    report("P9-01 Test B (Prod missing FRONTEND_URL rejected)", false, "Expected error but succeeded");
  } catch (e: any) {
    const issues = e.issues || e.errors || [];
    const hasRequiredError = issues.some((err: any) =>
      err.message.includes("FRONTEND_URL is required in production")
    );
    report("P9-01 Test B (Prod missing FRONTEND_URL rejected with clear message)", Boolean(hasRequiredError));
  }

  // Test C: prod with HTTP (non-https) URL
  try {
    envSchema.parse({
      ...baseValidEnv,
      NODE_ENV: "production",
      FRONTEND_URL: "http://yatrivo.co.in"
    });
    report("P9-01 Test C (Prod HTTP URL rejected)", false, "Expected error but succeeded");
  } catch (e: any) {
    const issues = e.issues || e.errors || [];
    const hasHttpsError = issues.some((err: any) =>
      err.message.includes("FRONTEND_URL must use https:// in production")
    );
    report("P9-01 Test C (Prod HTTP URL rejected with https requirement)", Boolean(hasHttpsError));
  }

  // Test D1: prod with localhost
  try {
    envSchema.parse({
      ...baseValidEnv,
      NODE_ENV: "production",
      FRONTEND_URL: "https://localhost:3000"
    });
    report("P9-01 Test D1 (Prod https://localhost rejected)", false, "Expected error but succeeded");
  } catch (e: any) {
    const issues = e.issues || e.errors || [];
    const hasLoopbackError = issues.some((err: any) =>
      err.message.includes("cannot use localhost or private loopback")
    );
    report("P9-01 Test D1 (Prod https://localhost rejected)", Boolean(hasLoopbackError));
  }

  // Test D2: prod with 127.0.0.1
  try {
    envSchema.parse({
      ...baseValidEnv,
      NODE_ENV: "production",
      FRONTEND_URL: "https://127.0.0.1:3000"
    });
    report("P9-01 Test D2 (Prod https://127.0.0.1 rejected)", false, "Expected error but succeeded");
  } catch (e: any) {
    const issues = e.issues || e.errors || [];
    const hasLoopbackError = issues.some((err: any) =>
      err.message.includes("cannot use localhost or private loopback")
    );
    report("P9-01 Test D2 (Prod https://127.0.0.1 rejected)", Boolean(hasLoopbackError));
  }

  // Test E: dev mode with missing FRONTEND_URL defaults to http://localhost:3000
  try {
    const parsed = envSchema.parse({
      ...baseValidEnv,
      NODE_ENV: "development"
    });
    report(
      "P9-01 Test E (Dev missing FRONTEND_URL defaults to http://localhost:3000)",
      parsed.FRONTEND_URL === "http://localhost:3000"
    );
  } catch (e: any) {
    report("P9-01 Test E (Dev missing FRONTEND_URL defaults)", false, e.message);
  }

  // Test F: dev mode with custom URL
  try {
    const parsed = envSchema.parse({
      ...baseValidEnv,
      NODE_ENV: "development",
      FRONTEND_URL: "http://127.0.0.1:3000"
    });
    report(
      "P9-01 Test F (Dev custom local URL allowed)",
      parsed.FRONTEND_URL === "http://127.0.0.1:3000"
    );
  } catch (e: any) {
    report("P9-01 Test F (Dev custom local URL allowed)", false, e.message);
  }

  // ---------------------------------------------------------
  // P9-02: ResendEmailProvider fail-safe in production
  // ---------------------------------------------------------
  console.log("\n--- Testing P9-02: Resend Unconfigured Fail-Safe ---");

  // Test A: Prod mode without API key
  const prodProvider = new ResendEmailProvider("", "Yatrivo <noreply@yatrivo.com>", true);
  const prodRes = await prodProvider.send({
    to: "user@example.com",
    subject: "Production Alert Test",
    html: "<p>Hello Production</p>"
  });

  report("P9-02 Test A1 (Prod unconfigured returns success=false)", prodRes.success === false);
  report(
    "P9-02 Test A2 (Prod unconfigured returns error=EMAIL_PROVIDER_UNCONFIGURED)",
    prodRes.error === "EMAIL_PROVIDER_UNCONFIGURED"
  );
  report("P9-02 Test A3 (Prod unconfigured does not return fake messageId)", prodRes.messageId === undefined);

  // Test B: Dev mode without API key
  const devProvider = new ResendEmailProvider("", "Yatrivo <noreply@yatrivo.com>", false);
  const devRes = await devProvider.send({
    to: "user@example.com",
    subject: "Dev Simulation Test",
    html: '<p>Hello Dev <a href="http://localhost:3000/reset">Reset</a></p>'
  });

  report("P9-02 Test B1 (Dev unconfigured returns success=true simulation)", devRes.success === true);
  report(
    "P9-02 Test B2 (Dev unconfigured returns dev-simulated messageId)",
    typeof devRes.messageId === "string" && devRes.messageId.startsWith("dev-simulated-")
  );

  // ---------------------------------------------------------
  // P9-03: PostgreSQL connection and idle timeouts
  // ---------------------------------------------------------
  console.log("\n--- Testing P9-03: PostgreSQL Pool Timeouts ---");

  const poolOptions = (db as any).options;
  report(
    "P9-03 Test A (connectionTimeoutMillis is explicitly 8000ms)",
    poolOptions.connectionTimeoutMillis === 8000,
    `actual=${poolOptions.connectionTimeoutMillis}`
  );
  report(
    "P9-03 Test B (idleTimeoutMillis is explicitly 10000ms)",
    poolOptions.idleTimeoutMillis === 10000,
    `actual=${poolOptions.idleTimeoutMillis}`
  );
  report("P9-03 Test C (Pool max is configured and positive)", poolOptions.max > 0, `max=${poolOptions.max}`);

  const health = await checkDatabase();
  report("P9-03 Test D (Pool connects and executes query successfully)", health.ok === true, `latency=${health.latencyMs}ms`);

  // Close db connection so test runner can exit
  await db.end();

  // ---------------------------------------------------------
  // P9-04: docker-compose.yml backend startup command
  // ---------------------------------------------------------
  console.log("\n--- Testing P9-04: docker-compose.yml Entrypoint ---");

  const composePath = path.resolve(__dirname, "../../docker-compose.yml");
  const composeContent = fs.readFileSync(composePath, "utf8");

  const hasLegacyIndex = composeContent.includes("/app/index.js");
  const hasLegacyFallback = composeContent.includes("No backend implemented");
  const hasCompiledServer = composeContent.includes("node /app/dist/server.js");

  report("P9-04 Test A (No obsolete /app/index.js in docker-compose.yml)", !hasLegacyIndex);
  report("P9-04 Test B (No fallback 'No backend implemented' in docker-compose.yml)", !hasLegacyFallback);
  report("P9-04 Test C (Compiled entrypoint node /app/dist/server.js configured)", hasCompiledServer);

  console.log("\n==================================================");
  console.log(`Targeted Verification Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
