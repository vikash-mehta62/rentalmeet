'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Plus, Eye, Edit, Trash2, Search, Filter,
  CheckCircle2, Clock, XCircle, AlertCircle, Calendar, IndianRupee,
  Menu, X, Home, Settings, User, LogOut, MapPin
} from 'lucide-react';

export default function MyVenues() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== 'owner') {
      router.push('/login');
      return;
    }
    fetchVenues();
  }, [token, user]);

  useEffect(() => {
    filterVenues();
  }, [searchTerm, statusFilter, venues]);

  const fetchVenues = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/owner/venues', {
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(venue =>
        venue.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(venue => venue.status === statusFilter);
    }

    setFilteredVenues(filtered);
  };

  const handleDelete = async (venueId) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/owner/venues/${venueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setVenues(venues.filter(v => v._id !== venueId));
        alert('Venue deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
      alert('Failed to delete venue');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venues...</p>
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
            <Link href="/owner/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-dark-700 rounded-xl font-medium transition-colors">
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link href="/owner/venues" className="flex items-center gap-3 px-4 py-3 bg-primary-500 text-white rounded-xl font-medium">
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
                  <h1 className="text-2xl font-bold text-dark-800">My Venues</h1>
                  <p className="text-sm text-gray-600">{filteredVenues.length} venue(s) found</p>
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
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Venues Grid */}
          {filteredVenues.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No venues found' : 'No venues yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Start by adding your first venue'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/register-venue" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Your First Venue
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredVenues.map((venue, index) => (
                <div
                  key={venue._id}
                  className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Venue Image */}
                  <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    {venue.images?.[0]?.url ? (
                      <img
                        src={venue.images[0].url}
                        alt={venue.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-16 h-16 text-primary-500" />
                    )}
                  </div>

                  {/* Venue Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-dark-800 mb-1">{venue.businessName}</h3>
                        <p className="text-gray-600 text-sm flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {venue.location?.city}, {venue.location?.area}
                        </p>
                      </div>
                      {getStatusBadge(venue.status)}
                    </div>

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
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/owner/venues/${venue._id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <Link
                        href={`/owner/venues/${venue._id}/edit`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl font-medium hover:bg-primary-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(venue._id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
