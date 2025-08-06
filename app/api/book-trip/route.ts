// app/api/trip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseTripDetails } from '@/lib/nlpParser';
import { getLiveLocation } from '@/lib/location'; // Optional: implement with reverse geocoding if needed
import type { TripPlanData } from "../../types";

export type TripContext = {
lastPlannedTrip: TripPlanData;
  from?: string;
  to?: string;
  date?: string;
  budget?: 'Luxury' | 'Medium' | 'Budget-friendly';
  groupSize?: string;
  mode?: 'Train' | 'Bus' | 'Flight';
};

const QUESTIONS: Record<keyof TripContext, string> = {
  from: 'Kahan se start karna hai? (Origin city)',
  to: 'Kahan jana hai? (Destination city)',
  date: 'Travel ki date kya hai? (e.g. 18 August 2025)',
  budget: 'Aapka budget preference kya hai? Luxury, Medium, ya Budget-friendly?',
  groupSize: 'Solo ja rahe ho ya group mein?',
  mode: 'Kaunsa transport mode chahiye? Train, Bus, ya Flight?',
  lastPlannedTrip: ''
};

const normalizeBudget = (raw: string): TripContext['budget'] => {
  const txt = raw.toLowerCase().replace(/["']/g, '').trim();
  if (txt.includes('luxury')) return 'Luxury';
  if (txt.includes('medium') || txt.includes('mid-range')) return 'Medium';
  if (txt.includes('budget-friendly') || txt.includes('budget') || txt.includes('cheap') || txt.includes('low cost') || txt.includes('economical')) return 'Budget-friendly';
  return undefined;
};

const normalizeMode = (raw: string): TripContext['mode'] => {
  const txt = raw.toLowerCase();
  if (txt.includes('train')) return 'Train';
  if (txt.includes('bus')) return 'Bus';
  if (txt.includes('flight') || txt.includes('plane') || txt.includes('air')) return 'Flight';
  return undefined;
};

const getRandomPrice = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export async function POST(req: NextRequest) {
  try {
    const { message, lat, lng, context: ctxIn = {}, ask } = await req.json();

    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Invalid or missing message.' }, { status: 400 });
    }

    const context: TripContext = { ...ctxIn };

    if (ask) {
      const ans = message.trim();
      switch (ask) {
        case 'from':      context.from = ans; break;
        case 'to':        context.to = ans; break;
        case 'date':      context.date = ans; break;
        case 'budget':    context.budget = normalizeBudget(ans); break;
        case 'groupSize': context.groupSize = ans; break;
        case 'mode':      context.mode = normalizeMode(ans); break;
        default:
          console.warn(`Unexpected 'ask' parameter received: ${ask}`);
          break;
      }
    } else {
      const parsed = await parseTripDetails(message);
      context.from    = context.from    || parsed.from    || undefined;
      context.to      = context.to      || parsed.to      || undefined;
      context.date    = context.date    || parsed.date    || undefined;
      context.budget  = context.budget  || parsed.budget  || normalizeBudget(message) || undefined;
      context.mode    = context.mode    || parsed.mode    || normalizeMode(message)   || undefined;
    }

    if (!context.from && lat != null && lng != null) {
      try {
        const liveLocation = await getLiveLocation(lat, lng);
        if (liveLocation && liveLocation !== "Unknown Location") {
          context.from = liveLocation;
        }
      } catch (locationError) {
        console.error('Error getting live location:', locationError);
      }
    }

    const slots: (keyof TripContext)[] = ['from', 'to', 'date', 'budget', 'groupSize', 'mode'];
    const missing = slots.find((key) => !context[key]);

    if (missing) {
      return NextResponse.json({
        assistantFollowUp: true,
        ask: missing,
        context,
        message: QUESTIONS[missing],
      });
    }

    if (!context.mode || !context.budget || !context.from || !context.to || !context.date) {
      return NextResponse.json({ error: 'Internal error: Missing critical trip details.' }, { status: 500 });
    }

    const transportPrice = {
      Train: getRandomPrice(800, 1800),
      Bus: getRandomPrice(600, 1400),
      Flight: getRandomPrice(1500, 4500),
    }[context.mode];

    const hotelPrice = {
      Luxury: getRandomPrice(4000, 6000),
      Medium: getRandomPrice(2500, 4000),
      'Budget-friendly': getRandomPrice(1200, 2500),
    }[context.budget];

    const cabOptions = [
      { provider: 'Uber', price: getRandomPrice(300, 450) },
      { provider: 'Ola', price: getRandomPrice(280, 400) },
      { provider: 'Rapido', price: getRandomPrice(200, 350) },
    ];
    const cabToStation = cabOptions[Math.floor(Math.random() * cabOptions.length)];
    const cabToHotel = cabOptions[Math.floor(Math.random() * cabOptions.length)];
    const total = transportPrice + hotelPrice + cabToStation.price + cabToHotel.price;

    const tripPlan = {
      cabToStation: {
        ...cabToStation,
        from: `${context.from} City`,
        to: `${context.from} Station`,
      },
      transport: {
        mode: context.mode,
        name: `${context.from}-${context.to} ${context.mode} Service`,
        from: context.from,
        to: context.to,
        date: context.date,
        price: transportPrice,
      },
      cabToHotel: {
        ...cabToHotel,
        from: `${context.to} Station`,
        to: `Hotel in ${context.to}`,
      },
      hotel: {
        name: `The ${context.budget} Hotel in ${context.to}`,
        price: hotelPrice,
        category: context.budget,
      },
      food: [`Local Bistro in ${context.to}`, 'Famous Sweets & Snacks', 'Budget Eats Cafe'],
      groupSize: context.groupSize,
      total,
    };

    return NextResponse.json({
      success: true,
      from: context.from,
      to: context.to,
      data: tripPlan,
      message: `Great! I've planned a trip from ${context.from} to ${context.to} for ${context.date}.`,
    });
  } catch (error: unknown) {
    console.error('Trip planning API failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'Something went wrong while planning your trip.',
      },
      { status: 500 }
    );
  }
}
