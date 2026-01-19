
import React from 'react';
import { Garment } from '../types';
import Tag from './Tag';

interface GarmentCardProps {
  garment: Garment;
  onMarkAsWorn: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (garment: Garment) => void;
}

const GarmentCard: React.FC<GarmentCardProps> = ({ garment, onMarkAsWorn, onDelete, onEdit }) => {

  const getDaysSinceWorn = (lastWornDate?: string): number | null => {
    if (!lastWornDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const wornDate = new Date(lastWornDate + 'T00:00:00'); 
    const diffTime = today.getTime() - wornDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const daysSinceWorn = getDaysSinceWorn(garment.lastWorn);
  const isWornToday = daysSinceWorn === 0;

  // Determine status color for the dot
  let statusColor = 'bg-gray-300';
  let statusText = 'Never worn';
  
  if (daysSinceWorn !== null) {
      if (isWornToday) {
          statusColor = 'bg-green-500';
          statusText = 'Worn today';
      } else if (daysSinceWorn <= 14) {
          statusColor = 'bg-yellow-400';
          statusText = daysSinceWorn === 1 ? 'Worn yesterday' : `Worn ${daysSinceWorn} days ago`;
      } else {
          statusColor = 'bg-red-500';
          statusText = `Worn ${daysSinceWorn} days ago`; // Neglected
      }
  } else {
      // Never worn logic
      if (garment.isNewPurchase) {
          statusColor = 'bg-blue-500';
          statusText = 'Brand New';
      } else {
          // Existing items added without history are considered neglected until worn
          statusColor = 'bg-red-500';
          statusText = 'Neglected (Never worn)';
      }
  }

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300">
      
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-100">
        <img 
            src={garment.imageUrl} 
            alt={garment.name || garment.type} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        
        {/* Status Dot */}
        <div className={`absolute top-3 left-3 h-4 w-4 rounded-full border-2 border-white shadow-sm ${statusColor}`}></div>

        <div className="absolute top-2 right-2 flex space-x-2">
            {/* Edit Button */}
            {onEdit && (
                <button 
                    type="button"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        onEdit(garment); 
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-2 bg-white/95 text-stone-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-stone-100 hover:text-stone-800 transition-all duration-200 z-20 cursor-pointer border border-stone-100"
                    title="Edit details"
                    aria-label="Edit details"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
            )}

            {/* Delete Button */}
            {onDelete && (
            <button 
                type="button"
                onClick={(e) => { 
                e.stopPropagation(); 
                onDelete(garment.id); 
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-2 bg-white/95 text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-100 transition-all duration-200 z-20 cursor-pointer border border-stone-100"
                title="Delete garment"
                aria-label="Delete garment"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
            )}
        </div>

        {/* Action Button - Bottom Right */}
        <button 
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              onMarkAsWorn(garment.id); 
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`absolute bottom-3 right-3 p-2 rounded-full shadow-md backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 ${isWornToday ? 'bg-white text-green-600' : 'bg-white/90 text-stone-800 hover:bg-white'} cursor-pointer z-20`}
            title={isWornToday ? "Undo worn today" : "Mark as worn today"}
            aria-label={isWornToday ? "Undo worn today" : "Mark as worn today"}
        >
            {isWornToday ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
            <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight line-clamp-1" title={garment.name || garment.type}>
            {garment.name || garment.type}
            </h3>
            {garment.name && (
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mt-1">{garment.type}</p>
            )}
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-4">
          {garment.uses.slice(0, 3).map(use => <Tag key={use} label={use} />)}
        </div>
        
        <div className="mt-auto pt-3 border-t border-stone-100">
          <p className="text-xs font-medium text-stone-400">{statusText}</p>
        </div>
      </div>
    </div>
  );
};

export default GarmentCard;
