// /lib/getCabEstimates.ts
export async function getUberRideEstimates(accessToken: string, lat: number, lng: number) {
  const res = await fetch('https://api.uber.com/v1.2/estimates/price', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  return data;
}
