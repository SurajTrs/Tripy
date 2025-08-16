// lib/train.ts
import { TrainData } from '../types';

// This interface defines the structure of the search parameters
interface TrainSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: number;
}

// This is the main function that will be called from your API route
export async function searchTrains(params: TrainSearchParams): Promise<TrainData[]> {
  // Check for the API Key from your .env.local file
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = 'irctc1.p.rapidapi.com'; // Example API host for IRCTC
  
  if (!apiKey) {
    // If the key is missing, throw an error to stop the process
    throw new Error('Train API credentials are not configured.');
  }

  try {
    // In a real implementation, you would make an API call to IRCTC or another provider
    // For now, we'll generate mock data that mimics what a real API might return
    return generateMockTrains(params.origin, params.destination, params.departureDate, params.passengers);
  } catch (error: any) {
    console.error('Train API Error:', error);
    throw new Error(`Failed to fetch train data: ${error.message}`);
  }
}

// Helper function to generate mock train data
function generateMockTrains(origin: string, destination: string, departureDate: string, passengers: number): TrainData[] {
  const trainNames = [
    `${destination} Express`,
    `${origin} - ${destination} Shatabdi`,
    `${origin} - ${destination} Rajdhani`,
    `${origin} - ${destination} Duronto`,
    `${origin} - ${destination} Superfast`,
  ];
  
  const trainTypes = ['Superfast', 'Express', 'Passenger', 'Shatabdi', 'Rajdhani', 'Duronto'];
  const trainClasses = ['1A', '2A', '3A', 'SL', 'CC', 'EC'];
  
  // Parse the departure date
  const depDate = new Date(departureDate);
  
  // Generate 3-5 train options
  const numTrains = Math.floor(Math.random() * 3) + 3;
  const trains: TrainData[] = [];
  
  for (let i = 0; i < numTrains; i++) {
    // Generate departure time (between 6 AM and 10 PM)
    const depHour = 6 + Math.floor(Math.random() * 16);
    const depMinute = Math.floor(Math.random() * 60);
    const depTime = new Date(depDate);
    depTime.setHours(depHour, depMinute, 0, 0);
    
    // Generate duration (between 3 and 12 hours)
    const durationHours = 3 + Math.floor(Math.random() * 9);
    const durationMinutes = Math.floor(Math.random() * 60);
    
    // Calculate arrival time
    const arrTime = new Date(depTime);
    arrTime.setHours(arrTime.getHours() + durationHours, arrTime.getMinutes() + durationMinutes);
    
    // Generate price (between 800 and 3000 INR)
    const basePrice = 800 + Math.floor(Math.random() * 2200);
    
    // Generate train number (5 digits)
    const trainNumber = `${10000 + Math.floor(Math.random() * 90000)}`;
    
    // Select random train name, type, and class
    const trainName = trainNames[Math.floor(Math.random() * trainNames.length)];
    const trainType = trainTypes[Math.floor(Math.random() * trainTypes.length)];
    const trainClass = trainClasses[Math.floor(Math.random() * trainClasses.length)];
    
    // Generate available seats (between 10 and 200)
    const availableSeats = 10 + Math.floor(Math.random() * 190);
    
    trains.push({
      id: `TRAIN-${trainNumber}`,
      trainNumber,
      trainName,
      trainType,
      departureTime: depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      arrivalTime: arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: `${durationHours}h ${durationMinutes}m`,
      price: basePrice,
      currency: 'INR',
      departureCity: origin,
      arrivalCity: destination,
      departureDate: depDate.toISOString().split('T')[0],
      availableSeats,
      trainClass,
      platform: `${1 + Math.floor(Math.random() * 10)}`,
      deeplink: `https://www.irctc.co.in/nget/train-search`,
    });
  }
  
  return trains;
}

// Function to book a train ticket (mock implementation)
export async function bookTrain(trainData: TrainData | string, userDetails: any, passengers: number, isReturn: boolean = false): Promise<any> {
  // Extract trainId from either a string or TrainData object
  const trainId = typeof trainData === 'string' ? trainData : trainData.id;
  
  // In a real implementation, you would make an API call to the train booking provider
  // For now, we'll simulate a booking process
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  // 90% success rate
  const success = Math.random() > 0.1;
  
  if (!success) {
    throw new Error(`${isReturn ? 'Return train' : 'Train'} booking failed - no seats available`);
  }
  
  return {
    type: 'train',
    isReturn,
    bookingId: `TRAIN-${isReturn ? 'RET-' : ''}${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    pnr: `${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    status: 'confirmed',
    trainId,
    passengers,
    totalAmount: typeof trainData === 'object' ? trainData.price * passengers : 0, // Calculate based on the actual train price if available
  };
}

// Legacy function for backward compatibility
export async function getTrainPrice(from: string, to: string) {
  return {
    name: `${to} Express`,
    from,
    to,
    price: 1200 + Math.floor(Math.random() * 800),
    class: '2AC',
  };
}
