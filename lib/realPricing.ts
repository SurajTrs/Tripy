// lib/realPricing.ts
import { searchFlights } from './flightApi';
import { searchTrains } from './train';
import { searchBuses } from './busApi';
import { searchHotels } from './hotelApi';
import { searchCabs } from './cabApi';
import { FlightData, TrainData, BusData, HotelData, CabData } from '../types';

// Interface for real-time pricing parameters
interface RealPricingParams {
  transportType: 'flight' | 'train' | 'bus';
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  hotelNeeded?: boolean;
  cabToStationNeeded?: boolean;
  cabToHotelNeeded?: boolean;
}

// Interface for real-time pricing results
interface RealPricingResults {
  transport: FlightData | TrainData | BusData | null;
  returnTransport?: FlightData | TrainData | BusData | null;
  hotel?: HotelData | null;
  cabToStation?: CabData | null;
  cabToHotel?: CabData | null;
  total: number;
}

/**
 * Get real-time pricing for all components of a trip
 */
export async function getRealTimePricing(params: RealPricingParams): Promise<RealPricingResults> {
  try {
    // Initialize results object
    const results: RealPricingResults = {
      transport: null,
      total: 0
    };

    // Get transport pricing based on type
    let transportOptions: (FlightData | TrainData | BusData)[] = [];
    
    switch (params.transportType) {
      case 'flight':
        transportOptions = await searchFlights({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          adults: params.adults
        });
        break;
      case 'train':
        transportOptions = await searchTrains({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          passengers: params.adults
        });
        break;
      case 'bus':
        transportOptions = await searchBuses({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          passengers: params.adults
        });
        break;
    }

    // Select the best option (for now, just the first one)
    if (transportOptions.length > 0) {
      results.transport = transportOptions[0];
      results.total += results.transport.price * params.adults;
    }

    // Get return transport if needed
    if (params.returnDate) {
      let returnTransportOptions: (FlightData | TrainData | BusData)[] = [];
      
      switch (params.transportType) {
        case 'flight':
          returnTransportOptions = await searchFlights({
            origin: params.destination, // Swap origin and destination
            destination: params.origin,
            departureDate: params.returnDate,
            adults: params.adults
          });
          break;
        case 'train':
          returnTransportOptions = await searchTrains({
            origin: params.destination,
            destination: params.origin,
            departureDate: params.returnDate,
            passengers: params.adults
          });
          break;
        case 'bus':
          returnTransportOptions = await searchBuses({
            origin: params.destination,
            destination: params.origin,
            departureDate: params.returnDate,
            passengers: params.adults
          });
          break;
      }

      if (returnTransportOptions.length > 0) {
        results.returnTransport = returnTransportOptions[0];
        results.total += results.returnTransport.price * params.adults;
      }
    }

    // Get hotel pricing if needed
    if (params.hotelNeeded) {
      try {
        const hotelOptions = await searchHotels({
          destination: params.destination, // Use city instead of destination
          checkInDate: params.departureDate,
          checkOutDate: params.returnDate || new Date(new Date(params.departureDate).getTime() + 86400000).toISOString().split('T')[0], // Default to next day if no return date
          adults: params.adults
        });

        if (hotelOptions.length > 0) {
          results.hotel = hotelOptions[0];
          results.total += results.hotel.price * params.adults;
        }
      } catch (error) {
        console.error('Error fetching hotel data:', error);
      }
    }

    // Get cab to station pricing if needed
    if (params.cabToStationNeeded) {
      try {
        // Create location objects for cab search
        const homeLocation: { lat: number; lng: number; name: string } = {
          lat: 28.6139, // Default coordinates (can be replaced with geolocation)
          lng: 77.2090,
          name: 'Home'
        };
        
        const stationLocation: { lat: number; lng: number; name: string } = {
          lat: 28.6304,  // Default coordinates for station
          lng: 77.2177,
          name: params.origin + ' Station'
        };
        
        const cabOptions = await searchCabs({
          origin: homeLocation,
          destination: stationLocation,
          passengers: params.adults
        });

        if (cabOptions.length > 0) {
          // Add name and details properties for checkout display
          const cabData = {
            ...cabOptions[0],
            name: `Cab to ${params.origin} Station`,
            details: `${cabOptions[0].cabType} | ${cabOptions[0].estimatedTime} min`
          };
          results.cabToStation = cabData;
          results.total += results.cabToStation.price;
        }
      } catch (error) {
        console.error('Error fetching cab to station data:', error);
      }
    }

    // Get cab to hotel pricing if needed
    if (params.cabToHotelNeeded) {
      try {
        // Create location objects for cab search
        const stationLocation: { lat: number; lng: number; name: string } = {
          lat: 28.6304,  // Default coordinates for destination station
          lng: 77.2177,
          name: params.destination + ' Station'
        };
        
        const hotelLocation: { lat: number; lng: number; name: string } = {
          lat: 28.6139,  // Default coordinates for hotel
          lng: 77.2090,
          name: 'Hotel'
        };
        
        const cabOptions = await searchCabs({
          origin: stationLocation,
          destination: hotelLocation,
          passengers: params.adults
        });

        if (cabOptions.length > 0) {
          // Add name and details properties for checkout display
          const cabData = {
            ...cabOptions[0],
            name: `Cab to Hotel in ${params.destination}`,
            details: `${cabOptions[0].cabType} | ${cabOptions[0].estimatedTime} min`
          };
          results.cabToHotel = cabData;
          results.total += results.cabToHotel.price;
        }
      } catch (error) {
        console.error('Error fetching cab to hotel data:', error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error in getRealTimePricing:', error);
    throw new Error('Failed to get real-time pricing');
  }
}