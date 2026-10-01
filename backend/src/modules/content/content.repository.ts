import { query, withTransaction } from "../../db/postgres";
import { 
  HomepageConfigFull, 
  HomepageConfig, 
  HomepageSlide, 
  WhyUsPoint, 
  FaqItem, 
  ContentPage 
} from "./content.types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const seedDefaultHomepageConfig = async (): Promise<void> => {
  const destRows = await query<{ id: string; slug: string }>(`SELECT id, slug FROM destinations LIMIT 5`);
  const destIds = destRows.rows.map(r => r.id);

  const revRows = await query<{ id: string }>(`SELECT id FROM reviews WHERE status = 'published' LIMIT 3`);
  const revIds = revRows.rows.map(r => r.id);

  const tripRows = await query<{ id: string }>(`SELECT id FROM trips WHERE status = 'published' OR status = 'active' LIMIT 4`);
  const tripIds = tripRows.rows.map(r => r.id);

  const slides: any[] = [];
  for (const [i, tripId] of tripIds.entries()) {
    slides.push({
      slideType: "trip",
      tripId: tripId,
      sortOrder: i,
      isActive: true
    });
  }

  await upsertHomepageConfig({
    whyUsTitle: "The Mindful Adventure Movement",
    whyUsDescription: "We started Yatrivo to bridge the gap between heavy commercial bus tours and risky, unguided expeditions. Our groups are small, food is sourced from local farms, and trails are chosen for deep natural connection.",
    status: "published",
    slides,
    featuredDestinationIds: destIds.slice(0, 3),
    featuredReviewIds: revIds.slice(0, 3),
    whyUsPoints: [
      { icon: "🗺️", title: "Handpicked Paths", description: "Carefully charted trails away from tourist crowds.", sortOrder: 0 },
      { icon: "👥", title: "Youthful Vibe", description: "Small groups, like-minded active adventurers.", sortOrder: 1 },
      { icon: "🏔️", title: "Himalayan Trust", description: "Certified local guides & sustainable execution.", sortOrder: 2 }
    ]
  });
};

export const getHomepageConfig = async (): Promise<HomepageConfigFull | null> => {
  let configResult = await query<HomepageConfig>(
    `SELECT * FROM homepage_config LIMIT 1`
  );
  
  if (configResult.rows.length === 0) {
    try {
      await seedDefaultHomepageConfig();
      configResult = await query<HomepageConfig>(
        `SELECT * FROM homepage_config LIMIT 1`
      );
    } catch (e) {
      console.warn("Could not seed default homepage config:", e);
    }
  }
  
  if (configResult.rows.length === 0) return null;
  
  const config = configResult.rows[0];
  
  const slidesResult = await query<HomepageSlide & { trip_cover_url?: string, static_public_url?: string, static_external_url?: string }>(
    `SELECT 
       hs.*,
       COALESCE(trip_cover_media.public_url, trip_cover_media.external_url, t.cover_image_url) as trip_cover_url,
       m.public_url as static_public_url,
       m.external_url as static_external_url
     FROM homepage_slides hs
     LEFT JOIN trips t ON (hs.trip_id = t.id OR (hs.trip_id IS NULL AND hs.trip_instance_id IS NOT NULL AND t.id = (SELECT ti.trip_id FROM trip_instances ti WHERE ti.id = hs.trip_instance_id)))
     LEFT JOIN media_assets trip_cover_media ON t.cover_media_id = trip_cover_media.id
     LEFT JOIN media_assets m ON hs.media_id = m.id
     WHERE hs.homepage_config_id = $1
     ORDER BY hs.sort_order ASC`,
    [config.id]
  );
  
  const featuredDestinationsResult = await query<{ destination_id: string }>(
    `SELECT destination_id FROM homepage_featured_destinations WHERE homepage_config_id = $1 ORDER BY sort_order ASC`,
    [config.id]
  );
  
  const featuredReviewsResult = await query<{ review_id: string }>(
    `SELECT review_id FROM homepage_featured_reviews WHERE homepage_config_id = $1 ORDER BY sort_order ASC`,
    [config.id]
  );
  
  const whyUsPointsResult = await query<WhyUsPoint>(
    `SELECT * FROM homepage_why_us_points WHERE homepage_config_id = $1 ORDER BY sort_order ASC`,
    [config.id]
  );
  
  const destinationIds = featuredDestinationsResult.rows.map(r => r.destination_id);
  const reviewIds = featuredReviewsResult.rows.map(r => r.review_id);

  return {
    ...config,
    heroTitle: config.hero_title,
    heroSubtitle: config.hero_subtitle,
    whyUsTitle: config.why_us_title,
    whyUsDescription: config.why_us_description,
    slides: slidesResult.rows.map(s => {
      let imgUrl: string | undefined = undefined;
      if (s.slide_type === 'trip') {
        imgUrl = s.trip_cover_url || undefined;
      } else {
        imgUrl = s.image_url || s.static_public_url || s.static_external_url || undefined;
      }
      return {
        id: s.id,
        homepage_config_id: s.homepage_config_id,
        slide_type: s.slide_type,
        slideType: s.slide_type,
        trip_id: s.trip_id,
        tripId: s.trip_id,
        trip_instance_id: s.trip_instance_id,
        tripInstanceId: s.trip_instance_id,
        media_id: s.media_id,
        mediaId: s.media_id,
        image_url: s.image_url,
        imageUrl: imgUrl,
        title_override: s.title_override,
        titleOverride: s.title_override,
        subtitle_override: s.subtitle_override,
        subtitleOverride: s.subtitle_override,
        sort_order: s.sort_order,
        sortOrder: s.sort_order,
        is_active: s.is_active,
        isActive: s.is_active
      };
    }),
    featuredDestinations: destinationIds,
    featuredDestinationIds: destinationIds,
    featuredReviews: reviewIds,
    featuredReviewIds: reviewIds,
    whyUsPoints: whyUsPointsResult.rows.map(p => ({
      ...p,
      sortOrder: p.sort_order
    }))
  };
};

export const upsertHomepageConfig = async (data: Record<string, any>): Promise<HomepageConfigFull | null> => {
  return await withTransaction(async (client) => {
    let configId = data.id;
    if (!configId) {
      const existing = await client.query(`SELECT id FROM homepage_config LIMIT 1`);
      if (existing.rows.length > 0) {
        configId = existing.rows[0].id;
      }
    }

    const heroTitle = data.heroTitle ?? data.hero_title ?? null;
    const heroSubtitle = data.heroSubtitle ?? data.hero_subtitle ?? null;
    const whyUsTitle = data.whyUsTitle ?? data.why_us_title ?? "The Mindful Adventure Movement";
    const whyUsDesc = data.whyUsDescription ?? data.why_us_description ?? data.whyUsDesc ?? "We started Yatrivo to bridge the gap between heavy commercial bus tours and risky, unguided expeditions.";
    const status = data.status ?? "published";
    
    if (configId) {
      await client.query(
        `UPDATE homepage_config 
         SET hero_title = COALESCE($1, hero_title), 
             hero_subtitle = COALESCE($2, hero_subtitle), 
             why_us_title = COALESCE($3, why_us_title), 
             why_us_description = COALESCE($4, why_us_description), 
             status = COALESCE($5, status),
             updated_at = NOW()
         WHERE id = $6`,
        [heroTitle, heroSubtitle, whyUsTitle, whyUsDesc, status, configId]
      );
    } else {
      const res = await client.query<HomepageConfig>(
        `INSERT INTO homepage_config (hero_title, hero_subtitle, why_us_title, why_us_description, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [heroTitle, heroSubtitle, whyUsTitle, whyUsDesc, status]
      );
      configId = res.rows[0].id;
    }
    
    const incomingSlides = data.slides;
    if (Array.isArray(incomingSlides)) {
      await client.query(`DELETE FROM homepage_slides WHERE homepage_config_id = $1`, [configId]);
      for (const [index, slide] of incomingSlides.entries()) {
        let slideType = slide.slideType ?? slide.slide_type ?? "static";
        const rawTripId = slide.tripId ?? slide.trip_id;
        const rawTripInstId = slide.tripInstanceId ?? slide.trip_instance_id;
        let tripId: string | null = null;
        let tripInstId: string | null = null;

        if (typeof rawTripId === "string" && rawTripId.trim().length > 0) {
          const val = rawTripId.trim();
          if (UUID_REGEX.test(val)) {
            const check = await client.query(`SELECT id FROM trips WHERE id = $1`, [val]);
            if (check.rows.length > 0) {
              tripId = check.rows[0].id;
            } else {
              const instCheck = await client.query(`SELECT id, trip_id FROM trip_instances WHERE id = $1`, [val]);
              if (instCheck.rows.length > 0) {
                tripInstId = instCheck.rows[0].id;
                tripId = instCheck.rows[0].trip_id;
              }
            }
          } else {
            const check = await client.query(`SELECT id FROM trips WHERE slug = $1`, [val]);
            if (check.rows.length > 0) tripId = check.rows[0].id;
          }
        }

        if (!tripId && typeof rawTripInstId === "string" && rawTripInstId.trim().length > 0) {
          const val = rawTripInstId.trim();
          if (UUID_REGEX.test(val)) {
            const tripCheck = await client.query(`SELECT id FROM trips WHERE id = $1`, [val]);
            if (tripCheck.rows.length > 0) {
              tripId = tripCheck.rows[0].id;
            } else {
              const check = await client.query(`SELECT id, trip_id FROM trip_instances WHERE id = $1`, [val]);
              if (check.rows.length > 0) {
                tripInstId = check.rows[0].id;
                tripId = check.rows[0].trip_id;
              }
            }
          } else {
            const check = await client.query(
              `SELECT ti.id, ti.trip_id FROM trip_instances ti 
               JOIN trips t ON ti.trip_id = t.id 
               WHERE t.slug = $1 OR ('inst-' || t.slug || '-oct') = $1 OR ('inst-' || t.slug || '-nov') = $1
               ORDER BY ti.starts_on ASC LIMIT 1`,
              [val]
            );
            if (check.rows.length > 0) {
              tripInstId = check.rows[0].id;
              tripId = check.rows[0].trip_id;
            } else {
              const tripCheck = await client.query(`SELECT id FROM trips WHERE slug = $1`, [val]);
              if (tripCheck.rows.length > 0) tripId = tripCheck.rows[0].id;
            }
          }
        }

        const rawMediaId = slide.mediaId ?? slide.media_id;
        let mediaId: string | null = null;
        if (typeof rawMediaId === "string" && rawMediaId.trim().length > 0) {
          const val = rawMediaId.trim();
          if (UUID_REGEX.test(val)) {
            const check = await client.query(`SELECT id FROM media_assets WHERE id = $1`, [val]);
            if (check.rows.length > 0) mediaId = check.rows[0].id;
          }
        }

        const imageUrl = slide.imageUrl ?? slide.image_url ?? null;
        const titleOverride = slide.titleOverride ?? slide.title_override ?? slide.title ?? null;
        const subtitleOverride = slide.subtitleOverride ?? slide.subtitle_override ?? slide.subtitle ?? null;
        const isActive = slide.isActive ?? slide.is_active ?? true;

        if (slideType === "trip" && !tripId && !tripInstId && imageUrl) {
          slideType = "static";
        }

        await client.query(
          `INSERT INTO homepage_slides (homepage_config_id, slide_type, trip_id, trip_instance_id, media_id, image_url, title_override, subtitle_override, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [configId, slideType, tripId, tripInstId, mediaId, imageUrl, titleOverride, subtitleOverride, index, isActive]
        );
      }
    }
    
    const incomingDestinations = data.featuredDestinationIds ?? data.featuredDestinations;
    if (Array.isArray(incomingDestinations)) {
      await client.query(`DELETE FROM homepage_featured_destinations WHERE homepage_config_id = $1`, [configId]);
      for (const [index, rawDestId] of incomingDestinations.entries()) {
        if (typeof rawDestId === "string" && rawDestId.trim().length > 0) {
          const val = rawDestId.trim();
          let resolvedDestId: string | null = null;
          if (UUID_REGEX.test(val)) {
            const check = await client.query(`SELECT id FROM destinations WHERE id = $1`, [val]);
            if (check.rows.length > 0) resolvedDestId = check.rows[0].id;
          } else {
            const check = await client.query(`SELECT id FROM destinations WHERE slug = $1`, [val]);
            if (check.rows.length > 0) resolvedDestId = check.rows[0].id;
          }

          if (resolvedDestId) {
            await client.query(
              `INSERT INTO homepage_featured_destinations (homepage_config_id, destination_id, sort_order)
               VALUES ($1, $2, $3)
               ON CONFLICT (homepage_config_id, destination_id) DO UPDATE SET sort_order = EXCLUDED.sort_order`,
              [configId, resolvedDestId, index]
            );
          }
        }
      }
    }
    
    const incomingReviews = data.featuredReviewIds ?? data.featuredReviews;
    if (Array.isArray(incomingReviews)) {
      await client.query(`DELETE FROM homepage_featured_reviews WHERE homepage_config_id = $1`, [configId]);
      for (const [index, rawReviewId] of incomingReviews.entries()) {
        if (typeof rawReviewId === "string" && rawReviewId.trim().length > 0) {
          const val = rawReviewId.trim();
          if (UUID_REGEX.test(val)) {
            const check = await client.query(`SELECT id FROM reviews WHERE id = $1`, [val]);
            if (check.rows.length > 0) {
              await client.query(
                `INSERT INTO homepage_featured_reviews (homepage_config_id, review_id, sort_order)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (homepage_config_id, review_id) DO UPDATE SET sort_order = EXCLUDED.sort_order`,
                [configId, val, index]
              );
            }
          }
        }
      }
    }
    
    const incomingWhyUs = data.whyUsPoints;
    if (Array.isArray(incomingWhyUs)) {
      await client.query(`DELETE FROM homepage_why_us_points WHERE homepage_config_id = $1`, [configId]);
      for (const [index, point] of incomingWhyUs.entries()) {
        const title = point.title ?? "";
        const desc = point.description ?? point.desc ?? null;
        const icon = point.icon ?? null;
        await client.query(
          `INSERT INTO homepage_why_us_points (homepage_config_id, icon, title, description, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [configId, icon, title, desc, index]
        );
      }
    }
    
    return null;
  });
};

export const listFaqs = async (includeUnpublished = false): Promise<FaqItem[]> => {
  const queryStr = includeUnpublished 
    ? `SELECT * FROM faqs ORDER BY sort_order ASC, created_at DESC`
    : `SELECT * FROM faqs WHERE is_published = true ORDER BY sort_order ASC, created_at DESC`;
  const result = await query<FaqItem>(queryStr);
  return result.rows.map(r => ({
    ...r,
    sortOrder: r.sort_order,
    isPublished: r.is_published
  }));
};

export const createFaq = async (data: Partial<FaqItem>): Promise<FaqItem> => {
  const result = await query<FaqItem>(
    `INSERT INTO faqs (question, answer, category, sort_order, is_published, created_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.question, data.answer, data.category, data.sort_order ?? data.sortOrder ?? 0, data.is_published ?? data.isPublished ?? true, data.created_by_user_id]
  );
  const row = result.rows[0];
  return {
    ...row,
    sortOrder: row.sort_order,
    isPublished: row.is_published
  };
};

export const updateFaq = async (id: string, data: Partial<FaqItem>): Promise<FaqItem | null> => {
  const fields = [];
  const values = [];
  let index = 1;
  
  if (data.question !== undefined) { fields.push(`question = $${index++}`); values.push(data.question); }
  if (data.answer !== undefined) { fields.push(`answer = $${index++}`); values.push(data.answer); }
  if (data.category !== undefined) { fields.push(`category = $${index++}`); values.push(data.category); }
  const sortOrder = data.sort_order ?? data.sortOrder;
  if (sortOrder !== undefined) { fields.push(`sort_order = $${index++}`); values.push(sortOrder); }
  const isPublished = data.is_published ?? data.isPublished;
  if (isPublished !== undefined) { fields.push(`is_published = $${index++}`); values.push(isPublished); }
  if (data.updated_by_user_id !== undefined) { fields.push(`updated_by_user_id = $${index++}`); values.push(data.updated_by_user_id); }
  
  fields.push(`updated_at = NOW()`);
  
  if (fields.length === 1) { 
    const res = await query<FaqItem>(`SELECT * FROM faqs WHERE id = $1`, [id]);
    return res.rows[0] ? { ...res.rows[0], sortOrder: res.rows[0].sort_order, isPublished: res.rows[0].is_published } : null;
  }
  
  const queryStr = `UPDATE faqs SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
  values.push(id);
  
  const result = await query<FaqItem>(queryStr, values);
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    ...row,
    sortOrder: row.sort_order,
    isPublished: row.is_published
  };
};

export const deleteFaq = async (id: string): Promise<boolean> => {
  const result = await query(`DELETE FROM faqs WHERE id = $1 RETURNING id`, [id]);
  return (result.rowCount ?? 0) > 0;
};

export const reorderFaqs = async (ids: string[]): Promise<void> => {
  await withTransaction(async (client) => {
    for (let i = 0; i < ids.length; i++) {
      await client.query(`UPDATE faqs SET sort_order = $1 WHERE id = $2`, [i, ids[i]]);
    }
  });
};

export const getContentPage = async (slug: string): Promise<ContentPage | null> => {
  const result = await query<ContentPage>(`SELECT * FROM content_pages WHERE slug = $1`, [slug]);
  return result.rows[0] || null;
};

export const upsertContentPage = async (slug: string, data: Partial<ContentPage>): Promise<ContentPage> => {
  const existing = await getContentPage(slug);
  
  if (existing) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (data.title !== undefined) { fields.push(`title = $${index++}`); values.push(data.title); }
    if (data.body !== undefined) { fields.push(`body = $${index++}`); values.push(data.body); }
    if (data.status !== undefined) { fields.push(`status = $${index++}`); values.push(data.status); }
    if (data.seo_title !== undefined) { fields.push(`seo_title = $${index++}`); values.push(data.seo_title); }
    if (data.seo_description !== undefined) { fields.push(`seo_description = $${index++}`); values.push(data.seo_description); }
    if (data.published_at !== undefined) { fields.push(`published_at = $${index++}`); values.push(data.published_at); }
    
    fields.push(`updated_at = NOW()`);
    
    const queryStr = `UPDATE content_pages SET ${fields.join(', ')} WHERE slug = $${index} RETURNING *`;
    values.push(slug);
    
    const result = await query<ContentPage>(queryStr, values);
    return result.rows[0];
  } else {
    const result = await query<ContentPage>(
      `INSERT INTO content_pages (slug, title, body, status, seo_title, seo_description, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [slug, data.title || '', data.body || '', data.status || 'published', data.seo_title, data.seo_description, data.published_at || new Date()]
    );
    return result.rows[0];
  }
};

export const listContentPages = async (): Promise<ContentPage[]> => {
  const result = await query<ContentPage>(`SELECT * FROM content_pages ORDER BY title ASC`);
  return result.rows;
};
