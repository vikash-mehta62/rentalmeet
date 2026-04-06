'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import CustomerLayout from '@/components/customer/CustomerLayout';
import {
  Calendar, CheckCircle2, XCircle, Clock, MapPin, IndianRupee,
  AlertCircle, Search, Download, User, Mail, Phone, Building2,
  Wifi, Coffee, Utensils, Plus, Minus, ArrowLeft, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceDownload from '@/components/booking/InvoiceDownload';

export default function CustomerBookings() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
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
    fetchBookings();
  }, [token, user]);

  useEffect(() => {
    filterBookings();
  }, [bookings, filterStatus, searchQuery]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.venue?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.venue?.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
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

    return { basePrice, amenitiesTotal, subtotal, discount, gst, gstRate, platformFee, platformFeeGST, pfRate, total };
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
            gst: mp.gst,
            gstRate: mp.gstRate,
            platformFee: mp.platformFee,
            platformFeeGST: mp.platformFeeGST,
            platformFeeRate: mp.pfRate,
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

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: 'Cancelled by customer'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Something went wrong');
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
    <CustomerLayout activePage="bookings">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 sm:px-6 lg:px-8 py-8 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">My Bookings</h1>
          <p className="text-primary-100">{filteredBookings.length} booking(s) found</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by venue name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                      }`}>{booking.status.toUpperCase()}</span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary-500"/>{new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary-500"/>{booking.startTime} - {booking.endTime}</span>
                      <span className="flex items-center gap-1 font-bold text-primary-600"><IndianRupee className="w-3.5 h-3.5"/>₹{booking.amount?.toLocaleString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Search className="w-3.5 h-3.5"/> View Details
                      </button>
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openModify(booking)}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            ✏️ Modify
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
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
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
                }`}>{selectedBooking.status.toUpperCase()}</span>
                <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Key Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/>Location</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedBooking.venue?.location?.city}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/>Date</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/>Time</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
                <div className="bg-green-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3"/>Amount</p>
                  <p className="text-sm font-bold text-green-600">₹{selectedBooking.amount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Event Details */}
              {selectedBooking.customerDetails && (
                <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">Event Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-slate-300">
                    {selectedBooking.customerDetails.eventType && <p><span className="font-semibold">Event:</span> {selectedBooking.customerDetails.eventType}</p>}
                    {selectedBooking.customerDetails.guestCount && <p><span className="font-semibold">Guests:</span> {selectedBooking.customerDetails.guestCount}</p>}
                    {selectedBooking.customerDetails.specialRequirements && (
                      <p className="col-span-2"><span className="font-semibold">Special Requirements:</span> {selectedBooking.customerDetails.specialRequirements}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Price Breakdown</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Base Price</span><span className="font-semibold">₹{(selectedBooking.priceBreakdown?.basePrice || 0).toLocaleString()}</span></div>
                  {selectedBooking.amenitiesTotal > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Amenities</span><span className="font-semibold">₹{selectedBooking.amenitiesTotal?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.gst > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">GST</span><span className="font-semibold">₹{selectedBooking.priceBreakdown.gst?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.platformFee > 0 && <div className="flex justify-between"><span className="text-gray-600 dark:text-slate-400">Platform Fee</span><span className="font-semibold">₹{selectedBooking.priceBreakdown.platformFee?.toLocaleString()}</span></div>}
                  {selectedBooking.priceBreakdown?.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount {selectedBooking.priceBreakdown.couponCode ? `(${selectedBooking.priceBreakdown.couponCode})` : ''}</span>
                      <span className="font-semibold">- ₹{selectedBooking.priceBreakdown.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-1.5 font-bold text-base"><span>Total</span><span className="text-primary-600">₹{selectedBooking.amount?.toLocaleString()}</span></div>
                </div>
              </div>

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
                const amountDue = balance > 0 ? balance : 0;
                const refundDue = balance < 0 ? Math.abs(balance) : 0;
                const isSettled = balance === 0;

                const txns = ledger?.transactions || [];
                const adjustments = ledger?.adjustments || [];

                return (
                  <div className="rounded-xl border-2 border-gray-200 dark:border-slate-700 overflow-hidden">
                    {/* Balance Bar */}
                    <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-slate-700">
                      <div className="p-3 text-center bg-white dark:bg-slate-800">
                        <p className="text-[10px] text-gray-500 mb-0.5">Total Due</p>
                        <p className="text-base font-black text-gray-900 dark:text-slate-100">₹{currentDue.toLocaleString()}</p>
                      </div>
                      <div className="p-3 text-center bg-green-50 dark:bg-slate-800">
                        <p className="text-[10px] text-gray-500 mb-0.5">Paid</p>
                        <p className="text-base font-black text-green-600">₹{netPaid.toLocaleString()}</p>
                      </div>
                      <div className={`p-3 text-center ${refundDue > 0 ? 'bg-blue-50' : amountDue > 0 ? 'bg-red-50' : 'bg-green-50'} dark:bg-slate-800`}>
                        <p className="text-[10px] text-gray-500 mb-0.5">
                          {refundDue > 0 ? 'Refund Due' : amountDue > 0 ? 'Balance Due' : 'Settled'}
                        </p>
                        <p className={`text-base font-black ${refundDue > 0 ? 'text-blue-600' : amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {refundDue > 0 ? `₹${refundDue.toLocaleString()}` : amountDue > 0 ? `₹${amountDue.toLocaleString()}` : '✓ Clear'}
                        </p>
                      </div>
                    </div>

                    {/* Status banners */}
                    {refundDue > 0 && (
                      <div className="bg-blue-50 border-t border-blue-200 px-4 py-2.5 text-xs text-blue-800 font-semibold flex items-center gap-2">
                        💰 Refund of ₹{refundDue.toLocaleString()} is due — admin will process it shortly.
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
                                <p>→</p>
                                <p className="font-bold text-gray-800">₹{adj.newAmount?.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                          {txns.filter(t => t.type !== 'adjustment').map((txn, i) => (
                            <div key={`txn-${i}`} className={`flex items-start gap-3 text-xs p-2.5 rounded-lg border ${['payment','manual_payment'].includes(txn.type) ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${['payment','manual_payment'].includes(txn.type) ? 'bg-green-200' : 'bg-red-200'}`}>
                                {['payment','manual_payment'].includes(txn.type)
                                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                                  : <XCircle className="w-3.5 h-3.5 text-red-700" />}
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

              {/* Invoice — only confirmed/completed */}
              {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed') && (
                <div>
                  <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">Download Invoice</p>
                  <InvoiceDownload booking={selectedBooking} userRole="customer" />
                </div>
              )}

              {/* Cancellation info */}
              {selectedBooking.status === 'cancelled' && selectedBooking.cancellationReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                  <p className="text-red-800 font-semibold mb-1">Cancellation Reason</p>
                  <p className="text-red-700 text-xs">{selectedBooking.cancellationReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
                            <span>Platform Fee ({mp.pfRate}%)</span>
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

