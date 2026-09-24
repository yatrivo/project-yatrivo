import 'dotenv/config';
import { createApp } from '../backend/dist/app.js';
import { closeDatabase, query } from '../backend/dist/db/postgres.js';

const PORT = 4097;
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

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

async function run() {
  console.log('--- Starting Destination Media, Gallery & Storage Architecture Tests ---\n');

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  console.log(`Test server running at http://localhost:${PORT}\n`);

  let uploadedMediaId = null;
  let externalMediaId = null;
  let createdDestId = null;

  try {
    // 1. Admin Login
    console.log('1. Admin authentication');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'yatrivo3@gmail.com',
        password: process.env.ADMIN_SEED_PASSWORD || 'YatrivoAdmin@2026!'
      })
    });
    assert(loginRes.status === 200, 'Admin login succeeds');
    const adminToken = loginRes.data.data.tokens.accessToken;
    assert(Boolean(adminToken), 'Received admin access token');

    // 2. Upload internal image via multipart/form-data
    console.log('\n2. Upload media file to Object Storage (Neon S3)');
    const tinyPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(tinyPngBase64, 'base64');
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', pngBlob, 'test-destination-view.png');
    formData.append('category', 'destinations');
    formData.append('altText', 'Test Alpine View');
    formData.append('caption', 'Snowy summit of test mountain');

    const uploadRes = await request('/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData
    });

    assert(uploadRes.status === 201, `Upload endpoint returns 201 (got ${uploadRes.status})`);
    const uploadedAsset = uploadRes.data?.data;
    assert(Boolean(uploadedAsset?.id), 'Uploaded media has valid ID');
    assert(uploadedAsset?.storageKey?.startsWith('destinations/'), 'Storage key starts with category "destinations/"');
    assert(Boolean(uploadedAsset?.url), 'Media asset has public access URL');
    assert(uploadedAsset?.externalUrl === null, 'Internal upload has null externalUrl');
    uploadedMediaId = uploadedAsset?.id;

    // 3. Register external image URL
    console.log('\n3. Register external image asset');
    const extRes = await request('/media/external', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        externalUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
        category: 'destinations',
        altText: 'Yosemite Valley Stream',
        caption: 'Morning mist over the valley'
      })
    });
    assert(extRes.status === 201, `External registration returns 201 (got ${extRes.status})`);
    const extAsset = extRes.data?.data;
    assert(Boolean(extAsset?.id), 'External media asset has valid ID');
    assert(extAsset?.storageKey === null, 'External asset has null storageKey');
    assert(extAsset?.externalUrl?.includes('unsplash.com'), 'External asset contains original externalUrl');
    externalMediaId = extAsset?.id;

    // 4. Create Destination with both uploaded and external media
    console.log('\n4. Create Destination referencing uploaded cover and gallery media');
    const testSlug = `e2e-media-dest-${Date.now()}`;
    const createDestRes = await request('/destinations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Media E2E Destination',
        slug: testSlug,
        tagline: 'Scenic destination with integrated media',
        description: 'Comprehensive test for media ownership and unlinking.',
        category: 'high-altitude',
        season: 'All Year',
        bestTime: 'October',
        elevation: '2,800 m',
        coverMediaId: uploadedMediaId,
        galleryMediaIds: [uploadedMediaId, externalMediaId],
        highlights: ['Pristine Lake', 'Mountain Range'],
        activities: ['Trekking', 'Photography'],
        sortOrder: 1
      })
    });

    assert(createDestRes.status === 201, `Create destination returns 201 (got ${createDestRes.status})`);
    const createdDest = createDestRes.data?.data;
    createdDestId = createdDest?.id;
    assert(createdDest?.coverMediaId === uploadedMediaId, 'Destination coverMediaId matches uploaded media ID');
    assert(createdDest?.image === uploadedAsset.url, 'Destination backward-compatible "image" matches uploaded asset URL');
    assert(Array.isArray(createdDest?.gallery) && createdDest.gallery.length === 2, 'Destination gallery has 2 URLs');
    assert(Array.isArray(createdDest?.galleryMedia) && createdDest.galleryMedia.length === 2, 'Destination galleryMedia has 2 rich items');

    // 5. Public fetch verifies transparent URL compatibility
    console.log('\n5. Public fetch of destination (unauthenticated)');
    const publicDestRes = await request(`/destinations/${testSlug}`);
    assert(publicDestRes.status === 200, 'Public destination fetch succeeds with 200');
    const publicDest = publicDestRes.data?.data;
    assert(publicDest?.image === uploadedAsset.url, 'Public destination image is valid resolved URL');
    assert(publicDest?.gallery?.length === 2, 'Public destination gallery has resolved image URLs');

    // 6. Test Unlinking: update gallery to remove externalMediaId
    console.log('\n6. Test Unlinking: remove external image from destination gallery');
    const updateRes = await request(`/destinations/${createdDestId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        galleryMediaIds: [uploadedMediaId] // Only uploaded media remains in gallery
      })
    });
    assert(updateRes.status === 200, `Patch destination returns 200 (got ${updateRes.status})`);
    assert(updateRes.data?.data?.gallery?.length === 1, 'Updated destination now has 1 gallery URL');

    // Check that externalMediaId STILL EXISTS in Media Assets (unlinking does NOT delete asset!)
    const checkExtAsset = await request(`/media/${externalMediaId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(checkExtAsset.status === 200, 'Unlinked external media asset STILL EXISTS in Media Library (200 OK)');
    assert(checkExtAsset.data?.data?.id === externalMediaId, 'Media asset ID intact');

    // 7. Test Referential Integrity: attempting to delete uploadedMediaId (still linked as cover) must fail with 409
    console.log('\n7. Referential Integrity: delete media while referenced must return 409 Conflict');
    const deleteBlockedRes = await request(`/media/${uploadedMediaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteBlockedRes.status === 409, `DELETE referenced media returns 409 Conflict (got ${deleteBlockedRes.status})`);
    assert(
      deleteBlockedRes.data?.error?.message?.includes('in use') ||
        deleteBlockedRes.data?.error?.code === 'MEDIA_IN_USE',
      'Error message clarifies active entity reference (MEDIA_IN_USE)'
    );

    // Check references endpoint
    const refRes = await request(`/media/${uploadedMediaId}/references`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(refRes.status === 200, 'GET /media/:id/references returns 200');
    assert(refRes.data?.data?.totalReferences >= 1, 'References endpoint accurately counts references');

    // 8. Unlink cover from destination and verify permanent deletion works
    console.log('\n8. Clean unlinking and permanent deletion from Media Library');
    // Remove cover and gallery reference from destination
    await request(`/destinations/${createdDestId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        coverMediaId: null,
        galleryMediaIds: []
      })
    });

    // Now delete external media
    const deleteExtRes = await request(`/media/${externalMediaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteExtRes.status === 200, 'Unreferenced external media deletion returns 200 OK');

    // Now delete uploaded media (should also delete S3 object without error)
    const deleteUploadedRes = await request(`/media/${uploadedMediaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteUploadedRes.status === 200, 'Unreferenced uploaded media deletion returns 200 OK (with S3 cleanup)');

    // Verify both are now 404
    const verifyDel1 = await request(`/media/${uploadedMediaId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(verifyDel1.status === 404, 'Deleted uploaded asset returns 404 Not Found');

    const verifyDel2 = await request(`/media/${externalMediaId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(verifyDel2.status === 404, 'Deleted external asset returns 404 Not Found');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // Cleanup destination record if still present
    if (createdDestId) {
      await query('DELETE FROM destination_media WHERE destination_id = $1', [createdDestId]).catch(() => {});
      await query('DELETE FROM destinations WHERE id = $1', [createdDestId]).catch(() => {});
    }
    // Cleanup media assets if still present
    if (uploadedMediaId) {
      await query('DELETE FROM media_assets WHERE id = $1', [uploadedMediaId]).catch(() => {});
    }
    if (externalMediaId) {
      await query('DELETE FROM media_assets WHERE id = $1', [externalMediaId]).catch(() => {});
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase();

    console.log('\n----------------------------------------');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('----------------------------------------\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
