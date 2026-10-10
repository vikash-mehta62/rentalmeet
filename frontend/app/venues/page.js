'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search, Filter, MapPin, Users, Star, X,
  Building2, Monitor, Landmark, BedDouble, UtensilsCrossed,
  School, PartyPopper, GraduationCap, Leaf, Laptop, BookOpen,
  Home, Flower2, TreePine, Coffee, Projector, AlertCircle, Utensils, Car,
  SlidersHorizontal, Calendar, Heart, ShieldCheck, Info, Check, CheckCircle2,
  Briefcase, Presentation, Sparkles, Wifi, ArrowRight, RotateCcw, Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CityAutocomplete from '@/components/CityAutocomplete';
import { getVenueStartingPrice } from '@/lib/venuePricing';

const LIMIT = 32;
const DEBOUNCE_MS = 350;

// ── 12 Specific Categories with matching Replit color palettes ──────────────
const CATEGORY_ITEMS = [
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

const FOOD_TYPE_OPTIONS = [
  { label: 'All Food Types', value: '' },
  { label: 'Veg', value: 'Veg' },
  { label: 'Non-Veg', value: 'Non-Veg' },
  { label: 'Both', value: 'Both' },
];

function getVenueFoodType(venue) {
  return venue?.foodType || 'Veg';
}

function getFoodTypeIcon(foodType) {
  if (foodType === 'Veg') return Leaf;
  if (foodType === 'Non Veg' || foodType === 'Non-Veg') return UtensilsCrossed;
  return Utensils;
}

function isVenueVerified(venue) {
  if (!venue) return false;
  if (venue.isVerified === true) return true;
  if (typeof venue.profileCompletion === 'number' && venue.profileCompletion >= 70) return true;
  if (venue.documents?.verified === true) return true;

  let score = 0;
  if (venue.businessName) score += 5;
  if (venue.venueType && venue.venueType.length > 0) score += 5;
  if (venue.capacity) score += 5;
  if (venue.foodType) score += 5;
  if (venue.location?.address) score += 5;
  if (venue.location?.city) score += 5;
  if (venue.location?.pincode && venue.location.pincode !== '000000') score += 5;
  if (venue.pricing && (getVenueStartingPrice(venue).amount > 0)) score += 15;
  const imgCount = venue.images?.length || 0;
  if (imgCount >= 1) score += 5;
  if (imgCount >= 3) score += 5;
  if (imgCount >= 5) score += 5;
  if (venue.bankDetails?.accountNumber || venue.bankDetails?.ifscCode) score += 10;
  if (venue.documents?.idProof?.number || venue.documents?.idProof?.frontUrl || venue.documents?.businessProof?.documentUrl) score += 10;
  if (venue.description && venue.description.length > 40) score += 5;
  if (venue.amenities?.basic?.some(a => a.available) || venue.additionalFacilities?.length > 0) score += 5;

  return score >= 70;
}

// ── Card Skeleton ──────────────────────────────────────────────────────────
function VenueCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
      <div className="aspect-[16/10] w-full bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/40">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
        ))}
      </div>
      <div className="flex flex-1 flex-col p-4 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          <div className="flex gap-2">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16" />
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modern Venue Card Component ────────────────────────────────────────────
function VenueCard({ venue, isFavorite, onToggleFavorite }) {
  const images = (venue.images || [])
    .map(img => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean);

  const mainImage = images[0] || '/her-img2.jpg';
  const subImages = images.slice(1, 5);

  const foodType = getVenueFoodType(venue);
  const FoodIcon = getFoodTypeIcon(foodType);
  const startingPrice = getVenueStartingPrice(venue);
  const currentPrice = startingPrice.amount;
  const verified = isVenueVerified(venue);

  const venueLink = `/venues/${venue.sku || venue._id}`;
  const displayRating = venue.rating && venue.rating > 0 ? Number(venue.rating).toFixed(1) : '4.5';
  const reviewsCount = venue.reviewCount || 80;

  // Strikethrough pricing estimate
  const crossedPrice = currentPrice > 0 ? Math.round(currentPrice * 1.25) : 0;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* 16:10 Main Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Link href={venueLink}>
          <img
            src={mainImage}
            alt={venue.businessName}
            loading="lazy"
            decoding="async"
            className="h-full w-full cursor-pointer object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Top-Left Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 z-10">
          <span className="bg-white/95 dark:bg-slate-900/95 text-[10px] font-bold text-slate-800 dark:text-slate-100 px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
            {venue.venueType?.[0] || 'Company-Serviced'}
          </span>
          {verified ? (
            <span className="flex items-center gap-1 border-none bg-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 border-none bg-blue-600/90 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs backdrop-blur-xs">
              <Info className="h-3 w-3" />
              Info
            </span>
          )}
        </div>

        {/* Top-Right Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(venue._id || venue.sku);
          }}
          className={`absolute right-3 top-3 z-10 h-8 w-8 rounded-full shadow-md flex items-center justify-center transition-colors cursor-pointer ${
            isFavorite
              ? 'bg-red-50 text-red-500'
              : 'bg-white/85 dark:bg-slate-900/85 text-slate-600 dark:text-slate-300 hover:text-red-500 backdrop-blur-xs'
          }`}
          aria-label="Toggle Favorite"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* 4-Thumbnail Strip */}
      {subImages.length > 0 && (
        <div className="grid grid-cols-4 gap-1 bg-slate-50 dark:bg-slate-800/40 p-1 border-b border-slate-100 dark:border-slate-800">
          {subImages.map((thumbUrl, idx) => (
            <div key={idx} className="h-10 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
              <img
                src={thumbUrl}
                alt=""
                loading="lazy"
                className="h-full w-full cursor-pointer object-cover opacity-80 transition-opacity hover:opacity-100"
              />
            </div>
          ))}
          {/* Fill empty spots if less than 4 */}
          {[...Array(Math.max(0, 4 - subImages.length))].map((_, idx) => (
            <div key={`empty-${idx}`} className="h-10 rounded bg-slate-100 dark:bg-slate-800/60" />
          ))}
        </div>
      )}

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Title */}
        <div className="mb-1 flex items-start justify-between gap-2">
          <Link href={venueLink}>
            <h3 className="line-clamp-2 font-serif text-base sm:text-lg font-bold leading-snug text-slate-900 dark:text-white transition-colors hover:text-primary-600">
              {venue.businessName}
            </h3>
          </Link>
        </div>

        {/* Location */}
        <div className="mb-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary-500" />
          <span className="line-clamp-1">
            {[venue.location?.area, venue.location?.city].filter(Boolean).join(', ') || 'Bhopal, Madhya Pradesh'}
          </span>
        </div>

        {/* Rating Row */}
        <div className="mb-3.5 flex items-center gap-2">
          <span className="flex h-5 items-center gap-1 rounded-sm border-none bg-green-600 px-1.5 text-white text-[11px] font-bold">
            <span>{displayRating}</span>
            <Star className="h-2.5 w-2.5 fill-current" />
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({reviewsCount} Ratings) • Very Good
          </span>
        </div>

        {/* Key Features / Amenities (2x2 Grid) */}
        <div className="mb-5 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <Users className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
            <span className="truncate">{venue.capacity || 'Up to 100'} Pax</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <FoodIcon className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
            <span className="truncate">{foodType}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Wifi className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
            <span className="truncate">Free Wifi</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            {venue.location?.parkingAvailability && venue.location.parkingAvailability !== 'None' ? (
              <>
                <Car className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
                <span className="truncate">{venue.location.parkingAvailability} Parking</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
                <span className="truncate">AC &amp; Amenities</span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Price & Action Row */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {currentPrice > 0 ? startingPrice.formatted : '₹1,000'}
              </span>
              {currentPrice > 0 && (
                <span className="text-xs text-slate-400 font-medium">
                  /{startingPrice.label ? startingPrice.label : 'hr'}
                </span>
              )}
              {crossedPrice > 0 && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{crossedPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-[11px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded">
                20% off
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              + ₹122 taxes &amp; fees • Free cancellation
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={venueLink}
              className="flex-1 py-2 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              View Details
            </Link>
            <Link
              href={venueLink}
              className="flex-1 py-2 text-center rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors shadow-xs shadow-green-600/20"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Content ──────────────────────────────────────────────────────
function BrowseVenuesContent() {
  const searchParams = useSearchParams();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalVenues, setTotalVenues] = useState(0);
  const pageRef = useRef(1);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState(() => {
    const loc = searchParams.get('location') || searchParams.get('city');
    return loc ? loc.trim() : '';
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return searchParams.get('venueType') || searchParams.get('type') || searchParams.get('category') || '';
  });
  const [foodTypeFilter, setFoodTypeFilter] = useState(() => searchParams.get('foodType') || '');
  const [personsFilter, setPersonsFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // More Filters Drawer State
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [capacityRange, setCapacityRange] = useState([10, 1000]);
  const [priceRange, setPriceRange] = useState(25000);

  // Favorites state
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('favoriteVenues') || localStorage.getItem('favoriteSpaces');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('favoriteVenues', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Sync debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Sync filters from URL parameters if navigated via link
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    const loc = searchParams.get('location') || searchParams.get('city');
    const vt = searchParams.get('venueType') || searchParams.get('type') || searchParams.get('category');
    const ft = searchParams.get('foodType');
    if (loc !== null) setCityFilter(loc.trim());
    if (vt) setSelectedCategory(vt);
    if (ft) setFoodTypeFilter(ft);
  }, [searchParams]);

  const sentinelRef = useRef(null);
  const abortRef = useRef(null);
  const isFetchingRef = useRef(false);

  const fetchVenues = useCallback(async (pageNum, reset) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({ page: pageNum, limit: LIMIT });
      if (searchTerm) params.set('search', searchTerm);
      if (cityFilter) params.set('city', cityFilter);
      if (selectedCategory) params.set('venueType', selectedCategory);
      if (foodTypeFilter) params.set('foodType', foodTypeFilter);
      if (priceRange && priceRange < 25000) params.set('maxPrice', priceRange);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        const newVenues = data.venues || [];
        setVenues((prev) => (reset ? newVenues : [...prev, ...newVenues]));
        const tot = data.totalVenues || data.total || 0;
        setTotalVenues(tot);
        const totalPgs = data.totalPages || Math.ceil(tot / LIMIT);
        setHasMore(pageNum < totalPgs);
        pageRef.current = pageNum;
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError('Failed to load venues. Please try again.');
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, cityFilter, selectedCategory, foodTypeFilter, priceRange]);

  useEffect(() => {
    pageRef.current = 1;
    setVenues([]);
    setHasMore(true);
    fetchVenues(1, true);
  }, [fetchVenues]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        fetchVenues(pageRef.current + 1, false);
      }
    }, { rootMargin: '300px', threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchVenues]);

  const resetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setCityFilter('');
    setSelectedCategory('');
    setFoodTypeFilter('');
    setPersonsFilter('');
    setDateFilter('');
    setCapacityRange([10, 1000]);
    setPriceRange(25000);
  };

  const hasActiveFilters = Boolean(
    searchTerm || cityFilter || selectedCategory || foodTypeFilter || personsFilter || dateFilter || priceRange < 25000 || capacityRange[0] > 10 || capacityRange[1] < 1000
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
        
        {/* ── 1. VENUE CATEGORIES HORIZONTAL CAROUSEL / PILLS ───────────────── */}
        <section className="mb-7">
          <div className="mb-3.5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold sm:text-3xl text-slate-900 dark:text-white">
                Venue Categories
              </h1>
            </div>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-none">
            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: 'repeat(13, minmax(76px, 1fr))',
                minWidth: '1040px'
              }}
            >
              {/* All Venues Button */}
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 transition-all cursor-pointer ${
                  selectedCategory === ''
                    ? 'border-primary-600 bg-primary-600 text-white shadow-lg scale-102 ring-2 ring-primary-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-primary-400 hover:bg-primary-50/50'
                }`}
              >
                <Building2 className="h-6 w-6" />
                <span className="px-1 text-center text-[11px] font-bold leading-tight">
                  All Venues
                </span>
              </button>

              {/* 12 Individual Categories */}
              {CATEGORY_ITEMS.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
                    className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 transition-all cursor-pointer ${
                      isSelected ? 'scale-105 shadow-md' : 'hover:brightness-95'
                    }`}
                    style={{
                      backgroundColor: isSelected ? cat.iconColor : cat.bg,
                      borderColor: isSelected ? cat.iconColor : cat.border,
                      color: isSelected ? '#ffffff' : cat.iconColor
                    }}
                  >
                    <IconComponent className="h-6 w-6" />
                    <span className="px-1 text-center text-[11px] font-bold leading-tight">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 2. UNIFIED SEARCH & FILTER BAR CARD ────────────────────────────── */}
        <section className="mb-8">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-2 sm:p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
              
              {/* 1. Venue Name Search */}
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <Search className="mr-2.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                <input
                  type="text"
                  placeholder="Search venue name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* 2. City / Location Input */}
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <MapPin className="mr-2.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                <input
                  type="text"
                  placeholder="Location (Bhopal, Indore...)"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                {cityFilter && (
                  <button onClick={() => setCityFilter('')} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* 3. Venue Type Select */}
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <Building2 className="mr-2.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="" className="dark:bg-slate-900">All Venue Types</option>
                  {CATEGORY_ITEMS.map((cat) => (
                    <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Food Type Select */}
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <Utensils className="mr-2.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                <select
                  value={foodTypeFilter}
                  onChange={(e) => setFoodTypeFilter(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  {FOOD_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.value} className="dark:bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Persons Input */}
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <Users className="mr-2.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                <input
                  type="number"
                  min="1"
                  placeholder="Persons (e.g. 100)"
                  value={personsFilter}
                  onChange={(e) => setPersonsFilter(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* 6. Event Date Input */}
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <Calendar className="mr-2.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                />
              </div>

            </div>
          </div>
        </section>

        {/* ── 3. LISTING HEADER & MORE FILTERS TRIGGER ───────────────────────── */}
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400" data-testid="text-room-count">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                Loading venues...
              </span>
            ) : (
              <>Showing <span className="font-bold text-slate-900 dark:text-white">{venues.length}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalVenues}</span> venues</>
            )}
          </p>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            )}

            <button
              type="button"
              onClick={() => setMoreFiltersOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary-500" />
              More Filters
              {(priceRange < 25000 || capacityRange[0] > 10 || capacityRange[1] < 1000) && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700">
                  Active
                </span>
              )}
            </button>
          </div>
        </section>

        {/* ── 4. ERROR MESSAGE ───────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-red-50 p-4 border border-red-200 text-red-700">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchVenues(1, true)}
              className="text-xs font-bold underline cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── 5. VENUES GRID (4 COLUMNS) ─────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <VenueCardSkeleton key={i} />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <Building2 className="mx-auto mb-4 h-14 w-14 text-slate-300 dark:text-slate-700" />
            <h3 className="mb-2 text-lg font-bold text-slate-800 dark:text-slate-100 font-serif">
              No venues found
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              We couldn't find any venues matching your active filters. Try adjusting your search term, category or clearing filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {venues.map((venue) => (
              <VenueCard
                key={venue._id}
                venue={venue}
                isFavorite={favorites.includes(venue._id || venue.sku)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Sentinel for Infinite Scroll */}
        <div ref={sentinelRef} className="h-2 mt-8" />

        {loadingMore && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {[...Array(4)].map((_, i) => (
              <VenueCardSkeleton key={`more-${i}`} />
            ))}
          </div>
        )}

        {!loading && !loadingMore && !hasMore && venues.length > 0 && (
          <div className="py-12 mt-8 text-center border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-400">
              You have explored all <span className="font-bold text-slate-700 dark:text-slate-200">{totalVenues}</span> venues
            </p>
          </div>
        )}
      </main>

      {/* ── 6. "MORE FILTERS" SLIDE-OVER DRAWER MODAL ───────────────────────── */}
      {moreFiltersOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMoreFiltersOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary-600" />
                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                    More Filters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreFiltersOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="py-6 space-y-6">
                {/* Max Price Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Price Budget
                    </label>
                    <span className="text-xs font-bold text-primary-600">
                      {priceRange >= 25000 ? 'Any Budget' : `Up to ₹${priceRange.toLocaleString('en-IN')}/hr`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="25000"
                    step="500"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-primary-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>₹500</span>
                    <span>₹10,000</span>
                    <span>₹25,000+</span>
                  </div>
                </div>

                {/* Capacity Range */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Guest Capacity
                    </label>
                    <span className="text-xs font-bold text-primary-600">
                      {capacityRange[0]} - {capacityRange[1] >= 1000 ? '1000+' : capacityRange[1]} Pax
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="25"
                    value={capacityRange[1]}
                    onChange={(e) => setCapacityRange([capacityRange[0], Number(e.target.value)])}
                    className="w-full accent-primary-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>10 Guests</span>
                    <span>500 Guests</span>
                    <span>1,000+ Guests</span>
                  </div>
                </div>

                {/* Food Type filter pills */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Allowed Food Preference
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FOOD_TYPE_OPTIONS.map((opt) => {
                      const isSel = foodTypeFilter === opt.value;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setFoodTypeFilter(opt.value)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-primary-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setMoreFiltersOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors shadow-md shadow-primary-500/20 cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function BrowseVenues() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-950">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      <BrowseVenuesContent />
    </Suspense>
  );
}
