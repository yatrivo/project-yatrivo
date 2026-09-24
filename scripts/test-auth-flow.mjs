import 'dotenv/config';
import { createApp } from '../backend/dist/app.js';
import { closeDatabase } from '../backend/dist/db/postgres.js';

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

async function run() {
  console.log('--- Starting Authentication & Authorization Tests ---\n');

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
  console.log(`Test server running at http://localhost:${PORT}\n`);

  try {
    // 1. Health check
    console.log('1. Health check');
    const healthRes = await request('/health');
    assert(healthRes.status === 200 && healthRes.data.status === 'ok', 'Health endpoint returns 200 ok');

    // 2. Non-existent email login
    console.log('\n2. Non-existent email login rejection');
    const notFoundRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ghost@yatrivo.com', password: 'AnyPassword123!' })
    });
    assert(notFoundRes.status === 401, 'Returns 401 status');
    assert(notFoundRes.data.error.code === 'INVALID_CREDENTIALS', 'Error code is INVALID_CREDENTIALS');

    // 3. Wrong password login
    console.log('\n3. Wrong password rejection');
    const wrongPassRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@yatrivo.com', password: 'WrongPassword123!' })
    });
    assert(wrongPassRes.status === 401, 'Returns 401 status');
    assert(wrongPassRes.data.error.code === 'INVALID_CREDENTIALS', 'Error code is INVALID_CREDENTIALS');

    // 4. Disabled admin account login
    console.log('\n4. Disabled admin account rejection');
    const disabledRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'disabled.admin@yatrivo.com', password: 'YatrivoAdmin@2026!' })
    });
    assert(disabledRes.status === 403, 'Returns 403 status');
    assert(disabledRes.data.error.code === 'ACCOUNT_DISABLED', 'Error code is ACCOUNT_DISABLED');

    // 5. Non-admin user (customer) login rejection
    console.log('\n5. Non-admin customer login restriction');
    const customerRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'customer@yatrivo.com', password: 'YatrivoAdmin@2026!' })
    });
    assert(customerRes.status === 403, 'Returns 403 status');
    assert(customerRes.data.error.code === 'FORBIDDEN', 'Error code is FORBIDDEN for non-admin user');

    // 6. Admin login success
    console.log('\n6. Operations Admin login success');
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@yatrivo.com', password: 'YatrivoAdmin@2026!' })
    });
    assert(adminLoginRes.status === 200, 'Returns 200 status');
    assert(adminLoginRes.data.data.user.role === 'admin', 'User role is admin');
    assert(Boolean(adminLoginRes.data.data.tokens.accessToken), 'Returns accessToken');
    assert(Boolean(adminLoginRes.data.data.tokens.refreshToken), 'Returns refreshToken');
    const adminAccessToken = adminLoginRes.data.data.tokens.accessToken;
    const adminRefreshToken = adminLoginRes.data.data.tokens.refreshToken;

    // 7. Super Admin login success
    console.log('\n7. Super Admin login success');
    const superAdminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'yatrivo3@gmail.com', password: 'YatrivoAdmin@2026!' })
    });
    assert(superAdminLoginRes.status === 200, 'Returns 200 status');
    assert(superAdminLoginRes.data.data.user.role === 'super_admin', 'User role is super_admin');
    const superAccessToken = superAdminLoginRes.data.data.tokens.accessToken;

    // 8. Authenticated /me endpoint
    console.log('\n8. Authenticated GET /auth/me');
    const meRes = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });
    assert(meRes.status === 200, 'Returns 200 status');
    assert(meRes.data.data.user.email === 'admin@yatrivo.com', 'Returns correct authenticated user');

    // 9. Unauthenticated /me endpoint
    console.log('\n9. Unauthenticated GET /auth/me');
    const unauthRes = await request('/auth/me', { method: 'GET' });
    assert(unauthRes.status === 401, 'Returns 401 status');
    assert(unauthRes.data.error.code === 'UNAUTHORIZED', 'Error code is UNAUTHORIZED');

    // 10. Tampered token rejection
    console.log('\n10. Tampered token rejection');
    const tamperedRes = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAccessToken}tampered` }
    });
    assert(tamperedRes.status === 401, 'Returns 401 status');
    assert(tamperedRes.data.error.code === 'INVALID_TOKEN', 'Error code is INVALID_TOKEN');

    // 11. Refresh token rotation
    console.log('\n11. Refresh token rotation');
    const refreshRes = await request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: adminRefreshToken })
    });
    assert(refreshRes.status === 200, 'Returns 200 status on refresh');
    assert(Boolean(refreshRes.data.data.tokens.accessToken), 'Returns new accessToken');
    assert(Boolean(refreshRes.data.data.tokens.refreshToken), 'Returns new refreshToken');
    assert(refreshRes.data.data.tokens.refreshToken !== adminRefreshToken, 'Refresh token was rotated');
    const rotatedAccessToken = refreshRes.data.data.tokens.accessToken;
    const rotatedRefreshToken = refreshRes.data.data.tokens.refreshToken;

    // Verify new access token works
    const meAfterRefresh = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${rotatedAccessToken}` }
    });
    assert(meAfterRefresh.status === 200, 'New rotated access token functions properly');

    // 12. Revoked refresh token reuse attempt (security check)
    console.log('\n12. Revoked refresh token reuse detection');
    const reuseRes = await request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: adminRefreshToken }) // Old token!
    });
    assert(reuseRes.status === 401, 'Returns 401 status on revoked token reuse');
    assert(reuseRes.data.error.code === 'INVALID_REFRESH_TOKEN', 'Error code is INVALID_REFRESH_TOKEN');

    // 13. Role-based authorization middleware
    console.log('\n13. Role-based authorization middleware');
    // Admin calling admin-only route -> 200
    const adminOnAdminRoute = await request('/test/admin-only', {
      method: 'GET',
      headers: { Authorization: `Bearer ${rotatedAccessToken}` }
    });
    assert(adminOnAdminRoute.status === 200, 'Admin can access admin-only endpoint');

    // Admin calling super-admin-only route -> 403 FORBIDDEN
    const adminOnSuperRoute = await request('/test/super-admin-only', {
      method: 'GET',
      headers: { Authorization: `Bearer ${rotatedAccessToken}` }
    });
    assert(adminOnSuperRoute.status === 403, 'Admin is blocked from super-admin-only endpoint');
    assert(adminOnSuperRoute.data.error.code === 'FORBIDDEN', 'Error code is FORBIDDEN');

    // Super Admin calling admin-only route -> 200
    const superOnAdminRoute = await request('/test/admin-only', {
      method: 'GET',
      headers: { Authorization: `Bearer ${superAccessToken}` }
    });
    assert(superOnAdminRoute.status === 200, 'Super Admin can access admin-only endpoint');

    // Super Admin calling super-admin-only route -> 200
    const superOnSuperRoute = await request('/test/super-admin-only', {
      method: 'GET',
      headers: { Authorization: `Bearer ${superAccessToken}` }
    });
    assert(superOnSuperRoute.status === 200, 'Super Admin can access super-admin-only endpoint');

    // 14. Logout session revocation
    console.log('\n14. Logout session revocation');
    const logoutRes = await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rotatedRefreshToken }),
      headers: { Authorization: `Bearer ${rotatedAccessToken}` }
    });
    assert(logoutRes.status === 200, 'Logout returns 200');

    // Trying to refresh with logged-out token
    const refreshAfterLogout = await request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rotatedRefreshToken })
    });
    assert(refreshAfterLogout.status === 401, 'Logged out token cannot be used to refresh');

    // 15. Revoke all sessions endpoint
    console.log('\n15. Revoke all sessions');
    // Re-login super admin to test revoke-all
    const reLoginSuper = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'yatrivo3@gmail.com', password: 'YatrivoAdmin@2026!' })
    });
    const superTokens = reLoginSuper.data.data.tokens;

    const revokeAllRes = await request('/auth/revoke-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superTokens.accessToken}` }
    });
    assert(revokeAllRes.status === 200, 'Revoke-all returns 200');

    const refreshAfterRevokeAll = await request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: superTokens.refreshToken })
    });
    assert(refreshAfterRevokeAll.status === 401, 'Tokens revoked by revoke-all cannot be used');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} passed, ${failed} failed.`);
    console.log(`========================================\n`);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
