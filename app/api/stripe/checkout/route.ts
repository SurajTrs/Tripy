// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '../../../../lib/stripe';
import { TripPlanData } from '../../../../types';

export async function POST(req: NextRequest) {
  try {
    const { tripPlan, userDetails }: { tripPlan: TripPlanData, userDetails: any } = await req.json();

    if (!tripPlan) {
      return NextResponse.json({
        success: false,
        message: 'Missing trip plan information'
      }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = tripPlan.total || (
      (tripPlan.transport?.price || 0) + 
      (tripPlan.hotel?.price || 0) + 
      (tripPlan.cabToStation?.price || 0) + 
      (tripPlan.cabToHotel?.price || 0) +
      (tripPlan.returnTransport?.price || 0)
    ) * (tripPlan.groupSize || 1);

    // Prepare line items for Stripe checkout
    const lineItems = [];

    // Add transport
    if (tripPlan.transport) {
      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${tripPlan.transportType?.toUpperCase() || 'Transport'} from ${tripPlan.transport.departureCity || ''} to ${tripPlan.transport.arrivalCity || ''}`,
            description: `${tripPlan.transport.departureTime || ''} - ${tripPlan.transport.arrivalTime || ''} | ${tripPlan.transport.duration || ''}`,
          },
          unit_amount: Math.round(tripPlan.transport.price * 100), // Convert to paise
        },
        quantity: tripPlan.groupSize || 1,
      });
    }

    // Add return transport if applicable
    if (tripPlan.returnTrip && tripPlan.returnTransport) {
      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: `Return ${tripPlan.transportType?.toUpperCase() || 'Transport'} from ${tripPlan.returnTransport.departureCity || ''} to ${tripPlan.returnTransport.arrivalCity || ''}`,
            description: `${tripPlan.returnTransport.departureTime || ''} - ${tripPlan.returnTransport.arrivalTime || ''} | ${tripPlan.returnTransport.duration || ''}`,
          },
          unit_amount: Math.round(tripPlan.returnTransport.price * 100), // Convert to paise
        },
        quantity: tripPlan.groupSize || 1,
      });
    }

    // Add hotel
    if (tripPlan.hotel) {
      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: `Hotel: ${tripPlan.hotel.name || 'Accommodation'}`,
            description: `${tripPlan.hotel.location || ''} | ${tripPlan.hotel.rating || ''} Star`,
          },
          unit_amount: Math.round(tripPlan.hotel.price * 100), // Convert to paise
        },
        quantity: tripPlan.groupSize || 1,
      });
    }

    // Add cab to station if applicable
    if (tripPlan.cabToStation) {
      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: tripPlan.cabToStation.name || 'Cab to Station',
            description: tripPlan.cabToStation.details || '',
          },
          unit_amount: Math.round(tripPlan.cabToStation.price * 100), // Convert to paise
        },
        quantity: 1,
      });
    }

    // Add cab to hotel if applicable
    if (tripPlan.cabToHotel) {
      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: {
            name: tripPlan.cabToHotel.name || 'Cab to Hotel',
            description: tripPlan.cabToHotel.details || '',
          },
          unit_amount: Math.round(tripPlan.cabToHotel.price * 100), // Convert to paise
        },
        quantity: 1,
      });
    }

    // Create metadata for the booking
    const metadata = {
      tripId: `TRIP-${Date.now()}`,
      transportType: tripPlan.transportType || '',
      origin: tripPlan.transport?.departureCity || '',
      destination: tripPlan.transport?.arrivalCity || '',
      departureDate: tripPlan.transport?.departureDate || '',
      returnDate: tripPlan.returnDate || '',
      groupSize: String(tripPlan.groupSize || 1),
      userName: userDetails?.name || 'Guest User',
      userEmail: userDetails?.email || 'guest@example.com',
    };

    // Create a Stripe checkout session
    const session = await createCheckoutSession({
      lineItems,
      successUrl: `${req.headers.get('origin')}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${req.headers.get('origin')}/booking-cancelled`,
      metadata,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'An error occurred during checkout',
    }, { status: 500 });
  }
}