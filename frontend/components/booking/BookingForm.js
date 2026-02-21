'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Calendar, Clock, Users, IndianRupee, X, CheckCircle } from 'lucide-react';

export default function BookingForm({ venue, onClose }) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const bookingType = watch('bookingType');
  const bookingDate = watch('bookingDate');
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const isWeekend = watch('isWeekend');

  // Calculate price based on booking type
  const calculatePrice = (type, isWeekendDay) => {
    if (!venue?.pricing) return 0;

    const dayType = isWeekendDay ? 'weekend' : 'weekday';
    
    switch (type) {
      case 'hourly':
        return venue.pricing.perHour?.[dayType] || 0;
      case 'halfday':
        return venue.pricing.halfDay?.[dayType] || 0;
      case 'fullday':
        return venue.pricing.fullDay?.[dayType] || 0;
      default:
        return 0;
    }
  };

  // Update price when booking type or weekend changes
  useState(() => {
    if (bookingType) {
      const price = calculatePrice(bookingType, isWeekend);
      setCalculatedPrice(price);
    }
  }, [bookingType, isWeekend]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Please login to book');
      router.push('/login');
      return;
    }

    if (user?.role !== 'customer') {
      toast.error('Only customers can book venues');
      return;
    }

    setSubmitting(true);

    try {
      const bookingData = {
        venue: venue._id,
        bookingDate: data.bookingDate,
        startTime: data.startTime,
        endTime: data.endTime,
        bookingType: data.bookingType,
        amount: calculatedPrice,
        customerDetails: {
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
          eventType: data.eventType,
          guestCount: Number(data.guestCount),
          specialRequirements: data.specialRequirements
        }
      };

      const response = await fetch('http://localhost:5000/api/bookings', {
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
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if date is weekend
  const checkWeekend = (date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-dark-800">Book Venue</h2>
            <p className="text-sm text-gray-600">{venue.businessName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Booking Type */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              Booking Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  value="hourly"
                  {...register('bookingType', { required: 'Please select booking type' })}
                  className="peer sr-only"
                  onChange={(e) => setCalculatedPrice(calculatePrice(e.target.value, isWeekend))}
                />
                <div className="p-4 border-2 border-gray-200 rounded-xl text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                  <p className="font-semibold text-sm">Per Hour</p>
                </div>
              </label>

              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  value="halfday"
                  {...register('bookingType', { required: 'Please select booking type' })}
                  className="peer sr-only"
                  onChange={(e) => setCalculatedPrice(calculatePrice(e.target.value, isWeekend))}
                />
                <div className="p-4 border-2 border-gray-200 rounded-xl text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                  <p className="font-semibold text-sm">Half Day</p>
                  <p className="text-xs text-gray-500">4 hours</p>
                </div>
              </label>

              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  value="fullday"
                  {...register('bookingType', { required: 'Please select booking type' })}
                  className="peer sr-only"
                  onChange={(e) => setCalculatedPrice(calculatePrice(e.target.value, isWeekend))}
                />
                <div className="p-4 border-2 border-gray-200 rounded-xl text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                  <p className="font-semibold text-sm">Full Day</p>
                  <p className="text-xs text-gray-500">8 hours</p>
                </div>
              </label>
            </div>
            {errors.bookingType && (
              <p className="text-red-500 text-sm mt-1">{errors.bookingType.message}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Booking Date *
              </label>
              <input
                type="date"
                {...register('bookingDate', { 
                  required: 'Date is required',
                  validate: (value) => {
                    const selected = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return selected >= today || 'Please select a future date';
                  }
                })}
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
                onChange={(e) => {
                  const weekend = checkWeekend(e.target.value);
                  register('isWeekend').onChange({ target: { value: weekend } });
                  setCalculatedPrice(calculatePrice(bookingType, weekend));
                }}
              />
              {errors.bookingDate && (
                <p className="text-red-500 text-sm mt-1">{errors.bookingDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Weekend Booking
              </label>
              <div className="flex items-center h-12 px-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  {...register('isWeekend')}
                  disabled
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {isWeekend ? 'Weekend rates apply' : 'Weekday rates'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                {...register('startTime', { required: 'Start time is required' })}
                className="input-field"
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                {...register('endTime', { required: 'End time is required' })}
                className="input-field"
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-dark-800 mb-4">Your Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('customerName', { required: 'Name is required' })}
                  defaultValue={user?.name}
                  className="input-field"
                  placeholder="John Doe"
                />
                {errors.customerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('customerEmail', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  defaultValue={user?.email}
                  className="input-field"
                  placeholder="john@example.com"
                />
                {errors.customerEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  {...register('customerPhone', { 
                    required: 'Phone is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Enter valid 10-digit number'
                    }
                  })}
                  defaultValue={user?.phone}
                  className="input-field"
                  placeholder="9876543210"
                  maxLength={10}
                />
                {errors.customerPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Event Type *
                </label>
                <select
                  {...register('eventType', { required: 'Event type is required' })}
                  className="input-field"
                >
                  <option value="">Select event type</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Conference">Conference</option>
                  <option value="Training">Training</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Party">Party</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Other">Other</option>
                </select>
                {errors.eventType && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventType.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Expected Guest Count *
                </label>
                <input
                  type="number"
                  {...register('guestCount', { 
                    required: 'Guest count is required',
                    min: { value: 1, message: 'At least 1 guest required' }
                  })}
                  className="input-field"
                  placeholder="50"
                  min="1"
                />
                {errors.guestCount && (
                  <p className="text-red-500 text-sm mt-1">{errors.guestCount.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Special Requirements (Optional)
                </label>
                <textarea
                  {...register('specialRequirements')}
                  className="input-field"
                  rows="3"
                  placeholder="Any special requirements or requests..."
                />
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-dark-800">Total Amount</span>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600 flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {calculatedPrice.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  {isWeekend ? 'Weekend rate' : 'Weekday rate'}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Commission (15%) will be deducted from venue owner</p>
              <p>• Payment will be processed after owner confirmation</p>
              <p>• Cancellation policy applies as per terms</p>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('acceptTerms', { required: 'Please accept terms' })}
              className="w-5 h-5 rounded border-gray-300 text-primary-500 mt-1"
            />
            <div className="flex-1">
              <label className="text-sm text-gray-700">
                I agree to the booking terms and conditions, cancellation policy, and understand that this is a booking request pending owner confirmation.
              </label>
              {errors.acceptTerms && (
                <p className="text-red-500 text-sm mt-1">{errors.acceptTerms.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !calculatedPrice}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                submitting || !calculatedPrice
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600 hover:scale-105'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Send Booking Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
