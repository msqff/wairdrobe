
import React, { useState } from 'react';
import { Garment } from '../types';
import { getWardrobeAnalysis, generateOutfit, completeOutfit, getShoppingSuggestions, visualizeOutfit, WardrobeInsights, OutfitSuggestion, ShoppingItem } from '../services/geminiService';
import Spinner from './Spinner';

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
    if (wardrobe.length < 2) {
        alert("You need at least a few items to generate an outfit.");
        return;
    }
    setIsLoading(true);
    setGeneratedOutfit(null);
    setVisualizedImage(null);
    try {
        const result = await generateOutfit(wardrobe, occasion || "Casual daily wear", weather, focus);
        setGeneratedOutfit(result);
    } catch (e) {
        console.error(e);
        alert("Failed to generate outfit.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleStartManualOutfit = () => {
      setGeneratedOutfit({
          outfitName: "Custom Look",
          reasoning: "Select items to build your look.",
          itemIds: []
      });
      setIsItemPickerOpen(true);
      setVisualizedImage(null);
  };

  const handleClearOutfit = () => {
      setGeneratedOutfit(null);
      setVisualizedImage(null);
  };

  const handleCompleteLook = async () => {
      if (!generatedOutfit || generatedOutfit.itemIds.length === 0) {
          alert("Please select at least one item first.");
          return;
      }
      
      setIsLoading(true);
      setVisualizedImage(null);
      
      try {
          const currentItems = getOutfitItems();
          const result = await completeOutfit(wardrobe, currentItems, occasion || "Casual", weather);
          setGeneratedOutfit(result);
      } catch (e) {
          console.error(e);
          alert("Failed to complete the outfit.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleAddItemToOutfit = (garmentId: string) => {
    setGeneratedOutfit(prev => {
        if (!prev) {
            return {
                outfitName: "Custom Look",
                reasoning: "Manually curated style.",
                itemIds: [garmentId]
            };
        }
        if (prev.itemIds.includes(garmentId)) return prev;
        
        setVisualizedImage(null); // Reset visualization
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
        setVisualizedImage(null); // Reset visualization
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
        alert("Failed to get shopping suggestions.");
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[85vh] flex flex-col overflow-hidden relative" 
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
                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col justify-center items-center backdrop-blur-sm">
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

                                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                    <h4 className="font-bold text-indigo-900 mb-2">Editor's Note</h4>
                                    <p className="text-indigo-800 italic">"{insights.description}"</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: OUTFIT CREATOR */}
                {activeTab === 'outfit' && (
                    <div className="space-y-8 animate-fadeIn pb-6">
                        {!generatedOutfit ? (
                            <div className="max-w-xl mx-auto">
                                <div className="text-center mb-8">
                                    <div className="bg-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Style An Outfit</h3>
                                    <p className="text-stone-500">Let AI create a look for you, or start building one manually.</p>
                                </div>

                                <div className="space-y-4 bg-stone-50 p-6 rounded-2xl border border-stone-100 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 mb-1">Occasion</label>
                                        <input 
                                            type="text" 
                                            value={occasion} 
                                            onChange={e => setOccasion(e.target.value)} 
                                            placeholder="e.g. Date night, Office, Weekend brunch"
                                            className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-stone-800"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Weather</label>
                                            <select 
                                                value={weather} 
                                                onChange={e => setWeather(e.target.value)}
                                                className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                            >
                                                <option>Sunny</option>
                                                <option>Rainy</option>
                                                <option>Cold</option>
                                                <option>Hot</option>
                                                <option>Windy</option>
                                                <option>Snow</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 mb-1">Vibe</label>
                                            <select 
                                                value={focus} 
                                                onChange={e => setFocus(e.target.value)}
                                                className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                            >
                                                <option>Comfort</option>
                                                <option>Style</option>
                                                <option>Professional</option>
                                                <option>Bold</option>
                                                <option>Minimalist</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleCreateOutfit}
                                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-all"
                                    >
                                        Generate for Me
                                    </button>
                                    <button 
                                        onClick={handleStartManualOutfit}
                                        className="flex-1 bg-white border-2 border-stone-200 text-stone-700 py-3 rounded-xl font-semibold hover:border-stone-900 hover:text-stone-900 transition-all"
                                    >
                                        Create Manually
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-slideIn">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div className="w-full md:w-auto flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                            <h3 className="text-2xl font-serif font-bold text-stone-900 break-words leading-tight">{generatedOutfit.outfitName}</h3>
                                            <button 
                                                onClick={handleClearOutfit}
                                                className="flex-shrink-0 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-full transition-colors whitespace-nowrap"
                                            >
                                                Clear / Start Over
                                            </button>
                                        </div>
                                        <p className="text-stone-500 text-sm max-w-2xl break-words">{generatedOutfit.reasoning}</p>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
                                        {/* Show 'Complete with AI' if we have items but want suggestions */}
                                        {generatedOutfit.itemIds.length > 0 && (
                                            <button 
                                                onClick={handleCompleteLook}
                                                className="flex-1 md:flex-none px-4 py-2 bg-purple-50 text-purple-700 font-semibold rounded-xl hover:bg-purple-100 transition-colors text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                                                title="Let AI suggest complementary items for what you've picked"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Complete with AI
                                            </button>
                                        )}
                                        
                                        <button 
                                            onClick={handleVisualizeOutfit}
                                            disabled={isVisualizing || generatedOutfit.itemIds.length === 0}
                                            className={`flex-1 md:flex-none px-4 py-2 bg-stone-900 text-white font-semibold rounded-xl hover:bg-stone-800 transition-colors text-sm flex items-center justify-center gap-2 whitespace-nowrap ${isVisualizing ? 'opacity-70 cursor-wait' : ''}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {isVisualizing ? 'Dreaming...' : 'Visualize'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8 w-full">
                                    {getOutfitItems().map(item => (
                                        <div key={item.id} className="relative group">
                                            <div className="absolute top-2 right-2 z-10">
                                                <button 
                                                    onClick={() => handleRemoveFromOutfit(item.id)}
                                                    className="p-1.5 bg-white/90 text-red-500 rounded-full shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove item"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="rounded-xl overflow-hidden border border-stone-200 aspect-[3/4]">
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-xs font-bold text-stone-700 mt-2 text-center truncate">{item.name || item.type}</p>
                                        </div>
                                    ))}
                                    
                                    {/* Add Item Button */}
                                    <button 
                                        onClick={() => setIsItemPickerOpen(true)}
                                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 text-stone-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all aspect-[3/4]"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-sm font-semibold">Add Item</span>
                                    </button>
                                </div>

                                {visualizedImage && (
                                    <div className="bg-stone-900 rounded-2xl p-1 shadow-xl overflow-hidden animate-slideIn">
                                        <div className="relative">
                                            <img src={visualizedImage} alt="AI Visualized Outfit" className="w-full h-auto rounded-xl" />
                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                                                <p className="text-white font-serif text-lg">AI Visualization</p>
                                                <p className="text-white/70 text-sm">Note: This is an artistic approximation.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: SHOPPING */}
                {activeTab === 'shop' && (
                    <div className="space-y-8 animate-fadeIn pb-6">
                        {!shoppingList ? (
                            <div className="text-center py-10">
                                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Smart Shopping List</h3>
                                <p className="text-stone-500 mb-6 max-w-md mx-auto">Find out what key pieces are missing to maximize your wardrobe's potential.</p>
                                <button 
                                    onClick={handleGenerateShopping}
                                    className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-all"
                                >
                                    Identify Gaps
                                </button>
                            </div>
                        ) : (
                            <div className="animate-slideIn">
                                <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">Suggested Additions</h3>
                                <div className="grid gap-6">
                                    {shoppingList.map((suggestion, i) => (
                                        <div key={i} className="flex bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex-shrink-0 mr-4">
                                                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-lg">
                                                    {i + 1}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-stone-900 mb-1">{suggestion.item}</h4>
                                                <p className="text-stone-600 text-sm">{suggestion.reasoning}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 text-center">
                                    <button 
                                        onClick={() => setShoppingList(null)}
                                        className="text-stone-500 hover:text-stone-800 text-sm font-medium"
                                    >
                                        Start Over
                                    </button>
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
