// src/components/tripResults/FlightCard.tsx
import React from 'react';
import { FlightData } from '../../types'; // Ensure correct path to your types.ts

// --- NEW & IMPORTANT ---
// 1. We add an 'onSelect' function to the props.
// This function will be called when the user clicks on the card.
interface FlightCardProps {
  flight: FlightData;
  onSelect: (flight: FlightData) => void;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, onSelect }) => {
  return (
    // --- NEW & IMPORTANT ---
    // 2. The entire div is now a clickable button that calls the onSelect function.
    // 3. Added cursor-pointer and hover effects for better user experience.
    <div
      onClick={() => onSelect(flight)}
      className="bg-white p-4 rounded-lg shadow-md mb-3 border border-gray-200 cursor-pointer transition-all duration-200 hover:border-violet-500 hover:shadow-lg"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(flight)} // For accessibility
    >
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-800">
          {flight.airline} - {flight.flightNumber}
        </h4>
        <p className="text-lg font-bold text-violet-600">
          ₹{flight.price.toLocaleString()}
        </p>
      </div>
      <div className="text-sm text-gray-600 mt-1">
        <span>{flight.departureAirportIata} ({flight.departureTime})</span>
        <span className="mx-2">→</span>
        <span>{flight.arrivalAirportIata} ({flight.arrivalTime})</span>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Duration: {flight.duration} | Stops: {flight.stops}
      </div>
    </div>
  );
};
