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

export default function BookingForm({ venue, onClose }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const quotationRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    bookingType: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    isWeekend: false,
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    eventType: '',
    guestCount: '',
    specialRequirements: '',
    acceptTerms: false
  });

  // Selected amenities state with quantities
  const [selectedAmenities, setSelectedAmenities] = useState({
    basic: [],
    beverages: [],
    refreshmentFood: [],
    lunchThalis: [],
    additional: []
  });

  // Quantities for items
  const [quantities, setQuantities] = useState({});

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
        total += amenity.rate || 0;
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
      const subtotal = basePrice + amenitiesTotal;
      const gst = Math.round(subtotal * 0.18); // 18% GST
      const total = subtotal + gst;

      setCalculatedPrice({
        basePrice,
        amenitiesTotal,
        subtotal,
        gst,
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    if (!token) {
      toast.error('Please login to book');
      router.push('/login');
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
        toast.success('Booking request sent successfully! 🎉');
        onClose();
        router.push('/customer/bookings');
      } else {
        toast.error(result.message || 'Failed to create booking');
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 z-[160]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-dark-800">Book Venue</h2>
            <p className="text-xs md:text-sm text-gray-600">{venue.businessName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setShowQuotation(true); }} className="p-4 md:p-6 space-y-4 md:space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Booking Type */}
          <div>
            <label className="block text-xs md:text-sm font-semibold text-dark-700 mb-2 md:mb-3">Booking Type *</label>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {['hourly', 'halfday', 'fullday'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleBookingTypeChange(type)}
                  className={`p-4 border-2 rounded-xl text-center transition-all ${
                    formData.bookingType === type ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {type === 'hourly' ? <Clock className="w-6 h-6 mx-auto mb-2 text-primary-500" /> : <Calendar className="w-6 h-6 mx-auto mb-2 text-primary-500" />}
                  <p className="font-semibold text-sm capitalize">{type === 'hourly' ? 'Per Hour' : type === 'halfday' ? 'Half Day' : 'Full Day'}</p>
                  {type !== 'hourly' && <p className="text-xs text-gray-500">{type === 'halfday' ? '4 hours' : '8 hours'}</p>}
                  <p className="text-primary-600 font-bold mt-2">₹{calculateBasePrice(type, formData.isWeekend).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">Booking Date *</label>
              <input
                type="date"
                value={formData.bookingDate}
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                required
              />
              {formData.isWeekend && (
                <p className="text-xs text-orange-600 mt-1 font-medium">⚠ Weekend rates apply</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">Start Time *</label>
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">End Time *</label>
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500" required />
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Your Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name *</label>
                <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email *</label>
                <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Phone *</label>
                <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} maxLength={10} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Event Type *</label>
                <select name="eventType" value={formData.eventType} onChange={handleChange} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" required>
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
                <label className="block text-sm font-semibold mb-2">Guest Count *</label>
                <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} min="1" max={venue.capacity} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" required />
                <p className="text-xs text-gray-500 mt-1">Max capacity: {venue.capacity}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Special Requirements</label>
                <textarea name="specialRequirements" value={formData.specialRequirements} onChange={handleChange} rows="3" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" placeholder="Any special requests..." />
              </div>
            </div>
          </div>

          {/* Amenities Selection */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary-500" />
              Select Amenities & Services
            </h3>
            <p className="text-sm text-gray-600 mb-4">Choose additional services you need for your event</p>

            {/* Basic Amenities */}
            {venue.amenities?.basic?.filter(a => a.available).length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Wifi className="w-4 h-4" /> Basic Amenities
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {venue.amenities.basic.filter(a => a.available).map((amenity, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        isAmenitySelected('basic', amenity.name)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAmenitySelected('basic', amenity.name)}
                          onChange={() => toggleAmenity('basic', amenity)}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="font-medium text-sm">{amenity.name}</span>
                      </div>
                      <span className={`text-sm font-semibold ${amenity.type === 'Paid' ? 'text-orange-600' : 'text-green-600'}`}>
                        {amenity.type === 'Paid' ? `₹${amenity.rate}` : 'Free'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Beverages */}
            {venue.amenities?.beverages?.filter(b => b.available && b.name).length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Coffee className="w-4 h-4" /> Beverages
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {venue.amenities.beverages.filter(b => b.available && b.name).map((beverage, idx) => {
                    const key = `beverage_${beverage.name}`;
                    const qty = quantities[key] || 0;
                    const isSelected = isAmenitySelected('beverages', beverage.name);
                    
                    return (
                      <div
                        key={idx}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAmenity('beverages', beverage)}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <div>
                              <span className="font-medium text-sm block">{beverage.name}</span>
                              <span className="text-xs text-gray-500">₹{beverage.ratePerUnit}/person</span>
                            </div>
                          </label>
                          <span className="text-sm font-semibold text-primary-600">
                            ₹{((beverage.ratePerUnit || 0) * qty).toLocaleString()}
                          </span>
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center gap-3 ml-8">
                            <label className="text-xs font-medium text-gray-600">Quantity:</label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) => updateQuantity(key, e.target.value)}
                                min="0"
                                className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, qty + 1)}
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs text-gray-500">persons</span>
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
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Utensils className="w-4 h-4" /> Refreshments & Snacks
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {venue.amenities.refreshmentFood.filter(f => f.available).map((food, idx) => {
                    const key = `food_${food.name}`;
                    const qty = quantities[key] || 0;
                    const isSelected = isAmenitySelected('refreshmentFood', food.name);
                    
                    return (
                      <div
                        key={idx}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAmenity('refreshmentFood', food)}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <div>
                              <span className="font-medium text-sm block">{food.name}</span>
                              <span className="text-xs text-gray-500">₹{food.ratePerPlate}/plate</span>
                            </div>
                          </label>
                          <span className="text-sm font-semibold text-primary-600">
                            ₹{((food.ratePerPlate || 0) * qty).toLocaleString()}
                          </span>
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center gap-3 ml-8">
                            <label className="text-xs font-medium text-gray-600">Quantity:</label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) => updateQuantity(key, e.target.value)}
                                min="0"
                                className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, qty + 1)}
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs text-gray-500">plates</span>
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
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Utensils className="w-4 h-4" /> Lunch Thalis
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {venue.amenities.lunchThalis.filter(t => t.available).map((thali, idx) => {
                    const key = `thali_${thali.type}`;
                    const qty = quantities[key] || 0;
                    const isSelected = isAmenitySelected('lunchThalis', thali.type);
                    
                    return (
                      <div
                        key={idx}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAmenity('lunchThalis', { ...thali, name: thali.type })}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <div>
                              <span className="font-medium text-sm block">{thali.type}</span>
                              <span className="text-xs text-gray-500">₹{thali.ratePerPlate}/plate • {thali.numberOfItems} items</span>
                            </div>
                          </label>
                          <span className="text-sm font-semibold text-primary-600">
                            ₹{((thali.ratePerPlate || 0) * qty).toLocaleString()}
                          </span>
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center gap-3 ml-8">
                            <label className="text-xs font-medium text-gray-600">Quantity:</label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) => updateQuantity(key, e.target.value)}
                                min="0"
                                className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, qty + 1)}
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs text-gray-500">plates</span>
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
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Price Summary</h3>
            <div className="space-y-2 text-sm mb-4">
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
              <div className="flex justify-between text-gray-600">
                <span>GST (18%):</span>
                <span>₹{calculatedPrice.gst.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-primary-300">
              <span className="text-xl font-bold">Total Amount:</span>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600 flex items-center">
                  <IndianRupee className="w-7 h-7" />{calculatedPrice.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">{formData.isWeekend ? 'Weekend rate' : 'Weekday rate'}</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600 space-y-1 bg-white/50 p-3 rounded-lg">
              <p>• 15% platform commission (deducted from owner)</p>
              <p>• Payment after owner confirmation</p>
              <p>• Refund as per cancellation policy</p>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              name="acceptTerms" 
              checked={formData.acceptTerms} 
              onChange={handleChange} 
              className="w-5 h-5 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer mt-1" 
              required 
            />
            <label className="text-sm text-gray-700">
              I agree to the booking terms and conditions, cancellation policy, and understand that this is a booking request subject to venue owner approval.
            </label>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
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
            className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              !calculatedPrice.total 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-200'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Generate Quotation
          </button>
        </div>
      </div>
    </div>
  );
}
