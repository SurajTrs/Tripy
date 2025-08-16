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
    const flights: FlightData[] = result.data.slice(0, 5).map((flight: any, index: number) => {
      // Calculate real duration if we have both departure and arrival times
      let duration = '3h 15m'; // Default
      if (flight.departure?.scheduled && flight.arrival?.scheduled) {
        const depTime = new Date(flight.departure.scheduled);
        const arrTime = new Date(flight.arrival.scheduled);
        const diffMs = arrTime.getTime() - depTime.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${hours}h ${minutes}m`;
      }

      // Generate realistic pricing based on route and airline
      const basePrice = 4500;
      const distanceMultiplier = getDistanceMultiplier(originIata, destinationIata);
      const airlineMultiplier = getAirlineMultiplier(flight.airline?.name);
      const price = Math.floor(basePrice * distanceMultiplier * airlineMultiplier * (0.8 + Math.random() * 0.4));

      return {
        id: flight.flight?.iata || `flight_${index}`,
        airline: flight.airline?.name || 'Unknown Airline',
        flightNumber: flight.flight?.number || 'N/A',
        departureAirportIata: flight.departure?.iata,
        arrivalAirportIata: flight.arrival?.iata,
        departureTime: flight.departure?.scheduled ? new Date(flight.departure.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        arrivalTime: flight.arrival?.scheduled ? new Date(flight.arrival.scheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        duration,
        price,
        currency: 'INR',
        deeplink: `https://www.google.com/flights?q=flights+from+${originIata}+to+${destinationIata}`, // Example deeplink
        stops: flight.departure?.delay != null ? 1 : 0, // Example logic for stops
      };
    });

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
        'hyderabad': 'HYD',
        'pune': 'PNQ',
        'ahmedabad': 'AMD',
        'jaipur': 'JAI',
        'lucknow': 'LKO',
        // Add more cities as needed
    };
    return iataMap[cityLower] || null;
}

// Helper function to calculate distance multiplier for pricing
function getDistanceMultiplier(origin: string, destination: string): number {
    const distances: { [key: string]: number } = {
        'DEL-BOM': 1.2, 'DEL-BLR': 1.4, 'DEL-MAA': 1.6, 'DEL-CCU': 1.1,
        'BOM-DEL': 1.2, 'BOM-BLR': 1.1, 'BOM-MAA': 1.3, 'BOM-CCU': 1.5,
        'BLR-DEL': 1.4, 'BLR-BOM': 1.1, 'BLR-MAA': 1.0, 'BLR-CCU': 1.4,
        'MAA-DEL': 1.6, 'MAA-BOM': 1.3, 'MAA-BLR': 1.0, 'MAA-CCU': 1.5,
        'CCU-DEL': 1.1, 'CCU-BOM': 1.5, 'CCU-BLR': 1.4, 'CCU-MAA': 1.5,
    };
    
    const route = `${origin}-${destination}`;
    return distances[route] || 1.2; // Default multiplier
}

// Helper function to calculate airline multiplier for pricing
function getAirlineMultiplier(airline: string): number {
    const airlineMultipliers: { [key: string]: number } = {
        'Air India': 1.1,
        'IndiGo': 0.9,
        'SpiceJet': 0.85,
        'Vistara': 1.0,
        'AirAsia India': 0.8,
        'GoAir': 0.9,
        'Jet Airways': 1.2,
        'Kingfisher Airlines': 1.1,
    };
    
    return airlineMultipliers[airline] || 1.0; // Default multiplier
}
