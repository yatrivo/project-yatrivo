import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  const getCols = async (tbl) => {
    const res = await client.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_name = $1 ORDER BY ordinal_position`,
      [tbl]
    );
    return res.rows;
  };

  console.log('--- TRIPS ---');
  console.log(await getCols('trips'));

  console.log('--- TRIP_DESTINATIONS ---');
  console.log(await getCols('trip_destinations'));

  console.log('--- TRIP_INSTANCES ---');
  console.log(await getCols('trip_instances'));

  console.log('--- TRIP COUNT ---');
  const tripCount = await client.query('SELECT count(*)::int as count FROM trips');
  console.log('trips in db:', tripCount.rows[0].count);

  console.log('--- DESTINATIONS IN DB ---');
  const dests = await client.query('SELECT id, slug, name, cover_image_url, gallery_image_urls FROM destinations');
  console.log(dests.rows);

} finally {
  await client.end();
}
