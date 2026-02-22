'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Calendar, Clock, IndianRupee, X, CheckCircle } from 'lucide-react';

export default function BookingForm({ venue, onClose }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  
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

  const [calculatedPrice, setCalculatedPrice] = useState(0);

  // Calculate price
  const calculatePrice = (type, isWeekendDay) => {
    if (!venue?.pricing) return 0;
    const dayType = isWeekendDay ? 'weekend' : 'weekday';
    
    switch (type) {
      case 'hourly': return venue.pricing.perHour?.[dayType] || 0;
      case 'halfday': return venue.pricing.halfDay?.[dayType] || 0;
      case 'fullday': return venue.pricing.fullDay?.[dayType] || 0;
      default: return 0;
    }
  };

  // Check weekend
  const checkIfWeekend = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Update price
  useEffect(() => {
    if (formData.bookingType) {
      const price = calculatePrice(formData.bookingType, formData.isWeekend);
      setCalculatedPrice(price);
    }
  }, [formData.bookingType, formData.isWeekend]);

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
        amount: calculatedPrice,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-dark-800">Book Venue</h2>
            <p className="text-sm text-gray-600">{venue.businessName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">Booking Type *</label>
            <div className="grid grid-cols-3 gap-3">
              {['hourly', 'halfday', 'fullday'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleBookingTypeChange(type)}
                  className={`p-4 border-2 rounded-xl text-center transition-all ${
                    formData.bookingType === type ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  {type === 'hourly' ? <Clock className="w-6 h-6 mx-auto mb-2 text-primary-500" /> : <Calendar className="w-6 h-6 mx-auto mb-2 text-primary-500" />}
                  <p className="font-semibold text-sm capitalize">{type === 'hourly' ? 'Per Hour' : type === 'halfday' ? 'Half Day' : 'Full Day'}</p>
                  {type !== 'hourly' && <p className="text-xs text-gray-500">{type === 'halfday' ? '4 hours' : '8 hours'}</p>}
                </button>
              ))}
            </div>
          </div>

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
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">Weekend Booking</label>
              <div className="flex items-center h-12 px-4 bg-gray-50 rounded-xl border border-gray-200">
                <input type="checkbox" checked={formData.isWeekend} readOnly className="w-5 h-5 rounded pointer-events-none" />
                <span className="ml-2 text-sm font-medium">{formData.isWeekend ? 'Weekend rates' : 'Weekday rates'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">Start Time *</label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">End Time *</label>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500" required />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Your Details</h3>
            <div className="grid grid-cols-2 gap-4">
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
                  <option value="Party">Party</option>
                  <option value="Wedding">Wedding</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2">Guest Count *</label>
                <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} min="1" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-2">Special Requirements</label>
                <textarea name="specialRequirements" value={formData.specialRequirements} onChange={handleChange} rows="3" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total Amount</span>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600 flex items-center">
                  <IndianRupee className="w-6 h-6" />{calculatedPrice.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">{formData.isWeekend ? 'Weekend rate' : 'Weekday rate'}</p>
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Commission (15%) deducted from owner</p>
              <p>• Payment after owner confirmation</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="w-5 h-5 rounded mt-1" required />
            <label className="text-sm text-gray-700">I agree to booking terms and conditions</label>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting || !calculatedPrice} className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${submitting || !calculatedPrice ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600'}`}>
              {submitting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : <><CheckCircle className="w-5 h-5" />Send Request</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
