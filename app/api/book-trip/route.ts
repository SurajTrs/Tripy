// api/trip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseTripDetails } from '@/lib/nlpParser';
import { getLiveLocation } from '@/lib/location'; // Assuming this file exists and works as expected

// Define the structure for the trip context, ensuring type safety
type TripContext = {
  from?: string;
  to?: string;
  date?: string;
  budget?: 'Luxury' | 'Medium' | 'Budget-friendly';
  groupSize?: string;
  mode?: 'Train' | 'Bus' | 'Flight';
};

// Questions to ask the user for missing trip details
const QUESTIONS: Record<keyof TripContext, string> = {
  from:      'Kahan se start karna hai? (Origin city)',
  to:        'Kahan jana hai? (Destination city)',
  date:      'Travel ki date kya hai? (e.g. 18 August 2025)',
  budget:    'Aapka budget preference kya hai? Luxury, Medium, ya Budget-friendly?',
  groupSize: 'Solo ja rahe ho ya group mein?',
  mode:      'Kaunsa transport mode chahiye? Train, Bus, ya Flight?',
};

/**
 * Normalizes raw budget input from the user to a predefined TripContext budget type.
 * This function has been enhanced to recognize more variations of budget preferences.
 * @param raw The raw string input from the user.
 * @returns The normalized budget category or undefined if no match.
 */
const normalizeBudget = (raw: string): TripContext['budget'] => {
  const txt = raw.toLowerCase().replace(/["']/g, '').trim();

  // Direct and common phrase matches
  if (txt.includes('luxury')) return 'Luxury';
  if (txt.includes('medium')) return 'Medium';
  // Prioritize 'budget-friendly' full phrase, then just 'budget'
  if (txt.includes('budget-friendly') || txt.includes('budget')) return 'Budget-friendly';

  // Abbreviation/partial matches for robustness
  if (txt.includes('lux')) return 'Luxury';
  if (txt.includes('med')) return 'Medium';
  if (txt.includes('cheap') || txt.includes('low cost') || txt.includes('economical')) return 'Budget-friendly';

  return undefined;
};

/**
 * Normalizes raw transport mode input from the user to a predefined TripContext mode type.
 * @param raw The raw string input from the user.
 * @returns The normalized mode of transport or undefined if no match.
 */
const normalizeMode = (raw: string): TripContext['mode'] => {
  const txt = raw.toLowerCase();
  if (txt.includes('train')) return 'Train';
  if (txt.includes('bus')) return 'Bus';
  if (txt.includes('flight')) return 'Flight';
  return undefined;
};

/**
 * Generates a random price within a given range.
 * @param min The minimum price.
 * @param max The maximum price.
 * @returns A random integer price.
 */
const getRandomPrice = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Handles POST requests to the trip planning API.
 * This is the main entry point for the conversational trip planning assistant.
 */
export async function POST(req: NextRequest) {
  try {
    // Destructure incoming request body with default values
    // IMPORTANT: For conversational flow, the client must send the 'context' object received
    // from the previous API response back in subsequent requests.
    const { message, lat, lng, context: ctxIn = {}, ask } = await req.json();

    // Validate the incoming message
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Invalid or missing message.' }, { status: 400 });
    }

    // Clone existing context to avoid direct mutation of the input context
    const context: TripContext = { ...ctxIn };

    // Determine if the user is answering a specific question or providing initial details
    if (ask) {
      // User is answering the last asked slot
      const ans = message.trim();
      switch (ask) {
        case 'from':
          context.from = ans;
          break;
        case 'to':
          context.to = ans;
          break;
        case 'date':
          context.date = ans;
          break;
        case 'budget':
          context.budget = normalizeBudget(ans);
          break;
        case 'groupSize':
          context.groupSize = ans;
          break;
        case 'mode':
          context.mode = normalizeMode(ans);
          break;
        default:
          // Handle unexpected 'ask' values gracefully
          console.warn(`Unexpected 'ask' parameter received: ${ask}`);
          break;
      }
    } else {
      // First-turn or general input: try NLP extraction for from/to/date only
      const parsed = await parseTripDetails(message);
      // Only update context if the parsed value is not null and context doesn't already have it
      context.from ||= parsed.from ?? undefined;
      context.to   ||= parsed.to   ?? undefined;
      context.date ||= parsed.date ?? undefined;
    }

    // GPS fallback for origin if 'from' is still missing
    if (!context.from && lat != null && lng != null) {
      try {
        const liveLocation = await getLiveLocation(lat, lng);
        if (liveLocation) {
          context.from = liveLocation;
        } else {
          console.warn('Could not determine live location from provided coordinates.');
        }
      } catch (locationError) {
        console.error('Error getting live location:', locationError);
        // Continue without live location if there's an error
      }
    }

    // Define the order of slots to check for completeness
    const slots: (keyof TripContext)[] = ['from', 'to', 'date', 'budget', 'groupSize', 'mode'];
    // Find the first missing slot
    const missing = slots.find((key) => !context[key]);

    // If there's a missing slot, ask the user for it
    if (missing) {
      return NextResponse.json({
        assistantFollowUp: true,
        ask: missing, // Set the 'ask' to the *next* missing slot
        context,
        message: QUESTIONS[missing],
      });
    }

    // All required slots are filled—build the mock trip plan
    // Ensure mode and budget are defined before accessing them, though the 'missing' check above should guarantee this.
    if (!context.mode || !context.budget || !context.from || !context.to || !context.date) {
        // This case should ideally not be hit if the 'missing' check is exhaustive
        return NextResponse.json({ error: 'Missing critical trip details to finalize plan.' }, { status: 500 });
    }

    const transportPrice = {
      Train: getRandomPrice(800, 1800),
      Bus:   getRandomPrice(600, 1400),
      Flight:getRandomPrice(1500, 4500),
    }[context.mode];

    const hotelPrice = {
      Luxury:         getRandomPrice(4000, 6000),
      Medium:         getRandomPrice(2500, 4000),
      'Budget-friendly': getRandomPrice(1200, 2500),
    }[context.budget];

    const cabOptions = [
      { provider: 'Uber',   price: getRandomPrice(300, 450) },
      { provider: 'Ola',    price: getRandomPrice(280, 400) },
      { provider: 'Rapido', price: getRandomPrice(200, 350) },
    ];
    // Find the cheapest cab for station drop-off and most expensive for hotel drop-off (mock logic)
    const cabToStation = cabOptions.reduce((a, b) => (a.price < b.price ? a : b));
    const cabToHotel   = cabOptions.reduce((a, b) => (a.price > b.price ? a : b));

    const total = transportPrice + hotelPrice + cabToStation.price + cabToHotel.price;

    // Construct the final trip plan object
    const tripPlan = {
      cabToStation: {
        ...cabToStation,
        from: `${context.from} City`,
        to:   `${context.from} Station`,
      },
      transport: {
        mode:  context.mode,
        name:  `${context.from}-${context.to} ${context.mode} Service`,
        from:  context.from,
        to:    context.to,
        date:  context.date,
        price: transportPrice,
      },
      cabToHotel: {
        ...cabToHotel,
        from: `${context.to} Station`,
        to:   `Hotel ${context.to}`,
      },
      hotel: {
        name:     `Hotel ${context.to}`,
        price:    hotelPrice,
        category: context.budget,
      },
      food:      [`Cafe ${context.to}`, 'Local Tadka', 'Chai Point'], // Mock food suggestions
      groupSize: context.groupSize,
      total,
    };

    // Return the successful trip plan
    return NextResponse.json({
      success: true,
      from:    context.from,
      to:      context.to,
      data:    tripPlan,
      message: `Done! Here’s your trip plan from ${context.from} to ${context.to} on ${context.date}. Shall I book it?`,
    });
  } catch (error: unknown) { // Use 'unknown' for better type safety in catch blocks
    console.error('Trip planning failed:', error);
    let errorMessage = 'Something went wrong while planning your trip.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}