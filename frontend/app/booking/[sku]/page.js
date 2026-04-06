'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, MapPin, Users, Calendar, Clock,
  CheckCircle2, Coffee, Utensils, Wifi, X, Plus, Minus, IndianRupee
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import QuotationView from '@/components/booking/QuotationView';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [termsConditions, setTermsConditions] = useState(null);
  const [showQuotation, setShowQuotation] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(null);

  // Amenities state - editable on this page
  const [selectedAmenities, setSelectedAmenities] = useState({
    basic: [], beverages: [], refreshmentFood: [], lunchThalis: [], additional: []
  });
  const [quantities, setQuantities] = useState({});

  const [formData, setFormData] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    eventType: '', guestCount: '', specialRequirements: '', acceptTerms: false
  });

  useEffect(() => {
    if (!token) {
      toast.error('Please login to book a venue');
      router.push(`/login?redirect=/booking/${params.sku}`);
      return;
    }
    fetchVenue();
    fetchTermsConditions();
    fetchPlatformSettings();

    const savedData = localStorage.getItem('bookingData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setBookingData(parsed);
      // Restore amenities & quantities from saved booking data
      if (parsed.selectedAmenities) setSelectedAmenities(parsed.selectedAmenities);
      if (parsed.quantities) setQuantities(parsed.quantities);
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || '',
        customerEmail: user.email || '',
        customerPhone: user.phone || ''
      }));
    }
  }, [params.sku, token, user]);

  // Auto-select free amenities when venue loads
  useEffect(() => {
    if (!venue?.amenities?.basic) return;
    const freeOnes = venue.amenities.basic.filter(a => a.available && (a.type === 'Free' || a.type === 'Included'));
    if (freeOnes.length > 0) {
      setSelectedAmenities(prev => ({
        ...prev,
        basic: [...prev.basic, ...freeOnes.filter(fa => !prev.basic.some(pa => pa.name === fa.name))]
      }));
    }
  }, [venue]);

  const fetchPlatformSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`);
      const data = await res.json();
      if (data.success) setPlatformSettings(data.settings);
    } catch (e) { /* use defaults */ }
  };

  const fetchTermsConditions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/terms-conditions/active`);
      const data = await res.json();
      if (data.success && data.terms) setTermsConditions(data.terms);
    } catch (e) {}
  };

  const fetchVenue = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/sku/${params.sku}`);
      const data = await res.json();
      if (data.success) {
        setVenue(data.venue);
      } else {
        toast.error('Venue not found');
        router.push('/venues');
      }
    } catch (e) {
      toast.error('Failed to load venue');
    } finally {
      setLoading(false);
    }
  };

  // ── Amenity toggle ──────────────────────────────────────────────────────────
  const toggleAmenity = (category, item) => {
    const key = item.name ? `${category}_${item.name}` : `${category}_${item.thaliType}_${item.category}`;
    setSelectedAmenities(prev => {
      const list = prev[category];
      const exists = list.find(a => (a.name || `${a.thaliType}_${a.category}`) === (item.name || `${item.thaliType}_${item.category}`));
      if (exists) {
        setQuantities(q => { const n = { ...q }; delete n[key]; return n; });
        return { ...prev, [category]: list.filter(a => (a.name || `${a.thaliType}_${a.category}`) !== (item.name || `${item.thaliType}_${item.category}`)) };
      }
      setQuantities(q => ({ ...q, [key]: 1 }));
      return { ...prev, [category]: [...list, item] };
    });
  };

  const isSelected = (category, item) =>
    selectedAmenities[category]?.some(a => (a.name || `${a.thaliType}_${a.category}`) === (item.name || `${item.thaliType}_${item.category}`));

  const updateQty = (key, val) => {
    const qty = Math.max(0, parseInt(val) || 0);
    setQuantities(prev => ({ ...prev, [key]: qty }));
  };

  // ── Live Price Calculation ──────────────────────────────────────────────────
  const calculatePrice = useCallback(() => {
    if (!venue || !bookingData) return { basePrice: 0, amenitiesTotal: 0, subtotal: 0, gst: 0, platformFee: 0, platformFeeGST: 0, total: 0 };

    const duration = parseInt(bookingData.duration);
    let basePrice = 0;
    if (duration === 1 || duration === 2) basePrice = (venue.pricing?.perHour?.weekday || 0) * duration;
    else if (duration === 4) basePrice = venue.pricing?.halfDay?.weekday || 0;
    else if (duration === 8) basePrice = venue.pricing?.fullDay?.weekday || 0;

    let amenitiesTotal = 0;

    // Basic (paid)
    selectedAmenities.basic.forEach(a => {
      if (a.type === 'Paid') {
        if (a.rateType === 'Per Use') amenitiesTotal += (a.rate || 0) * (quantities[`basic_${a.name}`] || 0);
        else amenitiesTotal += a.rate || 0;
      }
    });
    // Beverages
    selectedAmenities.beverages.forEach(b => {
      amenitiesTotal += (b.ratePerUnit || 0) * (quantities[`beverages_${b.name}`] || 0);
    });
    // Refreshment food
    selectedAmenities.refreshmentFood.forEach(f => {
      amenitiesTotal += (f.ratePerPlate || 0) * (quantities[`refreshmentFood_${f.name}`] || 0);
    });
    // Lunch thalis
    selectedAmenities.lunchThalis.forEach(t => {
      amenitiesTotal += (t.ratePerPlate || 0) * (quantities[`lunchThalis_${t.thaliType}_${t.category}`] || 0);
    });
    // Additional
    selectedAmenities.additional.forEach(a => {
      if (a.type === 'Paid') amenitiesTotal += a.charges || 0;
    });

    const subtotal = basePrice + amenitiesTotal;

    // GST rates
    const venueCGSTRate = venue.customGST?.enabled ? venue.customGST.rate / 2 : (platformSettings?.venueCGST || 9);
    const venueSGSTRate = venue.customGST?.enabled ? venue.customGST.rate / 2 : (platformSettings?.venueSGST || 9);
    const gstRate = venueCGSTRate + venueSGSTRate;
    const gst = Math.round((subtotal * gstRate) / 100);

    // Platform fee
    const pfRate = venue.customPlatformFee?.enabled ? venue.customPlatformFee.percentage : (platformSettings?.platformFeePercentage || 5);
    const platformFee = Math.round((subtotal * pfRate) / 100);
    const pfGSTRate = (platformSettings?.platformCGST || 9) + (platformSettings?.platformSGST || 9);
    const platformFeeGST = Math.round((platformFee * pfGSTRate) / 100);

    const total = subtotal + gst + platformFee + platformFeeGST;

    return {
      basePrice, amenitiesTotal, subtotal,
      gst, gstRate,
      platformFee, platformFeeGST, pfRate,
      total
    };
  }, [venue, bookingData, selectedAmenities, quantities, platformSettings]);

  const pricing = calculatePrice();

  const getDurationLabel = (duration) => {
    const d = parseInt(duration);
    if (d === 8) return 'Full Day (8 hrs)';
    if (d === 4) return 'Half Day (4 hrs)';
    return `${d} Hour${d > 1 ? 's' : ''}`;
  };

  // ── Submit Booking ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.acceptTerms) return toast.error('Please accept terms and conditions');
    if (!formData.eventType || !formData.guestCount) return toast.error('Please fill all required fields');
    if (!bookingData) return toast.error('Booking data missing. Please go back and select date/time.');

    setSubmitting(true);
    try {
      // Build selected amenities with totals for backend
      const amenitiesPayload = {
        basic: selectedAmenities.basic.map(a => ({
          ...a,
          quantity: a.rateType === 'Per Use' ? (quantities[`basic_${a.name}`] || 1) : 1,
          total: a.type === 'Paid' ? (a.rateType === 'Per Use' ? (a.rate || 0) * (quantities[`basic_${a.name}`] || 0) : (a.rate || 0)) : 0
        })),
        beverages: selectedAmenities.beverages.map(b => ({
          ...b,
          quantity: quantities[`beverages_${b.name}`] || 1,
          total: (b.ratePerUnit || 0) * (quantities[`beverages_${b.name}`] || 0)
        })),
        refreshmentFood: selectedAmenities.refreshmentFood.map(f => ({
          ...f,
          quantity: quantities[`refreshmentFood_${f.name}`] || 1,
          total: (f.ratePerPlate || 0) * (quantities[`refreshmentFood_${f.name}`] || 0)
        })),
        lunchThalis: selectedAmenities.lunchThalis.map(t => ({
          ...t,
          quantity: quantities[`lunchThalis_${t.thaliType}_${t.category}`] || 1,
          total: (t.ratePerPlate || 0) * (quantities[`lunchThalis_${t.thaliType}_${t.category}`] || 0)
        })),
        additional: selectedAmenities.additional.map(a => ({
          ...a,
          quantity: 1,
          total: a.type === 'Paid' ? (a.charges || 0) : 0
        }))
      };

      const priceBreakdown = {
        basePrice: pricing.basePrice,
        amenitiesTotal: pricing.amenitiesTotal,
        subtotal: pricing.subtotal,
        gst: pricing.gst,
        gstRate: pricing.gstRate,
        platformFee: pricing.platformFee,
        platformFeeGST: pricing.platformFeeGST,
        platformFeeRate: pricing.pfRate,
        total: pricing.total
      };

      const payload = {
        venue: venue._id,
        bookingDate: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime || calculateEndTime(bookingData.startTime, bookingData.duration),
        bookingType: parseInt(bookingData.duration) <= 2 ? 'hourly' : parseInt(bookingData.duration) === 4 ? 'halfday' : 'fullday',
        amount: pricing.total,
        selectedAmenities: amenitiesPayload,
        amenitiesTotal: pricing.amenitiesTotal,
        priceBreakdown,
        customerDetails: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
          eventType: formData.eventType,
          guestCount: parseInt(formData.guestCount),
          specialRequirements: formData.specialRequirements
        }
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Booking created successfully!');
        localStorage.removeItem('bookingData');
        router.push('/customer/bookings');
      } else {
        toast.error(data.message || 'Booking failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateEndTime = (startTime, duration) => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + parseInt(duration) * 60;
    return `${String(Math.floor(totalMins / 60) % 24).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
  };

  const handleGenerateQuotation = (e) => {
    e.preventDefault();
    if (!formData.acceptTerms) return toast.error('Please accept terms and conditions');
    if (!formData.eventType || !formData.guestCount) return toast.error('Please fill all required fields');
    setShowQuotation(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );

  if (!venue) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Venue Not Found</h2>
        <Link href="/venues" className="btn-primary inline-flex items-center gap-2 mt-4">
          <ArrowLeft className="w-5 h-5" /> Back to Venues
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-white border-b border-gray-200 mt-[102px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/venues/${params.sku}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to venue details</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Venue Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Venue Details</h2>
              <div className="flex items-start gap-4">
                {venue.images?.[0]?.url && (
                  <img src={venue.images[0].url} alt={venue.businessName} className="w-32 h-32 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{venue.businessName}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-500" />{venue.location?.city}, {venue.location?.area}</div>
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary-500" />Up to {venue.capacity} guests</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary-500" />{venue.availability?.openingTime} - {venue.availability?.closingTime}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            {bookingData && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="font-semibold">{bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Start Time</p>
                    <p className="font-semibold">{bookingData.startTime || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                    <p className="font-semibold">{getDurationLabel(bookingData.duration || '1')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Amenities Selection (Editable) ── */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Select Amenities & Services</h2>
              <p className="text-sm text-gray-500 mb-5">Add or remove amenities — price updates live</p>

              {/* Basic Amenities */}
              {venue.amenities?.basic?.filter(a => a.available).length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Wifi className="w-4 h-4 text-blue-500" />Basic Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {venue.amenities.basic.filter(a => a.available).map((amenity, idx) => {
                      const isFree = amenity.type === 'Free' || amenity.type === 'Included';
                      const sel = isSelected('basic', amenity);
                      const key = `basic_${amenity.name}`;
                      return (
                        <div key={idx} className={`p-3 border-2 rounded-lg transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200'} ${isFree ? 'opacity-90' : ''}`}>
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={sel} onChange={() => !isFree && toggleAmenity('basic', amenity)} disabled={isFree} className="w-4 h-4 accent-primary-500" />
                              <span className="text-sm font-medium">{amenity.name}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isFree ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {isFree ? 'Free' : `₹${amenity.rate}`}
                            </span>
                          </label>
                          {!isFree && amenity.rateType === 'Per Use' && sel && (
                            <div className="flex items-center gap-2 mt-2 ml-6">
                              <button type="button" onClick={() => updateQty(key, (quantities[key] || 0) - 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                              <span className="w-8 text-center text-sm font-semibold">{quantities[key] || 0}</span>
                              <button type="button" onClick={() => updateQty(key, (quantities[key] || 0) + 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Beverages */}
              {venue.amenities?.beverages?.filter(b => b.available).length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Coffee className="w-4 h-4 text-amber-500" />Beverages</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {venue.amenities.beverages.filter(b => b.available).map((bev, idx) => {
                      const sel = isSelected('beverages', bev);
                      const key = `beverages_${bev.name}`;
                      return (
                        <div key={idx} className={`p-3 border-2 rounded-lg transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={sel} onChange={() => toggleAmenity('beverages', bev)} className="w-4 h-4 accent-primary-500" />
                              <span className="text-sm font-medium">{bev.name}</span>
                            </div>
                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">₹{bev.ratePerUnit}/unit</span>
                          </label>
                          {sel && (
                            <div className="flex items-center gap-2 mt-2 ml-6">
                              <button type="button" onClick={() => updateQty(key, (quantities[key] || 0) - 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                              <span className="w-8 text-center text-sm font-semibold">{quantities[key] || 0}</span>
                              <button type="button" onClick={() => updateQty(key, (quantities[key] || 0) + 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Refreshment Food */}
              {venue.amenities?.refreshmentFood?.filter(f => f.available).length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Utensils className="w-4 h-4 text-green-500" />Refreshments & Snacks</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {venue.amenities.refreshmentFood.filter(f => f.available).map((food, idx) => {
                      const sel = isSelected('refreshmentFood', food);
                      const key = `refreshmentFood_${food.name}`;
                      return (
                        <div key={idx} className={`p-3 border-2 rounded-lg transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={sel} onChange={() => toggleAmenity('refreshmentFood', food)} className="w-4 h-4 accent-primary-500" />
                              <span className="text-sm font-medium">{food.name}</span>
                            </div>
                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">₹{food.ratePerPlate}/plate</span>
                          </label>
                          {sel && (
                            <div className="flex items-center gap-2 mt-2 ml-6">
                              <button type="button" onClick={() => updateQty(key, (quantities[key] || 0) - 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                              <span className="w-8 text-center text-sm font-semibold">{quantities[key] || 0}</span>
                              <button type="button" onClick={() => updateQty(key, (quantities[key] || 0) + 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lunch Thalis */}
              {venue.amenities?.lunchThalis?.filter(t => t.available).length > 0 && (
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Utensils className="w-4 h-4 text-red-500" />Lunch Thalis</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {venue.amenities.lunchThalis.filter(t => t.available).flatMap(thali =>
                      (thali.categories || []).map((cat, idx) => {
                        const item = { thaliType: thali.thaliType, category: cat.category, ratePerPlate: cat.ratePerPlate, numberOfItems: cat.numberOfItems, itemNames: cat.itemNames };
                        const sel = isSelected('lunchThalis', item);
                        const key = `lunchThalis_${item.thaliType}_${item.category}`;
                        return (
                          <div key={`${thali.thaliType}_${idx}`} className={`p-3 border-2 rounded-lg transition-all ${sel ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                            <label className="flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={sel} onChange={() => toggleAmenity('lunchThalis', item)} className="w-4 h-4 accent-primary-500" />
                                <div>
                                  <span className="text-sm font-medium block">{thali.thaliType}</span>
                                  <span className="text-xs text-gray-500">{cat.category}</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">₹{cat.ratePerPlate}/plate</span>
                            </label>
                            {sel && (
                              <div className="flex items-center gap-2 mt-2 ml-6">
                                <button type="button" onClick={() => updateQty(key, (quantities[key] || 0) - 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                                <span className="w-8 text-center text-sm font-semibold">{quantities[key] || 0}</span>
                                <button type="button" onClick={() => updateQty(key, (quantities[key] || 0) + 1)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Details Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input type="text" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                  <input type="tel" required value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Event Type *</label>
                  <select required value={formData.eventType} onChange={e => setFormData({...formData, eventType: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select event type</option>
                    {['Corporate Meeting','Conference','Training/Workshop','Seminar','Product Launch','Team Building','Birthday Party','Wedding','Anniversary','Reception','Other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Guests *</label>
                  <input type="number" required min="1" value={formData.guestCount} onChange={e => setFormData({...formData, guestCount: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Special Requirements</label>
                <textarea rows="3" value={formData.specialRequirements} onChange={e => setFormData({...formData, specialRequirements: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Any special requests..." />
              </div>

              {/* Terms */}
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-3 max-h-40 overflow-y-auto text-sm text-gray-700">
                  {termsConditions ? (
                    <div dangerouslySetInnerHTML={{ __html: termsConditions.content.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Advance booking required with confirmation</li>
                      <li>Cancellation 7+ days: 100% refund | 3-7 days: 50% | Less than 3 days: No refund</li>
                      <li>Venue capacity must not be exceeded</li>
                      <li>Damage to property will be charged</li>
                    </ul>
                  )}
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.acceptTerms} onChange={e => setFormData({...formData, acceptTerms: e.target.checked})} className="mt-1" />
                  <span className="text-sm text-gray-700">I have read and accept the terms and conditions</span>
                </label>
              </div>

              {/* Note: Payment is optional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-sm text-blue-800">
                <strong>Note:</strong> Booking will be created with <em>pending payment</em> status. You can pay later or as per venue's payment terms after confirmation.
              </div>

              <div className="flex gap-3">
                <Link href={`/venues/${params.sku}`} className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center">
                  Cancel
                </Link>
                <button type="button" onClick={handleGenerateQuotation} className="flex-1 px-4 py-3 border-2 border-primary-500 text-primary-500 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                  Get Quotation
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-60">
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Live Price Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-white rounded-xl shadow-xl p-6 border-2 border-primary-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary-500" /> Price Summary
              </h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price ({getDurationLabel(bookingData?.duration || '1')})</span>
                  <span className="font-semibold">₹{pricing.basePrice.toLocaleString()}</span>
                </div>
                {pricing.amenitiesTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amenities & Services</span>
                    <span className="font-semibold">₹{pricing.amenitiesTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{pricing.subtotal.toLocaleString()}</span>
                </div>
                {pricing.gst > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>GST ({pricing.gstRate}%)</span>
                    <span>₹{pricing.gst.toLocaleString()}</span>
                  </div>
                )}
                {pricing.platformFee > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Platform Fee ({pricing.pfRate}%)</span>
                    <span>₹{pricing.platformFee.toLocaleString()}</span>
                  </div>
                )}
                {pricing.platformFeeGST > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Platform Fee GST</span>
                    <span>₹{pricing.platformFeeGST.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-primary-600">₹{pricing.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                Price updates automatically as you add/remove amenities
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Modal */}
      {showQuotation && (
        <QuotationView
          venue={venue}
          bookingData={{
            ...bookingData,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone,
            eventType: formData.eventType,
            guestCount: formData.guestCount,
            specialRequirements: formData.specialRequirements
          }}
          pricing={pricing}
          onClose={() => setShowQuotation(false)}
        />
      )}
    </div>
  );
}
