// lib/location.ts
export async function getLiveLocation(lat?: number, lng?: number): Promise<string> {
  try {
    if (lat && lng) {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.address?.city || data.address?.town || data.address?.village || "Unknown";
    }
    return "Delhi"; // fallback
  } catch (error) {
    console.error("Failed to get location from coordinates", error);
    return "Delhi"; // fallback
  }
}
