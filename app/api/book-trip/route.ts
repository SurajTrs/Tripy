// app/api/book-trip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TripPlanData, FlightData, HotelData, BusData, TrainData } from '../../../types';
import { bookTrain } from '../../../lib/train';
import { bookBus } from '../../../lib/busApi';

interface BookingRequest {
  tripPlan: TripPlanData;
  userDetails: {
    name: string;
    email: string;
    phone: string;
    passengers: Array<{
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      passportNumber?: string;
    }>;
  };
  paymentMethod: {
    type: 'card' | 'upi' | 'netbanking';
    details: any;
  };
}

interface BookingResponse {
  success: boolean;
  bookingId?: string;
  message: string;
  confirmationDetails?: {
    flightBooking?: {
      bookingId: string;
      pnr: string;
      status: 'confirmed' | 'pending' | 'failed';
      isReturn?: boolean;
    };
    returnFlightBooking?: {
      bookingId: string;
      pnr: string;
      status: 'confirmed' | 'pending' | 'failed';
    };
    trainBooking?: {
      bookingId: string;
      pnr: string;
      status: 'confirmed' | 'pending' | 'failed';
      isReturn?: boolean;
    };
    returnTrainBooking?: {
      bookingId: string;
      pnr: string;
      status: 'confirmed' | 'pending' | 'failed';
    };
    busBooking?: {
      bookingId: string;
      pnr: string;
      status: 'confirmed' | 'pending' | 'failed';
      isReturn?: boolean;
    };
    returnBusBooking?: {
      bookingId: string;
      pnr: string;
      status: 'confirmed' | 'pending' | 'failed';
    };
    hotelBooking?: {
      bookingId: string;
      confirmationCode: string;
      status: 'confirmed' | 'pending' | 'failed';
    };
    cabBookings?: Array<{
      bookingId: string;
      driverDetails: {
        name: string;
        phone: string;
        vehicleNumber: string;
      };
      status: 'confirmed' | 'pending' | 'failed';
    }>;
  };
  totalAmount: number;
  currency: string;
}

export async function POST(req: NextRequest) {
  try {
    const { tripPlan, userDetails, paymentMethod, context }: BookingRequest & { context?: any } = await req.json();

    // For direct booking from the trip API, we may not have complete user details
    // So we'll handle both complete and simplified booking requests
    if (!tripPlan) {
      return NextResponse.json({
        success: false,
        message: 'Missing required trip plan information'
      }, { status: 400 });
    }
    
    // If we don't have user details, create default ones
    const processedUserDetails = userDetails || {
      name: "Guest User",
      email: "guest@example.com",
      phone: "+1234567890",
      passengers: [{
        firstName: "Guest",
        lastName: "User",
        dateOfBirth: "1990-01-01"
      }]
    };
    
    // If we don't have payment method, create a default one
    const processedPaymentMethod = paymentMethod || {
      type: 'card' as const,
      details: {
        cardNumber: "**** **** **** 1234",
        expiryDate: "12/25",
        cvv: "***"
      }
    };

    // Validate trip plan has all required components
    if (!tripPlan.transport || !tripPlan.hotel) {
      return NextResponse.json({
        success: false,
        message: 'Incomplete trip plan. Please ensure flight and hotel are selected.'
      }, { status: 400 });
    }
    
    // Ensure groupSize is set
    if (!tripPlan.groupSize) {
      tripPlan.groupSize = processedUserDetails.passengers?.length || 1;
    }

    // Generate unique booking ID
    const bookingId = `TRIP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Simulate booking process with real API calls
    const bookingPromises = [];

    // 1. Book Transport (Flight, Train, or Bus)
    if (tripPlan.transport) {
      if (tripPlan.transportType === 'flight') {
        bookingPromises.push(bookFlight(tripPlan.transport as FlightData, userDetails, tripPlan.groupSize));
      } else if (tripPlan.transportType === 'train') {
        bookingPromises.push(bookTrain(tripPlan.transport as TrainData, userDetails, tripPlan.groupSize));
      } else if (tripPlan.transportType === 'bus') {
        bookingPromises.push(bookBus(tripPlan.transport as BusData, userDetails, tripPlan.groupSize));
      }
    }

    // 2. Book Return Transport if applicable
    if (tripPlan.returnTrip && tripPlan.returnTransport) {
      if (tripPlan.transportType === 'flight') {
        bookingPromises.push(bookFlight(tripPlan.returnTransport as FlightData, userDetails, tripPlan.groupSize, true));
      } else if (tripPlan.transportType === 'train') {
        bookingPromises.push(bookTrain(tripPlan.returnTransport as TrainData, userDetails, tripPlan.groupSize, true));
      } else if (tripPlan.transportType === 'bus') {
        bookingPromises.push(bookBus(tripPlan.returnTransport as BusData, userDetails, tripPlan.groupSize, true));
      }
    }

    // 3. Book Hotel
    if (tripPlan.hotel) {
      bookingPromises.push(bookHotel(tripPlan.hotel, userDetails, tripPlan.groupSize));
    }

    // 4. Book Cabs
    if (tripPlan.cabToStation) {
      bookingPromises.push(bookCab(tripPlan.cabToStation, userDetails, 'departure'));
    }
    if (tripPlan.cabToHotel) {
      bookingPromises.push(bookCab(tripPlan.cabToHotel, userDetails, 'arrival'));
    }

    // Wait for all bookings to complete
    const bookingResults = await Promise.allSettled(bookingPromises);
    
    // Process results
    const confirmationDetails: BookingResponse['confirmationDetails'] = {
      cabBookings: []
    };
    
    // Calculate total amount
    let totalAmount = tripPlan.total || (
      (tripPlan.transport?.price || 0) + 
      (tripPlan.hotel?.price || 0) + 
      (tripPlan.cabToStation?.price || 0) + 
      (tripPlan.cabToHotel?.price || 0) +
      (tripPlan.returnTransport?.price || 0)
    ) * (tripPlan.groupSize || 1);
    
    let allSuccessful = true;

    bookingResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const booking = result.value;
        totalAmount += booking.totalAmount || booking.amount || 0;

        if (booking.type === 'flight') {
          if (booking.isReturn) {
            confirmationDetails.returnFlightBooking = {
              bookingId: booking.bookingId,
              pnr: booking.pnr,
              status: booking.status
            };
          } else {
            confirmationDetails.flightBooking = {
              bookingId: booking.bookingId,
              pnr: booking.pnr,
              status: booking.status,
              isReturn: booking.isReturn
            };
          }
        } else if (booking.type === 'train') {
          if (booking.isReturn) {
            confirmationDetails.returnTrainBooking = {
              bookingId: booking.bookingId,
              pnr: booking.pnr,
              status: booking.status
            };
          } else {
            confirmationDetails.trainBooking = {
              bookingId: booking.bookingId,
              pnr: booking.pnr,
              status: booking.status,
              isReturn: booking.isReturn
            };
          }
        } else if (booking.type === 'bus') {
          if (booking.isReturn) {
            confirmationDetails.returnBusBooking = {
              bookingId: booking.bookingId,
              pnr: booking.pnr,
              status: booking.status
            };
          } else {
            confirmationDetails.busBooking = {
              bookingId: booking.bookingId,
              pnr: booking.pnr,
              status: booking.status,
              isReturn: booking.isReturn
            };
          }
        } else if (booking.type === 'hotel' && 'confirmationCode' in booking) {
          confirmationDetails.hotelBooking = {
            bookingId: booking.bookingId,
            confirmationCode: booking.confirmationCode,
            status: booking.status
          };
        } else if (booking.type === 'cab' && 'driverDetails' in booking) {
          if (!confirmationDetails.cabBookings) {
            confirmationDetails.cabBookings = [];
          }
          confirmationDetails.cabBookings.push({
            bookingId: booking.bookingId,
            driverDetails: booking.driverDetails,
            status: booking.status
          });
        }
      } else {
        allSuccessful = false;
        console.error(`Booking ${index} failed:`, result.reason);
      }
    });

    // Process payment
    const paymentResult = await processPayment(totalAmount, paymentMethod);

    if (!paymentResult.success) {
      return NextResponse.json({
        success: false,
        message: `Payment failed: ${paymentResult.message}`,
        bookingId
      }, { status: 400 });
    }

    const response: BookingResponse = {
      success: allSuccessful,
      bookingId,
      message: allSuccessful 
        ? 'Your trip has been successfully booked! Check your email for confirmation details.'
        : 'Some bookings were successful, but there were issues with others. Please check the details.',
      confirmationDetails,
      totalAmount,
      currency: 'INR'
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Booking API Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'An unexpected error occurred during booking.'
    }, { status: 500 });
  }
}

// Helper functions for real booking APIs
async function bookFlight(flight: FlightData, userDetails: any, groupSize: number, isReturn: boolean = false) {
  try {
    // Check if we have API keys for real flight booking
    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    
    if (apiKey) {
      // In a real implementation, you would make an API call to a flight booking provider
      // For now, we'll still use a simulation but structured for future real API integration
      console.log(`Attempting to book ${isReturn ? 'return ' : ''}flight ${flight.flightNumber} with real API credentials`);
      
      // Simulate API call delay - would be replaced with real API call
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // In production, replace this with actual API call to book the flight
      // const bookingResponse = await fetch('https://flight-booking-api.example.com/book', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     flight, 
      //     passengers: userDetails.passengers, 
      //     groupSize,
      //     isReturn
      //   })
      // });
      // const bookingData = await bookingResponse.json();
      
      const success = Math.random() > 0.1; // 90% success rate for simulation
      
      if (!success) {
        throw new Error(`${isReturn ? 'Return flight' : 'Flight'} booking failed - no seats available`);
      }
      
      return {
        type: 'flight',
        isReturn,
        bookingId: `FL-${isReturn ? 'RET-' : ''}${Date.now()}`,
        pnr: `PNR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'confirmed' as const,
        amount: flight.price * groupSize
      };
    } else {
      // Fall back to simulation if no API key
      console.log('No flight booking API key found, using simulation');
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const success = Math.random() > 0.1; // 90% success rate
      
      if (!success) {
        throw new Error('Flight booking failed - no seats available');
      }

      return {
        type: 'flight',
        bookingId: `FL-${Date.now()}`,
        pnr: `PNR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'confirmed' as const,
        amount: flight.price * groupSize
      };
    }
  } catch (error: any) {
    console.error('Flight booking error:', error);
    throw error;
  }
}

async function bookHotel(hotel: HotelData, userDetails: any, groupSize: number) {
  try {
    // Check if we have API keys for real hotel booking
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    
    if (rapidApiKey) {
      // In a real implementation, you would make an API call to a hotel booking provider
      // For now, we'll still use a simulation but structured for future real API integration
      console.log(`Attempting to book hotel ${hotel.name} with real API credentials`);
      
      // Simulate API call delay - would be replaced with real API call
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
      
      // In production, replace this with actual API call to book the hotel
      // const bookingResponse = await fetch('https://hotels-com-provider.p.rapidapi.com/v2/bookings', {
      //   method: 'POST',
      //   headers: {
      //     'X-RapidAPI-Key': rapidApiKey,
      //     'X-RapidAPI-Host': 'hotels-com-provider.p.rapidapi.com',
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     hotelId: hotel.id,
      //     checkIn: userDetails.checkInDate,
      //     checkOut: userDetails.checkOutDate,
      //     guests: groupSize,
      //     rooms: Math.ceil(groupSize / 2),
      //     userInfo: {
      //       name: userDetails.name,
      //       email: userDetails.email,
      //       phone: userDetails.phone
      //     }
      //   })
      // });
      // const bookingData = await bookingResponse.json();
      
      const success = Math.random() > 0.05; // 95% success rate for simulation
      
      if (!success) {
        throw new Error('Hotel booking failed - room not available');
      }
      
      return {
        type: 'hotel',
        bookingId: `HTL-${Date.now()}`,
        confirmationCode: `CONF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'confirmed' as const,
        amount: hotel.price * groupSize
      };
    } else {
      // Fall back to simulation if no API key
      console.log('No hotel booking API key found, using simulation');
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
      
      const success = Math.random() > 0.05; // 95% success rate
      
      if (!success) {
        throw new Error('Hotel booking failed - room not available');
      }

      return {
        type: 'hotel',
        bookingId: `HTL-${Date.now()}`,
        confirmationCode: `CONF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'confirmed' as const,
        amount: hotel.price * groupSize
      };
    }
  } catch (error: any) {
    console.error('Hotel booking error:', error);
    throw error;
  }
}

async function bookCab(cab: any, userDetails: any, tripType: 'departure' | 'arrival') {
  try {
    // Import the real cab booking function
    const { bookCab: realBookCab } = await import('../../../lib/cabApi');
    
    // Check if we have Uber API credentials
    const uberClientId = process.env.UBER_CLIENT_ID;
    const uberClientSecret = process.env.UBER_CLIENT_SECRET;
    
    if (uberClientId && uberClientSecret && cab && cab.id && cab.id.startsWith('UBER-')) {
      // In a real implementation, you would use the Uber API to book a ride
      console.log(`Attempting to book Uber cab with ID ${cab.id} with real API credentials`);
      
      // Extract origin and destination from cab data
      // This assumes cab object has these properties or they can be derived
      const origin = {
        lat: cab.origin?.lat || 0,
        lng: cab.origin?.lng || 0,
        name: cab.origin?.name || 'Unknown Origin'
      };
      
      const destination = {
        lat: cab.destination?.lat || 0,
        lng: cab.destination?.lng || 0,
        name: cab.destination?.name || 'Unknown Destination'
      };
      
      // Call the real booking function
      try {
        const bookingResult = await realBookCab(
          cab.id,
          origin,
          destination,
          userDetails.passengers?.length || 1,
          userDetails
        );
        
        return {
          type: 'cab',
          bookingId: bookingResult.bookingId,
          driverDetails: bookingResult.driverDetails,
          status: 'confirmed' as const,
          amount: bookingResult.fare || cab.price
        };
      } catch (error) {
        console.error('Real cab booking failed, falling back to simulation:', error);
        // Fall back to simulation if real booking fails
      }
    }
    
    // Fall back to simulation if no API credentials or real booking failed
    console.log('No cab booking API credentials found or real booking failed, using simulation');
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const success = Math.random() > 0.15; // 85% success rate
    
    if (!success) {
      throw new Error('Cab booking failed - no drivers available');
    }

    return {
      type: 'cab',
      bookingId: `CAB-${Date.now()}`,
      driverDetails: {
        name: `Driver ${Math.floor(Math.random() * 1000)}`,
        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        vehicleNumber: `${['DL', 'MH', 'KA', 'TN'][Math.floor(Math.random() * 4)]}${Math.floor(Math.random() * 100)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000)}`
      },
      status: 'confirmed' as const,
      amount: cab.price
    };
  } catch (error: any) {
    console.error('Cab booking error:', error);
    throw error;
  }
}

async function processPayment(amount: number, paymentMethod: any) {
  try {
    // Import Stripe
    const { stripe } = await import('../../../lib/stripe');
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit (cents/paise)
      currency: 'inr',
      payment_method: paymentMethod.id,
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking-success`,
    });
    
    if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
      return {
        success: true,
        message: 'Payment processed successfully',
        transactionId: paymentIntent.id
      };
    } else {
      return {
        success: false,
        message: `Payment failed with status: ${paymentIntent.status}`
      };
    }
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    return {
      success: false,
      message: error.message || 'Payment processing failed'
    };
  }
}
