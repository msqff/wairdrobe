
import React from 'react';
import { Garment } from '../types';

interface CategoryCardProps {
  category: string;
  items: Garment[];
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, items, onClick }) => {
  const count = items.length;
  // Get up to 3 valid images for the preview stack
  const previewImages = items
    .map(i => i.imageUrl)
    .filter(url => url && url.length > 0)
    .slice(0, 3);

  return (
    <button 
      onClick={onClick}
      className="group relative w-full bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300 text-left flex flex-col h-full"
    >
      {/* Image Stack Area */}
      <div className="relative w-full aspect-[4/3] mb-4 bg-stone-50 rounded-xl overflow-hidden flex items-center justify-center">
        {previewImages.length > 0 ? (
          <div className="relative w-full h-full">
             {/* Render images in a stacked/fan layout */}
             {previewImages.map((img, index) => {
               // Calculate offset for the fan effect
               // Center the stack based on number of items
               const centerIndex = (previewImages.length - 1) / 2;
               const offset = index - centerIndex;
               
               // Spread logic:
               // Translate X: Spread them out horizontally (percentage of element width)
               // Rotation: Fan them out slightly
               const translateX = offset * 35; // Wider spread
               const rotation = offset * 5; 
               const scale = 0.9 + (index * 0.05); // Slight scale difference
               const zIndex = index;
               
               return (
                 <div 
                    key={index}
                    className="absolute top-0 bottom-0 left-0 right-0 m-auto w-3/5 h-3/4 shadow-md rounded-lg overflow-hidden border-2 border-white transition-transform duration-500 group-hover:scale-[1.1]"
                    style={{
                        zIndex,
                        transform: `translateX(${translateX}%) rotate(${rotation}deg) scale(${scale})`,
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transformOrigin: 'center bottom'
                    }}
                 />
               );
             })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-stone-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
             </svg>
             <span className="text-xs font-medium">No Images</span>
          </div>
        )}
      </div>

      {/* Text Info */}
      <div className="mt-auto">
        <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
            {category}
        </h3>
        <p className="text-sm font-medium text-stone-500">
            {count} {count === 1 ? 'item' : 'items'}
        </p>
      </div>
      
      {/* Arrow Icon */}
      <div className="absolute bottom-4 right-4 text-stone-300 group-hover:text-stone-800 transition-colors transform group-hover:translate-x-1 duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </button>
  );
};

export default CategoryCard;
