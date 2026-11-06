import {
  Briefcase, Presentation, Landmark, PartyPopper, TreePine, BedDouble,
  Utensils, Laptop, Home, BookOpen, Flower2, Sparkles, Trophy, Building2
} from 'lucide-react';

export const DEFAULT_CATEGORY_ITEMS = [
  { id: 'Meeting Hall', label: 'Meeting Hall', icon: Briefcase, bg: '#E3F2FD', iconColor: '#1565C0', border: '#90CAF9' },
  { id: 'Conference Hall', label: 'Conference Hall', icon: Presentation, bg: '#F3E5F5', iconColor: '#6A1B9A', border: '#CE93D8' },
  { id: 'Auditorium', label: 'Auditoriums', icon: Landmark, bg: '#FFEBEE', iconColor: '#B71C1C', border: '#EF9A9A' },
  { id: 'Banquet Hall', label: 'Banquet Hall', icon: PartyPopper, bg: '#FFF3E0', iconColor: '#E65100', border: '#FFB74D' },
  { id: 'Farm House', label: 'Farm House', icon: TreePine, bg: '#E8F5E9', iconColor: '#2E7D32', border: '#A5D6A7' },
  { id: 'Hotel', label: 'Hotel', icon: BedDouble, bg: '#FFFDE7', iconColor: '#F57F17', border: '#FFF176' },
  { id: 'Restaurant', label: 'Restaurant', icon: Utensils, bg: '#FFF3E0', iconColor: '#E65100', border: '#FFCC80' },
  { id: 'Co-Work Space', label: 'Co-Work Space', icon: Laptop, bg: '#E0F7FA', iconColor: '#00695C', border: '#80DEEA' },
  { id: 'Guest House', label: 'Guest House', icon: Home, bg: '#FCE4EC', iconColor: '#C2185B', border: '#F48FB1' },
  { id: 'Training Center', label: 'Training Center', icon: BookOpen, bg: '#E8EAF6', iconColor: '#283593', border: '#9FA8DA' },
  { id: 'Marriage Garden', label: 'Marriage Garden', icon: Flower2, bg: '#F1F8E9', iconColor: '#558B2F', border: '#C5E1A5' },
  { id: 'Play Zone', label: 'Play Zones', icon: Sparkles, bg: '#EDE7F6', iconColor: '#4527A0', border: '#B39DDB' },
];

export const DEFAULT_VENUE_CATEGORIES = DEFAULT_CATEGORY_ITEMS.map(c => c.id);

const FALLBACK_PALETTES = [
  { bg: '#E0F2FE', iconColor: '#0369A1', border: '#7DD3FC' },
  { bg: '#ECFDF5', iconColor: '#047857', border: '#6EE7B7' },
  { bg: '#FEF3C7', iconColor: '#B45309', border: '#FCD34D' },
  { bg: '#F3E8FF', iconColor: '#7E22CE', border: '#D8B4FE' },
  { bg: '#FFE4E6', iconColor: '#BE123C', border: '#FDA4AF' },
  { bg: '#CCFBF1', iconColor: '#0F766E', border: '#5EEAD4' },
];

export function getIconForCategory(name = '') {
  const n = String(name || '').toLowerCase();
  if (n.includes('meeting')) return Briefcase;
  if (n.includes('conference')) return Presentation;
  if (n.includes('auditorium')) return Landmark;
  if (n.includes('banquet')) return PartyPopper;
  if (n.includes('farm')) return TreePine;
  if (n.includes('hotel') || n.includes('resort')) return BedDouble;
  if (n.includes('restaurant') || n.includes('cafe') || n.includes('dining')) return Utensils;
  if (n.includes('co-work') || n.includes('cowork')) return Laptop;
  if (n.includes('guest')) return Home;
  if (n.includes('training') || n.includes('class')) return BookOpen;
  if (n.includes('marriage') || n.includes('garden') || n.includes('lawn')) return Flower2;
  if (n.includes('turf') || n.includes('sport') || n.includes('ground') || n.includes('court') || n.includes('stadium')) return Trophy;
  if (n.includes('play')) return Sparkles;
  return Building2;
}

export function formatVenueCategoryItems(apiVenueTypes = []) {
  if (!Array.isArray(apiVenueTypes) || apiVenueTypes.length === 0) {
    return DEFAULT_CATEGORY_ITEMS;
  }

  return apiVenueTypes.map((vt, index) => {
    const name = typeof vt === 'string' ? vt : (vt.name || vt.title || '');
    const foundDefault = DEFAULT_CATEGORY_ITEMS.find(
      (d) => d.id.toLowerCase() === name.toLowerCase() || d.label.toLowerCase() === name.toLowerCase()
    );

    if (foundDefault) {
      return {
        ...foundDefault,
        id: name,
        label: typeof vt === 'object' && vt.name ? vt.name : foundDefault.label,
      };
    }

    const palette = FALLBACK_PALETTES[index % FALLBACK_PALETTES.length];
    return {
      id: name,
      label: name,
      icon: getIconForCategory(name),
      bg: palette.bg,
      iconColor: palette.iconColor,
      border: palette.border,
    };
  });
}
