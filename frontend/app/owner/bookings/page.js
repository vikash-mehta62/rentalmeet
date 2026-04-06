'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import {
  Building2, Calendar, IndianRupee, Clock, MapPin, User,
  Phone, Mail, CheckCircle2, XCircle, Eye, Search, Download, Users, ChevronDown
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
  const [expandedAmenities, setExpandedAmenities] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);

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
        fetchBookings();
        const deadline = new Date(data.confirmationDeadline).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        alert(`Deadline extended! New deadline: ${deadline}`);
      } else {
        alert(data.message || 'Failed to extend deadline');
      }
    } catch (error) {
      console.error('Error extending deadline:', error);
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
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status.toUpperCase()}
                      </span>
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(booking._id, 'confirmed')}
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
                            onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                      {booking.status === 'confirmed' && (() => {
                        // Show Mark Completed only after booking end time has passed
                        const bookingDate = new Date(booking.bookingDate);
                        const endTime = booking.endTime; // "19:30"
                        let canComplete = false;
                        if (endTime) {
                          const [endH, endM] = endTime.split(':').map(Number);
                          const bookingEnd = new Date(bookingDate);
                          bookingEnd.setHours(endH, endM, 0, 0);
                          canComplete = new Date() >= bookingEnd;
                        }
                        return canComplete ? (
                          <button
                            onClick={() => handleUpdateStatus(booking._id, 'completed')}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Completed
                          </button>
                        ) : null;
                      })()}
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

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
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
                }`}>{selectedBooking.status.toUpperCase()}</span>
                <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Key Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><User className="w-3 h-3"/>Customer</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedBooking.customer?.name}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/>Date</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/>Time Slot</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
                <div className="bg-green-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3"/>Amount</p>
                  <p className="text-sm font-bold text-green-600">₹{selectedBooking.amount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">Customer Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p className="flex items-center gap-2 text-gray-700 dark:text-slate-300"><Mail className="w-3.5 h-3.5 text-blue-500"/>{selectedBooking.customer?.email}</p>
                  <p className="flex items-center gap-2 text-gray-700 dark:text-slate-300"><Phone className="w-3.5 h-3.5 text-blue-500"/>{selectedBooking.customerDetails?.phone || selectedBooking.customer?.phone}</p>
                  {selectedBooking.customerDetails?.eventType && <p className="text-gray-700 dark:text-slate-300"><span className="font-semibold">Event:</span> {selectedBooking.customerDetails.eventType}</p>}
                  {selectedBooking.customerDetails?.guestCount && <p className="text-gray-700 dark:text-slate-300"><span className="font-semibold">Guests:</span> {selectedBooking.customerDetails.guestCount}</p>}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Price Breakdown</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Base Price</span><span className="font-semibold">₹{(selectedBooking.priceBreakdown?.basePrice || 0).toLocaleString()}</span></div>
                  {selectedBooking.amenitiesTotal > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Amenities</span><span className="font-semibold">₹{selectedBooking.amenitiesTotal?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.gst > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">GST</span><span className="font-semibold">₹{selectedBooking.priceBreakdown.gst?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.platformFee > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Platform Fee</span><span className="font-semibold">₹{selectedBooking.priceBreakdown.platformFee?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount {selectedBooking.priceBreakdown.couponCode ? `(${selectedBooking.priceBreakdown.couponCode})` : ''}</span>
                      <span className="font-semibold">- ₹{selectedBooking.priceBreakdown.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-1.5 font-bold text-base"><span>Total</span><span className="text-primary-600">₹{selectedBooking.amount?.toLocaleString()}</span></div>
                </div>
              </div>

              {/* Invoice Download — only for confirmed/completed */}
              {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed') && (
                <div>
                  <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Download Invoice</p>
                  <InvoiceDownload booking={selectedBooking} userRole="owner" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}

