import React from 'react';

interface Flight {
  airline: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  isReturn?: boolean;
}

interface Hotel {
  name: string;
  location: string;
  pricePerNight: string;
}

interface Uber {
  type: string;
  estimatedCost: string;
  estimatedTime: string;
}

interface TripSummaryProps {
  destination: string;
  origin?: string;
  flights: Flight[];
  hotels: Hotel[];
  ubers: Uber[];
  returnTrip?: boolean;
}

const TripSummary: React.FC<TripSummaryProps> = ({ destination, origin, flights, hotels, ubers, returnTrip = false }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Trip Summary for {origin && returnTrip ? `${origin} ↔ ${destination}` : destination}</h2>

      {/* Flights */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Flights</h3>
        <ul className="space-y-2">
          {flights.map((flight, index) => (
            <li key={index} className="border p-4 rounded-md bg-gray-50">
              {flight.isReturn && <div className="bg-violet-100 text-violet-800 px-2 py-1 rounded text-xs font-semibold mb-2 inline-block">Return Flight</div>}
              <p><strong>Airline:</strong> {flight.airline}</p>
              <p><strong>Departure:</strong> {flight.departureTime}</p>
              <p><strong>Arrival:</strong> {flight.arrivalTime}</p>
              <p><strong>Price:</strong> {flight.price}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Hotels */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Hotels</h3>
        <ul className="space-y-2">
          {hotels.map((hotel, index) => (
            <li key={index} className="border p-4 rounded-md bg-gray-50">
              <p><strong>Name:</strong> {hotel.name}</p>
              <p><strong>Location:</strong> {hotel.location}</p>
              <p><strong>Price Per Night:</strong> {hotel.pricePerNight}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Ubers */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Uber Options</h3>
        <ul className="space-y-2">
          {ubers.map((uber, index) => (
            <li key={index} className="border p-4 rounded-md bg-gray-50">
              <p><strong>Type:</strong> {uber.type}</p>
              <p><strong>Estimated Cost:</strong> {uber.estimatedCost}</p>
              <p><strong>Arrival in:</strong> {uber.estimatedTime}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TripSummary;
