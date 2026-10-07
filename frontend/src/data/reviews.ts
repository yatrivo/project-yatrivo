export interface Review {
  id: string;
  name: string;
  tripName: string;
  tripId?: string;
  tripInstanceId?: string;
  destination: string;
  destinationId?: string;
  destinationSlug?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string;
  status: "published" | "hidden" | "pending";
  avatar: string;
  photos?: string[];
}

export const REVIEWS: Review[] = [];

