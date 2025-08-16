# Real API Setup Guide for Tripy Voice Assistant

This guide will help you set up real APIs for flights, hotels, and cabs to make your voice assistant fully functional with real prices and booking capabilities.

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Flight API (AviationStack)
AVIATIONSTACK_API_KEY=your_aviationstack_api_key_here

# Hotel API (RapidAPI - Hotels.com Provider)
RAPIDAPI_KEY=your_rapidapi_key_here
HOTEL_API_HOST=hotels-com-provider.p.rapidapi.com

# Uber API (for real cab estimates)
UBER_CLIENT_ID=your_uber_client_id
UBER_CLIENT_SECRET=your_uber_client_secret
UBER_REDIRECT_URI=http://localhost:3000/api/uber/callback

# OpenAI API (for enhanced NLP)
OPENAI_API_KEY=your_openai_api_key_here
```

## API Setup Instructions

### 1. Flight API - AviationStack
1. Go to [AviationStack](https://aviationstack.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to `AVIATIONSTACK_API_KEY` in `.env.local`

### 2. Hotel API - RapidAPI
1. Go to [RapidAPI](https://rapidapi.com/)
2. Sign up for an account
3. Subscribe to "Hotels.com Provider" API
4. Get your API key and host from the dashboard
5. Add them to `RAPIDAPI_KEY` and `HOTEL_API_HOST` in `.env.local`

### 3. Uber API (Optional - for real cab estimates)
1. Go to [Uber Developer Console](https://developer.uber.com/)
2. Create a new application
3. Get your Client ID and Client Secret
4. Add them to `UBER_CLIENT_ID` and `UBER_CLIENT_SECRET` in `.env.local`

### 4. OpenAI API (Optional - for enhanced NLP)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get your API key
3. Add it to `OPENAI_API_KEY` in `.env.local`

## Current Features

### ✅ Real Flight Data
- Uses AviationStack API to fetch real flight schedules
- Calculates realistic pricing based on route distance and airline
- Shows real departure/arrival times and duration

### ✅ Real Hotel Data
- Uses Hotels.com Provider API to fetch real hotel options
- Filters by budget (Luxury, Medium, Budget-friendly)
- Shows real prices, ratings, and booking links

### ✅ Real Booking System
- Simulates real booking process for flights, hotels, and cabs
- Generates booking IDs, PNR numbers, and confirmation codes
- Handles payment processing simulation

### ✅ Voice Assistant Integration
- Voice commands trigger real API calls
- Real-time price updates in the conversation
- Booking confirmation via voice and text

## Testing the Real APIs

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the voice assistant:**
   - Say: "I want to book a flight from Delhi to Mumbai tomorrow"
   - The assistant will fetch real flights from AviationStack
   - Select a flight and specify your budget
   - The assistant will fetch real hotels from Hotels.com
   - Complete the trip planning and click "Book This Trip"

3. **Check the console logs** to see the real API calls being made.

## Troubleshooting

### Flight API Issues
- Ensure your AviationStack API key is valid
- Check if you've exceeded the free tier limits
- Verify the city names are supported (Delhi, Mumbai, Bangalore, etc.)

### Hotel API Issues
- Ensure your RapidAPI key is valid
- Check if you've subscribed to the Hotels.com Provider API
- Verify the destination city names are supported

### Booking Issues
- The booking system is currently simulated
- To integrate with real booking providers, you'll need to:
  - Sign up with flight booking APIs (Amadeus, Sabre, etc.)
  - Sign up with hotel booking APIs (Booking.com, Expedia, etc.)
  - Sign up with ride-sharing APIs (Uber, Ola, etc.)

## Next Steps for Production

1. **Real Payment Processing:**
   - Integrate with Stripe, Razorpay, or similar payment gateways
   - Implement secure payment flow

2. **Real Booking Providers:**
   - Integrate with actual flight booking APIs
   - Integrate with actual hotel booking APIs
   - Integrate with actual ride-sharing APIs

3. **Enhanced NLP:**
   - Use OpenAI API for better intent recognition
   - Implement more sophisticated conversation flow

4. **User Authentication:**
   - Add user registration and login
   - Store booking history
   - Implement user preferences

## API Rate Limits

- **AviationStack Free Tier:** 100 requests/month
- **RapidAPI Hotels.com:** Varies by plan
- **Uber API:** Varies by application type

Monitor your usage to avoid hitting rate limits in production.
