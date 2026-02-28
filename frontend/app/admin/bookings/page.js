'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  BookOpen, Search, Filter, Eye, X, Calendar, Clock, MapPin,
  User, Building2, IndianRupee, CheckCircle, XCircle, AlertCircle,
  Phone, Mail, CreditCard, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceDownload from '@/components/booking/InvoiceDownload';

export default function AdminBookings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, searchQuery]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
        setFilteredBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.venue?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
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

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.amount || 0), 0),
    totalCommission: bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.commission || 0), 0)
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
    <AdminLayout title="Bookings Management" subtitle={`Manage all ${bookings.length} bookings`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
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
        <div className="bg-primary-50 rounded-lg shadow-soft border border-primary-200 p-4">
          <p className="text-xs text-primary-600 mb-1">Revenue</p>
          <p className="text-xl font-bold text-primary-700">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-soft border border-purple-200 p-4">
          <p className="text-xs text-purple-600 mb-1">Commission</p>
          <p className="text-xl font-bold text-purple-700">₹{stats.totalCommission.toLocaleString()}</p>
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
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-semibold text-dark-800">
                        #{booking._id.slice(-8).toUpperCase()}
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
                      {booking.commission > 0 && (
                        <p className="text-xs text-gray-500">Comm: ₹{booking.commission?.toLocaleString()}</p>
                      )}
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
      </div>

      {/* Booking Details Modal */}
      {modalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-dark-800">Booking Details</h2>
                <p className="text-sm text-gray-600">ID: #{selectedBooking._id.slice(-8).toUpperCase()}</p>
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
                  {selectedBooking.commission > 0 && (
                    <>
                      <div className="flex justify-between items-center pb-2 border-b border-primary-200">
                        <span className="text-gray-700">Platform Commission ({selectedBooking.commissionRate}%)</span>
                        <span className="font-semibold text-purple-600">
                          ₹{selectedBooking.commission?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Owner Earnings</span>
                        <span className="text-lg font-bold text-green-600">
                          ₹{selectedBooking.ownerEarnings?.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
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
              {selectedBooking.selectedAmenities && selectedBooking.selectedAmenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Selected Amenities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedBooking.selectedAmenities.map((amenity, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-semibold text-gray-900">{amenity.name}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-600">
                            Qty: {amenity.quantity} × ₹{amenity.price}
                          </span>
                          <span className="text-sm font-semibold text-primary-600">
                            ₹{(amenity.quantity * amenity.price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
