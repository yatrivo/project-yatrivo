import 'dotenv/config';
import { createApp } from '../backend/dist/app.js';
import { closeDatabase, query } from '../backend/dist/db/postgres.js';

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
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
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
  console.log('--- Starting Destinations Lifecycle & Soft-Delete Tests ---\n');

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  console.log(`Test server running at http://localhost:${PORT}\n`);

  try {
    // 1. Health check
    console.log('1. Health check');
    const health = await request('/health');
    assert(health.status === 200, 'Health endpoint responds 200');

    // 2. Public destinations listing returns only active
    console.log('\n2. Public destinations listing (excludes archived)');
    const publicList = await request('/destinations');
    assert(publicList.status === 200, 'Public list returns 200');
    assert(Array.isArray(publicList.data.data), 'Public list data is an array');
    const hasArchivedPublic = publicList.data.data.some((d) => d.status === 'archived');
    assert(!hasArchivedPublic, 'Public list contains 0 archived destinations');

    // 3. Admin Login
    console.log('\n3. Admin authentication');
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

    // 4. Unauthorized rejection for create & archive
    console.log('\n4. Unauthorized rejection (requires admin token)');
    const unauthCreate = await request('/destinations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Unauthorized Valley' })
    });
    assert(unauthCreate.status === 401, 'POST /destinations without token returns 401');

    const unauthArchive = await request('/destinations/11111111-1111-1111-1111-111111111111/archive', {
      method: 'POST'
    });
    assert(unauthArchive.status === 401, 'POST /archive without token returns 401');

    // 5. Create a new destination as admin
    console.log('\n5. Create destination as admin');
    const testSlug = `test-valley-${Date.now()}`;
    const createRes = await request('/destinations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Valley of Flowers Test',
        slug: testSlug,
        tagline: 'UNESCO World Heritage alpine biosphere',
        description: 'Spectacular alpine flower meadows in Chamoli district.',
        category: 'high-altitude',
        season: 'July – September',
        bestTime: 'August',
        elevation: '3,658 m',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600',
        gallery: [
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600'
        ],
        highlights: ['Endless floral carpet', 'Hemkund Sahib lake nearby', 'Snow leopard habitat'],
        activities: ['High-altitude Trekking', 'Botanical Photography', 'Wildlife Spotting'],
        sortOrder: 10
      })
    });

    assert(createRes.status === 201, 'Create destination returns 201');
    const createdDest = createRes.data.data;
    assert(createdDest.name === 'Valley of Flowers Test', 'Created destination name matches');
    assert(createdDest.status === 'active', 'Created destination default status is "active"');
    assert(createdDest.archivedAt === null, 'Created destination archivedAt is null');
    const createdId = createdDest.id;

    // 6. Edit the destination
    console.log('\n6. Edit destination as admin');
    const editRes = await request(`/destinations/${createdId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        tagline: 'Updated UNESCO World Heritage alpine biosphere',
        bestTime: 'Mid July to Mid August'
      })
    });
    assert(editRes.status === 200, 'PATCH destination returns 200');
    assert(editRes.data.data.tagline === 'Updated UNESCO World Heritage alpine biosphere', 'Tagline was updated');
    assert(editRes.data.data.bestTime === 'Mid July to Mid August', 'Best time was updated');

    // 7. Verify destination is visible publicly while active
    console.log('\n7. Verify active destination is publicly visible');
    const publicGetActive = await request(`/destinations/${createdId}`);
    assert(publicGetActive.status === 200, 'Public GET active destination returns 200');
    assert(publicGetActive.data.data.id === createdId, 'Public destination ID matches');

    // 8. Archive the destination (Soft Delete)
    console.log('\n8. Archive destination as admin');
    const archiveRes = await request(`/destinations/${createdId}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(archiveRes.status === 200, 'Archive endpoint returns 200');
    assert(archiveRes.data.data.status === 'archived', 'Status is updated to "archived"');
    assert(Boolean(archiveRes.data.data.archivedAt), 'archivedAt timestamp is populated');

    // 9. Verify soft delete semantics (NOT hard deleted)
    console.log('\n9. Verify soft-delete semantics');
    // Direct DB check
    const dbCheck = await query('SELECT id, status, archived_at FROM destinations WHERE id = $1', [createdId]);
    assert(dbCheck.rows.length === 1, 'Database record is retained (NOT hard-deleted)');
    assert(dbCheck.rows[0].status === 'archived', 'Database record has status = "archived"');
    assert(dbCheck.rows[0].archived_at !== null, 'Database record has archived_at timestamp');

    // Public list must EXCLUDE archived destination
    const publicListAfter = await request('/destinations');
    const inPublicList = publicListAfter.data.data.some((d) => d.id === createdId);
    assert(!inPublicList, 'Archived destination is excluded from public list');

    // Public GET single destination must return 404
    const publicGetArchived = await request(`/destinations/${createdId}`);
    assert(publicGetArchived.status === 404, 'Public GET of archived destination returns 404 Not Found');

    // 10. Admin can view archived destinations and ordering puts archived at the bottom
    console.log('\n10. Admin can view archived destinations (ordered at bottom)');
    const adminList = await request('/destinations?includeArchived=true', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminList.status === 200, 'Admin list returns 200');
    const inAdminList = adminList.data.data.some((d) => d.id === createdId);
    assert(inAdminList, 'Admin list includes archived destination');

    // Check bottom ordering
    const adminDestinations = adminList.data.data;
    const lastDest = adminDestinations[adminDestinations.length - 1];
    assert(lastDest.status === 'archived', 'Archived destination appears at the bottom of the list');

    // Admin can view single archived destination
    const adminGetArchived = await request(`/destinations/${createdId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminGetArchived.status === 200, 'Admin can view single archived destination');
    assert(adminGetArchived.data.data.status === 'archived', 'Destination status is archived');

    // 11. Unarchive (Restore) the destination
    console.log('\n11. Unarchive (Restore) destination as admin');
    const unarchiveRes = await request(`/destinations/${createdId}/unarchive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(unarchiveRes.status === 200, 'Unarchive endpoint returns 200');
    assert(unarchiveRes.data.data.status === 'active', 'Status restored to "active"');
    assert(unarchiveRes.data.data.archivedAt === null, 'archivedAt reset to null');

    // Public list includes it again
    const publicListRestored = await request('/destinations');
    const inPublicRestored = publicListRestored.data.data.some((d) => d.id === createdId);
    assert(inPublicRestored, 'Restored destination appears in public list again');

    // 12. Verify NO Hard Delete route exists
    console.log('\n12. Verify NO Hard Delete endpoint exists');
    const deleteRes = await request(`/destinations/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteRes.status === 404, 'DELETE /destinations/:id returns 404 (Hard delete is disallowed)');

    // Clean up test destination from DB at the end so test runs are clean
    await query('DELETE FROM destination_highlights WHERE destination_id = $1', [createdId]);
    await query('DELETE FROM destination_activities WHERE destination_id = $1', [createdId]);
    await query('DELETE FROM destinations WHERE id = $1', [createdId]);
    console.log('\nTest destination cleaned up from database.');

  } catch (err) {
    console.error('\nTest run encountered unexpected error:', err);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase();
  }

  console.log(`\n========================================`);
  console.log(`Tests finished: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();
