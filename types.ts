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
  // Add these for compatibility with TrainData and BusData
  departureCity?: string;
  arrivalCity?: string;
  departureDate?: string;
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
  location?: string; // Add this for Stripe checkout
}

// Cab information structure
export interface CabData {
  id: string;
  provider: string;
  cabType: string;
  price: number;
  currency: string;
  estimatedTime: string; // in minutes
  distance: string; // in km
  deeplink: string;
  name?: string; // For display in checkout
  details?: string; // For display in checkout
}

// Bus information structure
export interface BusData {
  id: string;
  operator: string;
  busType: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  availableSeats: number;
  amenities: string[];
  rating: number;
  deeplink: string;
}

// Train information structure
export interface TrainData {
  id: string;
  trainNumber: string;
  trainName: string;
  trainType: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  availableSeats: number;
  trainClass: string;
  platform: string;
  deeplink: string;
}

// ✅ Moved this above TripContext to avoid "Cannot find name" error
export type TripPlanData = {
  transport: FlightData | TrainData | BusData | null;
  transportType: 'flight' | 'train' | 'bus';
  hotel: HotelData;
  cabToStation: { name: string; price: number; details: string };
  cabToHotel: { name: string; price: number; details: string };
  food?: string[];
  activities?: string[];
  groupSize?: number;
  total: number;
  availableFlights?: FlightData[] | null;
  availableTrains?: TrainData[] | null;
  availableBuses?: BusData[] | null;
  availableHotels?: HotelData[] | null;
  returnTrip?: boolean;
  returnDate?: string;
  returnTransport?: FlightData | TrainData | BusData;
};

// Main TripContext type used in planning
export interface TripContext {
  from?: string;
  to?: string;
  date?: string;
  budget?: 'Luxury' | 'Medium' | 'Budget-friendly';
  groupSize?: number;
  mode?: 'Train' | 'Bus' | 'Flight';
  returnTrip?: boolean;
  returnDate?: string;
  // Additional properties for real-time pricing and booking
  origin?: string;
  destination?: string;
  departureDate?: string;
  transportType?: 'flight' | 'train' | 'bus';
  hotelNeeded?: boolean;
  cabToStationNeeded?: boolean;
  cabToHotelNeeded?: boolean;
  stripeSessionId?: string;

  flight?: FlightData;
  train?: TrainData;
  bus?: BusData;
  hotel?: HotelData;
  returnFlight?: FlightData;
  returnTrain?: TrainData;
  returnBus?: BusData;
  lastPlannedTrip?: TripPlanData;
  bookingReference?: string;
  ask?: keyof Omit<TripContext, 'lastPlannedTrip' | 'ask' | 'flight' | 'train' | 'bus' | 'hotel' | 'returnFlight' | 'returnTrain' | 'returnBus' | 'bookingReference'>;
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
  returnTrip: boolean | null;
  returnDate: string | null;
};
