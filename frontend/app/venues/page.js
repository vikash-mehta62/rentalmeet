'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search, Filter, MapPin, Users, Star, X,
  Building2, Monitor, Landmark, BedDouble, UtensilsCrossed,
  School, PartyPopper, GraduationCap, Leaf, Laptop, BookOpen,
  Home, Flower2, TreePine, Coffee, Projector, AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CityAutocomplete from '@/components/CityAutocomplete';

const LIMIT = 30;
const DEBOUNCE_MS = 400;

function VenueCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col sm:flex-row animate-pulse">
      <div className="w-full sm:w-80 h-52 sm:h-56 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
      <div className="flex-1 p-5 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="flex justify-between items-end pt-8">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-28" />
          <div className="flex gap-2">
            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

function VenueCard({ venue }) {
  const p = venue.pricing;
  const allPrices = [
    p?.perHour?.weekday, p?.perHour?.weekend,
    p?.halfDay?.weekday, p?.halfDay?.weekend,
    p?.fullDay?.weekday, p?.fullDay?.weekend,
  ].map(v => parseInt(v)).filter(v => v > 0);
  const currentPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col sm:flex-row hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="w-full sm:w-80 flex-shrink-0">
        <div className="flex gap-1 h-52 sm:h-56">
          <div className="flex-1 relative overflow-hidden bg-slate-200 dark:bg-slate-700">
            <img src={venue.images?.[0]?.url || '/her-img2.jpg'} alt={venue.businessName} loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ backgroundImage: 'linear-gradient(135deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%)', backgroundSize: '200% 100%' }}
            />
            {venue.venueType?.[0] && (
              <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 text-[10px] font-semibold text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                {venue.venueType[0]}
              </span>
            )}
          </div>
          {venue.images?.length > 1 && (
            <div className="w-20 flex flex-col gap-1">
              {venue.images.slice(1, 3).map((img, idx) => (
                <div key={idx} className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-800 rounded">
                  <img src={img.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
              {venue.images.length > 3 && (
                <div className="flex-1 bg-slate-900/80 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">+{venue.images.length - 3}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 p-5 flex flex-col min-w-0">
        <div className="flex-1">
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 line-clamp-1">{venue.businessName}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
            {[venue.location?.area, venue.location?.city].filter(Boolean).join(', ')}
          </p>
          {venue.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                {venue.rating} <Star className="w-3 h-3 fill-current" />
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">({venue.reviewCount || 0} ratings)</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <Users className="w-3.5 h-3.5 text-slate-400" /> {venue.capacity}
            </span>
            {venue.amenities?.basic?.filter(a => a.available).slice(0, 3).map((a, i) => (
              <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{a.name}</span>
            ))}
            {venue.amenities?.basic?.filter(a => a.available).length > 3 && (
              <span className="text-primary-500 font-medium">+{venue.amenities.basic.filter(a => a.available).length - 3} more</span>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {currentPrice > 0 ? `Rs.${currentPrice.toLocaleString('en-IN')}` : 'Price on request'}
              </span>
              {currentPrice > 0 && <span className="text-xs text-slate-400">onwards</span>}
            </div>
            {venue.activeCoupons?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {venue.activeCoupons.slice(0, 2).map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {c.code} - {c.discountType === 'percentage' ? `${c.discountValue}%` : `Rs.${c.discountValue}`} off
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/venues/${venue.sku}`}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              View Details
            </Link>
            <Link href={`/venues/${venue.sku}`}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors">
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const VENUE_TYPE_ICONS = {
  'Meeting Hall': Building2, 'Farm House': TreePine, 'Conference Hall': Monitor,
  'Govt. Auditorium': Landmark, 'Hotel': BedDouble, 'Private Auditorium': Projector,
  'Restaurant': UtensilsCrossed, 'School Auditorium': School, 'Function Hall': PartyPopper,
  'College Auditorium': GraduationCap, 'Open Lawn': Leaf, 'Co-Work Space': Laptop,
  'Banquet Hall': Coffee, 'Guest House': Home, 'Training Center': BookOpen, 'Marriage Garden': Flower2,
};

function BrowseVenuesContent() {
  const searchParams = useSearchParams();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalVenues, setTotalVenues] = useState(0);
  const pageRef = useRef(1);

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Pre-fill city from ?location= URL param
  const [cityFilter, setCityFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      const loc = new URLSearchParams(window.location.search).get('location');
      return loc ? loc.charAt(0).toUpperCase() + loc.slice(1) : '';
    }
    return '';
  });
  const [typeFilter, setTypeFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [venueTypes, setVenueTypes] = useState([]);
  const [filterSettings, setFilterSettings] = useState({ capacityMin: 10, capacityMax: 1000, priceMin: 1000, priceMax: 1000000 });

  // Sync city from URL param on mount
  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc) {
      setCityFilter(loc.charAt(0).toUpperCase() + loc.slice(1));
    }
  }, [searchParams]);

  const sentinelRef = useRef(null);
  const abortRef = useRef(null);
  const isFetchingRef = useRef(false);

  const capacityRanges = [
    { label: '10-50', min: 10, max: 50 }, { label: '50-100', min: 50, max: 100 },
    { label: '100-200', min: 100, max: 200 }, { label: '200-500', min: 200, max: 500 },
    { label: '500-1000', min: 500, max: 1000 }, { label: '1000+', min: 1000, max: 100000 },
  ];

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/venue-types`).then(r => r.json()).then(d => { if (d.success) setVenueTypes(d.venueTypes); }).catch(() => {});
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact-settings`).then(r => r.json()).then(d => { if (d.success && d.data?.filterSettings) setFilterSettings(d.data.filterSettings); }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchVenues = useCallback(async (pageNum, reset) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (reset) { setLoading(true); setError(null); } else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: LIMIT });
      if (searchTerm) params.set('search', searchTerm);
      if (cityFilter) params.set('city', cityFilter);
      if (typeFilter) params.set('venueType', typeFilter);
      if (capacityFilter) params.set('capacity', capacityFilter);
      if (priceFilter) params.set('maxPrice', priceFilter);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        const newVenues = data.venues || [];
        setVenues(prev => reset ? newVenues : [...prev, ...newVenues]);
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
  }, [searchTerm, cityFilter, typeFilter, capacityFilter, priceFilter]);

  useEffect(() => {
    pageRef.current = 1;
    setVenues([]);
    setHasMore(true);
    fetchVenues(1, true);
  }, [fetchVenues]);

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

  const resetFilters = () => { setSearchInput(''); setSearchTerm(''); setCityFilter(''); setTypeFilter(''); setCapacityFilter(''); setPriceFilter(null); };
  const hasActiveFilters = !!(searchTerm || cityFilter || typeFilter || capacityFilter || priceFilter);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950">
      <Navbar />
      <div className="pt-28 lg:pt-32 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <span className="inline-block border border-gray-300 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">Browse Venues</span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-3">Browse All Venues</h1>
          <p className="text-gray-500 dark:text-slate-400 max-w-2xl">Find the perfect venue for your next meeting, conference, or corporate event.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:hidden fixed bottom-6 right-6 z-[120]">
            <button onClick={() => setMobileFiltersOpen(true)}
              className="bg-primary-500 text-white px-5 py-3 rounded-xl shadow-xl hover:bg-primary-600 flex items-center gap-2 font-semibold text-sm">
              <Filter className="w-4 h-4" /> Filters {hasActiveFilters && <span className="w-2 h-2 bg-white rounded-full" />}
            </button>
          </div>
          {mobileFiltersOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-[115]" onClick={() => setMobileFiltersOpen(false)} />}

          <aside className={`lg:w-64 flex-shrink-0 ${mobileFiltersOpen ? 'fixed inset-0 z-[115] lg:relative lg:z-auto' : 'hidden lg:block'}`}>
            <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 ${mobileFiltersOpen ? 'fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] overflow-y-auto z-[120] rounded-none shadow-2xl' : 'sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto'}`}>
              {mobileFiltersOpen && (
                <button onClick={() => setMobileFiltersOpen(false)} className="lg:hidden absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              )}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1"><X className="w-3 h-3" /> Clear all</button>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Venue name..." value={searchInput} onChange={e => setSearchInput(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  {searchInput && <button onClick={() => setSearchInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">City</label>
                <CityAutocomplete value={cityFilter} onChange={setCityFilter} placeholder="Search city..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Venue Type</label>
                <div className="space-y-1">
                  {venueTypes.map(type => {
                    const Icon = VENUE_TYPE_ICONS[type.name] || Building2;
                    const isActive = typeFilter === type.name;
                    return (
                      <button key={type._id} onClick={() => setTypeFilter(isActive ? '' : type.name)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${isActive ? 'bg-primary-500 text-white font-semibold shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-left truncate">{type.name}</span>
                        {isActive && <X className="w-3 h-3 ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Capacity</label>
                <input type="range" min={filterSettings.capacityMin} max={filterSettings.capacityMax} step="10" className="w-full accent-primary-500"
                  onChange={e => { const v = parseInt(e.target.value); const r = capacityRanges.find(r => v >= r.min && v <= r.max); setCapacityFilter(r ? r.label : ''); }} />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>{filterSettings.capacityMin}</span><span>{filterSettings.capacityMax}+</span></div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Max Price {priceFilter ? `- Rs.${priceFilter.toLocaleString('en-IN')}` : ''}
                </label>
                <input type="range" min={filterSettings.priceMin} max={filterSettings.priceMax}
                  step={Math.max(1000, Math.round((filterSettings.priceMax - filterSettings.priceMin) / 50))} className="w-full accent-primary-500"
                  onChange={e => setPriceFilter(parseInt(e.target.value))} />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>Rs.{filterSettings.priceMin.toLocaleString('en-IN')}</span><span>Rs.{filterSettings.priceMax.toLocaleString('en-IN')}</span></div>
              </div>
              <button onClick={resetFilters} className="w-full py-2.5 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:border-red-300 hover:text-red-500 transition-all text-sm flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Reset All Filters
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 min-h-[24px]">
              {!loading && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {totalVenues > 0
                    ? <><span className="font-semibold text-slate-900 dark:text-slate-100">{venues.length}</span> of <span className="font-semibold text-slate-900 dark:text-slate-100">{totalVenues}</span> venues</>
                    : 'No venues found'}
                </p>
              )}
              {hasActiveFilters && !loading && (
                <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1"><X className="w-3 h-3" /> Clear filters</button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
                <button onClick={() => fetchVenues(1, true)} className="ml-auto text-xs font-semibold underline">Retry</button>
              </div>
            )}

            {loading && <div className="space-y-4">{[...Array(4)].map((_, i) => <VenueCardSkeleton key={i} />)}</div>}

            {!loading && !error && venues.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Building2 className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">No venues found</h3>
                <p className="text-sm text-slate-500 mb-5">Try adjusting your filters or search term.</p>
                <button onClick={resetFilters} className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors">Clear Filters</button>
              </div>
            )}

            {!loading && <div className="space-y-4">{venues.map(venue => <VenueCard key={venue._id} venue={venue} />)}</div>}

            <div ref={sentinelRef} className="h-1 mt-4" />

            {loadingMore && <div className="space-y-4 mt-4">{[...Array(3)].map((_, i) => <VenueCardSkeleton key={i} />)}</div>}

            {!loading && !loadingMore && !hasMore && venues.length > 0 && (
              <div className="text-center py-8 mt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-400">You have seen all <span className="font-semibold">{totalVenues}</span> venues</p>
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { Suspense } from 'react';

export default function BrowseVenues() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-950"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>}>
      <BrowseVenuesContent />
    </Suspense>
  );
}
