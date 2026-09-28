import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/Toast";
import EnquiryModal from "@/components/EnquiryModal";
import SplashScreen from "@/components/SplashScreen";
import ScrollToTop from "@/components/ScrollToTop";

// Public pages
import HomePage from "@/pages/HomePage";
import DestinationsPage from "@/pages/DestinationsPage";
import DestinationDetailPage from "@/pages/DestinationDetailPage";
import TripsPage from "@/pages/TripsPage";
import TripDetailPage from "@/pages/TripDetailPage";
import PlanMyTripPage from "@/pages/PlanMyTripPage";
import AboutPage from "@/pages/AboutPage";
import ReviewsPage from "@/pages/ReviewsPage";
import ReviewPage from "@/pages/ReviewPage";
import FAQContactPage from "@/pages/FAQContactPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TravelWithUsPage from "@/pages/TravelWithUsPage";
import PastTripsPage from "@/pages/PastTripsPage";
import CompletedTripDetailPage from "@/pages/CompletedTripDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import CustomerBookingDetailsPage from "@/pages/CustomerBookingDetailsPage";
import NotFoundPage from "@/pages/NotFoundPage";

// Admin components
import AdminLogin from "@/admin/AdminLogin";
import AdminResetPassword from "@/admin/AdminResetPassword";
import AdminLayout from "@/admin/AdminLayout";
import AdminDashboard from "@/admin/AdminDashboard";
import AdminEnquiries from "@/admin/AdminEnquiries";
import AdminEnquiryDetail from "@/admin/AdminEnquiryDetail";
import AdminTrips from "@/admin/AdminTrips";
import AdminTripEditor from "@/admin/AdminTripEditor";
import AdminTripInstances from "@/admin/AdminTripInstances";
import AdminDepartureDetail from "@/admin/AdminDepartureDetail";
import AdminDestinations from "@/admin/AdminDestinations";
import AdminBookings from "@/admin/AdminBookings";
import AdminBookingDetail from "@/admin/AdminBookingDetail";
import AdminUsers from "@/admin/AdminUsers";
import AdminReviews from "@/admin/AdminReviews";
import AdminMedia from "@/admin/AdminMedia";
import AdminContent from "@/admin/AdminContent";
import AdminAnalytics from "@/admin/AdminAnalytics";
import AdminNotifications from "@/admin/AdminNotifications";
import AdminSettings from "@/admin/AdminSettings";
import AdminAuditLogs from "@/admin/AdminAuditLogs";

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ToastContainer />
      <EnquiryModal />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function ProtectedAdminRoute() {
  const { adminLoggedIn } = useApp();
  const location = useLocation();

  if (!adminLoggedIn) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?from=${from}`} replace />;
  }

  return (
    <>
      <ToastContainer />
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </>
  );
}

export default function App() {
  const { splashDone, setSplashDone } = useApp();

  if (!splashDone) {
    return <SplashScreen onDone={setSplashDone} />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Website Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:slug" element={<TripDetailPage />} />
          <Route path="/travel-with-us" element={<TravelWithUsPage />} />
          <Route path="/past-trips" element={<PastTripsPage />} />
          <Route path="/past-trips/:instanceId" element={<CompletedTripDetailPage />} />
          <Route path="/plan" element={<PlanMyTripPage />} />
          <Route path="/plan-trip" element={<Navigate to="/plan" replace />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reviews/new" element={<ReviewPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/faq" element={<FAQContactPage />} />
          <Route path="/contact" element={<Navigate to="/faq" replace />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          {/* User profile page hidden for now */}
          <Route path="/profile" element={<Navigate to="/" replace />} />
        </Route>

        {/* Public Secure Booking Details Form */}
        <Route path="/booking-details/:token" element={<CustomerBookingDetailsPage />} />

        {/* Admin Auth Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        <Route path="/admin/forgot-password" element={<Navigate to="/admin/login" replace />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedAdminRoute />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="enquiries/:id" element={<AdminEnquiryDetail />} />
          <Route path="trips" element={<AdminTrips />} />
          <Route path="trips/new" element={<AdminTripEditor />} />
          <Route path="trips/:id/edit" element={<AdminTripEditor />} />
          <Route path="trips/:slug" element={<TripDetailPage adminMode={true} />} />
          <Route path="trip-instances" element={<AdminTripInstances />} />
          <Route path="trip-instances/:id" element={<AdminDepartureDetail />} />
          <Route path="departures" element={<Navigate to="/admin/trip-instances" replace />} />
          <Route path="departures/:id" element={<AdminDepartureDetail />} />
          <Route path="destinations" element={<AdminDestinations />} />
          <Route path="destinations/:slug" element={<DestinationDetailPage adminMode={true} />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="bookings/:id" element={<AdminBookingDetail />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="content" element={<AdminContent />} />
          {/* Unlinked/hidden for now:
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="notifications" element={<AdminNotifications />} />
          */}
          <Route path="settings" element={<AdminSettings />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Global 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
