'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, MapPin, Users, Star
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CityAutocomplete from '@/components/CityAutocomplete';
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
  const [venueTypes, setVenueTypes] = useState([]);
  const [filterSettings, setFilterSettings] = useState({
    capacityMin: 10,
    capacityMax: 1000,
    priceMin: 1000,
    priceMax: 1000000
  });
  const [priceFilter, setPriceFilter] = useState(null);

  const capacityRanges = [
    { label: '10-50', min: 10, max: 50 },
    { label: '50-100', min: 50, max: 100 },
    { label: '100-200', min: 100, max: 200 },
    { label: '200-500', min: 200, max: 500 },
    { label: '500-1000', min: 500, max: 1000 },
    { label: '1000+', min: 1000, max: 100000 }
  ];

  useEffect(() => {
    fetchVenues();
    fetchVenueTypes();
    fetchPublicContactSettings();
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

  const fetchVenueTypes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venue-types`);
      const data = await response.json();
      if (data.success) {
        setVenueTypes(data.venueTypes);
      }
    } catch (error) {
      console.error('Error fetching venue types:', error);
    }
  };

  const fetchPublicContactSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact-settings`);
      const data = await response.json();
      if (data.success && data.data?.filterSettings) {
        setFilterSettings(data.data.filterSettings);
      }
    } catch (e) {
      // ignore and keep defaults
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
    if (priceFilter !== null) {
      filtered = filtered.filter(venue => {
        const weekday = venue.pricing?.perHour?.weekday || 0;
        const weekend = venue.pricing?.perHour?.weekend || weekday;
        const base = Math.min(weekday || Infinity, weekend || Infinity);
        return base <= priceFilter;
      });
    }

    setFilteredVenues(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setTypeFilter('');
    setCapacityFilter('');
    setPriceFilter(null);
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading venues...</p>
        </div>
      </div>
    );
  }

   return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950">
      <Navbar />

      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-24 pb-6">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: 'Georgia, serif' }}>Browse Venues</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2" style={{ fontFamily: 'Georgia, serif' }}>Find the perfect venue for your next meeting, conference, or corporate event.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden fixed bottom-6 right-6 z-[120]">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="bg-primary-500 text-white px-5 py-3 rounded-lg shadow-lg hover:bg-primary-600 transition-all flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="font-semibold text-sm">Filters</span>
            </button>
          </div>

          {/* Mobile Backdrop */}
          {mobileFiltersOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-[115]"
              onClick={() => setMobileFiltersOpen(false)}
            />
          )}

          {/* LEFT SIDEBAR - Filters */}
          <aside className={`
            lg:w-64 flex-shrink-0
            ${mobileFiltersOpen ? 'fixed inset-0 z-[115] lg:relative lg:z-auto' : 'hidden lg:block'}
          `}>
            <div className={`
              bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-6
              ${mobileFiltersOpen 
                ? 'fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] overflow-y-auto z-[120] rounded-none shadow-2xl' 
                : 'sticky top-24'
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

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filters
                </h3>
                <button 
                  onClick={resetFilters} 
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary-500 transition-colors font-medium"
                >
                  Reset Filters
                </button>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search venues..."
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Search by City</label>
                <CityAutocomplete
                  value={cityFilter}
                  onChange={setCityFilter}
                  placeholder="Search city..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              {/* Venue Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Venue Type</label>
                <div className="space-y-2">
                  {venueTypes.map(type => (
                    <label key={type._id} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={typeFilter === type.name}
                        onChange={() => setTypeFilter(typeFilter === type.name ? '' : type.name)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500" 
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{type.icon} {type.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Capacity: {filterSettings.capacityMin} - {filterSettings.capacityMax} persons</label>
                <input
                  type="range"
                  min={filterSettings.capacityMin}
                  max={filterSettings.capacityMax}
                  step="10"
                  className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    const range = capacityRanges.find(r => value >= r.min && value <= r.max);
                    setCapacityFilter(range ? range.label : '');
                  }}
                />
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Price: ₹{filterSettings.priceMin.toLocaleString('en-IN')} - ₹{filterSettings.priceMax.toLocaleString('en-IN')}</label>
                <input
                  type="range"
                  min={filterSettings.priceMin}
                  max={filterSettings.priceMax}
                  step={Math.max(1000, Math.round((filterSettings.priceMax - filterSettings.priceMin) / 50))}
                  className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  onChange={(e) => setPriceFilter(parseInt(e.target.value))}
                />
              </div>

              {/* Reset Filters Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset All Filters
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT - Venue Cards */}
          <main className="flex-1 space-y-4">
            {filteredVenues.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500 text-lg">No venues found matching your filters.</p>
                <button 
                  onClick={resetFilters} 
                  className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredVenues.map((venue) => {
                const currentPrice = parseInt(venue.pricing?.perHour?.weekday) || 0;
                const originalPrice = venue.pricing?.originalPrice || currentPrice * 1.3;
                const discount = calculateDiscount(originalPrice, currentPrice);
                const taxAmount = Math.round(currentPrice * 0.18);

                return (
                  <div key={venue._id} className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col sm:flex-row hover:shadow-lg transition-all duration-300">
                    {/* Image Section with Gallery */}
                    <div className="w-full sm:w-80 flex-shrink-0">
                      <div className="flex gap-1 h-52 sm:h-56">
                        {/* Main Image */}
                        <div className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={venue.images?.[0]?.url || '/her-img2.jpg'}
                            alt={venue.businessName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {venue.isVerified && (
                            <div className="absolute top-3 left-3 px-2 py-1 bg-white/95 dark:bg-slate-900/90 text-[10px] font-semibold text-slate-700 dark:text-slate-200 rounded shadow-sm">
                              Company-Serviced
                            </div>
                          )}
                        </div>
                        
                        {/* Side Images Grid (if multiple images exist) */}
                        {venue.images?.length > 1 && (
                          <div className="w-20 flex flex-col gap-1">
                            {venue.images.slice(1, 3).map((img, idx) => (
                              <div key={idx} className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-800 rounded">
                                <img
                                  src={img.url}
                                  alt={`${venue.businessName} ${idx + 2}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {venue.images.length > 3 && (
                              <div className="flex-1 relative overflow-hidden bg-slate-900/80 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">+{venue.images.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 p-5 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1" style={{ fontFamily: 'Georgia, serif' }}>{venue.businessName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-300 flex items-center gap-1 mb-3">
                          <MapPin className="w-3.5 h-3.5 text-primary-500" /> 
                          {venue.location?.area}, {venue.location?.city}
                        </p>

                        {/* Rating */}
                        {venue.rating > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                              {venue.rating} <Star className="w-3 h-3 fill-current" />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">({venue.reviewCount || 0} Ratings) • Very Good</span>
                          </div>
                        )}

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {venue.capacity}
                          </span>
                          {venue.amenities?.basic?.filter(a => a.available).slice(0, 2).map((amenity, idx) => (
                            <span key={idx} className="flex items-center gap-1">
                              {amenity.name}
                            </span>
                          ))}
                          {venue.amenities?.basic?.filter(a => a.available).length > 2 && (
                            <span className="text-primary-500 font-medium">
                              + {venue.amenities.basic.filter(a => a.available).length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pricing Bottom */}
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{currentPrice}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link 
                            href={`/venues/${venue.sku}`} 
                            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            View Details
                          </Link>
                          <Link
                            href={`/venues/${venue.sku}`}
                            className="px-5 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition-colors"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Showing Count at Bottom */}
            {filteredVenues.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredVenues.length}</span> of <span className="font-semibold text-slate-900 dark:text-slate-100">{venues.length}</span> venues
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

