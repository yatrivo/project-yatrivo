import { authApi, tokenStorage } from "./auth";
import { API_BASE } from "./baseUrl";

export interface DashboardKpiStats {
  totalEnquiries: number;
  newReceivedEnquiries: number;
  confirmedBookings: number;
  upcomingTrips: number;
  completedTrips: number;
}

export interface MonthlyEnquiryTrend {
  month: string;
  yearMonth: string;
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

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const tokens = await authApi.refresh(refreshToken);
        headers.set("Authorization", `Bearer ${tokens.accessToken}`);
        res = await fetch(url, { ...options, headers });
      } catch {
        // Refresh failed
      }
    }
  }

  return res;
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummaryData> {
    const url = `${API_BASE}/api/v1/admin/dashboard`;
    const res = await authFetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to fetch dashboard summary");
    }
    return body.data as DashboardSummaryData;
  }
};
