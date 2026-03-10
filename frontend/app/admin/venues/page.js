'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Building2, MapPin, Users, IndianRupee, Eye, CheckCircle,
  XCircle, Ban, Search, Filter, X, Calendar, Phone, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminVenues() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [customSettings, setCustomSettings] = useState({
    customPlatformFee: { enabled: false, feeType: 'fixed', feeValue: 0 },
    customGST: { enabled: false, rate: 18 }
  });

  useEffect(() => {
    if (token) {
      fetchVenues();
      fetchPlatformSettings();
    }
  }, [token]);

  useEffect(() => {
    filterVenues();
  }, [venues, statusFilter, searchQuery]);

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

  const filterVenues = () => {
    let filtered = [...venues];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
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

  const handleUpdateSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues/${selectedVenue._id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customSettings)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Custom settings updated successfully!');
        fetchVenues();
        // Update selected venue with new data
        setSelectedVenue(data.venue);
      } else {
        toast.error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const stats = {
    total: venues.length,
    approved: venues.filter(v => v.status === 'approved').length,
    pending: venues.filter(v => v.status === 'pending').length,
    rejected: venues.filter(v => v.status === 'rejected').length,
    suspended: venues.filter(v => v.status === 'suspended').length,
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
        </div>
      </div>

      {/* Venues Table */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVenues.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No venues found
                  </td>
                </tr>
              ) : (
                filteredVenues.map((venue) => (
                  <tr key={venue._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {venue.images?.[0]?.url ? (
                          <img
                            src={venue.images[0].url}
                            alt={venue.businessName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-dark-800">{venue.businessName}</p>
                          <p className="text-xs text-gray-500">{venue.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-dark-800">{venue.owner?.name}</p>
                      <p className="text-xs text-gray-500">{venue.owner?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{venue.location?.city}</p>
                      <p className="text-xs text-gray-500">{venue.location?.area}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-700">{venue.capacity} guests</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        venue.status === 'approved' ? 'bg-green-100 text-green-700' :
                        venue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        venue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {venue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(venue)}
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
      </div>

      {/* Venue Details Modal */}
      {modalOpen && selectedVenue && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-dark-800">{selectedVenue.businessName}</h2>
                <p className="text-sm text-gray-600">SKU: {selectedVenue.sku}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Images */}
              {selectedVenue.images?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Images</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedVenue.images.slice(0, 6).map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`${selectedVenue.businessName} ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-900">Owner Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedVenue.owner?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedVenue.owner?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedVenue.owner?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Venue Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Capacity</p>
                  <p className="font-semibold text-gray-900">{selectedVenue.capacity} guests</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedVenue.status === 'approved' ? 'bg-green-100 text-green-700' :
                    selectedVenue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    selectedVenue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedVenue.status}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Location</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">Address:</span> {selectedVenue.location?.address}</p>
                  <p><span className="text-gray-600">City:</span> {selectedVenue.location?.city}</p>
                  <p><span className="text-gray-600">Area:</span> {selectedVenue.location?.area}</p>
                  <p><span className="text-gray-600">Pincode:</span> {selectedVenue.location?.pincode}</p>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Per Hour</p>
                    <p className="font-bold text-primary-600">₹{selectedVenue.pricing?.perHour?.weekday}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Half Day</p>
                    <p className="font-bold text-primary-600">₹{selectedVenue.pricing?.halfDay?.weekday}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Full Day</p>
                    <p className="font-bold text-primary-600">₹{selectedVenue.pricing?.fullDay?.weekday}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedVenue.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-sm text-gray-700">{selectedVenue.description}</p>
                </div>
              )}

              {/* Custom Settings Section */}
              {(selectedVenue.status === 'approved' || selectedVenue.status === 'suspended') && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-lg font-semibold mb-4 text-orange-900">Custom Settings</h3>
                  
                  {/* Default Platform Settings Reference */}
                  {platformSettings && (
                    <div className="bg-white rounded-lg p-3 mb-4 border border-orange-100">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Default Platform Settings:</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-600">GST: </span>
                          <span className="font-semibold">{platformSettings.gstRate || 18}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Platform Fee: </span>
                          <span className="font-semibold">
                            {platformSettings.platformFeeType === 'fixed' 
                              ? `₹${platformSettings.platformFeeValue || 0}` 
                              : `${platformSettings.platformFeeValue || 0}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Custom GST */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-700">Custom GST Rate</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customSettings.customGST.enabled}
                            onChange={(e) => setCustomSettings({
                              ...customSettings,
                              customGST: { ...customSettings.customGST, enabled: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                      {customSettings.customGST.enabled && (
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">GST Rate (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={customSettings.customGST.rate}
                            onChange={(e) => setCustomSettings({
                              ...customSettings,
                              customGST: { ...customSettings.customGST, rate: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Custom Platform Fee */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-700">Custom Platform Fee</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customSettings.customPlatformFee.enabled}
                            onChange={(e) => setCustomSettings({
                              ...customSettings,
                              customPlatformFee: { ...customSettings.customPlatformFee, enabled: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                      {customSettings.customPlatformFee.enabled && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Fee Type</label>
                            <select
                              value={customSettings.customPlatformFee.feeType}
                              onChange={(e) => setCustomSettings({
                                ...customSettings,
                                customPlatformFee: { ...customSettings.customPlatformFee, feeType: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="fixed">Fixed Amount (₹)</option>
                              <option value="percentage">Percentage (%)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Fee Value {customSettings.customPlatformFee.feeType === 'fixed' ? '(₹)' : '(%)'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step={customSettings.customPlatformFee.feeType === 'fixed' ? '1' : '0.01'}
                              value={customSettings.customPlatformFee.feeValue}
                              onChange={(e) => setCustomSettings({
                                ...customSettings,
                                customPlatformFee: { ...customSettings.customPlatformFee, feeValue: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    

                    {/* Update Settings Button */}
                    <button
                      onClick={handleUpdateSettings}
                      className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Update Custom Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedVenue.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedVenue._id, 'approve')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedVenue._id, 'reject')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </>
                )}
                {selectedVenue.status === 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedVenue._id, 'suspend')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Ban className="w-5 h-5" />
                    Suspend
                  </button>
                )}
                {selectedVenue.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedVenue._id, 'activate')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
