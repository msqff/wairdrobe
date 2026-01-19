
import { Garment } from '../types';

export const inferCategory = (type: string): string => {
   const t = type.toLowerCase();
   if (t.includes('jacket') || t.includes('coat') || t.includes('blazer') || t.includes('hoodie') || t.includes('cardigan') || t.includes('vest') || t.includes('parka') || t.includes('trench')) return 'Outerwear';
   if (t.includes('jean') || t.includes('trouser') || t.includes('skirt') || t.includes('short') || t.includes('pant') || t.includes('legging') || t.includes('jogger')) return 'Bottoms';
   if (t.includes('shoe') || t.includes('boot') || t.includes('sneaker') || t.includes('sandal') || t.includes('heel') || t.includes('loafer') || t.includes('flat')) return 'Footwear';
   if (t.includes('dress') || t.includes('jumpsuit') || t.includes('suit') || t.includes('gown') || t.includes('romper')) return 'One-Piece';
   if (t.includes('bag') || t.includes('hat') || t.includes('scarf') || t.includes('belt') || t.includes('tie') || t.includes('glasses') || t.includes('jewelry')) return 'Accessories';
   return 'Tops'; // Default to Tops for t-shirts, shirts, blouses, sweaters
};

export const getGarmentCategory = (garment: Garment) => {
    return garment.category || inferCategory(garment.type);
};

export const CATEGORY_ORDER = ['Outerwear', 'Tops', 'Bottoms', 'One-Piece', 'Footwear', 'Accessories'];
