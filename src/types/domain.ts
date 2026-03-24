export interface VenueProfile {
  id: string;
  name: string;
  city: string;
  capacity?: number;
}

export interface PerformerProfile {
  id: string;
  stageName: string;
  genres: string[];
  baseRate?: number;
}

export interface BookingRequest {
  id: string;
  venueId: string;
  performerId: string;
  eventDate: string;
  status: "pending" | "accepted" | "declined" | "completed" | "canceled";
}

export interface PerformanceSignal {
  bookingId: string;
  showedUp: boolean;
  crowdDrawEstimate?: number;
  venueRating?: number;
}

export interface Subscription {
  id: string;
  venueId: string;
  plan: "free" | "pro";
  status: "active" | "inactive" | "canceled";
}
