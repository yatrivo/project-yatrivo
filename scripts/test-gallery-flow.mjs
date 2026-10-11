import 'dotenv/config';
import { createApp } from '../backend/dist/app.js';
import { query } from '../backend/dist/db/postgres.js';

const PORT = 4098;
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
  console.log('--- Starting Public Gallery Integration & Media Reusability Tests ---\n');

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  console.log(`Test server running at http://localhost:${PORT}\n`);

  let adminToken = null;
  let testMediaId = null;
  let galleryItemId = null;
  let uploadMediaId = null;

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
    adminToken = loginRes.data?.data?.tokens?.accessToken;
    assert(Boolean(adminToken), 'Received admin access token');

    // 2. Public Gallery & Site Assets endpoints (no auth required)
    console.log('\n2. Public Gallery & Site Assets access (unauthenticated)');
    const publicRes = await request('/gallery');
    assert(publicRes.status === 200, `Public GET /gallery returns 200 OK (got ${publicRes.status})`);
    assert(Array.isArray(publicRes.data?.data), 'Public gallery returns an array of items');

    const siteAssetsRes = await request('/site-assets');
    assert(siteAssetsRes.status === 200, `Public GET /site-assets returns 200 OK without auth (got ${siteAssetsRes.status})`);
    assert(Array.isArray(siteAssetsRes.data?.data), 'Public site-assets returns an array of assets');

    // 3. Admin authorization requirement on gallery mutations
    console.log('\n3. Security & authorization validation');
    const unauthAdd = await request('/gallery', {
      method: 'POST',
      body: JSON.stringify({
        mediaId: '00000000-0000-0000-0000-000000000000'
      })
    });
    assert(unauthAdd.status === 401, `Unauthenticated POST /gallery returns 401 Unauthorized (got ${unauthAdd.status})`);

    // 4. Create an external media asset in the central Media Library
    console.log('\n4. Create reusable media asset in central Media Library');
    const mediaRes = await request('/media/external', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
        label: 'Majestic Alpine Ridge Test Image',
        altText: 'Snow capped Himalayan ridge at dawn',
        category: 'destinations'
      })
    });
    assert(mediaRes.status === 201, `External media registered successfully (got ${mediaRes.status})`);
    testMediaId = mediaRes.data?.data?.id;
    assert(Boolean(testMediaId), 'Media asset has valid ID');
    assert(mediaRes.data?.data?.inGallery === false, 'Newly added destination media is not in gallery yet');

    // 5. Add existing media asset to Public Gallery (no duplicate media record created!)
    console.log('\n5. Add existing media asset to Public Gallery');
    const addToGalleryRes = await request('/gallery', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        mediaId: testMediaId,
        customTitle: 'Sunrise Over the Peaks',
        caption: 'Breathtaking golden morning over Garhwal ranges.',
        sortOrder: 1
      })
    });
    assert(addToGalleryRes.status === 201, `POST /gallery returns 201 Created (got ${addToGalleryRes.status})`);
    galleryItemId = addToGalleryRes.data?.data?.id;
    assert(Boolean(galleryItemId), 'Gallery item created with valid ID');
    assert(addToGalleryRes.data?.data?.mediaId === testMediaId, 'Gallery item references the existing media asset ID');

    // 6. Prevent duplicate gallery membership at database/API level
    console.log('\n6. Prevent duplicate gallery membership');
    const dupAddRes = await request('/gallery', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        mediaId: testMediaId,
        customTitle: 'Updated Duplicate Title'
      })
    });
    // ON CONFLICT updates existing record gracefully without creating a duplicate row
    assert(dupAddRes.status === 201, 'Duplicate addition updates existing membership cleanly');
    assert(dupAddRes.data?.data?.id === galleryItemId, 'Returned ID is the same existing gallery item ID');

    // 7. Verify Public Gallery API returns the item without leaking private fields
    console.log('\n7. Verify Public Gallery API response');
    const publicGalleryRes = await request('/gallery');
    assert(publicGalleryRes.status === 200, 'Public GET /gallery returns 200 OK');
    const foundItem = publicGalleryRes.data?.data?.find((i) => i.mediaId === testMediaId);
    assert(Boolean(foundItem), 'Test media appears in public gallery');
    assert(foundItem?.title === 'Updated Duplicate Title', 'Custom title override appears on public gallery item');
    assert(foundItem?.storageKey === undefined, 'Internal storage key is NOT leaked to public visitors');
    assert(foundItem?.uploadedByUserId === undefined, 'Uploader user ID is NOT leaked');

    // 8. Verify Media Library displays gallery membership & Public Gallery filter
    console.log('\n8. Verify Media Library integration & filters');
    const mediaInspectRes = await request(`/media/${testMediaId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(mediaInspectRes.status === 200, 'GET /media/:id succeeds');
    assert(mediaInspectRes.data?.data?.inGallery === true, 'Media asset reports inGallery: true');
    assert(mediaInspectRes.data?.data?.galleryItemId === galleryItemId, 'Media asset reports galleryItemId');

    // Test gallery category filter
    const galleryFilterRes = await request('/media?category=gallery', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(galleryFilterRes.status === 200, 'GET /media?category=gallery succeeds');
    const inFilterList = galleryFilterRes.data?.data?.some((m) => m.id === testMediaId);
    assert(inFilterList, 'Test media is returned when filtering by category=gallery');

    // 9. Verify deletion safeguards while referenced in Gallery
    console.log('\n9. Verify deletion safeguards');
    const refRes = await request(`/media/${testMediaId}/references`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(refRes.status === 200, 'GET /media/:id/references succeeds');
    const galleryRef = refRes.data?.data?.references?.find((r) => r.entityType === 'gallery');
    assert(Boolean(galleryRef), 'References include entityType "gallery"');

    const tryDeleteRes = await request(`/media/${testMediaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(tryDeleteRes.status === 409, `DELETE /media/:id returns 409 Conflict while referenced by gallery (got ${tryDeleteRes.status})`);

    // 10. Update Gallery presentation metadata
    console.log('\n10. Update Gallery item metadata');
    const patchRes = await request(`/gallery/${galleryItemId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customTitle: 'Final Mountain Dawn',
        caption: 'Crisp morning air at 12,000 feet.',
        sortOrder: 5
      })
    });
    assert(patchRes.status === 200, `PATCH /gallery/:id returns 200 OK (got ${patchRes.status})`);
    assert(patchRes.data?.data?.customTitle === 'Final Mountain Dawn', 'Custom title was updated');
    assert(patchRes.data?.data?.sortOrder === 5, 'Sort order was updated');

    // 11. Reorder Gallery items
    console.log('\n11. Reorder Gallery items');
    const reorderRes = await request('/gallery/reorder', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        items: [{ id: galleryItemId, sortOrder: 1 }]
      })
    });
    assert(reorderRes.status === 200, `PUT /gallery/reorder returns 200 OK (got ${reorderRes.status})`);

    // 12. Remove from Gallery (asset must NOT be deleted from media_assets!)
    console.log('\n12. Remove asset from Gallery (preserving media asset)');
    const removeRes = await request(`/gallery/${galleryItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(removeRes.status === 200, `DELETE /gallery/:id returns 200 OK (got ${removeRes.status})`);

    const mediaStillExists = await request(`/media/${testMediaId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(mediaStillExists.status === 200, 'Media asset STILL EXISTS in Media Library after removing from gallery');
    assert(mediaStillExists.data?.data?.inGallery === false, 'Media asset now reports inGallery: false');

    // 13. Now delete media asset (should succeed since reference is gone)
    console.log('\n13. Delete unreferenced media asset');
    const deleteMediaRes = await request(`/media/${testMediaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteMediaRes.status === 200, `DELETE /media/:id succeeds after removing gallery reference (got ${deleteMediaRes.status})`);
    testMediaId = null;

    // 14. Upload image with showInGallery: true flag
    console.log('\n14. Upload image with showInGallery flag');
    const tinyPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(tinyPngBase64, 'base64');
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', pngBlob, 'gallery-alpine-sunset.png');
    formData.append('category', 'general');
    formData.append('label', 'Alpine Sunset Direct Gallery Upload');
    formData.append('showInGallery', 'true');

    const uploadRes = await request('/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData
    });
    assert(uploadRes.status === 201, `Upload with showInGallery returns 201 (got ${uploadRes.status})`);
    uploadMediaId = uploadRes.data?.data?.id;
    assert(uploadRes.data?.data?.inGallery === true, 'Uploaded asset has inGallery: true');

    // Clean up uploaded media
    if (uploadMediaId) {
      await request(`/gallery/${uploadRes.data?.data?.galleryItemId || uploadMediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      await request(`/media/${uploadMediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      uploadMediaId = null;
    }

  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  if (server) server.close();
  process.exit(1);
});
