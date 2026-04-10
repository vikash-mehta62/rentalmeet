'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  CreditCard, Search, Filter, Eye, X, Calendar, IndianRupee,
  CheckCircle, XCircle, Clock, AlertCircle, User, Building2,
  TrendingUp, Download, Plus, RefreshCw, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceDownload from '@/components/booking/InvoiceDownload';
import PaymentHistoryModal from '@/components/admin/PaymentHistoryModal';

export default function AdminPayments() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, failed: 0, refunded: 0, totalRevenue: 0, ownerEarnings: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ledgerAction, setLedgerAction] = useState(null);
  const [ledgerForm, setLedgerForm] = useState({ amount: '', note: '', txnId: '' });
  const [ledgerSubmitting, setLedgerSubmitting] = useState(false);
  const [historyBooking, setHistoryBooking] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('all');
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('');
  const [fyFilter, setFyFilter] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  // FY options: e.g. "2024-25"
  const fyOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - i;
    return `${y}-${String(y + 1).slice(-2)}`;
  });

  useEffect(() => { if (token) fetchPayments(); }, [token]);
  useEffect(() => { if (token && showAnalytics) fetchAnalytics(); }, [token, analyticsPeriod, showAnalytics]);
  useEffect(() => {
    if (token) fetchPayments();
  }, [statusFilter, dateFilter, yearFilter, fyFilter, customFrom, customTo, searchQuery]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFilter !== 'all') params.set('dateFilter', dateFilter);
      if (dateFilter === 'year' && yearFilter) params.set('year', yearFilter);
      if (dateFilter === 'fy' && fyFilter) params.set('fyYear', fyFilter.split('-')[0]);
      if (dateFilter === 'custom' && customFrom) params.set('from', customFrom);
      if (dateFilter === 'custom' && customTo) params.set('to', customTo);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/payments?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
        setFilteredPayments(data.payments);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/payments/venue-analytics?period=${analyticsPeriod}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setAnalytics(data);
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // filterPayments removed — backend handles all filtering

  // CSV Export — exports currently filtered data
  const exportCSV = () => {
    if (filteredPayments.length === 0) { toast.error('No data to export'); return; }

    // Build filename with active filter info
    let filterLabel = 'all';
    if (dateFilter === 'today') filterLabel = 'today';
    else if (dateFilter === 'week') filterLabel = 'this_week';
    else if (dateFilter === 'month') filterLabel = 'this_month';
    else if (dateFilter === 'year' && yearFilter) filterLabel = `year_${yearFilter}`;
    else if (dateFilter === 'fy' && fyFilter) filterLabel = `FY_${fyFilter}`;
    else if (dateFilter === 'custom' && customFrom && customTo) filterLabel = `${customFrom}_to_${customTo}`;
    if (statusFilter !== 'all') filterLabel += `_${statusFilter}`;

    const headers = [
      'S.No', 'Booking No', 'Payment ID', 'Order ID',
      'Customer', 'Email', 'Phone',
      'Venue', 'City',
      'Booking Date', 'Booking Type',
      'Base Price', 'GST', 'Platform Fee', 'Discount', 'Total Amount',
      'Owner Earnings', 'Payment Status', 'Booking Status',
      'Paid At', 'Created At'
    ];

    const rows = filteredPayments.map((p, i) => {
      const pb = p.priceBreakdown || {};
      return [
        i + 1,
        p.bookingNumber || 'N/A',
        p.paymentDetails?.razorpay_payment_id || 'N/A',
        p.paymentDetails?.razorpay_order_id || 'N/A',
        p.customer?.name || '',
        p.customer?.email || '',
        p.customerDetails?.phone || p.customer?.phone || '',
        p.venue?.businessName || '',
        p.venue?.location?.city || '',
        p.bookingDate ? new Date(p.bookingDate).toLocaleDateString('en-IN') : '',
        p.bookingType || '',
        pb.basePrice || 0,
        pb.gst || 0,
        pb.platformFee || 0,
        pb.discount || 0,
        p.amount || 0,
        p.ownerEarnings || 0,
        p.paymentStatus || '',
        p.status || '',
        p.paymentDetails?.paidAt ? new Date(p.paymentDetails.paidAt).toLocaleDateString('en-IN') : '',
        new Date(p.createdAt).toLocaleDateString('en-IN')
      ];
    });

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${filterLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredPayments.length} records exported!`);
  };

  const openModal = (payment) => {
    setSelectedPayment(payment);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPayment(null);
    setModalOpen(false);
    setLedgerAction(null);
    setLedgerForm({ amount: '', note: '', txnId: '' });
  };

  const handleLedgerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment || !ledgerAction) return;
    const amt = parseFloat(ledgerForm.amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setLedgerSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/bookings/${selectedPayment._id}/ledger/${ledgerAction}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: amt, note: ledgerForm.note, txnId: ledgerForm.txnId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(ledgerAction === 'payment' ? 'Payment recorded' : 'Refund recorded');
        setSelectedPayment(data.booking);
        setLedgerAction(null);
        setLedgerForm({ amount: '', note: '', txnId: '' });
        fetchPayments();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLedgerSubmitting(false);
    }
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // stats come from backend — no frontend computation needed

  if (loading) {
    return (
      <AdminLayout title="Payments Management" subtitle="Loading payments...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payments Management" subtitle={`Showing ${filteredPayments.length} transactions`}>
      <PermissionGuard permission="payments">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-3 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-dark-800">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-soft border border-green-200 p-3 min-w-0">
            <p className="text-xs text-green-600 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-700">{stats.paid}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-soft border border-yellow-200 p-3 min-w-0">
            <p className="text-xs text-yellow-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-soft border border-red-200 p-3 min-w-0">
            <p className="text-xs text-red-600 mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-soft border border-blue-200 p-3 min-w-0">
            <p className="text-xs text-blue-600 mb-1">Paid Amount</p>
            <p className="text-base font-bold text-blue-700 truncate">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-teal-50 rounded-lg shadow-soft border border-teal-200 p-3 min-w-0">
            <p className="text-xs text-teal-600 mb-1">Owner Earnings</p>
            <p className="text-base font-bold text-teal-700 truncate">₹{stats.ownerEarnings.toLocaleString('en-IN')}</p>
          </div>
        </div>

      {/* ── Top Venues Analytics — collapsible tab ── */}
      <div className="mb-6">
        <button
          onClick={() => setShowAnalytics(p => !p)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
            showAnalytics
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:text-primary-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Top Venues Performance
          {analytics?.summary && showAnalytics && (
            <span className="ml-1 text-xs opacity-80">· {analytics.summary.uniqueVenueCount} venues</span>
          )}
          <span className="ml-1 text-xs opacity-70">{showAnalytics ? '▲' : '▼'}</span>
        </button>

        {showAnalytics && (
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5 mt-3">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Top Venues Performance</h2>
            {analytics?.summary && (
              <span className="text-xs text-gray-500 ml-1">
                · {analytics.summary.uniqueVenueCount} venues · {analytics.summary.totalBookings} bookings
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {[
              { val: 'all',   label: 'All Time' },
              { val: 'month', label: 'This Month' },
              { val: 'week',  label: 'This Week' },
              { val: 'year',  label: 'This Year' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setAnalyticsPeriod(opt.val)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  analyticsPeriod === opt.val
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : analytics && analytics.topVenues && analytics.topVenues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-2.5 text-left">#</th>
                  <th className="px-4 py-2.5 text-left">Venue</th>
                  <th className="px-4 py-2.5 text-center">Bookings</th>
                  <th className="px-4 py-2.5 text-center">Confirmed</th>
                  <th className="px-4 py-2.5 text-center">Completed</th>
                  <th className="px-4 py-2.5 text-center">Cancelled</th>
                  <th className="px-4 py-2.5 text-right">Total Revenue</th>
                  <th className="px-4 py-2.5 text-right">Paid Revenue</th>
                  <th className="px-4 py-2.5 text-right">Avg Booking</th>
                  <th className="px-4 py-2.5 text-right">Owner Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.topVenues.map((v, i) => {
                  const total = v.totalBookings || 1;
                  const successRate = Math.round(((v.confirmedCount + v.completedCount) / total) * 100);
                  return (
                    <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-200 text-gray-600' :
                          i === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {v.venue?.images?.[0]?.url
                              ? <img src={v.venue.images[0].url} alt="" className="w-full h-full object-cover" />
                              : <Building2 className="w-4 h-4 text-gray-400" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-xs">{v.venue?.businessName || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{v.venue?.location?.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-gray-800">{v.totalBookings}</span>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div className="bg-primary-500 h-1 rounded-full" style={{ width: `${successRate}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{successRate}% success</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{v.confirmedCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{v.completedCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{v.cancelledCount}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">₹{(v.totalRevenue || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">₹{(v.paidRevenue || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{Math.round(v.avgBookingValue || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-primary-600">₹{(v.ownerEarnings || 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No data available</p>
          </div>
        )}
      </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-4 mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by payment ID, customer, or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {/* Status Filter */}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            {/* CSV Export */}
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Date Filters Row */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filter by:</span>
            {[
              { val: 'all', label: 'All Time' },
              { val: 'today', label: 'Today' },
              { val: 'week', label: 'This Week' },
              { val: 'month', label: 'This Month' },
              { val: 'year', label: 'Year' },
              { val: 'fy', label: 'Financial Year' },
              { val: 'custom', label: 'Custom Range' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setDateFilter(opt.val)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  dateFilter === opt.val ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {opt.label}
              </button>
            ))}
            {dateFilter === 'year' && (
              <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">Select Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            {dateFilter === 'fy' && (
              <select value={fyFilter} onChange={e => setFyFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">Select FY</option>
                {fyOptions.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
              </select>
            )}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                <span className="text-gray-400 text-xs">to</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">Showing {filteredPayments.length} payments</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner Gets</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-700">{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-semibold text-dark-800">
                        {payment.paymentDetails?.razorpay_payment_id?.slice(0, 20) || 'N/A'}...
                      </p>
                      <p className="font-mono text-xs text-gray-500">
                        {payment.paymentDetails?.razorpay_order_id?.slice(0, 20) || 'N/A'}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-dark-800">{payment.customer?.name}</p>
                          <p className="text-xs text-gray-500">{payment.customer?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-dark-800">{payment.venue?.businessName}</p>
                          <p className="text-xs text-gray-500">{payment.venue?.location?.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-lg text-primary-600">₹{payment.amount?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-green-600">₹{payment.ownerEarnings?.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getPaymentStatusBadge(payment.paymentStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {payment.paymentDetails?.paidAt 
                          ? new Date(payment.paymentDetails.paidAt).toLocaleDateString()
                          : new Date(payment.createdAt).toLocaleDateString()
                        }
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(payment)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => setHistoryBooking(payment)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
                        title="Payment History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {modalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-dark-800">Payment Details</h2>
                <p className="text-sm text-gray-600">Transaction ID: #{selectedPayment._id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                <InvoiceDownload booking={selectedPayment} userRole="admin" />
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Payment Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  {getPaymentStatusBadge(selectedPayment.paymentStatus)}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-primary-600">₹{selectedPayment.amount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Razorpay Payment Details */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold mb-3 text-blue-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Razorpay Transaction Details
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-600 mb-1">Payment ID</p>
                    <p className="font-mono text-xs font-semibold text-gray-900 break-all">
                      {selectedPayment.paymentDetails?.razorpay_payment_id || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-600 mb-1">Order ID</p>
                    <p className="font-mono text-xs font-semibold text-gray-900 break-all">
                      {selectedPayment.paymentDetails?.razorpay_order_id || 'N/A'}
                    </p>
                  </div>
                  {selectedPayment.paymentDetails?.paidAt && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-600 mb-1">Payment Date & Time</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedPayment.paymentDetails.paidAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold mb-3 text-green-900 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Financial Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 flex justify-between items-center">
                    <span className="text-gray-700">Total Amount Paid</span>
                    <span className="text-xl font-bold text-primary-600">
                      ₹{selectedPayment.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <span className="text-gray-700">Platform Commission</span>
                      <span className="text-xs text-gray-500 ml-2">({selectedPayment.commissionRate}%)</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">
                      ₹{selectedPayment.commission?.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 flex justify-between items-center border-2 border-green-300">
                    <span className="text-lg font-semibold text-gray-900">Owner Receives</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{selectedPayment.ownerEarnings?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.customer?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.customerDetails?.phone || selectedPayment.customer?.phone}</p>
                  </div>
                  {selectedPayment.customerDetails?.eventType && (
                    <div>
                      <p className="text-gray-600">Event Type</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.customerDetails.eventType}</p>
                    </div>
                  )}
                  {selectedPayment.customerDetails?.guestCount && (
                    <div>
                      <p className="text-gray-600">Guest Count</p>
                      <p className="font-semibold text-gray-900">{selectedPayment.customerDetails.guestCount} Guests</p>
                    </div>
                  )}
                </div>
                {selectedPayment.customerDetails?.specialRequirements && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-gray-600 text-xs mb-1">Special Requirements:</p>
                    <p className="text-sm text-gray-900">{selectedPayment.customerDetails.specialRequirements}</p>
                  </div>
                )}
              </div>

              {/* Venue Details */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-orange-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Venue Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Venue Name</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.venue?.businessName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPayment.venue?.location?.city}, {selectedPayment.venue?.location?.area}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Owner</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.venue?.owner?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Owner Contact</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.venue?.owner?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Booking Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Booking Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedPayment.bookingDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time Slot</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPayment.startTime} - {selectedPayment.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Booking Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedPayment.bookingType}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Booking Status</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedPayment.status}</p>
                  </div>
                </div>
              </div>

              {/* ── Payment Ledger (Admin) ── */}
              {(() => {
                const ledger = selectedPayment.paymentLedger;
                const amountDue = ledger?.amountDue ?? selectedPayment.amount;
                const totalPaid = ledger?.totalPaid ?? 0;
                const refundDue = ledger?.refundDue ?? 0;
                const txns = ledger?.transactions || [];
                const adjustments = ledger?.adjustments || [];
                return (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b border-gray-200">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><History className="w-4 h-4" />Payment Ledger</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setLedgerAction('payment')} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Record Payment
                        </button>
                        <button onClick={() => setLedgerAction('refund')} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5" /> Record Refund
                        </button>
                      </div>
                    </div>

                    {/* Balance Summary */}
                    <div className="grid grid-cols-3 divide-x divide-gray-200 bg-white">
                      <div className="p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Total Due</p>
                        <p className="text-xl font-black text-gray-900">₹{selectedPayment.amount?.toLocaleString()}</p>
                      </div>
                      <div className="p-4 text-center bg-green-50">
                        <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                        <p className="text-xl font-black text-green-600">₹{totalPaid.toLocaleString()}</p>
                      </div>
                      <div className={`p-4 text-center ${refundDue > 0 ? 'bg-blue-50' : amountDue > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                        <p className="text-xs text-gray-500 mb-1">{refundDue > 0 ? '🔵 Refund Due' : amountDue > 0 ? '🔴 Balance Due' : '✅ Settled'}</p>
                        <p className={`text-xl font-black ${refundDue > 0 ? 'text-blue-600' : amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {refundDue > 0 ? `₹${refundDue.toLocaleString()}` : amountDue > 0 ? `₹${amountDue.toLocaleString()}` : 'Clear'}
                        </p>
                      </div>
                    </div>

                    {/* Record Payment/Refund Form */}
                    {ledgerAction && (
                      <form onSubmit={handleLedgerSubmit} className="border-t border-gray-200 p-4 bg-white">
                        <p className="text-sm font-bold text-gray-800 mb-3">
                          {ledgerAction === 'payment' ? '💵 Record Manual Payment (Cash/Cheque/Bank Transfer)' : '↩️ Record Refund'}
                        </p>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹) *</label>
                            <input type="number" required min="1" value={ledgerForm.amount} onChange={e => setLedgerForm({...ledgerForm, amount: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                              placeholder={ledgerAction === 'payment' ? `Due: ₹${amountDue}` : `Refund: ₹${refundDue}`} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Txn Ref / UTR</label>
                            <input type="text" value={ledgerForm.txnId} onChange={e => setLedgerForm({...ledgerForm, txnId: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                              placeholder="UTR / Cheque No." />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Note</label>
                            <input type="text" value={ledgerForm.note} onChange={e => setLedgerForm({...ledgerForm, note: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                              placeholder="Cash / NEFT / UPI..." />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={ledgerSubmitting}
                            className={`px-4 py-2 text-white rounded-lg text-sm font-semibold disabled:opacity-60 ${ledgerAction === 'payment' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                            {ledgerSubmitting ? 'Saving...' : ledgerAction === 'payment' ? 'Save Payment' : 'Save Refund'}
                          </button>
                          <button type="button" onClick={() => setLedgerAction(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        </div>
                      </form>
                    )}

                    {/* Transaction History */}
                    <div className="border-t border-gray-200 p-4 bg-white">
                      <p className="text-xs font-bold text-gray-600 mb-3">Transaction History</p>
                      {txns.length === 0 && adjustments.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">No transactions recorded yet</p>
                      ) : (
                        <div className="space-y-3">
                          {adjustments.map((adj, i) => (
                            <div key={`adj-${i}`} className="flex items-start gap-3 text-xs p-3 bg-orange-50 rounded-lg border border-orange-100">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${adj.difference > 0 ? 'bg-orange-200 text-orange-700' : 'bg-blue-200 text-blue-700'}`}>
                                {adj.difference > 0 ? '▲' : '▼'}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-gray-800">Booking Modified</p>
                                <p className="text-gray-600">{adj.difference > 0 ? `+₹${adj.difference.toLocaleString()} additional due` : `₹${Math.abs(adj.difference).toLocaleString()} refund due`}</p>
                                <p className="text-gray-400 mt-0.5">{new Date(adj.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <div className="text-right text-gray-500">
                                <p>₹{adj.oldAmount?.toLocaleString()}</p>
                                <p className="text-gray-400">→</p>
                                <p className="font-bold text-gray-800">₹{adj.newAmount?.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                          {txns.filter(t => t.type !== 'adjustment').map((txn, i) => (
                            <div key={`txn-${i}`} className={`flex items-start gap-3 text-xs p-3 rounded-lg border ${['payment','manual_payment'].includes(txn.type) ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${['payment','manual_payment'].includes(txn.type) ? 'bg-green-200' : 'bg-red-200'}`}>
                                {['payment','manual_payment'].includes(txn.type) ? <CheckCircle className="w-4 h-4 text-green-700" /> : <XCircle className="w-4 h-4 text-red-700" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-gray-800">
                                  {txn.type === 'payment' ? 'Online Payment (Razorpay)' : txn.type === 'manual_payment' ? 'Manual Payment' : 'Refund Processed'}
                                </p>
                                {txn.txnId && <p className="text-gray-500 font-mono">{txn.txnId}</p>}
                                {txn.note && <p className="text-gray-600">{txn.note}</p>}
                                <p className="text-gray-400 mt-0.5">{new Date(txn.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <p className={`font-black text-base ${['payment','manual_payment'].includes(txn.type) ? 'text-green-600' : 'text-red-600'}`}>
                                {['payment','manual_payment'].includes(txn.type) ? '+' : '-'}₹{txn.amount?.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Payment History Modal */}
      {historyBooking && (
        <PaymentHistoryModal
          booking={historyBooking}
          token={token}
          onClose={() => setHistoryBooking(null)}
          onUpdate={(updated) => {
            setHistoryBooking(updated);
            setPayments(prev => prev.map(p => p._id === updated._id ? updated : p));
          }}
        />
      )}
      </PermissionGuard>
    </AdminLayout>
  );
}
