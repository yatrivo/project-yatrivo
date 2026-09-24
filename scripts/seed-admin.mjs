import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing.');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to database.');

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const defaultPassword = process.env.ADMIN_SEED_PASSWORD || 'YatrivoAdmin@2026!';
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    const testUsers = [
      {
        email: 'superadmin@yatrivo.com',
        fullName: 'Super Administrator',
        role: 'super_admin',
        status: 'active'
      },
      {
        email: 'admin@yatrivo.com',
        fullName: 'Operations Admin',
        role: 'admin',
        status: 'active'
      },
      {
        email: 'disabled.admin@yatrivo.com',
        fullName: 'Disabled Admin',
        role: 'admin',
        status: 'disabled'
      },
      {
        email: 'customer@yatrivo.com',
        fullName: 'Regular Customer',
        role: 'user',
        status: 'active'
      }
    ];

    for (const u of testUsers) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      let userId;

      if (existing.rowCount > 0) {
        userId = existing.rows[0].id;
        await client.query(
          `UPDATE users
           SET full_name = $1, role = $2, status = $3, password_hash = $4, updated_at = NOW()
           WHERE id = $5`,
          [u.fullName, u.role, u.status, passwordHash, userId]
        );
        console.log(`Updated user: ${u.email} (${u.role}, ${u.status})`);
      } else {
        const insertRes = await client.query(
          `INSERT INTO users (full_name, email, role, status, password_hash, email_verified_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING id`,
          [u.fullName, u.email, u.role, u.status, passwordHash]
        );
        userId = insertRes.rows[0].id;
        console.log(`Created user: ${u.email} (${u.role}, ${u.status})`);
      }

      // Ensure user_auth_identities record exists
      await client.query(
        `INSERT INTO user_auth_identities (user_id, provider, provider_subject, provider_email)
         VALUES ($1, 'password', $2, $3)
         ON CONFLICT DO NOTHING`,
        [userId, u.email, u.email]
      );
    }

    console.log('\nSeed completed successfully.');
    console.log(`Default password for seeded accounts: ${defaultPassword}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
