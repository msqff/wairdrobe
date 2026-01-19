
import React, { useState, useMemo } from 'react';
import { Garment } from '../types';
import GarmentCard from './GarmentCard';

interface WardrobeGridProps {
  wardrobe: Garment[];
  onMarkAsWorn: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (garment: Garment) => void;
}

type SortOption = 'dateAdded' | 'lastWorn' | 'type';

const WardrobeGrid: React.FC<WardrobeGridProps> = ({ wardrobe, onMarkAsWorn, onDelete, onEdit }) => {
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');

  const sortedWardrobe = useMemo(() => {
    const sorted = [...wardrobe];

    switch (sortBy) {
      case 'lastWorn':
        // Sort by last worn descending (most recent first), then items never worn
        return sorted.sort((a, b) => {
          if (!a.lastWorn && !b.lastWorn) return 0;
          if (!a.lastWorn) return 1;
          if (!b.lastWorn) return -1;
          return b.lastWorn.localeCompare(a.lastWorn);
        });
      
      case 'dateAdded':
        // ID is timestamp
        return sorted.sort((a, b) => b.id.localeCompare(a.id));

      case 'type':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));

      default:
        return sorted;
    }
  }, [wardrobe, sortBy]);

  if (wardrobe.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-200">
        <div className="mx-auto h-16 w-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </div>
        <h3 className="text-lg font-serif font-semibold text-stone-900">Your wardrobe is empty</h3>
        <p className="mt-1 text-sm text-stone-500">Add your first piece to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Icon-based Sort Bar */}
      <div className="flex items-center justify-between bg-stone-100/50 p-1.5 rounded-xl">
        <button 
            onClick={() => setSortBy('dateAdded')}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'dateAdded' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            title="Sort by Date Added"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </button>
        <button 
            onClick={() => setSortBy('lastWorn')}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'lastWorn' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            title="Sort by Last Worn"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <button 
            onClick={() => setSortBy('type')}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'type' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
            title="Sort by Category"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedWardrobe.map(garment => (
          <GarmentCard 
            key={garment.id} 
            garment={garment} 
            onMarkAsWorn={onMarkAsWorn} 
            onDelete={onDelete} 
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
};

export default WardrobeGrid;
