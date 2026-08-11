'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Calendar,
  Building2,
  TrendingUp,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function AmbassadorBookingsPage() {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalShareEarnings, setTotalShareEarnings] = useState(0);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setBookings(json.bookings || []);
        setTotalShareEarnings(json.totalShareEarnings || 0);
      }
    } catch {
      console.error('Failed to load ambassador bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBookings();
  }, [token]);

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      b.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.venue?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalBookingVolume = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-primary-600 to-amber-600 text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> 12-Month 25% Recurring Profit Share
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Venue Bookings &amp; Revenue Share
          </h1>
          <p className="text-xs text-purple-100 mt-1 max-w-xl">
            You automatically receive 25% of RentalMeet platform profit on all bookings completed at your listed venues for a full 12 months from their approval date.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl text-white transition-all self-start sm:self-auto"
          title="Refresh Bookings"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500">Total Bookings</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {bookings.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Across all your listed venues</p>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500">Total Paid Booking Volume</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₹{totalBookingVolume.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Gross booking transaction value</p>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500">Your 25% Profit Share</span>
            <div className="p-2 bg-green-100 dark:bg-green-950/60 text-green-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-green-600">
            ₹{totalShareEarnings.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Credited to your wallet on settlement</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search booking #, venue name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
          >
            <option value="all">All Bookings</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No bookings found</h3>
            <p className="text-xs text-slate-500 mt-1">Bookings on your listed venues will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Booking #</th>
                  <th className="p-4">Venue</th>
                  <th className="p-4">Booking Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Booking Value</th>
                  <th className="p-4">Platform Profit</th>
                  <th className="p-4">Your 25% Share</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {b.bookingNumber || `#${b._id.slice(-6).toUpperCase()}`}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{b.venue?.businessName}</p>
                      <p className="text-[11px] text-slate-500">{b.venue?.location?.city}</p>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      <p className="font-semibold">{new Date(b.bookingDate).toLocaleDateString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400">{b.startTime} - {b.endTime}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{b.customer?.name}</p>
                      <p className="text-[10px] text-slate-400">{b.customer?.phone}</p>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      ₹{(b.totalAmount || b.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                      ₹{(b.platformProfit || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 font-black text-green-600 text-sm">
                      +₹{(b.ambassadorShare || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'completed' ? 'bg-green-100 text-green-700' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {b.paymentStatus || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
