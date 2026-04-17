'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { categoryIconMap } from '@/data/serviceData';
import { useAuthStore } from '@/lib/store';
import ServiceQuotationModal from '@/components/service/ServiceQuotationModal';
import {
  ArrowLeft, MapPin, BadgeCheck, Package, FileText,
  Plus, Minus, Download, ChevronLeft, ChevronRight,
  Clock, Phone, Globe, Instagram, Facebook, Star, X, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── Availability Calendar ─────────────────────────────────────────────────
function AvailabilityCalendar({ availability, blockedDates, advanceBooking, customAdvanceDays, onSelectDate, selectedDate }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });

  const today = new Date(); today.setHours(0,0,0,0);

  // Advance booking cutoff
  const advanceDays = advanceBooking === 'same-day' ? 0
    : advanceBooking === '24h' ? 1
    : advanceBooking === '48h' ? 2
    : advanceBooking === '1week' ? 7
    : advanceBooking === 'custom' ? (customAdvanceDays || 1)
    : 1;

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + advanceDays);

  // Available days set from availability array
  const availableDayNames = new Set(
    (availability || []).filter(a => a.isAvailable).map(a => a.day)
  );

  // Blocked dates set (normalize to YYYY-MM-DD in local time)
  const blockedSet = new Set(
    (blockedDates || []).map(b => {
      const d = new Date(b.date);
      // Use local date parts to avoid UTC offset shifting the date
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isDisabled = (day) => {
    if (!day) return true;
    const date = new Date(year, month, day);
    date.setHours(0,0,0,0);
    const dayName = DAYS[date.getDay()];
    // Build ISO string from local date parts (avoid UTC offset issue)
    const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if (date < cutoff) return true;
    if (!availableDayNames.has(dayName)) return true;
    if (blockedSet.has(iso)) return true;
    return false;
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return iso === selectedDate;
  };

  const isToday = (day) => {
    if (!day) return false;
    const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const todayIso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    return iso === todayIso;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-gray-800 text-sm">
          {viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const todayMark = isToday(day);
          return (
            <button key={i} disabled={disabled || !day}
              onClick={() => {
                if (!day || disabled) return;
                const d = new Date(year, month, day);
                onSelectDate(d.toISOString().slice(0,10));
              }}
              className={`aspect-square rounded-lg text-xs font-medium transition-all
                ${!day ? 'invisible' : ''}
                ${selected ? 'bg-primary-500 text-white shadow-md' : ''}
                ${!selected && !disabled && day ? 'hover:bg-primary-50 hover:text-primary-700 text-gray-800' : ''}
                ${disabled && day ? 'text-gray-300 cursor-not-allowed line-through' : ''}
                ${todayMark && !selected ? 'ring-2 ring-primary-300' : ''}
              `}>
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-500 inline-block" />Selected</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" />Unavailable</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-2 ring-primary-300 inline-block" />Today</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [svc, setSvc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [platformSettings, setPlatformSettings] = useState(null);

  // Selection state
  const [selectedDate, setSelectedDate] = useState('');
  const [quantities, setQuantities] = useState({});

  // Booking modal state
  const [bookingModal, setBookingModal] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', eventName: '', notes: '' });
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Quotation modal (after booking)
  const [showQuotationModal, setShowQuotationModal] = useState(false);

  // Auto-fill form from logged-in user
  useEffect(() => {
    if (user) {
      setForm(p => ({
        ...p,
        name:    p.name    || user.name    || '',
        email:   p.email   || user.email   || '',
        phone:   p.phone   || user.phone   || '',
        company: p.company || user.companyName || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    // Load Razorpay script
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor-services/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSvc(d.service); })
      .catch(() => toast.error('Failed to load service'))
      .finally(() => setLoading(false));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-platform-settings`)
      .then(r => r.json())
      .then(d => { if (d.success) setPlatformSettings(d.settings); })
      .catch(() => {});
  }, [id]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center pt-40">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!svc) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center pt-40 flex-col gap-4">
        <Package className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-600">Service not found</h2>
        <button onClick={() => router.push('/other-services')} className="text-primary-500 hover:underline text-sm">Back to Services</button>
      </div>
    </div>
  );

  const cat = categoryIconMap[svc.category];
  const Icon = cat?.icon ?? Package;

  const packages = (svc.packages || []).filter(p => p.name);
  const subtotal = packages.reduce((sum, pkg, i) => sum + (pkg.price || 0) * (quantities[i] || 0), 0);

  // Get rates for this service's category
  const catRate = platformSettings?.serviceCategoryRates?.find(r => r.category === svc.category);
  const cgstPct = catRate?.cgst ?? platformSettings?.serviceCGST ?? 9;
  const sgstPct = catRate?.sgst ?? platformSettings?.serviceSGST ?? 9;
  const platformFeePct = catRate?.platformFee ?? platformSettings?.servicePlatformFee ?? 5;
  const platformCgstPct = catRate?.platformCGST ?? platformSettings?.platformCGST ?? 9;
  const platformSgstPct = catRate?.platformSGST ?? platformSettings?.platformSGST ?? 9;

  const serviceCgst = Math.round(subtotal * cgstPct / 100);
  const serviceSgst = Math.round(subtotal * sgstPct / 100);
  const platformFee = Math.round(subtotal * platformFeePct / 100);
  const platformFeeGst = Math.round(platformFee * (platformCgstPct + platformSgstPct) / 100);
  const total = subtotal + serviceCgst + serviceSgst + platformFee + platformFeeGst;
  const hasItems = subtotal > 0;
  const quoteNo = `QT-${id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const setQty = (i, delta) => setQuantities(prev => ({ ...prev, [i]: Math.max(0, (prev[i] || 0) + delta) }));

  const handleBookNow = () => {
    if (!selectedDate) { toast.error('Please select an event date'); return; }
    if (!hasItems) { toast.error('Please select at least one service'); return; }
    setBookingModal('form');
  };

  // Create booking record (shared helper)
  const createBookingRecord = async () => {
    const items = packages
      .map((pkg, i) => ({ name: pkg.name, price: pkg.price || 0, unit: pkg.unit, quantity: quantities[i] || 0, amount: (pkg.price || 0) * (quantities[i] || 0) }))
      .filter(it => it.quantity > 0);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: id, eventDate: selectedDate,
        customerInfo: form, items,
        pricing: { subtotal, serviceCgst, serviceSgst, cgstPct, sgstPct, platformFee, platformFeePct, platformFeeGst, total },
        couponCode: couponApplied?.code || undefined
      })
    });
    return res.json();
  };

  // Download quotation without payment
  const handleDownloadQuotation = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { toast.error('Name, email & phone required'); return; }
    setSubmitting(true);
    try {
      const data = await createBookingRecord();
      if (data.success) {
        setBooking(data.booking);
        setBookingModal(false);
        setShowQuotationModal(true);
        toast.success('Quotation ready to download!');
      } else toast.error(data.message);
    } catch { toast.error('Something went wrong'); }
    finally { setSubmitting(false); }
  };

  const handleSubmitBooking = async () => {
    if (!form.name.trim()) { toast.error('Full name required'); return; }
    if (!form.email.trim()) { toast.error('Email required'); return; }
    if (!form.phone.trim()) { toast.error('Phone required'); return; }
    setSubmitting(true);
    try {
      // Step 1: Create booking record (pending payment)
      const bookData = await createBookingRecord();
      if (!bookData.success) { toast.error(bookData.message); setSubmitting(false); return; }

      const createdBooking = bookData.booking;

      // Step 2: Create Razorpay order
      const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: finalTotal, bookingId: createdBooking._id, bookingType: 'service' })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) { toast.error('Payment setup failed'); setSubmitting(false); return; }

      // Step 3: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'RentalMeet',
        description: `Service Booking — ${svc.title}`,
        order_id: orderData.order.id,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#F59E0B' },
        handler: async (response) => {
          // Step 4: Verify payment
          const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: createdBooking._id,
              bookingType: 'service',
              paidAmount: total
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setBooking(verifyData.booking);
            setBookingModal('success');
            toast.success('Payment successful! Booking confirmed.');
          } else {
            toast.error('Payment verification failed. Contact support.');
          }
          setSubmitting(false);
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            setSubmitting(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong');
      setSubmitting(false);
    }
  };

  // Availability days display
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, serviceId: id, bookingAmount: total })
      });
      const data = await res.json();
      if (data.success) {
        setCouponApplied({ code: data.coupon.code, discountAmount: data.discountAmount });
        toast.success(`Coupon applied! ₹${data.discountAmount} off`);
      } else toast.error(data.message);
    } catch { toast.error('Failed to validate coupon'); }
    finally { setCouponLoading(false); }
  };

  const finalTotal = couponApplied ? Math.max(0, total - couponApplied.discountAmount) : total;
  const availDays = (svc.availability || []).filter(a => a.isAvailable);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-28 lg:pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <button onClick={() => router.push('/other-services')}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT — Service Info */}
            <div className="lg:col-span-2 space-y-5">

              {/* Hero Image */}
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-gray-200">
                {svc.featuredImage
                  ? <img src={svc.featuredImage} alt={svc.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Package className="w-20 h-20 text-gray-300" /></div>
                }
                {!svc.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full text-sm">Currently Unavailable</span>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <h1 className="text-2xl font-bold text-gray-900">{svc.title}</h1>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: cat?.bg || '#f3f4f6', color: cat?.iconColor || '#374151' }}>
                    <Icon className="w-3.5 h-3.5" />{cat?.label || svc.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary-500" />{[svc.city, svc.state].filter(Boolean).join(', ') || '—'}</span>
                  <span className="flex items-center gap-1 text-green-600"><BadgeCheck className="w-4 h-4" />Verified Vendor</span>
                  {svc.vendor?.companyName && <span className="text-gray-400">{svc.vendor.companyName}</span>}
                </div>
                {svc.description && <p className="text-gray-600 leading-relaxed mb-4">{svc.description}</p>}
                {svc.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {svc.tags.map(tag => <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{tag}</span>)}
                  </div>
                )}
                {/* Social links */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  {svc.website && <a href={svc.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"><Globe className="w-3.5 h-3.5" />Website</a>}
                  {svc.instagram && <a href={`https://instagram.com/${svc.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600"><Instagram className="w-3.5 h-3.5" />Instagram</a>}
                  {svc.facebook && <a href={`https://facebook.com/${svc.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"><Facebook className="w-3.5 h-3.5" />Facebook</a>}
                </div>
              </div>

              {/* Availability Info */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary-500" />Working Hours</h3>
                {availDays.length === 0 ? (
                  <p className="text-sm text-gray-400">Availability not set</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availDays.map(a => (
                      <div key={a.day} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700">{a.day.slice(0,3)}</span>
                        <span className="text-xs text-gray-500">{a.startTime} – {a.endTime}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio */}
              {svc.images?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Portfolio</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {svc.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt="" className="w-full h-28 object-cover rounded-xl hover:opacity-90 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Rate List + Qty selector */}
              {packages.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-primary-500" />Services & Rate List</h3>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Service</th>
                          <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Rate</th>
                          <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Unit</th>
                          <th className="text-center px-4 py-2.5 text-gray-500 font-semibold w-28">Qty</th>
                          <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packages.map((pkg, i) => {
                          const qty = quantities[i] || 0;
                          return (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2.5 text-gray-800">{pkg.name}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-primary-600">₹{(pkg.price || 0).toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{pkg.unit}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-center gap-1">
                                  <button type="button" onClick={() => setQty(i, -1)} disabled={qty === 0}
                                    className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-all">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-7 text-center font-bold text-sm">{qty}</span>
                                  <button type="button" onClick={() => setQty(i, 1)}
                                    className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold">{qty > 0 ? `₹${((pkg.price || 0) * qty).toLocaleString()}` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {hasItems && (
                        <tfoot className="border-t border-gray-200">
                          <tr><td colSpan={4} className="px-4 py-1.5 text-right text-gray-500 text-xs">Subtotal</td><td className="px-4 py-1.5 text-right font-medium">₹{subtotal.toLocaleString()}</td></tr>
                          <tr><td colSpan={4} className="px-4 py-1.5 text-right text-gray-500 text-xs">CGST ({cgstPct}%)</td><td className="px-4 py-1.5 text-right font-medium">₹{serviceCgst.toLocaleString()}</td></tr>
                          <tr><td colSpan={4} className="px-4 py-1.5 text-right text-gray-500 text-xs">SGST ({sgstPct}%)</td><td className="px-4 py-1.5 text-right font-medium">₹{serviceSgst.toLocaleString()}</td></tr>
                          <tr><td colSpan={4} className="px-4 py-1.5 text-right text-gray-500 text-xs">Platform Fee ({platformFeePct}%)</td><td className="px-4 py-1.5 text-right font-medium">₹{platformFee.toLocaleString()}</td></tr>
                          <tr><td colSpan={4} className="px-4 py-1.5 text-right text-gray-500 text-xs">Platform GST ({platformCgstPct + platformSgstPct}%)</td><td className="px-4 py-1.5 text-right font-medium">₹{platformFeeGst.toLocaleString()}</td></tr>
                          <tr className="bg-primary-50">
                            <td colSpan={4} className="px-4 py-2 text-right font-bold">Total</td>
                            <td className="px-4 py-2 text-right font-black text-primary-600">₹{total.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-4">

                {/* Price + Book Now */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">Starting from</p>
                  <p className="text-2xl font-black text-gray-900">
                    {svc.startingPrice ? `₹${svc.startingPrice.toLocaleString()}` : 'Price on request'}
                    {svc.startingPrice && <span className="text-sm font-normal text-gray-400 ml-1">onwards</span>}
                  </p>
                  {svc.contactInfo?.primaryMobile && (
                    <a href={`tel:${svc.contactInfo.primaryMobile}`}
                      className="flex items-center gap-2 mt-2 text-sm text-primary-600 hover:underline font-medium">
                      <Phone className="w-4 h-4" />+91 {svc.contactInfo.primaryMobile}
                    </a>
                  )}
                  <button onClick={handleBookNow}
                    disabled={!svc.isActive || !hasItems || !selectedDate || (svc.minimumOrderPrice && subtotal < svc.minimumOrderPrice)}
                    className="w-full mt-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {!svc.isActive ? 'Service Unavailable'
                      : !selectedDate ? 'Select a Date First'
                      : !hasItems ? 'Select Services First'
                      : (svc.minimumOrderPrice && subtotal < svc.minimumOrderPrice) ? `Min. Order ₹${svc.minimumOrderPrice.toLocaleString()} (₹${(svc.minimumOrderPrice - subtotal).toLocaleString()} more)`
                      : '🎉 Book Now'}
                  </button>
                  {hasItems && selectedDate && (
                    <p className="text-center text-xs text-gray-400 mt-2">Total: <strong className="text-primary-600">₹{total.toLocaleString()}</strong></p>
                  )}
                  {svc.minimumOrderPrice > 0 && (
                    <p className="text-center text-[10px] text-gray-400 mt-1">
                      Minimum order: ₹{svc.minimumOrderPrice.toLocaleString()}
                      {subtotal > 0 && subtotal < svc.minimumOrderPrice && (
                        <span className="text-orange-500 font-semibold"> · ₹{(svc.minimumOrderPrice - subtotal).toLocaleString()} more needed</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">Select Event Date</h3>
                  <AvailabilityCalendar
                    availability={svc.availability}
                    blockedDates={svc.blockedDates}
                    advanceBooking={svc.advanceBooking}
                    customAdvanceDays={svc.customAdvanceDays}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                  />
                  {selectedDate && (
                    <div className="mt-2 flex items-center justify-between bg-primary-50 rounded-xl px-3 py-2">
                      <span className="text-xs font-semibold text-primary-700">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={() => setSelectedDate('')} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Booking Modal ── */}
      {bookingModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mt-0">

            {/* FORM step */}
            {bookingModal === 'form' && (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Your Details</h2>
                  <button onClick={() => setBookingModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    { key: 'name',      label: 'Full Name *',            type: 'text' },
                    { key: 'company',   label: 'Company / Organisation', type: 'text' },
                    { key: 'email',     label: 'Email *',                type: 'email' },
                    { key: 'phone',     label: 'Phone *',                type: 'tel' },
                    { key: 'eventName', label: 'Event Name',             type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                      <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                    <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setBookingModal(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                    <button onClick={() => {
                      if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { toast.error('Name, email & phone required'); return; }
                      setBookingModal('review');
                    }} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-colors">
                      Review Booking →
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* REVIEW step */}
            {bookingModal === 'review' && (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Review & Confirm</h2>
                  <button onClick={() => setBookingModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Service + Date */}
                  <div className="bg-primary-50 rounded-xl p-4">
                    <p className="font-bold text-gray-900">{svc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{svc.vendor?.companyName || svc.vendor?.name} · {[svc.city, svc.state].filter(Boolean).join(', ')}</p>
                    <p className="text-xs font-semibold text-primary-700 mt-1">📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>

                  {/* Customer */}
                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <p className="text-xs font-bold text-gray-400 mb-2">YOUR DETAILS</p>
                    <p className="font-semibold">{form.name}</p>
                    {form.company && <p className="text-gray-500 text-xs">{form.company}</p>}
                    <p className="text-gray-500 text-xs">{form.email} · {form.phone}</p>
                    {form.eventName && <p className="text-gray-500 text-xs mt-1">Event: {form.eventName}</p>}
                  </div>

                  {/* Items */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
                    <table className="w-full">
                      <thead className="bg-gray-50"><tr>
                        <th className="text-left px-3 py-2 text-gray-500 text-xs font-semibold">Service</th>
                        <th className="text-right px-3 py-2 text-gray-500 text-xs font-semibold">Qty</th>
                        <th className="text-right px-3 py-2 text-gray-500 text-xs font-semibold">Amount</th>
                      </tr></thead>
                      <tbody>
                        {packages.map((pkg, i) => {
                          const qty = quantities[i] || 0;
                          if (!qty) return null;
                          return (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-3 py-2">{pkg.name}<div className="text-[10px] text-gray-400">{pkg.unit}</div></td>
                              <td className="px-3 py-2 text-right">{qty}</td>
                              <td className="px-3 py-2 text-right font-semibold">₹{((pkg.price || 0) * qty).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="border-t border-gray-200 px-3 py-2 space-y-1 bg-gray-50 text-xs">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                      <div className="flex justify-between text-gray-500"><span>CGST ({cgstPct}%) + SGST ({sgstPct}%)</span><span>₹{(serviceCgst + serviceSgst).toLocaleString()}</span></div>
                      <div className="flex justify-between text-gray-500"><span>Platform Fee ({platformFeePct}%) + GST</span><span>₹{(platformFee + platformFeeGst).toLocaleString()}</span></div>
                      {couponApplied && <div className="flex justify-between text-green-600 font-semibold"><span>Coupon ({couponApplied.code})</span><span>- ₹{couponApplied.discountAmount.toLocaleString()}</span></div>}
                      <div className="flex justify-between font-bold text-gray-900 text-sm pt-1 border-t border-gray-200"><span>Total</span><span className="text-primary-600">₹{finalTotal.toLocaleString()}</span></div>
                    </div>

                  {/* Coupon Input */}
                  <div className="flex gap-2">
                    <input type="text" placeholder="Coupon code" value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(null); }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none uppercase" />
                    <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button onClick={() => setBookingModal('form')} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">← Edit</button>
                      <button onClick={handleSubmitBooking} disabled={submitting}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                        {submitting ? 'Processing...' : `💳 Pay ₹${finalTotal.toLocaleString()} & Confirm`}
                      </button>
                    </div>
                    <button onClick={handleDownloadQuotation} disabled={submitting}
                      className="w-full py-2.5 border-2 border-primary-500 text-primary-600 rounded-xl text-sm font-bold hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" /> Download Quotation (without payment)
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* SUCCESS step */}
            {bookingModal === 'success' && booking && (
              <>
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-9 h-9 text-green-600" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">Payment Successful!</h2>
                  <p className="text-sm text-gray-500 mb-1">Quotation No: <strong className="text-primary-600">{booking.quotationNumber}</strong></p>
                  <p className="text-xs text-gray-400 mb-6">Booking confirmed. The vendor will contact you within 24 hours.</p>
                  <div className="flex gap-3">
                    <button onClick={() => { setBookingModal(false); setShowQuotationModal(true); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary-500 text-primary-600 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors">
                      <FileText className="w-4 h-4" /> View & Download Quotation
                    </button>
                    <button onClick={() => setBookingModal(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Service Quotation Modal */}
      {showQuotationModal && booking && svc && (
        <ServiceQuotationModal
          booking={booking}
          svc={svc}
          form={form}
          selectedDate={selectedDate}
          quantities={quantities}
          packages={packages}
          pricing={{ subtotal, serviceCgst, serviceSgst, cgstPct, sgstPct, platformFee, platformFeePct, platformFeeGst, platformCgstPct, platformSgstPct, total }}
          onClose={() => setShowQuotationModal(false)}
        />
      )}

      <Footer />
    </div>
  );
}
