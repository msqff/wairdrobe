
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Garment } from '../types';
import { analyzeGarmentImage, AnalysisResult } from '../services/geminiService';
import Spinner from './Spinner';
import Tag from './Tag';

interface AddGarmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGarment: (garment: Omit<Garment, 'id' | 'lastWorn'>) => void;
  wardrobeContext: Garment[];
}

function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error("Invalid data URL");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}


const AddGarmentModal: React.FC<AddGarmentModalProps> = ({ isOpen, onClose, onAddGarment, wardrobeContext }) => {
  // Queue Management
  const [filesQueue, setFilesQueue] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Current Item State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Form State
  const [editedName, setEditedName] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedUses, setEditedUses] = useState<string[]>([]);
  const [newUse, setNewUse] = useState('');
  const [isNewPurchase, setIsNewPurchase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Camera & Inputs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFilesQueue([]);
    setCurrentFileIndex(0);
    setImagePreview(null);
    setIsLoading(false);
    setAnalysisResult(null);
    setEditedName('');
    setEditedType('');
    setEditedCategory('');
    setEditedUses([]);
    setNewUse('');
    setIsNewPurchase(false);
    setError(null);
    setIsCameraOpen(false);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(resetState, 300);
    }
  }, [isOpen, resetState]);

  // Process current file in queue
  useEffect(() => {
    const processCurrentFile = async () => {
        if (filesQueue.length > 0 && currentFileIndex < filesQueue.length) {
            const file = filesQueue[currentFileIndex];
            
            // Reset form for new item
            setAnalysisResult(null);
            setEditedName('');
            setEditedType('');
            setEditedCategory('');
            setEditedUses([]);
            setNewUse('');
            setIsNewPurchase(false);
            setError(null);
            
            // Create Preview
            const reader = new FileReader();
            reader.onloadend = async () => {
                const previewUrl = reader.result as string;
                setImagePreview(previewUrl);
                
                // Auto-trigger analysis
                setIsLoading(true);
                try {
                    const base64Data = previewUrl.split(',')[1];
                    const result = await analyzeGarmentImage(base64Data, file.type, wardrobeContext);
                    setAnalysisResult(result);
                    setEditedName(result.name);
                    setEditedType(result.type);
                    setEditedCategory(result.category);
                    setEditedUses(result.uses);
                } catch (err: any) {
                    setError(err.message || 'Analysis failed. Please enter details manually.');
                } finally {
                    setIsLoading(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    processCurrentFile();
  }, [filesQueue, currentFileIndex, wardrobeContext]);


  // Robust Camera Logic
  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    if (isCameraOpen) {
      const startCamera = async () => {
        try {
          // Attempt back camera first for mobile devices
          try {
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'environment' } 
            });
          } catch (e) {
            // Fallback to any available camera
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
          
          if (active && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            // Explicitly play to ensure visibility in all browsers
            videoRef.current.play().catch(e => console.error("Video play failed", e));
          }
        } catch (err) {
          if (active) {
            console.error("Error accessing camera: ", err);
            setError("Could not access camera. Please check permissions and try again.");
            setIsCameraOpen(false);
          }
        }
      };
      startCamera();
    }

    return () => {
        active = false;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [isCameraOpen]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFilesQueue(Array.from(selectedFiles));
      setCurrentFileIndex(0);
      setError(null);
    }
  };
  
  const handleNext = () => {
      if (currentFileIndex < filesQueue.length - 1) {
          setCurrentFileIndex(prev => prev + 1);
      } else {
          onClose();
      }
  };

  const handleSave = () => {
    if (!imagePreview || !editedType) return;
    
    onAddGarment({
      imageUrl: imagePreview,
      name: editedName || editedType,
      type: editedType,
      category: editedCategory || 'Tops',
      uses: editedUses,
      isNewPurchase: isNewPurchase
    });

    handleNext();
  };
  
  const handleSkip = () => {
      handleNext();
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
  
  const handleOpenCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setError(null);
        setIsCameraOpen(true);
    } else {
        setError("Camera not supported on this device or browser.");
    }
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      const capturedFile = dataURLtoFile(dataUrl, `capture-${Date.now()}.jpg`);
      setFilesQueue([capturedFile]);
      setCurrentFileIndex(0);
      setIsCameraOpen(false);
    }
  };

  const inputClassName = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900";
  const isQueueActive = filesQueue.length > 0;
  const isLastItem = currentFileIndex === filesQueue.length - 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-lg z-10">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Add New Garments</h2>
                {isQueueActive && (
                    <p className="text-sm text-indigo-600 font-medium">Reviewing Item {currentFileIndex + 1} of {filesQueue.length}</p>
                )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
          
        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            
            {isQueueActive ? (
              <div className="space-y-4">
                <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-100">
                  {imagePreview ? (
                      <img src={imagePreview} alt="Garment preview" className="max-h-60 w-auto inline-block rounded-lg shadow-sm" />
                  ) : (
                      <div className="h-48 flex items-center justify-center">
                          <Spinner className="text-indigo-500 h-8 w-8" />
                      </div>
                  )}
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-4 text-indigo-600 animate-pulse">
                        <Spinner className="text-indigo-600 h-5 w-5 mr-2" />
                        <span>Analyzing image...</span>
                    </div>
                )}

                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{error}</p>}
                
                {imagePreview && (
                  <div className={`space-y-4 pt-4 border-t transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div>
                      <label htmlFor="garment-name" className="block text-sm font-medium text-gray-700">Name</label>
                      <input type="text" id="garment-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className={inputClassName} placeholder="e.g. Blue Denim Jacket"/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="garment-type" className="block text-sm font-medium text-gray-700">Type</label>
                        <input type="text" id="garment-type" value={editedType} onChange={(e) => setEditedType(e.target.value)} className={inputClassName} placeholder="e.g. Jacket"/>
                      </div>
                      <div>
                        <label htmlFor="garment-category" className="block text-sm font-medium text-gray-700">Group</label>
                         <select id="garment-category" value={editedCategory} onChange={(e) => setEditedCategory(e.target.value)} className={inputClassName}>
                            <option value="">Select...</option>
                            <option value="Tops">Tops</option>
                            <option value="Bottoms">Bottoms</option>
                            <option value="Outerwear">Outerwear</option>
                            <option value="One-Piece">One-Piece</option>
                            <option value="Footwear">Footwear</option>
                            <option value="Accessories">Accessories</option>
                         </select>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="is-new"
                                type="checkbox"
                                checked={isNewPurchase}
                                onChange={(e) => setIsNewPurchase(e.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="is-new" className="font-medium text-gray-700">Brand new purchase</label>
                            <p className="text-gray-500">Check if this item is brand new and unworn.</p>
                        </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Suggested Uses</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {editedUses.map(use => <Tag key={use} label={use} onRemove={() => removeUse(use)} />)}
                      </div>
                      <input type="text" value={newUse} onChange={(e) => setNewUse(e.target.value)} onKeyDown={handleAddUse} placeholder="Add a use and press Enter" className={inputClassName}/>
                    </div>
                  </div>
                )}
              </div>
            ) : isCameraOpen ? (
                <div className="space-y-4">
                    <div className="relative">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto rounded-lg bg-black shadow-md" aria-label="Live camera feed"></video>
                        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
                    </div>
                    <button onClick={handleTakePhoto} className="w-full flex justify-center items-center space-x-2 bg-rose-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-rose-700 transition-colors shadow-sm">
                        <div className="h-4 w-4 rounded-full border-2 border-white"></div>
                        <span>Take Photo</span>
                    </button>
                    <button onClick={() => setIsCameraOpen(false)} className="w-full bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-200">Cancel Camera</button>
                </div>
            ) : (
                <>
                    <div className="flex justify-center items-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col justify-center items-center w-full h-48 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group">
                            <div className="flex flex-col justify-center items-center pt-5 pb-6">
                                <svg className="w-10 h-10 mb-3 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V6a4 4 0 014-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H12a4 4 0 014 4v6m-6 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">Select one or multiple photos (JPG, PNG, WEBP)</p>
                            </div>
                            <input id="dropzone-file" type="file" multiple ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                        </label>
                    </div>
                    <div className="flex items-center text-gray-400 my-4">
                        <hr className="flex-grow border-t border-gray-200" />
                        <span className="px-3 text-sm font-medium text-gray-500">OR</span>
                        <hr className="flex-grow border-t border-gray-200" />
                    </div>
                    <button onClick={handleOpenCamera} className="w-full flex justify-center items-center space-x-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-md hover:bg-gray-50 transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M2 6a2 2 0 012-2h1.586a2 2 0 011.414.586l1.414 1.414A2 2 0 009.414 6H10a2 2 0 012 2v1.586a2 2 0 01.586 1.414l1.414 1.414A2 2 0 0016 12.414V14a2 2 0 01-2 2h-1.586a2 2 0 01-1.414-.586l-1.414-1.414A2 2 0 008.586 14H8a2 2 0 01-2-2v-1.586a2 2 0 01-.586-1.414L4 7.586A2 2 0 002 6.586V6z" />
                           <path d="M15 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                        <span>Take Photo</span>
                    </button>
                </>
            )}
            
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            {isQueueActive ? (
                <>
                    <button onClick={handleSkip} className="px-4 py-2 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                        Skip Item
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading || !editedType} 
                        className={`bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md shadow-sm hover:bg-indigo-700 transition-all flex items-center ${isLoading || !editedType ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLastItem ? 'Save & Finish' : 'Save & Next'}
                        {!isLastItem && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </>
            ) : (
                <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900">Close</button>
            )}
        </div>
      </div>
    </div>
  );
};

export default AddGarmentModal;
