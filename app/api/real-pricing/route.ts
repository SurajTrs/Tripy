// app/api/real-pricing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRealTimePricing } from '@/lib/realPricing';

export async function POST(req: NextRequest) {
  try {
    const {
      transportType,
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      hotelNeeded,
      cabToStationNeeded,
      cabToHotelNeeded
    } = await req.json();

    // Validate required fields
    if (!transportType || !origin || !destination || !departureDate || !adults) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Get real-time pricing
    const pricingResults = await getRealTimePricing({
      transportType,
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      hotelNeeded,
      cabToStationNeeded,
      cabToHotelNeeded
    });

    return NextResponse.json({
      success: true,
      data: pricingResults
    });
  } catch (error: any) {
    console.error('Error in real-pricing API:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to get real-time pricing'
    }, { status: 500 });
  }
}