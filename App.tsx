
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { usePersistentWardrobe } from './hooks/usePersistentWardrobe';
import { Garment } from './types';
import Header from './components/Header';
import WardrobeGrid from './components/WardrobeGrid';
import AddGarmentModal from './components/AddGarmentModal';
import AIStylistModal from './components/AIStylistModal';
import EditGarmentModal from './components/EditGarmentModal';
import Spinner from './components/Spinner';
import CategoryCard from './components/CategoryCard';
import GarmentCard from './components/GarmentCard';
import { getGarmentCategory, CATEGORY_ORDER } from './utils/categoryHelper';
import { COLOURS, getColorMatches } from './utils/colorHelper';

const App: React.FC = () => {
  const { wardrobe, setWardrobe, isLoading, isSaving, exportData, importData } = usePersistentWardrobe();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStylistOpen, setIsStylistOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeColour, setActiveColour] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  
  // State for custom delete confirmation modal
  const [garmentToDelete, setGarmentToDelete] = useState<string | null>(null);

  // State for Editing
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);

  const addGarment = useCallback((newGarment: Omit<Garment, 'id' | 'lastWorn'>) => {
    setWardrobe(prev => [
      { ...newGarment, id: new Date().toISOString() },
      ...prev
    ]);
  }, [setWardrobe]);

  const updateGarment = useCallback((updatedGarment: Garment) => {
    setWardrobe(prev => prev.map(g => g.id === updatedGarment.id ? updatedGarment : g));
  }, [setWardrobe]);

  // Trigger the delete confirmation modal
  const requestDelete = useCallback((garmentId: string) => {
    setGarmentToDelete(garmentId);
  }, []);

  // Execute the actual deletion
  const confirmDelete = useCallback(() => {
    if (garmentToDelete) {
      console.log("Deleting garment with ID:", garmentToDelete);
      setWardrobe(prev => prev.filter(g => String(g.id) !== String(garmentToDelete)));
      setGarmentToDelete(null);
    }
  }, [garmentToDelete, setWardrobe]);

  const updateGarmentLastWorn = useCallback((garmentId: string) => {
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');

    setWardrobe(prev => 
      prev.map(garment => {
        if (String(garment.id) === String(garmentId)) {
          if (garment.lastWorn === today) {
             const { lastWorn, ...rest } = garment;
             return rest as Garment;
          }
          return { ...garment, lastWorn: today };
        }
        return garment;
      })
    );
  }, [setWardrobe]);

  // Reset filters when category changes
  useEffect(() => {
    setActiveColour(null);
    setActiveType(null);
    setIsFilterOpen(false);
  }, [selectedCategory]);

  // Group items by category (inferring if missing)
  const categorizedWardrobe = useMemo<Record<string, Garment[]>>(() => {
    const groups: Record<string, Garment[]> = {};
    
    // Initialize groups in order
    CATEGORY_ORDER.forEach(cat => groups[cat] = []);
    groups['Other'] = [];

    wardrobe.forEach(garment => {
        const cat = getGarmentCategory(garment);
        // Normalize category matching
        const matchedKey = Object.keys(groups).find(k => k.toLowerCase() === cat.toLowerCase());
        const finalKey = matchedKey || 'Other';
        
        if (!groups[finalKey]) groups[finalKey] = [];
        groups[finalKey].push(garment);
    });

    return groups;
  }, [wardrobe]);

  // 1. Get base items for the selected category
  const currentCategoryItems = useMemo(() => {
    if (!selectedCategory) return [];
    return categorizedWardrobe[selectedCategory] || [];
  }, [categorizedWardrobe, selectedCategory]);

  // 2. Derive available filter options from the items in this category
  const { availableTypes, availableColours } = useMemo(() => {
    const types = new Set<string>();
    const foundColourNames = new Set<string>();

    currentCategoryItems.forEach(item => {
        // Collect Type
        if (item.type) types.add(item.type);

        // Collect Colours
        COLOURS.forEach(c => {
            if (getColorMatches(item, c.name)) {
                foundColourNames.add(c.name);
            }
        });
    });

    return {
        availableTypes: Array.from(types).sort(),
        availableColours: COLOURS.filter(c => foundColourNames.has(c.name))
    };
  }, [currentCategoryItems]);

  // 3. Apply active filters
  const filteredGarments = useMemo(() => {
      return currentCategoryItems.filter(garment => {
          if (activeColour && !getColorMatches(garment, activeColour)) return false;
          if (activeType && garment.type !== activeType) return false;
          return true;
      });
  }, [currentCategoryItems, activeColour, activeType]);

  const newArrivals = useMemo(() => {
      return wardrobe.filter(g => g.isNewPurchase && !g.lastWorn);
  }, [wardrobe]);

  const activeFilterCount = (activeColour ? 1 : 0) + (activeType ? 1 : 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center font-sans">
        <Spinner className="text-orange-500 h-10 w-10 mb-4" />
        <p className="text-stone-500 font-medium">Loading your wardrobe...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 pb-20 relative">
      <Header 
        onExport={exportData}
        onImport={importData}
        isSaving={isSaving}
      />
      
      <main className="container mx-auto px-4 md:px-6 pt-6 md:pt-10 max-w-7xl">
        {/* Hero / Title Section */}
        <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-2">My wAIrdrobe</h2>
            <p className="text-stone-500 text-lg md:text-xl font-light">Track, organise, and rotate your clothes effortlessly</p>
        </div>

        {/* Primary Action - Always visible on Home */}
        {!selectedCategory && (
            <>
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 md:flex-none md:min-w-[200px] bg-stone-900 text-white text-lg font-medium py-4 px-6 rounded-xl shadow-lg hover:bg-stone-800 hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Garment</span>
                    </button>

                    <button
                        onClick={() => setIsStylistOpen(true)}
                        className="flex-1 md:flex-none md:min-w-[200px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-medium py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span>AI Stylist</span>
                    </button>
                </div>

                {/* Total Item Count (Kept on Home) */}
                <div className="mb-6 text-stone-500 font-medium">
                     {wardrobe.length} {wardrobe.length === 1 ? 'item' : 'items'} total
                </div>
                
                {/* New Arrivals Section */}
                {newArrivals.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            </div>
                            <h3 className="text-xl font-serif font-bold text-stone-900">New Arrivals</h3>
                            <span className="ml-3 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                To Wear
                            </span>
                        </div>
                        <div className="flex overflow-x-auto pb-6 gap-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                            {newArrivals.map(garment => (
                                <div key={garment.id} className="min-w-[160px] w-[180px] md:min-w-[220px] md:w-[220px] shrink-0">
                                    <GarmentCard 
                                      garment={garment} 
                                      onMarkAsWorn={updateGarmentLastWorn} 
                                      onDelete={requestDelete}
                                      onEdit={setEditingGarment}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category Grid */}
                {wardrobe.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-200">
                        <div className="mx-auto h-16 w-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-serif font-semibold text-stone-900">Your wardrobe is empty</h3>
                        <p className="mt-1 text-sm text-stone-500">Add your first piece to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Object.entries(categorizedWardrobe).map(([category, items]) => {
                            const garmentItems = items as Garment[];
                            if (garmentItems.length === 0) return null;
                            return (
                                <CategoryCard 
                                    key={category} 
                                    category={category} 
                                    items={garmentItems} 
                                    onClick={() => setSelectedCategory(category)}
                                />
                            );
                        })}
                    </div>
                )}
            </>
        )}

        {/* Selected Category View */}
        {selectedCategory && (
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center">
                        <button 
                            onClick={() => setSelectedCategory(null)}
                            className="mr-4 p-2 rounded-full hover:bg-stone-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-3xl font-serif font-bold text-stone-900">{selectedCategory}</h3>
                                <span className="bg-stone-200 text-stone-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                                    {filteredGarments.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                                isFilterOpen || activeFilterCount > 0 
                                    ? 'bg-stone-900 text-white shadow-md' 
                                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span className="font-medium">Filter</span>
                            {activeFilterCount > 0 && (
                                <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {isFilterOpen && (
                    <div className="mb-6 bg-white rounded-2xl border border-stone-100 p-5 shadow-sm animate-slideIn">
                        <div className="space-y-6">
                            {/* Type Filter */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider">By Type</h4>
                                    {activeType && (
                                        <button onClick={() => setActiveType(null)} className="text-xs text-stone-400 hover:text-stone-600 underline">Clear</button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {availableTypes.length > 0 ? availableTypes.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setActiveType(activeType === type ? null : type)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                activeType === type 
                                                    ? 'bg-stone-800 text-white' 
                                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    )) : (
                                        <span className="text-sm text-stone-400 italic">No types available in this category</span>
                                    )}
                                </div>
                            </div>

                            {/* Colour Filter */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider">By Colour</h4>
                                    {activeColour && (
                                        <button onClick={() => setActiveColour(null)} className="text-xs text-stone-400 hover:text-stone-600 underline">Clear</button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {availableColours.length > 0 ? availableColours.map(colour => (
                                        <button
                                            key={colour.name}
                                            onClick={() => setActiveColour(activeColour === colour.name ? null : colour.name)}
                                            className={`group flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all ${
                                                activeColour === colour.name 
                                                    ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' 
                                                    : 'border-transparent bg-stone-100 hover:bg-stone-200'
                                            }`}
                                        >
                                            <span 
                                                className={`w-3 h-3 rounded-full border border-stone-200 shadow-sm ${colour.class}`} 
                                                style={{ backgroundColor: colour.hex }}
                                            />
                                            <span className={`text-sm font-medium ${activeColour === colour.name ? 'text-stone-900' : 'text-stone-600'}`}>
                                                {colour.name}
                                            </span>
                                        </button>
                                    )) : (
                                        <span className="text-sm text-stone-400 italic">No colours detected in this category</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {(activeColour || activeType) && (
                            <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                                <button 
                                    onClick={() => { setActiveColour(null); setActiveType(null); }}
                                    className="text-sm text-stone-500 hover:text-red-500 font-medium transition-colors"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Legend - Optimized for one row on mobile */}
                <div className="flex items-center justify-between sm:justify-start sm:gap-6 text-xs sm:text-sm text-stone-600 mb-6">
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span><span>New</span></div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></span><span>Worn today</span></div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 mr-1.5"></span><span>Recent</span></div>
                    <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span><span>Neglected</span></div>
                </div>
                
                <div className="bg-white/50 rounded-3xl p-4 md:p-6 border border-stone-100 shadow-sm min-h-[300px]">
                    <WardrobeGrid 
                      wardrobe={filteredGarments} 
                      onMarkAsWorn={updateGarmentLastWorn} 
                      onDelete={requestDelete}
                      onEdit={setEditingGarment}
                    />
                </div>
            </div>
        )}

      </main>

      <AddGarmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddGarment={addGarment}
        wardrobeContext={wardrobe}
      />
      
      <AIStylistModal
        isOpen={isStylistOpen}
        onClose={() => setIsStylistOpen(false)}
        wardrobe={wardrobe}
      />

      <EditGarmentModal
        garment={editingGarment}
        isOpen={!!editingGarment}
        onClose={() => setEditingGarment(null)}
        onSave={updateGarment}
      />

      {/* Custom Delete Confirmation Modal */}
      {garmentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setGarmentToDelete(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all scale-100 opacity-100" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-900 text-center mb-2">Delete Item?</h3>
                <p className="text-stone-500 text-center mb-6 text-sm">
                    Are you sure you want to remove this item? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setGarmentToDelete(null)}
                        className="flex-1 px-4 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
