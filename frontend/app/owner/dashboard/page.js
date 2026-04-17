'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import {
  Building2, Plus, TrendingUp, Calendar, IndianRupee, Eye,
  Edit, CheckCircle2, Clock, XCircle, AlertCircle, History, ChevronDown, ChevronUp
} from 'lucide-react';
import OwnerLayout from '@/components/owner/OwnerLayout';

export default function OwnerDashboard() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState({});

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setVenues(data.recentVenues);
        setBookings(data.recentBookings || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved:    { bg: 'bg-green-100', text: 'text-green-700',  icon: CheckCircle2, label: 'Approved' },
      pending:     { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock,        label: 'Pending Review' },
      rejected:    { bg: 'bg-red-100',   text: 'text-red-700',    icon: XCircle,      label: 'Rejected' },
      resubmitted: { bg: 'bg-blue-100',  text: 'text-blue-700',   icon: Clock,        label: 'Resubmitted' },
      suspended:   { bg: 'bg-gray-100',  text: 'text-gray-700',   icon: AlertCircle,  label: 'Suspended' }
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
      <OwnerLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title="Dashboard" subtitle="Welcome back!">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-500" />
            </div>
            <span className="text-3xl font-bold text-dark-800">{stats?.totalVenues || 0}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Total Venues</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-dark-800">{stats?.approvedVenues || 0}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Approved</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-dark-800">{stats?.totalBookings || 0}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Total Bookings</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
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
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-8">
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
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
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

                    {/* Current rejection reason */}
                    {(venue.status === 'rejected' || venue.status === 'resubmitted') && venue.rejectionReason && (
                      <div className={`mt-2 px-3 py-2 rounded-lg text-xs border ${
                        venue.status === 'resubmitted'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        <span className="font-bold">
                          {venue.status === 'resubmitted' ? '↩ Previous rejection:' : '✗ Rejected:'}
                        </span>{' '}{venue.rejectionReason}
                      </div>
                    )}

                    {/* Rejection history toggle */}
                    {venue.rejectionHistory?.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedHistory(p => ({ ...p, [venue._id]: !p[venue._id] }))}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
                        >
                          <History className="w-3.5 h-3.5" />
                          {venue.rejectionHistory.length} rejection{venue.rejectionHistory.length > 1 ? 's' : ''} history
                          {expandedHistory[venue._id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {expandedHistory[venue._id] && (
                          <div className="mt-2 space-y-1.5">
                            {[...venue.rejectionHistory].reverse().map((h, i) => (
                              <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-red-700">{h.reason}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {new Date(h.rejectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/venues/${venue.sku}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link href={`/owner/venues/${venue._id}/edit`}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-dark-800">Recent Bookings</h2>
          <Link href="/owner/bookings" className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1">
            View All
            <TrendingUp className="w-4 h-4" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
            <p className="text-gray-500">Bookings will appear here once customers book your venues</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Venue Image */}
                  <div className="w-full lg:w-24 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    {booking.venue?.images?.[0]?.url ? (
                      <img
                        src={booking.venue.images[0].url}
                        alt={booking.venue.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-dark-800">{booking.venue?.businessName}</h3>
                        <p className="text-sm text-gray-600">{booking.customer?.name}</p>
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

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>{new Date(booking.bookingDate).toLocaleDateString('en-IN')}</span>
                      <span>•</span>
                      <span>{booking.startTime} - {booking.endTime}</span>
                      <span>•</span>
                      <span className="text-green-600 font-semibold">₹{booking.ownerEarnings?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}

