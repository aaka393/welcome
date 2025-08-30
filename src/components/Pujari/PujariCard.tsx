import React from 'react';
import { Star } from 'lucide-react';
import { Pujari } from '../../types';

interface PujariCardProps {
  pujari: Pujari;
  selected?: boolean;
  isCenter?: boolean;
  // When true, render a smaller/compact version of the card suitable for dense grids
  compact?: boolean;
  onClick: () => void;
}

const PujariCard: React.FC<PujariCardProps> = ({ pujari, selected, isCenter, compact, onClick }) => {
  // Keep card and image dimensions consistent so scaling doesn't change layout height.
  const baseCard = `flex-shrink-0 cursor-pointer transition-transform duration-500 ease-in-out`;
  // smaller footprint when compact is requested
  const sizeClass = compact ? `w-36 p-2 rounded-lg` : `w-72 p-6 rounded-2xl`;
  const scaleClass = isCenter ? `transform scale-110 z-10` : `transform scale-95 opacity-90`;
  const bgClass = selected
    ? `bg-gradient-to-b from-orange-100 to-red-100 border-3 border-orange-500 shadow-2xl sacred-glow`
    : `bg-white/90 backdrop-blur-sm border-2 border-orange-200 hover:border-orange-400 shadow-xl hover:shadow-2xl hover:sacred-glow`;

  return (
    <div onClick={onClick} className={`${baseCard} ${sizeClass} ${scaleClass} ${bgClass}`}>
      <div className="text-center">
        <div className={`relative ${isCenter ? 'mb-6' : 'mb-4'}`}>
          <img
            src={pujari.image}
            alt={pujari.name}
            // Use fixed image dimensions and scale visually to avoid layout changes
            className={`${
              compact ? 'w-24 h-24 border-2' : 'w-64 h-64 border-4'
            } rounded-full mx-auto object-cover border-orange-300 shadow-lg transition-transform duration-500 ${
              isCenter ? 'scale-100' : compact ? 'scale-95' : 'scale-75'
            }`}
          />
          {selected && (
            <div className={`absolute ${isCenter ? '-top-2 -right-2 w-10 h-10' : '-top-1 -right-1 w-8 h-8'} bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse`}>
              <span className={`text-white ${isCenter ? 'text-lg' : 'text-xs'} font-bold`}>✓</span>
            </div>
          )}
          {isCenter && (
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <Star className="w-4 h-4 text-white" fill="currentColor" />
            </div>
          )}
        </div>
        <h3 className={`font-bold text-gray-800 mb-2 ${isCenter ? (compact ? 'text-lg' : 'text-xl') : (compact ? 'text-sm' : 'text-sm')}`}>
          {pujari.name}
        </h3>
        
        
      </div>
    </div>
  );
};

export default PujariCard;