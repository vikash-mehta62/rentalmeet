'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Search, Filter, MapPin, Users, IndianRupee,
  Star, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

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

  const venueTypes = [
    'Meeting Hall', 'Conference Hall', 'Banquet Hall', 'Function Hall',
    'Training Center', 'Co-Work Space', 'Hotel', 'Restaurant'
  ];

  const capacityOptions = [
    '10-20', '20-50', '50-100', '100-200', '200-500', '500+'
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
      filtered = filtered.filter(venue =>
        venue.capacity === capacityFilter
      );
    }

    setFilteredVenues(filtered);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getCities = () => {
    const cities = [...new Set(venues.map(v => v.location?.city).filter(Boolean))];
    return cities;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-dark-800 mb-4">
              Browse <span className="gradient-text">Premium Venues</span>
            </h1>
            <p className="text-xl text-gray-600">
              Find the perfect space for your meetings, events, and conferences
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search by venue name, city, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-dark-800">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Cities</option>
                {getCities().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Venue Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
                {venueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Capacity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Any Capacity</option>
                {capacityOptions.map(cap => (
                  <option key={cap} value={cap}>{cap} people</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || cityFilter || typeFilter || capacityFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCityFilter('');
                setTypeFilter('');
                setCapacityFilter('');
              }}
              className="mt-4 text-primary-500 hover:text-primary-600 font-medium text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            <span className="font-semibold text-dark-800">{filteredVenues.length}</span> venue(s) found
          </p>
        </div>

        {/* Venues Grid */}
        {filteredVenues.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No venues found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || cityFilter || typeFilter || capacityFilter
                ? 'Try adjusting your filters'
                : 'No approved venues available yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue, index) => (
              <div
                key={venue._id}
                className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Venue Image */}
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative">
                  {venue.images?.[0]?.url ? (
                    <img
                      src={venue.images[0].url}
                      alt={venue.businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-16 h-16 text-primary-500" />
                  )}
                  
                  {/* Status Badge */}
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full shadow-md text-xs font-semibold ${
                    venue.status === 'approved' ? 'bg-green-500 text-white' :
                    venue.status === 'pending' ? 'bg-yellow-500 text-white' :
                    venue.status === 'rejected' ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {venue.status?.toUpperCase()}
                  </div>
                  
                  {/* Rating Badge */}
                  {venue.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold">{venue.rating}</span>
                    </div>
                  )}
                </div>

                {/* Venue Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-dark-800 mb-2 line-clamp-1">
                    {venue.businessName}
                  </h3>
                  
                  <p className="text-gray-600 text-sm flex items-center gap-1 mb-3">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    {venue.location?.city}, {venue.location?.area}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-primary-500" />
                      {venue.capacity}
                    </span>
                    {venue.pricing?.perHour?.weekday > 0 && (
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4 text-primary-500" />
                        ₹{venue.pricing.perHour.weekday}/hr
                      </span>
                    )}
                  </div>

                  {/* Venue Types */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {venue.venueType?.slice(0, 2).map((type, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-full"
                      >
                        {type}
                      </span>
                    ))}
                    {venue.venueType?.length > 2 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        +{venue.venueType.length - 2} more
                      </span>
                    )}
                  </div>

                  {/* View Details Button */}
                  <Link
                    href={`/venues/${venue.sku}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors group"
                  >
                    View Details
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
