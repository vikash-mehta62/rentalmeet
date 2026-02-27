'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Calendar, Clock, IndianRupee, X, CheckCircle, 
  Printer, Download, Coffee, Utensils, Wifi, Users
} from 'lucide-react';
import QuotationView from './QuotationView';

export default function BookingForm({ venue, initialData = {}, initialAmenities = {}, initialQuantities = {}, onClose }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const quotationRef = useRef(null);
  
  // Map duration to booking type
  const mapDurationToBookingType = (duration) => {
    if (!duration) return '';
    const hours = parseInt(duration);
    if (hours === 1 || hours === 2) return 'hourly';
    if (hours === 4) return 'halfday';
    if (hours === 8) return 'fullday';
    return '';
  };

  // Calculate end time from start time and duration
  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return '';
    const [hours, minutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);
    startDate.setHours(startDate.getHours() + parseInt(duration));
    return startDate.toTimeString().slice(0, 5);
  };
  
  // Form state - Initialize with passed data
  const [formData, setFormData] = useState({
    bookingType: mapDurationToBookingType(initialData.duration),
    duration: initialData.duration || '2', // Store the actual duration
    bookingDate: initialData.date || '',
    startTime: initialData.startTime || '',
    endTime: calculateEndTime(initialData.startTime, initialData.duration) || initialData.endTime || '',
    isWeekend: initialData.date ? (new Date(initialData.date).getDay() === 0 || new Date(initialData.date).getDay() === 6) : false,
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    eventType: '',
    guestCount: initialData.guestCount || '',
    specialRequirements: '',
    acceptTerms: false
  });

  // Selected amenities state with quantities - Initialize with passed data
  const [selectedAmenities, setSelectedAmenities] = useState({
    basic: initialAmenities.basic || [],
    beverages: initialAmenities.beverages || [],
    refreshmentFood: initialAmenities.refreshmentFood || [],
    lunchThalis: initialAmenities.lunchThalis || [],
    additional: []
  });

  // Quantities for items - Initialize with passed data
  const [quantities, setQuantities] = useState(initialQuantities);

  const [calculatedPrice, setCalculatedPrice] = useState({
    basePrice: 0,
    amenitiesTotal: 0,
    subtotal: 0,
    gst: 0,
    total: 0
  });

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

    // Beverages (per unit * quantity)
    selectedAmenities.beverages.forEach(beverage => {
      const qty = quantities[`beverage_${beverage.name}`] || 0;
      total += (beverage.ratePerUnit || 0) * qty;
    });

    // Refreshment Food (per plate * quantity)
    selectedAmenities.refreshmentFood.forEach(food => {
      const qty = quantities[`food_${food.name}`] || 0;
      total += (food.ratePerPlate || 0) * qty;
    });

    // Lunch Thalis (per plate * quantity)
    selectedAmenities.lunchThalis.forEach(thali => {
      const qty = quantities[`thali_${thali.type}`] || 0;
      total += (thali.ratePerPlate || 0) * qty;
    });

    // Additional facilities (paid ones)
    selectedAmenities.additional.forEach(facility => {
      if (facility.type === 'Paid') {
        total += facility.charges || 0;
      }
    });

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

  // Update total price
  useEffect(() => {
    if (formData.bookingType) {
      const basePrice = calculateBasePrice(formData.bookingType, formData.isWeekend);
      const amenitiesTotal = calculateAmenitiesTotal();
      const total = basePrice + amenitiesTotal;

      setCalculatedPrice({
        basePrice,
        amenitiesTotal,
        subtotal: total,
        gst: 0,
        total
      });
    }
  }, [formData.bookingType, formData.isWeekend, selectedAmenities, quantities]);

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

  const handleBookingTypeChange = (type) => {
    setFormData(prev => ({ ...prev, bookingType: type }));
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

  // Toggle amenity selection
  const toggleAmenity = (category, item) => {
    setSelectedAmenities(prev => {
      const categoryItems = prev[category];
      const exists = categoryItems.find(a => a.name === item.name || a.type === item.type);
      
      if (exists) {
        // Remove quantity when unchecking
        const key = category === 'beverages' ? `beverage_${item.name}` :
                    category === 'refreshmentFood' ? `food_${item.name}` :
                    category === 'lunchThalis' ? `thali_${item.type}` : null;
        if (key) {
          setQuantities(prev => {
            const newQty = { ...prev };
            delete newQty[key];
            return newQty;
          });
        }
        
        return {
          ...prev,
          [category]: categoryItems.filter(a => (a.name || a.type) !== (item.name || item.type))
        };
      } else {
        // Set default quantity when checking
        const key = category === 'beverages' ? `beverage_${item.name}` :
                    category === 'refreshmentFood' ? `food_${item.name}` :
                    category === 'lunchThalis' ? `thali_${item.type}` : null;
        if (key) {
          setQuantities(prev => ({ ...prev, [key]: parseInt(formData.guestCount) || 1 }));
        }
        
        return {
          ...prev,
          [category]: [...categoryItems, item]
        };
      }
    });
  };

  const isAmenitySelected = (category, itemName) => {
    return selectedAmenities[category].some(a => (a.name || a.type) === itemName);
  };

  // Update quantity
  const updateQuantity = (key, value) => {
    const qty = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [key]: qty }));
  };

  // Print quotation
  const handlePrint = () => {
    window.print();
  };

  // Download quotation as PDF (using browser print to PDF)
  const handleDownload = () => {
    window.print();
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
      const bookingData = {
        venue: venue._id,
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        bookingType: formData.bookingType,
        amount: calculatedPrice.total,
        selectedAmenities: selectedAmenities,
        priceBreakdown: calculatedPrice,
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
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] my-4 md:my-8 relative flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 md:p-5 flex items-center justify-between rounded-t-xl md:rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-dark-800">Book Venue</h2>
            <p className="text-xs text-gray-600">{venue.businessName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={(e) => { e.preventDefault(); setShowQuotation(true); }} className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-5 space-y-4">
          {/* Duration Selection */}
          <div>
            <label className="block text-xs font-semibold text-dark-700 mb-2">Select Duration *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['1', '2', '4', '8'].map((hours) => {
                const bookingType = mapDurationToBookingType(hours);
                const price = calculateBasePrice(bookingType, formData.isWeekend);
                const displayPrice = hours === '1' || hours === '2' ? price * parseInt(hours) : price;
                
                return (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => handleDurationChange(hours)}
                    className={`p-2.5 md:p-3 border-2 rounded-lg text-center transition-all ${
                      formData.duration === hours ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-1 text-primary-500" />
                    <p className="font-semibold text-xs md:text-sm">
                      {hours === '8' ? 'Full Day' : `${hours}h`}
                    </p>
                    <p className="text-primary-600 font-bold text-sm">₹{displayPrice.toLocaleString()}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-700 mb-1.5">Booking Date *</label>
              <input
                type="date"
                value={formData.bookingDate}
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
              {formData.isWeekend && (
                <p className="text-xs text-orange-600 mt-1 font-medium">⚠ Weekend rates apply</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-dark-700 mb-1.5">Start Time *</label>
                <select 
                  name="startTime" 
                  value={formData.startTime} 
                  onChange={handleChange} 
                  className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white" 
                  required
                >
                  <option value="">Select</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="09:30">09:30 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="12:30">12:30 PM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="13:30">01:30 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="14:30">02:30 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="15:30">03:30 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="16:30">04:30 PM</option>
                  <option value="17:00">05:00 PM</option>
                  <option value="17:30">05:30 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="18:30">06:30 PM</option>
                  <option value="19:00">07:00 PM</option>
                  <option value="19:30">07:30 PM</option>
                  <option value="20:00">08:00 PM</option>
                  <option value="20:30">08:30 PM</option>
                  <option value="21:00">09:00 PM</option>
                  <option value="21:30">09:30 PM</option>
                  <option value="22:00">10:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-700 mb-1.5">End Time *</label>
                <input 
                  type="text" 
                  name="endTime" 
                  value={formData.endTime} 
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" 
                  placeholder="Auto"
                />
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold mb-3 text-dark-800">Your Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Full Name *</label>
                <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Email *</label>
                <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Phone *</label>
                <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} maxLength={10} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Event Type *</label>
                <select name="eventType" value={formData.eventType} onChange={handleChange} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" required>
                  <option value="">Select</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Conference">Conference</option>
                  <option value="Training">Training</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Party">Party</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Guest Count *</label>
                <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} min="1" max={venue.capacity} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" required />
                <p className="text-xs text-gray-500 mt-0.5">Max: {venue.capacity}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Special Requirements</label>
                <textarea name="specialRequirements" value={formData.specialRequirements} onChange={handleChange} rows="2" className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Any special requests..." />
              </div>
            </div>
          </div>

          {/* Amenities Selection */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-dark-800">
              <CheckCircle className="w-4 h-4 text-primary-500" />
              Select Amenities & Services
            </h3>
            <p className="text-xs text-gray-600 mb-3">Choose additional services for your event</p>

            {/* Basic Amenities */}
            {venue.amenities?.basic?.filter(a => a.available).length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-xs">
                  <Wifi className="w-3.5 h-3.5" /> Basic Amenities
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {/* All amenities - Free and Paid */}
                  {venue.amenities.basic.filter(a => a.available).map((amenity, idx) => {
                    const key = `basic_${amenity.name}`;
                    const qty = quantities[key] || 0;
                    const isSelected = isAmenitySelected('basic', amenity.name);
                    const isPerUse = amenity.rateType === 'Per Use';
                    const isFree = amenity.type === 'Free';
                    
                    return (
                      <div
                        key={idx}
                        className={`p-2 border-2 rounded-lg transition-all ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAmenity('basic', amenity)}
                            className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-xs block">{amenity.name}</span>
                            {isFree ? (
                              <span className="text-xs text-green-600 font-semibold">Free</span>
                            ) : (
                              <span className="text-xs text-gray-500">₹{amenity.rate} {amenity.rateType || 'Fixed'}</span>
                            )}
                          </div>
                          {!isFree && !isPerUse && (
                            <span className="text-xs font-semibold text-primary-600">₹{amenity.rate}</span>
                          )}
                        </label>
                        
                        {!isFree && isPerUse && (
                          <div className="flex items-center gap-1 ml-6">
                            <button
                              type="button"
                              onClick={() => isSelected && updateQuantity(key, Math.max(0, qty - 1))}
                              disabled={!isSelected}
                              className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'hover:border-primary-500 hover:bg-primary-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                              }`}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={qty}
                              onChange={(e) => isSelected && updateQuantity(key, parseInt(e.target.value) || 0)}
                              disabled={!isSelected}
                              className={`w-12 h-6 text-center border border-gray-300 rounded text-xs ${
                                !isSelected ? 'bg-gray-100 cursor-not-allowed' : ''
                              }`}
                              min="0"
                            />
                            <button
                              type="button"
                              onClick={() => isSelected && updateQuantity(key, qty + 1)}
                              disabled={!isSelected}
                              className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'hover:border-primary-500 hover:bg-primary-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                              }`}
                            >
                              +
                            </button>
                            <span className="text-xs font-semibold text-primary-600 ml-1">₹{((amenity.rate || 0) * qty).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Beverages */}
            {venue.amenities?.beverages?.filter(b => b.available && b.name).length > 0 && (
              <div className="mb-5">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                  <Coffee className="w-4 h-4" /> Beverages
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {venue.amenities.beverages.filter(b => b.available && b.name).map((beverage, idx) => {
                    const key = `beverage_${beverage.name}`;
                    const qty = quantities[key] || 0;
                    const isSelected = isAmenitySelected('beverages', beverage.name);
                    
                    return (
                      <div
                        key={idx}
                        className={`p-2 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAmenity('beverages', beverage)}
                            className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-xs block">{beverage.name}</span>
                            <span className="text-xs text-gray-500">₹{beverage.ratePerUnit}/person</span>
                          </div>
                        </label>
                        
                        {isSelected && (
                          <div className="flex items-center gap-1 ml-6">
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                              className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={qty}
                              onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)}
                              className="w-12 h-6 text-center border border-gray-300 rounded text-xs"
                              min="0"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, qty + 1)}
                              className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                            <span className="text-xs font-semibold text-primary-600 ml-1">₹{((beverage.ratePerUnit || 0) * qty).toLocaleString()}</span>
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
              <div className="mb-5">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                  <Utensils className="w-4 h-4" /> Refreshments & Snacks
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {venue.amenities.refreshmentFood.filter(f => f.available).map((food, idx) => {
                    const key = `food_${food.name}`;
                    const qty = quantities[key] || 0;
                    const isSelected = isAmenitySelected('refreshmentFood', food.name);
                    
                    return (
                      <div
                        key={idx}
                        className={`p-2 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAmenity('refreshmentFood', food)}
                            className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-xs block">{food.name}</span>
                            <span className="text-xs text-gray-500">₹{food.ratePerPlate}/plate</span>
                          </div>
                        </label>
                        
                        {isSelected && (
                          <div className="flex items-center gap-1 ml-6">
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                              className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={qty}
                              onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)}
                              className="w-12 h-6 text-center border border-gray-300 rounded text-xs"
                              min="0"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, qty + 1)}
                              className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                            <span className="text-xs font-semibold text-primary-600 ml-1">₹{((food.ratePerPlate || 0) * qty).toLocaleString()}</span>
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
              <div className="mb-5">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                  <Utensils className="w-4 h-4" /> Lunch Thalis
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {venue.amenities.lunchThalis.filter(t => t.available).map((thali, idx) => {
                    const key = `thali_${thali.type}`;
                    const qty = quantities[key] || 0;
                    const isSelected = isAmenitySelected('lunchThalis', thali.type);
                    
                    return (
                      <div
                        key={idx}
                        className={`p-2 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAmenity('lunchThalis', { ...thali, name: thali.type })}
                            className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-xs block">{thali.type}</span>
                            <span className="text-xs text-gray-500">₹{thali.ratePerPlate}/plate</span>
                          </div>
                        </label>
                        
                        {isSelected && (
                          <div className="flex items-center gap-1 ml-6">
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                              className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={qty}
                              onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)}
                              className="w-12 h-6 text-center border border-gray-300 rounded text-xs"
                              min="0"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, qty + 1)}
                              className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                            <span className="text-xs font-semibold text-primary-600 ml-1">₹{((thali.ratePerPlate || 0) * qty).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Additional Facilities */}
            {venue.amenities?.additional?.filter(a => a.available && a.name).length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Additional Facilities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {venue.amenities.additional.filter(a => a.available && a.name).map((facility, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        isAmenitySelected('additional', facility.name)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAmenitySelected('additional', facility.name)}
                          onChange={() => toggleAmenity('additional', facility)}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="font-medium text-sm">{facility.name}</span>
                      </div>
                      <span className={`text-sm font-semibold ${facility.type === 'Paid' ? 'text-orange-600' : 'text-green-600'}`}>
                        {facility.type === 'Paid' ? `₹${facility.charges}` : 'Free'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-lg p-4">
            <h3 className="text-sm font-bold mb-3">Price Summary</h3>
            <div className="space-y-1.5 text-xs mb-3">
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
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{calculatedPrice.subtotal.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-primary-300">
              <span className="text-sm font-bold">Total Amount:</span>
              <div className="text-right">
                <p className="text-xl md:text-2xl font-bold text-primary-600 flex items-center">
                  <IndianRupee className="w-5 h-5" />₹{calculatedPrice.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">{formData.isWeekend ? 'Weekend rate' : 'Weekday rate'}</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 space-y-0.5 bg-white/50 p-2 rounded">
              <p>• Payment after owner confirmation</p>
              <p>• Refund as per cancellation policy</p>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input 
              type="checkbox" 
              name="acceptTerms" 
              checked={formData.acceptTerms} 
              onChange={handleChange} 
              className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer mt-0.5" 
              required 
            />
            <label className="text-xs text-gray-700">
              I agree to the booking terms and conditions, cancellation policy, and understand that this is a booking request subject to venue owner approval.
            </label>
          </div>
          </div>
        </form>

        {/* Action Buttons - Fixed at bottom */}
        <div className="bg-white border-t px-4 py-3 md:p-4 flex gap-2 md:gap-3 rounded-b-xl md:rounded-b-2xl flex-shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
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
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              !calculatedPrice.total 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-200'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Generate Quotation
          </button>
        </div>
      </div>
    </div>
  );
}

