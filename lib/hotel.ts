export async function getHotelOptions(city: string) {
  const base = 3000;
  const variation = Math.floor(Math.random() * 2000);
  return {
    name: `Grand Hotel ${city}`,
    stars: 3,
    location: `${city} Main Road`,
    price: base + variation,
  };
}
