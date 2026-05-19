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
  Clock, Globe, Instagram, Facebook, Star, X, CheckCircle2, Share2
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
                const local = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                onSelectDate(local);
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [quantities, setQuantities] = useState({});

  // Booking modal state
  const [bookingModal, setBookingModal] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', eventName: '', notes: '' });
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Quotation modal (after booking)
  const [showQuotationModal, setShowQuotationModal] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

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

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-coupons?serviceId=${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAvailableCoupons(d.coupons || []); })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate]);

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
  const platformCgstPct = catRate?.platformCGST ?? platformSettings?.servicePlatformCGST ?? platformSettings?.platformCGST ?? 9;
  const platformSgstPct = catRate?.platformSGST ?? platformSettings?.servicePlatformSGST ?? platformSettings?.platformSGST ?? 9;

  const serviceCgst = Math.round(subtotal * cgstPct / 100);
  const serviceSgst = Math.round(subtotal * sgstPct / 100);
  const platformFee = Math.round(subtotal * platformFeePct / 100);
  const platformFeeGst = Math.round(platformFee * (platformCgstPct + platformSgstPct) / 100);
  const total = subtotal + serviceCgst + serviceSgst + platformFee + platformFeeGst;
  const hasItems = subtotal > 0;
  const setQty = (i, delta) => {
    const pkg = packages[i];
    const min = pkg?.minQty || 0;
    const max = pkg?.maxQty || null;
    setQuantities(prev => {
      const cur = prev[i] || 0;
      let next = cur + delta;
      next = Math.max(min, next);
      if (max !== null) next = Math.min(max, next);
      return { ...prev, [i]: next };
    });
  };

  const setQtyDirect = (i, val) => {
    const pkg = packages[i];
    const min = pkg?.minQty || 0;
    const max = pkg?.maxQty || null;
    let next = parseInt(val) || 0;
    next = Math.max(min, next);
    if (max !== null) next = Math.min(max, next);
    setQuantities(prev => ({ ...prev, [i]: next }));
  };
  const toMinutes = (t) => {
    if (!t || !t.includes(':')) return null;
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };
  const formatSlot = (mins) => {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
  };
  const selectedDayName = selectedDate ? DAYS[new Date(`${selectedDate}T00:00:00`).getDay()] : null;
  const selectedDayAvailability = selectedDayName
    ? (svc.availability || []).find(a => a.isAvailable && a.day === selectedDayName)
    : null;
  const timeSlots = (() => {
    if (!selectedDayAvailability?.startTime || !selectedDayAvailability?.endTime) return [];
    const start = toMinutes(selectedDayAvailability.startTime);
    const end = toMinutes(selectedDayAvailability.endTime);
    if (start === null || end === null || end <= start) return [];
    const slots = [];
    for (let mins = start; mins <= end; mins += 30) slots.push(formatSlot(mins));
    return slots;
  })();

  const handleBookNow = () => {
    if (!selectedDate) { toast.error('Please select an event date'); return; }
    if (!selectedTime) { toast.error('Please select a start time'); return; }
    if (!hasItems) { toast.error('Please select at least one service'); return; }
    setBookingModal('form');
  };

  const handleShareService = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/other-services/${id}`;
    const shareData = {
      title: svc?.title || 'RentalMeet Service',
      text: `Check out this service on RentalMeet: ${svc?.title || ''}`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share — no error toast needed
        if (err?.name !== 'AbortError') {
          // Fallback to clipboard if share fails for other reasons
          try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Service link copied to clipboard');
          } catch {
            toast.error('Unable to share service');
          }
        }
      }
      return;
    }

    // Fallback for browsers without Web Share API
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Service link copied to clipboard');
    } catch {
      toast.error('Unable to copy service link');
    }
  };

  // Build booking payload for API
  const buildBookingPayload = (extra = {}) => {
    const items = packages
      .map((pkg, i) => ({ name: pkg.name, price: pkg.price || 0, unit: pkg.unit, quantity: quantities[i] || 0, amount: (pkg.price || 0) * (quantities[i] || 0) }))
      .filter(it => it.quantity > 0);
    const notesWithTime = [form.notes?.trim(), selectedTime ? `Preferred Time: ${selectedTime}` : ''].filter(Boolean).join(' | ');
    return {
      serviceId: id,
      eventDate: selectedDate,
      customerInfo: { ...form, notes: notesWithTime },
      items,
      pricing: { subtotal, serviceCgst, serviceSgst, cgstPct, sgstPct, platformFee, platformFeePct, platformFeeGst, total },
      couponCode: couponApplied?.code || undefined,
      ...extra
    };
  };

  // Download quotation without payment
  const handleDownloadQuotation = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { toast.error('Name, email & phone required'); return; }
    setSubmitting(true);
    try {
      // Do not create booking for quotation-only flow
      const tempQuotation = {
        quotationNumber: `SVC-QTN-TEMP-${Date.now().toString().slice(-6)}`,
        customerInfo: {
          ...form,
          notes: [form.notes?.trim(), selectedTime ? `Preferred Time: ${selectedTime}` : ''].filter(Boolean).join(' | ')
        },
        serviceSnapshot: {
          title: svc.title,
          category: svc.category,
          companyName: svc.companyName || svc.vendor?.companyName,
          city: svc.city,
          state: svc.state
        },
        eventDate: selectedDate,
        items: (packages || [])
          .map((pkg, i) => ({ name: pkg.name, price: pkg.price || 0, unit: pkg.unit, quantity: quantities[i] || 0, amount: (pkg.price || 0) * (quantities[i] || 0) }))
          .filter(it => it.quantity > 0),
        pricing: {
          subtotal,
          serviceCGST: serviceCgst,
          serviceSGST: serviceSgst,
          cgstPct,
          sgstPct,
          platformFee,
          platformFeePct,
          platformFeeGST: platformFeeGst,
          total: finalTotal,
          discount: couponApplied?.discountAmount || 0
        },
        coupon: couponApplied ? { code: couponApplied.code, discountAmount: couponApplied.discountAmount } : undefined,
        status: 'enquiry',
        paymentStatus: 'pending'
      };
      setBooking(tempQuotation);
      setBookingModal(false);
      setShowQuotationModal(true);
      toast.success('Quotation ready to download!');
    } catch { toast.error('Something went wrong'); }
    finally { setSubmitting(false); }
  };

  const handleSubmitBooking = async () => {
    if (!selectedDate) { toast.error('Event date required'); return; }
    if (!selectedTime) { toast.error('Start time required'); return; }
    if (!form.name.trim()) { toast.error('Full name required'); return; }
    if (!form.email.trim()) { toast.error('Email required'); return; }
    if (!form.phone.trim()) { toast.error('Phone required'); return; }
    setSubmitting(true);
    try {
      // Step 1: Create Razorpay order first (no booking before payment)
      const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: finalTotal, bookingType: 'service' })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) { toast.error('Payment setup failed'); setSubmitting(false); return; }

        // Step 2: Open Razorpay checkout
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
          // Step 3: Verify payment signature
          const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingType: 'service',
              paidAmount: finalTotal
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            // Step 4: Create booking only after successful payment verification
            const bookingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-bookings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(buildBookingPayload({
                status: 'confirmed',
                paymentStatus: 'paid',
                amount: finalTotal,
                paymentDetails: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }
              }))
            });
            const bookData = await bookingRes.json();
            if (bookData.success) {
              setBooking(bookData.booking);
              setBookingModal('success');
              toast.success('Payment successful! Booking confirmed.');
            } else {
              toast.error(bookData.message || 'Payment done but booking creation failed. Contact support.');
            }
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
  const applyCouponByCode = async (code) => {
    if (!code?.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), serviceId: id, bookingAmount: total })
      });
      const data = await res.json();
      if (data.success) {
        setCouponApplied({ code: data.coupon.code, discountAmount: data.discountAmount });
        toast.success(`Coupon applied! ₹${data.discountAmount} off`);
      } else toast.error(data.message);
    } catch { toast.error('Failed to validate coupon'); }
    finally { setCouponLoading(false); }
  };
  const handleApplyCoupon = async () => applyCouponByCode(couponCode);

  const finalTotal = couponApplied ? Math.max(0, total - couponApplied.discountAmount) : total;
  const availDays = (svc.availability || []).filter(a => a.isAvailable);
  const visibleCoupons = (availableCoupons || []).filter(c => !c.minBookingAmount || total >= c.minBookingAmount);

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
                  <h1 className="font-serif text-2xl font-bold text-gray-900">{svc.title}</h1>
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
                {svc.specialization?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {svc.specialization.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-primary-50 border border-primary-200 text-primary-700 rounded-full text-xs font-semibold">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
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
                  <div className="grid grid-cols-4 gap-2">
                    {availDays.map(a => (
                      <div key={a.day} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-gray-700">{a.day.slice(0,3)}</span>
                        <span className="text-xs text-gray-500">{a.startTime}–{a.endTime}</span>
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
                          const min = pkg?.minQty || 0;
                          const max = pkg?.maxQty || null;
                          return (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2.5">
                                <div className="text-gray-800">{pkg.name}</div>
                                {(min > 0 || max) && (
                                  <div className="text-[10px] text-gray-400 mt-0.5">
                                    {min > 0 && `Min: ${min}`}{min > 0 && max ? ' · ' : ''}{max ? `Max: ${max}` : ''}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold text-primary-600">₹{(pkg.price || 0).toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{pkg.unit}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center justify-center gap-1">
                                  <button type="button" onClick={() => setQty(i, -1)} disabled={qty <= min}
                                    className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-all">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    value={qty}
                                    min={min}
                                    max={max || undefined}
                                    onChange={e => setQtyDirect(i, e.target.value)}
                                    className="w-12 text-center font-bold text-sm border border-gray-200 rounded-lg py-0.5 focus:ring-1 focus:ring-primary-400 outline-none"
                                  />
                                  <button type="button" onClick={() => setQty(i, 1)} disabled={max !== null && qty >= max}
                                    className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-all">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold">{qty > 0 ? `₹${((pkg.price || 0) * qty).toLocaleString()}` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-3">
                <div className="bg-[#fffcf5] rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">Book This Service</h3>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Starting from</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {svc.startingPrice ? `₹${svc.startingPrice.toLocaleString()}` : 'Price on request'}
                      {svc.startingPrice && <span className="text-sm font-normal text-gray-400 ml-1">onwards</span>}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Select Date</label>
                        <button
                          type="button"
                          onClick={() => setShowDatePicker(v => !v)}
                          className="w-full text-left px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white hover:border-primary-400 focus:ring-2 focus:ring-primary-500"
                        >
                          {selectedDate
                            ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Pick a date'}
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                        <select
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          disabled={!selectedDate || timeSlots.length === 0}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                        >
                          <option value="">{!selectedDate ? 'Select date first' : (timeSlots.length === 0 ? 'No slot available' : 'Select time')}</option>
                          {timeSlots.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {showDatePicker && (
                      <div className="mt-2">
                        <AvailabilityCalendar
                          availability={svc.availability}
                          blockedDates={svc.blockedDates}
                          advanceBooking={svc.advanceBooking}
                          customAdvanceDays={svc.customAdvanceDays}
                          selectedDate={selectedDate}
                          onSelectDate={(val) => { setSelectedDate(val); setShowDatePicker(false); }}
                        />
                      </div>
                    )}
                    {selectedDate && (
                      <div className="mt-2 flex items-center justify-between bg-primary-50 rounded-xl px-3 py-2">
                        <span className="text-xs font-semibold text-primary-700">
                          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => { setSelectedDate(''); setShowDatePicker(false); }} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-yellow-200 bg-white overflow-hidden text-sm">
                    <div className="px-3 py-2 border-b border-yellow-200 bg-[#fff8e9]">
                      <p className="font-semibold text-gray-700">Pricing Summary</p>
                    </div>
                    <div className="px-3 py-2.5 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-600"><span>Base Price:</span><span className="font-semibold">₹{subtotal.toLocaleString()}</span></div>
                      <div className="flex justify-between text-gray-600"><span>CGST ({cgstPct}%)</span><span>₹{serviceCgst.toLocaleString()}</span></div>
                      <div className="flex justify-between text-gray-600"><span>SGST ({sgstPct}%)</span><span>₹{serviceSgst.toLocaleString()}</span></div>
                      <div className="flex justify-between text-gray-600"><span>Platform Fee ({platformFeePct}%)</span><span>₹{platformFee.toLocaleString()}</span></div>
                      <div className="flex justify-between text-gray-600"><span>Platform GST ({platformCgstPct + platformSgstPct}%)</span><span>₹{platformFeeGst.toLocaleString()}</span></div>
                      {couponApplied && (
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>Coupon ({couponApplied.code})</span>
                          <span>- ₹{couponApplied.discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2.5 bg-[#fff8e9] border-t border-yellow-200 flex items-center justify-between">
                      <span className="font-bold text-gray-900">Estimated Total:</span>
                      <span className="font-black text-primary-600 text-xl">₹{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Coupon code" value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(null); }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none uppercase" />
                      <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {svc.minimumOrderPrice > 0 && (
                      <p className="text-center text-[10px] text-gray-400">
                        Minimum order: ₹{svc.minimumOrderPrice.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <button onClick={handleBookNow}
                    disabled={!svc.isActive || !hasItems || !selectedDate || !selectedTime || (svc.minimumOrderPrice && subtotal < svc.minimumOrderPrice)}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {!svc.isActive ? 'Service Unavailable'
                      : !selectedDate ? 'Select a Date First'
                      : !selectedTime ? 'Select a Time First'
                      : !hasItems ? 'Select Services First'
                      : (svc.minimumOrderPrice && subtotal < svc.minimumOrderPrice) ? `Min. Order ₹${svc.minimumOrderPrice.toLocaleString()}`
                      : 'Reserve Now'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleShareService}
                  className="w-full rounded-xl border border-primary-500 bg-white text-primary-600 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share Service
                </button>

                {visibleCoupons.length > 0 && (
                  <div className="rounded-2xl border border-green-300 bg-green-50 p-3">
                    <span className="inline-flex items-center rounded-lg border border-green-300 bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                      Available Coupons
                    </span>
                    <div className="mt-3 space-y-2">
                      {visibleCoupons.slice(0, 3).map((c) => (
                        <div key={c._id} className="rounded-lg border border-green-300 bg-white px-3 py-2 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-green-800">{c.code}</p>
                            <p className="text-xs text-gray-500">
                              {c.discountType === 'percentage'
                                ? `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${Number(c.maxDiscount).toLocaleString()})` : ''}`
                                : `₹${Number(c.discountValue).toLocaleString()} off`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setCouponCode(c.code); applyCouponByCode(c.code); }}
                            className="text-xs font-semibold text-green-700 hover:text-green-800"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    {selectedTime && <p className="text-xs font-semibold text-primary-700 mt-1">Start Time: {selectedTime}</p>}
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

