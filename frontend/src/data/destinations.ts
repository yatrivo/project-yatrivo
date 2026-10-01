export interface DestinationGalleryMediaItem {
  id: string;
  mediaId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export const UTTARAKHAND_EXPERIENCE_TAGS = [
  "Trekking & Hiking",
  "Adventure",
  "Nature & Wildlife",
  "Lakes & Waterfalls",
  "Spiritual & Pilgrimage",
  "Culture & Heritage",
  "Village & Rural Life",
  "Snow & Winter",
  "Camping & Outdoors",
  "Wellness & Retreats",
] as const;

export type UttarakhandExperienceTag = typeof UTTARAKHAND_EXPERIENCE_TAGS[number];

export interface Destination {
  id: string;
  slug?: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  coverMediaId?: string | null;
  gallery: string[];
  galleryMedia?: DestinationGalleryMediaItem[];
  category?: string;
  experienceTags?: string[];
  season: string;
  highlights: string[];
  activities: string[];
  elevation?: string;
  bestTime: string;
  status?: "active" | "archived" | "draft";
  archivedAt?: string | null;
  sortOrder?: number;
}

export const INITIAL_DESTINATIONS: Destination[] = [
  {
    id: "chopta",
    name: "Chopta Valley",
    tagline: "Alpine meadows & dense forest",
    description:
      "Known as the 'Mini Switzerland of India', Chopta is a pristine alpine valley that serves as the base for trekking to Tungnath — the highest Shiva temple in the world. Surrounded by dense rhododendron forests and snow-capped peaks, it offers breathtaking natural beauty year-round.",
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/7e7801b6-4b1e-4e43-a6ce-34eb070fcfcd-1513419766-chandra-jpg.jpg",
    gallery: [],
    season: "April – Nov",
    highlights: [
      "Trek to Tungnath temple (12,073 ft)",
      "Chandrashila Summit panoramic views",
      "Deoria Tal lake reflection",
      "Dense rhododendron forests in bloom",
    ],
    activities: ["High-altitude Trekking", "Summit Climbs", "Stargazing", "Wildlife Spotting", "Forest Camping"],
    elevation: "2,680 m",
    bestTime: "April – June & Sept – Nov",
  },
  {
    id: "auli",
    name: "Auli Slopes",
    tagline: "High-altitude winter paradise",
    description:
      "Auli is India's premier ski destination, offering powder snow, certified ski schools, and stunning Himalayan vistas. Perched at 2,519 metres, the slopes offer beginner to expert runs with views of peaks including Nanda Devi.",
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/e230812f-734d-44d8-9967-fc51d5dd4a9e-maxresdefault.jpg",
    gallery: [],
    season: "Dec – March",
    highlights: [
      "India's best ski slopes",
      "Cable car rides to 3,010 m",
      "Views of Nanda Devi (7,816 m)",
      "Artificial lake — India's highest",
    ],
    activities: ["Skiing", "Snowboarding", "Cable Car", "Snow Trekking", "Photography"],
    elevation: "2,519 m",
    bestTime: "January – February",
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    tagline: "Holy river & yoga capital",
    description:
      "Nestled in the foothills of the Himalayas along the sacred Ganga, Rishikesh is one of India's most spiritually significant towns. Known as the yoga capital of the world, it draws seekers from across the globe to its ancient ashrams, serene riverbanks, and powerful meditation centres.",
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/22a1874c-a717-4dab-a82a-48380b2b7ec3-rishikesh.jpg",
    gallery: [],
    season: "Sept – April",
    highlights: [
      "Ganga Aarti ceremony at dusk",
      "White water rafting Grade 3–5",
      "200+ ashrams & yoga schools",
      "Lakshman Jhula suspension bridge",
    ],
    activities: ["Yoga & Meditation", "White Water Rafting", "Bungee Jumping", "Cliff Diving", "Evening Aarti"],
    bestTime: "October – March",
  },
  {
    id: "kedarnath",
    name: "Kedarnath",
    tagline: "Spiritual heights & high peaks",
    description:
      "One of the holiest Hindu shrines and part of the Char Dham, Kedarnath sits at 3,583 m surrounded by glaciers and towering peaks. The journey here is as sacred as the destination — a trek through mountain meadows, ancient forests, and the roaring Mandakini river.",
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/ea3d6579-4e56-45c2-8940-917166a0e76d-6068998.jpg",
    gallery: [],
    season: "May – Nov",
    highlights: [
      "Kedarnath Temple (3,583 m)",
      "Vasuki Tal glacial lake trek",
      "Bhairavnath temple viewpoint",
      "Triyuginarayan eternal fire",
    ],
    activities: ["Pilgrimage Trek", "Temple Visit", "Meditation", "High-altitude Camping"],
    elevation: "3,583 m",
    bestTime: "May – June & Sept – Oct",
  },
  {
    id: "kanatal",
    name: "Kanatal",
    tagline: "Cozy pine woods & stargazing cabins",
    description:
      "Kanatal is a hidden gem in Uttarakhand's Tehri Garhwal district — a quiet, verdant hamlet surrounded by oak and rhododendron forests. Perfect for weekend escapes, the stargazing here is exceptional due to minimal light pollution.",
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/c0ad513a-b215-44a3-b465-6801cbc40fb1-1548836776-shutterstock-1058770418.jpg",
    gallery: [],
    season: "Year round",
    highlights: [
      "Crystal clear night skies",
      "Apple orchards & forest walks",
      "Kodia Jungle camping",
      "Tehri Lake viewpoints",
    ],
    activities: ["Stargazing", "Forest Camping", "Nature Walks", "Rock Climbing", "Rappelling"],
    elevation: "2,590 m",
    bestTime: "March – June & Sept – Nov",
  },
  {
    id: "chakrata",
    name: "Chakrata",
    tagline: "Waterfalls & ancient hill forts",
    description:
      "Chakrata is one of Uttarakhand's least-visited hill stations, offering pristine forests, ancient Mahasu Devta temple, and the magnificent Tiger Falls — one of India's highest waterfalls at 312 feet. A perfect offbeat destination away from tourist trails.",
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/4014dd97-6346-449a-b252-ccbb82d16507-chakrata-1566208182.webp",
    gallery: [],
    season: "March – July",
    highlights: [
      "Tiger Falls (312 ft) — India's tallest plunge",
      "Chilmiri Neck panoramic point",
      "Mahasu Devta ancient temple",
      "Deoban forest camping",
    ],
    activities: ["Waterfall Trek", "Forest Walks", "Temple Visit", "Bird Watching", "Camping"],
    elevation: "2,118 m",
    bestTime: "April – July",
  },
  {
    id: "mussoorie",
    name: "Mussoorie",
    tagline: "Colonial hills & sunset viewpoints",
    description:
      "Known as the 'Queen of Hills', Mussoorie blends Victorian-era charm with sweeping Himalayan vistas. The Mall Road, Landour's quiet lanes, and Kempty Falls make it perfect for a relaxed getaway with a colonial character.",
    image: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/ccf7c94c-968d-4182-a24f-2a2f1d033c26-mussoorie-7488728.webp",
    gallery: [],
    season: "Sept – June",
    highlights: [
      "Landour heritage lanes",
      "Gun Hill cable car",
      "Kempty Falls",
      "Christ Church (1836)",
    ],
    activities: ["Heritage Walks", "Cable Car", "Orchard Visits", "Photography", "Local Cuisine"],
    elevation: "2,005 m",
    bestTime: "March – June & Sept – Nov",
  },
];
