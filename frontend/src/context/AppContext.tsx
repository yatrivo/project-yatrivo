import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { authApi, tokenStorage, type AdminUser } from "@/api/auth";
import { destinationsApi } from "@/api/destinations";
import { INITIAL_DESTINATIONS, type Destination } from "@/data/destinations";
import { INITIAL_TRIPS, INITIAL_TRIP_INSTANCES, type Trip, type TripInstance } from "@/data/trips";
import { REVIEWS, type Review } from "@/data/reviews";

export type { TripInstance, AdminUser };


export type Page =
  | "home" | "destinations" | "destination-detail" | "trips" | "trip-detail"
  | "plan" | "about" | "reviews" | "faq" | "terms" | "privacy" | "admin"
  | "travel-with-us" | "past-trips" | "completed-trip-detail" | "review";

export interface Enquiry {
  id: string;
  tripName: string;
  destination: string;
  travelDate: string;
  travellers: string;
  submittedAt: string;
  status: "Received" | "Contacted" | "Quoted" | "Confirmed" | "Lost" | "Cancelled";
  name: string;
  phone: string;
  email: string;
  pickupCity: string;
  message: string;
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
  | { type: "trip"; tripInstanceId: string; title?: string; subtitle?: string }
  | { type: "static"; imageUrl: string; title: string; subtitle: string };

export interface HomepageContent {
  heroImages: string[];
  heroTitle: string;
  heroSubtitle: string;
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

const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroImages: [
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=1920&h=1080&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&h=1080&fit=crop&auto=format",
  ],
  heroTitle: "Live Deeply. Travel Boldly.",
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
  featuredReviewIds: ["r1", "r2", "r3"],
  carouselSlides: [
    { type: "trip", tripInstanceId: "inst-chopta-oct" },
    { type: "trip", tripInstanceId: "inst-kedarnath-oct" },
    { type: "trip", tripInstanceId: "inst-auli-nov" },
    {
      type: "static",
      imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&auto=format",
      title: "Explore Uttarakhand",
      subtitle: "Mindfully designed travel packages for young explorers wanting to experience the Himalayas beyond the ordinary.",
    },
  ],
};

interface AppContextType {
  // Navigation
  page: Page;
  pageParams: { tripId?: string; destId?: string; tripInstanceId?: string; reviewToken?: string };
  navigate: (page: Page, params?: { tripId?: string; destId?: string; tripInstanceId?: string; reviewToken?: string }) => void;

  // Saved / Favourites (no auth required)
  savedItems: Set<string>;
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;

  // Enquiries
  enquiries: Enquiry[];
  addEnquiry: (e: Enquiry) => void;

  // Enquiry modal
  enquiryModalOpen: boolean;
  enquiryTripId: string;
  openEnquiryModal: (tripId: string) => void;
  closeEnquiryModal: () => void;

  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"]) => void;

  // Admin
  adminLoggedIn: boolean;
  adminRole: "superAdmin" | "admin" | null;
  adminUser: AdminUser | null;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;

  // Splash
  splashDone: boolean;
  setSplashDone: () => void;

  // Data
  destinations: Destination[];
  setDestinations: Dispatch<SetStateAction<Destination[]>>;
  refreshDestinations: () => Promise<void>;
  trips: Trip[];
  setTrips: Dispatch<SetStateAction<Trip[]>>;
  tripInstances: TripInstance[];
  setTripInstances: Dispatch<SetStateAction<TripInstance[]>>;
  reviews: Review[];
  setReviews: Dispatch<SetStateAction<Review[]>>;
  homepageContent: HomepageContent;
  setHomepageContent: Dispatch<SetStateAction<HomepageContent>>;

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
}

const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  { id: "faq-1", question: "What makes YATRIVO different from commercial travel agencies?", answer: "Most agents pile 30–40 travelers into big, crowded buses and rush them through commercial viewpoints. YATRIVO designs mindful travel collectives. Our groups are strictly limited (typically 8–12 like-minded active wanderers), our food is organic and sourced from local mountain farms, and we stay in high-quality timber cabins." },
  { id: "faq-2", question: "Who leads the treks? Are they certified for high altitudes?", answer: "Yes, absolutely. Every trek leader at YATRIVO is certified from premier mountaineering institutes (like NIM Uttarkashi) and holds certified qualifications in Wilderness First Aid (WFA) and high-altitude emergency management." },
  { id: "faq-3", question: "How difficult are the high-altitude alpine treks?", answer: "Our Chopta Tungnath and Chandrashila treks are rated as moderate, perfectly suited for healthy young adults. While you don't need advanced mountaineering skills, a reasonable level of walking fitness helps you enjoy the ridge trails unhurriedly." },
  { id: "faq-4", question: "Can I customize an itinerary for a private group?", answer: "Yes. Our Dehradun office has a dedicated team of custom travel designers who specialize in tailored trips. You can specify travel dates, lodging style, pacing, and specific interests. Just fill out our 'Plan My Trip' form to receive a high-fidelity proposal." },
  { id: "faq-5", question: "What is your cancellation policy?", answer: "We offer highly flexible cancellation terms. If you cancel up to 15 days before departure, we issue a 100% travel credit for future departures, valid for 1 year. For cancellations between 7 and 14 days, a 50% credit is issued." },
];

const SEED_GALLERY_IMAGES: GalleryImage[] = [
  { id: "g1", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&auto=format", category: "homepage", label: "Hero — Mountains", addedAt: "2026-01-01" },
  { id: "g2", url: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&h=600&fit=crop&auto=format", category: "homepage", label: "Hero — Valley", addedAt: "2026-01-01" },
  { id: "g3", url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&auto=format", category: "homepage", label: "Hero — Forest", addedAt: "2026-01-01" },
  { id: "g4", url: "https://images.unsplash.com/photo-1607836046730-3317bd58a31b?w=800&h=600&fit=crop&auto=format", category: "destinations", label: "Chopta Valley", addedAt: "2026-01-02" },
  { id: "g5", url: "https://images.unsplash.com/photo-1608942025318-1191eeade556?w=800&h=600&fit=crop&auto=format", category: "destinations", label: "Auli Slopes", addedAt: "2026-01-02" },
  { id: "g6", url: "https://images.unsplash.com/photo-1676718912572-b3ebcff192e3?w=800&h=600&fit=crop&auto=format", category: "destinations", label: "Kedarnath Temple", addedAt: "2026-01-02" },
  { id: "g7", url: "https://images.unsplash.com/photo-1684436249636-c745f65f31eb?w=800&h=600&fit=crop&auto=format", category: "trips", label: "Trek Path", addedAt: "2026-01-03" },
  { id: "g8", url: "https://images.unsplash.com/photo-1718429205172-0d91b73ab23c?w=800&h=600&fit=crop&auto=format", category: "trips", label: "Camp Site", addedAt: "2026-01-03" },
  { id: "g9", url: "https://images.unsplash.com/photo-1577516311194-eb14c570a137?w=800&h=600&fit=crop&auto=format", category: "completed-trips", label: "Group Photo", addedAt: "2026-01-04" },
  { id: "g10", url: "https://images.unsplash.com/photo-1631377955049-770a6c377bce?w=800&h=600&fit=crop&auto=format", category: "completed-trips", label: "Summit View", addedAt: "2026-01-04" },
];

const AppContext = createContext<AppContextType | null>(null);

let toastIdCounter = 0;
let enquiryIdCounter = 100;
let galleryIdCounter = 20;

export function AppProvider({ children }: { children: ReactNode }) {
  const hasSavedToken = typeof window !== "undefined" && tokenStorage.hasTokens();
  const initialIsAdmin = typeof window !== "undefined" && (window.location.pathname === "/admin" || window.location.hash === "#admin");
  const initialPage: Page = hasSavedToken || initialIsAdmin ? "admin" : "home";

  const [page, setPage] = useState<Page>(initialPage);
  const [pageParams, setPageParams] = useState<{ tripId?: string; destId?: string; tripInstanceId?: string; reviewToken?: string }>({});
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [enquiries, setEnquiries] = useState<Enquiry[]>([
    {
      id: "ENQ-001",
      tripName: "Chopta Tungnath Adventure",
      destination: "Chopta, Uttarakhand",
      travelDate: "2026-10-15",
      travellers: "4",
      submittedAt: "2026-09-01",
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
      submittedAt: "2026-09-03",
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
      submittedAt: "2026-09-05",
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(hasSavedToken);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => tokenStorage.getUser());
  const [adminRole, setAdminRole] = useState<"superAdmin" | "admin" | null>(() => {
    const u = tokenStorage.getUser();
    return u?.role === "super_admin" ? "superAdmin" : u?.role === "admin" ? "admin" : null;
  });
  // If token exists, skip splash screen so admin directly lands on their dashboard!
  const [splashDone, setSplashDoneState] = useState<boolean>(hasSavedToken);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(DEFAULT_FAQ_ITEMS);
  const [aboutContent, setAboutContent] = useState("");
  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [tripInstances, setTripInstances] = useState<TripInstance[]>(INITIAL_TRIP_INSTANCES);
  const [reviews, setReviews] = useState<Review[]>(REVIEWS);
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(SEED_GALLERY_IMAGES);
  const [bookings, setBookings] = useState<Booking[]>([
    { id: "BK001", customerName: "Rahul Sharma", customerPhone: "+91 98765 43210", destination: "Chopta", tripName: "Chopta Tungnath Trek", tripDate: "Oct 15, 2026", travellers: [{ name: "Rahul Sharma", age: "28", gender: "Male" }, { name: "Anjali Sharma", age: "26", gender: "Female" }], totalAmount: "₹17,000", paymentStatus: "Paid", status: "Confirmed", bookingDate: "2026-09-10" },
    { id: "BK002", customerName: "Priya Nair", customerPhone: "+91 90011 22334", destination: "Rishikesh", tripName: "Rishikesh Rapids & Camping", tripDate: "Nov 8, 2026", travellers: [{ name: "Priya Nair", age: "24", gender: "Female" }], totalAmount: "₹6,999", paymentStatus: "Partial", status: "Confirmed", bookingDate: "2026-09-15" },
    { id: "BK003", customerName: "Ankit Gupta", customerPhone: "+91 97654 32109", destination: "Auli", tripName: "Auli Ski Adventure", tripDate: "Nov 20, 2026", travellers: [{ name: "Ankit Gupta", age: "32", gender: "Male" }, { name: "Sneha Gupta", age: "30", gender: "Female" }, { name: "Rohit Gupta", age: "8", gender: "Male" }], totalAmount: "₹43,500", paymentStatus: "Unpaid", status: "Confirmed", bookingDate: "2026-09-18" },
  ]);

  const navigate = useCallback((p: Page, params: { tripId?: string; destId?: string; tripInstanceId?: string; reviewToken?: string } = {}) => {
    setPage(p);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

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

  const openEnquiryModal = useCallback((tripId: string) => {
    setEnquiryTripId(tripId);
    setEnquiryModalOpen(true);
  }, []);

  const closeEnquiryModal = useCallback(() => {
    setEnquiryModalOpen(false);
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
      const refreshToken = tokenStorage.getRefreshToken();

      if (!accessToken && !refreshToken) {
        if (isMounted) {
          setAdminLoggedIn(false);
          setAdminUser(null);
          setAdminRole(null);
        }
        return;
      }

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
          // Access token might be expired, proceed to refresh below
        }
      }

      if (refreshToken) {
        try {
          const newTokens = await authApi.refresh(refreshToken);
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
            setPage("home");
          }
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
      setPage("admin");
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
    navigate("home");
  }, [navigate]);

  const setSplashDone = useCallback(() => setSplashDoneState(true), []);

  const addGalleryImage = useCallback((img: Omit<GalleryImage, "id" | "addedAt">) => {
    const id = `g${++galleryIdCounter}`;
    setGalleryImages((prev) => [...prev, { ...img, id, addedAt: new Date().toISOString().slice(0, 10) }]);
  }, []);

  const removeGalleryImage = useCallback((id: string) => {
    setGalleryImages((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const refreshDestinations = useCallback(async () => {
    try {
      const data = await destinationsApi.list({ includeArchived: tokenStorage.hasTokens() });
      if (data.destinations && data.destinations.length > 0) {
        setDestinations(data.destinations);
      }
    } catch (err) {
      console.warn("Failed to load destinations from backend:", err);
    }
  }, []);

  useEffect(() => {
    void refreshDestinations();
  }, [refreshDestinations, adminLoggedIn]);

  return (
    <AppContext.Provider value={{
      page, pageParams, navigate,
      savedItems, toggleSave, isSaved,
      enquiries, addEnquiry,
      enquiryModalOpen, enquiryTripId, openEnquiryModal, closeEnquiryModal,
      toasts, showToast,
      adminLoggedIn, adminRole, adminUser, adminLogin, adminLogout,
      splashDone, setSplashDone,
      destinations, setDestinations, refreshDestinations,
      trips, setTrips,
      tripInstances, setTripInstances,
      reviews, setReviews,
      homepageContent, setHomepageContent,
      faqItems, setFaqItems,
      aboutContent, setAboutContent,
      termsContent, setTermsContent,
      privacyContent, setPrivacyContent,
      galleryImages, addGalleryImage, removeGalleryImage,
      bookings, setBookings, addBooking,
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
