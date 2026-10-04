import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi, tokenStorage, type AdminUser } from "@/api/auth";
import { destinationsApi } from "@/api/destinations";
import { tripsApi } from "@/api/trips";
import { enquiriesApi } from "@/api/enquiries";
import { contentApi } from "@/api/content";
import { reviewsApi } from "@/api/reviews";
import { siteAssetsApi, type SiteAssetsMap, DEFAULT_SITE_ASSET_SLOTS } from "@/api/siteAssets";
import { INITIAL_DESTINATIONS, type Destination } from "@/data/destinations";
import { INITIAL_TRIPS, INITIAL_TRIP_INSTANCES, type Trip, type TripInstance } from "@/data/trips";
import { REVIEWS, type Review } from "@/data/reviews";
import { settingsApi, type AllSettings } from "@/api/settings";
import { clientCache } from "@/utils/clientCache";

export type { TripInstance, AdminUser, AllSettings };


export type Page =
  | "home" | "destinations" | "destination-detail" | "trips" | "trip-detail"
  | "plan" | "about" | "reviews" | "faq" | "terms" | "privacy" | "admin"
  | "travel-with-us" | "past-trips" | "completed-trip-detail" | "review"
  | "profile";

export interface Enquiry {
  id: string;
  tripName: string;
  destination: string;
  travelDate: string;
  travellers: string;
  submittedAt: string;
  status: "Received" | "Contacted" | "Quoted" | "In Discussion" | "Converted" | "Confirmed" | "Closed" | "Lost" | "Cancelled";
  name: string;
  phone: string;
  email: string;
  pickupCity?: string;
  message: string;
  tripId?: string;
  tripInstanceId?: string;
  budgetLabel?: string;
  enquiryNumber?: string;
  source?: string;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  bookingId?: string | null;
  bookingNumber?: string | null;
}

export interface Traveller {
  name: string;
  age: string;
  gender: string;
}

export interface Booking {
  id: string;
  enquiryId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  destination: string;
  tripId?: string;
  tripName: string;
  tripInstanceId?: string;
  tripDate: string;
  travellers: Traveller[];
  totalAmount: string;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  paymentNotes?: string;
  status: "Confirmed" | "Completed" | "Cancelled";
  bookingDate: string;
  notes?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export type CarouselSlide =
  | { type: "trip"; tripId?: string; tripInstanceId?: string; imageUrl?: string; title?: string; subtitle?: string }
  | { type: "static"; imageUrl: string; title: string; subtitle: string };

export interface HomepageContent {
  heroImages: string[];
  heroTitle?: string;
  heroSubtitle?: string;
  featuredDestIds: string[];
  whyUsTitle: string;
  whyUsDesc: string;
  whyUsPoints: { icon: string; title: string; desc: string }[];
  carouselSlides?: CarouselSlide[];
  featuredReviewIds: string[];
}

export interface GalleryImage {
  id: string;
  url: string;
  category: "homepage" | "destinations" | "trips" | "completed-trips" | "reviews" | "general";
  label?: string;
  addedAt: string;
}

export const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    type: "trip",
    tripId: "darma-valley-trek",
    tripInstanceId: "3aec4028-8ecd-4307-8244-f8a71a2236b6",
    imageUrl: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/e230812f-734d-44d8-9967-fc51d5dd4a9e-maxresdefault.jpg",
    title: "Darma Vally Trip",
    subtitle: "Uncover the raw, untold beauty of Uttarakhand. Mindfully designed travel packages for young explorers.",
  },
  {
    type: "trip",
    tripId: "rishikesh-rafting-glamping",
    tripInstanceId: "5afb37d1-ccdd-4486-8e0f-a771a6fecf49",
    imageUrl: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/22a1874c-a717-4dab-a82a-48380b2b7ec3-rishikesh.jpg",
    title: "Rishikesh Rapids & Cliff Camp",
    subtitle: "Grade 3–5 white water rafting on the Ganga and riverside luxury glamping.",
  },
  {
    type: "trip",
    tripId: "kedarnath-spiritual-trek",
    tripInstanceId: "3e7d2f58-d6a0-4cc0-ba0c-5f3521be2542",
    imageUrl: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/fb19581e-dca3-4cdb-b122-c193099be3a1-wp6584296.jpg",
    title: "Kedarnath Pilgrimage Trek",
    subtitle: "Kedarnath Temple darshan and sacred glacial valleys.",
  },
  {
    type: "trip",
    tripId: "chopta-chandrashila-trek",
    tripInstanceId: "abba9958-5317-4aec-9483-df1dfc59ea4e",
    imageUrl: "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/7e7801b6-4b1e-4e43-a6ce-34eb070fcfcd-1513419766-chandra-jpg.jpg",
    title: "Chopta Tungnath Adventure",
    subtitle: "Trek the Sacred Meadow Ridge and reach Chandrashila summit at 13,123 ft.",
  },
];

const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroImages: DEFAULT_CAROUSEL_SLIDES.map((s) => s.imageUrl || "").filter(Boolean),
  heroTitle: "Jai Ho!",
  heroSubtitle:
    "Uncover the raw, untold beauty of Uttarakhand. Mindfully designed travel packages for young explorers wanting to experience the Himalayas beyond the ordinary.",
  featuredDestIds: ["chopta", "auli", "kedarnath"],
  whyUsTitle: "The Mindful Adventure Movement",
  whyUsDesc:
    "We started Yatrivo to bridge the gap between heavy commercial bus tours and risky, unguided expeditions. Our groups are small, food is sourced from local farms, and trails are chosen for deep natural connection.",
  whyUsPoints: [
    { icon: "🗺️", title: "Handpicked Paths", desc: "Carefully charted trails away from tourist crowds." },
    { icon: "👥", title: "Youthful Vibe", desc: "Small groups, like-minded active adventurers." },
    { icon: "🏔️", title: "Himalayan Trust", desc: "Certified local guides & sustainable execution." },
  ],
  featuredReviewIds: [],
  carouselSlides: DEFAULT_CAROUSEL_SLIDES,
};

interface AppContextType {
  // Navigation
  page: Page;
  pageParams: { tripId?: string; destId?: string; tripInstanceId?: string; reviewToken?: string };
  navigate: (page: Page | string, params?: { tripId?: string; destId?: string; tripInstanceId?: string; reviewToken?: string }) => void;

  // Saved / Favourites (no auth required)
  savedItems: Set<string>;
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;

  // Enquiries
  enquiries: Enquiry[];
  addEnquiry: (e: Enquiry) => void;
  refreshEnquiries: () => Promise<void>;

  // Enquiry modal
  enquiryModalOpen: boolean;
  enquiryTripId: string;
  enquiryDepartureId?: string;
  openEnquiryModal: (tripId: string, departureId?: string) => void;
  closeEnquiryModal: () => void;

  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"]) => void;

  // Admin
  adminLoggedIn: boolean;
  adminRole: "superAdmin" | "admin" | null;
  adminUser: AdminUser | null;
  setAdminUser: Dispatch<SetStateAction<AdminUser | null>>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;

  // Splash
  splashDone: boolean;
  setSplashDone: () => void;

  // Data
  destinations: Destination[];
  setDestinations: Dispatch<SetStateAction<Destination[]>>;
  refreshDestinations: (options?: { bypassCache?: boolean }) => Promise<void>;
  trips: Trip[];
  setTrips: Dispatch<SetStateAction<Trip[]>>;
  refreshTrips: (options?: { bypassCache?: boolean }) => Promise<void>;
  tripInstances: TripInstance[];
  setTripInstances: Dispatch<SetStateAction<TripInstance[]>>;
  reviews: Review[];
  setReviews: Dispatch<SetStateAction<Review[]>>;
  homepageContent: HomepageContent;
  setHomepageContent: Dispatch<SetStateAction<HomepageContent>>;
  clientCache: typeof clientCache;

  // Bookings
  bookings: Booking[];
  setBookings: Dispatch<SetStateAction<Booking[]>>;
  addBooking: (b: Booking) => void;

  // FAQ
  faqItems: FaqItem[];
  setFaqItems: Dispatch<SetStateAction<FaqItem[]>>;

  // Content pages
  aboutContent: string;
  setAboutContent: Dispatch<SetStateAction<string>>;
  termsContent: string;
  setTermsContent: Dispatch<SetStateAction<string>>;
  privacyContent: string;
  setPrivacyContent: Dispatch<SetStateAction<string>>;

  // Gallery / Media
  galleryImages: GalleryImage[];
  addGalleryImage: (img: Omit<GalleryImage, "id" | "addedAt">) => void;
  removeGalleryImage: (id: string) => void;

  // Content refresh (from backend)
  refreshContent: (options?: { bypassCache?: boolean }) => Promise<void>;

  // Reviews & Homepage Featured Reviews
  refreshReviews: () => Promise<void>;
  updateFeaturedReviewIds: (ids: string[]) => Promise<boolean>;

  // Site Settings
  siteSettings: AllSettings | null;
  refreshSettings: (options?: { bypassCache?: boolean }) => Promise<void>;

  // Site Assets (static page images managed via admin)
  siteAssets: SiteAssetsMap;
  setSiteAssets: Dispatch<SetStateAction<SiteAssetsMap>>;
  refreshSiteAssets: (options?: { bypassCache?: boolean }) => Promise<void>;
}


const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  { id: "faq-1", question: "What makes YATRIVO different from commercial travel agencies?", answer: "Most agents pile 30–40 travelers into big, crowded buses and rush them through commercial viewpoints. YATRIVO designs mindful travel collectives. Our groups are strictly limited (typically 8–12 like-minded active wanderers), our food is organic and sourced from local mountain farms, and we stay in high-quality timber cabins." },
  { id: "faq-2", question: "Who leads the treks? Are they certified for high altitudes?", answer: "Yes, absolutely. Every trek leader at YATRIVO is certified from premier mountaineering institutes (like NIM Uttarkashi) and holds certified qualifications in Wilderness First Aid (WFA) and high-altitude emergency management." },
  { id: "faq-3", question: "How difficult are the high-altitude alpine treks?", answer: "Our Chopta Tungnath and Chandrashila treks are rated as moderate, perfectly suited for healthy young adults. While you don't need advanced mountaineering skills, a reasonable level of walking fitness helps you enjoy the ridge trails unhurriedly." },
  { id: "faq-4", question: "Can I customize an itinerary for a private group?", answer: "Yes. Our Dehradun office has a dedicated team of custom travel designers who specialize in tailored trips. You can specify travel dates, lodging style, pacing, and specific interests. Just fill out our 'Plan My Trip' form to receive a high-fidelity proposal." },
  { id: "faq-5", question: "What is your cancellation policy?", answer: "We offer highly flexible cancellation terms. If you cancel up to 15 days before departure, we issue a 100% travel credit for future departures, valid for 1 year. For cancellations between 7 and 14 days, a 50% credit is issued." },
];

const SEED_GALLERY_IMAGES: GalleryImage[] = [];

export const AppContext = createContext<AppContextType | null>(null);

let toastIdCounter = 0;
let enquiryIdCounter = 100;
let galleryIdCounter = 20;

export function AppProvider({ children }: { children: ReactNode }) {
  const routerNavigate = useNavigate();
  const location = useLocation();

  const [pageParams, setPageParams] = useState<{ tripId?: string; destId?: string; tripInstanceId?: string; reviewToken?: string }>({});

  // Derive current logical page from router location for backwards compatibility
  const page: Page = (() => {
    const p = location.pathname;
    if (p.startsWith("/admin")) return "admin";
    if (p.startsWith("/destinations/") && p !== "/destinations") return "destination-detail";
    if (p === "/destinations") return "destinations";
    if (p.startsWith("/trips/") && p !== "/trips") return "trip-detail";
    if (p === "/trips") return "trips";
    if (p === "/plan" || p === "/plan-trip") return "plan";
    if (p === "/about") return "about";
    if (p === "/reviews") return "reviews";
    if (p.startsWith("/reviews/") || p === "/review") return "review";
    if (p === "/faq" || p === "/contact") return "faq";
    if (p === "/terms") return "terms";
    if (p === "/privacy") return "privacy";
    if (p === "/travel-with-us") return "travel-with-us";
    if (p.startsWith("/past-trips/") && p !== "/past-trips") return "completed-trip-detail";
    if (p === "/past-trips") return "past-trips";
    if (p === "/profile") return "profile";
    return "home";
  })();

  const hasSavedToken = typeof window !== "undefined" && tokenStorage.hasTokens();

  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [enquiries, setEnquiries] = useState<Enquiry[]>([
    {
      id: "ENQ-001",
      tripName: "Chopta Tungnath Adventure",
      destination: "Chopta, Uttarakhand",
      travelDate: "2026-10-15",
      travellers: "4",
      submittedAt: "2026-09-01T10:30:00Z",
      status: "Contacted",
      name: "Siddharth Verma",
      phone: "+91 98765 43210",
      email: "siddharth@example.com",
      pickupCity: "Dehradun",
      message: "Looking for a guided group trek with cabin stays.",
    },
    {
      id: "ENQ-002",
      tripName: "Auli Snow & Ski Collective",
      destination: "Auli, Uttarakhand",
      travelDate: "2026-12-20",
      travellers: "2",
      submittedAt: "2026-09-03T14:15:00Z",
      status: "Received",
      name: "Ananya Mehta",
      phone: "+91 91234 56789",
      email: "ananya@example.com",
      pickupCity: "Delhi",
      message: "First-time skiing. Need beginner-friendly package.",
    },
    {
      id: "ENQ-003",
      tripName: "Kedarnath Pilgrimage Trek",
      destination: "Kedarnath, Uttarakhand",
      travelDate: "2026-11-01",
      travellers: "6",
      submittedAt: "2026-09-05T18:45:00Z",
      status: "Quoted",
      name: "Riya Sharma",
      phone: "+91 87654 32100",
      email: "riya@example.com",
      pickupCity: "Haridwar",
      message: "Family pilgrimage with elderly members. Need support.",
    },
  ]);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryTripId, setEnquiryTripId] = useState("");
  const [enquiryDepartureId, setEnquiryDepartureId] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(hasSavedToken);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => tokenStorage.getUser());
  const [adminRole, setAdminRole] = useState<"superAdmin" | "admin" | null>(() => {
    const u = tokenStorage.getUser();
    return u?.role === "super_admin" ? "superAdmin" : u?.role === "admin" ? "admin" : null;
  });
  const [splashDone, setSplashDoneState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (tokenStorage.hasTokens()) return true;
    if (window.location.pathname !== "/" && window.location.pathname !== "") return true;
    if (sessionStorage.getItem("yatrivo_splash_shown") === "true") return true;
    return false;
  });
  const [faqItems, setFaqItems] = useState<FaqItem[]>(DEFAULT_FAQ_ITEMS);
  const [aboutContent, setAboutContent] = useState("");
  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [siteSettings, setSiteSettings] = useState<AllSettings | null>(() => clientCache.get<AllSettings>("site_settings"));
  const [siteAssets, setSiteAssets] = useState<SiteAssetsMap>(() =>
    clientCache.get<SiteAssetsMap>("site_assets") ||
    DEFAULT_SITE_ASSET_SLOTS.reduce((acc, slot) => {
      acc[slot.assetKey] = slot;
      return acc;
    }, {} as SiteAssetsMap)
  );
  const [destinations, setDestinations] = useState<Destination[]>(() => clientCache.get<Destination[]>("destinations:active") || INITIAL_DESTINATIONS);

  const [trips, setTrips] = useState<Trip[]>(() => clientCache.get<Trip[]>("trips:published") || INITIAL_TRIPS);
  const [tripInstances, setTripInstances] = useState<TripInstance[]>(() => {
    const cachedTrips = clientCache.get<Trip[]>("trips:published");
    if (cachedTrips) {
      const instances = cachedTrips.flatMap((t) => t.departures || []);
      if (instances.length > 0) return instances;
    }
    return INITIAL_TRIP_INSTANCES;
  });
  const [reviews, setReviews] = useState<Review[]>(REVIEWS);
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(() => {
    const cached = clientCache.get<HomepageContent>("homepage:content");
    if (cached && Array.isArray(cached.carouselSlides) && cached.carouselSlides.length > 0) {
      return cached;
    }
    return DEFAULT_HOMEPAGE_CONTENT;
  });
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(SEED_GALLERY_IMAGES);
  const [bookings, setBookings] = useState<Booking[]>([
    { id: "BK001", customerName: "Rahul Sharma", customerPhone: "+91 98765 43210", destination: "Chopta", tripName: "Chopta Tungnath Trek", tripDate: "Oct 15, 2026", travellers: [{ name: "Rahul Sharma", age: "28", gender: "Male" }, { name: "Anjali Sharma", age: "26", gender: "Female" }], totalAmount: "₹17,000", paymentStatus: "Paid", status: "Confirmed", bookingDate: "2026-09-10" },
    { id: "BK002", customerName: "Priya Nair", customerPhone: "+91 90011 22334", destination: "Rishikesh", tripName: "Rishikesh Rapids & Camping", tripDate: "Nov 8, 2026", travellers: [{ name: "Priya Nair", age: "24", gender: "Female" }], totalAmount: "₹6,999", paymentStatus: "Partial", status: "Confirmed", bookingDate: "2026-09-15" },
    { id: "BK003", customerName: "Ankit Gupta", customerPhone: "+91 97654 32109", destination: "Auli", tripName: "Auli Ski Adventure", tripDate: "Nov 20, 2026", travellers: [{ name: "Ankit Gupta", age: "32", gender: "Male" }, { name: "Sneha Gupta", age: "30", gender: "Female" }, { name: "Rohit Gupta", age: "8", gender: "Male" }], totalAmount: "₹43,500", paymentStatus: "Unpaid", status: "Confirmed", bookingDate: "2026-09-18" },
  ]);

  // Unified navigate supporting both legacy page tokens and clean URL paths
  const navigate = useCallback((p: Page | string, params: { tripId?: string; destId?: string; tripInstanceId?: string; reviewToken?: string } = {}) => {
    setPageParams(params);
    let target = "/";
    if (p.startsWith("/")) {
      target = p;
    } else {
      switch (p) {
        case "home": target = "/"; break;
        case "destinations": target = "/destinations"; break;
        case "destination-detail": target = `/destinations/${params.destId || "chopta"}`; break;
        case "trips": target = "/trips"; break;
        case "trip-detail": target = `/trips/${params.tripId || "chopta-trek"}`; break;
        case "plan": target = "/plan"; break;
        case "about": target = "/about"; break;
        case "reviews": target = "/reviews"; break;
        case "review": target = `/reviews/new${params.tripInstanceId ? `?instanceId=${params.tripInstanceId}` : ""}`; break;
        case "faq": target = "/faq"; break;
        case "terms": target = "/terms"; break;
        case "privacy": target = "/privacy"; break;
        case "travel-with-us": target = "/travel-with-us"; break;
        case "past-trips": target = "/past-trips"; break;
        case "completed-trip-detail": target = `/past-trips/${params.tripInstanceId || ""}`; break;
        case "profile": target = "/profile"; break;
        case "admin": target = "/admin"; break;
        default: target = `/${p}`;
      }
    }
    routerNavigate(target);
  }, [routerNavigate]);

  const toggleSave = useCallback((id: string) => {
    setSavedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedItems.has(id), [savedItems]);

  const addEnquiry = useCallback((e: Enquiry) => {
    setEnquiries((prev) => [e, ...prev]);
  }, []);

  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => [b, ...prev]);
  }, []);

  const openEnquiryModal = useCallback((tripId: string, departureId?: string) => {
    setEnquiryTripId(tripId);
    setEnquiryDepartureId(departureId);
    setEnquiryModalOpen(true);
  }, []);

  const closeEnquiryModal = useCallback(() => {
    setEnquiryModalOpen(false);
    setEnquiryDepartureId(undefined);
  }, []);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = String(++toastIdCounter);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Auto-verify / rehydrate persisted session in the background
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const accessToken = tokenStorage.getAccessToken();

      if (accessToken) {
        try {
          const user = await authApi.getMe(accessToken);
          if (isMounted) {
            setAdminUser(user);
            setAdminLoggedIn(true);
            setAdminRole(user.role === "super_admin" ? "superAdmin" : "admin");
          }
          return;
        } catch {
          // Access token might be expired, proceed to refresh via cookie below
        }
      }

      // Attempt session restoration via HttpOnly refresh cookie
      try {
        const newTokens = await authApi.refresh();
        const user = await authApi.getMe(newTokens.accessToken);
        if (isMounted) {
          setAdminUser(user);
          setAdminLoggedIn(true);
          setAdminRole(user.role === "super_admin" ? "superAdmin" : "admin");
        }
      } catch {
        if (isMounted) {
          tokenStorage.clearSession();
          setAdminLoggedIn(false);
          setAdminUser(null);
          setAdminRole(null);
        }
      }
    };

    void verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const adminLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authApi.login({ email, password });
      setAdminUser(data.user);
      setAdminLoggedIn(true);
      setAdminRole(data.user.role === "super_admin" ? "superAdmin" : "admin");
      setSplashDoneState(true);
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Invalid credentials";
      return { success: false, error: errorMsg };
    }
  }, []);

  const adminLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout error:", err);
    }
    setAdminLoggedIn(false);
    setAdminRole(null);
    setAdminUser(null);
    routerNavigate("/admin/login");
  }, [routerNavigate]);

  const setSplashDone = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("yatrivo_splash_shown", "true");
    }
    setSplashDoneState(true);
  }, []);

  const addGalleryImage = useCallback((img: Omit<GalleryImage, "id" | "addedAt">) => {
    const id = `g${++galleryIdCounter}`;
    setGalleryImages((prev) => [...prev, { ...img, id, addedAt: new Date().toISOString().slice(0, 10) }]);
  }, []);

  const removeGalleryImage = useCallback((id: string) => {
    setGalleryImages((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const refreshDestinations = useCallback(async (options?: { bypassCache?: boolean }) => {
    try {
      const hasAuth = tokenStorage.hasTokens();
      const shouldBypass = options?.bypassCache || hasAuth;

      const dests = await clientCache.fetchWithCache(
        "destinations:active",
        async () => {
          const res = await destinationsApi.list({ includeArchived: hasAuth });
          return res.destinations || [];
        },
        {
          staleTimeMs: 5 * 60 * 1000,
          maxAgeMs: 30 * 60 * 1000,
          bypassCache: shouldBypass,
          onRevalidate: (fresh) => {
            if (fresh && fresh.length > 0) {
              setDestinations(fresh);
            }
          }
        }
      );

      if (dests && dests.length > 0) {
        setDestinations(dests);
      }
    } catch (err) {
      console.warn("Failed to load destinations from backend:", err);
    }
  }, []);

  const refreshTrips = useCallback(async (options?: { bypassCache?: boolean }) => {
    try {
      const hasAuth = tokenStorage.hasTokens();
      const shouldBypass = options?.bypassCache || hasAuth;

      const tripsData = await clientCache.fetchWithCache(
        "trips:published",
        async () => {
          const res = await tripsApi.list({
            includeArchived: hasAuth,
            status: hasAuth ? "all" : "published"
          });
          return res.trips || [];
        },
        {
          staleTimeMs: 5 * 60 * 1000,
          maxAgeMs: 30 * 60 * 1000,
          bypassCache: shouldBypass,
          onRevalidate: (freshTrips) => {
            if (freshTrips && Array.isArray(freshTrips)) {
              setTrips(freshTrips);
              const instances = freshTrips.flatMap((t) => t.departures || []);
              if (instances.length > 0) {
                setTripInstances(instances);
              }
            }
          }
        }
      );

      if (tripsData && Array.isArray(tripsData)) {
        setTrips(tripsData);
        const instances = tripsData.flatMap((t) => t.departures || []);
        if (instances.length > 0) {
          setTripInstances(instances);
        }
      }
    } catch (err) {
      console.warn("Failed to load trips from backend:", err);
    }
  }, []);

  const refreshEnquiries = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      return;
    }
    try {
      const data = await enquiriesApi.list();
      if (data.enquiries && Array.isArray(data.enquiries)) {
        const mapped: Enquiry[] = data.enquiries.map((e) => {
          let statusLabel: Enquiry["status"] = "Received";
          const s = e.status.toLowerCase();
          if (s === "contacted") statusLabel = "Contacted";
          else if (s === "quoted") statusLabel = "Quoted";
          else if (s === "in_discussion") statusLabel = "In Discussion";
          else if (s === "converted") statusLabel = "Converted";
          else if (s === "confirmed") statusLabel = "Confirmed";
          else if (s === "closed") statusLabel = "Closed";
          else if (s === "lost") statusLabel = "Lost";
          else if (s === "cancelled") statusLabel = "Cancelled";

          return {
            id: e.id,
            enquiryNumber: e.enquiryNumber,
            tripName: e.tripName || "Custom Himalayan Expedition",
            destination: e.destinationLabel || "Uttarakhand",
            travelDate: e.requestedTravelDate || "Flexible",
            travellers: String(e.requestedTravellerCount || 1),
            submittedAt: e.submittedAt,
            status: statusLabel,
            name: e.customerName,
            phone: e.customerPhone,
            email: e.customerEmail || "",
            message: e.message || "",
            tripId: e.tripId || undefined,
            tripInstanceId: e.tripInstanceId || undefined,
            budgetLabel: e.budgetLabel || undefined,
            source: e.source,
            assignedToUserId: e.assignedToUserId,
            assignedToName: e.assignedToName,
            assignedToEmail: e.assignedToEmail,
            bookingId: e.bookingId || undefined,
            bookingNumber: e.bookingNumber || undefined
          };
        });
        setEnquiries(mapped);
      }
    } catch (err) {
      console.warn("Failed to load enquiries from backend:", err);
    }
  }, []);

  const applyHomepageConfig = useCallback((homepage: Awaited<ReturnType<typeof contentApi.getPublicHomepage>>) => {
    if (!homepage) return;
    const mappedSlides: CarouselSlide[] = (homepage.slides || []).map((s) => {
      if (s.slideType === "trip") {
        return {
          type: "trip" as const,
          tripId: s.tripId || undefined,
          tripInstanceId: s.tripInstanceId || s.tripId || "",
          imageUrl: s.imageUrl || undefined,
          title: s.titleOverride || undefined,
          subtitle: s.subtitleOverride || undefined,
        };
      }
      return {
        type: "static" as const,
        imageUrl: s.imageUrl || "",
        title: s.titleOverride || "",
        subtitle: s.subtitleOverride || "",
      };
    });
    setHomepageContent((prev) => {
      const next: HomepageContent = {
        ...prev,
        heroTitle: homepage.heroTitle || prev.heroTitle,
        heroSubtitle: homepage.heroSubtitle || prev.heroSubtitle,
        whyUsTitle: homepage.whyUsTitle || prev.whyUsTitle,
        whyUsDesc: homepage.whyUsDescription || prev.whyUsDesc,
        featuredDestIds: Array.isArray(homepage.featuredDestinationIds)
          ? homepage.featuredDestinationIds
          : prev.featuredDestIds,
        featuredReviewIds: Array.isArray(homepage.featuredReviewIds)
          ? homepage.featuredReviewIds
          : prev.featuredReviewIds,
        whyUsPoints: (homepage.whyUsPoints || []).length > 0
          ? homepage.whyUsPoints.map((p) => ({ icon: p.icon || "✨", title: p.title, desc: p.description || "" }))
          : prev.whyUsPoints,
        carouselSlides: mappedSlides.length > 0 ? mappedSlides : prev.carouselSlides,
        heroImages: mappedSlides.map((s) => s.imageUrl || "").filter(Boolean),
      };
      clientCache.set("homepage:content", next);
      return next;
    });
  }, []);

  const refreshContent = useCallback(async (options?: { bypassCache?: boolean }) => {
    const shouldBypass = options?.bypassCache || tokenStorage.hasTokens();

    // Load homepage config
    try {
      const homepage = await clientCache.fetchWithCache(
        "homepage:api_config",
        () => contentApi.getPublicHomepage(),
        {
          staleTimeMs: 5 * 60 * 1000,
          maxAgeMs: 30 * 60 * 1000,
          bypassCache: shouldBypass,
          onRevalidate: (fresh) => {
            if (fresh) applyHomepageConfig(fresh);
          }
        }
      );
      if (homepage) {
        applyHomepageConfig(homepage);
      }
    } catch (err) {
      console.warn("Failed to load homepage config from backend:", err);
    }

    // Load FAQs
    try {
      const faqs = await contentApi.getPublicFaqs();
      if (faqs && faqs.length > 0) {
        setFaqItems(faqs.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        })));
      }
    } catch (err) {
      console.warn("Failed to load FAQs from backend:", err);
    }

    // Load content pages (about, terms, privacy)
    try {
      const aboutPage = await contentApi.getPublicContentPage("about");
      if (aboutPage?.body) setAboutContent(aboutPage.body);
    } catch (err) {
      console.warn("Failed to load about page from backend:", err);
    }
    try {
      const termsPage = await contentApi.getPublicContentPage("terms");
      if (termsPage?.body) setTermsContent(termsPage.body);
    } catch (err) {
      console.warn("Failed to load terms page from backend:", err);
    }
    try {
      const privacyPage = await contentApi.getPublicContentPage("privacy");
      if (privacyPage?.body) setPrivacyContent(privacyPage.body);
    } catch (err) {
      console.warn("Failed to load privacy page from backend:", err);
    }
  }, []);

  const refreshReviews = useCallback(async () => {
    try {
      const res = await reviewsApi.list({ limit: 100 });
      const items = Array.isArray(res?.reviews) ? res.reviews : [];
      setReviews(items.map((r) => ({
        id: r.id,
        name: r.reviewerName,
        tripName: r.tripName || "Himalayan Expedition",
        destination: r.destinationName || "Uttarakhand",
        rating: (r.rating || 5) as 1 | 2 | 3 | 4 | 5,
        text: r.body,
        date: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently",
        status: r.status,
      })));
    } catch (err) {
      console.warn("Failed to load reviews from backend:", err);
    }
  }, []);

  const updateFeaturedReviewIds = useCallback(async (newIds: string[]): Promise<boolean> => {
    const uniqueIds = Array.from(new Set(newIds)).slice(0, 3);
    setHomepageContent((prev) => {
      const next: HomepageContent = {
        ...prev,
        featuredReviewIds: uniqueIds,
      };
      clientCache.set("homepage:content", next);
      return next;
    });
    clientCache.invalidate("homepage:api_config");

    try {
      await contentApi.updateHomepageConfig({
        whyUsTitle: homepageContent.whyUsTitle,
        whyUsDescription: homepageContent.whyUsDesc,
        slides: (homepageContent.carouselSlides || []).map((s, i) => ({
          slideType: s.type,
          tripId: s.type === "trip" ? (s.tripId || s.tripInstanceId) : undefined,
          tripInstanceId: s.type === "trip" ? s.tripInstanceId : undefined,
          imageUrl: s.type === "static" ? s.imageUrl : undefined,
          titleOverride: s.title,
          subtitleOverride: s.subtitle,
          sortOrder: i,
          isActive: true
        })),
        featuredDestinationIds: homepageContent.featuredDestIds,
        featuredReviewIds: uniqueIds,
        whyUsPoints: homepageContent.whyUsPoints.map((p, i) => ({
          icon: p.icon,
          title: p.title,
          description: p.desc,
          sortOrder: i
        }))
      });
      clientCache.invalidate("homepage:content");
      clientCache.invalidate("homepage:api_config");
      return true;
    } catch (err) {
      console.error("Failed to update homepage reviews:", err);
      return false;
    }
  }, [homepageContent]);

  const refreshSettings = useCallback(async (options?: { bypassCache?: boolean }) => {
    try {
      const shouldBypass = options?.bypassCache || tokenStorage.hasTokens();
      const s = await clientCache.fetchWithCache(
        "site_settings",
        () => settingsApi.getPublicSettings(),
        {
          staleTimeMs: 10 * 60 * 1000,
          maxAgeMs: 30 * 60 * 1000,
          bypassCache: shouldBypass,
          onRevalidate: (fresh) => {
            if (fresh) setSiteSettings(fresh);
          }
        }
      );
      if (s) {
        setSiteSettings(s);
      }
    } catch (err) {
      console.warn("Failed to load site settings from backend:", err);
    }
  }, []);

  const refreshSiteAssets = useCallback(async (options?: { bypassCache?: boolean }) => {
    try {
      const shouldBypass = options?.bypassCache || tokenStorage.hasTokens();
      const assets = await clientCache.fetchWithCache(
        "site_assets",
        () => siteAssetsApi.getAll(),
        {
          staleTimeMs: 10 * 60 * 1000,
          maxAgeMs: 30 * 60 * 1000,
          bypassCache: shouldBypass,
          onRevalidate: (fresh) => {
            if (fresh && Object.keys(fresh).length > 0) {
              setSiteAssets(fresh);
            }
          }
        }
      );
      if (assets && Object.keys(assets).length > 0) {
        setSiteAssets(assets);
      }
    } catch (err) {
      console.warn("Failed to load site assets from backend:", err);
    }
  }, []);

  useEffect(() => {
    void refreshDestinations();
    void refreshTrips();
    void refreshEnquiries();
    void refreshContent();
    void refreshReviews();
    void refreshSettings();
    void refreshSiteAssets();
  }, [refreshDestinations, refreshTrips, refreshEnquiries, refreshContent, refreshReviews, refreshSettings, refreshSiteAssets, adminLoggedIn]);

  return (
    <AppContext.Provider value={{
      page, pageParams, navigate,
      savedItems, toggleSave, isSaved,
      enquiries, addEnquiry, refreshEnquiries,
      enquiryModalOpen, enquiryTripId, enquiryDepartureId, openEnquiryModal, closeEnquiryModal,
      toasts, showToast,
      adminLoggedIn, adminRole, adminUser, setAdminUser, adminLogin, adminLogout,
      splashDone, setSplashDone,
      destinations, setDestinations, refreshDestinations,
      trips, setTrips, refreshTrips,
      tripInstances, setTripInstances,
      reviews, setReviews, refreshReviews,
      homepageContent, setHomepageContent,
      faqItems, setFaqItems,
      aboutContent, setAboutContent,
      termsContent, setTermsContent,
      privacyContent, setPrivacyContent,
      galleryImages, addGalleryImage, removeGalleryImage,
      bookings, setBookings, addBooking,
      refreshContent,
      updateFeaturedReviewIds,
      siteSettings, refreshSettings,
      siteAssets, setSiteAssets, refreshSiteAssets,
      clientCache,
    }}>
      {children}
    </AppContext.Provider>
  );

}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
