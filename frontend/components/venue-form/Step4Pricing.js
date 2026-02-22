'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { IndianRupee, Clock, Calendar } from 'lucide-react';

const advanceBookingOptions = [
  'Same day allowed',
  '24 hours in advance',
  '48 hours in advance',
  '1 week in advance'
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Step4Pricing() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  
  // Prepare default values from existing pricing data
  const prepareDefaultValues = () => {
    return {
      // Pricing rates
      perHour: {
        weekday: formData.pricing?.perHour?.weekday || '',
        weekend: formData.pricing?.perHour?.weekend || ''
      },
      halfDay: {
        weekday: formData.pricing?.halfDay?.weekday || '',
        weekend: formData.pricing?.halfDay?.weekend || ''
      },
      fullDay: {
        weekday: formData.pricing?.fullDay?.weekday || '',
        weekend: formData.pricing?.fullDay?.weekend || ''
      },
      extraHourRate: {
        weekday: formData.pricing?.extraHourRate?.weekday || '',
        weekend: formData.pricing?.extraHourRate?.weekend || ''
      },
      // Availability
      openingTime: formData.pricing?.openingTime || '',
      closingTime: formData.pricing?.closingTime || '',
      availableDays: formData.pricing?.availableDays || [],
      advanceBookingRule: formData.pricing?.advanceBookingRule || ''
    };
  };
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: prepareDefaultValues()
  });
  
  // Reset form when formData changes (for edit mode)
  React.useEffect(() => {
    if (formData.pricing) {
      reset(prepareDefaultValues());
    }
  }, [formData.pricing]);

  const onSubmit = (data) => {
    setFormData({ pricing: data });
    setStep(5);
    toast.success('Pricing saved! 🎉');
  };

  const goBack = () => {
    setStep(3);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-slide-up">
      {/* Pricing Structure */}
      <div className="bg-primary-50 border-l-4 border-primary-500 rounded-xl p-5">
        <div className="flex items-start">
          <IndianRupee className="w-6 h-6 text-primary-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-4">Pricing Structure</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="text-left p-3 text-sm font-semibold">Period</th>
                    <th className="text-left p-3 text-sm font-semibold">Weekday (Mon-Fri)</th>
                    <th className="text-left p-3 text-sm font-semibold">Weekend (Sat-Sun)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="p-3 text-sm font-medium">Per Hour</td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('perHour.weekday', { required: 'Required' })}
                        placeholder="₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('perHour.weekend', { required: 'Required' })}
                        placeholder="₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                  </tr>
                  
                  <tr className="bg-white">
                    <td className="p-3 text-sm font-medium">Half Day (4 hours)</td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('halfDay.weekday')}
                        placeholder="₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('halfDay.weekend')}
                        placeholder="₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                  </tr>
                  
                  <tr className="bg-white">
                    <td className="p-3 text-sm font-medium">Full Day (8 hours)</td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('fullDay.weekday')}
                        placeholder="₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('fullDay.weekend')}
                        placeholder="₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                  </tr>
                  
                  <tr className="bg-white">
                    <td className="p-3 text-sm font-medium">Extra Hour Rate</td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('extraHour.weekday')}
                        placeholder="₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('extraHour.weekend')}
                        placeholder="₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Schedule */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-5">
        <div className="flex items-start">
          <Clock className="w-6 h-6 text-blue-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-4">Availability Schedule</h3>
            
            {/* Operating Hours */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Opening Time *
                </label>
                <input
                  type="time"
                  {...register('openingTime', { required: 'Opening time is required' })}
                  className="input-field"
                />
                {errors.openingTime && (
                  <p className="text-error text-sm mt-1">{errors.openingTime.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Closing Time *
                </label>
                <input
                  type="time"
                  {...register('closingTime', { required: 'Closing time is required' })}
                  className="input-field"
                />
                {errors.closingTime && (
                  <p className="text-error text-sm mt-1">{errors.closingTime.message}</p>
                )}
              </div>
            </div>

            {/* Available Days */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-700 mb-3">
                Available Days *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map((day) => (
                  <label key={day} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={day}
                      {...register('availableDays', { required: 'Select at least one day' })}
                      className="w-5 h-5 rounded border-dark-200 text-primary-500"
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
              {errors.availableDays && (
                <p className="text-error text-sm mt-1">{errors.availableDays.message}</p>
              )}
            </div>

            {/* Advance Booking */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Minimum Advance Booking Required *
              </label>
              <select
                {...register('advanceBooking', { required: 'Select advance booking rule' })}
                className="input-field"
              >
                <option value="">Select option</option>
                {advanceBookingOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.advanceBooking && (
                <p className="text-error text-sm mt-1">{errors.advanceBooking.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Blackout Dates */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-5">
        <div className="flex items-start">
          <Calendar className="w-6 h-6 text-red-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-2">Blackout Dates (Optional)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Dates when venue is unavailable for booking
            </p>
            <input
              type="date"
              {...register('blackoutDate')}
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-2">
              Note: You can add multiple blackout dates after venue approval
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goBack}
          className="btn-secondary flex items-center group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center group"
        >
          Next Step
          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
