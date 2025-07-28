export async function getCabOptions(from: string, to: string) {
  // Mocking API – replace with Uber/Ola SDK if needed
  const distanceKm = Math.floor(Math.random() * 10 + 5);
  const price = distanceKm * 20;

  return {
    provider: 'Rapido / Uber / Ola',
    from,
    to,
    distanceKm,
    price,
    estimatedTime: `${distanceKm * 3} mins`,
  };
}
