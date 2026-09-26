import 'dotenv/config';
import { Client } from 'pg';

const INITIAL_TRIPS_SEED = [
  {
    slug: 'chopta-trek',
    name: 'Chopta Tungnath Adventure',
    destinationSlugs: ['chopta', 'rishikesh'],
    primaryDestinationSlug: 'chopta',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=900&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1458442310124-dde6edb43d10?w=900&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&h=600&fit=crop&auto=format'
    ],
    price: 9999,
    duration: '4 Days / 3 Nights',
    durationDays: 4,
    durationNights: 3,
    category: 'trekking',
    difficulty: 'moderate',
    highlights: [
      'Trek to highest Shiva temple in the world',
      'Chandrashila Summit at 13,123 ft',
      'Rhododendron forest trails in bloom',
      'Stargazing from alpine meadows'
    ],
    inclusions: [
      '3 nights accommodation in forest camps',
      'All meals (breakfast, lunch, dinner)',
      'Certified mountain guide',
      'Trekking equipment',
      'First aid & safety gear'
    ],
    exclusions: [
      'Personal travel insurance',
      'Transportation to/from Rishikesh',
      'Alcoholic beverages',
      'Personal expenses'
    ],
    cancellationPolicy: 'Full refund if cancelled 15+ days before departure. 50% refund for 7–14 days. No refund under 7 days.',
    badge: 'BESTSELLER',
    startingPoint: 'Dehradun',
    shortDescription: 'Trek the Sacred Meadow Ridge and reach Chandrashila summit at 13,123 ft.',
    overview: "Widely known as the 'Mini Switzerland of India', Chopta is a gorgeous pristine pine forest and meadow valley. Our itinerary is designed with unhurried acclimatization, beautiful wooden cabin stays, and authentic local Pahadi dining."
  },
  {
    slug: 'auli-ski',
    name: 'Auli Snow & Ski Collective',
    destinationSlugs: ['auli'],
    primaryDestinationSlug: 'auli',
    image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=1200&h=800&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&h=600&fit=crop&auto=format'
    ],
    price: 12499,
    duration: '5 Days / 4 Nights',
    durationDays: 5,
    durationNights: 4,
    category: 'adventure',
    difficulty: 'moderate',
    highlights: [
      "Certified skiing on India's best slopes",
      'Cable car rides to 3,010 m',
      'Views of Nanda Devi from ski runs',
      'Hinoki wood cabin stays'
    ],
    inclusions: [
      '4 nights in ski lodge',
      'Daily breakfast and dinner',
      'Ski equipment rental',
      '2 days certified ski instruction',
      'Cable car passes'
    ],
    exclusions: [
      'Flights or bus to Joshimath',
      'Personal ski clothing',
      'Travel insurance',
      'Lunch & beverages'
    ],
    cancellationPolicy: 'Full refund 20+ days prior. 50% credit within 10–19 days.',
    badge: 'WINTER SPECIAL',
    startingPoint: 'Rishikesh',
    shortDescription: "Certified skiing on India's premier snow slopes with panoramic views of Nanda Devi.",
    overview: 'Experience the magic of pristine Himalayan snow slopes in Auli. Certified instructors guide you through powdered runs with cozy alpine cabin stays.'
  },
  {
    slug: 'rishikesh-rafting',
    name: 'Rishikesh Rapids & Cliff Camp',
    destinationSlugs: ['rishikesh'],
    primaryDestinationSlug: 'rishikesh',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=900&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900&h=600&fit=crop&auto=format'
    ],
    price: 7499,
    duration: '3 Days / 2 Nights',
    durationDays: 3,
    durationNights: 2,
    category: 'adventure',
    difficulty: 'easy',
    highlights: [
      'Grade III & IV white water rafting (26 km)',
      'Cliff jumping from 30 ft rock face',
      'Riverside beach camp with private fire pit',
      'Sunset yoga by the Ganga'
    ],
    inclusions: [
      '2 nights luxury beach camp',
      'All meals + riverside BBQ',
      '26 km white water rafting + safety gear',
      'Cliff jumping session',
      'Campfire & acoustic music'
    ],
    exclusions: [
      'Transport to/from camp',
      'Bungee jumping (optional add-on)',
      'Personal snacks'
    ],
    cancellationPolicy: 'Full refund 7+ days prior. No refund under 7 days.',
    badge: 'POPULAR',
    startingPoint: 'Rishikesh',
    shortDescription: 'Grade III & IV white water rafting on the Ganga with cliff jumping and beach camping.',
    overview: 'An adrenaline-filled weekend on the sacred Ganga. Combine high-grade rapids with tranquil sunset yoga and riverside acoustic firesides.'
  },
  {
    slug: 'kedarnath-yatra',
    name: 'Kedarnath Pilgrimage Trek',
    destinationSlugs: ['kedarnath', 'rishikesh'],
    primaryDestinationSlug: 'kedarnath',
    image: 'https://images.unsplash.com/photo-1580281657702-257584239a55?w=1200&h=800&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1458442310124-dde6edb43d10?w=900&h=600&fit=crop&auto=format'
    ],
    price: 14999,
    duration: '6 Days / 5 Nights',
    durationDays: 6,
    durationNights: 5,
    category: 'spiritual',
    difficulty: 'challenging',
    highlights: [
      'Sacred darshan at 3,583 m ancient temple',
      'Scenic trek alongside Mandakini river',
      'Bhairavnath temple sunrise views',
      'Hot springs at Gaurikund'
    ],
    inclusions: [
      '5 nights hotel & guesthouse accommodation',
      'Pure vegetarian sattvic meals',
      'Yatra registration & biometric pass',
      'Experienced mountain spiritual guide',
      'Oxygen cylinder & basic medical support'
    ],
    exclusions: [
      'Pony/palki charges on trek',
      'Helicopter ticket',
      'Personal VIP pooja expenses'
    ],
    cancellationPolicy: 'Full refund 30+ days prior. 50% credit within 15–29 days.',
    badge: 'SPIRITUAL',
    startingPoint: 'Haridwar',
    shortDescription: 'Sacred Himalayan pilgrimage to Kedarnath Dham at 3,583m.',
    overview: 'A spiritually profound journey across the rugged Garhwal Himalayas to one of the twelve sacred Jyotirlingas, guided with reverence and modern safety.'
  },
  {
    slug: 'kanatal-camp',
    name: 'Kanatal Stargazing Retreat',
    destinationSlugs: ['kanatal', 'mussoorie'],
    primaryDestinationSlug: 'kanatal',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=900&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&h=600&fit=crop&auto=format'
    ],
    price: 5999,
    duration: '2 Days / 1 Night',
    durationDays: 2,
    durationNights: 1,
    category: 'weekend',
    difficulty: 'easy',
    highlights: [
      'Bortle Class 2 night sky stargazing',
      'Telescope sessions with astronomy expert',
      'Apple orchard walk & cider tasting',
      'Forest sunset trek to Surkanda Devi'
    ],
    inclusions: [
      '1 night geodesic dome glamping',
      'Organic Pahadi dinner & breakfast',
      'High-power telescope session',
      'Guided Surkanda Devi ridge walk'
    ],
    exclusions: [
      'Transportation to Kanatal',
      'Adventure activities inside camp'
    ],
    cancellationPolicy: 'Full refund 5+ days prior.',
    badge: 'WEEKEND GETAWAY',
    startingPoint: 'Dehradun',
    shortDescription: 'Bortle Class 2 stargazing retreat with telescope sessions and geodesic domes.',
    overview: 'Escape the city glare to serene high-ridge apple orchards with deep dark skies, brilliant star clusters, and crackling campfires.'
  },
  {
    slug: 'chakrata-nature',
    name: 'Chakrata Secret Forest Trail',
    destinationSlugs: ['chakrata'],
    primaryDestinationSlug: 'chakrata',
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&h=800&fit=crop&auto=format',
    gallery: [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&h=600&fit=crop&auto=format'
    ],
    price: 8499,
    duration: '3 Days / 2 Nights',
    durationDays: 3,
    durationNights: 2,
    category: 'nature',
    difficulty: 'easy',
    highlights: [
      'Tiger Falls 312 ft waterfall swim',
      'Ancient deodar forest heritage trail',
      'Chilmiri neck sunset panoramic point',
      'Budher caves limestone exploration'
    ],
    inclusions: [
      '2 nights heritage stone cottage stay',
      'All organic home-cooked meals',
      'Local naturalist guide',
      'Tiger Falls excursion & cave exploration permit'
    ],
    exclusions: [
      'Transport to Chakrata',
      'Personal nature photography gear'
    ],
    cancellationPolicy: 'Full refund 7+ days prior.',
    badge: 'OFFBEAT',
    startingPoint: 'Dehradun',
    shortDescription: 'Uncharted trails through dense deodar forests, Tiger Falls, and ancient limestone caves.',
    overview: 'A secluded sanctuary sheltered by towering deodars. Journey along undisturbed forest paths to thundering waterfalls and panoramic Himalayan horizons.'
  }
];

const INITIAL_INSTANCES_SEED = [
  // Completed
  { tripSlug: 'chopta-trek', startsOn: '2026-07-15', displayDate: '15 July 2026', price: 9999, spotsTotal: 12, completedAt: '2026-07-19T00:00:00Z', notes: 'Perfect weather. All 12 participants completed Chandrashila summit.' },
  { tripSlug: 'rishikesh-rafting', startsOn: '2026-08-10', displayDate: '10 August 2026', price: 7499, spotsTotal: 10, completedAt: '2026-08-13T00:00:00Z', notes: 'Great rapids season. Group loved the glamping setup.' },
  { tripSlug: 'kanatal-camp', startsOn: '2026-08-25', displayDate: '25 August 2026', price: 5999, spotsTotal: 8, completedAt: '2026-08-27T00:00:00Z', notes: 'Crystal clear night sky. Excellent stargazing conditions.' },
  { tripSlug: 'chakrata-nature', startsOn: '2026-09-05', displayDate: '5 September 2026', price: 8499, spotsTotal: 10, completedAt: '2026-09-08T00:00:00Z', notes: 'Waterfall swim and cave exploration went smoothly.' },

  // Upcoming
  { tripSlug: 'chopta-trek', startsOn: '2026-10-12', displayDate: '12 October 2026', price: 9999, spotsTotal: 12, notes: 'Peak autumn colors.' },
  { tripSlug: 'kedarnath-yatra', startsOn: '2026-10-20', displayDate: '20 October 2026', price: 14999, spotsTotal: 8, notes: 'Last batch before temple closes for season.' },
  { tripSlug: 'auli-ski', startsOn: '2026-11-15', displayDate: '15 November 2026', price: 12499, spotsTotal: 10, notes: 'Fresh early snow season.' },
  { tripSlug: 'rishikesh-rafting', startsOn: '2026-10-05', displayDate: '5 October 2026', price: 7499, spotsTotal: 10, notes: 'Post-monsoon crisp waters.' },
  { tripSlug: 'kanatal-camp', startsOn: '2026-10-28', displayDate: '28 October 2026', price: 5999, spotsTotal: 8, notes: 'Diwali special stargazing night.' },
  { tripSlug: 'chakrata-nature', startsOn: '2026-11-08', displayDate: '8 November 2026', price: 8499, spotsTotal: 10, notes: 'Winter foliage walk.' }
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    console.log('Seeding trips into Neon PostgreSQL...');

    // 1. Fetch existing destinations map (slug -> id)
    const destRes = await client.query('SELECT id, slug, name FROM destinations');
    const destMap = new Map();
    for (const d of destRes.rows) {
      destMap.set(d.slug, d.id);
    }
    console.log(`Found ${destMap.size} destinations in database.`);

    const tripIdMap = new Map();

    for (const trip of INITIAL_TRIPS_SEED) {
      // Upsert trip
      const existingTrip = await client.query('SELECT id FROM trips WHERE slug = $1', [trip.slug]);
      let tripId;

      if (existingTrip.rows.length > 0) {
        tripId = existingTrip.rows[0].id;
        console.log(`Updating trip ${trip.slug} (${tripId})...`);
        await client.query(`
          UPDATE trips SET
            name = $1,
            short_description = $2,
            overview = $3,
            duration_label = $4,
            duration_days = $5,
            duration_nights = $6,
            category = $7,
            difficulty = $8,
            price_from_paise = $9,
            currency = 'INR',
            cancellation_policy = $10,
            badge = $11,
            starting_point = $12,
            status = 'active',
            cover_image_url = $13,
            gallery_image_urls = $14,
            updated_at = now()
          WHERE id = $15
        `, [
          trip.name,
          trip.shortDescription,
          trip.overview,
          trip.duration,
          trip.durationDays,
          trip.durationNights,
          trip.category,
          trip.difficulty,
          trip.price * 100,
          trip.cancellationPolicy,
          trip.badge,
          trip.startingPoint,
          trip.image,
          trip.gallery,
          tripId
        ]);
      } else {
        console.log(`Inserting trip ${trip.slug}...`);
        const insRes = await client.query(`
          INSERT INTO trips (
            slug, name, short_description, overview,
            duration_label, duration_days, duration_nights,
            category, difficulty, price_from_paise, currency,
            cancellation_policy, badge, starting_point,
            status, cover_image_url, gallery_image_urls
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            $8, $9, $10, 'INR',
            $11, $12, $13,
            'active', $14, $15
          ) RETURNING id
        `, [
          trip.slug,
          trip.name,
          trip.shortDescription,
          trip.overview,
          trip.duration,
          trip.durationDays,
          trip.durationNights,
          trip.category,
          trip.difficulty,
          trip.price * 100,
          trip.cancellationPolicy,
          trip.badge,
          trip.startingPoint,
          trip.image,
          trip.gallery
        ]);
        tripId = insRes.rows[0].id;
      }

      tripIdMap.set(trip.slug, tripId);

      // Link destinations (M:N)
      await client.query('DELETE FROM trip_destinations WHERE trip_id = $1', [tripId]);
      for (let i = 0; i < trip.destinationSlugs.length; i++) {
        const dSlug = trip.destinationSlugs[i];
        const destId = destMap.get(dSlug);
        if (destId) {
          const isPrimary = dSlug === trip.primaryDestinationSlug;
          await client.query(`
            INSERT INTO trip_destinations (trip_id, destination_id, is_primary, sort_order)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (trip_id, destination_id) DO UPDATE SET
              is_primary = EXCLUDED.is_primary,
              sort_order = EXCLUDED.sort_order
          `, [tripId, destId, isPrimary, i]);
        }
      }

      // Link highlights
      await client.query('DELETE FROM trip_highlights WHERE trip_id = $1', [tripId]);
      for (let i = 0; i < trip.highlights.length; i++) {
        await client.query(`
          INSERT INTO trip_highlights (trip_id, text, sort_order)
          VALUES ($1, $2, $3)
        `, [tripId, trip.highlights[i], i]);
      }

      // Link inclusions
      await client.query('DELETE FROM trip_inclusions WHERE trip_id = $1', [tripId]);
      for (let i = 0; i < trip.inclusions.length; i++) {
        await client.query(`
          INSERT INTO trip_inclusions (trip_id, text, sort_order)
          VALUES ($1, $2, $3)
        `, [tripId, trip.inclusions[i], i]);
      }

      // Link exclusions
      await client.query('DELETE FROM trip_exclusions WHERE trip_id = $1', [tripId]);
      for (let i = 0; i < trip.exclusions.length; i++) {
        await client.query(`
          INSERT INTO trip_exclusions (trip_id, text, sort_order)
          VALUES ($1, $2, $3)
        `, [tripId, trip.exclusions[i], i]);
      }
    }

    // 2. Insert departures (trip_instances)
    console.log('Seeding departures (trip_instances)...');
    for (const inst of INITIAL_INSTANCES_SEED) {
      const tripId = tripIdMap.get(inst.tripSlug);
      if (!tripId) continue;

      const existingInst = await client.query(
        'SELECT id FROM trip_instances WHERE trip_id = $1 AND starts_on = $2',
        [tripId, inst.startsOn]
      );

      if (existingInst.rows.length === 0) {
        await client.query(`
          INSERT INTO trip_instances (
            trip_id, starts_on, display_date,
            price_paise, currency, spots_total,
            notes, completed_at
          ) VALUES (
            $1, $2, $3,
            $4, 'INR', $5,
            $6, $7
          )
        `, [
          tripId,
          inst.startsOn,
          inst.displayDate,
          inst.price * 100,
          inst.spotsTotal,
          inst.notes || null,
          inst.completedAt || null
        ]);
      }
    }

    console.log('Successfully seeded trips and departures!');
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
