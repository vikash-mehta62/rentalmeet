'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Building2, Calendar, CheckCircle2, XCircle, Clock, MapPin,
  Menu, X, LogOut, User, Home, Search, Filter, IndianRupee,
  AlertCircle, Phone, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerBookings() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }

    // Filter by search query
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

  const handleLogout = () => {
    logout();
    router.push('/');
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 transform transition-transform duration-300 lg:translate-x-0 lg:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-dark-700">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-orange rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Rental<span className="text-primary-500">Meet</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/customer/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-700 rounded-xl font-medium transition-colors"
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              href="/customer/bookings"
              className="flex items-center gap-3 px-4 py-3 text-white bg-primary-500 rounded-xl font-medium"
            >
              <Calendar className="w-5 h-5" />
              My Bookings
            </Link>
            <Link
              href="/venues"
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-700 rounded-xl font-medium transition-colors"
            >
              <Search className="w-5 h-5" />
              Browse Venues
            </Link>
          </nav>

          <div className="p-4 border-t border-dark-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.name}</p>
                <p className="text-gray-400 text-sm truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-dark-800">My Bookings</h1>
                  <p className="text-sm text-gray-600">{filteredBookings.length} booking(s) found</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
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
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('confirmed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'confirmed'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Confirmed
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'completed'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilterStatus('cancelled')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'cancelled'
                      ? 'bg-red-500 text-white'
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
                  className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-lg transition-shadow"
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
                        <div className="bg-gray-50 rounded-lg p-4">
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
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
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
        </main>
      </div>
    </div>
  );
}
