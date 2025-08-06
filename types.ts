// app/types.ts

// Define a consistent interface for individual flight details
// This interface is well-defined, no changes needed here.
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
}

// Define a consistent interface for individual hotel details
// This interface is also well-defined, no changes needed.
export interface HotelData {
  id: string;
  name: string;
  address: string;
  price: number;
  currency: string;
  rating?: number; // e.g., 4.5
  imageUrl?: string;
  deeplink: string;
  category?: 'Luxury' | 'Medium' | 'Budget-friendly';
}

// This is the crucial definition for the state that is passed between the client and server.
export interface TripContext {
  from?: string; // City name
  to?: string;   // City name
  date?: string; // Format: YYYY-MM-DD
  budget?: 'Luxury' | 'Medium' | 'Budget-friendly';
  groupSize?: number;
  mode?: 'Train' | 'Bus' | 'Flight';
  
  // ---  NEW & IMPORTANT ---
  // These fields will store the user's selection from the available options.
  // When a user clicks on a flight from the list, we'll store its data here.
  flight?: FlightData;
  // When a user clicks on a hotel, we'll store its data here.
  hotel?: HotelData;

  lastPlannedTrip?: TripPlanData;
  ask?: keyof Omit<TripContext, 'lastPlannedTrip' | 'ask' | 'flight' | 'hotel'>;
}


// This represents the final, complete trip plan.
export type TripPlanData = {
  // We'll use the detailed interfaces for the selected transport and hotel
  transport: FlightData; // Changed to use the detailed FlightData interface
  hotel: HotelData;      // Changed to use the detailed HotelData interface
  
  // These remain the same
  cabToStation: { name: string; price: number; details: string };
  cabToHotel: { name:string; price: number; details: string };
  food?: string[];
  activities?: string[];
  groupSize?: number;
  total: number;
  
  // This part is for showing lists of options to the user during the planning process
  availableFlights?: FlightData[] | null;
  availableHotels?: HotelData[] | null;
};


// NLP Parser Output Type - No changes needed here.
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