
import { useState, useEffect, useCallback } from 'react';
import { Garment } from '../types';
import * as storage from '../utils/storage';

export function usePersistentWardrobe() {
  const [wardrobe, setWardrobe] = useState<Garment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    const load = async () => {
      try {
        const items = await storage.getWardrobe();
        // Sort by ID (timestamp) descending to show newest first
        items.sort((a, b) => String(b.id).localeCompare(String(a.id)));
        setWardrobe(items);
      } catch (e) {
        console.error("Failed to load wardrobe from storage:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Auto-save to DB when wardrobe changes
  useEffect(() => {
    if (isLoading) return;

    const save = async () => {
      setIsSaving(true);
      try {
        await storage.saveWardrobeToDB(wardrobe);
      } catch (e) {
        console.error("Auto-save failed:", e);
      } finally {
        // Short delay to let the "Saving..." indicator show briefly for better UX
        setTimeout(() => setIsSaving(false), 500);
      }
    };

    // Debounce save to prevent thrashing
    const timeout = setTimeout(save, 800);
    return () => clearTimeout(timeout);
  }, [wardrobe, isLoading]);

  const exportData = useCallback(() => {
    try {
      if (wardrobe.length === 0) {
        alert("Your wardrobe is empty. Nothing to export.");
        return;
      }

      const dataStr = JSON.stringify(wardrobe, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const exportFileDefaultName = `wardrobe_backup_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to create export file.");
    }
  }, [wardrobe]);

  const importData = useCallback(async (file: File) => {
    // Enable loading state to show spinner and prevent interactions
    setIsLoading(true);
    console.log("Starting import for:", file.name, "Size:", file.size, "Type:", file.type);

    try {
      const text = await file.text();
      console.log("File read successfully. Length:", text.length);
      
      if (!text || text.trim().length === 0) {
        throw new Error("The selected file is empty.");
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error("Invalid file format. JSON parsing failed.");
      }

      if (!Array.isArray(json)) {
        throw new Error("Invalid wardrobe format. Expected a list of items.");
      }

      console.log("JSON parsed successfully. Items found:", json.length);

      // Normalize imported data
      const normalizedData: Garment[] = json
        .filter(item => item && typeof item === 'object')
        .map((item: any) => ({
          ...item,
          // Ensure ID is a string and exists
          id: item.id ? String(item.id) : `imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          // Normalize image fields
          imageUrl: item.imageUrl || item.image || '', 
          name: item.name || item.type || 'Imported Garment',
          type: item.type || 'Unknown',
          category: item.category || 'Other',
          uses: Array.isArray(item.uses) ? item.uses : [],
          lastWorn: typeof item.lastWorn === 'string' ? item.lastWorn : undefined
        }));

      // Directly update state. 
      // Note: Removed window.confirm because it can be flaky in async contexts or certain browsers.
      // The user intent is already established by selecting the 'Import' file.
      setWardrobe(normalizedData);
      
      // Allow UI to update before alerting
      setTimeout(() => {
        alert(`Success! Imported ${normalizedData.length} items.`);
      }, 100);

    } catch (err: any) {
      console.error("Critical Import Error:", err);
      alert(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [setWardrobe]);

  return { wardrobe, setWardrobe, isLoading, isSaving, exportData, importData };
}
