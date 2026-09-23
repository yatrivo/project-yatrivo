import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  const tables = await client.query(`
    SELECT count(*)::int AS table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `);
  const migrations = await client.query(`
    SELECT id
    FROM schema_migrations
    ORDER BY applied_at
  `);
  console.log(JSON.stringify({
    table_count: tables.rows[0].table_count,
    migrations: migrations.rows.map((row) => row.id),
  }, null, 2));
} finally {
  await client.end();
}
