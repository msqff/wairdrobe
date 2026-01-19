
export interface Garment {
  id: string;
  imageUrl: string;
  name: string;
  type: string;
  category: string; // High-level grouping (e.g., Tops, Bottoms)
  uses: string[];
  lastWorn?: string; // YYYY-MM-DD
  isNewPurchase?: boolean;
}
