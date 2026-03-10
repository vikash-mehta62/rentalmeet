'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  BookOpen, Search, Filter, Eye, X, Calendar, Clock, MapPin,
  User, Building2, IndianRupee, CheckCircle, XCircle, AlertCircle,
  Phone, Mail, CreditCard, Download, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceDownload from '@/components/booking/InvoiceDownload';

export default function AdminBookings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  
  // Venue filter states
  const [venues, setVenues] = useState([]);
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false);
  const [venueLoading, setVenueLoading] = useState(false);
  const [venueHasMore, setVenueHasMore] = useState(true);
  const [venuePage, setVenuePage] = useState(1);
  const venueDropdownRef = useRef(null);
  const venueListRef = useRef(null);
  
  // Stats venue filter states
  const [statsVenues, setStatsVenues] = useState([]);
  const [statsVenueSearchQuery, setStatsVenueSearchQuery] = useState('');
  const [selectedStatsVenue, setSelectedStatsVenue] = useState(null);
  const [statsVenueDropdownOpen, setStatsVenueDropdownOpen] = useState(false);
  const [statsVenueLoading, setStatsVenueLoading] = useState(false);
  const [statsVenueHasMore, setStatsVenueHasMore] = useState(true);
  const [statsVenuePage, setStatsVenuePage] = useState(1);
  const statsVenueDropdownRef = useRef(null);
  const statsVenueListRef = useRef(null);
  
  // Venue type filter states
  const [venueTypes, setVenueTypes] = useState([]);
  const [selectedVenueType, setSelectedVenueType] = useState('all');
  const [venueTypeDropdownOpen, setVenueTypeDropdownOpen] = useState(false);
  const venueTypeDropdownRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchBookings();
      fetchVenues(1, ''); // Load initial venues for booking filter
      fetchStatsVenues(1, ''); // Load initial venues for stats filter
      fetchVenueTypes(); // Load venue types
    }
  }, [token]);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, itemsPerPage, statusFilter, selectedVenue, searchQuery, selectedStatsVenue, selectedVenueType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (venueDropdownRef.current && !venueDropdownRef.current.contains(event.target)) {
        setVenueDropdownOpen(false);
      }
      if (statsVenueDropdownRef.current && !statsVenueDropdownRef.current.contains(event.target)) {
        setStatsVenueDropdownOpen(false);
      }
      if (venueTypeDropdownRef.current && !venueTypeDropdownRef.current.contains(event.target)) {
        setVenueTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch bookings from backend with filters
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        ...(selectedVenue && { venue: selectedVenue._id }),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedStatsVenue && { statsVenue: selectedStatsVenue._id }),
        ...(selectedVenueType && selectedVenueType !== 'all' && { venueType: selectedVenueType })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bookings?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats);
        setTotalPages(data.totalPages);
        setTotalBookings(data.totalBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch venue types
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

  // Fetch venues for booking filter
  const fetchVenues = async (page = 1, search = '') => {
    if (venueLoading) return;
    
    setVenueLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/venues?page=${page}&limit=30&search=${search}&status=approved`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) {
          setVenues(data.venues);
        } else {
          setVenues(prev => [...prev, ...data.venues]);
        }
        setVenueHasMore(data.venues.length === 30);
        setVenuePage(page);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setVenueLoading(false);
    }
  };

  // Fetch venues for stats filter
  const fetchStatsVenues = async (page = 1, search = '') => {
    if (statsVenueLoading) return;
    
    setStatsVenueLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/venues?page=${page}&limit=30&search=${search}&status=approved`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) {
          setStatsVenues(data.venues);
        } else {
          setStatsVenues(prev => [...prev, ...data.venues]);
        }
        setStatsVenueHasMore(data.venues.length === 30);
        setStatsVenuePage(page);
      }
    } catch (error) {
      console.error('Error fetching stats venues:', error);
    } finally {
      setStatsVenueLoading(false);
    }
  };

  // Handle venue search for booking filter
  const handleVenueSearch = (query) => {
    setVenueSearchQuery(query);
    setVenuePage(1);
    setVenueHasMore(true);
    fetchVenues(1, query);
  };

  // Handle venue search for stats filter
  const handleStatsVenueSearch = (query) => {
    setStatsVenueSearchQuery(query);
    setStatsVenuePage(1);
    setStatsVenueHasMore(true);
    fetchStatsVenues(1, query);
  };

  // Handle scroll in venue dropdown
  const handleVenueScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && venueHasMore && !venueLoading) {
      fetchVenues(venuePage + 1, venueSearchQuery);
    }
  };

  // Handle scroll in stats venue dropdown
  const handleStatsVenueScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && statsVenueHasMore && !statsVenueLoading) {
      fetchStatsVenues(statsVenuePage + 1, statsVenueSearchQuery);
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const openModal = (booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setModalOpen(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      rejected: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: { bg: 'bg-green-100', text: 'text-green-700' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      failed: { bg: 'bg-red-100', text: 'text-red-700' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-700' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Bookings Management" subtitle="Loading bookings...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Bookings Management" subtitle={`Manage all ${totalBookings} bookings`}>
      {/* Combined Filters */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Venue Type Filter */}
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Venue Type:</span>
            <div className="relative flex-1" ref={venueTypeDropdownRef}>
              <button
                onClick={() => setVenueTypeDropdownOpen(!venueTypeDropdownOpen)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white flex items-center justify-between hover:border-primary-500 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {selectedVenueType === 'all' ? (
                    <>
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">All Venue Types</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">{venueTypes.find(t => t.name === selectedVenueType)?.icon}</span>
                      <span className="text-sm">{selectedVenueType}</span>
                    </>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${venueTypeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {venueTypeDropdownOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedVenueType('all');
                      setVenueTypeDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedVenueType === 'all' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5" />
                      <span className="text-sm">All Venue Types</span>
                    </div>
                  </button>
                  
                  {venueTypes.map((type) => (
                    <button
                      key={type._id}
                      onClick={() => {
                        setSelectedVenueType(type.name);
                        setVenueTypeDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100 ${
                        selectedVenueType === type.name ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{type.icon}</span>
                        <span className="text-sm">{type.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Venue Filter */}
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter Stats by Venue:</span>
            <div className="relative flex-1" ref={statsVenueDropdownRef}>
            <button
              onClick={() => setStatsVenueDropdownOpen(!statsVenueDropdownOpen)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white flex items-center justify-between hover:border-primary-500 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Building2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="text-sm truncate">
                  {selectedStatsVenue ? selectedStatsVenue.businessName : 'All Venues'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${statsVenueDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {statsVenueDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search venues..."
                      value={statsVenueSearchQuery}
                      onChange={(e) => handleStatsVenueSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div
                  ref={statsVenueListRef}
                  onScroll={handleStatsVenueScroll}
                  className="max-h-80 overflow-y-auto"
                >
                  <button
                    onClick={() => {
                      setSelectedStatsVenue(null);
                      setStatsVenueDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      !selectedStatsVenue ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">All Venues</span>
                    </div>
                  </button>

                  {statsVenues.map((venue) => (
                    <button
                      key={venue._id}
                      onClick={() => {
                        setSelectedStatsVenue(venue);
                        setStatsVenueDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        selectedStatsVenue?._id === venue._id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {venue.images?.[0]?.url ? (
                          <img
                            src={venue.images[0].url}
                            alt={venue.businessName}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${
                            selectedStatsVenue?._id === venue._id ? 'text-primary-700' : 'text-gray-900'
                          }`}>
                            {venue.businessName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {venue.location?.city}, {venue.location?.area}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {statsVenueLoading && (
                    <div className="px-4 py-3 text-center">
                      <div className="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-gray-500 mt-2">Loading more venues...</p>
                    </div>
                  )}

                  {!statsVenueLoading && !statsVenueHasMore && statsVenues.length > 0 && (
                    <div className="px-4 py-3 text-center text-xs text-gray-500">
                      No more venues
                    </div>
                  )}

                  {!statsVenueLoading && statsVenues.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No venues found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-dark-800">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-soft border border-yellow-200 p-4">
          <p className="text-xs text-yellow-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-soft border border-blue-200 p-4">
          <p className="text-xs text-blue-600 mb-1">Confirmed</p>
          <p className="text-2xl font-bold text-blue-700">{stats.confirmed}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-soft border border-green-200 p-4">
          <p className="text-xs text-green-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow-soft border border-red-200 p-4">
          <p className="text-xs text-red-600 mb-1">Cancelled</p>
          <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by venue, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Venue Filter Dropdown */}
          <div className="relative" ref={venueDropdownRef}>
            <button
              onClick={() => setVenueDropdownOpen(!venueDropdownOpen)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white flex items-center justify-between hover:border-primary-500 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Building2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="text-sm truncate">
                  {selectedVenue ? selectedVenue.businessName : 'All Venues'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${venueDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {venueDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full md:w-96 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden">
                {/* Search in dropdown */}
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search venues..."
                      value={venueSearchQuery}
                      onChange={(e) => handleVenueSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Venue list with infinite scroll */}
                <div
                  ref={venueListRef}
                  onScroll={handleVenueScroll}
                  className="max-h-80 overflow-y-auto"
                >
                  {/* All Venues option */}
                  <button
                    onClick={() => {
                      setSelectedVenue(null);
                      setVenueDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      !selectedVenue ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">All Venues</span>
                    </div>
                  </button>

                  {/* Venue options */}
                  {venues.map((venue) => (
                    <button
                      key={venue._id}
                      onClick={() => {
                        setSelectedVenue(venue);
                        setVenueDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        selectedVenue?._id === venue._id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {venue.images?.[0]?.url ? (
                          <img
                            src={venue.images[0].url}
                            alt={venue.businessName}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${
                            selectedVenue?._id === venue._id ? 'text-primary-700' : 'text-gray-900'
                          }`}>
                            {venue.businessName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {venue.location?.city}, {venue.location?.area}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Loading indicator */}
                  {venueLoading && (
                    <div className="px-4 py-3 text-center">
                      <div className="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-gray-500 mt-2">Loading more venues...</p>
                    </div>
                  )}

                  {/* No more venues */}
                  {!venueLoading && !venueHasMore && venues.length > 0 && (
                    <div className="px-4 py-3 text-center text-xs text-gray-500">
                      No more venues
                    </div>
                  )}

                  {/* No venues found */}
                  {!venueLoading && venues.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No venues found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-semibold text-dark-800">
                        {booking.bookingNumber || `#${booking._id.slice(-8).toUpperCase()}`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {booking.venue?.images?.[0]?.url ? (
                          <img
                            src={booking.venue.images[0].url}
                            alt={booking.venue.businessName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-dark-800">{booking.venue?.businessName}</p>
                          <p className="text-xs text-gray-500">{booking.venue?.location?.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-dark-800">{booking.customer?.name}</p>
                      <p className="text-xs text-gray-500">{booking.customer?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-primary-600">₹{booking.amount?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4">
                      {getPaymentStatusBadge(booking.paymentStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(booking)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalBookings > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-sm"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-sm text-gray-600">
                entries (Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalBookings)} of {totalBookings})
              </span>
            </div>

            {/* Page numbers */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            currentPage === page
                              ? 'bg-primary-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {modalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-dark-800">Booking Details</h2>
                <p className="text-sm text-gray-600">
                  {selectedBooking.bookingNumber || `ID: #${selectedBooking._id.slice(-8).toUpperCase()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <InvoiceDownload booking={selectedBooking} userRole="admin" />
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Booking Status</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                </div>
              </div>

              {/* Venue Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Venue Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Venue Name</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.venue?.businessName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.venue?.location?.city}, {selectedBooking.venue?.location?.area}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Owner</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.venue?.owner?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Owner Contact</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.venue?.owner?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-green-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.customer?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.customerDetails?.phone || selectedBooking.customer?.phone}</p>
                  </div>
                  {selectedBooking.customerDetails?.eventType && (
                    <div>
                      <p className="text-gray-600">Event Type</p>
                      <p className="font-semibold text-gray-900">{selectedBooking.customerDetails.eventType}</p>
                    </div>
                  )}
                  {selectedBooking.customerDetails?.guestCount && (
                    <div>
                      <p className="text-gray-600">Guest Count</p>
                      <p className="font-semibold text-gray-900">{selectedBooking.customerDetails.guestCount} Guests</p>
                    </div>
                  )}
                </div>
                {selectedBooking.customerDetails?.specialRequirements && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-gray-600 text-xs mb-1">Special Requirements:</p>
                    <p className="text-sm text-gray-900">{selectedBooking.customerDetails.specialRequirements}</p>
                  </div>
                )}
              </div>

              {/* Booking Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Booking Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Booking Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time Slot</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.startTime} - {selectedBooking.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Booking Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedBooking.bookingType}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Created On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedBooking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-primary-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-primary-900 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Financial Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-primary-200">
                    <span className="text-gray-700">Base Amount</span>
                    <span className="font-semibold text-gray-900">
                      ₹{(selectedBooking.amount - (selectedBooking.amenitiesTotal || 0)).toLocaleString()}
                    </span>
                  </div>
                  {selectedBooking.amenitiesTotal > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-primary-200">
                      <span className="text-gray-700">Amenities</span>
                      <span className="font-semibold text-gray-900">
                        ₹{selectedBooking.amenitiesTotal?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-2 border-b border-primary-200">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-primary-600">
                      ₹{selectedBooking.amount?.toLocaleString()}
                    </span>
                  </div>
                  
                </div>
              </div>

              {/* Payment Details */}
              {selectedBooking.paymentDetails && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Payment ID</p>
                      <p className="font-mono text-xs font-semibold text-gray-900">
                        {selectedBooking.paymentDetails.paymentId}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Order ID</p>
                      <p className="font-mono text-xs font-semibold text-gray-900">
                        {selectedBooking.paymentDetails.orderId}
                      </p>
                    </div>
                    {selectedBooking.paymentDetails.paidAt && (
                      <div>
                        <p className="text-gray-600">Paid At</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedBooking.paymentDetails.paidAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Amenities */}
              {selectedBooking.selectedAmenities && (
                (selectedBooking.selectedAmenities.basic?.length > 0 ||
                 selectedBooking.selectedAmenities.beverages?.length > 0 ||
                 selectedBooking.selectedAmenities.refreshmentFood?.length > 0 ||
                 selectedBooking.selectedAmenities.lunchThalis?.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Selected Amenities & Services</h3>
                  <div className="space-y-3">
                    {/* Basic Amenities */}
                    {selectedBooking.selectedAmenities.basic?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Basic Amenities:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedBooking.selectedAmenities.basic.map((amenity, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <p className="font-semibold text-gray-900 text-sm">{amenity.name}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-600">
                                  {amenity.type} {amenity.rateType === 'Per Use' && `(x${amenity.quantity})`}
                                </span>
                                <span className="text-sm font-semibold text-primary-600">
                                  ₹{amenity.total?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Beverages */}
                    {selectedBooking.selectedAmenities.beverages?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Beverages:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedBooking.selectedAmenities.beverages.map((bev, idx) => (
                            <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <p className="font-semibold text-gray-900 text-sm">{bev.name}</p>
                              <p className="text-xs text-gray-600">{bev.brand}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-600">x{bev.quantity} persons</span>
                                <span className="text-sm font-semibold text-blue-600">
                                  ₹{bev.total?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Refreshments */}
                    {selectedBooking.selectedAmenities.refreshmentFood?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Refreshments & Snacks:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedBooking.selectedAmenities.refreshmentFood.map((food, idx) => (
                            <div key={idx} className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <p className="font-semibold text-gray-900 text-sm">{food.name}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-600">x{food.quantity} plates</span>
                                <span className="text-sm font-semibold text-green-600">
                                  ₹{food.total?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lunch Thalis */}
                    {selectedBooking.selectedAmenities.lunchThalis?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Lunch Thalis:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedBooking.selectedAmenities.lunchThalis.map((thali, idx) => (
                            <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                              <p className="font-semibold text-gray-900 text-sm">
                                {thali.thaliType}
                              </p>
                              <p className="text-xs text-orange-700 font-medium">{thali.category}</p>
                              <p className="text-xs text-gray-600 mt-1">{thali.itemNames}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-600">
                                  x{thali.quantity} plates • {thali.numberOfItems} items
                                </span>
                                <span className="text-sm font-semibold text-orange-600">
                                  ₹{thali.total?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amenities Total */}
                    {selectedBooking.amenitiesTotal > 0 && (
                      <div className="bg-primary-50 rounded-lg p-3 border-2 border-primary-300">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900">Amenities Total:</span>
                          <span className="font-black text-primary-600 text-lg">
                            ₹{selectedBooking.amenitiesTotal?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
