export interface DashboardKpiStats {
  totalEnquiries: number;
  newReceivedEnquiries: number;
  confirmedBookings: number;
  upcomingTrips: number;
  completedTrips: number;
}

export interface MonthlyEnquiryTrend {
  month: string;      // e.g. "Apr", "May"
  yearMonth: string;  // e.g. "2026-04"
  enquiries: number;
}

export interface DashboardUpcomingDeparture {
  id: string;
  tripId: string;
  tripName: string;
  tripImage: string | null;
  startsOn: string;
  endsOn: string | null;
  displayDate: string;
  spotsTotal: number;
  spotsBooked: number;
  spotsLeft: number;
  pricePaise: number;
  status: "upcoming" | "completed" | "cancelled";
}

export interface DashboardRecentEnquiry {
  id: string;
  enquiryNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  tripName: string;
  destination: string;
  travelDate: string;
  status: string;
  submittedAt: string;
}

export interface DashboardSummaryData {
  stats: DashboardKpiStats;
  monthlyTrends: MonthlyEnquiryTrend[];
  upcomingDepartures: DashboardUpcomingDeparture[];
  recentEnquiries: DashboardRecentEnquiry[];
}
