'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import {
  Building2, Calendar, IndianRupee, Clock, MapPin, User,
  Phone, Mail, CheckCircle2, XCircle, Eye, Search, Download, Users
} from 'lucide-react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import InvoiceDownload from '@/components/booking/InvoiceDownload';

export default function OwnerBookings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
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
        b.venue?.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
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
        fetchBookings();
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
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
    <OwnerLayout title="My Bookings" subtitle={`${filteredBookings.length} booking(s) found`}>
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
            placeholder="Search by venue name, customer name, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                      <h3 className="text-xl font-bold text-dark-800 mb-1">
                        {booking.venue?.businessName}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {booking.venue?.location?.city}, {booking.venue?.location?.area}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status.toUpperCase()}
                    </span>
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

                  {/* Selected Amenities */}
                  {booking.selectedAmenities && (
                    (booking.selectedAmenities.basic?.length > 0 || 
                     booking.selectedAmenities.beverages?.length > 0 || 
                     booking.selectedAmenities.refreshmentFood?.length > 0 || 
                     booking.selectedAmenities.lunchThalis?.length > 0) && (
                    <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-2">Selected Amenities & Services</p>
                      <div className="space-y-2">
                        {booking.selectedAmenities.basic?.map((amenity, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded">
                            <span className="text-gray-700">{amenity.name} {amenity.rateType === 'Per Use' && `(x${amenity.quantity})`}</span>
                            <span className="font-semibold text-purple-600">₹{amenity.total?.toLocaleString()}</span>
                          </div>
                        ))}
                        {booking.selectedAmenities.beverages?.map((bev, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded">
                            <span className="text-gray-700">{bev.name} - {bev.brand} (x{bev.quantity})</span>
                            <span className="font-semibold text-purple-600">₹{bev.total?.toLocaleString()}</span>
                          </div>
                        ))}
                        {booking.selectedAmenities.refreshmentFood?.map((food, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded">
                            <span className="text-gray-700">{food.name} (x{food.quantity} plates)</span>
                            <span className="font-semibold text-purple-600">₹{food.total?.toLocaleString()}</span>
                          </div>
                        ))}
                        {booking.selectedAmenities.lunchThalis?.map((thali, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded">
                            <span className="text-gray-700">
                              {thali.thaliType} - {thali.category} (x{thali.quantity} plates)
                            </span>
                            <span className="font-semibold text-purple-600">₹{thali.total?.toLocaleString()}</span>
                          </div>
                        ))}
                        {booking.amenitiesTotal > 0 && (
                          <div className="flex justify-between items-center text-xs font-bold bg-purple-100 p-2 rounded border-t border-purple-300 mt-2">
                            <span className="text-purple-700">Amenities Total:</span>
                            <span className="text-purple-700">₹{booking.amenitiesTotal?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Booking Type & Amount */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                      {booking.bookingType}
                    </span>
                    <span>Total Amount: ₹{booking.amount?.toLocaleString()}</span>
                    <span>Commission: ₹{booking.commission?.toLocaleString()} ({booking.commissionRate}%)</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {booking.paymentStatus === 'paid' && (
                      <InvoiceDownload booking={booking} userRole="owner" />
                    )}
                    <Link
                      href={`/venues/${booking.venue?.sku}`}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Venue
                    </Link>
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(booking._id, 'confirmed')}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accept Booking
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(booking._id, 'completed')}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}

