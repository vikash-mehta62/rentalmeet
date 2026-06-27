'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import CustomerLayout from '@/components/customer/CustomerLayout';
import {
  Calendar, CheckCircle2, XCircle, Clock, MapPin, IndianRupee,
  AlertCircle, Search, Download, Building2,
  Wifi, Coffee, Utensils, Plus, Minus, ArrowLeft, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceDownload from '@/components/booking/InvoiceDownload';
import InvitationShare from '@/components/booking/InvitationShare';
import { VenueAmenitiesDetails, VenueBookingPartyCards, VenueInvoiceBreakdownCards } from '@/components/booking/VenueBookingSummaryCards';
import { calculatePlatformFee, formatPlatformFeeLabel, numberOr, roundMoney } from '@/lib/venuePricing';

export default function CustomerBookings() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const LIMIT = 12;
  const [modifyBooking, setModifyBooking] = useState(null);       // booking object
  const [modifyVenue, setModifyVenue] = useState(null);           // full venue with amenities
  const [modifyVenueLoading, setModifyVenueLoading] = useState(false);
  const [modifyForm, setModifyForm] = useState({ bookingDate: '', startTime: '', endTime: '' });
  const [modifyAmenities, setModifyAmenities] = useState({ basic: [], beverages: [], refreshmentFood: [], lunchThalis: [], additional: [] });
  const [modifyQty, setModifyQty] = useState({});
  const [modifySubmitting, setModifySubmitting] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(null);

  useEffect(() => {
    if (!token || user?.role !== 'customer') {
      router.push('/login');
      return;
    }
    fetchBookings(1);
  }, [token, user]);

  useEffect(() => {
    if (token) { setCurrentPage(1); fetchBookings(1); }
  }, [filterStatus, searchQuery]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchBookings = async (page = 1) => {
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (searchQuery) params.set('search', searchQuery);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings);
        setFilteredBookings(data.bookings);
        setTotalPages(data.totalPages || 1);
        setTotalBookings(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    // Server-side filtering
    setFilteredBookings(bookings);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBookings(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch platform settings once
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`)
      .then(r => r.json()).then(d => { if (d.success) setPlatformSettings(d.settings); }).catch(() => {});
  }, []);

  const openModify = async (booking) => {
    setModifyBooking(booking);
    setModifyForm({
      bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().split('T')[0] : '',
      startTime: booking.startTime || '',
      endTime: booking.endTime || ''
    });

    // Restore already-selected amenities from booking
    const saved = booking.selectedAmenities || {};
    setModifyAmenities({
      basic: saved.basic || [],
      beverages: saved.beverages || [],
      refreshmentFood: saved.refreshmentFood || [],
      lunchThalis: saved.lunchThalis || [],
      additional: saved.additional || []
    });

    // Restore quantities
    const qtyMap = {};
    (saved.basic || []).forEach(a => { if (a.rateType === 'Per Use') qtyMap[`basic_${a.name}`] = a.quantity || 1; });
    (saved.beverages || []).forEach(b => { qtyMap[`beverages_${b.name}`] = b.quantity || 1; });
    (saved.refreshmentFood || []).forEach(f => { qtyMap[`refreshmentFood_${f.name}`] = f.quantity || 1; });
    (saved.lunchThalis || []).forEach(t => { qtyMap[`lunchThalis_${t.thaliType}_${t.category}`] = t.quantity || 1; });
    setModifyQty(qtyMap);

    // Fetch full venue data for amenities list
    if (booking.venue?.sku) {
      setModifyVenueLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/sku/${booking.venue.sku}`);
        const data = await res.json();
        if (data.success) setModifyVenue(data.venue);
      } catch (e) {}
      setModifyVenueLoading(false);
    }
  };

  // Toggle amenity in modify modal
  const toggleModifyAmenity = (category, item) => {
    const itemKey = item.name || `${item.thaliType}_${item.category}`;
    setModifyAmenities(prev => {
      const list = prev[category];
      const exists = list.find(a => (a.name || `${a.thaliType}_${a.category}`) === itemKey);
      if (exists) {
        setModifyQty(q => { const n = { ...q }; delete n[`${category}_${itemKey}`]; return n; });
        return { ...prev, [category]: list.filter(a => (a.name || `${a.thaliType}_${a.category}`) !== itemKey) };
      }
      setModifyQty(q => ({ ...q, [`${category}_${itemKey}`]: 1 }));
      return { ...prev, [category]: [...list, item] };
    });
  };

  const isModifySelected = (category, item) => {
    const itemKey = item.name || `${item.thaliType}_${item.category}`;
    return modifyAmenities[category]?.some(a => (a.name || `${a.thaliType}_${a.category}`) === itemKey);
  };

  const updateModifyQty = (key, val) => {
    setModifyQty(prev => ({ ...prev, [key]: Math.max(0, parseInt(val) || 0) }));
  };

  // Live price calculation for modify modal
  const calcModifyPrice = () => {
    if (!modifyBooking || !modifyVenue) return { basePrice: 0, amenitiesTotal: 0, subtotal: 0, discount: 0, gst: 0, platformFee: 0, platformFeeGST: 0, total: 0 };

    const orig = modifyBooking.priceBreakdown || {};

    // Base price never changes (date/time locked)
    const basePrice = orig.basePrice || 0;

    // Original amenities total (what was booked)
    const origAmenitiesTotal = orig.amenitiesTotal || modifyBooking.amenitiesTotal || 0;

    // Recalculate amenities from current selections
    let amenitiesTotal = 0;
    modifyAmenities.basic.forEach(a => {
      if (a.type === 'Paid') {
        if (a.rateType === 'Per Use') amenitiesTotal += (a.rate || 0) * (modifyQty[`basic_${a.name}`] || 0);
        else amenitiesTotal += a.rate || 0;
      }
    });
    modifyAmenities.beverages.forEach(b => { amenitiesTotal += (b.ratePerUnit || 0) * (modifyQty[`beverages_${b.name}`] || 0); });
    modifyAmenities.refreshmentFood.forEach(f => { amenitiesTotal += (f.ratePerPlate || 0) * (modifyQty[`refreshmentFood_${f.name}`] || 0); });
    modifyAmenities.lunchThalis.forEach(t => { amenitiesTotal += (t.ratePerPlate || 0) * (modifyQty[`lunchThalis_${t.thaliType}_${t.category}`] || 0); });
    modifyAmenities.additional.forEach(a => { if (a.type === 'Paid') amenitiesTotal += a.charges || 0; });

    const subtotal = basePrice + amenitiesTotal;

    // Amenities delta — how much changed from original
    const amenitiesDelta = amenitiesTotal - origAmenitiesTotal;

    // Use exact same rates as original booking
    const gstRate = orig.gstRate || 18;
    const pfRate = orig.platformFeeRate || orig.platformFeePercentage || 5;
    const pfGSTRate = (orig.platformFeeGST || 0) > 0
      ? ((platformSettings?.platformCGST || 9) + (platformSettings?.platformSGST || 9))
      : 0;

    // Tax multiplier: how much extra tax per ₹1 of amenity change
    // GST on delta + platform fee on delta + platform fee GST on delta
    const taxMultiplier = (gstRate / 100) + (pfRate / 100) + (pfRate / 100 * pfGSTRate / 100);

    // New total = original amount + delta + tax on delta
    const origAmount = modifyBooking.amount || 0;
    const total = origAmount + amenitiesDelta + (amenitiesDelta * taxMultiplier);

    // For display breakdown — reconstruct from original stored values
    const discount = orig.discount || modifyBooking.coupon?.discountAmount || 0;
    const gst = (orig.gst || 0) + (amenitiesDelta * gstRate / 100);
    const platformFee = (orig.platformFee || 0) + (amenitiesDelta * pfRate / 100);
    const platformFeeGST = (orig.platformFeeGST || 0) + (amenitiesDelta * pfRate / 100 * pfGSTRate / 100);
    void amenitiesDelta;
    void taxMultiplier;
    void origAmount;
    void total;
    void gst;
    void platformFee;
    void platformFeeGST;

    const venueCGSTRate = numberOr(orig.venueCGSTRate, orig.gstRate ? orig.gstRate / 2 : 0);
    const venueSGSTRate = numberOr(orig.venueSGSTRate, orig.gstRate ? orig.gstRate / 2 : 0);
    const recalculatedVenueCGST = roundMoney((subtotal * venueCGSTRate) / 100);
    const recalculatedVenueSGST = roundMoney((subtotal * venueSGSTRate) / 100);
    const recalculatedGST = roundMoney(recalculatedVenueCGST + recalculatedVenueSGST);
    const recalculatedGSTRate = venueCGSTRate + venueSGSTRate;
    const platformFeeType = orig.platformFeeType || 'percentage';
    const platformFeeValue = numberOr(orig.platformFeeValue ?? orig.platformFeeRate ?? orig.platformFeePercentage, 5);
    const recalculatedPlatformFee = calculatePlatformFee(subtotal, platformFeeType, platformFeeValue);
    const platformFeeCGSTRate = numberOr(orig.platformFeeCGSTRate, platformSettings?.platformCGST || 9);
    const platformFeeSGSTRate = numberOr(orig.platformFeeSGSTRate, platformSettings?.platformSGST || 9);
    const platformFeeCGST = roundMoney((recalculatedPlatformFee * platformFeeCGSTRate) / 100);
    const platformFeeSGST = roundMoney((recalculatedPlatformFee * platformFeeSGSTRate) / 100);
    const recalculatedPlatformFeeGST = roundMoney(platformFeeCGST + platformFeeSGST);
    const platformFeeTotal = roundMoney(recalculatedPlatformFee + recalculatedPlatformFeeGST);
    const recalculatedTotal = Math.max(1, roundMoney(subtotal + recalculatedGST + platformFeeTotal - discount));

    return {
      basePrice, amenitiesTotal, subtotal, discount,
      venueCGST: recalculatedVenueCGST,
      venueSGST: recalculatedVenueSGST,
      venueCGSTRate,
      venueSGSTRate,
      gst: recalculatedGST,
      gstRate: recalculatedGSTRate,
      platformFee: recalculatedPlatformFee,
      platformFeeType,
      platformFeeValue,
      platformFeeLabel: formatPlatformFeeLabel(platformFeeType, platformFeeValue),
      platformFeeRate: platformFeeValue,
      platformFeePercentage: platformFeeType === 'percentage' ? platformFeeValue : 0,
      platformFeeCGST,
      platformFeeSGST,
      platformFeeCGSTRate,
      platformFeeSGSTRate,
      platformFeeGST: recalculatedPlatformFeeGST,
      platformFeeTotal,
      total: recalculatedTotal
    };
  };

  const handleModifySubmit = async (e) => {
    e.preventDefault();
    if (!modifyBooking) return;
    setModifySubmitting(true);

    const mp = calcModifyPrice();

    // Build amenities payload with totals
    const amenitiesPayload = {
      basic: modifyAmenities.basic.map(a => ({
        ...a,
        quantity: a.rateType === 'Per Use' ? (modifyQty[`basic_${a.name}`] || 1) : 1,
        total: a.type === 'Paid' ? (a.rateType === 'Per Use' ? (a.rate || 0) * (modifyQty[`basic_${a.name}`] || 0) : (a.rate || 0)) : 0
      })),
      beverages: modifyAmenities.beverages.map(b => ({ ...b, quantity: modifyQty[`beverages_${b.name}`] || 1, total: (b.ratePerUnit || 0) * (modifyQty[`beverages_${b.name}`] || 0) })),
      refreshmentFood: modifyAmenities.refreshmentFood.map(f => ({ ...f, quantity: modifyQty[`refreshmentFood_${f.name}`] || 1, total: (f.ratePerPlate || 0) * (modifyQty[`refreshmentFood_${f.name}`] || 0) })),
      lunchThalis: modifyAmenities.lunchThalis.map(t => ({ ...t, quantity: modifyQty[`lunchThalis_${t.thaliType}_${t.category}`] || 1, total: (t.ratePerPlate || 0) * (modifyQty[`lunchThalis_${t.thaliType}_${t.category}`] || 0) })),
      additional: modifyAmenities.additional.map(a => ({ ...a, quantity: 1, total: a.type === 'Paid' ? (a.charges || 0) : 0 }))
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${modifyBooking._id}/modify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          bookingDate: modifyForm.bookingDate,
          startTime: modifyForm.startTime,
          endTime: modifyForm.endTime,
          selectedAmenities: amenitiesPayload,
          amenitiesTotal: mp.amenitiesTotal,
          amount: mp.total,
          priceBreakdown: {
            basePrice: mp.basePrice,
            amenitiesTotal: mp.amenitiesTotal,
            subtotal: mp.subtotal,
            discount: mp.discount,
            couponCode: modifyBooking.priceBreakdown?.couponCode || null,
            venueCGST: mp.venueCGST,
            venueSGST: mp.venueSGST,
            venueCGSTRate: mp.venueCGSTRate,
            venueSGSTRate: mp.venueSGSTRate,
            gst: mp.gst,
            gstRate: mp.gstRate,
            platformFee: mp.platformFee,
            platformFeeType: mp.platformFeeType,
            platformFeeValue: mp.platformFeeValue,
            platformFeePercentage: mp.platformFeePercentage,
            platformFeeCGST: mp.platformFeeCGST,
            platformFeeSGST: mp.platformFeeSGST,
            platformFeeCGSTRate: mp.platformFeeCGSTRate,
            platformFeeSGSTRate: mp.platformFeeSGSTRate,
            platformFeeGST: mp.platformFeeGST,
            platformFeeTotal: mp.platformFeeTotal,
            platformFeeRate: mp.platformFeeRate,
            total: mp.total
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Booking modified successfully');
        setModifyBooking(null);
        setModifyVenue(null);
        fetchBookings();
      } else {
        toast.error(data.message || 'Failed to modify booking');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setModifySubmitting(false);
    }
  };

  const [cancelModal, setCancelModal] = useState(null); // booking object
  const [cancelReason, setCancelReason] = useState('');
  const [cancelCustomReason, setCancelCustomReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const CANCEL_REASONS = [
    'Change of plans',
    'Found a better venue',
    'Event postponed',
    'Budget constraints',
    'Venue not suitable anymore',
    'Other',
  ];

  const handleCancelBooking = async () => {
    const booking = cancelModal;
    const finalReason = cancelReason === 'Other' ? cancelCustomReason.trim() : cancelReason;
    if (!finalReason) return toast.error('Please select a reason');

    setCancelSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${booking._id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: finalReason })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.refundProcessed ? 'Booking cancelled — refund initiated' : 'Booking cancelled');
        if (!data.refundProcessed && data.refundEligible && data.refundFailReason) {
          toast.error(`Refund failed: ${data.refundFailReason}`, { duration: 6000 });
        }
        setCancelModal(null);
        setCancelReason('');
        setCancelCustomReason('');
        fetchBookings(currentPage);
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Something went wrong');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // ── Pay Remaining Amount ────────────────────────────────────────────────
  // Handled on dedicated page: /customer/pay-remaining/[bookingId]

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <CustomerLayout activePage="bookings" title="My Bookings" subtitle={`${filteredBookings.length} booking(s) found`}>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by venue name or city..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'all'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('confirmed')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'confirmed'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'completed'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filterStatus === 'cancelled'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-12 text-center">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookings Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Start exploring venues and make your first booking!'}
            </p>
            <Link href="/venues" className="btn-primary inline-flex items-center gap-2">
              <Search className="w-5 h-5" />
              Browse Venues
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Venue Image */}
                  <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    {booking.venue?.images?.[0]?.url ? (
                      <img src={booking.venue.images[0].url} alt={booking.venue.businessName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-base font-black text-slate-800 truncate">{booking.venue?.businessName}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3"/>{booking.venue?.location?.city}, {booking.venue?.location?.area}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status === 'confirmed' ? 'Your booking is confirmed' :
                         booking.status === 'pending' ? 'Your booking is pending' :
                         booking.status === 'completed' ? 'Your booking is completed' :
                         'Your booking is cancelled'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
                      <span className="flex items-center gap-1 bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">
                        <Calendar className="w-3.5 h-3.5 text-primary-500"/>
                        {new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({booking.startTime} - {booking.endTime})
                      </span>
                      <span className="flex items-center gap-1 font-bold text-primary-600"><IndianRupee className="w-3.5 h-3.5"/>₹{booking.amount?.toLocaleString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Search className="w-3.5 h-3.5"/> View Details
                      </button>
                      {(booking.status === 'confirmed' || booking.status === 'completed') && (
                        <InvitationShare booking={booking} />
                      )}
                      {booking.status === 'pending' && (
                        <>
                          {/* Phase 2: Modify button — temporarily disabled
                          <button
                            onClick={() => openModify(booking)}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            ✏️ Modify
                          </button>
                          */}
                          <button
                            onClick={() => { setCancelModal(booking); setCancelReason(''); setCancelCustomReason(''); }}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5"/> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-soft px-6 py-4">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, totalBookings)} of {totalBookings} bookings
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                Previous
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button key={page} onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === page ? 'bg-primary-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{selectedBooking.venue?.businessName}</h2>
                <p className="text-xs text-gray-500 mt-0.5">#{selectedBooking.bookingNumber || selectedBooking._id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedBooking.status === 'confirmed' ? 'Your booking is confirmed' :
                   selectedBooking.status === 'pending' ? 'Your booking is pending' :
                   selectedBooking.status === 'completed' ? 'Your booking is completed' :
                   'Your booking is cancelled'}
                </span>
                <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Key Info */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/>Location</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedBooking.venue?.location?.city}</p>
                </div>
                <div className="bg-yellow-50/50 dark:bg-slate-800 rounded-xl p-3 col-span-2 border border-yellow-100 dark:border-slate-700">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/>Booking Date & Time</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5 font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/>{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">📅 Booked On</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{new Date(selectedBooking.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="bg-green-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3"/>Amount</p>
                  <p className="text-sm font-bold text-green-600">₹{selectedBooking.amount?.toLocaleString()}</p>
                </div>
              </div>

              <VenueBookingPartyCards booking={selectedBooking} />

              <VenueAmenitiesDetails booking={selectedBooking} />

              <VenueInvoiceBreakdownCards booking={selectedBooking} />

              {/* ── Payment Ledger ── */}
              {(() => {
                const ledger = selectedBooking.paymentLedger;
                const currentDue = selectedBooking.amount || 0;  // always use latest booking amount

                // Sum paid from transactions
                const totalPaid = ledger?.transactions
                  ? ledger.transactions
                      .filter(t => ['payment', 'manual_payment'].includes(t.type) && t.status === 'completed')
                      .reduce((s, t) => s + (t.amount || 0), 0)
                  : 0;

                // Sum refunds
                const totalRefunded = ledger?.transactions
                  ? ledger.transactions
                      .filter(t => ['refund', 'manual_refund'].includes(t.type) && t.status === 'completed')
                      .reduce((s, t) => s + (t.amount || 0), 0)
                  : 0;

                const netPaid = totalPaid - totalRefunded;
                const balance = currentDue - netPaid;
                const isCancelledBooking = selectedBooking.status === 'cancelled';
                // Overpaid = paid more than current due (due to modification) but booking is still active
                const isOverpaid = balance < 0 && !isCancelledBooking;
                const amountDue = balance > 0 ? balance : 0;
                const refundDue = balance < 0 && isCancelledBooking ? Math.abs(balance) : 0;
                const isSettled = balance === 0;

                const txns = ledger?.transactions || [];
                const adjustments = ledger?.adjustments || [];

                return (
                  <div className="rounded-xl border-2 border-gray-200 dark:border-slate-700 overflow-hidden">
                    {/* Balance Bar */}
                    <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-slate-700">
                      <div className="p-3 text-center bg-white dark:bg-slate-800">
                        <p className="text-[10px] text-gray-500 mb-0.5">Total Amount</p>
                        <p className="text-base font-black text-gray-900 dark:text-slate-100">₹{currentDue.toLocaleString()}</p>
                      </div>
                      <div className="p-3 text-center bg-green-50 dark:bg-slate-800">
                        <p className="text-[10px] text-gray-500 mb-0.5">{totalRefunded > 0 ? 'Paid' : netPaid >= currentDue ? 'Paid ✓' : 'Paid'}</p>
                        <p className="text-base font-black text-green-600">₹{netPaid.toLocaleString()}</p>
                      </div>
                      <div className={`p-3 text-center ${refundDue > 0 ? 'bg-blue-50' : isOverpaid ? 'bg-orange-50' : amountDue > 0 ? 'bg-red-50' : 'bg-green-50'} dark:bg-slate-800`}>
                        <p className="text-[10px] text-gray-500 mb-0.5">
                          {refundDue > 0 ? 'Refund Due' : isOverpaid ? 'Overpaid' : amountDue > 0 ? 'Balance Due' : 'Balance Due'}
                        </p>
                        <p className={`text-base font-black ${refundDue > 0 ? 'text-blue-600' : isOverpaid ? 'text-orange-500' : amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {refundDue > 0 ? `₹${refundDue.toLocaleString()}` : isOverpaid ? `₹${Math.abs(balance).toLocaleString()}` : amountDue > 0 ? `₹${amountDue.toLocaleString()}` : 'Fully Paid'}
                        </p>
                      </div>
                    </div>

                    {/* Status banners */}
                    {refundDue > 0 && (
                      <div className="bg-blue-50 border-t border-blue-200 px-4 py-2.5 text-xs text-blue-800 font-semibold flex items-center gap-2">
                        💰 Refund of ₹{refundDue.toLocaleString()} is due — admin will process it shortly.
                      </div>
                    )}
                    {isOverpaid && (
                      <div className="bg-orange-50 border-t border-orange-200 px-4 py-2.5 text-xs text-orange-800 font-semibold flex items-center gap-2">
                        ℹ️ You overpaid by ₹{Math.abs(balance).toLocaleString()} after modifying amenities. This will be settled after your booking is completed.
                      </div>
                    )}
                    {amountDue > 0 && netPaid > 0 && (
                      <div className="bg-orange-50 border-t border-orange-200 px-4 py-3 text-xs font-semibold">
                        <p className="text-orange-800 mb-1">⚠️ ₹{amountDue.toLocaleString()} is pending after booking modification.</p>
                        {adjustments.length > 0 && (
                          <p className="text-orange-600 font-normal mb-2">
                            Original paid: ₹{netPaid.toLocaleString()} · New total: ₹{currentDue.toLocaleString()} · Extra due: ₹{amountDue.toLocaleString()}
                          </p>
                        )}
                        <Link
                          href={`/customer/pay-remaining/${selectedBooking._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-colors mt-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay ₹{amountDue.toLocaleString()} Now
                        </Link>
                      </div>
                    )}
                    {amountDue > 0 && netPaid === 0 && (
                      <div className="bg-orange-50 border-t border-orange-200 px-4 py-3 text-xs font-semibold">
                        <p className="text-orange-800 mb-2">⚠️ Full payment of ₹{amountDue.toLocaleString()} is pending.</p>
                        <Link
                          href={`/customer/pay-remaining/${selectedBooking._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay ₹{amountDue.toLocaleString()} Now
                        </Link>
                      </div>
                    )}

                    {/* Transaction History */}
                    {(txns.length > 0 || adjustments.length > 0) && (
                      <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-3">Transaction History</p>
                        <div className="space-y-3">
                          {adjustments.map((adj, i) => (
                            <div key={`adj-${i}`} className="flex items-start gap-3 text-xs p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${adj.difference > 0 ? 'bg-orange-200 text-orange-700' : 'bg-blue-200 text-blue-700'}`}>
                                {adj.difference > 0 ? '▲' : '▼'}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 dark:text-slate-200">
                                  Booking Modified
                                </p>
                                <p className="text-gray-600">
                                  {adj.difference > 0
                                    ? `+₹${Math.abs(adj.difference).toLocaleString()} additional amount due`
                                    : `₹${Math.abs(adj.difference).toLocaleString()} refund due`}
                                </p>
                                <p className="text-gray-400 mt-0.5">{new Date(adj.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <div className="text-right text-gray-500 text-[10px]">
                                <p>₹{adj.oldAmount?.toLocaleString()}</p>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 dark:text-slate-200">
                                  {txn.type === 'payment' ? 'Online Payment' : txn.type === 'manual_payment' ? 'Manual Payment (Cash/Bank)' : 'Refund Processed'}
                                </p>
                                {txn.note && <p className="text-gray-500">{txn.note}</p>}
                                <p className="text-gray-400 mt-0.5">{new Date(txn.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <p className={`font-bold text-sm ${['payment','manual_payment'].includes(txn.type) ? 'text-green-600' : 'text-red-600'}`}>
                                {['payment','manual_payment'].includes(txn.type) ? '+' : '-'}₹{txn.amount?.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Actions: Invoice / Invitation — only confirmed/completed */}
              {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedBooking.status === 'completed' ? (
                    <div>
                      <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Download Invoice</p>
                      <InvoiceDownload booking={selectedBooking} userRole="customer" />
                    </div>
                  ) : (
                    <div className="hidden sm:block" /> /* spacer */
                  )}
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Event Invitation</p>
                    <InvitationShare booking={selectedBooking} />
                  </div>
                </div>
              )}

              {/* Cancellation Policy */}
              {(() => {
                const b = selectedBooking;
                const bookingDate = new Date(b.bookingDate);
                const now = new Date();
                const hoursUntil = (bookingDate - now) / (1000 * 60 * 60);
                const paidAmount = b.paymentLedger?.totalPaid || b.amount || 0;
                const isCancelled = b.status === 'cancelled';
                const canCancel = ['pending', 'confirmed'].includes(b.status);
                const refund = b.refundDetails;

                // 3-tier refund policy
                const tier = hoursUntil >= 48 ? 'full' : hoursUntil >= 24 ? 'half' : 'none';
                const refundIfCancel = tier === 'full' ? paidAmount : tier === 'half' ? Math.round(paidAmount * 0.5) : 0;

                return (
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                      <span className="text-base">🛡️</span>
                      <p className="text-xs font-bold text-gray-700">Cancellation Policy</p>
                    </div>

                    {/* Policy tiers */}
                    <div className="p-4 space-y-2">
                      <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm border ${tier === 'full' && canCancel ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tier === 'full' && canCancel ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-gray-700 font-medium">Cancel 48+ hours before</span>
                        </div>
                        <span className="font-bold text-green-600">100% Refund</span>
                      </div>
                      <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm border ${tier === 'half' && canCancel ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tier === 'half' && canCancel ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                          <span className="text-gray-700 font-medium">Cancel 24–48 hours before</span>
                        </div>
                        <span className="font-bold text-yellow-600">50% Refund</span>
                      </div>
                      <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm border ${tier === 'none' && canCancel ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tier === 'none' && canCancel ? 'bg-red-500' : 'bg-gray-300'}`} />
                          <span className="text-gray-700 font-medium">Cancel less than 24 hours before</span>
                        </div>
                        <span className="font-bold text-red-500">No Refund</span>
                      </div>
                    </div>

                    {/* Live eligibility for active bookings */}
                    {canCancel && b.paymentStatus === 'paid' && (
                      <div className={`mx-4 mb-4 rounded-lg p-3 text-sm border ${
                        tier === 'full' ? 'bg-green-50 border-green-200'
                        : tier === 'half' ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold ${tier === 'full' ? 'text-green-700' : tier === 'half' ? 'text-yellow-700' : 'text-red-700'}`}>
                            {tier === 'full' ? '✅ Full refund eligible' : tier === 'half' ? '⚠️ 50% refund if cancelled now' : '❌ No refund if cancelled now'}
                          </span>
                          {refundIfCancel > 0 && (
                            <span className="font-black text-gray-800">₹{refundIfCancel.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                        <p className={`text-xs ${tier === 'full' ? 'text-green-600' : tier === 'half' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {tier === 'full'
                            ? `Cancel now → ₹${refundIfCancel.toLocaleString('en-IN')} back to your original payment source`
                            : tier === 'half'
                            ? `Cancel now → ₹${refundIfCancel.toLocaleString('en-IN')} refunded (50% of ₹${paidAmount.toLocaleString('en-IN')})`
                            : `Booking is ${hoursUntil < 0 ? 'in the past' : `${Math.round(hoursUntil)}h away`} — refund window closed`}
                        </p>
                        {tier === 'full' && (
                          <p className="text-xs text-green-500 mt-1">
                            50% zone starts {new Date(bookingDate.getTime() - 48 * 60 * 60 * 1000).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        {tier === 'half' && (
                          <p className="text-xs text-yellow-500 mt-1">
                            No-refund zone starts {new Date(bookingDate.getTime() - 24 * 60 * 60 * 1000).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Cancel button inside detail modal */}
                    {canCancel && (
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => { setCancelModal(b); setCancelReason(''); setCancelCustomReason(''); setSelectedBooking(null); }}
                          className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Cancel This Booking
                        </button>
                      </div>
                    )}

                    {/* If already cancelled — show refund outcome */}
                    {isCancelled && (
                      <div className="mx-4 mb-4 space-y-2">
                        {b.cancellationReason && (
                          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs">
                            <p className="font-bold text-red-700 mb-0.5">Cancellation Reason</p>
                            <p className="text-red-600">{b.cancellationReason}</p>
                            {b.cancelledByRole && (
                              <p className="text-red-400 mt-1">Cancelled by: <span className="font-semibold capitalize">{b.cancelledByRole === 'system' ? 'Auto (timeout)' : b.cancelledByRole}</span></p>
                            )}
                          </div>
                        )}
                        {refund && (
                          <div className={`rounded-lg px-3 py-2.5 text-xs border ${refund.refundStatus === 'processed' ? 'bg-green-50 border-green-200' : refund.refundStatus === 'failed' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <p className={`font-bold ${refund.refundStatus === 'processed' ? 'text-green-700' : refund.refundStatus === 'failed' ? 'text-red-700' : 'text-yellow-700'}`}>
                                {refund.refundStatus === 'processed' ? '✅ Refund Processed' : refund.refundStatus === 'failed' ? '❌ Refund Failed' : '⏳ Refund Pending'}
                              </p>
                              {refund.refundAmount > 0 && (
                                <span className="font-black text-sm text-gray-800">₹{refund.refundAmount.toLocaleString('en-IN')}</span>
                              )}
                            </div>
                            {refund.refundStatus === 'processed' && refund.refundedAt && (
                              <p className="text-green-600">Refunded on {new Date(refund.refundedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            )}
                            {refund.refundStatus === 'processed' && (
                              <p className="text-green-500 mt-0.5">Amount will reflect in your original payment source within 5–7 business days</p>
                            )}
                            {refund.refundStatus === 'failed' && (
                              <p className="text-red-600">Refund could not be processed automatically. Please contact support.</p>
                            )}
                            {refund.refundStatus === 'pending' && refund.refundAmount === 0 && (
                              <p className="text-yellow-600">No refund applicable as per cancellation policy.</p>
                            )}
                            {refund.refundReason && <p className="text-gray-400 mt-1">{refund.refundReason}</p>}
                          </div>
                        )}
                        {!refund && b.paymentStatus !== 'paid' && (
                          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 text-xs text-gray-500">
                            No payment was made — no refund applicable.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* ── Cancel Booking Modal ── */}
      {cancelModal && (() => {
        const b = cancelModal;
        const bookingDate = new Date(b.bookingDate);
        const now = new Date();
        const hoursUntil = (bookingDate - now) / (1000 * 60 * 60);
        const paidAmount = b.paymentLedger?.totalPaid || b.amount || 0;
        const tier = hoursUntil >= 48 ? 'full' : hoursUntil >= 24 ? 'half' : 'none';
        const refundAmt = tier === 'full' ? paidAmount : tier === 'half' ? Math.round(paidAmount * 0.5) : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h2 className="text-base font-bold text-gray-800">Cancel Booking</h2>
                </div>
                <button onClick={() => setCancelModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
              </div>

              <div className="p-5 space-y-4">
                {/* Booking info */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm">
                  <p className="font-semibold text-gray-800">{b.venue?.businessName}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {b.startTime} – {b.endTime}</p>
                </div>

                {/* Refund info */}
                {b.paymentStatus === 'paid' && (
                  <div className={`rounded-xl px-4 py-3 text-sm border ${tier === 'full' ? 'bg-green-50 border-green-200' : tier === 'half' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${tier === 'full' ? 'text-green-700' : tier === 'half' ? 'text-yellow-700' : 'text-red-700'}`}>
                        {tier === 'full' ? '✅ Full refund' : tier === 'half' ? '⚠️ 50% refund' : '❌ No refund'}
                      </span>
                      {refundAmt > 0 && <span className="font-black text-gray-800">₹{refundAmt.toLocaleString('en-IN')}</span>}
                    </div>
                    <p className={`text-xs mt-1 ${tier === 'full' ? 'text-green-600' : tier === 'half' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {tier === 'full' ? `₹${refundAmt.toLocaleString('en-IN')} will be refunded to your original payment source`
                        : tier === 'half' ? `₹${refundAmt.toLocaleString('en-IN')} will be refunded (50% of ₹${paidAmount.toLocaleString('en-IN')})`
                        : 'No refund as per cancellation policy'}
                    </p>
                  </div>
                )}

                {/* Reason selector */}
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2">Reason for cancellation <span className="text-red-500">*</span></p>
                  <div className="space-y-2">
                    {CANCEL_REASONS.map(r => (
                      <label key={r} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${cancelReason === r ? 'bg-primary-50 border-primary-400' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="cancelReason" value={r} checked={cancelReason === r}
                          onChange={() => { setCancelReason(r); setCancelCustomReason(''); }}
                          className="accent-primary-500" />
                        <span className="text-sm text-gray-700">{r}</span>
                      </label>
                    ))}
                  </div>
                  {cancelReason === 'Other' && (
                    <textarea
                      value={cancelCustomReason}
                      onChange={e => setCancelCustomReason(e.target.value)}
                      placeholder="Please describe your reason..."
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelSubmitting || !cancelReason || (cancelReason === 'Other' && !cancelCustomReason.trim())}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
                  >
                    {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                  <button onClick={() => setCancelModal(null)}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                    Keep Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modify Booking - Full Screen Modal ── */}
      {modifyBooking && (
        <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
          {/* Top Bar */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => { setModifyBooking(null); setModifyVenue(null); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Modify Booking</h2>
                  <p className="text-xs text-gray-500">#{modifyBooking.bookingNumber || modifyBooking._id.slice(-8).toUpperCase()} · {modifyBooking.venue?.businessName}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">PENDING</span>
            </div>
          </div>

          <form onSubmit={handleModifySubmit}>
            <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left - Date/Time + Amenities */}
              <div className="lg:col-span-2 space-y-5">

                {/* Date & Time */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-500" />Date & Time</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                      <input type="date" value={modifyForm.bookingDate} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                      <input type="time" value={modifyForm.startTime} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                      <input type="time" value={modifyForm.endTime} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Date & time cannot be changed. Only amenities can be modified.</p>
                </div>

                {/* Amenities */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary-500" />Amenities & Services</h3>
                  <p className="text-xs text-gray-500 mb-4">Pre-selected from your original booking. Add or remove as needed.</p>

                  {modifyVenueLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3 text-sm text-gray-500">Loading venue amenities...</span>
                    </div>
                  )}

                  {!modifyVenueLoading && modifyVenue && (
                    <div className="space-y-6">

                      {/* Basic Amenities */}
                      {modifyVenue.amenities?.basic?.filter(a => a.available).length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center"><Wifi className="w-4 h-4 text-blue-600" /></div>
                            <span className="font-semibold text-gray-800">Basic Amenities</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {modifyVenue.amenities.basic.filter(a => a.available).map((amenity, idx) => {
                              const isFree = amenity.type === 'Free' || amenity.type === 'Included';
                              const sel = isModifySelected('basic', amenity);
                              const key = `basic_${amenity.name}`;
                              return (
                                <div key={idx} className={`p-3 border-2 rounded-lg transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                                  <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <input type="checkbox" checked={sel} onChange={() => !isFree && toggleModifyAmenity('basic', amenity)} disabled={isFree} className="w-4 h-4 accent-primary-500 flex-shrink-0" />
                                      <span className="text-xs font-medium text-gray-800">{amenity.name}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0 ${isFree ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                      {isFree ? 'Free' : `₹${amenity.rate}`}
                                    </span>
                                  </label>
                                  {!isFree && amenity.rateType === 'Per Use' && sel && (
                                    <div className="flex items-center gap-1.5 mt-2 ml-6">
                                      <button type="button" onClick={() => updateModifyQty(key, (modifyQty[key] || 0) - 1)} className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                                      <span className="w-7 text-center text-xs font-bold">{modifyQty[key] || 0}</span>
                                      <button type="button" onClick={() => updateModifyQty(key, (modifyQty[key] || 0) + 1)} className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Beverages */}
                      {modifyVenue.amenities?.beverages?.filter(b => b.available).length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center"><Coffee className="w-4 h-4 text-amber-600" /></div>
                            <span className="font-semibold text-gray-800">Beverages</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {modifyVenue.amenities.beverages.filter(b => b.available).map((bev, idx) => {
                              const sel = isModifySelected('beverages', bev);
                              const key = `beverages_${bev.name}`;
                              return (
                                <div key={idx} className={`p-3 border-2 rounded-lg transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                                  <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <input type="checkbox" checked={sel} onChange={() => toggleModifyAmenity('beverages', bev)} className="w-4 h-4 accent-primary-500 flex-shrink-0" />
                                      <span className="text-xs font-medium text-gray-800">{bev.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0">₹{bev.ratePerUnit}/u</span>
                                  </label>
                                  {sel && (
                                    <div className="flex items-center gap-1.5 mt-2 ml-6">
                                      <button type="button" onClick={() => updateModifyQty(key, (modifyQty[key] || 0) - 1)} className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                                      <span className="w-7 text-center text-xs font-bold">{modifyQty[key] || 0}</span>
                                      <button type="button" onClick={() => updateModifyQty(key, (modifyQty[key] || 0) + 1)} className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Refreshment Food */}
                      {modifyVenue.amenities?.refreshmentFood?.filter(f => f.available).length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center"><Utensils className="w-4 h-4 text-green-600" /></div>
                            <span className="font-semibold text-gray-800">Refreshments & Snacks</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {modifyVenue.amenities.refreshmentFood.filter(f => f.available).map((food, idx) => {
                              const sel = isModifySelected('refreshmentFood', food);
                              const key = `refreshmentFood_${food.name}`;
                              return (
                                <div key={idx} className={`p-3 border-2 rounded-lg transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                                  <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <input type="checkbox" checked={sel} onChange={() => toggleModifyAmenity('refreshmentFood', food)} className="w-4 h-4 accent-primary-500 flex-shrink-0" />
                                      <span className="text-xs font-medium text-gray-800">{food.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0">₹{food.ratePerPlate}/pl</span>
                                  </label>
                                  {sel && (
                                    <div className="flex items-center gap-1.5 mt-2 ml-6">
                                      <button type="button" onClick={() => updateModifyQty(key, (modifyQty[key] || 0) - 1)} className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                                      <span className="w-7 text-center text-xs font-bold">{modifyQty[key] || 0}</span>
                                      <button type="button" onClick={() => updateModifyQty(key, (modifyQty[key] || 0) + 1)} className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Lunch Thalis */}
                      {modifyVenue.amenities?.lunchThalis?.filter(t => t.available).length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center"><Utensils className="w-4 h-4 text-red-600" /></div>
                            <span className="font-semibold text-gray-800">Lunch Thalis</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {modifyVenue.amenities.lunchThalis.filter(t => t.available).flatMap(thali =>
                              (thali.categories || []).map((cat, idx) => {
                                const item = { thaliType: thali.thaliType, category: cat.category, ratePerPlate: cat.ratePerPlate, numberOfItems: cat.numberOfItems, itemNames: cat.itemNames };
                                const sel = isModifySelected('lunchThalis', item);
                                const key = `lunchThalis_${item.thaliType}_${item.category}`;
                                return (
                                  <div key={`${thali.thaliType}_${idx}`} className={`p-3 border-2 rounded-lg transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                                    <label className="flex items-start justify-between cursor-pointer gap-1">
                                      <div className="flex items-start gap-2">
                                        <input type="checkbox" checked={sel} onChange={() => toggleModifyAmenity('lunchThalis', item)} className="w-4 h-4 accent-primary-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <span className="text-xs font-medium text-gray-800 block">{thali.thaliType}</span>
                                          <span className="text-[10px] text-gray-500">{cat.category}</span>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full flex-shrink-0">₹{cat.ratePerPlate}/pl</span>
                                    </label>
                                    {sel && (
                                      <div className="flex items-center gap-1.5 mt-2 ml-6">
                                        <button type="button" onClick={() => updateModifyQty(key, (modifyQty[key] || 0) - 1)} className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                                        <span className="w-7 text-center text-xs font-bold">{modifyQty[key] || 0}</span>
                                        <button type="button" onClick={() => updateModifyQty(key, (modifyQty[key] || 0) + 1)} className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Additional */}
                      {modifyVenue.amenities?.additional?.filter(a => a.available).length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-purple-600" /></div>
                            <span className="font-semibold text-gray-800">Additional Services</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {modifyVenue.amenities.additional.filter(a => a.available).map((item, idx) => {
                              const isFree = item.type === 'Included';
                              const sel = isModifySelected('additional', item);
                              return (
                                <div key={idx} className={`p-3 border-2 rounded-lg transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}>
                                  <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <input type="checkbox" checked={sel} onChange={() => !isFree && toggleModifyAmenity('additional', item)} disabled={isFree} className="w-4 h-4 accent-primary-500 flex-shrink-0" />
                                      <span className="text-xs font-medium text-gray-800">{item.name}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0 ${isFree ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                      {isFree ? 'Free' : `₹${item.charges}`}
                                    </span>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {!modifyVenueLoading && !modifyVenue && (
                    <p className="text-sm text-gray-500 text-center py-4">Could not load venue amenities. You can still modify date/time.</p>
                  )}
                </div>
              </div>

              {/* Right - Live Price Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-white rounded-xl shadow-sm border-2 border-primary-200 p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-primary-500" />Updated Price</h3>

                  {(() => {
                    const mp = calcModifyPrice();
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Price</span>
                          <span className="font-semibold">₹{mp.basePrice.toLocaleString()}</span>
                        </div>
                        {mp.amenitiesTotal > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Amenities</span>
                            <span className="font-semibold">₹{mp.amenitiesTotal.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-semibold">₹{mp.subtotal.toLocaleString()}</span>
                        </div>
                        {mp.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="flex items-center gap-1">
                              🏷️ Coupon
                              {modifyBooking.priceBreakdown?.couponCode && (
                                <span className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded font-bold">
                                  {modifyBooking.priceBreakdown.couponCode}
                                </span>
                              )}
                            </span>
                            <span className="font-semibold">- ₹{mp.discount.toLocaleString()}</span>
                          </div>
                        )}
                        {mp.discount > 0 && (
                          <div className="flex justify-between text-gray-500 text-xs border-t pt-1">
                            <span>Taxable Amount</span>
                            <span>₹{(mp.subtotal - mp.discount).toLocaleString()}</span>
                          </div>
                        )}
                        {mp.gst > 0 && (
                          <div className="flex justify-between text-gray-500 text-xs">
                            <span>GST ({mp.gstRate}%)</span>
                            <span>₹{mp.gst.toLocaleString()}</span>
                          </div>
                        )}
                        {mp.platformFee > 0 && (
                          <div className="flex justify-between text-gray-500 text-xs">
                            <span>Platform Fee ({mp.platformFeeLabel})</span>
                            <span>₹{mp.platformFee.toLocaleString()}</span>
                          </div>
                        )}
                        {mp.platformFeeGST > 0 && (
                          <div className="flex justify-between text-gray-500 text-xs">
                            <span>Platform Fee GST</span>
                            <span>₹{mp.platformFeeGST.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                          <span className="font-bold text-gray-900">New Total</span>
                          <span className="text-2xl font-black text-primary-600">₹{mp.total.toLocaleString()}</span>
                        </div>
                        {mp.total !== modifyBooking.amount && (
                          <div className={`text-xs text-center py-1.5 rounded-lg font-semibold ${mp.total > modifyBooking.amount ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {mp.total > modifyBooking.amount ? '▲' : '▼'} ₹{Math.abs(mp.total - modifyBooking.amount).toLocaleString()} vs original
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="mt-4 text-xs text-gray-400 bg-yellow-50 rounded-lg p-2 text-center">
                    Price updates as you change amenities
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button type="submit" disabled={modifySubmitting} className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-60">
                      {modifySubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => { setModifyBooking(null); setModifyVenue(null); }} className="w-full py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      )}
    </CustomerLayout>
  );
}

