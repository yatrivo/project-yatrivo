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
    completedPhotos: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop&auto=format",
    ],
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
    completedPhotos: [
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format",
    ],
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
    completedPhotos: [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop&auto=format",
    ],
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
    completedPhotos: [
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop&auto=format",
    ],
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

export interface Trip {
  id: string;
  name: string;
  destination: string;
  image: string;
  price: number;
  duration: string;
  category: CategoryValue;
  difficulty: "Easy" | "Moderate" | "Challenging" | "Strenuous";
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  cancellationPolicy: string;
  badge: string;
}

export const INITIAL_TRIPS: Trip[] = [
  {
    id: "chopta-trek",
    name: "Chopta Tungnath Adventure",
    destination: "chopta",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop&auto=format",
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
    name: "Auli Snow & Ski Collective",
    destination: "auli",
    image: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&h=400&fit=crop&auto=format",
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
    name: "Rishikesh Escape & Rapids",
    destination: "rishikesh",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&auto=format",
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
    name: "Kedarnath Pilgrimage Trek",
    destination: "kedarnath",
    image: "https://images.unsplash.com/photo-1580281657702-257584239a55?w=600&h=400&fit=crop&auto=format",
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
    name: "Kanatal Stargazing Camp",
    destination: "kanatal",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop&auto=format",
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
    name: "Chakrata Cascade & Woods",
    destination: "chakrata",
    image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop&auto=format",
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
