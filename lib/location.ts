// lib/location.ts
// This uses OpenStreetMap's Nominatim service for reverse geocoding.
// Be mindful of their usage policy (https://operations.osmfoundation.org/policies/nominatim/) if you're expecting high volume.
export async function getLiveLocation(lat?: number, lng?: number): Promise<string> {
  try {
    // Only proceed if both latitude and longitude are provided
    if (lat != null && lng != null) {
      // Use a higher zoom level to ensure we get a city/town result
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
      if (!response.ok) {
        throw new Error(`Location API request failed with status ${response.status}`);
      }
      const data = await response.json();
      // Prioritize city, then town, then village, then suburb, then a general address component
      return data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.road || "Unknown Location";
    }
    // Fallback if no coordinates are provided
    // Context from the prompt: "Remember the current location is Delhi, Delhi, India."
    return "Delhi";
  } catch (error) {
    console.error("Failed to get location from coordinates:", error);
    return "Delhi"; // Fallback on error
  }
}