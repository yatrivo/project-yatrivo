import 'dotenv/config';
import { createApp } from '../backend/dist/app.js';
import { closeDatabase, query } from '../backend/dist/db/postgres.js';

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

async function main() {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      resolve();
    });
  });

  try {
    console.log('\n--- 1. List Public Trips ---');
    const listRes = await request('/trips');
    assert(listRes.status === 200, `GET /trips returned 200 (got ${listRes.status})`);
    assert(Array.isArray(listRes.data?.data), 'Response data is an array');
    assert(listRes.data?.data?.length > 0, `Returned ${listRes.data?.data?.length} trips`);

    const firstTrip = listRes.data?.data?.[0];
    assert(Boolean(firstTrip?.image), `Trip has a single cover image: ${firstTrip?.image?.substring(0, 40)}...`);
    assert(Array.isArray(firstTrip?.gallery), `Trip has a separate gallery array (length ${firstTrip?.gallery?.length})`);
    assert(Array.isArray(firstTrip?.destinations), `Trip has destinations array (length ${firstTrip?.destinations?.length})`);
    assert(firstTrip?.destinations?.length > 0, `Trip is linked to: ${firstTrip?.destinations?.map(d => d.name).join(', ')}`);

    console.log('\n--- 2. Get Single Trip by Slug ---');
    const singleRes = await request(`/trips/${firstTrip.slug}`);
    assert(singleRes.status === 200, `GET /trips/${firstTrip.slug} returned 200`);
    assert(singleRes.data?.data?.name === firstTrip.name, 'Trip name matches');
    assert(Array.isArray(singleRes.data?.data?.destinations), 'Destinations array present');
    assert(Array.isArray(singleRes.data?.data?.departures), `Departures array present (${singleRes.data?.data?.departures?.length} departures)`);
    assert(Array.isArray(singleRes.data?.data?.highlights), 'Highlights array present');

    console.log('\n--- 3. Get Trips For Destination ---');
    const destSlug = firstTrip.destinations[0]?.slug || 'chopta';
    const destTripsRes = await request(`/destinations/${destSlug}/trips`);
    assert(destTripsRes.status === 200, `GET /destinations/${destSlug}/trips returned 200`);
    assert(Array.isArray(destTripsRes.data?.data), 'Destination trips data is an array');
    assert(destTripsRes.data?.data?.length > 0, `Found ${destTripsRes.data?.data?.length} trips for destination ${destSlug}`);

    console.log('\n--- 4. Verify Multidestination Trip ---');
    // Find trip with multiple destinations (e.g. chopta-trek has chopta and rishikesh)
    const multiTrip = listRes.data?.data?.find(t => t.destinations.length > 1);
    if (multiTrip) {
      assert(multiTrip.destinations.length > 1, `Trip "${multiTrip.name}" has ${multiTrip.destinations.length} destinations: ${multiTrip.destinations.map(d => d.name).join(', ')}`);
      assert(multiTrip.destinations.some(d => d.isPrimary), 'Trip has a primary destination designated');
    }

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase();
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
