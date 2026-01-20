
import React, { useState, useMemo } from 'react';
import { Garment } from '../types';

interface WardrobeTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: Garment[];
  onEdit: (garment: Garment) => void;
  onDelete: (id: string) => void;
}

type SortKey = keyof Garment | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const WardrobeTableModal: React.FC<WardrobeTableModalProps> = ({ 
  isOpen, 
  onClose, 
  wardrobe, 
  onEdit, 
  onDelete 
}) => {
  // Default sort: Last Worn Ascending (Never worn -> Oldest -> Newest)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'lastWorn', direction: 'asc' });
  const [filterText, setFilterText] = useState('');

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const processedData = useMemo(() => {
    let data = [...wardrobe];

    // Filter
    if (filterText) {
      const lower = filterText.toLowerCase();
      data = data.filter(item => 
        item.name.toLowerCase().includes(lower) || 
        item.type.toLowerCase().includes(lower) || 
        item.category.toLowerCase().includes(lower)
      );
    }

    // Sort
    data.sort((a, b) => {
      const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;
      
      // Special handling for Last Worn
      if (sortConfig.key === 'lastWorn') {
        const aWorn = a.lastWorn;
        const bWorn = b.lastWorn;

        // If ascending: we want Null (Never Worn) -> Oldest Date -> Newest Date
        // If descending: Newest Date -> Oldest Date -> Null
        
        if (!aWorn && !bWorn) return 0;
        if (!aWorn) return -1 * directionMultiplier; // Null comes first in ASC, last in DESC
        if (!bWorn) return 1 * directionMultiplier;
        
        return aWorn.localeCompare(bWorn) * directionMultiplier;
      }

      // Special handling for Status (derived from isNewPurchase)
      if (sortConfig.key === 'status') {
         const aStatus = a.isNewPurchase ? 1 : 0;
         const bStatus = b.isNewPurchase ? 1 : 0;
         return (aStatus - bStatus) * directionMultiplier;
      }

      // Default string comparison
      const aValue = String(a[sortConfig.key as keyof Garment] || '').toLowerCase();
      const bValue = String(b[sortConfig.key as keyof Garment] || '').toLowerCase();

      if (aValue < bValue) return -1 * directionMultiplier;
      if (aValue > bValue) return 1 * directionMultiplier;
      return 0;
    });

    return data;
  }, [wardrobe, sortConfig, filterText]);

  const getSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) return <span className="text-stone-300 ml-1">⇅</span>;
    return sortConfig.direction === 'asc' ? <span className="text-stone-800 ml-1">↑</span> : <span className="text-stone-800 ml-1">↓</span>;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return <span className="px-2 py-1 bg-stone-100 text-stone-500 rounded-md text-xs font-semibold">Never Worn</span>;
    
    // Check if it was "today" or recent
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 md:p-8" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white z-10">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-stone-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-serif font-bold text-stone-900">Full Catalogue</h2>
                    <p className="text-sm text-stone-500">{wardrobe.length} items in total</p>
                </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-stone-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="pl-10 block w-full border border-stone-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent sm:text-sm bg-stone-50"
                    />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Table Content */}
        <div className="flex-grow overflow-auto bg-stone-50">
            <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider w-20">
                            Visual
                        </th>
                        <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors"
                            onClick={() => handleSort('name')}
                        >
                            Name {getSortIcon('name')}
                        </th>
                        <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors"
                            onClick={() => handleSort('category')}
                        >
                            Category {getSortIcon('category')}
                        </th>
                        <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors"
                            onClick={() => handleSort('type')}
                        >
                            Type {getSortIcon('type')}
                        </th>
                        <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors"
                            onClick={() => handleSort('lastWorn')}
                        >
                            Last Worn {getSortIcon('lastWorn')}
                        </th>
                         <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-bold text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors"
                            onClick={() => handleSort('status')}
                        >
                            Status {getSortIcon('status')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-stone-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-100">
                    {processedData.length > 0 ? (
                        processedData.map((garment) => (
                            <tr key={garment.id} className="hover:bg-stone-50/80 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-stone-200">
                                        <img className="h-full w-full object-cover" src={garment.imageUrl} alt="" />
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-stone-900">{garment.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-100 text-stone-800">
                                        {garment.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                                    {garment.type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                                    {formatDate(garment.lastWorn)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {garment.isNewPurchase && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            New
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button 
                                            onClick={() => onEdit(garment)}
                                            className="text-stone-400 hover:text-stone-900 transition-colors p-1"
                                            title="Edit"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={() => onDelete(garment.id)}
                                            className="text-stone-400 hover:text-red-600 transition-colors p-1"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-6 py-10 text-center text-sm text-stone-500">
                                No garments found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default WardrobeTableModal;
