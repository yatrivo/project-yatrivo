import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(repoRoot, 'database', 'migrations');

function redact(value) {
  if (!value) return 'not set';
  if (value.length <= 12) return '***';
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing.');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Connecting to PostgreSQL with DATABASE_URL ${redact(connectionString)}`);
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(migrationsDir))
      .filter((file) => /^\d+.*\.sql$/i.test(file))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    for (const file of files) {
      const migrationId = file;
      const existing = await client.query('SELECT id FROM schema_migrations WHERE id = $1', [migrationId]);
      if (existing.rowCount > 0) {
        console.log(`SKIP ${migrationId}`);
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      console.log(`APPLY ${migrationId}`);
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migrationId]);
      console.log(`DONE  ${migrationId}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
