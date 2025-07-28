import { NextRequest, NextResponse } from 'next/server';
import { parseTripDetails } from '@/lib/nlpParser';
import { getLiveLocation } from '@/lib/location';

type TripContext = {
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
};

const getRandomPrice = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export async function POST(req: NextRequest) {
  try {
    const { message, lat, lng, context: ctxIn = {} } = await req.json();

    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Invalid or missing message.' }, { status: 400 });
    }

    const context: TripContext = { ...ctxIn };
    const parsed = await parseTripDetails(message);

    context.from      ||= parsed.from ?? undefined;
    context.to        ||= parsed.to ?? undefined;
    context.date      ||= parsed.date ?? undefined;
    context.budget    ||= ctxIn.budget;
    context.groupSize ||= ctxIn.groupSize;
    context.mode      ||= ctxIn.mode;

    if (!context.from && lat != null && lng != null) {
      context.from = await getLiveLocation(lat, lng);
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

    const transportPrice = {
      Train: getRandomPrice(800, 1800),
      Bus: getRandomPrice(600, 1400),
      Flight: getRandomPrice(1500, 4500),
    }[context.mode!]!;

    const hotelPrice = {
      Luxury: getRandomPrice(4000, 6000),
      Medium: getRandomPrice(2500, 4000),
      'Budget-friendly': getRandomPrice(1200, 2500),
    }[context.budget!]!;

    const cabOptions = [
      { provider: 'Uber', price: getRandomPrice(300, 450) },
      { provider: 'Ola', price: getRandomPrice(280, 400) },
      { provider: 'Rapido', price: getRandomPrice(200, 350) },
    ];

    const cabToStation = cabOptions.reduce((a, b) => (a.price < b.price ? a : b));
    const cabToHotel = cabOptions.reduce((a, b) => (a.price > b.price ? a : b));

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
        to: `Hotel ${context.to}`,
      },
      hotel: {
        name: `Hotel ${context.to}`,
        price: hotelPrice,
        category: context.budget,
      },
      food: [`Cafe ${context.to}`, 'Local Tadka', 'Chai Point'],
      groupSize: context.groupSize,
      total,
    };

    return NextResponse.json({
      success: true,
      from: context.from,
      to: context.to,
      data: tripPlan,
      message: `Done! Here’s your trip plan from ${context.from} to ${context.to} on ${context.date}. Shall I book it?`,
    });
  } catch (error: any) {
    console.error('Trip planning failed:', error);
    return NextResponse.json(
      { error: 'Something went wrong while planning your trip.' },
      { status: 500 }
    );
  }
}
