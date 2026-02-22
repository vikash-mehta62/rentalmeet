'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import CustomerLayout from '@/components/customer/CustomerLayout';
import {
  Calendar, CheckCircle2, XCircle, Clock, Search
} from 'lucide-react';

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== 'customer') {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [token, user]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        const bookings = data.bookings;
        
        // Calculate stats
        const now = new Date();
        setStats({
          total: bookings.length,
          upcoming: bookings.filter(b => 
            b.status === 'confirmed' && new Date(b.bookingDate) >= now
          ).length,
          completed: bookings.filter(b => b.status === 'completed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length
        });

        // Get recent bookings (last 5)
        setRecentBookings(bookings.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <CustomerLayout activePage="dashboard">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 sm:px-6 lg:px-8 py-8 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Customer Dashboard</h1>
          <p className="text-primary-100">Welcome back, {user?.name}!</p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-dark-800 mb-1">{stats.total}</h3>
            <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-dark-800 mb-1">{stats.upcoming}</h3>
            <p className="text-gray-600 text-sm font-medium">Upcoming Bookings</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-dark-800 mb-1">{stats.completed}</h3>
            <p className="text-gray-600 text-sm font-medium">Completed</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-dark-800 mb-1">{stats.cancelled}</h3>
            <p className="text-gray-600 text-sm font-medium">Cancelled</p>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-dark-800">Recent Bookings</h2>
            <Link
              href="/customer/bookings"
              className="text-primary-500 hover:text-primary-600 font-bold text-sm transition-colors"
            >
              View All →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Bookings Yet</h3>
              <p className="text-gray-500 mb-6">Start exploring venues and make your first booking!</p>
              <Link href="/venues" className="btn-primary inline-flex items-center gap-2">
                <Search className="w-5 h-5" />
                Browse Venues
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-800 mb-1">
                        {booking.venue?.businessName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {booking.venue?.location?.city}, {booking.venue?.location?.area}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(booking.bookingDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.startTime} - {booking.endTime}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-primary-600">
                      ₹{booking.amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link
            href="/venues"
            className="bg-gradient-orange text-white rounded-2xl p-6 hover:scale-105 transition-transform shadow-lg"
          >
            <Search className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Browse Venues</h3>
            <p className="text-white/90">Discover and book amazing venues for your events</p>
          </Link>

          <Link
            href="/customer/bookings"
            className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-6 hover:scale-105 transition-transform shadow-lg"
          >
            <Calendar className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">My Bookings</h3>
            <p className="text-white/90">View and manage all your venue bookings</p>
          </Link>
        </div>
      </div>
    </CustomerLayout>
  );
}
