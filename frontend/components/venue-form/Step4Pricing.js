'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { IndianRupee, Clock, Calendar, Sparkles } from 'lucide-react';
import ClockTimePicker, { formatDisplayTime } from '@/components/ui/ClockTimePicker';

const advanceBookingDays = ['1 Day', '2 Days', '3 Days', '4 Days', '5 Days', '6 Days'];
const advanceBookingWeeks = ['1 Week', '2 Weeks', '3 Weeks', '4 Weeks'];

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
    formData.pricing?.confirmationHours !== undefined ? formData.pricing.confirmationHours : 3
  );

  const [selectedAdvanceRule, setSelectedAdvanceRule] = useState(
    formData.pricing?.advanceBookingRule || '1 Day'
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
      // Availability (Physical Venue Operating Hours)
      openingTime: formData.pricing?.openingTime || '09:00',
      closingTime: formData.pricing?.closingTime || '21:00',
      // Online Booking Window (Accepting online bookings e.g. 6:00 AM to 2:00 AM next day)
      onlineBookingOpeningTime: formData.pricing?.onlineBookingOpeningTime || formData.pricing?.onlineBookingSchedule?.openingTime || '06:00',
      onlineBookingClosingTime: formData.pricing?.onlineBookingClosingTime || formData.pricing?.onlineBookingSchedule?.closingTime || '02:00',
      availableDays: formData.pricing?.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      advanceBookingRule: formData.pricing?.advanceBookingRule || '1 Day'
    };
  };
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: prepareDefaultValues()
  });

  // Watch opening & closing times for live calculations and picker display
  const openingTimeValue = watch('openingTime');
  const closingTimeValue = watch('closingTime');
  const onlineBookingOpeningValue = watch('onlineBookingOpeningTime');
  const onlineBookingClosingValue = watch('onlineBookingClosingTime');

  // Register time fields for validation
  useEffect(() => {
    register('openingTime', { required: 'Opening time is required' });
    register('closingTime', { required: 'Closing time is required' });
    register('onlineBookingOpeningTime', { required: 'Online booking opening time is required' });
    register('onlineBookingClosingTime', { required: 'Online booking closing time is required' });
    register('advanceBookingRule', { required: 'Select advance booking rule' });
  }, [register]);
  
  // Reset form when formData changes (for edit mode)
  React.useEffect(() => {
    if (formData.pricing) {
      reset(prepareDefaultValues());
      if (formData.pricing.enabledOptions) {
        setEnabledOptions(formData.pricing.enabledOptions);
      }
      if (formData.pricing.confirmationHours !== undefined) {
        setConfirmationHours(formData.pricing.confirmationHours);
      }
      if (formData.pricing.advanceBookingRule) {
        setSelectedAdvanceRule(formData.pricing.advanceBookingRule);
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
        onlineBookingSchedule: {
          enabled: true,
          openingTime: data.onlineBookingOpeningTime || '06:00',
          closingTime: data.onlineBookingClosingTime || '02:00'
        },
        advanceBookingRule: selectedAdvanceRule || data.advanceBookingRule || '1 Day',
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

  const handleSelectAdvanceRule = (val) => {
    setSelectedAdvanceRule(val);
    setValue('advanceBookingRule', val, { shouldValidate: true, shouldDirty: true });
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
            
            {/* Rates Table */}
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-3 text-sm font-semibold">
                      Option
                      <span className="text-xs font-normal text-gray-500 block">
                        (Select to enable)
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

      {/* Availability Schedule (Physical Venue Hours) */}
      <div className="bg-blue-50/70 dark:bg-slate-800/60 border-l-4 border-blue-500 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-sm flex-shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-dark-800 dark:text-white">Venue Operating Hours</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Daily physical opening & closing hours of your venue
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
              <div className="p-3 bg-gradient-to-r from-blue-100/60 to-indigo-100/50 dark:from-slate-700/60 dark:to-slate-800/60 rounded-xl border border-blue-200/80 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-gray-200">
                    Operating Schedule: <strong className="text-blue-700 dark:text-blue-400">{formatDisplayTime(openingTimeValue)}</strong> to <strong className="text-blue-700 dark:text-blue-400">{formatDisplayTime(closingTimeValue)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Online Booking Schedule (Accepting Bookings Window) ─── */}
        <div className="pt-4 border-t border-blue-200/70 dark:border-slate-700 flex items-start gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-base font-bold text-dark-800 dark:text-white flex items-center gap-2">
                  Online Booking Schedule
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Booking Window
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Online bookings will be accepted only within these hours. Outside these hours, guests can submit an enquiry.
                </p>
              </div>

              {/* Quick Online Presets */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900/80 p-1 rounded-xl border border-indigo-100 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-gray-500 px-2">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setValue('onlineBookingOpeningTime', '06:00', { shouldValidate: true, shouldDirty: true });
                    setValue('onlineBookingClosingTime', '02:00', { shouldValidate: true, shouldDirty: true });
                    toast.success('Online Bookings: 6:00 AM – 2:00 AM Next Day');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                >
                  6 AM – 2 AM (Next Day)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('onlineBookingOpeningTime', '08:00', { shouldValidate: true, shouldDirty: true });
                    setValue('onlineBookingClosingTime', '23:00', { shouldValidate: true, shouldDirty: true });
                    toast.success('Online Bookings: 8:00 AM – 11:00 PM');
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-indigo-50 text-slate-700 transition-colors"
                >
                  8 AM – 11 PM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('onlineBookingOpeningTime', '00:00', { shouldValidate: true, shouldDirty: true });
                    setValue('onlineBookingClosingTime', '23:59', { shouldValidate: true, shouldDirty: true });
                    toast.success('Online Bookings: 24 Hours Active');
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-indigo-50 text-slate-700 transition-colors"
                >
                  24 Hours
                </button>
              </div>
            </div>

            {/* Interactive Clock Pickers for Online Booking Hours */}
            <div className="grid md:grid-cols-2 gap-5 mb-4">
              <ClockTimePicker
                id="online-opening-time-picker"
                label="Online Booking Opens"
                required={true}
                value={onlineBookingOpeningValue}
                onChange={(val) => setValue('onlineBookingOpeningTime', val, { shouldValidate: true, shouldDirty: true })}
                error={errors.onlineBookingOpeningTime}
                presetType="opening"
                helperText="Time when customers can start booking online"
              />
              
              <ClockTimePicker
                id="online-closing-time-picker"
                label="Online Booking Closes"
                required={true}
                value={onlineBookingClosingValue}
                onChange={(val) => setValue('onlineBookingClosingTime', val, { shouldValidate: true, shouldDirty: true })}
                error={errors.onlineBookingClosingTime}
                presetType="closing"
                helperText="Time when online booking closes (after this, enquiries are received)"
              />
            </div>

            {/* Live Online Booking Hours Summary Banner */}
            {onlineBookingOpeningValue && onlineBookingClosingValue && (
              <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="text-xs font-medium text-indigo-950 dark:text-indigo-200">
                    Live Booking Window: <strong className="text-indigo-700 dark:text-indigo-300">{formatDisplayTime(onlineBookingOpeningValue)}</strong> to <strong className="text-indigo-700 dark:text-indigo-300">{formatDisplayTime(onlineBookingClosingValue)}</strong>
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-indigo-700 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-indigo-200">
                  Off-hours visitors will be prompted to Send Enquiry
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Available Days ─── */}
        <div className="pt-4 border-t border-blue-200/70 dark:border-slate-700">
          <label className="block text-sm font-semibold text-dark-700 dark:text-gray-200 mb-3">
            Available Days *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {daysOfWeek.map((day) => (
              <label key={day} className="flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="checkbox"
                  value={day}
                  {...register('availableDays', { required: 'Select at least one day' })}
                  className="w-4 h-4 rounded border-dark-200 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{day.slice(0, 3)}</span>
              </label>
            ))}
          </div>
          {errors.availableDays && (
            <p className="text-error text-sm mt-1">{errors.availableDays.message}</p>
          )}
        </div>

        {/* ─── Minimum Advance Booking Required (Days & Weeks Buttons) ─── */}
        <div className="pt-4 border-t border-blue-200/70 dark:border-slate-700">
          <label className="block text-sm font-semibold text-dark-700 dark:text-gray-200 mb-1">
            Minimum Advance Booking Required *
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Guests must book at least this much time in advance. Select from Days or Weeks below:
          </p>

          {/* Days Section */}
          <div className="mb-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Advance in Days
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {advanceBookingDays.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelectAdvanceRule(option)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                    selectedAdvanceRule === option
                      ? 'bg-primary-500 border-primary-500 text-white shadow-sm scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Weeks Section */}
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Advance in Weeks
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {advanceBookingWeeks.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelectAdvanceRule(option)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                    selectedAdvanceRule === option
                      ? 'bg-primary-500 border-primary-500 text-white shadow-sm scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <input
            type="hidden"
            {...register('advanceBookingRule', { required: 'Select advance booking rule' })}
            value={selectedAdvanceRule}
          />
          {errors.advanceBookingRule && (
            <p className="text-error text-sm mt-1">{errors.advanceBookingRule.message}</p>
          )}
        </div>

        {/* ─── Confirmation Hours (Including 30 Min) ─── */}
        <div className="pt-4 border-t border-blue-200/70 dark:border-slate-700">
          <label className="block text-sm font-semibold text-dark-700 dark:text-gray-200 mb-1">
            Maximum time to confirm a booking request (max 3 hours)
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Time window given to you to accept or reject incoming bookings:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { value: 0.5, label: '30 Min' },
              { value: 1, label: '1 Hr' },
              { value: 2, label: '2 Hrs' },
              { value: 3, label: '3 Hrs' }
            ].map(({ value, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setConfirmationHours(value)}
                className={`py-2.5 px-3 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all text-center ${
                  confirmationHours === value
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-amber-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 font-medium">
            Selected: {confirmationHours === 0.5 ? '30 minutes' : `${confirmationHours} hour${confirmationHours > 1 ? 's' : ''}`}. Displayed on public venue page.
          </p>
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
