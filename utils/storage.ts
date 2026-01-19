
import { Garment } from '../types';

const DB_NAME = 'AIWardrobeDB';
const STORE_NAME = 'garments';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getWardrobe = async (): Promise<Garment[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result;
      // Migration logic: If IDB is empty, check localStorage
      if (items.length === 0) {
        try {
          const local = localStorage.getItem('wardrobe');
          if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log("Migrating data from localStorage to IndexedDB...");
              resolve(parsed);
              return;
            }
          }
        } catch (e) {
          console.warn("Migration failed", e);
        }
      }
      resolve(items);
    };

    request.onerror = () => reject(request.error);
  });
};

export const saveWardrobeToDB = async (wardrobe: Garment[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Clear existing data to ensure deleted items are removed
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      wardrobe.forEach(garment => {
        store.put(garment);
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
