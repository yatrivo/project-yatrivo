export interface HomepageConfig {
  id?: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  why_us_title: string | null;
  why_us_description: string | null;
  status: string | null;
}

export interface HomepageSlide {
  id?: string;
  homepage_config_id?: string;
  slide_type: 'trip' | 'static';
  slideType?: 'trip' | 'static';
  trip_instance_id: string | null;
  tripInstanceId?: string | null;
  media_id: string | null;
  mediaId?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  title_override: string | null;
  titleOverride?: string | null;
  subtitle_override: string | null;
  subtitleOverride?: string | null;
  sort_order: number;
  sortOrder?: number;
  is_active: boolean;
  isActive?: boolean;
}

export interface HomepageFeaturedDestination {
  id?: string;
  homepage_config_id?: string;
  destination_id: string;
  sort_order: number;
}

export interface HomepageFeaturedReview {
  id?: string;
  homepage_config_id?: string;
  review_id: string;
  sort_order: number;
}

export interface WhyUsPoint {
  id?: string;
  homepage_config_id?: string;
  icon: string | null;
  title: string;
  description: string | null;
  sort_order: number;
  sortOrder?: number;
}

export interface HomepageConfigFull extends HomepageConfig {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  whyUsTitle?: string | null;
  whyUsDescription?: string | null;
  slides: HomepageSlide[];
  featuredDestinations: string[];
  featuredDestinationIds: string[];
  featuredReviews: string[];
  featuredReviewIds: string[];
  whyUsPoints: WhyUsPoint[];
}

export interface FaqItem {
  id?: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  sortOrder?: number;
  is_published: boolean;
  isPublished?: boolean;
  created_at?: Date;
  updated_at?: Date;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
}

export interface ContentPage {
  id?: string;
  slug: string;
  title: string;
  body: string | null;
  status: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
