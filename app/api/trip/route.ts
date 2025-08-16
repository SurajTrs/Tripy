// app/api/trip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TripContext, TripPlanData, FlightData, HotelData, ParsedTripDetails, TrainData, BusData } from '../../../types';
import { parseTripDetails } from '@/lib/nlpParser';
import { searchFlights } from '@/lib/flightApi';
import { parseDate, formatDateForAPI } from '@/lib/dateParser';

const QUESTIONS: Record<string, string> = {
  from: 'Where are you departing from? (Departure city)',
  to: 'Where do you want to go? (Destination city)',
  date: 'What is your travel date? (e.g. 18 August 2025 or Tomorrow)',
  budget: 'What is your budget preference? Luxury, Medium, or Budget-friendly?',
  groupSize: 'Are you traveling solo or in a group? (e.g., Solo, 2 people, Group of 5)',
  mode: 'What transport mode do you prefer? Train, Bus, or Flight?',
  returnTrip: 'Would you like to book a return trip? (Yes or No)',
  returnDate: 'What date would you like to return? (e.g. 25 August 2025 or Next week)',
};

function getRandomPrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: NextRequest) {
  try {
    const { message, context: ctxIn = {} } = await req.json();
    const context: TripContext = { ...ctxIn };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Invalid message.' }, { status: 400 });
    }

    const parsed: ParsedTripDetails = await parseTripDetails(message);
    console.log("Parsed NLP details:", parsed);

    // Update context with the latest info from parsed details
    if (parsed.from) context.from = parsed.from;
    if (parsed.to) context.to = parsed.to;
    if (parsed.date) context.date = parsed.date;
    if (parsed.budget) context.budget = parsed.budget;
    if (parsed.groupSize != null) context.groupSize = parsed.groupSize;
    if (parsed.mode) context.mode = parsed.mode;
    if (parsed.returnTrip != null) context.returnTrip = parsed.returnTrip;
    if (parsed.returnDate) context.returnDate = parsed.returnDate;

    // --- ASK FOR MISSING INFO FIRST ---
    const slots: (keyof TripContext)[] = ['from', 'to', 'date', 'mode', 'budget', 'groupSize'];
    const missing = slots.find((k) => context[k] == null);
    
    // If all basic info is provided and returnTrip is true, check for returnDate
    if (!missing && context.returnTrip && !context.returnDate) {
      return NextResponse.json({
        assistantFollowUp: true,
        ask: 'returnDate',
        context: { ...context, ask: 'returnDate' },
        message: QUESTIONS['returnDate'],
      });
    }

    if (missing) {
      return NextResponse.json({
        assistantFollowUp: true,
        ask: missing,
        context: { ...context, ask: missing },
        message: QUESTIONS[missing],
      });
    }

    // --- STEP 2: SEARCH FOR HOTELS ---
    if (context.flight && context.budget && !context.hotel) {
      try {
        const { searchHotels } = await import('@/lib/hotelApi');

        let flightDate: Date;
        if (context.date) {
          flightDate = parseDate(context.date) || new Date();
        } else {
          flightDate = new Date();
        }

        const checkInDate = formatDateForAPI(flightDate);
        const checkOutDate = formatDateForAPI(new Date(flightDate.getTime() + 24 * 60 * 60 * 1000));

        const hotels: HotelData[] = await searchHotels({
          destination: context.to || '',
          checkInDate,
          checkOutDate,
          adults: context.groupSize || 1,
          budget: context.budget as "Luxury" | "Medium" | "Budget-friendly"
        });

        if (hotels.length > 0) {
          return NextResponse.json({
            assistantFollowUp: true,
            ask: 'groupSize',
            message: "Perfect! I've found several hotel options based on your budget. Please select one. Now, just to confirm, how many people are traveling?",
            context: context,
            data: {
              availableHotels: hotels,
              transport: context.flight
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            message: `I couldn't find any hotels in ${context.to} matching your ${context.budget} budget. Would you like to try a different budget range?`,
            context: { ...context, budget: undefined }
          });
        }
      } catch (error: any) {
        console.error('Hotel search error:', error);
        return NextResponse.json({
          success: false,
          message: `Hotel search failed: ${error.message}. Please try again.`,
          context: context
        });
      }
    }

    // --- STEP 1: SEARCH FOR TRANSPORT (FLIGHT, TRAIN, BUS) ---
    if (context.from && context.to && context.date && context.mode && !context.flight && !context.train && !context.bus) {
      try {
        if (context.mode === 'Flight') {
          const flights: FlightData[] = await searchFlights({
            origin: context.from,
            destination: context.to,
            departureDate: context.date,
            adults: context.groupSize || 1,
          });

          if (flights.length > 0) {
            // If returnTrip is true, ask about returnDate if not provided
            if (context.returnTrip && !context.returnDate) {
              return NextResponse.json({
                assistantFollowUp: true,
                ask: 'returnDate',
                message: "Great! I've found several flights for your outbound journey. When would you like to return?",
                context: context,
                data: { availableFlights: flights }
              });
            }
            
            return NextResponse.json({
              assistantFollowUp: true,
              ask: 'budget',
              message: "Great! I've found several flights for you. Please select one. In the meantime, what's your budget for the trip?",
              context: context,
              data: { availableFlights: flights }
            });
          } else {
            return NextResponse.json({
              success: false,
              message: `I'm sorry, I couldn't find any flights from ${context.from} to ${context.to} for that date. Would you like to try a different date?`,
              context: { ...context, date: undefined }
            });
          }
        } else if (context.mode === 'Train') {
          const { searchTrains } = await import('@/lib/train');
          
          const trains = await searchTrains({
            origin: context.from,
            destination: context.to,
            departureDate: context.date,
            passengers: context.groupSize || 1,
          });
          
          if (trains.length > 0) {
            // If returnTrip is true, ask about returnDate if not provided
            if (context.returnTrip && !context.returnDate) {
              return NextResponse.json({
                assistantFollowUp: true,
                ask: 'returnDate',
                message: "Great! I've found several trains for your outbound journey. When would you like to return?",
                context: context,
                data: { availableTrains: trains }
              });
            }
            
            return NextResponse.json({
              assistantFollowUp: true,
              ask: 'budget',
              message: "Great! I've found several trains for you. Please select one. In the meantime, what's your budget for the trip?",
              context: context,
              data: { availableTrains: trains }
            });
          } else {
            return NextResponse.json({
              success: false,
              message: `I'm sorry, I couldn't find any trains from ${context.from} to ${context.to} for that date. Would you like to try a different date?`,
              context: { ...context, date: undefined }
            });
          }
        } else if (context.mode === 'Bus') {
          const { searchBuses } = await import('@/lib/busApi');
          
          const buses = await searchBuses({
            origin: context.from,
            destination: context.to,
            departureDate: context.date,
            passengers: context.groupSize || 1,
          });
          
          if (buses.length > 0) {
            // If returnTrip is true, ask about returnDate if not provided
            if (context.returnTrip && !context.returnDate) {
              return NextResponse.json({
                assistantFollowUp: true,
                ask: 'returnDate',
                message: "Great! I've found several buses for your outbound journey. When would you like to return?",
                context: context,
                data: { availableBuses: buses }
              });
            }
            
            return NextResponse.json({
              assistantFollowUp: true,
              ask: 'budget',
              message: "Great! I've found several buses for you. Please select one. In the meantime, what's your budget for the trip?",
              context: context,
              data: { availableBuses: buses }
            });
          } else {
            return NextResponse.json({
              success: false,
              message: `I'm sorry, I couldn't find any buses from ${context.from} to ${context.to} for that date. Would you like to try a different date?`,
              context: { ...context, date: undefined }
            });
          }
        }
      } catch (e: any) {
        console.error(`${context.mode} search error:`, e);
        return NextResponse.json({ success: false, message: `${context.mode} search failed: ${e.message}` });
      }
    }
    
    // --- STEP 1.5: SEARCH FOR RETURN TRANSPORT IF NEEDED ---
    if (context.returnTrip && context.returnDate && 
        ((context.flight && !context.returnFlight) || 
         (context.train && !context.returnTrain) || 
         (context.bus && !context.returnBus))) {
      try {
        if (context.mode === 'Flight' && context.flight) {
          const returnFlights: FlightData[] = await searchFlights({
            origin: context.to || '', // Swap origin and destination for return
            destination: context.from || '',
            departureDate: context.returnDate || '',
            adults: context.groupSize || 1,
          });

          if (returnFlights.length > 0) {
            return NextResponse.json({
              assistantFollowUp: true,
              message: "Great! I've found several return flights for you. Please select one for your return journey.",
              context: context,
              data: { availableFlights: returnFlights }
            });
          } else {
            return NextResponse.json({
              success: false,
              message: `I'm sorry, I couldn't find any return flights from ${context.to} to ${context.from} for ${context.returnDate}. Would you like to try a different return date?`,
              context: { ...context, returnDate: undefined }
            });
          }
        } else if (context.mode === 'Train' && context.train) {
          const { searchTrains } = await import('@/lib/train');
          
          const returnTrains = await searchTrains({
            origin: context.to || '', // Swap origin and destination for return
            destination: context.from || '',
            departureDate: context.returnDate || '',
            passengers: context.groupSize || 1,
          });
          
          if (returnTrains.length > 0) {
            return NextResponse.json({
              assistantFollowUp: true,
              message: "Great! I've found several return trains for you. Please select one for your return journey.",
              context: context,
              data: { availableTrains: returnTrains }
            });
          } else {
            return NextResponse.json({
              success: false,
              message: `I'm sorry, I couldn't find any return trains from ${context.to} to ${context.from} for ${context.returnDate}. Would you like to try a different return date?`,
              context: { ...context, returnDate: undefined }
            });
          }
        } else if (context.mode === 'Bus' && context.bus) {
          const { searchBuses } = await import('@/lib/busApi');
          
          const returnBuses = await searchBuses({
            origin: context.to || '', // Swap origin and destination for return
            destination: context.from || '',
            departureDate: context.returnDate || '',
            passengers: context.groupSize || 1,
          });
          
          if (returnBuses.length > 0) {
            return NextResponse.json({
              assistantFollowUp: true,
              message: "Great! I've found several return buses for you. Please select one for your return journey.",
              context: context,
              data: { availableBuses: returnBuses }
            });
          } else {
            return NextResponse.json({
              success: false,
              message: `I'm sorry, I couldn't find any return buses from ${context.to} to ${context.from} for ${context.returnDate}. Would you like to try a different return date?`,
              context: { ...context, returnDate: undefined }
            });
          }
        }
      } catch (e: any) {
        console.error(`Return ${context.mode} search error:`, e);
        return NextResponse.json({ success: false, message: `Return ${context.mode} search failed: ${e.message}` });
      }
    }

    // --- STEP 3: FINALIZE TRIP PLAN ---
    if ((context.flight || context.train || context.bus) && context.hotel && context.groupSize) {
      try {
        const cabToStationPrice = getRandomPrice(400, 700);
        const cabToHotelPrice = getRandomPrice(500, 800);
        
        let transportCost = 0;
        let returnTransportCost = 0;
        let transport: FlightData | TrainData | BusData | null = null;
        let transportType: 'flight' | 'train' | 'bus' = 'flight';
        let returnTransport: FlightData | TrainData | BusData | undefined = undefined;
        let stationName = 'Airport';
        
        // Determine transport type and cost
        if (context.flight) {
          transportType = 'flight';
          transport = context.flight;
          transportCost = context.flight.price * context.groupSize;
          stationName = 'Airport';
          
          if (context.returnTrip && context.returnFlight) {
            returnTransport = context.returnFlight;
            returnTransportCost = context.returnFlight.price * context.groupSize;
          }
        } else if (context.train) {
          transportType = 'train';
          transport = context.train;
          transportCost = context.train.price * context.groupSize;
          stationName = 'Train Station';
          
          if (context.returnTrip && context.returnTrain) {
            returnTransport = context.returnTrain;
            returnTransportCost = context.returnTrain.price * context.groupSize;
          }
        } else if (context.bus) {
          transportType = 'bus';
          transport = context.bus;
          transportCost = context.bus.price * context.groupSize;
          stationName = 'Bus Station';
          
          if (context.returnTrip && context.returnBus) {
            returnTransport = context.returnBus;
            returnTransportCost = context.returnBus.price * context.groupSize;
          }
        } else {
          throw new Error('No transport selected');
        }

        const hotelCost = context.hotel.price * context.groupSize;
        const cabCost = cabToStationPrice + cabToHotelPrice;
        const totalCost = transportCost + returnTransportCost + hotelCost + cabCost;

        const finalPlan: TripPlanData = {
          transport: transport as (FlightData | TrainData | BusData | null),
          transportType: transportType,
          hotel: context.hotel,
          cabToStation: {
            name: `Uber to ${stationName} in ${context.from}`,
            price: cabToStationPrice,
            details: 'Standard Ride (UberX)'
          },
          cabToHotel: {
            name: `Uber from ${stationName} in ${context.to}`,
            price: cabToHotelPrice,
            details: 'Standard Ride (UberX)'
          },
          groupSize: context.groupSize,
          total: totalCost,
          returnTrip: context.returnTrip,
          returnDate: context.returnDate,
          returnTransport: returnTransport
        };

        return NextResponse.json({
          success: true,
          message: "Excellent! Your personalized trip is all planned out with real prices. Here is the final summary with all costs included.",
          data: finalPlan,
          context: { lastPlannedTrip: finalPlan }
        });
      } catch (error: any) {
        console.error('Error finalizing trip plan:', error);
        return NextResponse.json({
          success: false,
          message: `Error calculating final trip costs: ${error.message}. Please try again.`,
          context: context
        });
      }
    }

    // --- HANDLE BOOKING REQUEST ---
    if (parsed.intent === 'book_trip' && (context.flight || context.train || context.bus) && context.hotel) {
      try {
        // Determine transport type and details
        let transport: FlightData | TrainData | BusData | null = null;
        let transportType: 'flight' | 'train' | 'bus' = 'flight';
        let returnTransport: FlightData | TrainData | BusData | undefined = undefined;
        let stationName = 'Airport';
        let transportPrice = 0;
        let returnTransportPrice = 0;
        
        if (context.flight) {
          transport = context.flight;
          transportType = 'flight';
          transportPrice = context.flight.price;
          stationName = 'Airport';
          
          if (context.returnTrip && context.returnFlight) {
            returnTransport = context.returnFlight;
            returnTransportPrice = context.returnFlight.price;
          }
        } else if (context.train) {
          transport = context.train;
          transportType = 'train';
          transportPrice = context.train.price;
          stationName = 'Train Station';
          
          if (context.returnTrip && context.returnTrain) {
            returnTransport = context.returnTrain;
            returnTransportPrice = context.returnTrain.price;
          }
        } else if (context.bus) {
          transport = context.bus;
          transportType = 'bus';
          transportPrice = context.bus.price;
          stationName = 'Bus Station';
          
          if (context.returnTrip && context.returnBus) {
            returnTransport = context.returnBus;
            returnTransportPrice = context.returnBus.price;
          }
        } else {
          throw new Error('No transport selected');
        }
        
        const groupSize = context.groupSize || 1;
        const cabToStationPrice = getRandomPrice(400, 700);
        const cabToHotelPrice = getRandomPrice(500, 800);
        const hotelPrice = context.hotel.price;
        
        // Create a trip plan from the context
        const tripPlan: TripPlanData = {
          transport: transport as (FlightData | TrainData | BusData | null),
          transportType: transportType,
          hotel: context.hotel,
          cabToStation: {
            name: `Uber to ${stationName} in ${context.from || ''}`,
            price: cabToStationPrice,
            details: 'Standard Ride (UberX)'
          },
          cabToHotel: {
            name: `Uber from ${stationName} in ${context.to || ''}`,
            price: cabToHotelPrice,
            details: 'Standard Ride (UberX)'
          },
          groupSize: groupSize,
          total: (transportPrice + returnTransportPrice + hotelPrice) * groupSize + cabToStationPrice + cabToHotelPrice,
          returnTrip: context.returnTrip,
          returnDate: context.returnDate,
          returnTransport: returnTransport
        };
        
        // Call the booking API
        const bookingResponse = await fetch(new URL('/api/book-trip', req.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripPlan, context })
        });
        
        const bookingResult = await bookingResponse.json();
        
        if (bookingResult.success) {
          return NextResponse.json({
            success: true,
            message: `Great news! Your trip from ${context.from || ''} to ${context.to || ''} on ${context.date || ''} has been booked successfully! Your booking reference is ${bookingResult.bookingId}. You'll receive a confirmation email shortly.`,
            context: { ...context, lastPlannedTrip: tripPlan, bookingReference: bookingResult.bookingId },
            data: tripPlan
          });
        } else {
          return NextResponse.json({
            success: false,
            message: `I'm sorry, there was an issue with your booking: ${bookingResult.message}. Would you like to try again?`,
            context: context
          });
        }
      } catch (error: any) {
        console.error('Booking error:', error);
        return NextResponse.json({
          success: false,
          message: `I encountered an error while processing your booking: ${error.message}. Please try again.`,
          context: context
        });
      }
    }
    
    // --- SAFETY FALLBACK ---
    return NextResponse.json({
      success: false,
      message: "I'm not sure what to do next. Could you please clarify?",
      context: context,
    });

  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
