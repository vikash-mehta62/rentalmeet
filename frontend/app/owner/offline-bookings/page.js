'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import {
  Building2, Calendar, IndianRupee, Clock, MapPin, User,
  Phone, Mail, CheckCircle2, XCircle, Eye, Search, Download,
  Users, ChevronDown, Ban, RefreshCw, Plus, Filter, AlertCircle,
  FileText, Printer, ArrowRight, CreditCard, Check, AlertTriangle, Edit, History, X
} from 'lucide-react';
import OwnerLayout from '@/components/owner/OwnerLayout';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function OwnerOfflineBookingsPage() {
  const { token, user } = useAuthStore();
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
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [historyModalBooking, setHistoryModalBooking] = useState(null);
  const [receiptModalData, setReceiptModalData] = useState(null); // { type: 'booking' | 'payment', booking, payment }
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // New Booking Form State
  const initialFormState = {
    venue: '',
    hallName: '',
    customerPhone: '',
    customerName: '',
    customerEmail: '',
    eventDate: '',
    eventSlot: 'Full Day',
    eventType: 'Wedding',
    customEventType: '',
    guestCount: '',
    startTime: '',
    endTime: '',
    foodPackage: '',
    decorationRequirements: '',
    specialRequests: '',
    idProofType: '',
    idProofNumber: '',
    totalAmount: '',
    advanceAmount: '',
    paymentMode: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    expectedFinalPaymentDate: '',
    transactionReference: '',
    bookingStatus: 'Confirmed',
    notes: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState(initialFormState);
  const [isExistingCustomer, setIsExistingCustomer] = useState(null);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [slotChecking, setSlotChecking] = useState(false);
  const [slotAvailability, setSlotAvailability] = useState(null);

  // Record Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionReference: '',
    notes: ''
  });

  // Load initial data
  useEffect(() => {
    if (token) {
      fetchVenues();
      fetchStats();
      fetchBookings(1);
    }
  }, [token]);

  // Refetch when filters change
  useEffect(() => {
    if (token) {
      fetchBookings(1);
    }
  }, [selectedVenue, bookingStatusFilter, paymentStatusFilter, paymentModeFilter, dateFilter, startDate, endDate]);

  const fetchVenues = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.venues) {
        setVenues(data.venues);
      }
    } catch (err) {
      console.error('Error fetching owner venues:', err);
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
      console.error('Error fetching offline stats:', err);
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
      if (paymentModeFilter !== 'all') params.append('paymentMode', paymentModeFilter);

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
      console.error('Error fetching offline bookings:', err);
      toast.error('Network error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  // Customer phone auto-lookup
  const handlePhoneChange = async (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, customerPhone: rawVal }));

    if (rawVal.length === 10) {
      setCustomerLookupLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offline-bookings/lookup-customer?phone=${rawVal}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.exists && data.customer) {
          setIsExistingCustomer(true);
          setFormData(prev => ({
            ...prev,
            customerName: data.customer.name || prev.customerName,
            customerEmail: data.customer.email || prev.customerEmail
          }));
          toast.success(`Existing customer found: ${data.customer.name}`);
        } else {
          setIsExistingCustomer(false);
        }
      } catch (err) {
        console.error('Error looking up customer:', err);
        setIsExistingCustomer(false);
      } finally {
        setCustomerLookupLoading(false);
      }
    } else {
      setIsExistingCustomer(null);
    }
  };

  // Check date & slot availability real-time
  const checkSlotAvailability = async (venueId, eventDate, eventSlot, excludeBookingId = null) => {
    if (!venueId || !eventDate || !eventSlot) {
      setSlotAvailability(null);
      return;
    }
    setSlotChecking(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offline-bookings/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ venueId, eventDate, eventSlot, excludeBookingId })
      });
      const data = await res.json();
      if (data.success) {
        setSlotAvailability(data);
      }
    } catch (err) {
      console.error('Error checking availability:', err);
    } finally {
      setSlotChecking(false);
    }
  };

  // Create Offline Booking
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.venue) return toast.error('Please select a venue');
    if (!formData.customerPhone || formData.customerPhone.length !== 10) {
      return toast.error('Please enter a valid 10-digit mobile number');
    }
    if (!formData.customerName.trim()) return toast.error('Please enter customer name');
    if (!formData.eventDate) return toast.error('Please select an event date');
    if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
      return toast.error('Please enter a valid total booking amount');
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offline-bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Offline booking created successfully!');
        setCreateModalOpen(false);
        setFormData(initialFormState);
        setIsExistingCustomer(null);
        setSlotAvailability(null);
        fetchStats();
        fetchBookings(1);

        if (data.booking) {
          setReceiptModalData({ type: 'booking', booking: data.booking });
        }
      } else {
        toast.error(data.message || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error creating offline booking:', err);
      toast.error('An error occurred while creating booking');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (b) => {
    setEditBooking(b);
    setEditFormData({
      venue: b.venue?._id || b.venue,
      hallName: b.hallName || '',
      customerPhone: b.customerPhone || '',
      customerName: b.customerName || '',
      customerEmail: b.customerEmail || '',
      eventDate: b.eventDate ? new Date(b.eventDate).toISOString().split('T')[0] : '',
      eventSlot: b.eventSlot || 'Full Day',
      eventType: b.eventType || 'Wedding',
      customEventType: b.customEventType || '',
      guestCount: b.guestCount || '',
      startTime: b.startTime || '',
      endTime: b.endTime || '',
      foodPackage: b.foodPackage || '',
      decorationRequirements: b.decorationRequirements || '',
      specialRequests: b.specialRequests || '',
      idProofType: b.idProofType || '',
      idProofNumber: b.idProofNumber || '',
      totalAmount: b.totalAmount || '',
      expectedFinalPaymentDate: b.expectedFinalPaymentDate ? new Date(b.expectedFinalPaymentDate).toISOString().split('T')[0] : '',
      bookingStatus: b.bookingStatus || 'Confirmed',
      notes: b.notes || ''
    });
    setSlotAvailability(null);
    setEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editBooking) return;

    if (!editFormData.customerPhone || editFormData.customerPhone.length !== 10) {
      return toast.error('Please enter a valid 10-digit mobile number');
    }
    if (!editFormData.customerName.trim()) return toast.error('Please enter customer name');
    if (!editFormData.eventDate) return toast.error('Please select an event date');
    if (!editFormData.totalAmount || Number(editFormData.totalAmount) <= 0) {
      return toast.error('Please enter a valid total booking amount');
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offline-bookings/${editBooking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Offline booking updated successfully!');
        setEditModalOpen(false);
        setEditBooking(null);
        fetchStats();
        fetchBookings(pagination.page);
      } else {
        toast.error(data.message || 'Failed to update booking');
      }
    } catch (err) {
      console.error('Error updating offline booking:', err);
      toast.error('An error occurred while updating booking');
    } finally {
      setSubmitting(false);
    }
  };

  // Record Payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentModalBooking) return;
    const numAmount = Number(paymentForm.amount);
    if (!numAmount || numAmount <= 0) return toast.error('Please enter a valid payment amount');

    if (numAmount > paymentModalBooking.balanceDue) {
      return toast.error(`Amount exceeds remaining balance of ₹${paymentModalBooking.balanceDue}`);
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offline-bookings/${paymentModalBooking._id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(paymentForm)
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Payment recorded successfully!');
        const updatedBooking = data.booking;
        const newReceipt = data.receipt;

        setPaymentModalBooking(null);
        setPaymentForm({
          amount: '',
          paymentMode: 'Cash',
          paymentDate: new Date().toISOString().split('T')[0],
          transactionReference: '',
          notes: ''
        });
        fetchStats();
        fetchBookings(pagination.page);

        setReceiptModalData({
          type: 'payment',
          booking: updatedBooking,
          payment: newReceipt
        });
      } else {
        toast.error(data.message || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Booking
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalBooking) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offline-bookings/${cancelModalBooking._id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cancellationReason: cancelReason })
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Booking cancelled and slot released successfully');
        setCancelModalBooking(null);
        setCancelReason('');
        fetchStats();
        fetchBookings(pagination.page);
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error('Failed to cancel booking');
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV
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
        link.setAttribute('download', `offline_bookings_${new Date().toISOString().split('T')[0]}.csv`);
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

  // High Quality PDF Download for Receipt
  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-receipt');
    if (!element) return;
    setPdfDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
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

  const calculatedBalance = Math.max(0, (Number(formData.totalAmount) || 0) - (Number(formData.advanceAmount) || 0));
  const previewPaymentStatus = (Number(formData.advanceAmount) || 0) === 0
    ? 'Pending'
    : calculatedBalance === 0
    ? 'Paid'
    : 'Partially Paid';

  return (
    <OwnerLayout title="Offline Bookings" subtitle="Manage walk-in bookings, collections & balance dues">
      {/* ── GLOBAL PRINT STYLES FOR CLEAN INVOICE PRINTING ── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
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

        {/* ── TOP HEADER & ACTIONS ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Offline Bookings</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                Direct / Walk-In
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Add walk-in bookings on a single page, auto-calculate balances & block calendar slots online.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => {
                setFormData(initialFormState);
                setIsExistingCustomer(null);
                setSlotAvailability(null);
                setCreateModalOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all shadow-primary-200"
            >
              <Plus className="w-4 h-4" />
              New Offline Booking
            </button>
          </div>
        </div>

        {/* ── STATS CARDS ─────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</p>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>Today: <strong>{stats.todayBookings}</strong></span>
                <span>•</span>
                <span>This Month: <strong>{stats.thisMonthBookings}</strong></span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</p>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹{stats.totalBookingValue?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">Valid non-cancelled bookings</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collected</p>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">₹{stats.totalAmountCollected?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">Advance: ₹{stats.totalAdvanceCollected?.toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Due</p>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">₹{stats.totalBalanceDue?.toLocaleString('en-IN')}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                <span>Partially: <strong>{stats.partiallyPaidCount}</strong></span>
                <span>•</span>
                <span>Pending: <strong>{stats.pendingPaymentCount}</strong></span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue Balance</p>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold mt-2 ${stats.overdueAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                ₹{stats.overdueAmount?.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.overdueCount > 0 ? `${stats.overdueCount} booking(s) overdue` : 'No overdue payments'}
              </p>
            </div>
          </div>
        )}

        {/* ── SEARCH & FILTERS BAR ─────────────────────────────────────────── */}
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
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <select
                value={selectedVenue}
                onChange={e => setSelectedVenue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">All My Venues</option>
                {venues.map(v => (
                  <option key={v._id} value={v._id}>{v.businessName}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={paymentStatusFilter}
                onChange={e => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white font-medium"
              >
                <option value="all">All Payment Status</option>
                <option value="Paid">Fully Paid (Balance ₹0)</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending (No Payment)</option>
                <option value="Overdue">Overdue Balance</option>
              </select>
            </div>

            <div>
              <select
                value={bookingStatusFilter}
                onChange={e => setBookingStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Booking Status</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Tentative">Tentative</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 text-xs font-medium">
            <span className="text-gray-400 mr-1">Date:</span>
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'upcoming', label: 'Upcoming Events' },
              { id: 'past', label: 'Past Events' },
              { id: 'custom', label: 'Custom Range' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  dateFilter === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-xs"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── BOOKINGS TABLE ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Venue & Hall</th>
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
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                      Loading offline bookings...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                      <p className="font-semibold text-gray-700">No offline bookings found</p>
                      <p className="text-xs text-gray-400 mt-1">Click "New Offline Booking" above to add walk-in bookings.</p>
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const isOverdue = b.expectedFinalPaymentDate &&
                      new Date(b.expectedFinalPaymentDate) < new Date() &&
                      b.balanceDue > 0 &&
                      b.bookingStatus !== 'Cancelled';

                    return (
                      <tr key={b._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                          <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-md border border-gray-200">
                            {b.bookingId}
                          </span>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{b.customerName}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{b.customerPhone}</span>
                          </div>
                          {b.customerEmail && (
                            <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{b.customerEmail}</p>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{b.venueName}</p>
                          {b.hallName && (
                            <p className="text-xs text-gray-500">Hall: {b.hallName}</p>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-semibold text-gray-900">
                            {new Date(b.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-medium">
                              {b.eventSlot}
                            </span>
                            <span>•</span>
                            <span className="text-gray-500">{b.eventType}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs">
                            <span className="text-gray-500">Total:</span>{' '}
                            <strong className="text-gray-900">₹{b.totalAmount?.toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="text-xs text-emerald-700 mt-0.5">
                            <span>Paid:</span> <strong>₹{b.totalPaid?.toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="text-xs text-amber-700 mt-0.5">
                            <span>Due:</span> <strong>₹{b.balanceDue?.toLocaleString('en-IN')}</strong>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            b.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {b.paymentStatus === 'Paid' && <Check className="w-3 h-3" />}
                            {b.paymentStatus}
                          </span>
                          {isOverdue && (
                            <div className="text-[10px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Overdue
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
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
                            {/* View Details */}
                            <button
                              onClick={() => setViewBooking(b)}
                              title="View Details"
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit Booking */}
                            {b.bookingStatus !== 'Cancelled' && (
                              <button
                                onClick={() => handleOpenEdit(b)}
                                title="Edit Booking"
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {/* Record Payment */}
                            {b.balanceDue > 0 && b.bookingStatus !== 'Cancelled' && (
                              <button
                                onClick={() => {
                                  setPaymentModalBooking(b);
                                  setPaymentForm({
                                    amount: b.balanceDue.toString(),
                                    paymentMode: 'Cash',
                                    paymentDate: new Date().toISOString().split('T')[0],
                                    transactionReference: '',
                                    notes: ''
                                  });
                                }}
                                title="Record Payment"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
                              >
                                <IndianRupee className="w-3 h-3" />
                                Pay
                              </button>
                            )}

                            {/* Payment History */}
                            <button
                              onClick={() => setHistoryModalBooking(b)}
                              title="Payment History"
                              className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {/* Booking Receipt Slip */}
                            <button
                              onClick={() => setReceiptModalData({ type: 'booking', booking: b })}
                              title="Print Confirmation Slip"
                              className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Cancel Booking */}
                            {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Completed' && (
                              <button
                                onClick={() => setCancelModalBooking(b)}
                                title="Cancel Booking"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs">
              <span className="text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} bookings
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchBookings(pagination.page - 1)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="font-semibold text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchBookings(pagination.page + 1)}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── CREATE OFFLINE BOOKING MODAL (SINGLE-PAGE FORM) ─────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create Offline Booking</h2>
                <p className="text-xs text-gray-500">Single-page walk-in booking creation & instant calendar sync</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* 1. Customer Information */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-600" />
                    1. Customer Information
                  </h3>
                  {customerLookupLoading && (
                    <span className="text-xs text-primary-600 flex items-center gap-1 font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Checking phone...
                    </span>
                  )}
                  {isExistingCustomer === true && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Existing Customer (Auto-filled)
                    </span>
                  )}
                  {isExistingCustomer === false && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      New Customer (Auto-registers with Venue Tag)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={formData.customerPhone}
                      onChange={handlePhoneChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.customerEmail}
                      onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Venue & Event Details */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-600" />
                    2. Venue & Event Details
                  </h3>
                  {slotChecking && (
                    <span className="text-xs text-primary-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Checking slot...
                    </span>
                  )}
                  {slotAvailability && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      slotAvailability.available
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {slotAvailability.available ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {slotAvailability.available ? 'Slot Available' : slotAvailability.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Select Venue <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.venue}
                      onChange={e => {
                        const newVenue = e.target.value;
                        setFormData({ ...formData, venue: newVenue });
                        checkSlotAvailability(newVenue, formData.eventDate, formData.eventSlot);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    >
                      <option value="">-- Choose Venue --</option>
                      {venues.map(v => (
                        <option key={v._id} value={v._id}>{v.businessName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Hall / Area Name <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Banquet Hall A, Lawn 1"
                      value={formData.hallName}
                      onChange={e => setFormData({ ...formData, hallName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.eventDate}
                      onChange={e => {
                        const newDate = e.target.value;
                        setFormData({ ...formData, eventDate: newDate });
                        checkSlotAvailability(formData.venue, newDate, formData.eventSlot);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Time Slot <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.eventSlot}
                      onChange={e => {
                        const newSlot = e.target.value;
                        setFormData({ ...formData, eventSlot: newSlot });
                        checkSlotAvailability(formData.venue, formData.eventDate, newSlot);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                    >
                      <option value="Full Day">Full Day (Conflicts with Morning & Evening)</option>
                      <option value="Morning">Morning Slot</option>
                      <option value="Evening">Evening Slot</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Event Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.eventType}
                      onChange={e => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    >
                      <option value="Wedding">Wedding</option>
                      <option value="Birthday">Birthday Party</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Reception">Reception</option>
                      <option value="Corporate">Corporate Event</option>
                      <option value="Other">Other Event</option>
                    </select>
                  </div>

                  {formData.eventType === 'Other' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Custom Event Type <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Exhibition"
                        value={formData.customEventType}
                        onChange={e => setFormData({ ...formData, customEventType: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Expected Guests <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 250"
                      value={formData.guestCount}
                      onChange={e => setFormData({ ...formData, guestCount: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Financials & Payment Breakdown */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-primary-600" />
                  3. Financial Details & Payment Calculation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Total Booking Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="₹ Total agreed amount"
                      value={formData.totalAmount}
                      onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Advance Paid Now (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="₹ Advance received"
                      value={formData.advanceAmount}
                      onChange={e => setFormData({ ...formData, advanceAmount: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Balance Due (Auto Calculated)
                    </label>
                    <div className="px-3 py-2 text-sm font-bold bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
                      ₹{calculatedBalance.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {Number(formData.advanceAmount) > 0 && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Payment Mode <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.paymentMode}
                          onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Payment Date
                        </label>
                        <input
                          type="date"
                          value={formData.paymentDate}
                          onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Transaction / Cheque Ref <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="UTR / Cheque No."
                          value={formData.transactionReference}
                          onChange={e => setFormData({ ...formData, transactionReference: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Expected Final Payment Date <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.expectedFinalPaymentDate}
                      onChange={e => setFormData({ ...formData, expectedFinalPaymentDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Initial Payment Status
                    </label>
                    <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold w-full justify-center ${
                      previewPaymentStatus === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : previewPaymentStatus === 'Partially Paid'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {previewPaymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Additional Packages & Notes (Optional) */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  4. Additional Notes & Requirements (Optional)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Food / Catering Package
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Standard Veg Buffet, 300 plates"
                      value={formData.foodPackage}
                      onChange={e => setFormData({ ...formData, foodPackage: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Decoration Requirements
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stage floral decor, entrance arch"
                      value={formData.decorationRequirements}
                      onChange={e => setFormData({ ...formData, decorationRequirements: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ID Proof Type
                    </label>
                    <select
                      value={formData.idProofType}
                      onChange={e => setFormData({ ...formData, idProofType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    >
                      <option value="">None</option>
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ID Proof Number
                    </label>
                    <input
                      type="text"
                      placeholder="ID Number"
                      value={formData.idProofNumber}
                      onChange={e => setFormData({ ...formData, idProofNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Special Requests / Internal Notes
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Any specific requests or remarks..."
                      value={formData.specialRequests}
                      onChange={e => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (slotAvailability && !slotAvailability.available)}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Save Offline Booking
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── EDIT OFFLINE BOOKING MODAL ─────────────────────────────────────── */}
      {editModalOpen && editBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Offline Booking</h2>
                <p className="text-xs text-gray-500">
                  Booking ID: <strong className="font-mono text-gray-800">{editBooking.bookingId}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* 1. Customer Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-600" />
                  1. Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={editFormData.customerPhone}
                      onChange={e => setEditFormData({ ...editFormData, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.customerName}
                      onChange={e => setEditFormData({ ...editFormData, customerName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={editFormData.customerEmail}
                      onChange={e => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Event & Date Details */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-600" />
                    2. Event Schedule & Venue
                  </h3>
                  {slotAvailability && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      slotAvailability.available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {slotAvailability.available ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {slotAvailability.available ? 'Slot Available' : slotAvailability.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hall / Area</label>
                    <input
                      type="text"
                      value={editFormData.hallName}
                      onChange={e => setEditFormData({ ...editFormData, hallName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={editFormData.eventDate}
                      onChange={e => {
                        const newD = e.target.value;
                        setEditFormData({ ...editFormData, eventDate: newD });
                        checkSlotAvailability(editFormData.venue, newD, editFormData.eventSlot, editBooking._id);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Time Slot <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editFormData.eventSlot}
                      onChange={e => {
                        const newS = e.target.value;
                        setEditFormData({ ...editFormData, eventSlot: newS });
                        checkSlotAvailability(editFormData.venue, editFormData.eventDate, newS, editBooking._id);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                    >
                      <option value="Full Day">Full Day</option>
                      <option value="Morning">Morning Slot</option>
                      <option value="Evening">Evening Slot</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Event Type</label>
                    <select
                      value={editFormData.eventType}
                      onChange={e => setEditFormData({ ...editFormData, eventType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    >
                      <option value="Wedding">Wedding</option>
                      <option value="Birthday">Birthday Party</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Reception">Reception</option>
                      <option value="Corporate">Corporate Event</option>
                      <option value="Other">Other Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Guests</label>
                    <input
                      type="number"
                      value={editFormData.guestCount}
                      onChange={e => setEditFormData({ ...editFormData, guestCount: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Booking Status</label>
                    <select
                      value={editFormData.bookingStatus}
                      onChange={e => setEditFormData({ ...editFormData, bookingStatus: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Tentative">Tentative</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Financials & Details */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-primary-600" />
                  3. Financials & Specific Requirements
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Total Booking Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={editFormData.totalAmount}
                      onChange={e => setEditFormData({ ...editFormData, totalAmount: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Total Collected So Far
                    </label>
                    <div className="px-3 py-2 text-sm font-bold bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                      ₹{editBooking.totalPaid?.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      New Balance Due
                    </label>
                    <div className="px-3 py-2 text-sm font-bold bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                      ₹{Math.max(0, (Number(editFormData.totalAmount) || 0) - (editBooking.totalPaid || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Final Payment Date</label>
                    <input
                      type="date"
                      value={editFormData.expectedFinalPaymentDate}
                      onChange={e => setEditFormData({ ...editFormData, expectedFinalPaymentDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Food / Catering</label>
                    <input
                      type="text"
                      value={editFormData.foodPackage}
                      onChange={e => setEditFormData({ ...editFormData, foodPackage: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Decoration</label>
                    <input
                      type="text"
                      value={editFormData.decorationRequirements}
                      onChange={e => setEditFormData({ ...editFormData, decorationRequirements: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Special Notes / Requests</label>
                    <textarea
                      rows="2"
                      value={editFormData.specialRequests}
                      onChange={e => setEditFormData({ ...editFormData, specialRequests: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (slotAvailability && !slotAvailability.available)}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── RECORD PAYMENT MODAL ─────────────────────────────────────────── */}
      {paymentModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Record Payment</h3>
                <p className="text-xs text-gray-500">Booking ID: {paymentModalBooking.bookingId}</p>
              </div>
              <button onClick={() => setPaymentModalBooking(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-amber-800 font-medium">Outstanding Balance:</span>
                <span className="text-amber-900 font-bold text-sm">
                  ₹{paymentModalBooking.balanceDue?.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount Received (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  max={paymentModalBooking.balanceDue}
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={paymentForm.paymentMode}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GPay/PhonePe/Paytm)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Transaction / Cheque Reference <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="UTR / Cheque No."
                  value={paymentForm.transactionReference}
                  onChange={e => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Notes <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared 2nd installment"
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalBooking(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PAYMENT HISTORY MODAL ────────────────────────────────────────── */}
      {historyModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Payment History & Receipts</h3>
                <p className="text-xs text-gray-500">
                  {historyModalBooking.bookingId} • {historyModalBooking.customerName}
                </p>
              </div>
              <button onClick={() => setHistoryModalBooking(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4 p-3 bg-gray-50 rounded-xl text-center text-xs">
              <div>
                <span className="text-gray-500">Total Agreed:</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">₹{historyModalBooking.totalAmount?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-emerald-700">Total Collected:</span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">₹{historyModalBooking.totalPaid?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-amber-700">Balance Due:</span>
                <p className="text-sm font-bold text-amber-700 mt-0.5">₹{historyModalBooking.balanceDue?.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!historyModalBooking.payments || historyModalBooking.payments.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-xs">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {historyModalBooking.payments.map((p, idx) => (
                    <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-xs hover:border-primary-300 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-gray-900">{p.receiptNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">{p.paymentMode}</span>
                        </div>
                        <p className="text-gray-500 text-[11px] mt-1">
                          Date: {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {p.transactionReference && ` • Ref: ${p.transactionReference}`}
                        </p>
                        {p.notes && <p className="text-gray-400 text-[11px] italic mt-0.5">"{p.notes}"</p>}
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">₹{p.amount?.toLocaleString('en-IN')}</p>
                        <button
                          onClick={() => {
                            setReceiptModalData({
                              type: 'payment',
                              booking: historyModalBooking,
                              payment: p
                            });
                          }}
                          className="text-[11px] text-primary-600 hover:underline font-semibold mt-1 inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" /> View / Print Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 text-right">
              <button
                onClick={() => setHistoryModalBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HIGH-DEFINITION PRINTABLE & DOWNLOADABLE RECEIPT MODAL ───────── */}
      {receiptModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-gray-200 animate-in fade-in my-auto">
            {/* Modal Actions Bar (Not printed) */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {receiptModalData.type === 'booking' ? 'Booking Confirmation Slip' : 'Official Payment Receipt'}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-semibold">
                  {receiptModalData.type === 'payment'
                    ? receiptModalData.payment?.receiptNumber
                    : receiptModalData.booking?.bookingId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  {pdfDownloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Slip
                </button>
                <button
                  onClick={() => setReceiptModalData(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── THE PRINTABLE CANVAS (Fits perfectly on A4 paper) ── */}
            <div
              id="printable-receipt"
              className="p-6 bg-white border border-gray-200 rounded-xl my-3 text-gray-900 text-xs font-sans space-y-4"
            >
              {/* Header: Company & Venue Branding */}
              <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">RENTALMEET</h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                    Venue Booking & Event Management Network
                  </p>
                  <div className="mt-2 text-xs">
                    <p className="font-bold text-gray-900 text-sm">{receiptModalData.booking?.venueName}</p>
                    {receiptModalData.booking?.hallName && (
                      <p className="text-gray-600 font-medium">Hall / Lawn: {receiptModalData.booking?.hallName}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded uppercase tracking-wider">
                    {receiptModalData.type === 'booking' ? 'Booking Confirmation Slip' : 'Payment Receipt'}
                  </span>
                  <p className="font-mono font-bold text-xs mt-2 text-gray-900">
                    ID: {receiptModalData.booking?.bookingId}
                  </p>
                  {receiptModalData.type === 'payment' && (
                    <p className="font-mono text-[11px] font-semibold text-emerald-700 mt-0.5">
                      Receipt: {receiptModalData.payment?.receiptNumber}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-500 mt-1">
                    Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Two Column Grid: Customer Details & Event Specification */}
              <div className="grid grid-cols-2 gap-4">
                {/* Customer Details Box */}
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Billed To (Customer)</p>
                  <p className="text-sm font-bold text-gray-900">{receiptModalData.booking?.customerName}</p>
                  <p className="text-gray-600 font-medium flex items-center gap-1">
                    Phone: <span className="font-semibold text-gray-900">{receiptModalData.booking?.customerPhone}</span>
                  </p>
                  {receiptModalData.booking?.customerEmail && (
                    <p className="text-gray-600">Email: {receiptModalData.booking?.customerEmail}</p>
                  )}
                  {receiptModalData.booking?.idProofType && receiptModalData.booking?.idProofNumber && (
                    <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-200">
                      ID Proof: {receiptModalData.booking.idProofType} ({receiptModalData.booking.idProofNumber})
                    </p>
                  )}
                </div>

                {/* Event Details Box */}
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Event Details</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(receiptModalData.booking?.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-gray-700 font-semibold">
                    Slot: <span className="text-primary-700 font-bold">{receiptModalData.booking?.eventSlot}</span>
                    {' • '}
                    <span>{receiptModalData.booking?.eventType}</span>
                  </p>
                  {receiptModalData.booking?.guestCount && (
                    <p className="text-gray-600">Expected Guests: <strong>{receiptModalData.booking.guestCount}</strong></p>
                  )}
                  {receiptModalData.booking?.startTime && (
                    <p className="text-gray-600">Time: {receiptModalData.booking.startTime} - {receiptModalData.booking.endTime}</p>
                  )}
                </div>
              </div>

              {/* Packages & Special Requirements (If any) */}
              {(receiptModalData.booking?.foodPackage || receiptModalData.booking?.decorationRequirements || receiptModalData.booking?.specialRequests) && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1 text-[11px]">
                  <p className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">Requirements & Inclusions</p>
                  {receiptModalData.booking.foodPackage && (
                    <p className="text-gray-800"><strong>Catering:</strong> {receiptModalData.booking.foodPackage}</p>
                  )}
                  {receiptModalData.booking.decorationRequirements && (
                    <p className="text-gray-800"><strong>Decoration:</strong> {receiptModalData.booking.decorationRequirements}</p>
                  )}
                  {receiptModalData.booking.specialRequests && (
                    <p className="text-gray-800"><strong>Special Notes:</strong> {receiptModalData.booking.specialRequests}</p>
                  )}
                </div>
              )}

              {/* Accounts & Ledger Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      <th className="px-3.5 py-2">Description</th>
                      <th className="px-3.5 py-2 text-center">Payment Mode</th>
                      <th className="px-3.5 py-2 text-center">Date</th>
                      <th className="px-3.5 py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    <tr>
                      <td className="px-3.5 py-2.5 font-bold text-gray-900">Total Agreed Booking Amount</td>
                      <td className="px-3.5 py-2.5 text-center text-gray-500">—</td>
                      <td className="px-3.5 py-2.5 text-center text-gray-500">
                        {new Date(receiptModalData.booking?.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-right text-gray-900">
                        ₹{receiptModalData.booking?.totalAmount?.toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {receiptModalData.type === 'payment' && receiptModalData.payment && (
                      <tr className="bg-emerald-50">
                        <td className="px-3.5 py-2.5 font-bold text-emerald-900">
                          Current Payment Received ({receiptModalData.payment.receiptNumber})
                          {receiptModalData.payment.transactionReference && (
                            <span className="block text-[10px] text-emerald-700 font-normal">
                              Ref/UTR: {receiptModalData.payment.transactionReference}
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-semibold text-emerald-800">
                          {receiptModalData.payment.paymentMode}
                        </td>
                        <td className="px-3.5 py-2.5 text-center text-emerald-800">
                          {new Date(receiptModalData.payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-right text-emerald-800 text-sm">
                          ₹{receiptModalData.payment.amount?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}

                    <tr className="bg-gray-50/50">
                      <td colSpan="3" className="px-3.5 py-2 text-gray-600 font-medium">Total Amount Collected So Far:</td>
                      <td className="px-3.5 py-2 font-bold text-right text-emerald-700">
                        ₹{receiptModalData.booking?.totalPaid?.toLocaleString('en-IN')}
                      </td>
                    </tr>

                    <tr className="bg-gray-100/70 border-t-2 border-gray-300">
                      <td colSpan="3" className="px-3.5 py-2.5 text-gray-900 font-bold uppercase text-xs">
                        Net Balance Due:
                      </td>
                      <td className="px-3.5 py-2.5 font-black text-right text-amber-700 text-base">
                        ₹{receiptModalData.booking?.balanceDue?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status and Signatures Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-[11px] mb-8">
                  <div>
                    <span className="text-gray-500">Booking Status:</span>{' '}
                    <strong className="text-blue-700 font-bold">{receiptModalData.booking?.bookingStatus}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment Status:</span>{' '}
                    <strong className="text-emerald-700 font-bold">{receiptModalData.booking?.paymentStatus}</strong>
                  </div>
                  {receiptModalData.booking?.expectedFinalPaymentDate && (
                    <div>
                      <span className="text-gray-500">Due By:</span>{' '}
                      <strong>{new Date(receiptModalData.booking.expectedFinalPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
                  <div>
                    <div className="border-t border-gray-400 mx-auto w-3/4 mb-1"></div>
                    <p className="text-gray-500 text-[11px]">Customer Signature</p>
                  </div>
                  <div>
                    <div className="border-t border-gray-400 mx-auto w-3/4 mb-1"></div>
                    <p className="text-gray-900 font-bold text-[11px]">Authorized Signatory / Venue Stamp</p>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 text-center mt-6">
                  This is an authorized computer-generated offline booking record issued on RentalMeet Platform.
                </p>
              </div>
            </div>

            {/* Modal Bottom Close Button (Not printed) */}
            <div className="pt-3 border-t border-gray-100 flex justify-end no-print">
              <button
                onClick={() => setReceiptModalData(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW BOOKING DETAILS MODAL ────────────────────────────────────── */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Booking Details</h3>
                <p className="text-xs text-gray-500 font-mono">{viewBooking.bookingId}</p>
              </div>
              <button onClick={() => setViewBooking(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-gray-500">Customer Name:</span>
                  <p className="font-bold text-gray-900">{viewBooking.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="font-bold text-gray-900">{viewBooking.customerPhone}</p>
                </div>
                {viewBooking.customerEmail && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium text-gray-900">{viewBooking.customerEmail}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500">Venue:</span>
                  <p className="font-semibold text-gray-900">{viewBooking.venueName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Hall:</span>
                  <p className="font-semibold text-gray-900">{viewBooking.hallName || 'Main'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Event Date:</span>
                  <p className="font-semibold text-gray-900">
                    {new Date(viewBooking.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Slot & Type:</span>
                  <p className="font-semibold text-gray-900">{viewBooking.eventSlot} • {viewBooking.eventType}</p>
                </div>
              </div>

              {viewBooking.foodPackage && (
                <div>
                  <span className="text-gray-500">Food / Catering:</span>
                  <p className="font-medium text-gray-800">{viewBooking.foodPackage}</p>
                </div>
              )}

              {viewBooking.decorationRequirements && (
                <div>
                  <span className="text-gray-500">Decoration:</span>
                  <p className="font-medium text-gray-800">{viewBooking.decorationRequirements}</p>
                </div>
              )}

              {viewBooking.specialRequests && (
                <div>
                  <span className="text-gray-500">Special Notes:</span>
                  <p className="font-medium text-gray-800">{viewBooking.specialRequests}</p>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Booking Amount:</span>
                  <strong className="text-gray-900">₹{viewBooking.totalAmount?.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Total Collected:</span>
                  <strong>₹{viewBooking.totalPaid?.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Balance Due:</span>
                  <strong>₹{viewBooking.balanceDue?.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setViewBooking(null);
                  handleOpenEdit(viewBooking);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                Edit Booking
              </button>
              <button
                onClick={() => setViewBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCEL BOOKING MODAL ─────────────────────────────────────────── */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Cancel Offline Booking</h3>
            <p className="text-xs text-gray-500 mt-1">
              Cancelling booking <strong>{cancelModalBooking.bookingId}</strong> will immediately release the calendar slot for online bookings.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Customer requested cancellation due to family reasons..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </OwnerLayout>
  );
}
