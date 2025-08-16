// Minimal Amadeus REST client (no external SDK) for sandbox/production
// Docs: https://developers.amadeus.com
// This module exposes helpers to:
// - getAccessToken
// - searchFlightOffers
// - priceFlightOffer
// - createFlightOrder (returns PNR in associatedRecords when available)

const AMA_BASE = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
const AMA_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMA_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

export type Passenger = {
  id: string; // '1', '2', ...
  dateOfBirth: string; // 'YYYY-MM-DD'
  gender?: 'MALE' | 'FEMALE' | 'UNSPECIFIED';
  name: { firstName: string; lastName: string };
  contact?: {
    emailAddress?: string;
    phones?: Array<{ deviceType: 'MOBILE' | 'LANDLINE'; countryCallingCode?: string; number: string }>;
  };
  documents?: Array<{
    documentType: 'PASSPORT' | 'ID';
    number: string;
    expiryDate?: string; // 'YYYY-MM-DD'
    nationality?: string; // ISO alpha-2
    holder?: boolean;
  }>;
};

export type SearchParams = {
  originLocationCode: string; // e.g. 'DEL'
  destinationLocationCode: string; // e.g. 'BOM'
  departureDate: string; // 'YYYY-MM-DD'
  returnDate?: string; // optional
  adults: number; // >=1
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  currencyCode?: string; // e.g. 'INR'
  max?: number; // number of offers
};

export type FlightOrderResponse = {
  id: string; // flight order id
  type: string;
  associatedRecords?: Array<{ reference: string; creationDate?: string; originSystemCode?: string }>; // PNR
  travelers?: any[];
  tickets?: any[];
  raw: any;
};

async function getAccessToken(): Promise<string> {
  if (!AMA_CLIENT_ID || !AMA_CLIENT_SECRET) {
    throw new Error('Amadeus credentials missing: set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET');
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');
  body.set('client_id', AMA_CLIENT_ID);
  body.set('client_secret', AMA_CLIENT_SECRET);

  const res = await fetch(`${AMA_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    // @ts-ignore Next runtime option
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus auth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

export async function searchFlightOffers(params: SearchParams) {
  const token = await getAccessToken();
  const query = new URLSearchParams({
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: String(params.adults),
  });
  if (params.returnDate) query.set('returnDate', params.returnDate);
  if (params.travelClass) query.set('travelClass', params.travelClass);
  if (params.currencyCode) query.set('currencyCode', params.currencyCode);
  if (params.max) query.set('max', String(params.max));

  const res = await fetch(`${AMA_BASE}/v2/shopping/flight-offers?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    // @ts-ignore
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus search failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return { token, data };
}

export async function priceFlightOffer(flightOffer: any, token?: string) {
  const accessToken = token || (await getAccessToken());
  const body = JSON.stringify({ data: { type: 'flight-offers-pricing', flightOffers: [flightOffer] } });
  const res = await fetch(`${AMA_BASE}/v1/shopping/flight-offers/pricing`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body,
    // @ts-ignore
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus pricing failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const pricedOffer = data?.data?.flightOffers?.[0] || data?.data;
  return { token: accessToken, data, pricedOffer };
}

export async function createFlightOrder(
  params: { flightOffer: any; passengers: Passenger[]; contacts?: any[] },
  token?: string
): Promise<FlightOrderResponse> {
  const accessToken = token || (await getAccessToken());
  const payload = {
    data: {
      type: 'flight-order',
      flightOffers: [params.flightOffer],
      travelers: params.passengers.map((p) => ({
        id: p.id,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender || 'UNSPECIFIED',
        name: { firstName: p.name.firstName, lastName: p.name.lastName },
        contact: p.contact,
        documents: p.documents,
      })),
      contacts: params.contacts,
    },
  };

  const res = await fetch(`${AMA_BASE}/v1/booking/flight-orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // @ts-ignore
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus order failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const order = data?.data || data;
  return {
    id: order?.id,
    type: order?.type,
    associatedRecords: order?.associatedRecords,
    travelers: order?.travelers,
    tickets: order?.tickets,
    raw: data,
  };
}

export function extractPNR(order: FlightOrderResponse): string | undefined {
  return order?.associatedRecords?.[0]?.reference;
}
