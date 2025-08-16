// lib/stripe.ts
import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Initialize Stripe server-side instance
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}

if (!stripePublishableKey) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Initialize Stripe server-side instance
export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16', // Use the latest API version
}) : null;

// Client-side Stripe promise
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Create a payment intent
export async function createPaymentIntent(amount: number, currency: string = 'inr', metadata: any = {}) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Check your environment variables.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit (cents/paise)
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new Error(`Payment processing failed: ${error.message}`);
  }
}

// Process a payment
export async function processPayment(amount: number, paymentMethodId: string, currency: string = 'inr', metadata: any = {}) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Check your environment variables.');
  }

  try {
    // Create a payment intent
    const paymentIntent = await createPaymentIntent(amount, currency, metadata);
    
    // Confirm the payment with the provided payment method
    const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: paymentMethodId,
    });

    return {
      success: confirmedPayment.status === 'succeeded',
      paymentIntentId: confirmedPayment.id,
      status: confirmedPayment.status,
      message: confirmedPayment.status === 'succeeded' 
        ? 'Payment processed successfully' 
        : `Payment status: ${confirmedPayment.status}`,
    };
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      message: `Payment failed: ${error.message}`,
    };
  }
}

// Create a checkout session
export async function createCheckoutSession({
  lineItems,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  lineItems: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
        images?: string[];
      };
      unit_amount: number;
    };
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Check your environment variables.');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    return session;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}