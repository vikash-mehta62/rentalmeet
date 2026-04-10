'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import VenueDetailsModal from '@/components/venue/VenueDetailsModal';
import {
  Building2, Plus, Eye, Edit, Trash2, Search,
  CheckCircle2, Clock, XCircle, AlertCircle, Calendar, IndianRupee, MapPin,
  PowerOff, Power, CalendarX, X
} from 'lucide-react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import toast from 'react-hot-toast';

export default function MyVenues() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Disable/Block modal
  const [manageModal, setManageModal] = useState(null); // venue object
  const [blockDates, setBlockDates] = useState([]);
  const [blockReason, setBlockReason] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);
  const [venueBookedDates, setVenueBookedDates] = useState([]);

  useEffect(() => {
    if (token) {
      fetchVenues();
    }
  }, [token]);

  useEffect(() => {
    filterVenues();
  }, [searchTerm, statusFilter, venues]);

  const fetchVenues = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues`, {
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
    } finally {
      setLoading(false);
    }
  };

  const filterVenues = () => {
    let filtered = venues;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredVenues(filtered);
  };

  const handleDelete = async (venueId) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues/${venueId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) fetchVenues();
    } catch (error) {
      console.error('Error deleting venue:', error);
    }
  };

  const handleResubmit = async (venueId) => {
    if (!confirm('Re-submit this venue for admin review?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues/${venueId}/resubmit`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Venue re-submitted for review!');
        fetchVenues();
      } else {
        alert(data.message || 'Failed to re-submit');
      }
    } catch {
      alert('Something went wrong');
    }
  };

  const openModal = (venue) => {
    setSelectedVenue(venue);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedVenue(null);
    setModalOpen(false);
  };

  const handleToggleActive = async (venue) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues/${venue._id}/toggle-active`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentIsActive: venue.isActive !== false })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchVenues();
      } else {
        toast.error(data.message);
      }
    } catch (e) {
      toast.error('Something went wrong');
    }
  };

  const handleAddBlockedDate = async () => {
    if (!blockDates.length) return toast.error('Please select at least one date');
    setBlockLoading(true);
    try {
      // Block all selected dates one by one
      let lastBlockedDates = manageModal.blockedDates || [];
      for (const date of blockDates) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues/${manageModal._id}/blocked-dates`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, reason: blockReason || 'Blocked by owner' })
        });
        const data = await res.json();
        if (data.success) lastBlockedDates = data.blockedDates;
      }
      toast.success(`${blockDates.length} date(s) blocked successfully`);
      setBlockDates([]);
      setBlockReason('');
      fetchVenues();
      setManageModal(prev => ({ ...prev, blockedDates: lastBlockedDates }));
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleRemoveBlockedDate = async (venueId, dateId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues/${venueId}/blocked-dates/${dateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Date unblocked');
        fetchVenues();
        setManageModal(prev => ({ ...prev, blockedDates: data.blockedDates }));
      }
    } catch (e) {
      toast.error('Something went wrong');
    }
  };

  const openManageModal = async (venue) => {
    setManageModal(venue);
    setBlockDates([]);
    setBlockReason('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/booked-dates/${venue.sku}`);
      const data = await res.json();
      if (data.success) setVenueBookedDates(data.dates.map(d => new Date(d)));
    } catch (e) {
      setVenueBookedDates([]);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: 'Approved' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
      suspended: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle, label: 'Suspended' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const stats = {
    total: venues.length,
    approved: venues.filter(v => v.status === 'approved').length,
    pending: venues.filter(v => v.status === 'pending').length,
    rejected: venues.filter(v => v.status === 'rejected').length,
  };

  if (loading) {
    return (
      <OwnerLayout title="My Venues" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading venues...</p>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="My Venues" subtitle={`${filteredVenues.length} venue(s) found`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'all' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-dark-800">{stats.total}</p>
          <p className="text-sm text-gray-600">All Venues</p>
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'approved' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          <p className="text-sm text-gray-600">Approved</p>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'pending' 
              ? 'border-yellow-500 bg-yellow-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'rejected' 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          <p className="text-sm text-gray-600">Rejected</p>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Add Venue Button */}
      <div className="mb-6">
        <Link
          href="/register-venue"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Venue
        </Link>
      </div>

      {/* Venues List */}
      {filteredVenues.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No venues found</h3>
          <p className="text-gray-500 mb-6">
            {statusFilter !== 'all' 
              ? `No ${statusFilter} venues at the moment` 
              : 'Start by adding your first venue'}
          </p>
          <Link href="/register-venue" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Your First Venue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <div key={venue._id} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Venue Image */}
              <div className="relative h-48 bg-gray-200">
                {venue.images?.[0]?.url ? (
                  <img
                    src={venue.images[0].url}
                    alt={venue.businessName}
                    className={`w-full h-full object-cover ${venue.isActive === false ? 'opacity-50 grayscale' : ''}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(venue.status)}
                </div>
                {venue.isActive === false && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <PowerOff className="w-3.5 h-3.5" /> INACTIVE
                    </span>
                  </div>
                )}
              </div>

              {/* Venue Details */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-dark-800 mb-2 line-clamp-1">
                  {venue.businessName}
                </h3>
                <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {venue.location?.city}, {venue.location?.area}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {venue.totalBookings || 0} bookings
                  </span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    ₹{venue.totalEarnings?.toLocaleString() || 0}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => openModal(venue)}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-semibold transition-colors text-center flex items-center justify-center gap-1 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <Link
                    href={`/owner/venues/${venue._id}/edit`}
                    className="flex-1 px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg font-semibold transition-colors text-center flex items-center justify-center gap-1 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  {/* Delete only for non-approved venues */}
                  {venue.status !== 'approved' && (
                    <button
                      onClick={() => handleDelete(venue._id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold transition-colors"
                      title="Delete venue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Rejected venue — show reason + resubmit */}
                {venue.status === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    {venue.rejectionReason && (
                      <p className="text-xs text-red-700 mb-2">
                        <strong>Reason:</strong> {venue.rejectionReason}
                      </p>
                    )}
                    <button
                      onClick={() => handleResubmit(venue._id)}
                      className="w-full px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      ↩ Re-submit for Review
                    </button>
                  </div>
                )}

                {/* Approved venue extra controls */}
                {venue.status === 'approved' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openManageModal(venue)}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center gap-1 ${
                        venue.isActive !== false
                          ? 'bg-orange-50 hover:bg-orange-100 text-orange-600'
                          : 'bg-green-50 hover:bg-green-100 text-green-600'
                      }`}
                    >
                      {venue.isActive !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      {venue.isActive !== false ? 'Temporarily Disable' : 'Enable Venue'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Venue Details Modal */}
      {modalOpen && selectedVenue && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={closeModal}
          showActions={false}
        />
      )}

      {/* Manage Venue Modal — 2 options */}
      {manageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setManageModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Temporarily Disable</h2>
                <p className="text-xs text-gray-500 mt-0.5">{manageModal.businessName}</p>
              </div>
              <button onClick={() => setManageModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-3">

              {/* Option 1 — Indefinitely disable/enable */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${manageModal.isActive !== false ? 'bg-orange-100' : 'bg-green-100'}`}>
                    {manageModal.isActive !== false ? <PowerOff className="w-5 h-5 text-orange-600" /> : <Power className="w-5 h-5 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {manageModal.isActive !== false ? 'Disable Until I Re-enable' : 'Re-enable Venue'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {manageModal.isActive !== false
                        ? 'Venue will be hidden from public listing until you manually enable it again.'
                        : 'Venue will become visible in public listing again.'}
                    </p>
                    <button
                      onClick={() => { handleToggleActive(manageModal); setManageModal(null); }}
                      className={`mt-3 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                        manageModal.isActive !== false
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {manageModal.isActive !== false ? 'Disable Now' : 'Enable Now'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Option 2 — Block specific dates */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CalendarX className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Block Specific Dates</p>
                    <p className="text-xs text-gray-500 mt-0.5">Selected dates will be disabled for booking. Already booked dates are also shown.</p>
                  </div>
                </div>

                <DatePicker
                  selected={null}
                  onChange={(date) => {
                    if (!date) return;
                    setBlockDates(prev => {
                      const exists = prev.some(d => d.toDateString() === date.toDateString());
                      return exists ? prev.filter(d => d.toDateString() !== date.toDateString()) : [...prev, date];
                    });
                  }}
                  highlightDates={blockDates}
                  minDate={new Date()}
                  filterDate={(date) => {
                    const isBooked = venueBookedDates.some(bd =>
                      bd.getFullYear() === date.getFullYear() &&
                      bd.getMonth() === date.getMonth() &&
                      bd.getDate() === date.getDate()
                    );
                    return !isBooked;
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Click dates to select (multiple allowed)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-2"
                  inline={false}
                />
                {blockDates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {blockDates.map((d, i) => (
                      <span key={i} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                        {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        <button onClick={() => setBlockDates(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-blue-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="Reason (optional) e.g. External booking"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-2"
                />
                <button
                  onClick={handleAddBlockedDate}
                  disabled={blockLoading || !blockDates.length}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  {blockLoading ? 'Blocking...' : `Block ${blockDates.length > 0 ? blockDates.length + ' Date(s)' : 'Selected Dates'}`}
                </button>

                {/* Existing blocked dates */}
                {manageModal.blockedDates?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-600 dark:text-slate-400 mb-2">Blocked Dates</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {manageModal.blockedDates.map((b) => (
                        <div key={b._id} className="flex items-center justify-between bg-red-50 dark:bg-slate-800 border border-red-100 dark:border-slate-700 rounded-lg px-3 py-1.5">
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-gray-500">{b.reason}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveBlockedDate(manageModal._id, b._id)}
                            className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}

