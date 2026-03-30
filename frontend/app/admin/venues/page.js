'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import VenueDetailsModal from '@/components/venue/VenueDetailsModal';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  Building2, MapPin, Users, IndianRupee, Eye, CheckCircle,
  XCircle, Ban, Search, Filter, X, Calendar, Phone, Mail, ChevronDown, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminVenues() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [venueTypeFilter, setVenueTypeFilter] = useState('all');
  const [venueTypes, setVenueTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [customSettings, setCustomSettings] = useState({
    customPlatformFee: { enabled: false, feeType: 'fixed', feeValue: 0 },
    customGST: { enabled: false, rate: 18 }
  });
  const [venueTypeDropdownOpen, setVenueTypeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchVenues();
      fetchPlatformSettings();
      fetchVenueTypes();
    }
  }, [token]);

  useEffect(() => {
    filterVenues();
  }, [venues, statusFilter, venueTypeFilter, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setVenueTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues?status=all&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setVenues(data.venues);
        setFilteredVenues(data.venues);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPlatformSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
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

  const filterVenues = () => {
    let filtered = [...venues];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    if (venueTypeFilter !== 'all') {
      filtered = filtered.filter(v => 
        v.venueType && v.venueType.includes(venueTypeFilter)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredVenues(filtered);
  };

  const handleStatusUpdate = async (venueId, action) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues/${venueId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Venue ${action}d successfully!`);
        fetchVenues();
        setModalOpen(false);
      } else {
        toast.error(data.message || `Failed to ${action} venue`);
      }
    } catch (error) {
      console.error(`Error ${action}ing venue:`, error);
      toast.error(`Failed to ${action} venue`);
    }
  };

  const openModal = (venue) => {
    setSelectedVenue(venue);
    // Initialize custom settings from venue data
    setCustomSettings({
      customPlatformFee: venue.customPlatformFee || { enabled: false, feeType: 'fixed', feeValue: 0 },
      customGST: venue.customGST || { enabled: false, rate: 18 }
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedVenue(null);
    setModalOpen(false);
    setCustomSettings({
      customPlatformFee: { enabled: false, feeType: 'fixed', feeValue: 0 },
      customGST: { enabled: false, rate: 18 }
    });
  };

  const handleUpdateSettings = async (settings) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues/${selectedVenue._id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Custom settings updated successfully!');
        fetchVenues();
        // Update selected venue with new data
        setSelectedVenue(data.venue);
        setCustomSettings(settings);
      } else {
        toast.error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const stats = {
    total: filteredVenues.length,
    approved: filteredVenues.filter(v => v.status === 'approved').length,
    pending: filteredVenues.filter(v => v.status === 'pending').length,
    rejected: filteredVenues.filter(v => v.status === 'rejected').length,
    suspended: filteredVenues.filter(v => v.status === 'suspended').length,
  };

  if (loading) {
    return (
      <AdminLayout title="Venues Management" subtitle="Loading venues...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Venues Management" subtitle={`Manage all ${venues.length} venues`}>
      <PermissionGuard permission="venues">
        {/* Venue Type Filter */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-gray-600" />
          <label className="text-sm font-semibold text-gray-700">Filter Stats by Venue Type:</label>
          
          {/* Custom Dropdown */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <button
              onClick={() => setVenueTypeDropdownOpen(!venueTypeDropdownOpen)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white flex items-center justify-between hover:border-gray-400 transition-colors"
            >
              <span className="flex items-center gap-2">
                {venueTypeFilter === 'all' ? (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>All Venues</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">{venueTypes.find(t => t.name === venueTypeFilter)?.icon}</span>
                    <span>{venueTypeFilter}</span>
                  </>
                )}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${venueTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {venueTypeDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                <button
                  onClick={() => {
                    setVenueTypeFilter('all');
                    setVenueTypeDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                    venueTypeFilter === 'all' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span>All Venues</span>
                </button>
                
                {venueTypes.map((type) => (
                  <button
                    key={type._id}
                    onClick={() => {
                      setVenueTypeFilter(type.name);
                      setVenueTypeDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors border-t border-gray-100 ${
                      venueTypeFilter === type.name ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span>{type.name}</span>
                  </button>
                ))}
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
        <div className="bg-green-50 rounded-lg shadow-soft border border-green-200 p-4">
          <p className="text-xs text-green-600 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-soft border border-yellow-200 p-4">
          <p className="text-xs text-yellow-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow-soft border border-red-200 p-4">
          <p className="text-xs text-red-600 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
        </div>
        <div className="bg-gray-50 rounded-lg shadow-soft border border-gray-200 p-4">
          <p className="text-xs text-gray-600 mb-1">Suspended</p>
          <p className="text-2xl font-bold text-gray-700">{stats.suspended}</p>
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
              placeholder="Search by venue name, owner, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
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
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={() => {
              try {
                const headers = [
                  'S.No', 'Venue Name', 'SKU', 'Owner Name', 'Owner Email', 'Owner Phone',
                  'Address', 'City', 'Area', 'Capacity', 'State', 'Venue ID',
                  'Total Bookings', 'Rating', 'Total Revenue', 'Status'
                ];
                
                const rows = filteredVenues.map((venue, index) => [
                  index + 1,
                  venue.businessName || 'N/A',
                  venue.sku || 'N/A',
                  venue.owner?.name || 'N/A',
                  venue.owner?.email || 'N/A',
                  venue.owner?.phone || 'N/A',
                  venue.location?.address || 'N/A',
                  venue.location?.city || 'N/A',
                  venue.location?.area || 'N/A',
                  venue.capacity || 'N/A',
                  venue.location?.state || 'N/A',
                  venue._id || 'N/A',
                  venue.totalBookings || 0,
                  venue.rating ? `${venue.rating}/5` : 'N/A',
                  venue.totalRevenue ? `₹${venue.totalRevenue}` : '₹0',
                  venue.status || 'N/A'
                ]);

                const csvContent = [
                  headers.join(','),
                  ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                link.setAttribute('href', url);
                link.setAttribute('download', `venues_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                toast.success('Venues exported successfully!');
              } catch (error) {
                console.error('Export error:', error);
                toast.error('Failed to export venues');
              }
            }}
            disabled={filteredVenues.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Venues Table */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Venue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Capacity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Total Bookings</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-yellow-50">Total Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVenues.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-500">
                    No venues found
                  </td>
                </tr>
              ) : (
                filteredVenues.map((venue, index) => (
                  <tr key={venue._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-gray-700">{index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {venue.images?.[0]?.url ? (
                          <img
                            src={venue.images[0].url}
                            alt={venue.businessName}
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-dark-800">{venue.businessName}</p>
                          <p className="text-xs text-gray-500">{venue.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-dark-800">{venue.owner?.name}</p>
                      <p className="text-xs text-gray-500">{venue.owner?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{venue.location?.city}</p>
                      <p className="text-xs text-gray-500">{venue.location?.area}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-700">{venue.capacity} guests</p>
                    </td>
                    <td className="px-4 py-3 bg-yellow-50">
                      <span className="text-xs text-gray-700">{venue.location?.city || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 bg-yellow-50">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                        {venue.totalBookings || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 bg-yellow-50">
                      <span className="text-xs font-semibold text-amber-600">
                        {venue.rating ? `${venue.rating}/5` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 bg-yellow-50">
                      <span className="text-xs font-semibold text-green-700">
                        ₹{(venue.totalRevenue || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        venue.status === 'approved' ? 'bg-green-100 text-green-700' :
                        venue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        venue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {venue.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openModal(venue)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Venue Details Modal */}
      {modalOpen && selectedVenue && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={closeModal}
          onStatusUpdate={handleStatusUpdate}
          showActions={true}
          platformSettings={platformSettings}
          customSettings={customSettings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
      </PermissionGuard>
    </AdminLayout>
  );
}
