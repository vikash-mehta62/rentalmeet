'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import CustomerLayout from '@/components/customer/CustomerLayout';
import {
  Calendar, CheckCircle2, XCircle, Clock, MapPin, IndianRupee,
  AlertCircle, Search, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceDownload from '@/components/booking/InvoiceDownload';

export default function CustomerBookings() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!token || user?.role !== 'customer') {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [token, user]);

  useEffect(() => {
    filterBookings();
  }, [bookings, filterStatus, searchQuery]);

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

    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.venue?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.venue?.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: 'Cancelled by customer'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Something went wrong');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <CustomerLayout activePage="bookings">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 sm:px-6 lg:px-8 py-8 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">My Bookings</h1>
          <p className="text-primary-100">{filteredBookings.length} booking(s) found</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by venue name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'all'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('confirmed')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'confirmed'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'completed'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'cancelled'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookings Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Start exploring venues and make your first booking!'}
            </p>
            <Link href="/venues" className="btn-primary inline-flex items-center gap-2">
              <Search className="w-5 h-5" />
              Browse Venues
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Venue Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-dark-800 mb-2">
                          {booking.venue?.businessName}
                        </h3>
                        <p className="text-gray-600 flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          {booking.venue?.location?.city}, {booking.venue?.location?.area}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border flex items-center gap-2 ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status?.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-5 h-5 text-primary-500" />
                        <div>
                          <p className="text-xs text-gray-500">Booking Date</p>
                          <p className="font-semibold">
                            {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-5 h-5 text-primary-500" />
                        <div>
                          <p className="text-xs text-gray-500">Time Slot</p>
                          <p className="font-semibold">
                            {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <IndianRupee className="w-5 h-5 text-primary-500" />
                        <div>
                          <p className="text-xs text-gray-500">Total Amount</p>
                          <p className="font-semibold text-primary-600">
                            ₹{booking.amount?.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700">
                        <AlertCircle className="w-5 h-5 text-primary-500" />
                        <div>
                          <p className="text-xs text-gray-500">Booking Type</p>
                          <p className="font-semibold capitalize">{booking.bookingType}</p>
                        </div>
                      </div>
                    </div>

                    {booking.customerDetails && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Event Details</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600">Event Type: <span className="font-medium text-gray-800">{booking.customerDetails.eventType}</span></p>
                          <p className="text-gray-600">Guests: <span className="font-medium text-gray-800">{booking.customerDetails.guestCount}</span></p>
                        </div>
                        {booking.customerDetails.specialRequirements && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Special Requirements:</span> {booking.customerDetails.specialRequirements}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Selected Amenities */}
                    {booking.selectedAmenities && (
                      (booking.selectedAmenities.basic?.length > 0 || 
                       booking.selectedAmenities.beverages?.length > 0 || 
                       booking.selectedAmenities.refreshmentFood?.length > 0 || 
                       booking.selectedAmenities.lunchThalis?.length > 0) && (
                      <div className="bg-primary-50 rounded-lg p-4 border border-primary-200 mb-4">
                        <p className="text-sm font-semibold text-primary-700 mb-3">Selected Amenities & Services</p>
                        <div className="space-y-2">
                          {booking.selectedAmenities.basic?.map((amenity, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <span className="text-gray-700">{amenity.name} {amenity.rateType === 'Per Use' && `(x${amenity.quantity})`}</span>
                              <span className="font-semibold text-primary-600">₹{amenity.total?.toLocaleString()}</span>
                            </div>
                          ))}
                          {booking.selectedAmenities.beverages?.map((bev, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <span className="text-gray-700">{bev.name} - {bev.brand} (x{bev.quantity})</span>
                              <span className="font-semibold text-primary-600">₹{bev.total?.toLocaleString()}</span>
                            </div>
                          ))}
                          {booking.selectedAmenities.refreshmentFood?.map((food, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <span className="text-gray-700">{food.name} (x{food.quantity} plates)</span>
                              <span className="font-semibold text-primary-600">₹{food.total?.toLocaleString()}</span>
                            </div>
                          ))}
                          {booking.selectedAmenities.lunchThalis?.map((thali, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <span className="text-gray-700">{thali.type} (x{thali.quantity} plates)</span>
                              <span className="font-semibold text-primary-600">₹{thali.total?.toLocaleString()}</span>
                            </div>
                          ))}
                          {booking.amenitiesTotal > 0 && (
                            <div className="flex justify-between items-center text-sm font-bold bg-primary-100 p-2 rounded border-t border-primary-300 mt-2">
                              <span className="text-primary-700">Amenities Total:</span>
                              <span className="text-primary-700">₹{booking.amenitiesTotal?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {booking.status === 'confirmed' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm mt-4">
                        <p className="text-green-800 font-semibold mb-1">Confirmed!</p>
                        <p className="text-xs text-green-700">Owner will contact you soon</p>
                      </div>
                    )}

                    {booking.status === 'cancelled' && booking.cancellationReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm mt-4">
                        <p className="text-red-800 font-semibold mb-1">Cancelled</p>
                        <p className="text-xs text-red-700">Reason: {booking.cancellationReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:w-48 flex flex-col gap-3">
                    <Link
                      href={`/venues/${booking.venue?.sku}`}
                      className="btn-secondary text-center"
                    >
                      View Venue
                    </Link>
                    {booking.paymentStatus === 'paid' && (
                      <InvoiceDownload booking={booking} userRole="customer" />
                    )}
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

