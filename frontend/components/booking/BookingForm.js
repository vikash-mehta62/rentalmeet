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
import QuotationView from './QuotationView';

export default function BookingForm({ venue, initialData = {}, initialAmenities = {}, initialQuantities = {}, onClose }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [terms, setTerms] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({
    gstRate: 18,
    venueCGST: 9,
    venueSGST: 9,
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
        setPlatformSettings({
          gstRate: parseFloat(data.settings.gstRate) || 18,
          venueCGST: parseFloat(data.settings.venueCGST) || 9,
          venueSGST: parseFloat(data.settings.venueSGST) || 9,
          platformCGST: parseFloat(data.settings.platformCGST) || 9,
          platformSGST: parseFloat(data.settings.platformSGST) || 9,
          platformFeeType: data.settings.platformFee?.feeType || 'percentage',
          platformFeeValue: parseFloat(data.settings.platformFee?.feeValue) || 5
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
    isWeekend: initialData?.date ? (new Date(initialData.date).getDay() === 0 || new Date(initialData.date).getDay() === 6) : false,
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
  const calculateBasePrice = (type, isWeekendDay) => {
    if (!venue?.pricing) return 0;
    const dayType = isWeekendDay ? 'weekend' : 'weekday';
    
    switch (type) {
      case 'hourly': return venue.pricing.perHour?.[dayType] || 0;
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
      const basePrice = calculateBasePrice(formData.bookingType, formData.isWeekend);
      const amenitiesTotal = calculateAmenitiesTotal();
      const subtotal = basePrice + amenitiesTotal;
      
      // Calculate GST - Priority: Owner's hasGST > Custom GST > Platform Default
      let gstRate = 0;
      let gst = 0;
      
      // First check if owner has GST registration
      if (venue.ownerInfo?.hasGST) {
        if (venue.customGST?.enabled) {
          // Venue has custom GST rate (combined)
          gstRate = venue.customGST.rate;
        } else {
          // Use platform CGST + SGST (venue invoice rates)
          const cgst = parseFloat(platformSettings.venueCGST) || 9;
          const sgst = parseFloat(platformSettings.venueSGST) || 9;
          gstRate = cgst + sgst;
        }
        gst = (subtotal * gstRate) / 100;
      }
      
      // Calculate Platform Fee (check if venue has custom fee)
      let platformFee = 0;
      if (venue.customPlatformFee?.enabled) {
        const pct = parseFloat(venue.customPlatformFee.percentage) || 0;
        platformFee = (subtotal * pct) / 100;
      } else {
        const feeType = platformSettings.platformFeeType || 'percentage';
        const feeValue = parseFloat(platformSettings.platformFeeValue) || 0;
        platformFee = feeType === 'fixed'
          ? feeValue
          : (subtotal * feeValue) / 100;
      }

      // Platform Fee GST (CGST + SGST on platform fee)
      const platformCGSTRate = parseFloat(platformSettings.platformCGST) || 9;
      const platformSGSTRate = parseFloat(platformSettings.platformSGST) || 9;
      const platformFeeCGST = Math.round((platformFee * platformCGSTRate) / 100 * 100) / 100;
      const platformFeeSGST = Math.round((platformFee * platformSGSTRate) / 100 * 100) / 100;
      const platformFeeGST = Math.round((platformFeeCGST + platformFeeSGST) * 100) / 100;
      const platformFeeTotal = Math.round((platformFee + platformFeeGST) * 100) / 100;

      // Venue GST breakdown
      const venueCGSTRate = venue.customGST?.enabled
        ? Math.round(venue.customGST.rate / 2)
        : (parseFloat(platformSettings.venueCGST) || 9);
      const venueSGSTRate = venue.customGST?.enabled
        ? Math.round(venue.customGST.rate / 2)
        : (parseFloat(platformSettings.venueSGST) || 9);
      const venueCGST = Math.round((subtotal * venueCGSTRate) / 100 * 100) / 100;
      const venueSGST = Math.round((subtotal * venueSGSTRate) / 100 * 100) / 100;

      const rawTotal = subtotal + gst + platformFeeTotal;
      const total = Math.round(rawTotal * 100) / 100;

      setCalculatedPrice({
        basePrice,
        amenitiesTotal,
        subtotal,
        // Venue GST
        venueCGST,
        venueCGSTRate,
        venueSGST,
        venueSGSTRate,
        gst,
        gstRate,
        // Platform Fee
        platformFee,
        platformFeeRate: venue.customPlatformFee?.enabled
          ? (parseFloat(venue.customPlatformFee.percentage) || 0)
          : (parseFloat(platformSettings.platformFeeValue) || 5),
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
  }, [formData.bookingType, formData.isWeekend, selectedAmenities, quantities, platformSettings, venue, appliedCoupon]);

  // Check weekend
  const checkIfWeekend = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6;
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
    const baseTotal = calculatedPrice.subtotal + calculatedPrice.gst + calculatedPrice.platformFee;
    setCouponLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: couponInput, venueId: venue._id, bookingAmount: baseTotal })
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
  const handlePayment = async (bookingId, amount) => {
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
          bookingId: bookingId
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        toast.error('Failed to create payment order');
        return;
      }

      // Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'RentalMeet',
        description: `Booking Payment - ${venue.businessName}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          // Verify payment
          try {
            const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingId
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast.success('Payment successful! Booking confirmed 🎉');
              localStorage.removeItem('pendingBooking');
              onClose();
              router.push('/customer/bookings');
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
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

    if (!formData.bookingType || !formData.bookingDate || !formData.startTime || !formData.endTime) {
      toast.error('Please fill all required fields');
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
        amount: calculatedPrice.total,
        amenitiesTotal: calculatedPrice.amenitiesTotal,
        selectedAmenities: amenitiesWithDetails,
        priceBreakdown: calculatedPrice,
        couponCode: appliedCoupon?.code || null,
        customerDetails: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
          eventType: formData.eventType,
          guestCount: Number(formData.guestCount),
          specialRequirements: formData.specialRequirements
        }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (result.success) {
        // Booking created successfully, now initiate payment
        setSubmitting(false);
        await handlePayment(result.booking._id, calculatedPrice.total);
      } else {
        toast.error(result.message || 'Failed to create booking');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-4 md:px-6 md:py-5 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-dark-800 dark:text-slate-100">Book Venue</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">{venue.businessName}</p>
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
                  const price = calculateBasePrice(bookingType, formData.isWeekend);
                  const displayPrice = hours === '1' || hours === '2' ? price * parseInt(hours) : price;
                  return (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => handleDurationChange(hours)}
                      className={`p-4 border-2 rounded-xl text-center transition-all ${
                        formData.duration === hours ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                      }`}
                    >
                      <Clock className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                      <p className="font-semibold text-sm md:text-base dark:text-slate-100">{label}</p>
                      <p className="text-primary-600 font-bold text-base md:text-lg">₹{displayPrice.toLocaleString()}</p>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 dark:text-slate-200 mb-2">Booking Date *</label>
              <DatePicker
                selected={formData.bookingDate ? new Date(formData.bookingDate) : null}
                onChange={(date) => {
                  if (!date) return;
                  const iso = date.toISOString().split('T')[0];
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
            <div>
              <label className="block text-sm font-semibold text-dark-700 dark:text-slate-200 mb-2">End Time</label>
              <input 
                type="text" 
                name="endTime" 
                value={formData.endTime} 
                readOnly
                className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 cursor-not-allowed" 
                placeholder="Auto-calculated"
              />
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
                <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} min="1" max={venue.capacity} className="w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-slate-900 dark:text-slate-100" required />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Max: {venue.capacity}</p>
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
              {venue.ownerInfo?.hasGST && calculatedPrice.gst > 0 && (
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
                <span>Platform Fee ({calculatedPrice.platformFeeRate || 5}%):</span>
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
                  <span>Coupon ({appliedCoupon.code}):</span>
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

