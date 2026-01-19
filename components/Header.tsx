
import React, { useRef, useState, useEffect } from 'react';
import Spinner from './Spinner';

interface HeaderProps {
  onExport: () => void;
  onImport: (file: File) => void;
  isSaving: boolean;
}

const Header: React.FC<HeaderProps> = ({ onExport, onImport, isSaving }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      // Close menu immediately
      setIsMenuOpen(false);
      // Trigger import
      onImport(file);
    }

    // CRITICAL FIX: Reset the input value asynchronously. 
    // Doing this synchronously can sometimes clear the file before it's processed.
    setTimeout(() => {
      if (e.target) {
        e.target.value = '';
      }
    }, 500);
  };

  const triggerFileInput = () => {
    // Directly trigger the hidden input
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo / Brand */}
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            </div>
            <div>
                <h1 className="text-xl font-serif font-bold text-stone-900 leading-none">wAIrdrobe</h1>
                <p className="text-xs text-stone-500 font-medium">AI-powered clothing organiser</p>
            </div>
        </div>

        {/* Right Actions (Save status + Mini Menu) */}
        <div className="flex items-center space-x-4">
            {isSaving && (
                <div className="flex items-center text-xs text-stone-400">
                    <Spinner className="text-orange-500 h-3 w-3 mr-1" />
                    Saving
                </div>
            )}
            
            <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`p-2 rounded-full transition-colors ${isMenuOpen ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  aria-label="Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
                
                {/* Clickable Dropdown */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-30 border border-stone-100 transform origin-top-right animate-fadeIn">
                      <button 
                        onClick={() => { onExport(); setIsMenuOpen(false); }} 
                        className="flex items-center w-full text-left px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 9l-4-4m0 0L8 9m4-4v12" />
                        </svg>
                        Export Backup
                      </button>
                      
                      <button 
                        onClick={triggerFileInput}
                        className="flex items-center w-full text-left px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M8 12l4 4m0 0l4-4m-4 4V4" />
                        </svg>
                        Import Backup
                      </button>
                  </div>
                )}
            </div>
            
            {/* 
              Hidden File Input 
              - Removed 'accept' attribute to avoid OS-level graying out of JSON files 
              - Using display:none is standard and safe for React ref activation
            */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
        </div>
      </div>
    </header>
  );
};

export default Header;
