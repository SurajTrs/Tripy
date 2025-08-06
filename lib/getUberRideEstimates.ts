export async function getUberRideEstimates(
  accessToken: string,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) {
  try {
    const response = await fetch(
      `https://api.uber.com/v1.2/estimates/price?start_latitude=${startLat}&start_longitude=${startLng}&end_latitude=${endLat}&end_longitude=${endLng}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch Uber estimates');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Uber estimate error:', error);
    throw error;
  }
}
