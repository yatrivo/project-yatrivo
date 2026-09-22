import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Enquiry } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/Toast";
import EnquiryModal from "@/components/EnquiryModal";
import SplashScreen from "@/components/SplashScreen";
import HomePage from "@/pages/HomePage";
import DestinationsPage from "@/pages/DestinationsPage";
import DestinationDetailPage from "@/pages/DestinationDetailPage";
import TripsPage from "@/pages/TripsPage";
import TripDetailPage from "@/pages/TripDetailPage";
import PlanMyTripPage from "@/pages/PlanMyTripPage";
import AboutPage from "@/pages/AboutPage";
import ReviewsPage from "@/pages/ReviewsPage";
import FAQContactPage from "@/pages/FAQContactPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TravelWithUsPage from "@/pages/TravelWithUsPage";
import PastTripsPage from "@/pages/PastTripsPage";
import CompletedTripDetailPage from "@/pages/CompletedTripDetailPage";
import ReviewPage from "@/pages/ReviewPage";
import AdminLogin from "@/admin/AdminLogin";
import AdminLayout from "@/admin/AdminLayout";
import type { AdminPage } from "@/admin/AdminLayout";
import AdminDashboard from "@/admin/AdminDashboard";
import AdminEnquiries from "@/admin/AdminEnquiries";
import AdminEnquiryDetail from "@/admin/AdminEnquiryDetail";
import AdminTrips from "@/admin/AdminTrips";
import AdminTripEditor from "@/admin/AdminTripEditor";
import AdminDestinations from "@/admin/AdminDestinations";
import AdminBookings from "@/admin/AdminBookings";
import AdminUsers from "@/admin/AdminUsers";
import AdminReviews from "@/admin/AdminReviews";
import AdminMedia from "@/admin/AdminMedia";
import AdminContent from "@/admin/AdminContent";
import AdminAnalytics from "@/admin/AdminAnalytics";
import AdminNotifications from "@/admin/AdminNotifications";
import AdminTripInstances from "@/admin/AdminTripInstances";
import AdminSettings from "@/admin/AdminSettings";
import AdminAuditLogs from "@/admin/AdminAuditLogs";

export default function App() {
  const { page, navigate, adminLoggedIn, splashDone, setSplashDone } = useApp();
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  if (!splashDone) {
    return <SplashScreen onDone={setSplashDone} />;
  }

  // Admin flow
  if (page === "admin") {
    if (!adminLoggedIn) {
      return <AdminLogin />;
    }
    return (
      <>
        <ToastContainer />
        <AdminLayout adminPage={adminPage} setAdminPage={setAdminPage}>
          {adminPage === "dashboard" && <AdminDashboard setAdminPage={setAdminPage} />}
          {adminPage === "enquiries" && (
            <AdminEnquiries setAdminPage={setAdminPage} setSelectedEnquiry={setSelectedEnquiry} />
          )}
          {adminPage === "enquiry-detail" && (
            <AdminEnquiryDetail enquiry={selectedEnquiry} setAdminPage={setAdminPage} />
          )}
          {adminPage === "trips" && <AdminTrips setAdminPage={setAdminPage} />}
          {adminPage === "trip-editor" && <AdminTripEditor setAdminPage={setAdminPage} />}
          {adminPage === "destinations" && <AdminDestinations />}
          {adminPage === "bookings" && <AdminBookings />}
          {adminPage === "users" && <AdminUsers />}
          {adminPage === "reviews" && <AdminReviews />}
          {adminPage === "media" && <AdminMedia />}
          {adminPage === "content" && <AdminContent />}
          {adminPage === "analytics" && <AdminAnalytics />}
          {adminPage === "trip-instances" && <AdminTripInstances />}
          {adminPage === "notifications" && <AdminNotifications />}
          {adminPage === "settings" && <AdminSettings />}
          {adminPage === "audit-logs" && <AdminAuditLogs />}
        </AdminLayout>
      </>
    );
  }

  // Main site
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ToastContainer />
      <EnquiryModal />
      <main className="flex-1">
        {page === "home" && <HomePage />}
        {page === "destinations" && <DestinationsPage />}
        {page === "destination-detail" && <DestinationDetailPage />}
        {page === "trips" && <TripsPage />}
        {page === "trip-detail" && <TripDetailPage />}
        {page === "plan" && <PlanMyTripPage />}
        {page === "about" && <AboutPage />}
        {page === "reviews" && <ReviewsPage />}
        {page === "faq" && <FAQContactPage />}
        {page === "terms" && <TermsPage />}
        {page === "privacy" && <PrivacyPage />}
        {page === "travel-with-us" && <TravelWithUsPage />}
        {page === "past-trips" && <PastTripsPage />}
        {page === "completed-trip-detail" && <CompletedTripDetailPage />}
        {page === "review" && <ReviewPage />}
      </main>
    </div>
  );
}
