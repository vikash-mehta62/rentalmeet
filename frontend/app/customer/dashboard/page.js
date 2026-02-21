'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Building2, Calendar, CheckCircle2, XCircle, Clock,
  TrendingUp, Menu, X, LogOut, User, Home, Search
} from 'lucide-react';

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== 'customer') {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [token, user]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
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

  const handleLogout = () => {
    logout();
    router.push('/');
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 transform transition-transform duration-300 lg:translate-x-0 lg:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/customer/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-white bg-primary-500 rounded-xl font-medium"
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              href="/customer/bookings"
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-dark-700 rounded-xl font-medium transition-colors"
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

          {/* User Info */}
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

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
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
                  <h1 className="text-2xl font-bold text-dark-800">Customer Dashboard</h1>
                  <p className="text-sm text-gray-600">Welcome back, {user?.name}!</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-dark-800 mb-1">{stats.total}</h3>
              <p className="text-gray-600 text-sm">Total Bookings</p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-dark-800 mb-1">{stats.upcoming}</h3>
              <p className="text-gray-600 text-sm">Upcoming Bookings</p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-dark-800 mb-1">{stats.completed}</h3>
              <p className="text-gray-600 text-sm">Completed</p>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-dark-800 mb-1">{stats.cancelled}</h3>
              <p className="text-gray-600 text-sm">Cancelled</p>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-800">Recent Bookings</h2>
              <Link
                href="/customer/bookings"
                className="text-primary-500 hover:text-primary-600 font-medium text-sm"
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
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
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
              className="bg-gradient-orange text-white rounded-2xl p-6 hover:scale-105 transition-transform"
            >
              <Search className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Browse Venues</h3>
              <p className="text-white/90">Discover and book amazing venues for your events</p>
            </Link>

            <Link
              href="/customer/bookings"
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 hover:scale-105 transition-transform"
            >
              <Calendar className="w-12 h-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">My Bookings</h3>
              <p className="text-white/90">View and manage all your venue bookings</p>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
