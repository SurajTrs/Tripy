// app/api/hotels/region/route.ts

import { fetchRegions } from '@/lib/hotelApi'; // Adjust based on your project structure

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || 'Prague';

  try {
    const data = await fetchRegions(query);
    return Response.json(data);
  } catch (error) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: 'Failed to fetch regions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
