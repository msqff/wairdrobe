
import { Garment } from '../types';

export interface ColourDefinition {
    name: string;
    hex: string;
    class: string;
}

export const COLOURS: ColourDefinition[] = [
  { name: 'Black', hex: '#1c1917', class: 'bg-stone-900' },
  { name: 'White', hex: '#ffffff', class: 'bg-white' },
  { name: 'Grey', hex: '#9ca3af', class: 'bg-gray-400' },
  { name: 'Beige', hex: '#d6d3d1', class: 'bg-stone-300' },
  { name: 'Brown', hex: '#78350f', class: 'bg-amber-900' },
  { name: 'Red', hex: '#ef4444', class: 'bg-red-500' },
  { name: 'Orange', hex: '#f97316', class: 'bg-orange-500' },
  { name: 'Yellow', hex: '#eab308', class: 'bg-yellow-500' },
  { name: 'Green', hex: '#22c55e', class: 'bg-green-500' },
  { name: 'Blue', hex: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Purple', hex: '#a855f7', class: 'bg-purple-500' },
  { name: 'Pink', hex: '#ec4899', class: 'bg-pink-500' },
];

const COLOUR_KEYWORDS: Record<string, string[]> = {
    'Black': ['black', 'noir', 'dark', 'ink', 'obsidian', 'jet'],
    'White': ['white', 'ivory', 'cream', 'snow', 'light', 'eggshell'],
    'Grey': ['grey', 'gray', 'charcoal', 'silver', 'slate', 'ash', 'smoke'],
    'Beige': ['beige', 'tan', 'khaki', 'nude', 'camel', 'sand', 'taupe', 'oat'],
    'Brown': ['brown', 'chocolate', 'coffee', 'rust', 'mocha', 'cognac', 'sepia'],
    'Red': ['red', 'maroon', 'crimson', 'burgundy', 'cherry', 'wine', 'scarlet'],
    'Orange': ['orange', 'peach', 'terracotta', 'coral', 'apricot'],
    'Yellow': ['yellow', 'gold', 'mustard', 'lemon', 'amber'],
    'Green': ['green', 'olive', 'lime', 'emerald', 'sage', 'mint', 'forest', 'teal'],
    'Blue': ['blue', 'navy', 'cyan', 'indigo', 'denim', 'azure', 'sky', 'royal', 'sapphire'],
    'Purple': ['purple', 'violet', 'lavender', 'plum', 'lilac', 'mauve', 'grape'],
    'Pink': ['pink', 'rose', 'magenta', 'salmon', 'blush', 'fuchsia'],
};

export const getColorMatches = (garment: Garment, selectedColour: string): boolean => {
    // Combine all text fields to search for colour keywords
    const text = `${garment.name} ${garment.type} ${garment.uses.join(' ')}`.toLowerCase();
    const keywords = COLOUR_KEYWORDS[selectedColour] || [selectedColour.toLowerCase()];
    
    return keywords.some(keyword => text.includes(keyword));
};
