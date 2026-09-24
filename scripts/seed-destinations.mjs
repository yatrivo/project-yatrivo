import 'dotenv/config';
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

const INITIAL_DESTINATIONS = [
  {
    slug: 'chopta',
    name: 'Chopta Valley',
    tagline: 'Alpine meadows & dense forest',
    description:
      "Known as the 'Mini Switzerland of India', Chopta is a pristine alpine valley that serves as the base for trekking to Tungnath — the highest Shiva temple in the world. Surrounded by dense rhododendron forests and snow-capped peaks, it offers breathtaking natural beauty year-round.",
    image: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&h=400&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=1920&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1458442310124-dde6edb43d10?w=600&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop&auto=format'
    ],
    category: 'high_altitude',
    season: 'April – Nov',
    highlights: [
      'Trek to Tungnath temple (12,073 ft)',
      'Chandrashila Summit panoramic views',
      'Deoria Tal lake reflection',
      'Dense rhododendron forests in bloom'
    ],
    activities: ['High-altitude Trekking', 'Summit Climbs', 'Stargazing', 'Wildlife Spotting', 'Forest Camping'],
    elevation: '2,680 m',
    bestTime: 'April – June & Sept – Nov',
    sortOrder: 1
  },
  {
    slug: 'auli',
    name: 'Auli Slopes',
    tagline: 'High-altitude winter paradise',
    description:
      "Auli is India's premier ski destination, offering powder snow, certified ski schools, and stunning Himalayan vistas. Perched at 2,519 metres, the slopes offer beginner to expert runs with views of peaks including Nanda Devi.",
    image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&h=400&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=1920&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&auto=format'
    ],
    category: 'high_altitude',
    season: 'Dec – March',
    highlights: [
      "India's best ski slopes",
      'Cable car rides to 3,010 m',
      'Views of Nanda Devi (7,816 m)',
      "Artificial lake — India's highest"
    ],
    activities: ['Skiing', 'Snowboarding', 'Cable Car', 'Snow Trekking', 'Photography'],
    elevation: '2,519 m',
    bestTime: 'January – February',
    sortOrder: 2
  },
  {
    slug: 'rishikesh',
    name: 'Rishikesh',
    tagline: 'Holy river & yoga capital',
    description:
      'Nestled in the foothills of the Himalayas along the sacred Ganga, Rishikesh is one of India\'s most spiritually significant towns. Known as the yoga capital of the world, it draws seekers from across the globe to its ancient ashrams, serene riverbanks, and powerful meditation centres.',
    image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&h=400&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1920&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop&auto=format'
    ],
    category: 'spiritual',
    season: 'Sept – April',
    highlights: [
      'Ganga Aarti ceremony at dusk',
      'White water rafting Grade 3–5',
      '200+ ashrams & yoga schools',
      'Lakshman Jhula suspension bridge'
    ],
    activities: ['Yoga & Meditation', 'White Water Rafting', 'Bungee Jumping', 'Cliff Diving', 'Evening Aarti'],
    bestTime: 'October – March',
    sortOrder: 3
  },
  {
    slug: 'kedarnath',
    name: 'Kedarnath',
    tagline: 'Spiritual heights & high peaks',
    description:
      'One of the holiest Hindu shrines and part of the Char Dham, Kedarnath sits at 3,583 m surrounded by glaciers and towering peaks. The journey here is as sacred as the destination — a trek through mountain meadows, ancient forests, and the roaring Mandakini river.',
    image: 'https://images.unsplash.com/photo-1580281657702-257584239a55?w=600&h=400&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1580281657702-257584239a55?w=1920&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1458442310124-dde6edb43d10?w=600&h=400&fit=crop&auto=format'
    ],
    category: 'spiritual',
    season: 'May – Nov',
    highlights: [
      'Kedarnath Temple (3,583 m)',
      'Vasuki Tal glacial lake trek',
      'Bhairavnath temple viewpoint',
      'Triyuginarayan eternal fire'
    ],
    activities: ['Pilgrimage Trek', 'Temple Visit', 'Meditation', 'High-altitude Camping'],
    elevation: '3,583 m',
    bestTime: 'May – June & Sept – Oct',
    sortOrder: 4
  },
  {
    slug: 'kanatal',
    name: 'Kanatal',
    tagline: 'Cozy pine woods & stargazing cabins',
    description:
      "Kanatal is a hidden gem in Uttarakhand's Tehri Garhwal district — a quiet, verdant hamlet surrounded by oak and rhododendron forests. Perfect for weekend escapes, the stargazing here is exceptional due to minimal light pollution.",
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=600&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop&auto=format'
    ],
    category: 'weekend',
    season: 'Year round',
    highlights: [
      'Crystal clear night skies',
      'Apple orchards & forest walks',
      'Kodia Jungle camping',
      'Tehri Lake viewpoints'
    ],
    activities: ['Stargazing', 'Forest Camping', 'Nature Walks', 'Rock Climbing', 'Rappelling'],
    elevation: '2,590 m',
    bestTime: 'March – June & Sept – Nov',
    sortOrder: 5
  },
  {
    slug: 'chakrata',
    name: 'Chakrata',
    tagline: 'Waterfalls & ancient hill forts',
    description:
      "Chakrata is one of Uttarakhand's least-visited hill stations, offering pristine forests, ancient Mahasu Devta temple, and the magnificent Tiger Falls — one of India's highest waterfalls at 312 feet. A perfect offbeat destination away from tourist trails.",
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=600&h=400&fit=crop&auto=format'
    ],
    category: 'weekend',
    season: 'March – July',
    highlights: [
      "Tiger Falls (312 ft) — India's tallest plunge",
      'Chilmiri Neck panoramic point',
      'Mahasu Devta ancient temple',
      'Deoban forest camping'
    ],
    activities: ['Waterfall Trek', 'Forest Walks', 'Temple Visit', 'Bird Watching', 'Camping'],
    elevation: '2,118 m',
    bestTime: 'April – July',
    sortOrder: 6
  },
  {
    slug: 'mussoorie',
    name: 'Mussoorie',
    tagline: 'Colonial hills & sunset viewpoints',
    description:
      "Known as the 'Queen of Hills', Mussoorie blends Victorian-era charm with sweeping Himalayan vistas. The Mall Road, Landour's quiet lanes, and Kempty Falls make it perfect for a relaxed getaway with a colonial character.",
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=600&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop&auto=format'
    ],
    category: 'weekend',
    season: 'Sept – June',
    highlights: [
      'Landour heritage lanes',
      'Gun Hill cable car',
      'Kempty Falls',
      'Christ Church (1836)'
    ],
    activities: ['Heritage Walks', 'Cable Car', 'Orchard Visits', 'Photography', 'Local Cuisine'],
    elevation: '2,005 m',
    bestTime: 'March – June & Sept – Nov',
    sortOrder: 7
  }
];

async function main() {
  await client.connect();
  console.log('Connected to database.');

  try {
    for (const d of INITIAL_DESTINATIONS) {
      console.log(`Seeding destination: ${d.name} (${d.slug})...`);
      
      const insertResult = await client.query(
        `INSERT INTO destinations (
          name, slug, tagline, description, category, season_label,
          best_time_label, elevation_label, status, sort_order,
          cover_image_url, gallery_image_urls
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          tagline = EXCLUDED.tagline,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          season_label = EXCLUDED.season_label,
          best_time_label = EXCLUDED.best_time_label,
          elevation_label = EXCLUDED.elevation_label,
          status = 'active',
          sort_order = EXCLUDED.sort_order,
          cover_image_url = EXCLUDED.cover_image_url,
          gallery_image_urls = EXCLUDED.gallery_image_urls
        RETURNING id`,
        [
          d.name,
          d.slug,
          d.tagline,
          d.description,
          d.category,
          d.season,
          d.bestTime,
          d.elevation || null,
          d.sortOrder,
          d.image,
          d.gallery
        ]
      );

      const destId = insertResult.rows[0].id;

      // Highlights
      await client.query(`DELETE FROM destination_highlights WHERE destination_id = $1`, [destId]);
      for (let i = 0; i < d.highlights.length; i++) {
        await client.query(
          `INSERT INTO destination_highlights (destination_id, text, sort_order) VALUES ($1, $2, $3)`,
          [destId, d.highlights[i], i + 1]
        );
      }

      // Activities
      await client.query(`DELETE FROM destination_activities WHERE destination_id = $1`, [destId]);
      for (let i = 0; i < d.activities.length; i++) {
        await client.query(
          `INSERT INTO destination_activities (destination_id, name, sort_order) VALUES ($1, $2, $3)`,
          [destId, d.activities[i], i + 1]
        );
      }

      console.log(`✓ Seeded ${d.name} with ID: ${destId}`);
    }

    console.log('\nAll initial destinations seeded successfully.');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
