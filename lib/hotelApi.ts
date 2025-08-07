// src/lib/hotelApi.ts
// This file integrates with the Hotels.com Provider API on RapidAPI for hotel search.

import { HotelData } from '../types'; // Import the consistent HotelData interface
import dotenv from 'dotenv';
dotenv.config();

export interface HotelSearchOptions {
  destination: string; // City name like "Prague"
  checkInDate: string; // Format: YYYY-MM-DD
  checkOutDate: string; // Format: YYYY-MM-DD - CRITICAL: Ensure this is correctly calculated/provided
  adults?: number;
  budget?: "Luxury" | "Medium" | "Budget-friendly"; // For filtering
}

/**
 * Searches for regions using the Hotels.com Provider API to get a region ID.
 * @param query The city name or search query.
 * @returns A promise that resolves to an array of region data.
 */
export async function fetchRegions(query: string): Promise<any[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const hotelApiHost = process.env.HOTEL_API_HOST; // e.g., 'hotels-com-provider.p.rapidapi.com'

  if (!rapidApiKey || !hotelApiHost) {
    console.error("RAPIDAPI_KEY or HOTEL_API_HOST is not set in your environment variables.");
    throw new Error("Hotel API credentials are not configured.");
  }

  // NOTE: 'domain=IN' and 'locale=en_IN' target the Indian market. Adjust as needed.
  const url = `https://${hotelApiHost}/v2/regions?query=${encodeURIComponent(query)}&domain=IN&locale=en_IN`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": hotelApiHost,
        "x-rapidapi-key": rapidApiKey,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to fetch regions (status ${response.status}):`, errorBody);
      throw new Error(`Failed to fetch regions: ${response.statusText}. Details: ${errorBody.substring(0, 200)}`);
    }

    const data = await response.json();
    // Assuming the regions are in data.data array
    return data?.data ?? [];
  } catch (error) {
    console.error("Error in fetchRegions:", error);
    throw new Error(`Could not retrieve region information: ${(error as Error).message}`);
  }
}

/**
 * Converts a city name to a Hotels.com region ID using the fetchRegions function.
 * @param destination The city name (e.g., "Delhi").
 * @returns The region ID (gaiaId) or null if not found.
 */
async function getRegionId(destination: string): Promise<string | null> {
  try {
    const regions = await fetchRegions(destination);
    const firstMatch = regions?.[0]; // Take the first matched region
    if (firstMatch) {
      console.log(`Found region ID for "${destination}": ${firstMatch.gaiaId}`);
      return firstMatch.gaiaId || null;
    }
    console.warn(`No region ID found for destination: "${destination}"`);
    return null;
  } catch (error) {
    console.error(`Error getting region ID for "${destination}":`, error);
    return null;
  }
}

/**
 * Searches for hotels using the Hotels.com Provider API with a given region ID.
 * Applies budget filtering after fetching results.
 * @param options Hotel search criteria including destination, dates, adults, and budget.
 * @returns A promise that resolves to an array of HotelData.
 */
export async function searchHotels(options: HotelSearchOptions): Promise<HotelData[]> {
  const regionId = await getRegionId(options.destination);
  if (!regionId) {
    console.warn("Hotel search aborted: No region ID obtained.");
    return [];
  }

  const hotelApiHost = process.env.HOTEL_API_HOST; // e.g., 'hotels-com-provider.p.rapidapi.com'

  // Ensure checkInDate and checkOutDate are valid and provided
  if (!options.checkInDate || !options.checkOutDate) {
      console.error("Check-in or check-out date is missing for hotel search.");
      return [];
  }

  // Construct URL with parameters.
  // NOTE: 'sort_order=PRICE' is a good default. Add 'adults_number', 'domain', 'locale' etc.
  const url = `https://${hotelApiHost}/v2/hotels/search?region_id=${regionId}&checkin_date=${options.checkInDate}&checkout_date=${options.checkOutDate}&adults_number=${options.adults || 1}&domain=IN&locale=en_IN&sort_order=PRICE`;

  try {
   const response = await fetch(url, {
  method: "GET",
  headers: {
    "x-rapidapi-host": process.env.RAPID_API_HOST || "",
    "x-rapidapi-key": process.env.RAPID_API_KEY || "",
  },
});


    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Hotel API fetch failed (status ${response.status}):`, errorBody);
      throw new Error(`Failed to fetch hotels: ${response.statusText}. Details: ${errorBody.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log("Raw Hotel API response:", JSON.stringify(data, null, 2)); // Log raw response for debugging

    // The actual list of properties is usually within a 'properties' array in the response
    let hotelList: any[] = data?.properties ?? [];

    // --- Apply Budget Filtering ---
    if (options.budget) {
        hotelList = hotelList.filter(hotel => {
            const price = hotel.price?.lead?.amount; // Assuming this path for price
            if (typeof price !== 'number' || price <= 0) return false; // Filter out hotels with no valid price

            if (options.budget === 'Luxury') {
                return price >= 5000; // Example: Luxury is >= 5000 INR
            } else if (options.budget === 'Medium') {
                return price >= 2000 && price < 5000; // Example: Medium is 2000-4999 INR
            } else if (options.budget === 'Budget-friendly') {
                return price < 2000; // Example: Budget-friendly is < 2000 INR
            }
            return true; // Should not happen if budget is one of the defined types
        });
        console.log(`Filtered hotels by budget (${options.budget}). Remaining: ${hotelList.length}`);
    }

    // Map the filtered API response to your consistent HotelData interface
    const results: HotelData[] = hotelList.map((hotel: any) => {
        // IMPORTANT: Adjust these paths to match the EXACT structure of Hotels.com Provider API response
        const deeplink = hotel.optimizedReferrer?.appLink || hotel.optimizedReferrer?.webLink || `#`;
        if (deeplink === '#') {
            console.warn(`No valid deeplink found for hotel "${hotel.name}". Using placeholder.`);
        }

        return {
            id: hotel.id?.toString() || `hotel-${Math.random().toString(36).substring(7)}`, // Ensure string ID
            name: hotel.name || 'Unknown Hotel',
            address: hotel.neighborhood || hotel.address?.addressLine || 'No address available',
            price: hotel.price?.lead?.amount || 0, // Ensure price is a number
            currency: hotel.price?.lead?.currency || 'INR', // Ensure currency is a string
            rating: hotel.reviews?.score || null, // Assuming reviews.score for rating
            imageUrl: hotel.propertyImage?.image?.url || `https://placehold.co/400x200/cccccc/000000?text=Hotel+Image`, // Placeholder if no image
            deeplink: deeplink, // The actual booking link
            category: options.budget, // Assign the requested budget category for consistent display
        };
    }).filter((h: HotelData) => h.price > 0); // Filter out hotels with no valid price after mapping

    // Ensure results are sorted by price (ascending) as a final step
    results.sort((a, b) => a.price - b.price);

    return results;

  } catch (error) {
    console.error("Error in searchHotels:", error);
    throw new Error(`Could not retrieve hotel information at this time. Please try again later. ${(error as Error).message}`);
  }
}