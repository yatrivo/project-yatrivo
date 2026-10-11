import 'dotenv/config';
import { createRequire } from 'node:module';
import { createApp } from '../backend/dist/app.js';
import { query } from '../backend/dist/db/postgres.js';
import { mediaService } from '../backend/dist/modules/media/media.service.js';

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url));
const sharp = requireBackend('sharp');

const PORT = 4099;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let server;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const start = performance.now();
  const response = await fetch(url, {
    ...options,
    headers,
  });
  const elapsedMs = performance.now() - start;

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, headers: response.headers, data, elapsedMs };
}

/**
 * Generates a realistic synthetic mountain landscape or portrait image with rich gradient/noise
 * so WebP/JPEG compression ratios reflect real photographic payloads.
 */
async function createSyntheticPhotoBuffer(width, height, format = 'jpeg') {
  const channels = 3;
  const raw = Buffer.alloc(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      // Sky-to-mountain gradient + deterministic fine texture
      const vGrad = Math.floor((y / height) * 180);
      const hWave = Math.floor(Math.sin(x / 45) * 28 + Math.cos(y / 35) * 24);
      const grain = ((x * 37 + y * 17) ^ (x * y)) & 0x1f;
      raw[idx] = Math.min(255, Math.max(0, 30 + vGrad + hWave + grain));
      raw[idx + 1] = Math.min(255, Math.max(0, 65 + Math.floor(vGrad * 0.8) + grain));
      raw[idx + 2] = Math.min(255, Math.max(0, 95 + Math.floor((1 - y / height) * 120) + grain));
    }
  }

  const pipeline = sharp(raw, { raw: { width, height, channels } });
  if (format === 'jpeg') {
    return pipeline.jpeg({ quality: 90 }).toBuffer();
  }
  return pipeline.png().toBuffer();
}

async function run() {
  console.log('=== Starting Gallery Image Delivery & Performance Optimization Test Suite ===\n');

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  console.log(`Test server listening on http://localhost:${PORT}\n`);

  const createdMediaIds = [];
  const createdGalleryIds = [];
  let adminToken = null;

  try {
    // 1. Authenticate as Admin
    console.log('1. Admin Authentication');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'yatrivo3@gmail.com',
        password: process.env.ADMIN_SEED_PASSWORD || 'YatrivoAdmin@2026!',
      }),
    });
    assert(loginRes.status === 200, 'Admin login returns 200 OK');
    adminToken = loginRes.data?.data?.tokens?.accessToken;
    assert(Boolean(adminToken), 'Admin access token issued');

    // 2. Upload High-Resolution Landscape Image (2400x1600 JPEG) & Verify Multi-Resolution Variants
    console.log('\n2. Landscape Image Upload & Multi-Resolution Variant Generation (2400x1600 JPEG)');
    const landscapeBuffer = await createSyntheticPhotoBuffer(2400, 1600, 'jpeg');
    const landscapeForm = new FormData();
    landscapeForm.append('file', new Blob([landscapeBuffer], { type: 'image/jpeg' }), 'kedarnath-peak-2400x1600.jpg');
    landscapeForm.append('category', 'destinations');
    landscapeForm.append('label', 'Kedarnath Peak Test 2400x1600');
    landscapeForm.append('altText', 'Kedarnath Peak at sunrise');
    landscapeForm.append('showInGallery', 'true');

    const uploadLandscapeRes = await request('/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: landscapeForm,
    });
    assert(uploadLandscapeRes.status === 201, `Landscape upload returns 201 Created (got ${uploadLandscapeRes.status})`);
    const landscapeAsset = uploadLandscapeRes.data?.data;
    if (landscapeAsset?.id) createdMediaIds.push(landscapeAsset.id);
    if (landscapeAsset?.galleryItemId) createdGalleryIds.push(landscapeAsset.galleryItemId);

    assert(landscapeAsset?.width === 2400 && landscapeAsset?.height === 1600, `Original dimensions preserved: ${landscapeAsset?.width}x${landscapeAsset?.height}`);
    assert(Boolean(landscapeAsset?.thumbnailUrl), 'thumbnailUrl generated and returned');
    assert(Boolean(landscapeAsset?.mediumUrl), 'mediumUrl generated and returned');
    assert(Boolean(landscapeAsset?.viewerUrl), 'viewerUrl generated and returned');
    assert(Boolean(landscapeAsset?.placeholder?.startsWith('data:image/webp;base64,')), 'Compact Base64 WebP placeholder generated');

    const lVariants = landscapeAsset?.variants;
    assert(lVariants?.thumbnail?.width === 400 && lVariants?.thumbnail?.height === 267, `Thumbnail variant is 400x267 WebP (got ${lVariants?.thumbnail?.width}x${lVariants?.thumbnail?.height})`);
    assert(lVariants?.medium?.width === 800 && lVariants?.medium?.height === 533, `Medium variant is 800x533 WebP (got ${lVariants?.medium?.width}x${lVariants?.medium?.height})`);
    assert(lVariants?.viewer?.width === 1600 && lVariants?.viewer?.height === 1067, `Viewer variant is 1600x1067 WebP (got ${lVariants?.viewer?.width}x${lVariants?.viewer?.height})`);

    // Read internal variants JSONB from PostgreSQL to inspect exact generated byte sizes
    const landscapeDbRow = await query(`SELECT variants FROM media_assets WHERE id = $1`, [landscapeAsset.id]);
    const dbVariants = landscapeDbRow.rows[0]?.variants || {};
    const thumbFileSizeBytes = dbVariants?.thumbnail?.fileSizeBytes || 0;
    const mediumFileSizeBytes = dbVariants?.medium?.fileSizeBytes || 0;
    const viewerFileSizeBytes = dbVariants?.viewer?.fileSizeBytes || 0;

    assert(thumbFileSizeBytes > 0 && thumbFileSizeBytes < landscapeBuffer.length, `Thumbnail fileSizeBytes (${thumbFileSizeBytes} B) << Original (${landscapeBuffer.length} B)`);
    assert(viewerFileSizeBytes > 0 && viewerFileSizeBytes < landscapeBuffer.length, `Viewer fileSizeBytes (${viewerFileSizeBytes} B) < Original (${landscapeBuffer.length} B)`);

    // Verify no duplicate media_assets records were created for variants
    const dbCountCheck = await query(
      `SELECT COUNT(*)::int AS cnt FROM media_assets WHERE label = 'Kedarnath Peak Test 2400x1600'`
    );
    assert(dbCountCheck.rows[0].cnt === 1, `Single media_assets record stored for original + variants (count = ${dbCountCheck.rows[0].cnt})`);

    // 3. Upload Portrait Image (1200x1800) & Verify Aspect Ratio Preservation
    console.log('\n3. Portrait Image Upload & Aspect Ratio Preservation (1200x1800)');
    const portraitBuffer = await createSyntheticPhotoBuffer(1200, 1800, 'jpeg');
    const portraitForm = new FormData();
    portraitForm.append('file', new Blob([portraitBuffer], { type: 'image/jpeg' }), 'tungnath-portrait-1200x1800.jpg');
    portraitForm.append('category', 'destinations');
    portraitForm.append('label', 'Tungnath Portrait Test');
    portraitForm.append('showInGallery', 'true');

    const uploadPortraitRes = await request('/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: portraitForm,
    });
    assert(uploadPortraitRes.status === 201, 'Portrait upload returns 201 Created');
    const portraitAsset = uploadPortraitRes.data?.data;
    if (portraitAsset?.id) createdMediaIds.push(portraitAsset.id);
    if (portraitAsset?.galleryItemId) createdGalleryIds.push(portraitAsset.galleryItemId);

    const pVariants = portraitAsset?.variants;
    assert(pVariants?.thumbnail?.width === 400 && pVariants?.thumbnail?.height === 600, `Portrait thumbnail preserves 2:3 aspect ratio without cropping: ${pVariants?.thumbnail?.width}x${pVariants?.thumbnail?.height}`);
    assert(pVariants?.medium?.width === 800 && pVariants?.medium?.height === 1200, `Portrait medium preserves 2:3 aspect ratio without cropping: ${pVariants?.medium?.width}x${pVariants?.medium?.height}`);
    assert(pVariants?.viewer?.width === 1067 && pVariants?.viewer?.height === 1600, `Portrait viewer fits inside 1600x1600 without cropping: ${pVariants?.viewer?.width}x${pVariants?.viewer?.height}`);

    // 4. Upload Small Image (280x180) & Verify NO Upscaling
    console.log('\n4. Small Image Upload — Verify No Upscaling (280x180)');
    const smallBuffer = await createSyntheticPhotoBuffer(280, 180, 'png');
    const smallForm = new FormData();
    smallForm.append('file', new Blob([smallBuffer], { type: 'image/png' }), 'small-badge-280x180.png');
    smallForm.append('category', 'general');
    smallForm.append('label', 'Small Image No Upscale Test');
    smallForm.append('showInGallery', 'true');

    const uploadSmallRes = await request('/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: smallForm,
    });
    assert(uploadSmallRes.status === 201, 'Small image upload returns 201 Created');
    const smallAsset = uploadSmallRes.data?.data;
    if (smallAsset?.id) createdMediaIds.push(smallAsset.id);
    if (smallAsset?.galleryItemId) createdGalleryIds.push(smallAsset.galleryItemId);

    const sVariants = smallAsset?.variants;
    assert(sVariants?.thumbnail?.width === 280 && sVariants?.thumbnail?.height === 180, `Thumbnail did not upscale small image: ${sVariants?.thumbnail?.width}x${sVariants?.thumbnail?.height}`);
    assert(sVariants?.medium?.width === 280 && sVariants?.medium?.height === 180, `Medium did not upscale small image: ${sVariants?.medium?.width}x${sVariants?.medium?.height}`);
    assert(sVariants?.viewer?.width === 280 && sVariants?.viewer?.height === 180, `Viewer did not upscale small image: ${sVariants?.viewer?.width}x${sVariants?.viewer?.height}`);

    // 5. Invalid/Corrupted File Rejection
    console.log('\n5. Invalid / Corrupted Image Rejection');
    const badForm = new FormData();
    badForm.append('file', new Blob([Buffer.from('not-an-image-payload')], { type: 'image/jpeg' }), 'corrupt.jpg');
    badForm.append('category', 'general');
    const badUploadRes = await request('/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: badForm,
    });
    assert(badUploadRes.status === 400, `Corrupted image rejected with 400 Bad Request (got ${badUploadRes.status})`);

    // 6. Existing Image Backfill Verification (Simulated Legacy Asset)
    console.log('\n6. Existing Image Backfill Verification (Idempotent & Safe)');
    // Simulate a legacy R2 asset by clearing variant fields in DB on smallAsset
    await query(
      `UPDATE media_assets
       SET thumbnail_url = NULL, medium_url = NULL, viewer_url = NULL, placeholder_base64 = NULL, variants = NULL
       WHERE id = $1`,
      [smallAsset.id]
    );
    const dryRunResult = await mediaService.backfillAssetVariants(smallAsset.id, { dryRun: true });
    assert(dryRunResult.status === 'dry_run', `Dry-run backfill validates asset without modifying DB (${dryRunResult.reason})`);
    const afterDryRunDb = await query(`SELECT thumbnail_url FROM media_assets WHERE id = $1`, [smallAsset.id]);
    assert(afterDryRunDb.rows[0].thumbnail_url === null, 'Dry-run did not write to database');

    const execBackfillResult = await mediaService.backfillAssetVariants(smallAsset.id, { dryRun: false });
    assert(execBackfillResult.status === 'updated', 'Live backfill generates and persists missing variants');
    const afterExecDb = await query(
      `SELECT thumbnail_url, medium_url, viewer_url, placeholder_base64, variants FROM media_assets WHERE id = $1`,
      [smallAsset.id]
    );
    assert(Boolean(afterExecDb.rows[0].thumbnail_url), 'Backfilled thumbnail_url persisted');
    assert(Boolean(afterExecDb.rows[0].viewer_url), 'Backfilled viewer_url persisted');
    assert(Boolean(afterExecDb.rows[0].placeholder_base64), 'Backfilled placeholder_base64 persisted');

    // Second run must skip idempotently
    const secondBackfillResult = await mediaService.backfillAssetVariants(smallAsset.id, { dryRun: false });
    assert(secondBackfillResult.status === 'skipped', `Second backfill run is idempotent and skips asset (${secondBackfillResult.reason})`);

    // 7. External Image Fallback Behavior
    console.log('\n7. External Image URL Fallback Behavior');
    const extRes = await request('/media/external', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
        label: 'External Himalayan Valley',
        altText: 'External mountain valley',
        category: 'destinations',
        showInGallery: true,
      }),
    });
    assert(extRes.status === 201, 'External image created with 201');
    const extAsset = extRes.data?.data;
    if (extAsset?.id) createdMediaIds.push(extAsset.id);
    if (extAsset?.galleryItemId) createdGalleryIds.push(extAsset.galleryItemId);

    const extSkipResult = await mediaService.backfillAssetVariants(extAsset.id, { dryRun: false });
    assert(extSkipResult.status === 'skipped', `Backfill safely skips external URL asset (${extSkipResult.reason})`);

    // 8. Public Gallery API Payload, Security, Cache Headers & Cursor Pagination
    console.log('\n8. Public Gallery API, Security Filtering, Cache Headers & Cursor Pagination');
    const page1Res = await request('/gallery?limit=2');
    assert(page1Res.status === 200, 'GET /gallery?limit=2 returns 200 OK');
    const cacheControl = page1Res.headers.get('cache-control') || '';
    assert(cacheControl.includes('must-revalidate'), `GET /gallery sets Cache-Control: ${cacheControl}`);

    const page1Items = page1Res.data?.data || [];
    const page1Pagination = page1Res.data?.pagination;
    assert(page1Items.length === 2, `Page 1 returned 2 items (got ${page1Items.length})`);
    assert(Boolean(page1Pagination?.nextCursor), 'Page 1 includes nextCursor');
    assert(page1Pagination?.hasMore === true, 'Page 1 reports hasMore: true');

    // Verify public item fields and absence of private fields
    const samplePublicItem = page1Items.find((i) => i.mediaId === landscapeAsset.id) || page1Items[0];
    assert(Boolean(samplePublicItem.id && samplePublicItem.mediaId), 'Public item has stable id and mediaId');
    assert(Boolean(samplePublicItem.thumbnailUrl && samplePublicItem.viewerUrl), 'Public item exposes thumbnailUrl and viewerUrl');
    assert(samplePublicItem.storageKey === undefined, 'storageKey is NOT exposed in public gallery API');
    assert(samplePublicItem.uploadedByUserId === undefined, 'uploadedByUserId is NOT exposed in public gallery API');
    assert(samplePublicItem.fileSizeBytes === undefined, 'fileSizeBytes is NOT exposed in public gallery API');

    // Fetch Page 2 using nextCursor
    const page2Res = await request(`/gallery?limit=2&cursor=${encodeURIComponent(page1Pagination.nextCursor)}`);
    assert(page2Res.status === 200, 'GET /gallery?limit=2&cursor=... returns 200 OK');
    const page2Items = page2Res.data?.data || [];
    assert(page2Items.length > 0, `Page 2 returned ${page2Items.length} item(s)`);

    const page1Ids = new Set(page1Items.map((i) => i.id));
    const hasDuplicates = page2Items.some((i) => page1Ids.has(i.id));
    assert(!hasDuplicates, 'No duplicate items across cursor pages 1 and 2');

    // Walk remaining pages to verify total consistency and empty page handling
    let allPaginatedItems = [...page1Items, ...page2Items];
    let cursor = page2Res.data?.pagination?.nextCursor;
    let safetyCounter = 0;
    while (cursor && safetyCounter < 20) {
      safetyCounter++;
      const nextRes = await request(`/gallery?limit=10&cursor=${encodeURIComponent(cursor)}`);
      const nextBatch = nextRes.data?.data || [];
      for (const item of nextBatch) {
        assert(!allPaginatedItems.some((existing) => existing.id === item.id), `Item ${item.id} is unique across pages`);
        allPaginatedItems.push(item);
      }
      cursor = nextRes.data?.pagination?.nextCursor;
    }
    assert(
      allPaginatedItems.length === page1Pagination.total,
      `Cursor pagination traversed all ${allPaginatedItems.length}/${page1Pagination.total} items without skips or duplicates`
    );

    // Verify R2 CDN headers on uploaded variant URL
    if (landscapeAsset?.thumbnailUrl) {
      const cdnHead = await fetch(landscapeAsset.thumbnailUrl, { method: 'HEAD' });
      const cdnCacheHeader = cdnHead.headers.get('cache-control') || '';
      assert(
        cdnHead.status === 200 && cdnCacheHeader.includes('max-age=31536000'),
        `R2 variant URL returns 200 OK with immutable Cache-Control (${cdnCacheHeader})`
      );
    }

    // 9. Redis Caching & Invalidation Latency Measurement
    console.log('\n9. Redis Cache Hit vs Cold Query Latency & Cache Invalidation');
    const warm1 = await request('/gallery?limit=30');
    const warm2 = await request('/gallery?limit=30');
    assert(warm1.status === 200 && warm2.status === 200, `Repeat GET /gallery?limit=30 succeeds (1st: ${warm1.elapsedMs.toFixed(1)}ms, 2nd cached: ${warm2.elapsedMs.toFixed(1)}ms)`);

    // Update caption on landscape gallery item and verify immediate cache invalidation
    const patchGalleryRes = await request(`/gallery/${landscapeAsset.galleryItemId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customTitle: 'Kedarnath Golden Summit (Updated)',
      }),
    });
    assert(patchGalleryRes.status === 200, 'PATCH /gallery/:id returns 200 OK');

    const afterPatchPublic = await request('/gallery?limit=30');
    const updatedInPublic = afterPatchPublic.data?.data?.find((i) => i.mediaId === landscapeAsset.id);
    assert(
      updatedInPublic?.title === 'Kedarnath Golden Summit (Updated)',
      'Gallery cache invalidated immediately after PATCH /gallery/:id'
    );

    // 10. Performance & Payload Size Summary Report
    console.log('\n10. Payload & Transfer Size Benchmark Summary (2400x1600 Photograph)');
    const origBytes = landscapeBuffer.length;
    const thumbBytes = thumbFileSizeBytes;
    const mediumBytes = mediumFileSizeBytes;
    const viewerBytes = viewerFileSizeBytes;
    const placeholderBytes = Buffer.byteLength(landscapeAsset?.placeholder || '', 'utf8');

    console.log(`  - Original JPEG (2400x1600): ${(origBytes / 1024).toFixed(1)} KB`);
    console.log(`  - Thumbnail WebP (400x267):  ${(thumbBytes / 1024).toFixed(1)} KB (${((1 - thumbBytes / origBytes) * 100).toFixed(1)}% smaller)`);
    console.log(`  - Medium WebP (800x533):     ${(mediumBytes / 1024).toFixed(1)} KB (${((1 - mediumBytes / origBytes) * 100).toFixed(1)}% smaller)`);
    console.log(`  - Viewer WebP (1600x1067):   ${(viewerBytes / 1024).toFixed(1)} KB (${((1 - viewerBytes / origBytes) * 100).toFixed(1)}% smaller)`);
    console.log(`  - Tiny Base64 Placeholder:   ${placeholderBytes} B`);
    console.log(`  - 30-Tile Mobile Grid Transfer: ${(thumbBytes * 30 / 1024).toFixed(1)} KB vs ${(origBytes * 30 / 1024).toFixed(1)} KB original`);
  } finally {
    // Clean up all test gallery items and media assets (including R2 objects + variants)
    console.log('\n11. Cleaning up test gallery items and R2 media assets');
    if (adminToken) {
      for (const gId of createdGalleryIds) {
        await request(`/gallery/${gId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
      for (const mId of createdMediaIds) {
        const delRes = await request(`/media/${mId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(delRes.status === 200, `Cleaned up test media asset ${mId} and its R2 variants`);
      }
    }
    if (server) {
      server.close();
    }
  }

  console.log('\n======================================================');
  console.log(`Test Suite Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error in test-gallery-optimization:', err);
  if (server) server.close();
  process.exit(1);
});
