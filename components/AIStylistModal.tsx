
import React, { useState } from 'react';
import { Garment } from '../types';
import { getWardrobeAnalysis, generateOutfit, getShoppingSuggestions, visualizeOutfit, WardrobeInsights, OutfitSuggestion, ShoppingItem } from '../services/geminiService';
import Spinner from './Spinner';
import GarmentCard from './GarmentCard';

interface AIStylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: Garment[];
}

type Tab = 'insights' | 'outfit' | 'shop';

const AIStylistModal: React.FC<AIStylistModalProps> = ({ isOpen, onClose, wardrobe }) => {
  const [activeTab, setActiveTab] = useState<Tab>('insights');
  const [isLoading, setIsLoading] = useState(false);
  
  // Insights State
  const [insights, setInsights] = useState<WardrobeInsights | null>(null);

  // Outfit State
  const [occasion, setOccasion] = useState('');
  const [weather, setWeather] = useState('Sunny');
  const [focus, setFocus] = useState('Mix & Match');
  const [generatedOutfit, setGeneratedOutfit] = useState<OutfitSuggestion | null>(null);
  const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
  
  // Visualization State
  const [visualizedImage, setVisualizedImage] = useState<string | null>(null);
  const [isVisualizing, setIsVisualizing] = useState(false);

  // Shopping State
  const [shoppingList, setShoppingList] = useState<ShoppingItem[] | null>(null);

  // Handlers
  const handleGenerateInsights = async () => {
    // Check purely for existence now, let the AI handle the "bluntness" about quantity
    if (wardrobe.length === 0) {
        alert("Please add at least one item to get insights!");
        return;
    }
    setIsLoading(true);
    try {
        const result = await getWardrobeAnalysis(wardrobe);
        setInsights(result);
    } catch (e) {
        console.error(e);
        alert("Failed to generate insights. Try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateOutfit = async () => {
    if (wardrobe.length < 2) return;
    setIsLoading(true);
    setGeneratedOutfit(null);
    setVisualizedImage(null); // Reset visualization when new outfit is created
    try {
        const result = await generateOutfit(wardrobe, occasion || "Casual daily wear", weather, focus);
        setGeneratedOutfit(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleStartManualOutfit = () => {
      setGeneratedOutfit({
          outfitName: "Custom Outfit",
          reasoning: "Manually curated style.",
          itemIds: []
      });
      setIsItemPickerOpen(true);
      setVisualizedImage(null);
  };

  const handleAddItemToOutfit = (garmentId: string) => {
    setGeneratedOutfit(prev => {
        if (!prev) {
            return {
                outfitName: "Custom Outfit",
                reasoning: "Manually curated style.",
                itemIds: [garmentId]
            };
        }
        if (prev.itemIds.includes(garmentId)) return prev;
        // Reset visualization if outfit changes
        setVisualizedImage(null);
        return {
            ...prev,
            itemIds: [...prev.itemIds, garmentId]
        };
    });
    setIsItemPickerOpen(false);
  };

  const handleRemoveFromOutfit = (garmentId: string) => {
    setGeneratedOutfit(prev => {
        if (!prev) return null;
        // Reset visualization if outfit changes
        setVisualizedImage(null);
        return {
            ...prev,
            itemIds: prev.itemIds.filter(id => id !== garmentId)
        };
    });
  };
  
  const handleVisualizeOutfit = async () => {
      if (!generatedOutfit || generatedOutfit.itemIds.length === 0) return;
      setIsVisualizing(true);
      try {
          const items = getOutfitItems();
          const image = await visualizeOutfit(items);
          setVisualizedImage(image);
      } catch (e) {
          console.error(e);
          alert("Failed to create visualization. Please try again.");
      } finally {
          setIsVisualizing(false);
      }
  };

  const handleGenerateShopping = async () => {
    setIsLoading(true);
    try {
        const result = await getShoppingSuggestions(wardrobe);
        setShoppingList(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const getOutfitItems = () => {
      if (!generatedOutfit) return [];
      return wardrobe.filter(g => generatedOutfit.itemIds.includes(g.id));
  };

  const getScoreColor = (score: number) => {
      if (score < 5) return 'text-red-600';
      if (score < 8) return 'text-yellow-600';
      return 'text-green-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 md:p-6" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col overflow-hidden relative" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white z-10">
            <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-stone-900">AI Stylist</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Item Picker Overlay */}
        {isItemPickerOpen && (
            <div className="absolute inset-0 bg-white z-40 flex flex-col animate-fadeIn">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white shadow-sm">
                    <h3 className="text-lg font-bold text-stone-900">Select Item to Add</h3>
                    <button onClick={() => setIsItemPickerOpen(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 bg-stone-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {wardrobe.map(g => {
                            const isSelected = generatedOutfit?.itemIds.includes(g.id);
                            return (
                                <button 
                                    key={g.id} 
                                    onClick={() => !isSelected && handleAddItemToOutfit(g.id)}
                                    className={`relative group bg-white rounded-xl overflow-hidden shadow-sm border text-left transition-all ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 opacity-60 cursor-default' : 'border-stone-200 hover:border-indigo-300 hover:shadow-md'}`}
                                >
                                    <div className="aspect-[4/5] bg-stone-100">
                                        <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-3">
                                        <p className="text-sm font-bold text-stone-800 truncate">{g.name || g.type}</p>
                                        <p className="text-xs text-stone-500">{g.category}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* Tabs & Content Container */}
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            
            {/* Sidebar Navigation */}
            <nav className="w-full md:w-64 bg-stone-50 border-r border-stone-100 flex-shrink-0 flex md:flex-col overflow-x-auto md:overflow-x-visible">
                <button 
                    onClick={() => setActiveTab('insights')}
                    className={`flex items-center p-4 text-sm font-medium transition-colors w-full whitespace-nowrap ${activeTab === 'insights' ? 'bg-white text-indigo-600 border-l-4 border-indigo-600 shadow-sm' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Wardrobe Insights
                </button>
                <button 
                    onClick={() => setActiveTab('outfit')}
                    className={`flex items-center p-4 text-sm font-medium transition-colors w-full whitespace-nowrap ${activeTab === 'outfit' ? 'bg-white text-indigo-600 border-l-4 border-indigo-600 shadow-sm' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Outfit Creator
                </button>
                <button 
                    onClick={() => setActiveTab('shop')}
                    className={`flex items-center p-4 text-sm font-medium transition-colors w-full whitespace-nowrap ${activeTab === 'shop' ? 'bg-white text-indigo-600 border-l-4 border-indigo-600 shadow-sm' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Smart Shop
                </button>
            </nav>

            {/* Main Content Area */}
            <div className="flex-grow overflow-y-auto p-6 bg-white relative">
                
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col justify-center items-center">
                        <Spinner className="text-indigo-600 h-10 w-10 mb-4" />
                        <p className="text-stone-600 font-medium animate-pulse">Consulting your AI Stylist...</p>
                    </div>
                )}

                {/* TAB 1: INSIGHTS */}
                {activeTab === 'insights' && (
                    <div className="space-y-8 animate-fadeIn pb-6">
                        {!insights ? (
                            <div className="text-center py-10">
                                <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Analyze Your Wardrobe</h3>
                                <p className="text-stone-500 mb-6 max-w-md mx-auto">Get insights on your style persona, color palette, and versatility score based on your inventory.</p>
                                <button 
                                    onClick={handleGenerateInsights}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-all"
                                >
                                    Generate Report
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">Wardrobe Report</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Style Persona</p>
                                        <p className="text-2xl font-serif text-indigo-900">{insights.stylePersona}</p>
                                    </div>
                                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Versatility Score</p>
                                        <div className="flex items-center">
                                            <span className={`text-3xl font-bold ${getScoreColor(insights.versatilityScore)}`}>{insights.versatilityScore}</span>
                                            <span className="text-stone-400 ml-1">/ 10</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h4 className="font-bold text-stone-900 mb-3">Detected Palette</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {insights.colorPalette.map((color, i) => (
                                            <span key={i} className="px-4 py-2 bg-white border border-stone-200 rounded-full text-sm font-medium text-stone-600 shadow-sm">{color}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                                    <h4 className="font-bold text-indigo-900 mb-2">AI Analysis</h4>
                                    <p className="text-stone-700 leading-relaxed">{insights.description}</p>
                                </div>
                                
                                <div className="mt-6 text-center">
                                     <button onClick={handleGenerateInsights} className="text-sm text-indigo-600 font-medium hover:underline">Refresh Analysis</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: OUTFIT CREATOR */}
                {activeTab === 'outfit' && (
                    <div className="space-y-8 animate-fadeIn pb-10">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Occasion</label>
                                <input 
                                    type="text" 
                                    value={occasion} 
                                    onChange={e => setOccasion(e.target.value)} 
                                    placeholder="e.g. Dinner Date, Work" 
                                    className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-stone-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Weather</label>
                                <select 
                                    value={weather} 
                                    onChange={e => setWeather(e.target.value)}
                                    className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option>Sunny</option>
                                    <option>Rainy</option>
                                    <option>Cold / Winter</option>
                                    <option>Hot / Summer</option>
                                    <option>Windy</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Focus</label>
                                <select 
                                    value={focus} 
                                    onChange={e => setFocus(e.target.value)}
                                    className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="Mix & Match">Mix & Match</option>
                                    <option value="Neglected">Use Neglected Items</option>
                                    <option value="New">Style New Items</option>
                                    <option value="Comfort">Comfort</option>
                                    <option value="Bold">Bold / Statement</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                             <button 
                                onClick={handleCreateOutfit}
                                className="flex-1 bg-stone-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center space-x-2"
                            >
                                <span>✨ Create Outfit</span>
                            </button>
                             {!generatedOutfit && (
                                <button 
                                    onClick={handleStartManualOutfit}
                                    className="flex-1 bg-white border-2 border-stone-200 text-stone-600 py-4 rounded-xl font-bold shadow-sm hover:border-stone-400 hover:text-stone-800 transition-all flex items-center justify-center space-x-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Start from scratch</span>
                                </button>
                             )}
                        </div>

                        {generatedOutfit && (
                            <div className="pt-4 animate-slideIn">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">{generatedOutfit.outfitName}</h3>
                                    <p className="text-stone-500 max-w-lg mx-auto italic">"{generatedOutfit.reasoning}"</p>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    {getOutfitItems().map(item => (
                                        <div key={item.id} className="relative group">
                                            <GarmentCard garment={item} onMarkAsWorn={() => {}} />
                                            <button 
                                                onClick={() => handleRemoveFromOutfit(item.id)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                                                title="Remove item"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    {/* Add Item Button in Grid */}
                                    <button 
                                        onClick={() => setIsItemPickerOpen(true)}
                                        className="flex flex-col items-center justify-center aspect-[4/5] bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl hover:bg-stone-100 hover:border-stone-400 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium text-stone-500">Add Item</span>
                                    </button>
                                </div>
                                
                                {/* Visualization Section */}
                                <div className="border-t border-stone-100 pt-8 flex flex-col items-center">
                                    {!visualizedImage ? (
                                        <button 
                                            onClick={handleVisualizeOutfit}
                                            disabled={isVisualizing || generatedOutfit.itemIds.length === 0}
                                            className={`
                                                flex items-center space-x-2 px-6 py-3 rounded-full border-2 
                                                transition-all font-semibold
                                                ${isVisualizing 
                                                    ? 'border-indigo-100 bg-indigo-50 text-indigo-400 cursor-wait' 
                                                    : generatedOutfit.itemIds.length === 0
                                                        ? 'border-stone-200 text-stone-300 cursor-not-allowed'
                                                        : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'}
                                            `}
                                        >
                                            {isVisualizing ? (
                                                <>
                                                    <Spinner className="w-4 h-4 text-indigo-400" />
                                                    <span>Designing look...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span>Visualize on Mannequin</span>
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full max-w-md bg-stone-50 p-4 rounded-xl border border-stone-200">
                                            <h4 className="font-bold text-stone-900 mb-4 text-center">Virtual Try-On</h4>
                                            <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden shadow-md mb-4 bg-white">
                                                <img 
                                                    src={visualizedImage} 
                                                    alt="AI Generated Outfit Visualization" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => setVisualizedImage(null)}
                                                className="w-full py-2 text-sm text-stone-500 hover:text-stone-800 underline"
                                            >
                                                Hide Preview
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: SMART SHOP */}
                {activeTab === 'shop' && (
                    <div className="space-y-8 animate-fadeIn pb-6">
                         {!shoppingList ? (
                            <div className="text-center py-10">
                                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Find Wardrobe Gaps</h3>
                                <p className="text-stone-500 mb-6 max-w-md mx-auto">AI will identify missing key pieces that would maximize your current wardrobe's potential.</p>
                                <button 
                                    onClick={handleGenerateShopping}
                                    className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-all"
                                >
                                    Analyze Gaps
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">Suggested Additions</h3>
                                <div className="space-y-4">
                                    {shoppingList.map((item, idx) => (
                                        <div key={idx} className="flex bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex-shrink-0 mr-4 flex items-center justify-center w-12 h-12 bg-stone-100 rounded-full text-stone-400 font-serif font-bold text-lg">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-stone-900">{item.item}</h4>
                                                <p className="text-stone-600 mt-1 text-sm leading-relaxed">{item.reasoning}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 text-center">
                                     <button onClick={handleGenerateShopping} className="text-sm text-green-600 font-medium hover:underline">Find different items</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default AIStylistModal;
