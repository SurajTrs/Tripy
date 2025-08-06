// src/lib/cityToIataConverter.ts

// This is a simplified map. In a real-world application, you would:
// 1. Use a more comprehensive database (e.g., from an airports API like Amadeus, or a local JSON file).
// 2. Handle multiple airports per city (e.g., New York has JFK, LGA, EWR).
// 3. Implement fuzzy matching or suggest options if a city name is ambiguous.
const cityToIataMap: { [key: string]: string } = {
  "delhi": "DEL",
  "mumbai": "BOM",
  "bangalore": "BLR",
  "bengaluru": "BLR", // Alias for Bangalore
  "chennai": "MAA",
  "kolkata": "CCU",
  "hyderabad": "HYD",
  "goa": "GOI",
  "london": "LHR", // Example for international
  "new york": "JFK", // Example for international
  "singapore": "SIN", // Example for international
  "dubai": "DXB", // Example for international
  // Add more cities as needed
};

/**
 * Converts a city name to its corresponding IATA airport code.
 * This is a simplified lookup for demo purposes.
 *
 * @param cityName The name of the city (e.g., "Delhi", "Mumbai").
 * @returns The IATA code (e.g., "DEL") or null if not found.
 */
export async function getCityIataCode(cityName: string): Promise<string | null> {
  if (!cityName) {
    return null;
  }
  const normalizedCityName = cityName.toLowerCase().trim();
  const iataCode = cityToIataMap[normalizedCityName];

  if (iataCode) {
    console.log(`Converted city "${cityName}" to IATA code "${iataCode}"`);
    return iataCode;
  } else {
    console.warn(`No IATA code found for city: "${cityName}". Please add it to cityToIataMap.`);
    // In a real application, you might try a geocoding API to find nearby airports
    // or prompt the user for a more specific location.
    return null;
  }
}