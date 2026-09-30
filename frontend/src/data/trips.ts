import type { CategoryValue } from "./categories";

export interface TripInstance {
  id: string;
  tripId: string; // references a Trip.id
  date: string; // "2026-10-20"
  displayDate: string; // "20 October 2026"
  price: number;
  spotsTotal: number;
  spotsLeft: number;
  status: "upcoming" | "completed" | "cancelled";
  completedPhotos?: string[]; // Unsplash URLs for completed trips
  notes?: string;
}

export const INITIAL_TRIP_INSTANCES: TripInstance[] = [
  // Completed instances (Jul/Aug/Sep 2026)
  {
    id: "inst-chopta-jul",
    tripId: "chopta-trek",
    date: "2026-07-15",
    displayDate: "15 July 2026",
    price: 9999,
    spotsTotal: 12,
    spotsLeft: 0,
    status: "completed",
    completedPhotos: [],
    notes: "Perfect weather. All 12 participants completed Chandrashila summit.",
  },
  {
    id: "inst-rishikesh-aug",
    tripId: "rishikesh-rafting",
    date: "2026-08-10",
    displayDate: "10 August 2026",
    price: 7499,
    spotsTotal: 10,
    spotsLeft: 0,
    status: "completed",
    completedPhotos: [],
    notes: "Great rapids season. Group loved the glamping setup.",
  },
  {
    id: "inst-kanatal-aug",
    tripId: "kanatal-camp",
    date: "2026-08-25",
    displayDate: "25 August 2026",
    price: 5999,
    spotsTotal: 8,
    spotsLeft: 0,
    status: "completed",
    completedPhotos: [],
    notes: "Crystal clear night sky. Excellent stargazing conditions.",
  },
  {
    id: "inst-chakrata-sep",
    tripId: "chakrata-nature",
    date: "2026-09-05",
    displayDate: "5 September 2026",
    price: 8499,
    spotsTotal: 10,
    spotsLeft: 0,
    status: "completed",
    completedPhotos: [],
  },
  // Upcoming instances (Oct/Nov 2026)
  {
    id: "inst-chopta-oct",
    tripId: "chopta-trek",
    date: "2026-10-12",
    displayDate: "12 October 2026",
    price: 9999,
    spotsTotal: 12,
    spotsLeft: 5,
    status: "upcoming",
  },
  {
    id: "inst-kedarnath-oct",
    tripId: "kedarnath-yatra",
    date: "2026-10-20",
    displayDate: "20 October 2026",
    price: 14999,
    spotsTotal: 8,
    spotsLeft: 3,
    status: "upcoming",
    notes: "Last batch before temple closes for season.",
  },
  {
    id: "inst-auli-nov",
    tripId: "auli-ski",
    date: "2026-11-15",
    displayDate: "15 November 2026",
    price: 12499,
    spotsTotal: 10,
    spotsLeft: 7,
    status: "upcoming",
  },
  {
    id: "inst-rishikesh-oct",
    tripId: "rishikesh-rafting",
    date: "2026-10-05",
    displayDate: "5 October 2026",
    price: 7499,
    spotsTotal: 10,
    spotsLeft: 2,
    status: "upcoming",
  },
  {
    id: "inst-kanatal-oct",
    tripId: "kanatal-camp",
    date: "2026-10-28",
    displayDate: "28 October 2026",
    price: 5999,
    spotsTotal: 8,
    spotsLeft: 6,
    status: "upcoming",
  },
  {
    id: "inst-chakrata-nov",
    tripId: "chakrata-nature",
    date: "2026-11-08",
    displayDate: "8 November 2026",
    price: 8499,
    spotsTotal: 10,
    spotsLeft: 9,
    status: "upcoming",
  },
];

export interface TripDestination {
  id: string;
  name: string;
  slug: string;
  image?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface TripHighlightCard {
  icon: string;
  label: string;
  value: string;
}

export interface TripFaqItem {
  question: string;
  answer: string;
}

export interface Trip {
  id: string;
  slug?: string;
  name: string;
  destination: string;
  destinationId?: string;
  destinations?: TripDestination[];
  image: string; // Single cover image
  coverMediaId?: string | null;
  gallery?: string[]; // Separate gallery images
  price: number;
  duration: string;
  category: CategoryValue;
  difficulty: "Easy" | "Moderate" | "Challenging" | "Strenuous";
  highlights: (TripHighlightCard | string)[];
  faqs?: TripFaqItem[];
  inclusions: string[];
  exclusions: string[];
  cancellationPolicy: string;
  badge: string;
  startingPoint?: string;
  shortDescription?: string;
  overview?: string;
  departures?: TripInstance[];
  upcomingDeparturesCount?: number;
  status?: "active" | "archived" | "draft" | "published";
}

export const INITIAL_TRIPS: Trip[] = [
  {
    id: "chopta-trek",
    slug: "chopta-trek",
    name: "Chopta Tungnath Adventure",
    destination: "chopta",
    destinations: [
      { id: "chopta", name: "Chopta Valley", slug: "chopta", isPrimary: true, image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/7e7801b6-4b1e-4e43-a6ce-34eb070fcfcd-1513419766-chandra-jpg.jpg" },
      { id: "rishikesh", name: "Rishikesh", slug: "rishikesh", isPrimary: false, image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/22a1874c-a717-4dab-a82a-48380b2b7ec3-rishikesh.jpg" }
    ],
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/7e7801b6-4b1e-4e43-a6ce-34eb070fcfcd-1513419766-chandra-jpg.jpg",
    gallery: [],
    price: 9999,
    duration: "4 Days / 3 Nights",
    category: "trekking",
    difficulty: "Moderate",
    highlights: [
      "Trek to highest Shiva temple in the world",
      "Chandrashila Summit at 13,123 ft",
      "Rhododendron forest trails in bloom",
      "Stargazing from alpine meadows",
    ],
    inclusions: [
      "3 nights accommodation in forest camps",
      "All meals (breakfast, lunch, dinner)",
      "Certified mountain guide",
      "Trekking equipment",
      "First aid & safety gear",
    ],
    exclusions: [
      "Personal travel insurance",
      "Transportation to/from Rishikesh",
      "Alcoholic beverages",
      "Personal expenses",
    ],
    cancellationPolicy:
      "Full refund if cancelled 15+ days before departure. 50% refund for 7–14 days. No refund under 7 days.",
    badge: "BESTSELLER",
  },
  {
    id: "auli-ski",
    slug: "auli-ski",
    name: "Auli Snow & Ski Collective",
    destination: "auli",
    destinations: [
      { id: "auli", name: "Auli Slopes", slug: "auli", isPrimary: true, image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/425f8f66-3c49-4214-8a0c-77535f638cc7-sunset-view-from-lal-tibba-in-mussoorie-.jpg" }
    ],
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/425f8f66-3c49-4214-8a0c-77535f638cc7-sunset-view-from-lal-tibba-in-mussoorie-.jpg",
    gallery: [],
    price: 12499,
    duration: "5 Days / 4 Nights",
    category: "adventure",
    difficulty: "Moderate",
    highlights: [
      "Certified skiing on India's best slopes",
      "Cable car rides to 3,010 m",
      "Views of Nanda Devi from ski runs",
      "Hinoki wood cabin stays",
    ],
    inclusions: [
      "4 nights in ski lodge",
      "Daily breakfast and dinner",
      "Ski equipment rental",
      "2 days certified ski instruction",
      "Cable car passes",
    ],
    exclusions: [
      "Flights or bus to Joshimath",
      "Personal ski clothing",
      "Travel insurance",
      "Lunch & beverages",
    ],
    cancellationPolicy:
      "Full refund if cancelled 20+ days before. 50% refund for 10–19 days. No refund under 10 days.",
    badge: "SKI SEASON",
  },
  {
    id: "rishikesh-rafting",
    slug: "rishikesh-rafting",
    name: "Rishikesh Escape & Rapids",
    destination: "rishikesh",
    destinations: [
      { id: "rishikesh", name: "Rishikesh", slug: "rishikesh", isPrimary: true, image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/22a1874c-a717-4dab-a82a-48380b2b7ec3-rishikesh.jpg" }
    ],
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/22a1874c-a717-4dab-a82a-48380b2b7ec3-rishikesh.jpg",
    gallery: [],
    price: 7499,
    duration: "3 Days / 2 Nights",
    category: "weekend",
    difficulty: "Easy",
    highlights: [
      "Grade 3–5 white water rafting on the Ganga",
      "Riverside luxury glamping",
      "Evening Ganga Aarti ceremony",
      "Sunrise yoga session",
    ],
    inclusions: [
      "2 nights glamping by the river",
      "All meals included",
      "Rafting with certified guides",
      "Safety equipment",
      "Yoga session",
    ],
    exclusions: [
      "Personal travel insurance",
      "Transport to Rishikesh",
      "Bungee or cliff jump (optional add-on)",
      "Personal expenses",
    ],
    cancellationPolicy:
      "Full refund if cancelled 10+ days before. 50% for 5–9 days. No refund under 5 days.",
    badge: "WEEKEND",
  },
  {
    id: "kedarnath-yatra",
    slug: "kedarnath-yatra",
    name: "Kedarnath Pilgrimage Trek",
    destination: "kedarnath",
    destinations: [
      { id: "kedarnath", name: "Kedarnath", slug: "kedarnath", isPrimary: true, image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/fb19581e-dca3-4cdb-b122-c193099be3a1-wp6584296.jpg" },
      { id: "rishikesh", name: "Rishikesh", slug: "rishikesh", isPrimary: false, image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/22a1874c-a717-4dab-a82a-48380b2b7ec3-rishikesh.jpg" }
    ],
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/fb19581e-dca3-4cdb-b122-c193099be3a1-wp6584296.jpg",
    gallery: [],
    price: 14999,
    duration: "6 Days / 5 Nights",
    category: "spiritual",
    difficulty: "Challenging",
    highlights: [
      "Kedarnath Temple darshan at 3,583 m",
      "Vasuki Tal glacial lake side trek",
      "Luxury high-altitude tent accommodation",
      "Priority temple access with guide",
    ],
    inclusions: [
      "5 nights luxury tented camps",
      "All meals and hot water",
      "Medically certified trek guide",
      "Porters for luggage",
      "Helicopter booking assistance",
    ],
    exclusions: [
      "Helicopter fare (optional)",
      "Personal medical insurance",
      "Pony charges",
      "Temple donation",
    ],
    cancellationPolicy:
      "Full refund if cancelled 20+ days before. 50% for 10–19 days. No refund under 10 days.",
    badge: "SACRED",
  },
  {
    id: "kanatal-camp",
    slug: "kanatal-camp",
    name: "Kanatal Stargazing Camp",
    destination: "kanatal",
    destinations: [
      { id: "kanatal", name: "Kanatal", slug: "kanatal", isPrimary: true, image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/c0ad513a-b215-44a3-b465-6801cbc40fb1-1548836776-shutterstock-1058770418.jpg" },
      { id: "mussoorie", name: "Mussoorie", slug: "mussoorie", isPrimary: false, image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/425f8f66-3c49-4214-8a0c-77535f638cc7-sunset-view-from-lal-tibba-in-mussoorie-.jpg" }
    ],
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/c0ad513a-b215-44a3-b465-6801cbc40fb1-1548836776-shutterstock-1058770418.jpg",
    gallery: [],
    price: 5999,
    duration: "3 Days / 2 Nights",
    category: "nature",
    difficulty: "Easy",
    highlights: [
      "Dark sky stargazing with telescope",
      "Apple orchard guided walk",
      "Forest bonfire evenings",
      "Sunrise over the Himalayan range",
    ],
    inclusions: [
      "2 nights forest camp stay",
      "All meals (home-cooked local food)",
      "Stargazing session with telescope",
      "Guided nature walk",
      "Bonfire evening",
    ],
    exclusions: [
      "Transport from Dehradun",
      "Personal expenses",
      "Alcoholic beverages",
      "Travel insurance",
    ],
    cancellationPolicy:
      "Full refund if cancelled 7+ days before. 50% for 3–6 days. No refund under 3 days.",
    badge: "OFFBEAT",
  },
  {
    id: "chakrata-nature",
    slug: "chakrata-nature",
    name: "Chakrata Cascade & Woods",
    destination: "chakrata",
    destinations: [
      { id: "chakrata", name: "Chakrata", slug: "chakrata", isPrimary: true, image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/e230812f-734d-44d8-9967-fc51d5dd4a9e-maxresdefault.jpg" }
    ],
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/e230812f-734d-44d8-9967-fc51d5dd4a9e-maxresdefault.jpg",
    gallery: [],
    price: 8499,
    duration: "4 Days / 3 Nights",
    category: "nature",
    difficulty: "Moderate",
    highlights: [
      "Tiger Falls (312 ft) trek",
      "Deoban dense forest trails",
      "Ancient Mahasu Devta temple",
      "Pure unpolluted night sky",
    ],
    inclusions: [
      "3 nights pine-wood camp",
      "All meals",
      "Local naturalist guide",
      "Forest trek equipment",
      "Entry fees included",
    ],
    exclusions: [
      "Personal travel insurance",
      "Transport to Chakrata",
      "Personal expenses",
      "Beverages beyond meals",
    ],
    cancellationPolicy:
      "Full refund if cancelled 10+ days before. 50% for 5–9 days. No refund under 5 days.",
    badge: "OFFBEAT",
  },
];
