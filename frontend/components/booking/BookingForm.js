'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  Clock, IndianRupee, X, CheckCircle
} from 'lucide-react';
import Image from 'next/image';
import QuotationView from './QuotationView';
import { trackCustomEvent } from '@/lib/analytics';
import { calculatePlatformFee, formatPlatformFeeLabel, getVenuePricingMeta, isWeekendDate, numberOr, roundMoney } from '@/lib/venuePricing';

function getCapacityLimit(capacity) {
  const text = String(capacity || '').trim();
  if (!text || text.toLowerCase().includes('more than')) return null;
  const values = text.match(/\d+/g)?.map(Number).filter(Number.isFinite) || [];
  return values.length ? Math.max(...values) : null;
}

export default function BookingForm({ venue, initialData = {}, initialAmenities = {}, initialQuantities = {}, onClose }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const capacityLimit = getCapacityLimit(venue?.capacity);
  const [submitting, setSubmitting] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null); // { bookingNumber, bookingId }
  const [terms, setTerms] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({
    gstRate: 18,
    venueCGST: 9,
    venueSGST: 9,
    venueHSN: '9973',
    platformCGST: 9,
    platformSGST: 9,
    platformFeeType: 'percentage',
    platformFeeValue: 5
  });
  
  // Fetch terms and conditions and platform settings
  useEffect(() => {
    fetchTerms();
    fetchPlatformSettings();
    if (venue?.sku) fetchBookedDates();
  }, []);

  const fetchBookedDates = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/booked-dates/${venue.sku}`);
      const data = await res.json();
      if (data.success && data.dates) {
        setBookedDates(data.dates.map(d => new Date(d)));
      }
    } catch (e) { /* silently fail */ }
  };

  const fetchTerms = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/terms`);
      const data = await response.json();
      if (data.success) {
        setTerms(data.terms);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/platform-settings/public`);
      const data = await response.json();
      if (data.success && data.settings) {
        const feeType = data.settings.platformFeeType || data.settings.platformFee?.feeType || 'percentage';
        const feeValue = numberOr(
          data.settings.platformFeeValue ?? data.settings.platformFee?.feeValue ?? data.settings.platformFeePercentage,
          5
        );
        setPlatformSettings({
          gstRate: parseFloat(data.settings.gstRate) || 18,
          venueCGST: parseFloat(data.settings.venueCGST) || 9,
          venueSGST: parseFloat(data.settings.venueSGST) || 9,
          venueHSN: data.settings.venueHSN || '9973',
          platformCGST: parseFloat(data.settings.platformCGST) || 9,
          platformSGST: parseFloat(data.settings.platformSGST) || 9,
          platformFeeType: feeType,
          platformFeeValue: feeValue
        });
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
    }
  };
  
  // Map duration to booking type
  const mapDurationToBookingType = (duration) => {
    if (!duration) return '';
    const hours = parseInt(duration);
    if (hours === 1 || hours === 2) return 'hourly';
    if (hours === 4) return 'halfday';
    if (hours === 8) return 'fullday';
    return '';
  };

  // Calculate end time from start time and duration (returns 12-hour format)
  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return '';
    const [hours, minutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);
    startDate.setHours(startDate.getHours() + parseInt(duration));
    
    // Convert to 12-hour format
    let endHours = startDate.getHours();
    let endMinutes = startDate.getMinutes();
    const ampm = endHours >= 12 ? 'PM' : 'AM';
    endHours = endHours % 12;
    endHours = endHours ? endHours : 12; // 0 should be 12
    const endMinutesStr = endMinutes < 10 ? '0' + endMinutes : endMinutes;
    
    return `${endHours}:${endMinutesStr} ${ampm}`;
  };
  
  // Format date from Date object to YYYY-MM-DD string
  const formatDateForInput = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return date;
  };

  const parseDateInput = (value) => {
    if (!value) return null;
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  // Get first enabled duration for this venue
  const getDefaultDuration = () => {
    if (initialData?.duration) return initialData.duration;
    const opts = venue?.pricing?.enabledOptions || {};
    if (opts.perHour) return '1';
    if (opts.halfDay) return '4';
    if (opts.fullDay) return '8';
    return '1';
  };

  // Form state - Initialize with passed data
  const [formData, setFormData] = useState({
    bookingType: mapDurationToBookingType(getDefaultDuration()),
    duration: getDefaultDuration(),
    bookingDate: formatDateForInput(initialData?.date) || '',
    startTime: initialData?.startTime || '',
    endTime: calculateEndTime(initialData?.startTime, getDefaultDuration()) || initialData?.endTime || '',
    isWeekend: isWeekendDate(initialData?.date),
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    eventType: '',
    guestCount: initialData?.guestCount || '',
    specialRequirements: '',
    acceptTerms: false
  });

  // Use amenities and quantities passed from parent (venue details page)
  // Ensure all categories exist with default empty arrays
  const selectedAmenities = {
    basic: initialAmenities.basic || [],
    beverages: initialAmenities.beverages || [],
    refreshmentFood: initialAmenities.refreshmentFood || [],
    lunchThalis: initialAmenities.lunchThalis || [],
    additional: initialAmenities.additional || []
  };
  const quantities = initialQuantities || {};

  const [calculatedPrice, setCalculatedPrice] = useState({
    basePrice: 0,
    amenitiesTotal: 0,
    subtotal: 0,
    gst: 0,
    gstRate: 18,
    platformFee: 0,
    discount: 0,
    total: 0
  });

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Calculate base price
  const calculateBasePrice = (type, isWeekendDay, duration = formData.duration) => {
    if (!venue?.pricing) return 0;
    const dayType = isWeekendDay ? 'weekend' : 'weekday';
    const hours = Math.max(1, parseInt(duration) || 1);
    
    switch (type) {
      case 'hourly': return (venue.pricing.perHour?.[dayType] || 0) * hours;
      case 'halfday': return venue.pricing.halfDay?.[dayType] || 0;
      case 'fullday': return venue.pricing.fullDay?.[dayType] || 0;
      default: return 0;
    }
  };

  // Calculate amenities total
  const calculateAmenitiesTotal = () => {
    let total = 0;

    // Basic amenities (paid ones)
    if (selectedAmenities.basic) {
      selectedAmenities.basic.forEach(amenity => {
        if (amenity.type === 'Paid') {
          if (amenity.rateType === 'Per Use') {
            // For Per Use items, multiply by quantity
            const qty = quantities[`basic_${amenity.name}`] || 0;
            total += (amenity.rate || 0) * qty;
          } else {
            // For Fixed items, just add the rate
            total += amenity.rate || 0;
          }
        }
      });
    }

    // Beverages (per unit * quantity)
    if (selectedAmenities.beverages) {
      selectedAmenities.beverages.forEach(beverage => {
        const qty = quantities[`beverage_${beverage.name}`] || 0;
        total += (beverage.ratePerUnit || 0) * qty;
      });
    }

    // Refreshment Food (per plate * quantity)
    if (selectedAmenities.refreshmentFood) {
      selectedAmenities.refreshmentFood.forEach(food => {
        const qty = quantities[`food_${food.name}`] || 0;
        total += (food.ratePerPlate || 0) * qty;
      });
    }

    // Lunch Thalis (per plate * quantity) - New Structure
    if (selectedAmenities.lunchThalis) {
      selectedAmenities.lunchThalis.forEach(thali => {
        const key = `thali_${thali.thaliType}_${thali.category}`;
        const qty = quantities[key] || 0;
        total += (thali.ratePerPlate || 0) * qty;
      });
    }

    // Additional facilities (paid ones)
    if (selectedAmenities.additional) {
      selectedAmenities.additional.forEach(facility => {
        if (facility.type === 'Paid') {
          total += facility.charges || 0;
        }
      });
    }

    // Kitchen access
    if (venue.amenities?.kitchenAccess?.available && venue.amenities.kitchenAccess.type === 'Paid') {
      total += venue.amenities.kitchenAccess.charges || 0;
    }

    // Dining area
    if (venue.amenities?.diningArea?.available && venue.amenities.diningArea.type === 'Paid') {
      total += venue.amenities.diningArea.charges || 0;
    }

    return total;
  };

  // Update total price with GST and Platform Fee
  useEffect(() => {
    if (formData.bookingType) {
      const basePrice = calculateBasePrice(formData.bookingType, formData.isWeekend, formData.duration);
      const amenitiesTotal = calculateAmenitiesTotal();
      const subtotal = basePrice + amenitiesTotal;
      const pricingMeta = getVenuePricingMeta(venue, platformSettings);
      const venueCGSTRate = pricingMeta.venueCGSTRate;
      const venueSGSTRate = pricingMeta.venueSGSTRate;
      const venueCGST = roundMoney((subtotal * venueCGSTRate) / 100);
      const venueSGST = roundMoney((subtotal * venueSGSTRate) / 100);
      const gst = roundMoney(venueCGST + venueSGST);
      const gstRate = venueCGSTRate + venueSGSTRate;
      const platformFee = calculatePlatformFee(
        subtotal,
        pricingMeta.platformFeeType,
        pricingMeta.platformFeeValue
      );

      // Platform Fee GST (CGST + SGST on platform fee)
      const platformCGSTRate = pricingMeta.platformCGSTRate;
      const platformSGSTRate = pricingMeta.platformSGSTRate;
      const platformFeeCGST = roundMoney((platformFee * platformCGSTRate) / 100);
      const platformFeeSGST = roundMoney((platformFee * platformSGSTRate) / 100);
      const platformFeeGST = roundMoney(platformFeeCGST + platformFeeSGST);
      const platformFeeTotal = roundMoney(platformFee + platformFeeGST);

      const rawTotal = subtotal + gst + platformFeeTotal;
      const total = roundMoney(rawTotal);

      setCalculatedPrice({
        basePrice,
        amenitiesTotal,
        subtotal,
        durationHours: Math.max(1, parseInt(formData.duration) || 1),
        // Venue GST
        venueCGST,
        venueCGSTRate,
        venueSGST,
        venueSGSTRate,
        venueHSN: pricingMeta.venueHSN,
        gst,
        gstRate,
        // Platform Fee
        platformFee,
        platformFeeSource: pricingMeta.platformFeeSource,
        platformFeeType: pricingMeta.platformFeeType,
        platformFeeValue: pricingMeta.platformFeeValue,
        platformFeeRate: pricingMeta.platformFeeValue,
        platformFeePercentage: pricingMeta.platformFeePercentage,
        platformFeeCGST,
        platformFeeCGSTRate: platformCGSTRate,
        platformFeeSGST,
        platformFeeSGSTRate: platformSGSTRate,
        platformFeeGST,
        platformFeeTotal,
        platformCGSTRate,
        platformSGSTRate,
        discount: appliedCoupon ? appliedCoupon.discountAmount : 0,
        couponCode: appliedCoupon?.code || null,
        total: appliedCoupon ? Math.max(0, total - appliedCoupon.discountAmount) : total
      });
    }
  }, [formData.bookingType, formData.duration, formData.isWeekend, selectedAmenities, quantities, platformSettings, venue, appliedCoupon]);

  const checkIfWeekend = (dateString) => {
    return isWeekendDate(dateString);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If start time changes, recalculate end time based on duration
    if (name === 'startTime' && formData.duration) {
      const newEndTime = calculateEndTime(value, formData.duration);
      setFormData(prev => ({
        ...prev,
        startTime: value,
        endTime: newEndTime
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    const isWeekendDay = checkIfWeekend(selectedDate);
    
    setFormData(prev => ({
      ...prev,
      bookingDate: selectedDate,
      isWeekend: isWeekendDay
    }));
  };

  const handleDurationChange = (hours) => {
    const bookingType = mapDurationToBookingType(hours);
    const endTime = calculateEndTime(formData.startTime, hours);
    setFormData(prev => ({ 
      ...prev, 
      duration: hours,
      bookingType: bookingType,
      endTime: endTime
    }));
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!venue._id) return;
    const baseTotal = calculatedPrice.subtotal + calculatedPrice.gst + calculatedPrice.platformFeeTotal;
    setCouponLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          code: couponInput,
          venueId: venue._id,
          bookingAmount: baseTotal,
          baseAmount: calculatedPrice.basePrice,
          amenitiesTotal: calculatedPrice.amenitiesTotal,
          platformFee: calculatedPrice.platformFeeTotal
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon({ ...data.coupon, discountAmount: data.discountAmount });
        toast.success(`Coupon applied! You save ₹${data.discountAmount}`);
      } else {
        toast.error(data.message || 'Invalid coupon');
      }
    } catch {
      toast.error('Could not apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };



  // Initialize Razorpay Payment
  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Razorpay Payment
  const handlePayment = async (bookingData, amount) => {
    try {
      // Load Razorpay script
      const res = await initializeRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      // Create order
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          bookingType: 'venue'
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        toast.error('Failed to create payment order');
        trackCustomEvent('payment_failed', { venueId: venue._id, amount, reason: 'order_creation_failed' }, 'conversion');
        return;
      }

      // Track website payment_initiated conversion event
      trackCustomEvent('payment_initiated', { venueId: venue._id, amount, orderId: orderData.order?.id }, 'conversion');

      // Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'RentalMeet',
        description: `Booking Payment - ${venue.businessName}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          // Verify and create booking
          try {
            setSubmitting(true);
            const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                ...bookingData,
                paymentDetails: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Track website payment_success conversion event
              trackCustomEvent('payment_success', { bookingNumber: verifyData.booking?.bookingNumber, amount }, 'conversion');
              toast.success('Payment successful! Booking confirmed 🎉');
              setSubmitting(false);
              setBookingSuccess({
                bookingNumber: verifyData.booking?.bookingNumber || '',
                bookingId: verifyData.booking?._id || ''
              });
            } else {
              trackCustomEvent('payment_failed', { venueId: venue._id, amount, reason: verifyData.message }, 'conversion');
              toast.error(verifyData.message || 'Payment verification failed');
              setSubmitting(false);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            trackCustomEvent('payment_failed', { venueId: venue._id, amount, reason: 'exception' }, 'conversion');
            toast.error('Payment verification failed');
            setSubmitting(false);
          }
        },
        prefill: {
          name: formData.customerName,
          email: formData.customerEmail,
          contact: formData.customerPhone
        },
        theme: {
          color: '#F59F0A'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment initialization failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bookingType || !formData.bookingDate || !formData.startTime || !formData.endTime || !formData.guestCount) {
      toast.error('Please fill all required fields');
      return;
    }
    const guestCount = Number(formData.guestCount);
    if (!Number.isFinite(guestCount) || guestCount < 1) {
      toast.error('Please enter a valid guest count');
      return;
    }
    if (capacityLimit && guestCount > capacityLimit) {
      toast.error(`Guest count cannot exceed ${capacityLimit}`);
      return;
    }
    if (!formData.acceptTerms) {
      toast.error('Please accept terms and conditions');
      return;
    }
    
    // If user is not logged in, save booking data and redirect to login
    if (!token) {
      const pendingBooking = {
        venueId: venue._id,
        venueSku: venue.sku,
        venueName: venue.businessName,
        formData: formData,
        selectedAmenities: selectedAmenities,
        quantities: quantities,
        calculatedPrice: calculatedPrice,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
      toast.success('Please login to complete your booking');
      router.push(`/login?redirect=/venues/${venue.sku}`);
      return;
    }

    setSubmitting(true);

    try {
      // Prepare amenities with quantities and prices - filter out empty arrays
      const amenitiesWithDetails = {
        basic: selectedAmenities.basic?.length > 0 ? selectedAmenities.basic.map(amenity => ({
          name: amenity.name,
          type: amenity.type,
          rate: amenity.rate || 0,
          rateType: amenity.rateType || 'Fixed',
          quantity: amenity.rateType === 'Per Use' ? (quantities[`basic_${amenity.name}`] || 1) : 1,
          total: amenity.rateType === 'Per Use' 
            ? (amenity.rate || 0) * (quantities[`basic_${amenity.name}`] || 1)
            : (amenity.rate || 0)
        })) : [],
        beverages: selectedAmenities.beverages?.length > 0 ? selectedAmenities.beverages.map(bev => ({
          name: bev.name,
          ratePerUnit: bev.ratePerUnit || 0,
          brand: bev.brand || '',
          quantity: quantities[`beverage_${bev.name}`] || 1,
          total: (bev.ratePerUnit || 0) * (quantities[`beverage_${bev.name}`] || 1)
        })) : [],
        refreshmentFood: selectedAmenities.refreshmentFood?.length > 0 ? selectedAmenities.refreshmentFood.map(food => ({
          name: food.name,
          ratePerPlate: food.ratePerPlate || 0,
          items: food.items || '',
          quantity: quantities[`food_${food.name}`] || 1,
          total: (food.ratePerPlate || 0) * (quantities[`food_${food.name}`] || 1)
        })) : [],
        lunchThalis: selectedAmenities.lunchThalis?.length > 0 ? selectedAmenities.lunchThalis.map(thali => ({
          thaliType: thali.thaliType,
          category: thali.category,
          ratePerPlate: thali.ratePerPlate || 0,
          numberOfItems: thali.numberOfItems || 0,
          itemNames: thali.itemNames || '',
          quantity: quantities[`thali_${thali.thaliType}_${thali.category}`] || 1,
          total: (thali.ratePerPlate || 0) * (quantities[`thali_${thali.thaliType}_${thali.category}`] || 1)
        })) : [],
        additional: selectedAmenities.additional?.length > 0 ? selectedAmenities.additional : []
      };

      const bookingData = {
        venue: venue._id,
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        bookingType: formData.bookingType,
        // Send pre-coupon total — backend will apply coupon and compute finalAmount
        amount: calculatedPrice.subtotal + calculatedPrice.gst + calculatedPrice.platformFeeTotal,
        amenitiesTotal: calculatedPrice.amenitiesTotal,
        selectedAmenities: amenitiesWithDetails,
        priceBreakdown: {
          ...calculatedPrice,
          // Store the actual discount and final total for reference
          discount: calculatedPrice.discount || 0,
          total: calculatedPrice.total
        },
        couponCode: appliedCoupon?.code || null,
        customerDetails: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
          eventType: formData.eventType,
          guestCount: Number(formData.guestCount),
          specialRequirements: formData.specialRequirements,
          gstNumber: user?.gstNumber || '',
          companyName: user?.companyName || ''
        }
      };

      // Check KYC verification in frontend first
      if (user?.role === 'customer' && (!user?.kyc?.idProof || !user?.kyc?.selfie)) {
        toast.error('Please complete your KYC verification to book a venue.');
        setSubmitting(false);
        onClose();
        router.push('/customer/profile?tab=kyc');
        return;
      }

      // Check slot availability pre-check
      const bookedDatesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/booked-dates/${venue.sku}`);
      const bookedDatesData = await bookedDatesRes.json();
      if (bookedDatesData.success && bookedDatesData.dates) {
        const target = new Date(formData.bookingDate);
        const isBooked = bookedDatesData.dates.some(d => {
          const date = new Date(d);
          return date.getFullYear() === target.getFullYear() &&
                 date.getMonth() === target.getMonth() &&
                 date.getDate() === target.getDate();
        });
        if (isBooked) {
          toast.error('This venue was just booked by someone else! Please select another date.');
          setSubmitting(false);
          return;
        }
      }

      setSubmitting(false);
      await handlePayment(bookingData, bookingData.priceBreakdown.total);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Something went wrong');
      setSubmitting(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-11 h-11 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-gray-500 mb-1">Your booking number is</p>
          <p className="text-xl font-black text-primary-600 bg-primary-50 rounded-xl px-4 py-2 inline-block mb-4 tracking-wider">
            {bookingSuccess.bookingNumber}
          </p>
          <p className="text-xs text-gray-400 mb-6">Payment successful. The venue owner will confirm your booking shortly.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { onClose(); router.push('/customer/bookings'); }}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors"
            >
              Manage Bookings
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors"
            >
              Back to Venue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Your Booking</h2>
          <p className="text-sm text-gray-500">Please do not close this window or refresh the page. We are verifying your payment and securing your reservation...</p>
        </div>
      </div>
    );
  }

  if (showQuotation) {
    return (
      <QuotationView
        venue={venue}
        formData={formData}
        selectedAmenities={selectedAmenities}
        quantities={quantities}
        calculatedPrice={calculatedPrice}
        onClose={() => setShowQuotation(false)}
        onConfirm={handleSubmit}
        token={token}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-white dark:bg-slate-950 overflow-y-auto">
      {/* Header - Fixed at top */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="RentalMeet" width={120} height={36} className="h-8 w-auto object-contain" />
          <div>
            <h2 className="text-lg md:text-xl font-bold text-dark-800 dark:text-slate-100">Book Venue</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">{venue.businessName}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Form Content - Scrollable */}
      <form onSubmit={(e) => { e.preventDefault(); setShowQuotation(true); }} className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="space-y-6">
          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 dark:text-slate-200 mb-3">Select Duration *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(() => {
                const opts = venue.pricing?.enabledOptions || {};
                const options = [];
                if (opts.perHour) {
                  options.push({ hours: '1', label: '1h' });
                  options.push({ hours: '2', label: '2h' });
                }
                if (opts.halfDay) options.push({ hours: '4', label: '4h' });
                if (opts.fullDay) options.push({ hours: '8', label: 'Full Day' });
                return options.map(({ hours, label }) => {
                  const bookingType = mapDurationToBookingType(hours);
                  const displayPrice = calculateBasePrice(bookingType, formData.isWeekend, hours);
                  return (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => handleDurationChange(hours)}
                      className={`p-3 border-2 rounded-xl text-center transition-all ${
                        formData.duration === hours ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                      }`}
                    >
                      <p className="font-semibold text-sm md:text-base dark:text-slate-100">{label}</p>
                      <p className="text-primary-600 font-bold text-base md:text-lg">₹{displayPrice.toLocaleString()}</p>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 dark:text-slate-200 mb-2">Select Date *</label>
              <DatePicker
                selected={parseDateInput(formData.bookingDate)}
                onChange={(date) => {
                  if (!date) return;
                  const iso = formatDateForInput(date);
                  handleDateChange({ target: { value: iso } });
                }}
                minDate={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()}
                filterDate={(date) => {
                  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                  const dayName = dayNames[date.getDay()];
                  const availableDays = venue?.availability?.availableDays || [];
                  if (availableDays.length > 0 && !availableDays.includes(dayName)) return false;
                  return !bookedDates.some(bd =>
                    bd.getFullYear() === date.getFullYear() &&
                    bd.getMonth() === date.getMonth() &&
                    bd.getDate() === date.getDate()
                  );
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="Pick a date"
                className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
              {formData.isWeekend && (
                <p className="text-xs text-orange-600 mt-1.5 font-medium">⚠ Weekend rates apply</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 dark:text-slate-200 mb-2">Start Time *</label>
              <select 
                name="startTime" 
                value={formData.startTime} 
                onChange={handleChange} 
                className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                required
              >
                <option value="">Select start time</option>
                {(() => {
                  const opening = venue.availability?.openingTime || '09:00';
                  const closing = venue.availability?.closingTime || '22:00';
                  const [openH, openM] = opening.split(':').map(Number);
                  const [closeH, closeM] = closing.split(':').map(Number);
                  const openMins = openH * 60 + openM;
                  const closeMins = closeH * 60 + closeM;
                  const slots = [];
                  for (let m = openMins; m < closeMins; m += 30) {
                    const h = Math.floor(m / 60);
                    const min = m % 60;
                    const val = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
                    const period = h < 12 ? 'AM' : 'PM';
                    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                    const label = `${String(h12).padStart(2,'0')}:${String(min).padStart(2,'0')} ${period}`;
                    slots.push(<option key={val} value={val}>{label}</option>);
                  }
                  return slots;
                })()}
              </select>
            </div>
          </div>

          {/* Customer Details */}
          <div className="border-t pt-6 border-gray-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 text-dark-800 dark:text-slate-100">Your Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-slate-200">Full Name *</label>
                <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-slate-100" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-slate-200">Email *</label>
                <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} className="w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-slate-100" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-slate-200">Phone *</label>
                <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} maxLength={10} className="w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-slate-100" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-slate-200">Event Type *</label>
                <select name="eventType" value={formData.eventType} onChange={handleChange} className="w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-slate-100" required>
                  <option value="">Select event type</option>
                  {venue.venueType?.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-slate-200">Guest Count *</label>
                <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} min="1" max={capacityLimit || undefined} className="w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-slate-100" required />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Capacity: {venue.capacity}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-slate-200">Special Requirements</label>
                <textarea name="specialRequirements" value={formData.specialRequirements} onChange={handleChange} rows="3" className="w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-slate-100" placeholder="Any special requests..." />
              </div>
            </div>
          </div>



          {/* Price Summary */}
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-2 border-primary-200 dark:border-slate-700 rounded-xl p-6">
            <h3 className="text-base font-bold mb-4 text-slate-900 dark:text-slate-100">Price Summary</h3>
            <div className="space-y-2 text-sm mb-4 text-slate-900 dark:text-slate-200">
              <div className="flex justify-between">
                <span>Venue Rental:</span>
                <span className="font-semibold">₹{calculatedPrice.basePrice.toLocaleString()}</span>
              </div>
              {calculatedPrice.amenitiesTotal > 0 && (
                <div className="flex justify-between">
                  <span>Amenities & Services:</span>
                  <span className="font-semibold">₹{calculatedPrice.amenitiesTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{calculatedPrice.subtotal.toLocaleString()}</span>
              </div>
              {calculatedPrice.gst > 0 && (
                <>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Venue CGST ({calculatedPrice.venueCGSTRate || 9}%):</span>
                    <span>₹{(calculatedPrice.venueCGST || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Venue SGST ({calculatedPrice.venueSGSTRate || 9}%):</span>
                    <span>₹{(calculatedPrice.venueSGST || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Venue GST Total:</span>
                    <span className="font-semibold text-blue-600">₹{calculatedPrice.gst.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Platform Fee ({formatPlatformFeeLabel(calculatedPrice.platformFeeType, calculatedPrice.platformFeeValue)}):</span>
                <span>₹{(calculatedPrice.platformFee || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Platform CGST ({calculatedPrice.platformFeeCGSTRate || 9}%):</span>
                <span>₹{(calculatedPrice.platformFeeCGST || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Platform SGST ({calculatedPrice.platformFeeSGSTRate || 9}%):</span>
                <span>₹{(calculatedPrice.platformFeeSGST || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Platform Fee Total:</span>
                <span className="font-semibold text-purple-600">₹{(calculatedPrice.platformFeeTotal || 0).toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({appliedCoupon.code}){appliedCoupon.appliesTo && appliedCoupon.appliesTo !== 'total' ? ` — on ${
                    appliedCoupon.appliesTo === 'platformFee' ? 'Platform Fee' :
                    appliedCoupon.appliesTo === 'amenities' ? 'Amenities' :
                    appliedCoupon.appliesTo === 'baseAmount' ? 'Base Amount' : ''
                  }` : ''}:</span>
                  <span className="font-semibold">-₹{appliedCoupon.discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Coupon Input */}
            {token && (
              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-sm text-green-700 font-semibold">🎉 {appliedCoupon.code} applied</span>
                    <button onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 uppercase"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t-2 border-primary-300">
              <span className="text-base font-bold">Total Amount:</span>
              <div className="text-right">
                <p className="text-2xl md:text-3xl font-bold text-primary-600 flex items-center">
                  <IndianRupee className="w-6 h-6" />₹{calculatedPrice.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">{formData.isWeekend ? 'Weekend rate' : 'Weekday rate'}</p>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {terms && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-4">Terms & Conditions:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                {terms.bookingTerms?.map((term, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-primary-500 font-bold flex-shrink-0">•</span>
                    <span>{term.point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accept Terms Checkbox */}
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              name="acceptTerms" 
              checked={formData.acceptTerms} 
              onChange={handleChange} 
              className="w-5 h-5 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer mt-0.5" 
              required 
            />
            <label className="text-sm text-gray-700">
              I agree to the booking terms and conditions, cancellation policy, and understand that this is a booking request subject to venue owner approval.
            </label>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="sticky bottom-0 bg-white border-t px-4 py-4 md:px-6 md:py-5 flex gap-3 shadow-lg">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 border-2 border-gray-300 rounded-xl text-base font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => {
              if (!formData.bookingType || !formData.bookingDate || !formData.startTime || !formData.endTime || !formData.guestCount || !formData.acceptTerms) {
                toast.error('Please fill all required fields and accept terms');
                return;
              }
              const guestCount = Number(formData.guestCount);
              if (!Number.isFinite(guestCount) || guestCount < 1) {
                toast.error('Please enter a valid guest count');
                return;
              }
              if (capacityLimit && guestCount > capacityLimit) {
                toast.error(`Guest count cannot exceed ${capacityLimit}`);
                return;
              }
              setShowQuotation(true);
            }}
            disabled={!calculatedPrice.total}
            className={`flex-1 px-6 py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all ${
              !calculatedPrice.total 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Generate Quotation
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={!calculatedPrice.total || submitting}
            className={`flex-1 px-6 py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all ${
              !calculatedPrice.total || submitting
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-200'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirm Booking
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

