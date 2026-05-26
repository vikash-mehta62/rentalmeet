'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { serviceCategories, categoryIconMap } from '@/data/serviceData';
import {
  Filter, X, Search, MapPin,
  Package, User, BadgeCheck, AlertCircle
} from 'lucide-react';

const BUDGET_MIN = 0;
const BUDGET_MAX = 1000000;
const LIMIT = 30;
const DEBOUNCE_MS = 400;

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row animate-pulse">
      <div className="w-full sm:w-80 h-52 sm:h-56 bg-slate-200 flex-shrink-0" />
      <div className="flex-1 p-5 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="flex gap-2 pt-1">
          {[...Array(3)].map((_, i) => <div key={i} className="h-5 bg-slate-200 rounded-full w-16" />)}
        </div>
        <div className="flex justify-between items-end pt-6">
          <div className="h-8 bg-slate-200 rounded w-28" />
          <div className="flex gap-2">
            <div className="h-9 bg-slate-200 rounded w-24" />
            <div className="h-9 bg-slate-200 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Vendor Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VendorCard({ svc }) {
  const router = useRouter();
  const cat = categoryIconMap[svc.category];
  const Icon = cat?.icon ?? Package;
  const serviceImages = [svc.featuredImage, ...(svc.images || [])].filter(Boolean);
  const hasSideImages = serviceImages.length > 1;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="w-full sm:w-80 flex-shrink-0">
        <div className="flex gap-1 h-52 sm:h-56">
          <div className="flex-1 relative overflow-hidden bg-slate-200">
            {serviceImages[0] ? (
              <img
                src={serviceImages[0]}
                alt={svc.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Package className="w-14 h-14 text-gray-300" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <span className="bg-white/95 text-gray-700 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Icon className="w-3 h-3" />{cat?.label || svc.category}
              </span>
            </div>
          </div>

          {hasSideImages && (
            <div className="w-20 flex flex-col gap-1">
              {serviceImages.slice(1, 3).map((img, idx) => (
                <div key={idx} className="flex-1 relative overflow-hidden bg-slate-200 rounded">
                  <img src={img} alt={`${svc.title} ${idx + 2}`} loading="lazy" decoding="async"
                    className="w-full h-full object-cover" />
                </div>
              ))}
              {serviceImages.length > 3 && (
                <div className="flex-1 relative overflow-hidden bg-slate-900/80 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">+{serviceImages.length - 3}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex-1">
          <h3 className="font-serif text-lg font-bold text-slate-900 mb-1 leading-tight line-clamp-1">
            {svc.title}
          </h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-primary-500" />
            {[svc.city, svc.state].filter(Boolean).join(', ') || '-'}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <BadgeCheck className="w-4 h-4 text-green-600" /> Verified Vendor
            </span>
            {svc.vendor?.companyName && (
              <span className="text-xs text-slate-400">· {svc.vendor.companyName}</span>
            )}
          </div>

          {svc.description && (
            <p className="text-sm text-slate-600 mb-2 line-clamp-1">{svc.description}</p>
          )}

          {svc.specialization?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {svc.specialization.slice(0, 3).map((s, i) => (
                <span key={i} className="text-[11px] bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full font-medium">{s}</span>
              ))}
              {svc.specialization.length > 3 && (
                <span className="text-[11px] text-primary-500 font-medium">+{svc.specialization.length - 3} more</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            {svc.tags?.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
            {(svc.tags?.length || 0) > 3 && (
              <span className="text-primary-500 font-medium">+ {svc.tags.length - 3} more</span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between">
          <div>
            {svc.startingPrice ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  ₹{svc.startingPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500">onwards</span>
              </div>
            ) : (
              <span className="text-sm text-slate-500">Price on request</span>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Direct booking available</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/other-services/${svc._id}`)}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              View Profile
            </button>
            <button
              onClick={() => router.push(`/other-services/${svc._id}`)}
              className="px-5 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function FilterPanel({ searchInput, setSearchInput, citySearch, setCitySearch, budgetRange, setBudgetRange, formatBudget, onReset, selectedCategory, setSelectedCategory }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search vendors..." value={searchInput} onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          {searchInput && <button onClick={() => setSearchInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">City</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="e.g. Bhopal, Mumbai..." value={citySearch} onChange={e => setCitySearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          {citySearch && <button onClick={() => setCitySearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Budget {budgetRange[1] < BUDGET_MAX ? `· ${formatBudget(budgetRange[1])}` : ''}
        </label>
        <input type="range" min={0} max={1000000} step={10000} value={budgetRange[1]}
          onChange={e => setBudgetRange([0, parseInt(e.target.value)])} className="w-full accent-primary-500" />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>₹0</span><span>₹10L+</span></div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
        <div className="space-y-1">
          <button onClick={() => setSelectedCategory('')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left ${!selectedCategory ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Package className="w-4 h-4 flex-shrink-0" />All Services
          </button>
          {serviceCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(isActive ? '' : cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left ${isActive ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                style={isActive ? { backgroundColor: cat.bg, color: cat.iconColor } : {}}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cat.iconColor }} />
                {cat.label}
                {isActive && <X className="w-3 h-3 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={onReset} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:border-red-300 hover:text-red-500 transition-all">
        <X className="w-4 h-4" />Reset Filters
      </button>
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function OtherServicesPage() {
  const searchParams = useSearchParams();
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [budgetRange, setBudgetRange] = useState([BUDGET_MIN, BUDGET_MAX]);
  const [filterOpen, setFilterOpen] = useState(false);

  // Auto-apply ?location= param
  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc) setCitySearch(loc.charAt(0).toUpperCase() + loc.slice(1));
  }, [searchParams]);

  const sentinelRef = useRef(null);
  const abortRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchServices = useCallback(async (pageNum, reset) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (reset) { setLoading(true); setError(null); } else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, page: pageNum });
      if (selectedCategory) params.set('category', selectedCategory);
      if (search) params.set('search', search);
      if (citySearch) params.set('city', citySearch);
      if (budgetRange[1] < BUDGET_MAX) params.set('maxPrice', budgetRange[1]);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor-services?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setServices(prev => reset ? data.services : [...prev, ...data.services]);
        setTotal(data.total || 0);
        const totalPgs = data.totalPages || Math.ceil((data.total || 0) / LIMIT);
        setHasMore(pageNum < totalPgs);
        pageRef.current = pageNum;
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError('Failed to load services. Please try again.');
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, search, citySearch, budgetRange]);

  // Filter change → reset
  useEffect(() => {
    pageRef.current = 1;
    setServices([]);
    setHasMore(true);
    fetchServices(1, true);
  }, [fetchServices]);

  // IntersectionObserver — 300px lookahead
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        fetchServices(pageRef.current + 1, false);
      }
    }, { rootMargin: '300px', threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchServices]);

  const hasActiveFilters = !!(selectedCategory || search || citySearch || budgetRange[1] < BUDGET_MAX);
  const handleReset = () => { setSearchInput(''); setSearch(''); setCitySearch(''); setSelectedCategory(''); setBudgetRange([BUDGET_MIN, BUDGET_MAX]); };

  const formatBudget = (val) => {
    if (val >= 1000000) return '₹10L+';
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950">
      <Navbar />

      <div className="min-h-screen pt-28 lg:pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-6">
            <span className="inline-block border border-gray-300 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">Premium Services</span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">Browse All Services</h1>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl">From catering to celebrity appearances - find verified vendors for every aspect of your event.</p>
          </div>

          {/* Category Strip */}
          <div className="mb-8">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}>
              <button
                onClick={() => setSelectedCategory('')}
                className={`flex flex-col items-center justify-center gap-2 border-2 rounded-xl transition-all aspect-square ${
                  !selectedCategory
                    ? 'bg-primary-500 text-white border-primary-500 shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                }`}>
                <Package className="w-7 h-7" />
                <span className="text-[11px] font-semibold text-center leading-tight px-1">All Services</span>
              </button>
              {serviceCategories.map(cat => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button key={cat.id}
                    onClick={() => setSelectedCategory(isActive ? '' : cat.id)}
                    className={`flex flex-col items-center justify-center gap-2 border-2 rounded-xl transition-all aspect-square ${isActive ? 'shadow-lg scale-105' : 'hover:brightness-95'}`}
                    style={{
                      backgroundColor: isActive ? cat.iconColor : cat.bg,
                      borderColor: isActive ? cat.iconColor : cat.border,
                      color: isActive ? '#fff' : cat.iconColor,
                    }}>
                    <Icon className="w-7 h-7" />
                    <span className="text-[11px] font-semibold text-center leading-tight px-1">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-28">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <Filter className="w-4 h-4" />Filters
                  {hasActiveFilters && <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Active</span>}
                </h3>
                <FilterPanel searchInput={searchInput} setSearchInput={setSearchInput} citySearch={citySearch} setCitySearch={setCitySearch}
                  budgetRange={budgetRange} setBudgetRange={setBudgetRange} formatBudget={formatBudget}
                  onReset={handleReset} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
              </div>
            </aside>

            {/* List */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                {!loading && (
                  <p className="text-sm text-gray-500">
                    <span className="font-bold text-gray-900">{services.length}</span> of {total} vendors
                  </p>
                )}
                <button onClick={() => setFilterOpen(!filterOpen)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 transition-all">
                  <Filter className="w-4 h-4" />Filters {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full inline-block" />}
                </button>
              </div>

              {/* Mobile filter */}
              {filterOpen && (
                <div className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                  <FilterPanel searchInput={searchInput} setSearchInput={setSearchInput} citySearch={citySearch} setCitySearch={setCitySearch}
                    budgetRange={budgetRange} setBudgetRange={setBudgetRange} formatBudget={formatBudget}
                    onReset={handleReset} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                  <button onClick={() => fetchServices(1, true)} className="ml-auto text-xs font-semibold underline">Retry</button>
                </div>
              )}

              {/* Initial skeleton */}
              {loading && (
                <div className="flex flex-col gap-4">
                  {[...Array(4)].map((_, i) => <ServiceCardSkeleton key={i} />)}
                </div>
              )}

              {/* Empty */}
              {!loading && !error && services.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-700 mb-2">No vendors found</h3>
                  <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or check back later.</p>
                  {hasActiveFilters && (
                    <button onClick={handleReset} className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 transition-all">
                      Clear Filters
                    </button>
                  )}
                </div>
              )}

              {/* Cards */}
              {!loading && (
                <div className="flex flex-col gap-4">
                  {services.map(svc => <VendorCard key={svc._id} svc={svc} />)}
                </div>
              )}

              {/* Sentinel — 300px lookahead */}
              <div ref={sentinelRef} className="h-1 mt-4" />

              {/* Loading more skeletons */}
              {loadingMore && (
                <div className="flex flex-col gap-4 mt-4">
                  {[...Array(3)].map((_, i) => <ServiceCardSkeleton key={i} />)}
                </div>
              )}

              {/* End */}
              {!loading && !loadingMore && !hasMore && services.length > 0 && (
                <div className="text-center py-8 mt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-400">You've seen all <span className="font-semibold">{total}</span> services</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

