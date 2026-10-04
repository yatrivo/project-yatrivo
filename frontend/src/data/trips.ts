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

export const INITIAL_TRIP_INSTANCES: TripInstance[] = [];


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

export interface TripItineraryDay {
  dayNumber?: number;
  title: string;
  description: string;
  meals?: string | null;
  stay?: string | null;
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
  itinerary?: TripItineraryDay[];
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
    itinerary: [
      { dayNumber: 1, title: "Dehradun to Chopta Basecamp", description: "Scenic mountain drive via Devprayag where Alaknanda meets Bhagirathi. Arrive at our pine-wood meadow cabins. Welcome dinner with local Pahadi cuisine. Evening orientation walk." },
      { dayNumber: 2, title: "Trek to Tungnath Temple & Summit", description: "Mindful morning ascent through dense rhododendron forests to the ancient Tungnath shrine (3,680m), pushing to Chandrashila peak (4,130m) for a 360° panoramic view of Nanda Devi, Trishul, Bandarpoonch." },
      { dayNumber: 3, title: "Deoria Tal Lake Exploration", description: "Short scenic trek to pristine alpine Deoria Tal lake — perfectly reflecting Chaukhamba mountains. Evening stargazing session with a local astronomy guide. Campfire and folk music." },
      { dayNumber: 4, title: "Sunrise Devotion & Return Drive", description: "Final organic breakfast. Checkout. Scenic drive back to Dehradun with planned stops at roadside tea stalls overlooking river valleys." }
    ],
  },
  {
    id: "rishikesh-rafting",
    slug: "rishikesh-rafting",
    name: "Rishikesh Rapids & Cliff Camp",
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
    id: "chakrata-nature",
    slug: "chakrata-nature",
    name: "Darma Vally Trip",
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
  {
    id: "munsiyari-adventure",
    slug: "munsiyari-adventure",
    name: "Munsiyari Adventure",
    destination: "chakrata",
    destinations: [],
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=800&fit=crop&auto=format",
    gallery: [],
    price: 9999,
    duration: "5 Days / 4 Nights",
    category: "adventure",
    difficulty: "Moderate",
    highlights: ["Panchachuli peaks panorama", "High altitude trekking"],
    inclusions: ["All meals", "Certified guides"],
    exclusions: ["Personal insurance"],
    cancellationPolicy: "Standard cancellation policy.",
    badge: "POPULAR",
  },
];
