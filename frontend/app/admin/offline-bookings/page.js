'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import {
  Building2, Calendar, IndianRupee, Clock, MapPin, User,
  Phone, Mail, CheckCircle2, XCircle, Eye, Search, Download,
  Users, ChevronDown, Ban, RefreshCw, Plus, Filter, AlertCircle,
  FileText, Printer, ArrowRight, CreditCard, Check, AlertTriangle, History, X
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function AdminOfflineBookingsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0, totalPages: 1 });

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [viewBooking, setViewBooking] = useState(null);
  const [historyModalBooking, setHistoryModalBooking] = useState(null);
  const [receiptModalData, setReceiptModalData] = useState(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchVenues();
      fetchStats();
      fetchBookings(1);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchBookings(1);
    }
  }, [selectedVenue, bookingStatusFilter, paymentStatusFilter, dateFilter, startDate, endDate]);

  const fetchVenues = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.venues) {
        setVenues(data.venues);
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offline-bookings/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchBookings = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedVenue) params.append('venue', selectedVenue);
      if (bookingStatusFilter !== 'all') params.append('bookingStatus', bookingStatusFilter);
      if (paymentStatusFilter !== 'all') params.append('paymentStatus', paymentStatusFilter);

      if (dateFilter !== 'all' && dateFilter !== 'custom') {
        params.append('dateFilter', dateFilter);
      } else if (dateFilter === 'custom' && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offline-bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setBookings(data.bookings || []);
        if (data.pagination) setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Failed to load offline bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast.error('Network error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedVenue) params.append('venue', selectedVenue);
      if (bookingStatusFilter !== 'all') params.append('bookingStatus', bookingStatusFilter);
      if (paymentStatusFilter !== 'all') params.append('paymentStatus', paymentStatusFilter);
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offline-bookings/reports/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();

      if (result.success && result.data?.length) {
        const rows = result.data;
        const headers = Object.keys(rows[0]);
        const csvContent = [
          headers.join(','),
          ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `all_offline_bookings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Report exported successfully');
      } else {
        toast.error('No records available for export');
      }
    } catch (err) {
      console.error('Error exporting CSV:', err);
      toast.error('Failed to export CSV');
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-receipt-admin');
    if (!element) return;
    setPdfDownloading(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const filename = receiptModalData.type === 'payment'
        ? `Payment_Receipt_${receiptModalData.payment?.receiptNumber || 'receipt'}.pdf`
        : `Booking_Slip_${receiptModalData.booking?.bookingId || 'slip'}.pdf`;
      pdf.save(filename);
      toast.success('Receipt downloaded as PDF successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to download PDF. Please try Print.');
    } finally {
      setPdfDownloading(false);
    }
  };

  return (
    <AdminLayout title="Offline Bookings" subtitle="Admin overview of direct & walk-in bookings across all venues">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt-admin, #printable-receipt-admin * {
            visibility: visible !important;
          }
          #printable-receipt-admin {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            color: #111827 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="space-y-6">

        {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Offline Bookings</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Admin Audit & Oversight
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Track offline walk-in bookings recorded by venue owners, newly registered customer sources, and payments.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export All Data (CSV)
          </button>
        </div>

        {/* ── STATS CARDS ─────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
              <div className="text-xs text-gray-500 mt-1">
                Today: <strong>{stats.todayBookings}</strong> • Month: <strong>{stats.thisMonthBookings}</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹{stats.totalBookingValue?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">Non-cancelled bookings</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">₹{stats.totalAmountCollected?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">Advance: ₹{stats.totalAdvanceCollected?.toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Dues</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">₹{stats.totalBalanceDue?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">Pending collection</p>
            </div>

            <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue Balance</p>
              <p className={`text-2xl font-bold mt-2 ${stats.overdueAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                ₹{stats.overdueAmount?.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stats.overdueCount} booking(s) overdue</p>
            </div>
          </div>
        )}

        {/* ── SEARCH & FILTERS ─────────────────────────────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search Customer, Mobile, Booking ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchBookings(1)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <select
                value={selectedVenue}
                onChange={e => setSelectedVenue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              >
                <option value="">All Venues</option>
                {venues.map(v => (
                  <option key={v._id} value={v._id}>{v.businessName}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={paymentStatusFilter}
                onChange={e => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium"
              >
                <option value="all">All Payment Status</option>
                <option value="Paid">Fully Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue Balance</option>
              </select>
            </div>

            <div>
              <select
                value={bookingStatusFilter}
                onChange={e => setBookingStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              >
                <option value="all">All Booking Status</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Tentative">Tentative</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── TABLE ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Event Date & Slot</th>
                  <th className="px-4 py-3">Financials</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Booking Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                      Loading bookings...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      No offline bookings recorded yet.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-md border border-gray-200">
                          {b.bookingId}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{b.customerName}</p>
                        <p className="text-xs text-gray-500">{b.customerPhone}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{b.venueName}</p>
                        {b.hallName && <p className="text-xs text-gray-400">Hall: {b.hallName}</p>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900">
                          {new Date(b.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500">{b.eventSlot} • {b.eventType}</p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs">Total: <strong>₹{b.totalAmount?.toLocaleString('en-IN')}</strong></div>
                        <div className="text-xs text-emerald-700">Paid: <strong>₹{b.totalPaid?.toLocaleString('en-IN')}</strong></div>
                        <div className="text-xs text-amber-700">Due: <strong>₹{b.balanceDue?.toLocaleString('en-IN')}</strong></div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          b.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.paymentStatus === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {b.paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          b.bookingStatus === 'Confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : b.bookingStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.bookingStatus === 'Tentative'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-200 text-gray-700 line-through'
                        }`}>
                          {b.bookingStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewBooking(b)}
                            title="View Details"
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setHistoryModalBooking(b)}
                            title="Payment History"
                            className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReceiptModalData({ type: 'booking', booking: b })}
                            title="Print Slip"
                            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs">
              <span className="text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchBookings(pagination.page - 1)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchBookings(pagination.page + 1)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── MODALS (VIEW & RECEIPT) ───────────────────────────────────────── */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Booking: {viewBooking.bookingId}</h3>
              <button onClick={() => setViewBooking(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 pt-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Customer:</span> <strong className="block">{viewBooking.customerName}</strong></div>
                <div><span className="text-gray-500">Phone:</span> <strong className="block">{viewBooking.customerPhone}</strong></div>
                {viewBooking.customerEmail && <div className="col-span-2"><span className="text-gray-500">Email:</span> {viewBooking.customerEmail}</div>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Venue:</span> <p className="font-semibold">{viewBooking.venueName}</p></div>
                <div><span className="text-gray-500">Hall:</span> <p className="font-semibold">{viewBooking.hallName || 'Main'}</p></div>
                <div><span className="text-gray-500">Date:</span> <p className="font-semibold">{new Date(viewBooking.eventDate).toLocaleDateString('en-IN')}</p></div>
                <div><span className="text-gray-500">Slot:</span> <p className="font-semibold">{viewBooking.eventSlot}</p></div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <div className="flex justify-between"><span>Total:</span> <strong>₹{viewBooking.totalAmount?.toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between text-emerald-700"><span>Paid:</span> <strong>₹{viewBooking.totalPaid?.toLocaleString('en-IN')}</strong></div>
                <div className="flex justify-between text-amber-700"><span>Balance Due:</span> <strong>₹{viewBooking.balanceDue?.toLocaleString('en-IN')}</strong></div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setViewBooking(null)} className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Payment Records ({historyModalBooking.bookingId})</h3>
              <button onClick={() => setHistoryModalBooking(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-2 text-xs">
              {!historyModalBooking.payments?.length ? (
                <p className="text-center text-gray-500 py-6">No payments recorded</p>
              ) : (
                historyModalBooking.payments.map((p, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-mono font-semibold">{p.receiptNumber} • {p.paymentMode}</p>
                      <p className="text-gray-400 text-[11px]">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</p>
                    </div>
                    <strong className="text-emerald-700 font-bold text-sm">₹{p.amount?.toLocaleString('en-IN')}</strong>
                  </div>
                ))
              )}
            </div>
            <div className="pt-3 border-t border-gray-100 text-right">
              <button onClick={() => setHistoryModalBooking(null)} className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Definition Receipt Modal for Admin */}
      {receiptModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-gray-200 animate-in fade-in my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {receiptModalData.type === 'booking' ? 'Booking Confirmation Slip' : 'Payment Receipt'}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-semibold">
                  {receiptModalData.booking?.bookingId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {pdfDownloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setReceiptModalData(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-receipt-admin" className="p-6 bg-white border border-gray-200 rounded-xl my-3 text-gray-900 text-xs space-y-4">
              <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">RENTALMEET</h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Offline Venue Booking Slip</p>
                  <p className="font-bold text-gray-900 text-sm mt-1">{receiptModalData.booking?.venueName}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded uppercase">
                    {receiptModalData.type === 'booking' ? 'Booking Slip' : 'Payment Receipt'}
                  </span>
                  <p className="font-mono font-bold text-xs mt-2">ID: {receiptModalData.booking?.bookingId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Customer</p>
                  <p className="text-sm font-bold text-gray-900">{receiptModalData.booking?.customerName}</p>
                  <p className="text-gray-600 font-semibold">{receiptModalData.booking?.customerPhone}</p>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Event Schedule</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(receiptModalData.booking?.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-gray-700 font-semibold">{receiptModalData.booking?.eventSlot} • {receiptModalData.booking?.eventType}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-gray-100 text-xs">
                    <tr>
                      <td className="px-3.5 py-2.5 font-bold text-gray-900">Total Booking Amount:</td>
                      <td className="px-3.5 py-2.5 font-bold text-right text-gray-900">₹{receiptModalData.booking?.totalAmount?.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 text-gray-600">Total Collected So Far:</td>
                      <td className="px-3.5 py-2 font-bold text-right text-emerald-700">₹{receiptModalData.booking?.totalPaid?.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-gray-100/70 border-t-2 border-gray-300">
                      <td className="px-3.5 py-2.5 font-bold text-gray-900 uppercase">Net Balance Due:</td>
                      <td className="px-3.5 py-2.5 font-black text-right text-amber-700 text-base">₹{receiptModalData.booking?.balanceDue?.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
                Official Booking Record on RentalMeet Platform.
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end no-print">
              <button onClick={() => setReceiptModalData(null)} className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
