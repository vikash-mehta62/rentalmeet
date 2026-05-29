'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import OwnerLayout from '@/components/owner/OwnerLayout';
import PaymentHistoryModal from '@/components/admin/PaymentHistoryModal';
import toast from 'react-hot-toast';
import {
  IndianRupee, TrendingUp, Clock, RefreshCw, Search,
  ChevronLeft, ChevronRight, Eye, Building2, Calendar, User
} from 'lucide-react';

const STATUS_STYLE = {
  paid:     'bg-green-100 text-green-700',
  pending:  'bg-yellow-100 text-yellow-700',
  refunded: 'bg-blue-100 text-blue-700',
};

const BOOKING_STATUS_STYLE = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function OwnerPayments() {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, paid: 0, pending: 0, refunded: 0 });
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [historyBooking, setHistoryBooking] = useState(null);
  const LIMIT = 20;

  const fetchPayments = useCallback(async (pg = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (venueFilter !== 'all') params.set('venueId', venueFilter);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats);
        setVenues(data.venues || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [token, statusFilter, venueFilter]);

  useEffect(() => { setPage(1); fetchPayments(1); }, [statusFilter, venueFilter]);
  useEffect(() => { fetchPayments(page); }, [page]);

  // Debounced search (client-side filter)
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = search
    ? bookings.filter(b =>
        b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        b.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.customerDetails?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.venue?.businessName?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  const handleHistoryUpdate = (updated) => {
    setBookings(prev => prev.map(b => b._id === updated._id ? updated : b));
    setHistoryBooking(updated);
  };

  return (
    <>
      <OwnerLayout title="Payments" subtitle="Venue booking payment history">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Revenue',  value: `₹${stats.totalRevenue?.toLocaleString('en-IN')}`, icon: TrendingUp, cls: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Paid',           value: stats.paid,     icon: IndianRupee, cls: 'bg-white border-gray-100 text-gray-800' },
            { label: 'Pending',        value: stats.pending,  icon: Clock,       cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'Refunded',       value: stats.refunded, icon: RefreshCw,   cls: 'bg-blue-50 border-blue-200 text-blue-700' },
          ].map(({ label, value, icon: Icon, cls }) => (
            <div key={label} className={`rounded-2xl border shadow-sm p-5 ${cls}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <Icon className="w-4 h-4 opacity-60" />
              </div>
              <p className="text-2xl font-black">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search booking, customer, venue..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
          {venues.length > 0 && (
            <select
              value={venueFilter}
              onChange={e => setVenueFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">All Venues</option>
              {venues.map(v => (
                <option key={v._id} value={v._id}>{v.businessName}</option>
              ))}
            </select>
          )}
          <span className="text-xs text-gray-400 ml-auto">{total} bookings</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-500">No payments found</p>
              <p className="text-sm mt-1">Payments will appear here once bookings are made</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Booking #', 'Customer', 'Venue', 'Date', 'Amount', 'Payment', 'Booking Status', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(b => {
                      const totalPaid = b.paymentLedger?.transactions
                        ?.filter(t => ['payment','manual_payment'].includes(t.type) && t.status === 'completed')
                        ?.reduce((s, t) => s + (t.amount || 0), 0) ?? 0;
                      return (
                        <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                              {b.bookingNumber}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800 text-xs">{b.customer?.name || b.customerDetails?.name || '—'}</p>
                            <p className="text-xs text-gray-400">{b.customer?.phone || b.customerDetails?.phone || ''}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold text-gray-700 truncate max-w-[140px]">{b.venue?.businessName || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-800">₹{(b.amount || 0).toLocaleString('en-IN')}</p>
                            {totalPaid > 0 && totalPaid !== b.amount && (
                              <p className="text-xs text-green-600">Paid: ₹{totalPaid.toLocaleString('en-IN')}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[b.paymentStatus] || STATUS_STYLE.pending}`}>
                              {b.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${BOOKING_STATUS_STYLE[b.status] || ''}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setHistoryBooking(b)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map(b => (
                  <div key={b._id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{b.bookingNumber}</code>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[b.paymentStatus] || STATUS_STYLE.pending}`}>
                        {b.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3.5 h-3.5" />
                      <span>{b.customer?.name || b.customerDetails?.name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{b.venue?.businessName || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-IN') : '—'}</span>
                      </div>
                      <p className="font-bold text-gray-800">₹{(b.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <button
                      onClick={() => setHistoryBooking(b)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Payment Details
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </OwnerLayout>

      {historyBooking && (
        <PaymentHistoryModal
          booking={historyBooking}
          token={token}
          onClose={() => setHistoryBooking(null)}
          onUpdate={handleHistoryUpdate}
        />
      )}
    </>
  );
}
