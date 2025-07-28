// /app/api/uber/auth/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.UBER_CLIENT_ID!;
  const redirectUri = process.env.UBER_REDIRECT_URI!;
  const scope = 'history profile request';
  const responseType = 'code';

  const authUrl = `https://login.uber.com/oauth/v2/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(authUrl);
}
