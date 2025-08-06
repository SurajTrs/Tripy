// app/types.ts

// Define a consistent interface for individual flight details
export interface FlightData {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirportIata: string;
  arrivalAirportIata: string;
  departureTime: string; // e.g., "14:30"
  arrivalTime: string;   // e.g., "17:45"
  duration: string;      // e.g., "3h 15m"
  price: number;
  currency: string;
  deeplink: string;
  stops: number;
  // Add any other relevant fields like baggage info, layovers, etc.
}

// Define a consistent interface for individual hotel details
export interface HotelData {
  id: string;
  name: string;
  address: string; // Added for more detail
  price: number;
  currency: string;
  rating?: number; // e.g., 4.5
  imageUrl?: string;
  deeplink: string;
  category?: 'Luxury' | 'Medium' | 'Budget-friendly'; // Added for consistent budget filtering/display
  // Add any other relevant fields like amenities, review count, etc.
}

export type TripPlanData = {
  cabToStation: { name: string; price: number; details: string };
  transport: {
    mode?: 'Train' | 'Bus' | 'Flight';
    name: string;
    from: string; // Origin city name
    to: string;   // Destination city name
    date: string; // Format: YYYY-MM-DD
    price: number;
    currency?: string;
    deeplink?: string;
    details?: string;
    error?: string; // To indicate if transport search failed
  };
  cabToHotel: { name: string; price: number; details: string };
  hotel: { // This will now fully align with HotelData
    name: string;
    price: number;
    category?: 'Luxury' | 'Medium' | 'Budget-friendly';
    rating?: number;
    deeplink?: string;
    error?: string; // To indicate if hotel search failed
    id?: string; // Optional, if you want to store the ID of the selected hotel
    address?: string; // Ensure address is present for the selected hotel
    imageUrl?: string; // Ensure image is present for the selected hotel
  };
  food?: string[];
  activities?: string[];
  groupSize?: number;
  total: number;
  bookingLinks: {
    flight: string | null;
    hotel: string | null;
    train?: string | null;
    bus?: string | null;
  };
  availableFlights?: FlightData[] | null; // Use the dedicated FlightData interface
  availableHotels?: HotelData[] | null;   // Use the dedicated HotelData interface
};

// This is the crucial definition for TripContext - remains largely the same
export interface TripContext {
  from?: string; // City name
  to?: string;   // City name
  date?: string; // Format: YYYY-MM-DD (after parsing)
  budget?: 'Luxury' | 'Medium' | 'Budget-friendly';
  groupSize?: number;
  mode?: 'Train' | 'Bus' | 'Flight';
  lastPlannedTrip?: TripPlanData; // This should be optional
  ask?: keyof Omit<TripContext, 'lastPlannedTrip' | 'ask'>; // Refined type for 'ask' property
}

// NLP Parser Output Type
// This type reflects the direct output from your Gemini NLP parser
export type ParsedTripDetails = {
  intent: 'book_trip' | 'display_trip' | 'cancel_trip' | 'greet' | 'error' | 'unknown';
  message?: string; // An optional message from the NLP if there's an error or specific intent response
  from: string | null;
  to: string | null;
  date: string | null;
  budget: 'Luxury' | 'Medium' | 'Budget-friendly' | null;
  mode: 'Train' | 'Bus' | 'Flight' | null;
  groupSize: number | null;
};