
import React, { useState, useEffect } from 'react';
import { Garment } from '../types';
import Tag from './Tag';

interface EditGarmentModalProps {
  garment: Garment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedGarment: Garment) => void;
}

const EditGarmentModal: React.FC<EditGarmentModalProps> = ({ garment, isOpen, onClose, onSave }) => {
  const [editedName, setEditedName] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedUses, setEditedUses] = useState<string[]>([]);
  const [newUse, setNewUse] = useState('');
  const [isNewPurchase, setIsNewPurchase] = useState(false);

  useEffect(() => {
    if (garment) {
      setEditedName(garment.name);
      setEditedType(garment.type);
      setEditedCategory(garment.category);
      setEditedUses(garment.uses || []);
      setIsNewPurchase(garment.isNewPurchase || false);
    }
  }, [garment]);

  if (!isOpen || !garment) return null;

  const handleSave = () => {
    onSave({
      ...garment,
      name: editedName,
      type: editedType,
      category: editedCategory,
      uses: editedUses,
      isNewPurchase: isNewPurchase
    });
    onClose();
  };

  const handleAddUse = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newUse.trim()) {
      e.preventDefault();
      if (!editedUses.includes(newUse.trim())) {
        setEditedUses([...editedUses, newUse.trim()]);
      }
      setNewUse('');
    }
  };

  const removeUse = (useToRemove: string) => {
    setEditedUses(editedUses.filter(use => use !== useToRemove));
  };

  const inputClassName = "mt-1 block w-full border border-stone-200 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent sm:text-sm bg-stone-50 text-stone-900 transition-all";

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 className="text-2xl font-serif font-bold text-stone-900">Edit Garment</h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
            <div className="flex justify-center">
                <div className="w-32 h-40 rounded-xl overflow-hidden bg-stone-100 shadow-sm border border-stone-200">
                    <img src={garment.imageUrl} alt={garment.name} className="w-full h-full object-cover" />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Name</label>
                    <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className={inputClassName} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Type</label>
                        <input type="text" value={editedType} onChange={e => setEditedType(e.target.value)} className={inputClassName} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Category</label>
                        <select value={editedCategory} onChange={e => setEditedCategory(e.target.value)} className={inputClassName}>
                            <option value="Tops">Tops</option>
                            <option value="Bottoms">Bottoms</option>
                            <option value="Outerwear">Outerwear</option>
                            <option value="One-Piece">One-Piece</option>
                            <option value="Footwear">Footwear</option>
                            <option value="Accessories">Accessories</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Tags / Uses</label>
                    <div className="flex flex-wrap gap-2 mb-2 min-h-[30px]">
                        {editedUses.map(use => (
                            <Tag key={use} label={use} onRemove={() => removeUse(use)} />
                        ))}
                    </div>
                    <input 
                        type="text" 
                        value={newUse} 
                        onChange={e => setNewUse(e.target.value)} 
                        onKeyDown={handleAddUse} 
                        placeholder="Type and press Enter to add tag" 
                        className={inputClassName}
                    />
                </div>

                <div className="flex items-center pt-2">
                    <input
                        id="edit-is-new"
                        type="checkbox"
                        checked={isNewPurchase}
                        onChange={(e) => setIsNewPurchase(e.target.checked)}
                        className="h-5 w-5 text-stone-900 focus:ring-stone-900 border-gray-300 rounded transition-colors cursor-pointer"
                    />
                    <label htmlFor="edit-is-new" className="ml-3 block text-sm font-medium text-stone-700 cursor-pointer">
                        Mark as New Arrival
                    </label>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-stone-100 bg-stone-50/50 rounded-b-2xl flex justify-end space-x-3">
            <button onClick={onClose} className="px-5 py-2.5 text-stone-600 font-medium hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors">
                Cancel
            </button>
            <button onClick={handleSave} className="px-5 py-2.5 bg-stone-900 text-white font-bold rounded-xl shadow-lg hover:bg-stone-800 transition-all transform hover:-translate-y-0.5">
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditGarmentModal;
