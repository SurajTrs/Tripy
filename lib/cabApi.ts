// lib/cabApi.ts
import { getUberRideEstimates } from './getUberRideEstimates';

// This interface defines the structure of the search parameters
interface CabSearchParams {
  origin: {
    lat: number;
    lng: number;
    name: string;
  };
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  passengers: number;
}

// This interface defines the structure of the cab data
export interface CabData {
  id: string;
  provider: string;
  cabType: string;
  price: number;
  currency: string;
  estimatedTime: string; // in minutes
  distance: string; // in km
  deeplink: string;
}

// This is the main function that will be called from your API route
export async function searchCabs(params: CabSearchParams): Promise<CabData[]> {
  try {
    // Check if we have Uber API credentials
    const uberClientId = process.env.UBER_CLIENT_ID;
    const uberClientSecret = process.env.UBER_CLIENT_SECRET;
    
    if (uberClientId && uberClientSecret) {
      // In a real implementation, you would get the access token from a session or generate one
      // For now, we'll use a mock token
      const mockAccessToken = 'mock_access_token';
      
      try {
        // Try to get real Uber estimates
        const uberEstimates = await getUberRideEstimates(
          mockAccessToken,
          params.origin.lat,
          params.origin.lng,
          params.destination.lat,
          params.destination.lng
        );
        
        // Transform Uber estimates to CabData format
        if (uberEstimates && uberEstimates.prices && uberEstimates.prices.length > 0) {
          return uberEstimates.prices.map((estimate: any) => ({
            id: `UBER-${estimate.product_id}`,
            provider: 'Uber',
            cabType: estimate.display_name,
            price: estimate.estimate.split('-')[0].replace(/\D/g, ''),
            currency: 'INR',
            estimatedTime: Math.round(estimate.duration / 60).toString(),
            distance: (estimate.distance).toFixed(1),
            deeplink: `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${params.origin.lat}&pickup[longitude]=${params.origin.lng}&pickup[nickname]=${encodeURIComponent(params.origin.name)}&dropoff[latitude]=${params.destination.lat}&dropoff[longitude]=${params.destination.lng}&dropoff[nickname]=${encodeURIComponent(params.destination.name)}`
          }));
        }
      } catch (error) {
        console.error('Error fetching Uber estimates:', error);
        // Fall back to mock data if Uber API fails
      }
    }
    
    // If we don't have Uber credentials or the API call failed, generate mock data
    return generateMockCabs(params.origin.name, params.destination.name, params.passengers);
  } catch (error: any) {
    console.error('Cab API Error:', error);
    throw new Error(`Failed to fetch cab data: ${error.message}`);
  }
}

// Helper function to generate mock cab data
function generateMockCabs(origin: string, destination: string, passengers: number): CabData[] {
  const cabs: CabData[] = [];
  const providers = ['Uber', 'Ola', 'Meru', 'BluSmart', 'Rapido'];
  
  const cabTypes = {
    'Uber': ['UberGo', 'Premier', 'UberXL', 'UberAuto', 'UberMoto'],
    'Ola': ['Mini', 'Sedan', 'Prime', 'SUV', 'Auto'],
    'Meru': ['Hatchback', 'Sedan', 'SUV'],
    'BluSmart': ['Electric Sedan', 'Electric SUV'],
    'Rapido': ['Bike', 'Auto']
  };
  
  // Generate random distance between 5 and 30 km
  const distance = (5 + Math.random() * 25).toFixed(1);
  
  // Generate 5-8 random cabs
  const numCabs = 5 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < numCabs; i++) {
    // Select random provider
    const provider = providers[Math.floor(Math.random() * providers.length)];
    
    // Select random cab type for the provider
    const cabType = cabTypes[provider as keyof typeof cabTypes][Math.floor(Math.random() * cabTypes[provider as keyof typeof cabTypes].length)];
    
    // Generate base price based on distance and cab type
    let basePrice = Math.round((parseFloat(distance) * (20 + Math.random() * 15)) * 10) / 10;
    
    // Adjust price based on cab type
    if (cabType.includes('SUV') || cabType.includes('XL')) {
      basePrice *= 1.5;
    } else if (cabType.includes('Premier') || cabType.includes('Sedan')) {
      basePrice *= 1.2;
    } else if (cabType.includes('Auto') || cabType.includes('Bike') || cabType.includes('Moto')) {
      basePrice *= 0.7;
    }
    
    // Round to nearest 10
    const price = Math.round(basePrice / 10) * 10;
    
    // Generate estimated time based on distance (assume average speed of 30 km/h)
    const estimatedTime = Math.round(parseFloat(distance) * 2);
    
    cabs.push({
      id: `${provider.toUpperCase()}-${Date.now()}-${i}`,
      provider,
      cabType,
      price,
      currency: 'INR',
      estimatedTime: estimatedTime.toString(),
      distance,
      deeplink: `https://example.com/book-cab/${provider.toLowerCase()}/${origin.toLowerCase()}-${destination.toLowerCase()}`
    });
  }
  
  // Sort cabs by price (lowest first)
  return cabs.sort((a, b) => a.price - b.price);
}

// Function to book a cab (mock implementation)
export async function bookCab(cabId: string, origin: any, destination: any, passengers: number, userDetails: any): Promise<any> {
  // In a real implementation, you would make an API call to the cab booking provider
  // For now, we'll simulate a booking process
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // 85% success rate
  const success = Math.random() > 0.15;
  
  if (!success) {
    throw new Error('Cab booking failed - no drivers available');
  }
  
  // Generate random driver details
  const driverNames = ['Rahul', 'Amit', 'Suresh', 'Rajesh', 'Vikram', 'Sanjay', 'Anil', 'Dinesh'];
  const driverName = driverNames[Math.floor(Math.random() * driverNames.length)] + ' ' + 
                     String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '.';  
  
  const vehicleTypes = ['Swift Dzire', 'Wagon R', 'Alto', 'Innova', 'Ertiga', 'i10', 'i20', 'Verna'];
  const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
  
  const vehicleNumber = `${['DL', 'MH', 'KA', 'TN', 'UP', 'HR'][Math.floor(Math.random() * 6)]}${Math.floor(Math.random() * 100)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000)}`;
  
  return {
    bookingId: `CAB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    status: 'confirmed',
    cabId,
    driverDetails: {
      name: driverName,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      vehicleNumber,
      vehicleType
    },
    pickupTime: `${Math.floor(Math.random() * 10) + 2} mins`,
    fare: Math.floor(Math.random() * 500) + 200,
    currency: 'INR'
  };
}