'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import VendorLayout from '@/components/vendor/VendorLayout';
import toast from 'react-hot-toast';
import {
  IndianRupee, TrendingUp, Clock, XCircle, Search,
  ChevronLeft, ChevronRight, Eye, Calendar, User, ChevronDown, ChevronUp
} from 'lucide-react';

const PAYMENT_STYLE = {
  paid:    'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed:  'bg-red-100 text-red-700',
};

const BOOKING_STYLE = {
  confirmed: 'bg-green-100 text-green-700',
  enquiry:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

function PaymentDetailModal({ booking, onClose }) {
  if (!booking) return null;
  const p = booking.pricing || {};
  const pd = booking.paymentDetails || {};

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">Payment Details</h2>
            <p className="text-xs text-gray-500">#{booking.bookingNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Status badges */}
          <div className="flex gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${PAYMENT_STYLE[booking.paymentStatus] || PAYMENT_STYLE.pending}`}>
              Payment: {booking.paymentStatus}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${BOOKING_STYLE[booking.status] || ''}`}>
              Booking: {booking.status}
            </span>
          </div>

          {/* Customer info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer</p>
            <p className="text-sm font-semibold text-gray-800">{booking.customerInfo?.name || '—'}</p>
            <p className="text-xs text-gray-500">{booking.customerInfo?.email}</p>
            <p className="text-xs text-gray-500">{booking.customerInfo?.phone}</p>
            {booking.customerInfo?.eventName && (
              <p className="text-xs text-gray-500">Event: {booking.customerInfo.eventName}</p>
            )}
          </div>

          {/* Service info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Service</p>
            <p className="text-sm font-semibold text-gray-800">{booking.serviceSnapshot?.title || booking.service?.title || '—'}</p>
            <p className="text-xs text-gray-500">{booking.serviceSnapshot?.category}</p>
            <p className="text-xs text-gray-500">
              Event Date: {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </p>
          </div>

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Price Breakdown</p>
            <div className="space-y-1.5 text-sm">
              {p.subtotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{p.subtotal?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {(p.serviceCGST > 0 || p.serviceSGST > 0) && (
                <div className="flex justify-between text-gray-600">
                  <span>GST ({p.cgstPct || 0}% + {p.sgstPct || 0}%)</span>
                  <span>₹{((p.serviceCGST || 0) + (p.serviceSGST || 0)).toLocaleString('en-IN')}</span>
                </div>
              )}
              {p.platformFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>₹{p.platformFee?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {booking.coupon?.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({booking.coupon.code})</span>
                  <span>-₹{booking.coupon.discountAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                <span>Total</span>
                <span>₹{(p.total || booking.amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment details */}
          {pd.razorpay_payment_id && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Razorpay Details</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>Payment ID: <code className="font-mono text-green-700">{pd.razorpay_payment_id}</code></p>
                <p>Order ID: <code className="font-mono text-gray-500">{pd.razorpay_order_id}</code></p>
                {pd.paidAt && <p>Paid At: {new Date(pd.paidAt).toLocaleString('en-IN')}</p>}
              </div>
            </div>
          )}

          {/* Settlement details */}
          {booking.status === 'completed' && (
            <div className={`rounded-xl p-4 border text-xs ${
              booking.settlementStatus === 'settled' ? 'bg-green-50 border-green-200 text-green-900' :
              booking.settlementStatus === 'failed' ? 'bg-red-50 border-red-200 text-red-900' :
              'bg-yellow-50 border-yellow-200 text-yellow-900'
            }`}>
              <p className="font-bold uppercase tracking-wider mb-2 text-[10px] text-gray-500">Payout Settlement</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-gray-500 font-normal">Status:</span>
                  <span className={`ml-1.5 font-bold uppercase ${
                    booking.settlementStatus === 'settled' ? 'text-green-700' :
                    booking.settlementStatus === 'failed' ? 'text-red-700' : 'text-yellow-700'
                  }`}>{booking.settlementStatus || 'unsettled'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-normal">Payout Share:</span>
                  <span className="ml-1.5 font-bold text-gray-800">
                    ₹{(
                      Number(booking.pricing?.total ?? booking.amount ?? 0) -
                      Number(booking.pricing?.platformFee ?? 0) -
                      Number(booking.pricing?.platformFeeGST ?? 0)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                {booking.settlementDetails?.settledAt && (
                  <div>
                    <span className="text-gray-500 font-normal">Date:</span>
                    <span className="ml-1.5 font-semibold text-gray-700">
                      {new Date(booking.settlementDetails.settledAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
                {booking.settlementDetails?.transactionId && (
                  <div className="col-span-2">
                    <span className="text-gray-500 font-normal">Ref ID:</span>
                    <code className="ml-1.5 font-mono bg-white border border-gray-200 px-1 py-0.5 rounded select-all text-gray-800">
                      {booking.settlementDetails.transactionId}
                    </code>
                  </div>
                )}
                {booking.settlementDetails?.remarks && (
                  <div className="col-span-2 text-gray-600 mt-1 italic">
                    Note: {booking.settlementDetails.remarks}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          {booking.items?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items</p>
              <div className="space-y-1.5">
                {booking.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600">
                    <span>{item.name} × {item.quantity} {item.unit}</span>
                    <span>₹{(item.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VendorPayments() {
  const { token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, paid: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const LIMIT = 20;

  const fetchPayments = useCallback(async (pg = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [token, statusFilter]);

  useEffect(() => { setPage(1); fetchPayments(1); }, [statusFilter]);
  useEffect(() => { fetchPayments(page); }, [page]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = search
    ? bookings.filter(b =>
        b.bookingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        b.customerInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.serviceSnapshot?.title?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  return (
    <>
      <VendorLayout title="Payments" subtitle="Service booking payment history">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Revenue', value: `₹${stats.totalRevenue?.toLocaleString('en-IN')}`, icon: TrendingUp, cls: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Paid',          value: stats.paid,    icon: IndianRupee, cls: 'bg-white border-gray-100 text-gray-800' },
            { label: 'Pending',       value: stats.pending, icon: Clock,       cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'Failed',        value: stats.failed,  icon: XCircle,     cls: 'bg-red-50 border-red-200 text-red-700' },
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
              placeholder="Search booking, customer, service..."
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
            <option value="failed">Failed</option>
          </select>
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
              <p className="text-sm mt-1">Payments will appear here once customers book your services</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Booking #', 'Customer', 'Service', 'Event Date', 'Amount', 'Payment', 'Booking Status', 'Settlement', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(b => (
                      <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                            {b.bookingNumber}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 text-xs">{b.customerInfo?.name || '—'}</p>
                          <p className="text-xs text-gray-400">{b.customerInfo?.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-700 truncate max-w-[140px]">
                            {b.serviceSnapshot?.title || b.service?.title || '—'}
                          </p>
                          <p className="text-xs text-gray-400">{b.serviceSnapshot?.category}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {b.eventDate ? new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-800">₹{(b.pricing?.total || b.amount || 0).toLocaleString('en-IN')}</p>
                          {b.coupon?.discountAmount > 0 && (
                            <p className="text-xs text-green-600">-₹{b.coupon.discountAmount.toLocaleString('en-IN')} off</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${PAYMENT_STYLE[b.paymentStatus] || PAYMENT_STYLE.pending}`}>
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${BOOKING_STYLE[b.status] || ''}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            b.settlementStatus === 'settled' ? 'bg-green-100 text-green-700' :
                            b.settlementStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {b.settlementStatus || 'unsettled'}
                          </span>
                          {b.settlementDetails?.transactionId && (
                            <p className="text-[10px] text-gray-400 font-mono mt-1 select-all truncate max-w-[80px]" title={b.settlementDetails.transactionId}>
                              {b.settlementDetails.transactionId}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map(b => (
                  <div key={b._id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{b.bookingNumber}</code>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${PAYMENT_STYLE[b.paymentStatus] || PAYMENT_STYLE.pending}`}>
                        {b.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3.5 h-3.5" />
                      <span>{b.customerInfo?.name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="truncate">{b.serviceSnapshot?.title || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{b.eventDate ? new Date(b.eventDate).toLocaleDateString('en-IN') : '—'}</span>
                      </div>
                      <p className="font-bold text-gray-800">₹{(b.pricing?.total || b.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1.5 border-t border-gray-100">
                      <span className="text-gray-500">Settlement:</span>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                          b.settlementStatus === 'settled' ? 'bg-green-100 text-green-700' :
                          b.settlementStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.settlementStatus || 'unsettled'}
                        </span>
                        {b.settlementDetails?.transactionId && (
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5" title={b.settlementDetails.transactionId}>
                            Ref: {b.settlementDetails.transactionId}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBooking(b)}
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

      </VendorLayout>

      {selectedBooking && (
        <PaymentDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </>
  );
}
