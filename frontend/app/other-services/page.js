'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { serviceCategories, categoryIconMap } from '@/data/serviceData';
import {
  Filter, X, Search, MapPin, Heart,
  Package, Calendar, IndianRupee, User, FileText,
  CheckCircle2, BadgeCheck, Printer, Plus, Minus,
  Star, ChevronLeft, ChevronRight
} from 'lucide-react';

const BUDGET_MIN = 0;
const BUDGET_MAX = 1000000;

// ── Vendor Card ───────────────────────────────────────────────────────────
function VendorCard({ svc, isFavorite, onToggleFavorite }) {
  const router = useRouter();
  const cat = categoryIconMap[svc.category];
  const Icon = cat?.icon ?? Package;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col md:flex-row">
      {/* Image */}
      <div className="relative w-full md:w-72 flex-shrink-0 h-52 md:h-auto overflow-hidden">
        {svc.featuredImage
          ? <img src={svc.featuredImage} alt={svc.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
          : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Package className="w-14 h-14 text-gray-300" /></div>
        }
        <div className="absolute top-2 left-2">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Icon className="w-3 h-3" />{cat?.label || svc.category}
          </span>
        </div>
        <button
          onClick={() => onToggleFavorite(svc._id)}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-400'}`}>
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-serif text-lg font-bold text-slate-900 leading-tight line-clamp-1">
            {svc.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <MapPin className="w-3.5 h-3.5 text-primary-500" />
          {[svc.city, svc.state].filter(Boolean).join(', ') || '—'}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <BadgeCheck className="w-4 h-4 text-green-600" /> Verified Vendor
          </span>
          {svc.vendor?.companyName && (
            <span className="text-xs text-gray-400">· {svc.vendor.companyName}</span>
          )}
        </div>
        {svc.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{svc.description}</p>
        )}
        {svc.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {svc.tags.slice(0, 5).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium">{tag}</span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            {svc.startingPrice ? (
              <>
                <span className="text-2xl font-black text-gray-900">₹{svc.startingPrice.toLocaleString()}</span>
                <span className="text-sm text-gray-400 ml-1">onwards</span>
              </>
            ) : (
              <span className="text-sm text-gray-400">Price on request</span>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5">Direct booking available</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => router.push(`/other-services/${svc._id}`)}
              className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 hover:text-primary-500 transition-all">
              <User className="w-4 h-4" />View Profile
            </button>
            <button
              onClick={() => router.push(`/other-services/${svc._id}`)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all shadow-lg">
              Book Now
            </button>
            <button
              onClick={() => router.push(`/other-services/${svc._id}`)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 transition-all shadow-lg">
              <FileText className="w-4 h-4" />Get Quotation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filter Panel ──────────────────────────────────────────────────────────
function FilterPanel({ search, setSearch, citySearch, setCitySearch, budgetRange, setBudgetRange, formatBudget, onReset, selectedCategory, setSelectedCategory }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="e.g. Bhopal, Mumbai..." value={citySearch} onChange={e => setCitySearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          {citySearch && <button onClick={() => setCitySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Budget</label>
        <p className="text-xs text-gray-500 mb-2">{formatBudget(budgetRange[0])} – {formatBudget(budgetRange[1])}</p>
        <input type="range" min={0} max={1000000} step={10000} value={budgetRange[1]}
          onChange={e => setBudgetRange([0, parseInt(e.target.value)])}
          className="w-full accent-primary-500" />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>₹0</span><span>₹10L+</span></div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Service Category</label>
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
      <button onClick={onReset} className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:border-red-300 hover:text-red-500 transition-all">
        <X className="w-4 h-4" />Reset Filters
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function OtherServicesPage() {
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [budgetRange, setBudgetRange] = useState([BUDGET_MIN, BUDGET_MAX]);
  const [favorites, setFavorites] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  // Debounced fetch
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, page });
      if (selectedCategory) params.set('category', selectedCategory);
      if (search) params.set('search', search);
      if (citySearch) params.set('city', citySearch);
      if (budgetRange[1] < BUDGET_MAX) params.set('maxPrice', budgetRange[1]);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor-services?${params}`);
      const data = await res.json();
      if (data.success) { setServices(data.services); setTotal(data.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedCategory, search, citySearch, budgetRange, page]);

  useEffect(() => {
    const t = setTimeout(fetchServices, 300);
    return () => clearTimeout(t);
  }, [fetchServices]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [selectedCategory, search, citySearch, budgetRange]);

  const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const hasActiveFilters = selectedCategory || search || citySearch || budgetRange[1] < BUDGET_MAX;
  const handleReset = () => { setSelectedCategory(''); setSearch(''); setCitySearch(''); setBudgetRange([BUDGET_MIN, BUDGET_MAX]); };

  const formatBudget = (val) => {
    if (val >= 1000000) return '₹10L+';
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <div className="min-h-screen pt-28 lg:pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-6">
            <span className="inline-block border border-gray-300 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">Premium Services</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>Browse All Services</h1>
            <p className="text-gray-500 max-w-2xl">From catering to celebrity appearances — find verified vendors for every aspect of your event.</p>
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
                <FilterPanel search={search} setSearch={setSearch} citySearch={citySearch} setCitySearch={setCitySearch}
                  budgetRange={budgetRange} setBudgetRange={setBudgetRange} formatBudget={formatBudget}
                  onReset={handleReset} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
              </div>
            </aside>

            {/* List */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-bold text-gray-900">{services.length}</span> of {total} vendors
                </p>
                <button onClick={() => setFilterOpen(!filterOpen)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 transition-all">
                  <Filter className="w-4 h-4" />Filters {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full inline-block" />}
                </button>
              </div>

              {/* Mobile filter */}
              {filterOpen && (
                <div className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                  <FilterPanel search={search} setSearch={setSearch} citySearch={citySearch} setCitySearch={setCitySearch}
                    budgetRange={budgetRange} setBudgetRange={setBudgetRange} formatBudget={formatBudget}
                    onReset={handleReset} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
                </div>
              )}

              {loading ? (
                <div className="flex flex-col gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-2xl h-52 animate-pulse" />
                  ))}
                </div>
              ) : services.length === 0 ? (
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
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    {services.map(svc => (
                      <VendorCard key={svc._id} svc={svc} isFavorite={favorites.includes(svc._id)} onToggleFavorite={toggleFavorite} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {[...Array(totalPages)].map((_, i) => {
                        const p = i + 1;
                        if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) return (
                          <button key={p} onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${page === p ? 'bg-primary-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                            {p}
                          </button>
                        );
                        if (p === page - 2 || p === page + 2) return <span key={p} className="text-gray-400">…</span>;
                        return null;
                      })}
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
