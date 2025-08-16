// lib/busApi.ts
import { BusData } from '../types';

// This interface defines the structure of the search parameters
interface BusSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: number;
}

// This is the main function that will be called from your API route
export async function searchBuses(params: BusSearchParams): Promise<BusData[]> {
  // Check for the API Key from your .env.local file
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = 'redbus-api.p.rapidapi.com'; // Example API host for RedBus
  
  if (!apiKey) {
    // If the key is missing, throw an error to stop the process
    throw new Error('Bus API credentials are not configured.');
  }

  try {
    // In a real implementation, you would make an API call to RedBus or another provider
    // For now, we'll generate mock data that mimics what a real API might return
    return generateMockBuses(params.origin, params.destination, params.departureDate, params.passengers);
  } catch (error: any) {
    console.error('Bus API Error:', error);
    throw new Error(`Failed to fetch bus data: ${error.message}`);
  }
}

// Helper function to generate mock bus data
function generateMockBuses(origin: string, destination: string, date: string, passengers: number): BusData[] {
  const buses: BusData[] = [];
  const operators = [
    'RedBus Express',
    'AbhiBus Travels',
    'eTravelSmart',
    'Travelyaari',
    'TicketGoose',
    'KSRTC',
    'MSRTC',
    'GSRTC',
    'TNSTC',
    'UPSRTC'
  ];
  
  const busTypes = [
    'Volvo A/C Sleeper',
    'Mercedes Multi-Axle',
    'Volvo A/C Seater',
    'Non A/C Sleeper',
    'Non A/C Seater',
    'Deluxe',
    'Super Deluxe',
    'Ultra Deluxe',
    'Semi Sleeper'
  ];
  
  const amenities = [
    'WiFi',
    'Charging Point',
    'Water Bottle',
    'Blanket',
    'Reading Light',
    'Snacks',
    'TV',
    'Emergency Exit',
    'CCTV'
  ];
  
  // Generate 5-10 random buses
  const numBuses = 5 + Math.floor(Math.random() * 6);
  
  for (let i = 0; i < numBuses; i++) {
    // Generate random departure time between 6 AM and 11 PM
    const departureHour = 6 + Math.floor(Math.random() * 18);
    const departureMinute = Math.floor(Math.random() * 60);
    const departureTime = `${departureHour.toString().padStart(2, '0')}:${departureMinute.toString().padStart(2, '0')}`;
    
    // Generate random duration between 3 and 12 hours
    const durationHours = 3 + Math.floor(Math.random() * 10);
    const durationMinutes = Math.floor(Math.random() * 60);
    
    // Calculate arrival time
    const arrivalHour = (departureHour + durationHours) % 24;
    const arrivalMinute = (departureMinute + durationMinutes) % 60;
    const arrivalTime = `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}`;
    
    // Generate random price between 500 and 2500
    const basePrice = 500 + Math.floor(Math.random() * 2000);
    
    // Select random operator and bus type
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const busType = busTypes[Math.floor(Math.random() * busTypes.length)];
    
    // Select 2-5 random amenities
    const numAmenities = 2 + Math.floor(Math.random() * 4);
    const busAmenities: string[] = [];
    for (let j = 0; j < numAmenities; j++) {
      const amenity = amenities[Math.floor(Math.random() * amenities.length)];
      if (!busAmenities.includes(amenity)) {
        busAmenities.push(amenity);
      }
    }
    
    // Generate random available seats between 5 and 40
    const availableSeats = 5 + Math.floor(Math.random() * 36);
    
    // Generate random ratings between 3.0 and 5.0
    const rating = (3 + Math.random() * 2).toFixed(1);
    
    buses.push({
      id: `BUS-${Date.now()}-${i}`,
      operator: operator,
      busType: busType,
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      duration: `${durationHours}h ${durationMinutes}m`,
      price: basePrice,
      currency: 'INR',
      departureCity: origin,
      arrivalCity: destination,
      departureDate: date,
      availableSeats: availableSeats,
      amenities: busAmenities,
      rating: parseFloat(rating),
      deeplink: `https://example.com/book-bus/${operator.toLowerCase().replace(/\s+/g, '-')}/${date}/${origin.toLowerCase()}-${destination.toLowerCase()}`,
    });
  }
  
  // Sort buses by price (lowest first)
  return buses.sort((a, b) => a.price - b.price);
}

// Function to book a bus ticket (mock implementation)
export async function bookBus(busData: BusData | string, userDetails: any, passengers: number, isReturn: boolean = false): Promise<any> {
  // Extract busId from either a string or BusData object
  const busId = typeof busData === 'string' ? busData : busData.id;
  
  // In a real implementation, you would make an API call to the bus booking provider
  // For now, we'll simulate a booking process
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  // 90% success rate
  const success = Math.random() > 0.1;
  
  if (!success) {
    throw new Error(`${isReturn ? 'Return bus' : 'Bus'} booking failed - no seats available`);
  }
  
  return {
    type: 'bus',
    isReturn,
    bookingId: `BUS-${isReturn ? 'RET-' : ''}${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    pnr: `PNR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    status: 'confirmed',
    busId,
    passengers,
    totalAmount: typeof busData === 'object' ? busData.price * passengers : 0, // Calculate based on the actual bus price if available
  };
}