'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, MapPin, Users, Star
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';

export default function BrowseVenues() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const venueTypes = [
    'Meeting Hall', 'Conference Hall', 'Banquet Hall', 'Function Hall',
    'Training Center', 'Co-Work Space', 'Hotel', 'Restaurant'
  ];

  const capacityRanges = [
    { label: '10-50', min: 10, max: 50 },
    { label: '50-100', min: 50, max: 100 },
    { label: '100-200', min: 100, max: 200 },
    { label: '200-500', min: 200, max: 500 },
    { label: '500+', min: 500, max: 10000 }
  ];

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    filterVenues();
  }, [searchTerm, cityFilter, typeFilter, capacityFilter, venues]);

  const fetchVenues = async () => {
    try {
      // For testing, fetch all venues (including pending)
      // In production, backend will only return approved venues
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues?status=all`);
      const data = await response.json();
      
      if (data.success) {
        setVenues(data.venues);
        setFilteredVenues(data.venues);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVenues = () => {
    let filtered = venues;

    if (searchTerm) {
      filtered = filtered.filter(venue =>
        venue.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location?.area?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (cityFilter) {
      filtered = filtered.filter(venue =>
        venue.location?.city?.toLowerCase() === cityFilter.toLowerCase()
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(venue =>
        venue.venueType?.includes(typeFilter)
      );
    }

    if (capacityFilter) {
      const range = capacityRanges.find(r => r.label === capacityFilter);
      if (range) {
        filtered = filtered.filter(venue => {
          const cap = parseInt(venue.capacity);
          return cap >= range.min && cap <= range.max;
        });
      }
    }

    setFilteredVenues(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setTypeFilter('');
    setCapacityFilter('');
  };

  const getCities = () => {
    const cities = [...new Set(venues.map(v => v.location?.city).filter(Boolean))];
    return cities.sort();
  };

  const calculateDistance = (venue) => {
    // TODO: Implement actual distance calculation based on user location
    return 'N/A';
  };

  const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || !currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading venues...</p>
        </div>
      </div>
    );
  }

   return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      {/* Header Section - Clean & Small */}
      <div className="bg-white border-b border-slate-200 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse All Venues</h1>
          <p className="text-slate-500 text-sm font-medium">Find the perfect venue for your next meeting, conference, or corporate event.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden fixed bottom-6 right-6 z-[120]">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="bg-primary-500 text-white p-4 rounded-full shadow-2xl hover:bg-primary-600 transition-all flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              <span className="font-bold text-sm">Filters</span>
            </button>
          </div>

          {/* Mobile Backdrop */}
          {mobileFiltersOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-[115]"
              onClick={() => setMobileFiltersOpen(false)}
            />
          )}

          {/* LEFT SIDEBAR - Sticky Filters */}
          <aside className={`
            lg:w-72 flex-shrink-0
            ${mobileFiltersOpen ? 'fixed inset-0 z-[115] lg:relative lg:z-auto' : 'hidden lg:block'}
          `}
          onClick={(e) => {
            // Close when clicking on backdrop
            if (e.target === e.currentTarget) setMobileFiltersOpen(false);
          }}
          >
            <div className={`
              bg-white border border-slate-200 p-6 space-y-8 shadow-sm
              ${mobileFiltersOpen 
                ? 'fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] overflow-y-auto z-[120] rounded-none shadow-2xl' 
                : 'sticky top-24 rounded-xl'
              }
            `}>
              {/* Mobile Close Button */}
              {mobileFiltersOpen && (
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary-500" /> Filters
                </h3>
                <button onClick={resetFilters} className="text-[10px] font-bold uppercase text-slate-400 hover:text-primary-500 transition-colors">Reset</button>
              </div>

              {/* Search Within */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Venue name..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* City Filter */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">City</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="">All Cities</option>
                  {getCities().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Venue Type - Checkbox Style */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Venue Type</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {venueTypes.map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={typeFilter === type}
                        onChange={() => setTypeFilter(typeFilter === type ? '' : type)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500" 
                      />
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Capacity Filter */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Capacity</label>
                <div className="space-y-2">
                  {capacityRanges.map(range => (
                    <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="capacity"
                        checked={capacityFilter === range.label}
                        onChange={() => setCapacityFilter(capacityFilter === range.label ? '' : range.label)}
                        className="w-4 h-4 border-slate-300 text-primary-500 focus:ring-primary-500" 
                      />
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{range.label} persons</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT - Horizontal Cards */}
          <main className="flex-1 space-y-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-slate-500 font-medium">Showing <span className="text-slate-900 font-bold">{filteredVenues.length}</span> venues</p>
            </div>

            {filteredVenues.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-500 text-lg">No venues found matching your filters.</p>
                <button onClick={resetFilters} className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-bold hover:bg-primary-600 transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredVenues.map((venue) => {
                const currentPrice = parseInt(venue.pricing?.perHour?.weekday) || 0;
                const originalPrice = venue.pricing?.originalPrice || currentPrice * 1.5;
                const discount = calculateDiscount(originalPrice, currentPrice);
                const distance = calculateDistance(venue);
                const taxAmount = Math.round(currentPrice * 0.18); // 18% GST

                return (
                  <div key={venue._id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row hover:shadow-xl hover:border-primary-200 transition-all duration-300">
                    {/* Image Section */}
                    <div className="w-full md:w-72 lg:w-80 h-56 md:h-auto relative overflow-hidden bg-slate-100 flex-shrink-0">
                      <img
                        src={venue.images?.[0]?.url || '/api/placeholder/400/300'}
                        alt={venue.businessName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {venue.isVerified && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-primary-500/90 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-widest rounded">
                          Verified
                        </div>
                      )}
                      {venue.rating && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                          {venue.rating} <Star className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 p-4 md:p-6 flex flex-col">
                      <div className="mb-2">
                        <h3 className="text-lg md:text-xl font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{venue.businessName}</h3>
                        <p className="text-slate-500 text-xs flex items-center gap-1 mt-1 font-medium">
                          <MapPin className="w-3 h-3 text-primary-500 flex-shrink-0" /> 
                          <span className="line-clamp-1">{venue.location?.area}, {venue.location?.city}</span>
                          {distance !== 'N/A' && ` • ${distance} km`}
                        </p>
                      </div>

                      {/* Amenities Row */}
                      <div className="flex flex-wrap gap-2 md:gap-4 mt-3 md:mt-4 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 flex-shrink-0" /> {venue.capacity}</span>
                        {venue.amenities?.basic?.filter(a => a.available).slice(0, 2).map((amenity, idx) => (
                          <span key={idx} className="flex items-center gap-1.5 line-clamp-1">{amenity.name}</span>
                        ))}
                      </div>

                      {/* Pricing Bottom Row */}
                      <div className="mt-auto pt-4 md:pt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-0 border-t border-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl md:text-2xl font-black text-slate-900">₹{currentPrice}</span>
                            {discount > 0 && (
                              <>
                                <span className="text-xs text-slate-400 line-through font-medium">₹{Math.round(originalPrice)}</span>
                                <span className="text-[10px] font-bold text-primary-500">{discount}% OFF</span>
                              </>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                            + ₹{taxAmount} taxes • Per hour
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link href={`/venues/${venue.sku}`} className="flex-1 md:flex-none px-4 py-2.5 md:py-2 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors text-center">
                            View Details
                          </Link>
                          <button className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 bg-primary-500 text-white rounded-lg text-xs font-bold hover:bg-primary-600 shadow-md shadow-primary-100 transition-all">
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
