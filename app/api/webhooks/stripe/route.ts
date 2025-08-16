// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { headers } from 'next/headers';

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !endpointSecret || !stripe) {
      return NextResponse.json(
        { error: 'Missing Stripe configuration' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        // Update booking status in your database
        await updateBookingStatus(paymentIntent.metadata?.tripId || 'unknown', 'confirmed', paymentIntent.id);
        break;
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        console.log(`Payment failed: ${failedPaymentIntent.last_payment_error?.message}`);
        // Update booking status in your database
        await updateBookingStatus(failedPaymentIntent.metadata?.tripId || 'unknown', 'failed', failedPaymentIntent.id);
        break;
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        // Update booking status in your database
        await updateBookingStatus(session.metadata?.tripId || 'unknown', 'confirmed', session.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Function to update booking status in your database
async function updateBookingStatus(tripId: string, status: 'confirmed' | 'failed' | 'pending', paymentId: string) {
  // In a real implementation, you would update your database
  // For now, we'll just log the status change
  console.log(`Updating booking ${tripId} to status: ${status} with payment ID: ${paymentId}`);
  
  // Example database update (commented out)
  // await prisma.booking.update({
  //   where: { id: tripId },
  //   data: { status, paymentId }
  // });
}