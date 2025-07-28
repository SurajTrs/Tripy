// /app/api/uber/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  const clientId = process.env.UBER_CLIENT_ID!;
  const clientSecret = process.env.UBER_CLIENT_SECRET!;
  const redirectUri = process.env.UBER_REDIRECT_URI!;

  const tokenResponse = await fetch('https://login.uber.com/oauth/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code || '',
    }),
  });

  const tokenData = await tokenResponse.json();

  // Save tokenData.access_token to your database or session
  console.log('Uber Access Token:', tokenData);

  return NextResponse.json({ success: true, tokenData });
}
