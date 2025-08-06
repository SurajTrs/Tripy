// app/api/trip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TripContext, TripPlanData, FlightData, HotelData, ParsedTripDetails } from '../../../types';
import { parseTripDetails } from '@/lib/nlpParser';
import { searchFlights } from '@/lib/flightApi';

const QUESTIONS: Record<string, string> = {
  from: 'Where are you departing from? (Departure city)',
  to: 'Where do you want to go? (Destination city)',
  date: 'What is your travel date? (e.g. 18 August 2025 or Tomorrow)',
  budget: 'What is your budget preference? Luxury, Medium, or Budget-friendly?',
  groupSize: 'Are you traveling solo or in a group? (e.g., Solo, 2 people, Group of 5)',
  mode: 'What transport mode do you prefer? Train, Bus, or Flight?',
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

    // --- Intent Handling can remain here ---
    // ...

    // Update context with the latest information from the user's message
    if (parsed.from) context.from = parsed.from;
    if (parsed.to) context.to = parsed.to;
    if (parsed.date) context.date = parsed.date;
    if (parsed.budget) context.budget = parsed.budget;
    if (parsed.groupSize != null) context.groupSize = parsed.groupSize;
    if (parsed.mode) context.mode = parsed.mode;
    
    // --- REVISED INTERACTIVE PLANNING LOGIC ---

    // --- FIX: The logic is now combined. If a flight is selected AND a budget is now available
    // (either from a previous turn or the current one), we proceed directly to hotels.

    // STEP 2: SEARCH FOR HOTELS (This check now comes before the flight search)
    // Condition: A flight is selected, and a budget is set, but no hotel has been selected yet.
    if (context.flight && context.budget && !context.hotel) {
      // MOCK HOTEL SEARCH
      const hotels: HotelData[] = Array.from({ length: 3 }).map((_, i) => {
        const base = context.budget === 'Luxury' ? 4000 : context.budget === 'Medium' ? 2000 : 800;
        const price = getRandomPrice(base, base + 1500);
        return {
          id: `hotel_${i}`, name: `${context.budget} Hotel Option ${i + 1}`, price, currency: 'INR',
          category: context.budget, rating: 3.5 + i * 0.5, address: `123 Main St, ${context.to || ''}`,
          deeplink: `https://mock.hotels/book?d=${context.to}&p=${price}`, imageUrl: `https://placehold.co/400x200/7c3aed/ffffff?text=Hotel+${i + 1}`,
        };
      });
      
      return NextResponse.json({
        assistantFollowUp: true,
        ask: 'groupSize',
        message: "Perfect. Based on your budget, here are some hotel options. Please select one. Now, just to confirm, how many people are traveling?",
        context: context,
        data: {
          availableHotels: hotels,
          transport: context.flight
        }
      });
    }

    // STEP 1: SEARCH FOR FLIGHTS
    // Condition: We have enough info for a flight search, but no flight has been selected yet.
    if (context.from && context.to && context.date && context.mode === 'Flight' && !context.flight) {
      try {
        const flights: FlightData[] = await searchFlights({
          origin: context.from, destination: context.to,
          departureDate: context.date, adults: context.groupSize || 1,
        });

        if (flights.length > 0) {
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
      } catch (e: any) {
        return NextResponse.json({ success: false, message: `Flight search failed: ${e.message}` });
      }
    }
    
    // STEP 3: FINALIZE THE PLAN
    if (context.flight && context.hotel && context.groupSize) {
        const cabToStationPrice = getRandomPrice(400, 700);
        const cabToHotelPrice = getRandomPrice(500, 800);
        const totalCost = (context.flight.price * context.groupSize) + (context.hotel.price * context.groupSize) + cabToStationPrice + cabToHotelPrice;

        const finalPlan: TripPlanData = {
            transport: context.flight, hotel: context.hotel,
            cabToStation: { name: `Cab to Airport in ${context.from}`, price: cabToStationPrice, details: 'Standard Ride' },
            cabToHotel: { name: `Cab from Airport in ${context.to}`, price: cabToHotelPrice, details: 'Standard Ride' },
            groupSize: context.groupSize, total: totalCost,
        };
        
        return NextResponse.json({
            success: true,
            message: "Excellent! Your personalized trip is all planned out. Here is the final summary.",
            data: finalPlan,
            context: { lastPlannedTrip: finalPlan }
        });
    }

    // --- FALLBACK: ASK THE NEXT QUESTION ---
    const slots: (keyof TripContext)[] = ['from', 'to', 'date', 'mode', 'budget', 'groupSize'];
    const missing = slots.find((k) => context[k] == null);

    if (missing) {
      return NextResponse.json({
        assistantFollowUp: true,
        ask: missing,
        context: { ...context, ask: missing },
        message: QUESTIONS[missing],
      });
    }

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
