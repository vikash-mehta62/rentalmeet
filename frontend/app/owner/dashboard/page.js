'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Plus, TrendingUp, Calendar, IndianRupee, Eye,
  Edit, Trash2, Clock, CheckCircle2, XCircle, AlertCircle,
  LogOut, Menu, X, Home, Settings, User
} from 'lucide-react';

export default function OwnerDashboard() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState(null);
  const [venues, setVenues] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Wait for hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    
    if (!token || user?.role !== 'owner') {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [token, user, hydrated, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/owner/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setVenues(data.recentVenues);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
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

  // Don't render until hydrated
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-dark-700">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-orange rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Rental<span className="text-primary-500">Meet</span>
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/owner/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary-500 text-white rounded-xl font-medium">
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link href="/owner/venues" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-dark-700 rounded-xl font-medium transition-colors">
              <Building2 className="w-5 h-5" />
              My Venues
            </Link>
            <Link href="/register-venue" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-dark-700 rounded-xl font-medium transition-colors">
              <Plus className="w-5 h-5" />
              Add New Venue
            </Link>
            <Link href="/owner/profile" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-dark-700 rounded-xl font-medium transition-colors">
              <User className="w-5 h-5" />
              Profile
            </Link>
            <Link href="/owner/settings" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-dark-700 rounded-xl font-medium transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-dark-700">
            <div className="mb-3 px-4 py-3 bg-dark-700 rounded-xl">
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="text-white font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-soft sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-dark-800">Dashboard</h1>
                  <p className="text-sm text-gray-600">Welcome back, {user?.name}!</p>
                </div>
              </div>
              <Link
                href="/register-venue"
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Venue</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-500" />
                </div>
                <span className="text-3xl font-bold text-dark-800">{stats?.totalVenues || 0}</span>
              </div>
              <h3 className="text-gray-600 font-medium">Total Venues</h3>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-3xl font-bold text-dark-800">{stats?.approvedVenues || 0}</span>
              </div>
              <h3 className="text-gray-600 font-medium">Approved</h3>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-dark-800">{stats?.totalBookings || 0}</span>
              </div>
              <h3 className="text-gray-600 font-medium">Total Bookings</h3>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold text-dark-800">₹{stats?.totalEarnings?.toLocaleString() || 0}</span>
              </div>
              <h3 className="text-gray-600 font-medium">Total Earnings</h3>
            </div>
          </div>

          {/* Recent Venues */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-800">My Venues</h2>
              <Link href="/owner/venues" className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1">
                View All
                <TrendingUp className="w-4 h-4" />
              </Link>
            </div>

            {venues.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No venues yet</h3>
                <p className="text-gray-500 mb-6">Start by adding your first venue</p>
                <Link href="/register-venue" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Your First Venue
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {venues.map((venue) => (
                  <div key={venue._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-dark-800">{venue.businessName}</h3>
                          {getStatusBadge(venue.status)}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{venue.location?.city}, {venue.location?.area}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {venue.totalBookings || 0} bookings
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            ₹{venue.totalEarnings?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/owner/venues/${venue._id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/owner/venues/${venue._id}/edit`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
