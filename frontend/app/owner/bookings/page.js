'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import {
  Building2, Calendar, IndianRupee, Clock, MapPin, User,
  Phone, Mail, CheckCircle2, XCircle, Eye, Search, Download, Users, ChevronDown, Ban, RefreshCw
} from 'lucide-react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import InvoiceDownload from '@/components/booking/InvoiceDownload';
import PaymentHistoryModal from '@/components/admin/PaymentHistoryModal';
import toast from 'react-hot-toast';

export default function OwnerBookings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedAmenities, setExpandedAmenities] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [historyBooking, setHistoryBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings');
  const [cancellations, setCancellations] = useState([]);
  const [loadingCancellations, setLoadingCancellations] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });
  const LIMIT = 12;

  const requestConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeConfirmModal();
      },
      onCancel: closeConfirmModal
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (token) {
      fetchBookings(1);
    }
  }, [token]);

  useEffect(() => {
    if (token && activeTab === 'bookings') { setCurrentPage(1); fetchBookings(1); }
  }, [statusFilter, searchQuery]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (token && activeTab === 'cancellations') fetchCancellations();
  }, [token, activeTab]);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, searchQuery]);

  const fetchBookings = async (page = 1) => {
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings);
        setFilteredBookings(data.bookings);
        setTotalPages(data.totalPages || 1);
        setTotalBookings(data.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) { console.error('Error fetching bookings:', error); }
    finally { setLoading(false); }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBookings(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchCancellations = async () => {
    setLoadingCancellations(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/cancellations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCancellations(data.cancellations || []);
    } catch { toast.error('Failed to load cancellations'); }
    finally { setLoadingCancellations(false); }
  };

  const handleOwnerCancel = async () => {
    if (!cancellingBooking) return;
    setCancelSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/bookings/${cancellingBooking._id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.refundProcessed ? 'Booking cancelled & full refund initiated' : 'Booking cancelled');
        setCancellingBooking(null);
        setCancelReason('');
        fetchBookings(currentPage);
        fetchCancellations();
      } else toast.error(data.message);
    } catch { toast.error('Failed to cancel'); }
    finally { setCancelSubmitting(false); }
  };

  const filterBookings = () => {
    // Server-side filtering — bookings already filtered
    setFilteredBookings(bookings);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(newStatus === 'confirmed' ? 'Booking confirmed successfully' : 'Booking marked as completed');
        fetchBookings(currentPage);
        return true;
      } else {
        toast.error(data.message || 'Failed to update status');
        return false;
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update status');
      return false;
    }
  };

  const handleConfirmClick = (bookingId, isModal = false) => {
    requestConfirm(
      'Accept Booking',
      'Are you sure you want to accept and confirm this booking?',
      async () => {
        const success = await handleUpdateStatus(bookingId, 'confirmed');
        if (success && isModal) setSelectedBooking(null);
      }
    );
  };

  const handleCompleteClick = (bookingId, isModal = false) => {
    requestConfirm(
      'Mark Booking Completed',
      'Are you sure you want to mark this booking as completed?',
      async () => {
        const success = await handleUpdateStatus(bookingId, 'completed');
        if (success && isModal) setSelectedBooking(null);
      }
    );
  };

  const handleApproveSoon = async (bookingId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/approve-soon`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchBookings(currentPage);
        const deadline = new Date(data.confirmationDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        alert(`Deadline extended! New deadline: ${deadline}`);
      } else {
        alert(data.message || 'Failed to extend deadline');
      }
    } catch (error) {
      console.error('Error extending deadline:', error);
    }
  };

  if (loading) {
    return (
      <OwnerLayout title="My Bookings" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="My Bookings" subtitle={`${totalBookings} booking(s) found`}>

      {/* Main Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {[['bookings','Bookings'],['cancellations','Cancellations']].map(([key,label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* CANCELLATIONS TAB */}
      {activeTab === 'cancellations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">All cancellations for your venues</p>
            <button onClick={fetchCancellations} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
          {loadingCancellations ? (
            <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                    <th className="px-4 py-3 text-left">Booking #</th>
                    <th className="px-4 py-3 text-left">Venue</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Booking Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Cancelled By</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Refund</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {cancellations.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No cancellations found</td></tr>
                  ) : cancellations.map(c => {
                    const refund = c.refundDetails;
                    const refundBadge = !refund ? null
                      : refund.refundStatus === 'processed' ? 'bg-green-100 text-green-700'
                      : refund.refundStatus === 'failed' ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700';
                    return (
                      <tr key={c._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.bookingNumber}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{c.venue?.businessName || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{c.customer?.name || '—'}</div>
                          <div className="text-xs text-gray-400">{c.customer?.phone || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.bookingDate ? new Date(c.bookingDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">₹{(c.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.cancelledByRole === 'system' ? 'bg-gray-100 text-gray-600'
                            : c.cancelledByRole === 'customer' ? 'bg-blue-100 text-blue-700'
                            : c.cancelledByRole === 'owner' ? 'bg-orange-100 text-orange-700'
                            : 'bg-purple-100 text-purple-700'
                          }`}>{c.cancelledByRole || 'unknown'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.cancellationType === 'auto' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                            {c.cancellationType || 'manual'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {refund ? (
                            <div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${refundBadge}`}>{refund.refundStatus}</span>
                              {refund.refundAmount > 0 && <div className="text-xs text-gray-500 mt-0.5">₹{refund.refundAmount?.toLocaleString('en-IN')}</div>}
                            </div>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-[180px] truncate">{c.cancellationReason || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && <>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'all' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-dark-800">{stats.total}</p>
          <p className="text-sm text-gray-600">All</p>
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
          onClick={() => setStatusFilter('confirmed')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'confirmed' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
          <p className="text-sm text-gray-600">Confirmed</p>
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'completed' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-blue-700">{stats.completed}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </button>
        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'cancelled' 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
          <p className="text-sm text-gray-600">Cancelled</p>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking number, venue name, customer, or city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings found</h3>
          <p className="text-gray-500">
            {statusFilter !== 'all' 
              ? `No ${statusFilter} bookings at the moment` 
              : 'Bookings will appear here once customers book your venues'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Venue Image */}
                <div className="w-full lg:w-40 h-32 rounded-lg overflow-hidden flex-shrink-0">
                  {booking.venue?.images?.[0]?.url ? (
                    <img
                       src={booking.venue.images[0].url}
                      alt={booking.venue.businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Booking Details */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-dark-800 mb-1 flex flex-wrap items-center gap-2">
                        {booking.venue?.businessName}
                        {booking.bookingNumber && (
                          <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            #{booking.bookingNumber}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {booking.venue?.location?.city}, {booking.venue?.location?.area}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status === 'confirmed' ? 'Booking is confirmed' :
                         booking.status === 'pending' ? 'Booking is pending' :
                         booking.status === 'completed' ? 'Booking is completed' :
                         'Booking is cancelled'}
                      </span>
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmClick(booking._id)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleApproveSoon(booking._id)}
                            disabled={booking.approveSoonUsed}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                              booking.approveSoonUsed
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-orange-400 hover:bg-orange-500 text-white'
                            }`}
                            title={booking.approveSoonUsed ? 'Already used once' : 'Extend confirmation deadline by 1 hour (one-time)'}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {booking.approveSoonUsed ? 'Soon Used' : 'Approve Soon'}
                          </button>
                          <button
                            onClick={() => { setCancellingBooking(booking); setCancelReason(''); }}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" /> Cancel
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCompleteClick(booking._id)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Customer
                      </p>
                      <p className="font-semibold text-dark-800">{booking.customer?.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Booking Date
                      </p>
                      <p className="font-semibold text-dark-800">
                        {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Time Slot
                      </p>
                      <p className="font-semibold text-dark-800">
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Your Earnings
                      </p>
                      <p className="font-bold text-green-700 text-lg">
                        ₹{booking.ownerEarnings?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Confirmation Deadline Warning for Pending Bookings */}
                  {booking.status === 'pending' && booking.confirmationDeadline && (
                    <div className={`rounded-lg p-3 mb-4 flex items-center gap-2 text-sm ${
                      new Date(booking.confirmationDeadline) < new Date()
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {new Date(booking.confirmationDeadline) < new Date()
                          ? 'Confirmation deadline passed — will be auto-cancelled shortly'
                          : `Confirm by: ${new Date(booking.confirmationDeadline).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                        }
                      </span>
                    </div>
                  )}

                  {/* Customer Contact & Event Details */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-600 font-semibold mb-2">Customer & Event Details</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>{booking.customer?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span>{booking.customerDetails?.phone || booking.customer?.phone}</span>
                      </div>
                      {booking.customerDetails?.eventType && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="font-semibold text-blue-600">Event Type:</span>
                          <span>{booking.customerDetails.eventType}</span>
                        </div>
                      )}
                      {booking.customerDetails?.guestCount && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>{booking.customerDetails.guestCount} Guests</span>
                        </div>
                      )}
                      {booking.customerDetails?.specialRequirements && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-xs text-blue-600 font-semibold mb-1">Special Requirements:</p>
                          <p className="text-xs text-gray-700">{booking.customerDetails.specialRequirements}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  {booking.paymentStatus && (
                    <div className={`rounded-lg p-3 mb-4 ${
                      booking.paymentStatus === 'paid' ? 'bg-green-50' : 
                      booking.paymentStatus === 'pending' ? 'bg-yellow-50' : 'bg-red-50'
                    }`}>
                      <p className={`text-xs font-semibold mb-2 ${
                        booking.paymentStatus === 'paid' ? 'text-green-600' : 
                        booking.paymentStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        Payment Details
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-semibold px-2 py-0.5 rounded ${
                            booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                            booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {booking.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                        {booking.paymentDetails?.razorpay_payment_id && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Payment ID:</span>
                              <span className="font-mono text-xs text-gray-700">{booking.paymentDetails.razorpay_payment_id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Order ID:</span>
                              <span className="font-mono text-xs text-gray-700">{booking.paymentDetails.razorpay_order_id}</span>
                            </div>
                            {booking.paymentDetails.paidAt && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Paid At:</span>
                                <span className="text-xs text-gray-700">
                                  {new Date(booking.paymentDetails.paidAt).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected Amenities - Collapsible */}
                  {booking.selectedAmenities && (
                    (booking.selectedAmenities.basic?.length > 0 || 
                     booking.selectedAmenities.beverages?.length > 0 || 
                     booking.selectedAmenities.refreshmentFood?.length > 0 || 
                     booking.selectedAmenities.lunchThalis?.length > 0) && (
                    <div className="mb-4 border border-purple-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedAmenities(prev => ({ ...prev, [booking._id]: !prev[booking._id] }))}
                        className="w-full flex items-center justify-between bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        <span>Selected Amenities & Services</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedAmenities[booking._id] ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedAmenities[booking._id] && (
                        <div className="bg-purple-50 px-3 pb-3 space-y-1.5">

                          {/* Free amenities */}
                          {booking.selectedAmenities.basic?.filter(a => a.type === 'Free' || a.type === 'Included').length > 0 && (
                            <div className="border border-green-200 rounded-lg overflow-hidden mt-2">
                              <button
                                onClick={() => setExpandedAmenities(prev => ({ ...prev, [`free_${booking._id}`]: !prev[`free_${booking._id}`] }))}
                                className="w-full flex items-center justify-between bg-green-50 px-2 py-1.5 text-[10px] font-bold text-green-700 hover:bg-green-100 transition-colors uppercase tracking-wider"
                              >
                                <span>Included Free ({booking.selectedAmenities.basic.filter(a => a.type === 'Free' || a.type === 'Included').length} items)</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedAmenities[`free_${booking._id}`] ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedAmenities[`free_${booking._id}`] && (
                                <div className="bg-green-50 px-2 pb-2 space-y-1">
                                  {booking.selectedAmenities.basic.filter(a => a.type === 'Free' || a.type === 'Included').map((amenity, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs bg-white border border-green-100 px-2 py-1.5 rounded">
                                      <span className="text-gray-700">{amenity.name}</span>
                                      <span className="text-green-600 font-semibold">Free × 0 = ₹0</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Paid basic amenities */}
                          {booking.selectedAmenities.basic?.filter(a => a.type === 'Paid').length > 0 && (
                            <>
                              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mt-2 mb-1">Paid Add-ons</p>
                              {booking.selectedAmenities.basic.filter(a => a.type === 'Paid').map((amenity, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs bg-white border border-orange-100 px-2 py-1.5 rounded">
                                  <span className="text-gray-700">
                                    {amenity.name}{amenity.rateType === 'Per Use' && amenity.quantity > 1 ? ` × ${amenity.quantity}` : ''}
                                  </span>
                                  <span className="font-semibold text-orange-600">₹{(amenity.total || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </>
                          )}

                          {/* Beverages */}
                          {booking.selectedAmenities.beverages?.length > 0 && (
                            <>
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-2 mb-1">Beverages</p>
                              {booking.selectedAmenities.beverages.map((bev, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs bg-white border border-blue-100 px-2 py-1.5 rounded">
                                  <span className="text-gray-700">{bev.name}{bev.brand ? ` - ${bev.brand}` : ''} × {bev.quantity}</span>
                                  <span className="font-semibold text-blue-600">₹{(bev.total || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </>
                          )}

                          {/* Refreshment Food */}
                          {booking.selectedAmenities.refreshmentFood?.length > 0 && (
                            <>
                              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mt-2 mb-1">Refreshments</p>
                              {booking.selectedAmenities.refreshmentFood.map((food, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs bg-white border border-rose-100 px-2 py-1.5 rounded">
                                  <span className="text-gray-700">{food.name} × {food.quantity} plates</span>
                                  <span className="font-semibold text-rose-600">₹{(food.total || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </>
                          )}

                          {/* Lunch Thalis */}
                          {booking.selectedAmenities.lunchThalis?.length > 0 && (
                            <>
                              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-2 mb-1">Lunch Thalis</p>
                              {booking.selectedAmenities.lunchThalis.map((thali, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs bg-white border border-amber-100 px-2 py-1.5 rounded">
                                  <span className="text-gray-700">{thali.thaliType} - {thali.category} × {thali.quantity} plates</span>
                                  <span className="font-semibold text-amber-600">₹{(thali.total || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </>
                          )}

                          {/* Amenities Total */}
                          {booking.amenitiesTotal > 0 && (
                            <div className="flex justify-between items-center text-xs font-bold bg-purple-100 px-2 py-2 rounded border-t border-purple-300 mt-2">
                              <span className="text-purple-700">Amenities Total:</span>
                              <span className="text-purple-700">₹{booking.amenitiesTotal?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Booking Type & Amount */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                      {booking.bookingType}
                    </span>
                    <span>Total Amount: ₹{booking.amount?.toLocaleString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => setHistoryBooking(booking)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                    >
                      💳 Payment History
                    </button>
                    <Link
                      href={`/venues/${booking.venue?.sku}`}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                    >
                      <Building2 className="w-4 h-4" />
                      View Venue
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-100 shadow-soft px-6 py-4">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, totalBookings)} of {totalBookings} bookings
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              Previous
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button key={page} onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === page ? 'bg-primary-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Booking Detail Modal — clean design matching customer view */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedBooking.venue?.businessName}</h2>
                <p className="text-xs text-gray-500 mt-0.5">#{selectedBooking.bookingNumber || selectedBooking._id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedBooking.status === 'confirmed' ? 'Booking is confirmed' :
                   selectedBooking.status === 'pending' ? 'Booking is pending' :
                   selectedBooking.status === 'completed' ? 'Booking is completed' :
                   'Booking is cancelled'}
                </span>
                <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Key Info — Location / Date & Time / Booked On / Amount */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/>Location</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedBooking.venue?.location?.city}</p>
                </div>
                <div className="bg-yellow-50/50 dark:bg-slate-800 rounded-xl p-3 col-span-2 border border-yellow-100 dark:border-slate-700">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/>Booking Date & Time</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5 font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/>{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">📅 Booked On</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{new Date(selectedBooking.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="bg-green-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3"/>Amount</p>
                  <p className="text-sm font-bold text-green-600">₹{selectedBooking.amount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-3">Customer Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0"/>{selectedBooking.customer?.email}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0"/>{selectedBooking.customerDetails?.phone || selectedBooking.customer?.phone}
                  </p>
                  {selectedBooking.customerDetails?.eventType && (
                    <p className="text-gray-700 dark:text-slate-300"><span className="font-semibold">Event:</span> {selectedBooking.customerDetails.eventType}</p>
                  )}
                  {selectedBooking.customerDetails?.guestCount && (
                    <p className="text-gray-700 dark:text-slate-300"><span className="font-semibold">Guests:</span> {selectedBooking.customerDetails.guestCount}</p>
                  )}
                  {selectedBooking.customerDetails?.specialRequirements && (
                    <p className="col-span-2 text-gray-700 dark:text-slate-300"><span className="font-semibold">Special Requirements:</span> {selectedBooking.customerDetails.specialRequirements}</p>
                  )}
                </div>
              </div>

              {/* Cancellation & Refund Details */}
              {selectedBooking.status === 'cancelled' && (
                <div className="bg-red-50 dark:bg-slate-800 rounded-xl p-4 border border-red-200 dark:border-red-900 text-xs">
                  <p className="font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-1.5 font-sans">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" /> Cancellation & Refund Details
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-slate-400 text-xs">Cancelled By</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-100 capitalize">
                        {selectedBooking.cancelledByRole || 'system'} 
                        {selectedBooking.cancellationType ? ` (${selectedBooking.cancellationType})` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-slate-400 text-xs">Cancellation Reason</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">
                        {selectedBooking.cancellationReason || 'No reason provided'}
                      </p>
                    </div>
                    {selectedBooking.paymentStatus === 'refunded' || selectedBooking.refundDetails?.refundStatus ? (
                      <>
                        <div>
                          <p className="text-gray-500 dark:text-slate-400 text-xs">Refund Status</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize mt-0.5 ${
                            selectedBooking.refundDetails?.refundStatus === 'processed' || selectedBooking.paymentStatus === 'refunded'
                              ? 'bg-purple-100 text-purple-700'
                              : selectedBooking.refundDetails?.refundStatus === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {selectedBooking.refundDetails?.refundStatus || (selectedBooking.paymentStatus === 'refunded' ? 'processed' : 'pending')}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-slate-400 text-xs">Refund Amount</p>
                          <p className="font-semibold text-gray-900 dark:text-slate-100">
                            ₹{(selectedBooking.refundDetails?.refundAmount || 0).toLocaleString()}
                          </p>
                        </div>
                        {selectedBooking.refundDetails?.refundId && (
                          <div>
                            <p className="text-gray-500 dark:text-slate-400 text-xs">Refund ID</p>
                            <code className="font-mono text-xs bg-white dark:bg-slate-700 border dark:border-slate-600 px-1 rounded">
                              {selectedBooking.refundDetails.refundId}
                            </code>
                          </div>
                        )}
                        {selectedBooking.refundDetails?.refundedAt && (
                          <div>
                            <p className="text-gray-500 dark:text-slate-400 text-xs">Refunded At</p>
                            <p className="font-semibold text-gray-900 dark:text-slate-100">
                              {new Date(selectedBooking.refundDetails.refundedAt).toLocaleString('en-IN')}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 dark:text-slate-400 italic">No refund processed (Booking was unpaid or pending at cancellation)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-3">Price Breakdown</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Base Price</span><span className="font-semibold">₹{(selectedBooking.priceBreakdown?.basePrice || 0).toLocaleString()}</span></div>
                  {selectedBooking.amenitiesTotal > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Amenities</span><span className="font-semibold">₹{selectedBooking.amenitiesTotal?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.gst > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">GST ({selectedBooking.priceBreakdown.gstRate || ''}%)</span><span className="font-semibold">₹{selectedBooking.priceBreakdown.gst?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.platformFee > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Platform Fee</span><span className="font-semibold">₹{selectedBooking.priceBreakdown.platformFee?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.platformFeeGST > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Platform Fee GST</span><span className="font-semibold">₹{selectedBooking.priceBreakdown.platformFeeGST?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount {selectedBooking.priceBreakdown.couponCode ? `(${selectedBooking.priceBreakdown.couponCode})` : ''}</span>
                      <span className="font-semibold">- ₹{selectedBooking.priceBreakdown.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 mt-1">
                    <span className="font-bold text-gray-800 dark:text-slate-100">Total</span>
                    <span className="font-black text-primary-600">₹{(selectedBooking.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Summary + Transaction History */}
              {(() => {
                const ledger = selectedBooking.paymentLedger;
                const currentDue = selectedBooking.amount || 0;
                const totalPaid = ledger?.transactions
                  ? ledger.transactions.filter(t => ['payment','manual_payment'].includes(t.type) && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0)
                  : 0;
                const totalRefunded = ledger?.transactions
                  ? ledger.transactions.filter(t => ['refund','manual_refund'].includes(t.type) && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0)
                  : 0;
                const netPaid = totalPaid - totalRefunded;
                const balance = currentDue - netPaid;
                const amountDue = balance > 0 ? balance : 0;
                const refundDue = balance < 0 ? Math.abs(balance) : 0;
                const txns = ledger?.transactions || [];

                return (
                  <div className="rounded-xl border-2 border-gray-200 dark:border-slate-700 overflow-hidden">
                    {/* Balance Bar */}
                    <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-slate-700">
                      <div className="p-3 text-center bg-white dark:bg-slate-800">
                        <p className="text-[10px] text-gray-500 mb-0.5">Total Due</p>
                        <p className="text-base font-black text-gray-900 dark:text-slate-100">₹{currentDue.toLocaleString()}</p>
                      </div>
                      <div className="p-3 text-center bg-green-50 dark:bg-slate-800">
                        <p className="text-[10px] text-gray-500 mb-0.5">Paid</p>
                        <p className="text-base font-black text-green-600">₹{netPaid.toLocaleString()}</p>
                      </div>
                      <div className={`p-3 text-center ${refundDue > 0 ? 'bg-blue-50' : amountDue > 0 ? 'bg-red-50' : 'bg-green-50'} dark:bg-slate-800`}>
                        <p className="text-[10px] text-gray-500 mb-0.5">
                          {refundDue > 0 ? 'Refund Due' : amountDue > 0 ? 'Balance Due' : 'Settled'}
                        </p>
                        <p className={`text-base font-black ${refundDue > 0 ? 'text-blue-600' : amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {refundDue > 0 ? `₹${refundDue.toLocaleString()}` : amountDue > 0 ? `₹${amountDue.toLocaleString()}` : '✓ Clear'}
                        </p>
                      </div>
                    </div>

                    {/* Transaction History */}
                    {txns.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-3">Transaction History</p>
                        <div className="space-y-2.5">
                          {txns.filter(t => t.type !== 'adjustment').map((txn, i) => {
                            const isPay = ['payment','manual_payment'].includes(txn.type);
                            const isRefund = ['refund','manual_refund'].includes(txn.type);
                            return (
                              <div key={i} className={`flex items-start gap-3 text-xs p-2.5 rounded-lg border ${isPay ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold ${isPay ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                                  {isPay ? '↑' : '↓'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-800 dark:text-slate-200">
                                    {txn.type === 'payment' ? 'Online Payment' : txn.type === 'manual_payment' ? 'Manual Payment' : txn.type === 'refund' ? 'Refund' : 'Manual Refund'}
                                  </p>
                                  <p className="text-gray-500 truncate">{txn.note || (isPay ? `Booking created — ₹${txn.amount?.toLocaleString()} due` : `Refund processed`)}</p>
                                  {txn.date && <p className="text-gray-400 mt-0.5">{new Date(txn.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                                </div>
                                <span className={`font-black text-sm flex-shrink-0 ${isPay ? 'text-green-600' : 'text-red-600'}`}>
                                  {isPay ? '+' : '-'}₹{txn.amount?.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Owner Earnings */}
              {selectedBooking.ownerEarnings > 0 && (
                <div className="bg-green-50 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-green-700 dark:text-green-400">Your Earnings</p>
                    <p className="text-xs text-green-600 mt-0.5">After platform fee deduction</p>
                  </div>
                  <p className="text-2xl font-black text-green-600">₹{selectedBooking.ownerEarnings?.toLocaleString()}</p>
                </div>
              )}

              {/* Refund failed — owner can only see, admin handles it */}
              {selectedBooking.refundDetails?.refundStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-700 mb-1">❌ Refund Failed</p>
                  <p className="text-xs text-red-600">
                    Razorpay could not process ₹{(selectedBooking.refundDetails?.refundAmount || selectedBooking.amount || 0).toLocaleString('en-IN')} automatically.
                    Please contact admin to process this refund manually.
                  </p>
                </div>
              )}

              {/* Invoice Download */}
              {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed') && (
                <div>
                  <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Download Invoice</p>
                  <InvoiceDownload booking={selectedBooking} userRole="owner" />
                </div>
              )}

              {/* Payment History button */}
              <button
                onClick={() => { setHistoryBooking(selectedBooking); setSelectedBooking(null); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
              >
                💳 View Full Payment History
              </button>

              {/* Owner Action Buttons for Pending & Confirmed Bookings in Details Modal */}
              {selectedBooking.status === 'pending' && (
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => handleConfirmClick(selectedBooking._id, true)}
                    className="py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      handleApproveSoon(selectedBooking._id);
                      setSelectedBooking(null);
                    }}
                    disabled={selectedBooking.approveSoonUsed}
                    className={`py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 ${
                      selectedBooking.approveSoonUsed
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-400 hover:bg-orange-500 text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Approve Soon
                  </button>
                  <button
                    onClick={() => {
                      setCancellingBooking(selectedBooking);
                      setCancelReason('');
                      setSelectedBooking(null);
                    }}
                    className="py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Ban className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {selectedBooking.status === 'confirmed' && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => handleCompleteClick(selectedBooking._id, true)}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Completed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {historyBooking && (
        <PaymentHistoryModal
          booking={historyBooking}
          token={token}
          onClose={() => setHistoryBooking(null)}
          onUpdate={(updated) => {
            setHistoryBooking(updated);
            setBookings(prev => prev.map(b => b._id === updated._id ? updated : b));
          }}
        />
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 dark:bg-slate-900 dark:border-slate-800 transform scale-100 transition-transform">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-100 text-primary-600 rounded-xl dark:bg-primary-900/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">{confirmModal.title}</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors shadow-md hover:shadow-lg"
              >
                Yes, Continue
              </button>
              <button
                onClick={() => {
                  if (confirmModal.onCancel) confirmModal.onCancel();
                }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold text-sm transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Cancel Booking Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg"><Ban className="w-5 h-5 text-red-600" /></div>
              <h2 className="text-base font-bold text-gray-800">Cancel Booking</h2>
            </div>
            <p className="text-sm text-gray-600 mb-1">Booking: <span className="font-semibold">{cancellingBooking.bookingNumber}</span></p>
            <p className="text-sm text-gray-600 mb-4">Amount: <span className="font-bold text-gray-800">₹{(cancellingBooking.amount || 0).toLocaleString('en-IN')}</span></p>
            {cancellingBooking.paymentStatus === 'paid' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                Full refund of ₹{(cancellingBooking.paymentLedger?.totalPaid || cancellingBooking.amount || 0).toLocaleString('en-IN')} will be initiated via Razorpay to the customer.
              </div>
            )}
            <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3}
              placeholder="Reason for cancellation..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 mb-4" />
            <div className="flex gap-2">
              <button onClick={handleOwnerCancel} disabled={cancelSubmitting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm disabled:opacity-60">
                {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
              <button onClick={() => { setCancellingBooking(null); setCancelReason(''); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50">
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      </>}
    </OwnerLayout>
  );
}

