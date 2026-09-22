export interface Review {
  id: string;
  name: string;
  tripName: string;
  destination: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string;
  status: "published" | "hidden" | "pending";
  avatar: string;
}

export const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Siddharth Verma",
    tripName: "Chopta Tungnath Adventure",
    destination: "chopta",
    rating: 5,
    text: "The views were unreal, but what made it truly magical was our crew and local guides. We stayed in warm wooden huts and sang pahadi folk songs around a real fireplace. Yatrivo's attention to every tiny detail — from the food to the trail timings — was flawless.",
    date: "2026-09-01",
    status: "published",
    avatar: "SV",
  },
  {
    id: "r2",
    name: "Ananya Mehta",
    tripName: "Rishikesh Escape & Rapids",
    destination: "rishikesh",
    rating: 5,
    text: "Truly a mindful escape. Yatrivo balanced intense white-water rafting with sunrise meditation. Premium riverside glamping with certified guides who put ecological respect first. The evening aarti was a moment I'll carry forever.",
    date: "2026-08-18",
    status: "published",
    avatar: "AM",
  },
  {
    id: "r3",
    name: "Kabir Sen",
    tripName: "Auli Snow & Ski Collective",
    destination: "auli",
    rating: 5,
    text: "Most operators pack 30 people in a tight bus. Yatrivo felt like a road trip with close friends. Certified instructors, wood lodges, and clear views of Nanda Devi from the slopes. I'm already booking next winter.",
    date: "2026-01-10",
    status: "published",
    avatar: "KS",
  },
  {
    id: "r4",
    name: "Riya Sharma",
    tripName: "Kedarnath Pilgrimage Trek",
    destination: "kedarnath",
    rating: 5,
    text: "We came as a family of six, including elderly parents. The team made every step easier — from helicopter booking to porter arrangements. The moment we reached the temple at dawn is something that cannot be described in words.",
    date: "2026-06-22",
    status: "published",
    avatar: "RS",
  },
  {
    id: "r5",
    name: "Priya Nair",
    tripName: "Kanatal Forest Camp",
    destination: "kanatal",
    rating: 4,
    text: "We came for the stars and stayed for the soul. The apple orchards, the morning mist, the pine forest walks — Kanatal feels like the world's best-kept secret. The camp setup was cozy and the bonfire evenings were pure joy.",
    date: "2026-04-05",
    status: "published",
    avatar: "PN",
  },
  {
    id: "r6",
    name: "Aditya Kulkarni",
    tripName: "Chakrata Cascade & Woods",
    destination: "chakrata",
    rating: 5,
    text: "Tiger Falls in real life is 10x more powerful than any photo. The trek through dense forest felt like entering another world. Our guide Suraj knew every bird call and tree species. Truly offbeat and breathtaking.",
    date: "2026-05-14",
    status: "published",
    avatar: "AK",
  },
  {
    id: "r7",
    name: "Meera Joshi",
    tripName: "Mussoorie Colonial Secret",
    destination: "mussoorie",
    rating: 4,
    text: "A wonderful slow travel experience. Landour's winding lanes, the smell of old bookshops and Char Dukan chai — Mussoorie has a soul that rush-tourists never see. Yatrivo showed us a completely different side of the queen of hills.",
    date: "2026-03-28",
    status: "published",
    avatar: "MJ",
  },
  {
    id: "r8",
    name: "Rohit Bhatia",
    tripName: "Chopta Tungnath Adventure",
    destination: "chopta",
    rating: 5,
    text: "Second time with Yatrivo and each time they raise the bar. The rhododendron bloom in April is almost otherworldly. Chandrashila summit at sunrise with a 360-degree Himalayan view — that's a bucket-list moment delivered.",
    date: "2026-04-20",
    status: "published",
    avatar: "RB",
  },
];
