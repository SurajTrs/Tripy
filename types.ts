// app/types.ts

// Flight information structure
export interface FlightData {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirportIata: string;
  arrivalAirportIata: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  deeplink: string;
  stops: number;
}

// Hotel information structure
export interface HotelData {
  id: string;
  name: string;
  address: string;
  price: number;
  currency: string;
  rating?: number;
  imageUrl?: string;
  deeplink: string;
  category?: 'Luxury' | 'Medium' | 'Budget-friendly';
}

// ✅ Moved this above TripContext to avoid "Cannot find name" error
export type TripPlanData = {
  transport: FlightData;
  hotel: HotelData;
  cabToStation: { name: string; price: number; details: string };
  cabToHotel: { name: string; price: number; details: string };
  food?: string[];
  activities?: string[];
  groupSize?: number;
  total: number;
  availableFlights?: FlightData[] | null;
  availableHotels?: HotelData[] | null;
};

// Main TripContext type used in planning
export interface TripContext {
  from?: string;
  to?: string;
  date?: string;
  budget?: 'Luxury' | 'Medium' | 'Budget-friendly';
  groupSize?: number;
  mode?: 'Train' | 'Bus' | 'Flight';

  flight?: FlightData;
  hotel?: HotelData;
  lastPlannedTrip?: TripPlanData;
  ask?: keyof Omit<TripContext, 'lastPlannedTrip' | 'ask' | 'flight' | 'hotel'>;
}

// NLP Parser output
export type ParsedTripDetails = {
  intent: 'book_trip' | 'display_trip' | 'cancel_trip' | 'greet' | 'error' | 'unknown';
  message?: string;
  from: string | null;
  to: string | null;
  date: string | null;
  budget: 'Luxury' | 'Medium' | 'Budget-friendly' | null;
  mode: 'Train' | 'Bus' | 'Flight' | null;
  groupSize: number | null;
};
