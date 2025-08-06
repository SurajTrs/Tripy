// src/components/tripResults/HotelCard.tsx
import React from 'react';
import { HotelData } from '../../types'; // Ensure correct path to your types.ts

// --- NEW & IMPORTANT ---
// 1. We add an 'onSelect' function to the props, just like in FlightCard.
interface HotelCardProps {
  hotel: HotelData;
  onSelect: (hotel: HotelData) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, onSelect }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://placehold.co/100x100/7c3aed/ffffff?text=Hotel`;
    e.currentTarget.alt = 'Image not available';
  };

  return (
    // --- NEW & IMPORTANT ---
    // 2. The entire div is now a clickable button that calls the onSelect function.
    // 3. Added cursor-pointer and hover effects for better user experience.
    <div
      onClick={() => onSelect(hotel)}
      className="bg-white p-4 rounded-lg shadow-md mb-3 border border-gray-200 flex items-center cursor-pointer transition-all duration-200 hover:border-violet-500 hover:shadow-lg"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(hotel)} // For accessibility
    >
      <img
        src={hotel.imageUrl || `https://placehold.co/100x100/7c3aed/ffffff?text=Hotel`}
        alt={hotel.name}
        className="w-24 h-24 object-cover rounded-lg mr-4"
        onError={handleImageError}
      />
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-gray-800 text-base leading-tight">{hotel.name}</h3>
          <span className="text-lg font-bold text-violet-600 whitespace-nowrap ml-2">
            ₹{hotel.price.toLocaleString()}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <p>Category: {hotel.category}</p>
          {hotel.rating && (
             <p className="flex items-center">
                Rating: {hotel.rating} 
                <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
             </p>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">{hotel.address}</p>
      </div>
    </div>
  );
};