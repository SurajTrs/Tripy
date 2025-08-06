// src/lib/flightApi.ts
import { FlightData } from '../types';

// This interface defines the structure of the search parameters
interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
}

// This is the main function that will be called from your API route
export async function searchFlights(params: FlightSearchParams): Promise<FlightData[]> {
  // 1. Check for the API Key from your .env.local file
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) {
    // If the key is missing, throw an error to stop the process
    throw new Error('Flight API credentials are not configured.');
  }

  try {
    // 2. We need to convert city names (like "delhi") to IATA codes (like "DEL").
    // For this example, we'll use a simple hardcoded mapping.
    // In a real app, you might use another API for this conversion.
    const originIata = getIataCode(params.origin);
    const destinationIata = getIataCode(params.destination);

    if (!originIata || !destinationIata) {
      throw new Error('Could not find airport code for the specified city.');
    }

    // 3. Construct the API URL with the search parameters
    const apiUrl = `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${originIata}&arr_iata=${destinationIata}`;

    // 4. Make the actual API call
    const response = await fetch(apiUrl);
    const result = await response.json();

    if (!response.ok || !result.data) {
      console.error("AviationStack API Error:", result.error?.info);
      throw new Error(result.error?.info || 'Failed to fetch flight data.');
    }

    // 5. Format the API response to match your app's FlightData interface
    // The free AviationStack plan often returns limited live data, so we map what we can
    // and add some mock data for fields that might be missing.
    const flights: FlightData[] = result.data.slice(0, 5).map((flight: any, index: number) => ({
      id: flight.flight.iata || `flight_${index}`,
      airline: flight.airline.name || 'Unknown Airline',
      flightNumber: flight.flight.number || 'N/A',
      departureAirportIata: flight.departure.iata,
      arrivalAirportIata: flight.arrival.iata,
      departureTime: new Date(flight.departure.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      arrivalTime: new Date(flight.arrival.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: '3h 15m', // Mock data
      price: Math.floor(Math.random() * (8000 - 4500 + 1)) + 4500, // Mock price
      currency: 'INR',
      deeplink: `https://www.google.com/flights?q=flights+from+${originIata}+to+${destinationIata}`, // Example deeplink
      stops: flight.departure.delay != null ? 1 : 0, // Example logic for stops
    }));

    return flights;

  } catch (error) {
    console.error('Error in searchFlights:', error);
    // Re-throw the error so the API route can handle it
    throw error;
  }
}

// Helper function to get IATA codes.
function getIataCode(city: string): string | null {
    const cityLower = city.toLowerCase();
    const iataMap: { [key: string]: string } = {
        'delhi': 'DEL',
        'mumbai': 'BOM',
        'bengaluru': 'BLR',
        'chennai': 'MAA',
        'kolkata': 'CCU',
        // Add more cities as needed
    };
    return iataMap[cityLower] || null;
}
