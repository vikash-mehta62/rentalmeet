import {
  Utensils, Sparkles, Camera, ShieldAlert, Star, Music,
  Flower2, Truck,
} from 'lucide-react';

export const serviceCategories = [
  { id: 'Catering & Food',      label: 'Catering',            icon: Utensils,    bg: '#FFF3E0', iconColor: '#E65100', border: '#FFB74D' },
  { id: 'Makeup & Beauty',      label: 'Makeup & Beauty',     icon: Sparkles,    bg: '#FCE4EC', iconColor: '#C2185B', border: '#F48FB1' },
  { id: 'Photography & Video',  label: 'Photography',         icon: Camera,      bg: '#E3F2FD', iconColor: '#1565C0', border: '#90CAF9' },
  { id: 'Entertainment',        label: 'Entertainment',       icon: Music,       bg: '#F3E5F5', iconColor: '#6A1B9A', border: '#CE93D8' },
  { id: 'Decor & Floral',       label: 'Decor & Floral',      icon: Flower2,     bg: '#E8F5E9', iconColor: '#2E7D32', border: '#A5D6A7' },
  { id: 'Security',             label: 'Security',            icon: ShieldAlert, bg: '#FFEBEE', iconColor: '#B71C1C', border: '#EF9A9A' },
  { id: 'Celebrity',            label: 'Celebrity',           icon: Star,        bg: '#FFFDE7', iconColor: '#F57F17', border: '#FFF176' },
  { id: 'Logistics & Support',  label: 'Logistics & Support', icon: Truck,       bg: '#E0F7FA', iconColor: '#00695C', border: '#80DEEA' },
];

// Category id → icon map for quick lookup
export const categoryIconMap = Object.fromEntries(
  serviceCategories.map(c => [c.id, c])
);
