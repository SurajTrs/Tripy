export async function getTrainPrice(from: string, to: string) {
  return {
    name: `${to} Express`,
    from,
    to,
    price: 1200 + Math.floor(Math.random() * 800),
    class: '2AC',
  };
}
