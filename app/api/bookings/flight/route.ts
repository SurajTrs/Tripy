import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findSession } from '@/lib/server/authStore';
import { searchFlightOffers, priceFlightOffer, createFlightOrder, extractPNR, type Passenger, type SearchParams } from '@/lib/providers/flights/amadeus';

// POST /api/bookings/flight
// Body options:
// 1) { search: SearchParams, passengers: Passenger[], contacts?: any[] }
// 2) { flightOffer: any, passengers: Passenger[], contacts?: any[] } (already selected offer)
// Returns: { success, orderId, pnr?, order }
export async function POST(req: NextRequest) {
  try {
    // Authentication (reuse existing pattern)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    const session = await findSession(sessionToken);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();

    // Validate env
    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
      return NextResponse.json({ success: false, message: 'Missing Amadeus credentials. Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET.' }, { status: 500 });
    }

    let token: string | undefined;
    let flightOffer: any | undefined = body.flightOffer;

    if (!flightOffer) {
      const search: SearchParams = body.search;
      if (!search || !search.originLocationCode || !search.destinationLocationCode || !search.departureDate || !search.adults) {
        return NextResponse.json({ success: false, message: 'Invalid search parameters' }, { status: 400 });
      }
      const searchRes = await searchFlightOffers(search);
      token = searchRes.token;
      const offers = searchRes.data?.data || [];
      if (!offers.length) {
        return NextResponse.json({ success: false, message: 'No flight offers found' }, { status: 404 });
      }
      // Basic selection strategy: pick first offer
      flightOffer = offers[0];
    }

    // Price the offer (confirm availability & final price)
    const priced = await priceFlightOffer(flightOffer, token);
    token = priced.token;
    const pricedOffer = priced.pricedOffer || flightOffer;

    // Passengers required
    const passengers: Passenger[] = body.passengers;
    if (!Array.isArray(passengers) || passengers.length === 0) {
      return NextResponse.json({ success: false, message: 'Passengers are required' }, { status: 400 });
    }

    // Create order (sandbox may auto-issue without payment; in production, ensure payment-handling per contract)
    const order = await createFlightOrder({ flightOffer: pricedOffer, passengers, contacts: body.contacts }, token);
    const pnr = extractPNR(order);

    return NextResponse.json({ success: true, orderId: order.id, pnr, order });
  } catch (err: any) {
    console.error('Flight booking error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'Internal server error' }, { status: 500 });
  }
}
