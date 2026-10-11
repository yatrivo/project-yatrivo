/**
 * Yatrivo — Safe, Idempotent Existing Media Variants Backfill Utility
 *
 * Generates missing multi-resolution WebP variants (thumbnail 400w, medium 800w,
 * viewer 1600w) and tiny Base64 placeholders (~28w) for existing R2/S3 media_assets
 * without modifying original images, media IDs, or entity relationships.
 *
 * Safety by default:
 *   Runs in DRY-RUN mode unless --execute is explicitly passed.
 *
 * Usage Examples:
 *   1. Inspect assets needing backfill (dry-run, safe, zero writes):
 *      node scripts/backfill-media-variants.mjs
 *
 *   2. Execute backfill in controlled batches of 5:
 *      node scripts/backfill-media-variants.mjs --execute --batch-size=5
 *
 *   3. Execute backfill for a single media asset ID:
 *      node scripts/backfill-media-variants.mjs --execute --id=<media-uuid>
 *
 *   4. Retry previously failed items recorded in scripts/backfill-failures.json:
 *      node scripts/backfill-media-variants.mjs --execute --retry-failed
 */

import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, closeDatabase } from '../backend/dist/db/postgres.js';
import { mediaService } from '../backend/dist/modules/media/media.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FAILURES_FILE = path.join(__dirname, 'backfill-failures.json');

function parseArgs(argv) {
  const args = {
    execute: false,
    force: false,
    retryFailed: false,
    batchSize: 5,
    limit: 0,
    id: null
  };

  for (const raw of argv.slice(2)) {
    if (raw === '--execute') args.execute = true;
    else if (raw === '--dry-run') args.execute = false;
    else if (raw === '--force') args.force = true;
    else if (raw === '--retry-failed') args.retryFailed = true;
    else if (raw.startsWith('--batch-size=')) {
      const n = parseInt(raw.split('=')[1], 10);
      if (Number.isFinite(n) && n >= 1 && n <= 50) args.batchSize = n;
    } else if (raw.startsWith('--limit=')) {
      const n = parseInt(raw.split('=')[1], 10);
      if (Number.isFinite(n) && n >= 1) args.limit = n;
    } else if (raw.startsWith('--id=')) {
      args.id = raw.split('=')[1].trim();
    }
  }

  return args;
}

async function loadFailedIds() {
  try {
    const content = await readFile(FAILURES_FILE, 'utf8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed?.failures)) {
      return parsed.failures.map((f) => f.id).filter(Boolean);
    }
  } catch {
    // No failures file or unreadable
  }
  return [];
}

async function saveFailures(failures) {
  const payload = {
    updatedAt: new Date().toISOString(),
    count: failures.length,
    failures
  };
  await writeFile(FAILURES_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

async function run() {
  const args = parseArgs(process.argv);
  const dryRun = !args.execute;

  console.log('==============================================================');
  console.log(' Yatrivo Media Asset Multi-Resolution Variant Backfill');
  console.log('==============================================================');
  console.log(` Mode       : ${dryRun ? 'DRY-RUN (no storage/DB writes; pass --execute to apply)' : 'EXECUTE (writing variants to R2 & PostgreSQL)'}`);
  console.log(` Batch Size : ${args.batchSize}`);
  console.log(` Force Regen: ${args.force}`);
  if (args.id) console.log(` Target ID  : ${args.id}`);
  if (args.limit > 0) console.log(` Max Limit  : ${args.limit}`);
  if (args.retryFailed) console.log(` Retry Mode : Retrying IDs from scripts/backfill-failures.json`);
  console.log('--------------------------------------------------------------\n');

  try {
    // 1. Summary of all media assets in database
    const summaryRes = await query(`
      SELECT
        COUNT(*)::int AS total_assets,
        COUNT(*) FILTER (WHERE storage_key IS NOT NULL)::int AS internal_r2_assets,
        COUNT(*) FILTER (WHERE external_url IS NOT NULL AND storage_key IS NULL)::int AS external_url_assets,
        COUNT(*) FILTER (
          WHERE storage_key IS NOT NULL
            AND thumbnail_url IS NOT NULL
            AND medium_url IS NOT NULL
            AND viewer_url IS NOT NULL
            AND placeholder_base64 IS NOT NULL
        )::int AS complete_r2_assets,
        COUNT(*) FILTER (
          WHERE storage_key IS NOT NULL
            AND (thumbnail_url IS NULL OR medium_url IS NULL OR viewer_url IS NULL OR placeholder_base64 IS NULL)
        )::int AS pending_r2_assets
      FROM media_assets
    `);

    const stats = summaryRes.rows[0] || {};
    console.log('Current Media Library Inventory:');
    console.log(`  Total Media Assets         : ${stats.total_assets ?? 0}`);
    console.log(`  Internal R2/S3 Assets      : ${stats.internal_r2_assets ?? 0}`);
    console.log(`    - Variants Complete      : ${stats.complete_r2_assets ?? 0}`);
    console.log(`    - Missing Variants       : ${stats.pending_r2_assets ?? 0}`);
    console.log(`  External URL Assets (Kept) : ${stats.external_url_assets ?? 0}\n`);

    // 2. Determine candidate rows
    let candidateRows = [];
    if (args.id) {
      const res = await query(
        `SELECT id, label, storage_key, thumbnail_url, medium_url, viewer_url, placeholder_base64
         FROM media_assets
         WHERE id = $1`,
        [args.id]
      );
      candidateRows = res.rows;
    } else if (args.retryFailed) {
      const failedIds = await loadFailedIds();
      if (failedIds.length === 0) {
        console.log('No failed asset IDs found in scripts/backfill-failures.json.');
        return;
      }
      const res = await query(
        `SELECT id, label, storage_key, thumbnail_url, medium_url, viewer_url, placeholder_base64
         FROM media_assets
         WHERE id = ANY($1::uuid[])
         ORDER BY created_at ASC`,
        [failedIds]
      );
      candidateRows = res.rows;
    } else if (args.force) {
      const limitClause = args.limit > 0 ? `LIMIT ${args.limit}` : '';
      const res = await query(
        `SELECT id, label, storage_key, thumbnail_url, medium_url, viewer_url, placeholder_base64
         FROM media_assets
         WHERE storage_key IS NOT NULL
         ORDER BY created_at ASC
         ${limitClause}`
      );
      candidateRows = res.rows;
    } else {
      const limitClause = args.limit > 0 ? `LIMIT ${args.limit}` : '';
      const res = await query(
        `SELECT id, label, storage_key, thumbnail_url, medium_url, viewer_url, placeholder_base64
         FROM media_assets
         WHERE storage_key IS NOT NULL
           AND (thumbnail_url IS NULL OR medium_url IS NULL OR viewer_url IS NULL OR placeholder_base64 IS NULL)
         ORDER BY created_at ASC
         ${limitClause}`
      );
      candidateRows = res.rows;
    }

    if (candidateRows.length === 0) {
      console.log('No internal R2 assets require variant backfill. Everything is up to date!');
      return;
    }

    console.log(`Found ${candidateRows.length} asset(s) to process in batches of ${args.batchSize}.\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let dryRunCount = 0;
    const failures = [];

    for (let i = 0; i < candidateRows.length; i += args.batchSize) {
      const batch = candidateRows.slice(i, i + args.batchSize);
      const batchNum = Math.floor(i / args.batchSize) + 1;
      const totalBatches = Math.ceil(candidateRows.length / args.batchSize);
      console.log(`--- Batch ${batchNum} / ${totalBatches} (${batch.length} item(s)) ---`);

      for (const row of batch) {
        const displayLabel = row.label || row.storage_key || row.id;
        try {
          const res = await mediaService.backfillAssetVariants(row.id, {
            force: args.force,
            dryRun
          });

          if (res.status === 'updated') {
            updatedCount++;
            console.log(`  [UPDATED] ${row.id} (${displayLabel}) -> generated: ${(res.variantsGenerated || []).join(', ')}`);
          } else if (res.status === 'dry_run') {
            dryRunCount++;
            console.log(`  [DRY-RUN] ${row.id} (${displayLabel}) -> ${res.reason}`);
          } else {
            skippedCount++;
            console.log(`  [SKIPPED] ${row.id} (${displayLabel}) -> ${res.reason}`);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`  [FAILED]  ${row.id} (${displayLabel}) -> ${errorMessage}`);
          failures.push({
            id: row.id,
            storageKey: row.storage_key,
            label: row.label,
            error: errorMessage,
            failedAt: new Date().toISOString()
          });
        }
      }
    }

    if (!dryRun && (failures.length > 0 || args.retryFailed)) {
      await saveFailures(failures);
      if (failures.length > 0) {
        console.log(`\nRecorded ${failures.length} failed item(s) to ${FAILURES_FILE} for retry (--retry-failed).`);
      }
    }

    console.log('\n==============================================================');
    console.log(' Backfill Summary');
    console.log('==============================================================');
    console.log(` Candidates Inspected : ${candidateRows.length}`);
    if (dryRun) {
      console.log(` Would Update         : ${dryRunCount}`);
    } else {
      console.log(` Updated              : ${updatedCount}`);
    }
    console.log(` Skipped              : ${skippedCount}`);
    console.log(` Failed               : ${failures.length}`);
    console.log('==============================================================\n');

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await closeDatabase();
  }
}

run().catch((err) => {
  console.error('Backfill script encountered a fatal error:', err);
  process.exit(1);
});
