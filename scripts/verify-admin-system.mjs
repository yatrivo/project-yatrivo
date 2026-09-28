import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;
const BASE_URL = 'http://localhost:4000/api/v1';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('--- Starting Admin Management System Verification Suite ---');

  // 1. Super Admin Login
  console.log('\n[Test 1] Super Admin Login (yatrivo3@gmail.com)');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'yatrivo3@gmail.com', password: 'YatrivoAdmin@2026!' })
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`Super admin login failed: ${JSON.stringify(loginData)}`);
  }
  const superAdminToken = loginData.data.tokens.accessToken;
  const superAdminId = loginData.data.user.id;
  console.log('✓ Super Admin authenticated successfully. User:', loginData.data.user.fullName, 'Role:', loginData.data.user.role);

  // 2. Fetch all admins as Super Admin
  console.log('\n[Test 2] GET /admin/users (List all admins)');
  const listRes = await fetch(`${BASE_URL}/admin/users`, {
    headers: { 'Authorization': `Bearer ${superAdminToken}` }
  });
  const listData = await listRes.json();
  if (!listRes.ok) {
    throw new Error(`Failed to list admins: ${JSON.stringify(listData)}`);
  }
  console.log(`✓ Fetched ${listData.data.admins.length} admin accounts successfully.`);

  // Cleanup any previous test admin
  await pool.query("DELETE FROM users WHERE email = 'test_ops_admin@yatrivo.com'");

  // 3. Create a new Admin account
  console.log('\n[Test 3] POST /admin/users (Create new admin with initial password)');
  const initialPassword = 'InitialSecret2026!';
  const createRes = await fetch(`${BASE_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fullName: 'Operations Manager',
      email: 'test_ops_admin@yatrivo.com',
      role: 'admin',
      password: initialPassword
    })
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Failed to create admin: ${JSON.stringify(createData)}`);
  }
  const createdAdmin = createData.data.admin;
  console.log('✓ Admin created successfully:');
  console.log('  ID:', createdAdmin.id);
  console.log('  Email:', createdAdmin.email);
  console.log('  Status:', createdAdmin.status);
  console.log('  Role:', createdAdmin.role);
  console.log('  mustChangePassword:', createdAdmin.mustChangePassword);

  if (createdAdmin.mustChangePassword !== true) {
    throw new Error('Expected mustChangePassword to be true for newly created admin');
  }
  if ('password' in createdAdmin || 'password_hash' in createdAdmin || 'initialPassword' in createdAdmin) {
    throw new Error('Plaintext password or hash leaked in API response!');
  }
  console.log('✓ Security check: No password fields leaked in API response.');

  // 4. Test RBAC: Non-Super-Admin cannot access /admin/users
  console.log('\n[Test 4] RBAC Verification: Log in as standard admin and test restricted endpoints');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_ops_admin@yatrivo.com', password: initialPassword })
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok) {
    throw new Error(`New admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  const adminToken = adminLoginData.data.tokens.accessToken;
  console.log('✓ New admin logged in successfully. mustChangePassword is:', adminLoginData.data.user.mustChangePassword);

  const forbiddenCreateRes = await fetch(`${BASE_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fullName: 'Hacker',
      email: 'hacker@yatrivo.com',
      role: 'super_admin',
      initialPassword: 'HackerPass123!'
    })
  });
  if (forbiddenCreateRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for non-super-admin, got ${forbiddenCreateRes.status}`);
  }
  console.log('✓ RBAC confirmed: Standard admin blocked from creating admins (403 Forbidden).');

  // 5. First-Login Forced Password Change
  console.log('\n[Test 5] POST /auth/change-password (First-login forced password change)');
  const permanentPassword = 'PermanentSecurePass2026!';
  const changePassRes = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      newPassword: permanentPassword
    })
  });
  const changePassData = await changePassRes.json();
  if (!changePassRes.ok) {
    throw new Error(`Forced password change failed: ${JSON.stringify(changePassData)}`);
  }
  console.log('✓ Password changed successfully. New user state:');
  console.log('  mustChangePassword:', changePassData.data.user.mustChangePassword);

  if (changePassData.data.user.mustChangePassword !== false) {
    throw new Error('Expected mustChangePassword to be false after change');
  }

  // 6. Verify Old Initial Password is no longer accepted
  console.log('\n[Test 6] Verify old initial password is rejected');
  const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_ops_admin@yatrivo.com', password: initialPassword })
  });
  if (oldLoginRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized with old password, got ${oldLoginRes.status}`);
  }
  console.log('✓ Old password rejected as expected (401).');

  // 7. Verify New Permanent Password is accepted
  console.log('\n[Test 7] Verify new permanent password is accepted');
  const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_ops_admin@yatrivo.com', password: permanentPassword })
  });
  const newLoginData = await newLoginRes.json();
  if (!newLoginRes.ok) {
    throw new Error(`Login with permanent password failed: ${JSON.stringify(newLoginData)}`);
  }
  console.log('✓ Login with new password succeeded. mustChangePassword is:', newLoginData.data.user.mustChangePassword);

  // 8. Forgot Password Flow
  console.log('\n[Test 8] POST /auth/forgot-password (Request secure email reset link)');
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_ops_admin@yatrivo.com' })
  });
  const forgotData = await forgotRes.json();
  if (!forgotRes.ok) {
    throw new Error(`Forgot password request failed: ${JSON.stringify(forgotData)}`);
  }
  console.log('✓ Forgot password request succeeded with generic message:', forgotData.message);

  // Check database for token record
  const tokenQuery = await pool.query(
    "SELECT id, token_hash, expires_at, consumed_at FROM password_reset_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    [createdAdmin.id]
  );
  if (tokenQuery.rowCount === 0) {
    throw new Error('No password reset token record found in database');
  }
  const tokenRecord = tokenQuery.rows[0];
  console.log('✓ Token record found in DB. Expires at:', tokenRecord.expires_at, 'Consumed at:', tokenRecord.consumed_at);

  // 9. Reset Password with Token
  console.log('\n[Test 9] POST /auth/reset-password (Reset password with email link token)');
  // In the real flow, the raw token is sent in the email. Since we compute tokenHash = sha256(rawToken),
  // let's insert a known test token into the DB to test the endpoint end-to-end
  const testRawToken = 'test_secret_reset_token_' + Date.now();
  const testHash = crypto.createHash('sha256').update(testRawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
  await pool.query(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [createdAdmin.id, testHash, expiresAt]
  );

  const resetPasswordTarget = 'SuperFreshResetPass2026!';
  const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: testRawToken,
      newPassword: resetPasswordTarget
    })
  });
  const resetData = await resetRes.json();
  if (!resetRes.ok) {
    throw new Error(`Reset password endpoint failed: ${JSON.stringify(resetData)}`);
  }
  console.log('✓ Password reset completed successfully:', resetData.message);

  // Verify token is single use: try resetting again with same token
  const reusedResetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: testRawToken,
      newPassword: 'AnotherPassword123!'
    })
  });
  if (reusedResetRes.status !== 400) {
    throw new Error(`Expected 400 for reused token, got ${reusedResetRes.status}`);
  }
  console.log('✓ Single-use guarantee confirmed: Reused reset token rejected (400).');

  // Verify login with freshly reset password
  const freshLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_ops_admin@yatrivo.com', password: resetPasswordTarget })
  });
  if (!freshLoginRes.ok) {
    throw new Error('Login with freshly reset password failed');
  }
  console.log('✓ Login with reset password succeeded.');

  // 10. Deactivation & Reactivation Lifecycle
  console.log('\n[Test 10] Deactivation & Reactivation lifecycle');
  const deactivateRes = await fetch(`${BASE_URL}/admin/users/${createdAdmin.id}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'disabled' })
  });
  const deactivateData = await deactivateRes.json();
  if (!deactivateRes.ok) {
    throw new Error(`Failed to deactivate admin: ${JSON.stringify(deactivateData)}`);
  }
  console.log('✓ Admin deactivated. Status:', deactivateData.data.admin.status);

  // Disabled user cannot log in
  const disabledLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_ops_admin@yatrivo.com', password: resetPasswordTarget })
  });
  if (disabledLoginRes.status !== 403) {
    throw new Error(`Expected 403 for deactivated admin login, got ${disabledLoginRes.status}`);
  }
  console.log('✓ Deactivated admin cannot log in (403 Forbidden).');

  // Reactivate admin
  const reactivateRes = await fetch(`${BASE_URL}/admin/users/${createdAdmin.id}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'active' })
  });
  const reactivateData = await reactivateRes.json();
  if (!reactivateRes.ok) {
    throw new Error(`Failed to reactivate admin: ${JSON.stringify(reactivateData)}`);
  }
  console.log('✓ Admin reactivated. Status:', reactivateData.data.admin.status);

  // Self-deactivation protection
  console.log('\n[Test 11] Self-deactivation protection');
  const selfDeactivateRes = await fetch(`${BASE_URL}/admin/users/${superAdminId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'disabled' })
  });
  if (selfDeactivateRes.status !== 400) {
    throw new Error(`Expected 400 when attempting to deactivate self, got ${selfDeactivateRes.status}`);
  }
  console.log('✓ Self-deactivation blocked as expected (400 Bad Request).');

  // Cleanup
  console.log('\n[Cleanup] Cleaning up test admin user');
  await pool.query("DELETE FROM users WHERE email = 'test_ops_admin@yatrivo.com'");
  console.log('✓ Test user removed.');

  console.log('\n======================================================');
  console.log('🎉 ALL ADMIN MANAGEMENT SYSTEM TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    pool.end();
    process.exit(1);
  });
