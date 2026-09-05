'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { IndianRupee, Clock, Calendar, Sparkles } from 'lucide-react';
import ClockTimePicker, { formatDisplayTime } from '@/components/ui/ClockTimePicker';

const advanceBookingOptions = [
  'Same day allowed',
  '24 hours in advance',
  '48 hours in advance',
  '1 week in advance'
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Step4Pricing() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  
  // State for which pricing options are enabled
  const [enabledOptions, setEnabledOptions] = useState({
    perHour: formData.pricing?.enabledOptions?.perHour ?? true,
    halfDay: formData.pricing?.enabledOptions?.halfDay ?? false,
    fullDay: formData.pricing?.enabledOptions?.fullDay ?? false
  });
  
  const [confirmationHours, setConfirmationHours] = useState(
    formData.pricing?.confirmationHours || 3
  );
  
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
      openingTime: formData.pricing?.openingTime || '08:00',
      closingTime: formData.pricing?.closingTime || '22:00',
      availableDays: formData.pricing?.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
      advanceBookingRule: formData.pricing?.advanceBookingRule || '1 week in advance'
    };
  };
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: prepareDefaultValues()
  });

  // Watch opening & closing times for live calculations and picker display
  const openingTimeValue = watch('openingTime');
  const closingTimeValue = watch('closingTime');

  // Register opening and closing time fields for validation
  useEffect(() => {
    register('openingTime', { required: 'Opening time is required' });
    register('closingTime', { required: 'Closing time is required' });
  }, [register]);
  
  // Reset form when formData changes (for edit mode)
  React.useEffect(() => {
    if (formData.pricing) {
      reset(prepareDefaultValues());
      if (formData.pricing.enabledOptions) {
        setEnabledOptions(formData.pricing.enabledOptions);
      }
      if (formData.pricing.confirmationHours) {
        setConfirmationHours(formData.pricing.confirmationHours);
      }
    }
  }, [formData.pricing]);

  const toggleOption = (option) => {
    setEnabledOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const onSubmit = (data) => {
    // Check if at least one option is enabled
    if (!enabledOptions.perHour && !enabledOptions.halfDay && !enabledOptions.fullDay) {
      toast.error('Please select at least one pricing option');
      return;
    }

    // Validate that enabled options have prices
    if (enabledOptions.perHour && (!data.perHour.weekday || !data.perHour.weekend)) {
      toast.error('Please enter Per Hour pricing for both weekday and weekend');
      return;
    }
    if (enabledOptions.halfDay && (!data.halfDay.weekday || !data.halfDay.weekend)) {
      toast.error('Please enter Half Day pricing for both weekday and weekend');
      return;
    }
    if (enabledOptions.fullDay && (!data.fullDay.weekday || !data.fullDay.weekend)) {
      toast.error('Please enter Full Day pricing for both weekday and weekend');
      return;
    }

    // Save with enabled options
    setFormData({ 
      pricing: {
        ...data,
        enabledOptions,
        confirmationHours
      }
    });
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
            <h3 className="text-lg font-bold text-dark-800 mb-2">Pricing Structure</h3>
            <p className="text-sm text-gray-600 mb-4">Select which pricing options you want to offer</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="text-left p-3 text-sm font-semibold">
                      <span className="flex items-center gap-2">
                        <span>Period</span>
                        <span className="text-xs text-gray-500">(Select to enable)</span>
                      </span>
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">Weekday (Mon-Fri)</th>
                    <th className="text-left p-3 text-sm font-semibold">Weekend (Sat-Sun)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Per Hour */}
                  <tr className={`${enabledOptions.perHour ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                    <td className="p-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabledOptions.perHour}
                          onChange={() => toggleOption('perHour')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium">Per Hour</span>
                      </label>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('perHour.weekday')}
                        placeholder="₹"
                        disabled={!enabledOptions.perHour}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                          !enabledOptions.perHour ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('perHour.weekend')}
                        placeholder="₹"
                        disabled={!enabledOptions.perHour}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                          !enabledOptions.perHour ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                  </tr>
                  
                  {/* Half Day */}
                  <tr className={`${enabledOptions.halfDay ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                    <td className="p-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabledOptions.halfDay}
                          onChange={() => toggleOption('halfDay')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium">Half Day (4 hours)</span>
                      </label>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('halfDay.weekday')}
                        placeholder="₹"
                        disabled={!enabledOptions.halfDay}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                          !enabledOptions.halfDay ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('halfDay.weekend')}
                        placeholder="₹"
                        disabled={!enabledOptions.halfDay}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                          !enabledOptions.halfDay ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                  </tr>
                  
                  {/* Full Day */}
                  <tr className={`${enabledOptions.fullDay ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                    <td className="p-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabledOptions.fullDay}
                          onChange={() => toggleOption('fullDay')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium">Full Day (8 hours)</span>
                      </label>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('fullDay.weekday')}
                        placeholder="₹"
                        disabled={!enabledOptions.fullDay}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                          !enabledOptions.fullDay ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('fullDay.weekend')}
                        placeholder="₹"
                        disabled={!enabledOptions.fullDay}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                          !enabledOptions.fullDay ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                  </tr>
                  
                  {/* Extra Hour Rate */}
                  <tr className="bg-white">
                    <td className="p-3 text-sm font-medium">Extra Hour Rate</td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('extraHourRate.weekday')}
                        placeholder="₹"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        {...register('extraHourRate.weekend')}
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
      <div className="bg-blue-50/70 dark:bg-slate-800/60 border-l-4 border-blue-500 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-sm flex-shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-dark-800 dark:text-white">Availability Schedule</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Set the daily operating hours when guests can book your venue
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900/80 p-1 rounded-xl border border-blue-100 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-gray-500 px-2">Quick Timings:</span>
                <button
                  type="button"
                  onClick={() => {
                    setValue('openingTime', '09:00', { shouldValidate: true, shouldDirty: true });
                    setValue('closingTime', '18:00', { shouldValidate: true, shouldDirty: true });
                    toast.success('Set to 9:00 AM – 6:00 PM');
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-200 transition-colors"
                >
                  9 AM – 6 PM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('openingTime', '08:00', { shouldValidate: true, shouldDirty: true });
                    setValue('closingTime', '22:00', { shouldValidate: true, shouldDirty: true });
                    toast.success('Set to 8:00 AM – 10:00 PM');
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-200 transition-colors"
                >
                  8 AM – 10 PM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('openingTime', '00:00', { shouldValidate: true, shouldDirty: true });
                    setValue('closingTime', '23:59', { shouldValidate: true, shouldDirty: true });
                    toast.success('Set to 24 Hours Open');
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-200 transition-colors"
                >
                  24 Hours
                </button>
              </div>
            </div>
            
            {/* Interactive Clock Pickers for Operating Hours */}
            <div className="grid md:grid-cols-2 gap-5 mb-4">
              <ClockTimePicker
                id="opening-time-picker"
                label="Opening Time"
                required={true}
                value={openingTimeValue}
                onChange={(val) => setValue('openingTime', val, { shouldValidate: true, shouldDirty: true })}
                error={errors.openingTime}
                presetType="opening"
                helperText="Click clock to set daily opening time"
              />
              
              <ClockTimePicker
                id="closing-time-picker"
                label="Closing Time"
                required={true}
                value={closingTimeValue}
                onChange={(val) => setValue('closingTime', val, { shouldValidate: true, shouldDirty: true })}
                error={errors.closingTime}
                presetType="closing"
                helperText="Click clock to set daily closing time"
              />
            </div>

            {/* Live Operating Hours Summary Banner */}
            {openingTimeValue && closingTimeValue && (
              <div className="mb-5 p-3.5 bg-gradient-to-r from-blue-100/60 to-indigo-100/50 dark:from-slate-700/60 dark:to-slate-800/60 rounded-xl border border-blue-200/80 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-gray-200">
                    Operating Schedule: <strong className="text-blue-700 dark:text-blue-400">{formatDisplayTime(openingTimeValue)}</strong> to <strong className="text-blue-700 dark:text-blue-400">{formatDisplayTime(closingTimeValue)}</strong>
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm border border-blue-100 dark:border-slate-700">
                  {(() => {
                    const [h1, m1] = (openingTimeValue || '08:00').split(':').map(Number);
                    const [h2, m2] = (closingTimeValue || '22:00').split(':').map(Number);
                    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                    if (diff < 0) diff += 24 * 60;
                    const hrs = Math.floor(diff / 60);
                    const mins = diff % 60;
                    return `${hrs} hrs ${mins > 0 ? `${mins} mins` : ''} daily`;
                  })()}
                </span>
              </div>
            )}

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
                {...register('advanceBookingRule', { required: 'Select advance booking rule' })}
                className="input-field"
              >
                <option value="">Select option</option>
                {advanceBookingOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.advanceBookingRule && (
                <p className="text-error text-sm mt-1">{errors.advanceBookingRule.message}</p>
              )}
            </div>

            {/* Confirmation Hours */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Maximum time to confirm a booking request (max 3 hours)
              </label>
              <div className="flex gap-3">
                {[1, 2, 3].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setConfirmationHours(h)}
                    className={`px-5 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                      confirmationHours === h
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                    }`}
                  >
                    {h} Hr{h > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              <p className="text-xs text-orange-500 mt-1">
                Default: 3 hours. Customers will see this on your venue page.
              </p>
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
