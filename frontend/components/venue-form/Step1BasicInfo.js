'use client';

import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Building2, Users, FileText, Maximize2, UtensilsCrossed } from 'lucide-react';


const capacityOptions = [
  'Up to 10', '10-25', '25–50', '50–100', '100–150', '150–200', '200-300',
  '300-400', '400-500', '500-700', '700-1000', '1000-1500', '1500-2000', '2000+',
  '10-20', '20-30', '30-40', '40-50', '100-200', 'More than 2000'
];

const DEFAULT_VENUE_CATEGORIES = [
  'Meeting Hall',
  'Restaurant',
  'Conference Hall',
  'Co-Work Space',
  'Auditorium',
  'Guest House',
  'Banquet Hall',
  'Training Center',
  'Farm House',
  'Marriage Garden',
  'Hotel',
  'Play Zone'
];

export default function Step1BasicInfo() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  
  const initialVenueTypes = Array.isArray(formData.basicInfo?.venueType)
    ? formData.basicInfo.venueType
    : (formData.basicInfo?.venueType ? [formData.basicInfo.venueType] : []);

  const [selectedVenueTypes, setSelectedVenueTypes] = useState(initialVenueTypes);
  const [venueTypeError, setVenueTypeError] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      ...formData.basicInfo,
      foodType: formData.basicInfo?.foodType || 'Veg'
    }
  });

  const [apiVenueTypes, setApiVenueTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const description = watch('description', '');
  const wordCount = description ? description.trim().split(/\s+/).filter(Boolean).length : 0;

  // Fetch venue types from API
  useEffect(() => {
    fetchVenueTypes();
  }, []);

  const fetchVenueTypes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venue-types`);
      const data = await response.json();
      if (data.success && Array.isArray(data.venueTypes)) {
        setApiVenueTypes(data.venueTypes.map((t) => t.name));
      }
    } catch (error) {
      console.error('Error fetching venue types:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Combine default categories, API categories, and currently selected ones (deduplicated)
  const availableCategories = Array.from(new Set([
    ...DEFAULT_VENUE_CATEGORIES,
    ...apiVenueTypes,
    ...selectedVenueTypes
  ]));

  const toggleVenueType = (type) => {
    setSelectedVenueTypes((prev) => {
      const exists = prev.includes(type);
      const updated = exists ? prev.filter((t) => t !== type) : [...prev, type];
      if (updated.length > 0) setVenueTypeError(false);
      return updated;
    });
  };

  const onSubmit = (data) => {
    if (selectedVenueTypes.length === 0) {
      setVenueTypeError(true);
      toast.error('Please select at least 1 Venue Type / Category');
      return;
    }
    if (wordCount > 200) {
      toast.error('Description must be 200 words or less');
      return;
    }
    
    setFormData({ basicInfo: { ...data, venueType: selectedVenueTypes } });
    setStep(2);
    toast.success('Step 1 completed! 🎉');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-slide-up">
      {/* Row 1: Business Name */}
      <div className="form-group">
        <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
          <Building2 className="w-4 h-4 mr-2 text-primary-500" />
          Business / Venue Name *
        </label>
        <input
          type="text"
          {...register('businessName', { required: 'Business name is required' })}
          className="input-field"
          placeholder="Elite Conference Center"
        />
        {errors.businessName && (
          <p className="text-error text-sm mt-1 flex items-center">
            <span className="mr-1">⚠️</span> {errors.businessName.message}
          </p>
        )}
      </div>

      {/* Row 2: Venue Types / Categories (Multi-select) */}
      <div className="form-group">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center text-sm font-semibold text-dark-700">
            <Building2 className="w-4 h-4 mr-2 text-primary-500" />
            Venue Types / Categories * <span className="text-xs text-gray-500 ml-1.5 font-normal">(Select all that apply)</span>
          </label>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            selectedVenueTypes.length > 0
              ? 'bg-primary-50 text-primary-700 border border-primary-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {selectedVenueTypes.length} Selected
          </span>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((type) => {
              const isSelected = selectedVenueTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleVenueType(type)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-primary-600 border-primary-600 text-white shadow-xs scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'border border-gray-400 text-transparent'
                  }`}>
                    ✓
                  </span>
                  {type}
                </button>
              );
            })}
          </div>
        </div>
        {venueTypeError && (
          <p className="text-error text-sm mt-1.5 flex items-center">
            <span className="mr-1">⚠️</span> Please select at least one venue type / category
          </p>
        )}
      </div>

      {/* Row 2: Food Type | Maximum Capacity | Total Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Food Type */}
        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <UtensilsCrossed className="w-4 h-4 mr-2 text-primary-500" />
            Food Type *
          </label>
          <select
            {...register('foodType', { required: 'Food type is required' })}
            className="input-field"
          >
            <option value="Veg">Veg</option>
            <option value="Non Veg">Non Veg</option>
            <option value="Both">Both</option>
          </select>
          {errors.foodType && (
            <p className="text-error text-sm mt-1 flex items-center">
              <span className="mr-1">!</span> {errors.foodType.message}
            </p>
          )}
        </div>

        {/* Maximum Capacity */}
        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <Users className="w-4 h-4 mr-2 text-primary-500" />
            Maximum Capacity *
          </label>
          <select
            {...register('capacity', { required: 'Capacity is required' })}
            className="input-field"
          >
            <option value="">Select capacity range</option>
            {capacityOptions.map((option) => (
              <option key={option} value={option}>{option} persons</option>
            ))}
          </select>
          {errors.capacity && (
            <p className="text-error text-sm mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {errors.capacity.message}
            </p>
          )}
        </div>

        {/* Total Area */}
        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <Maximize2 className="w-4 h-4 mr-2 text-primary-500" />
            Total Area (sq.ft) *
          </label>
          <input
            type="number"
            {...register('areaSqft', { 
              required: 'Area is required',
              min: { value: 1, message: 'Area must be greater than 0' }
            })}
            className="input-field"
            placeholder="1000"
          />
          {errors.areaSqft && (
            <p className="text-error text-sm mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {errors.areaSqft.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Venue Description (Full Width) */}
      <div className="form-group">
        <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
          <FileText className="w-4 h-4 mr-2 text-primary-500" />
          Venue Description (Max 200 words) *
        </label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          rows={5}
          className="input-field resize-none"
          placeholder="Modern conference space with premium amenities, perfect for corporate meetings and events..."
        />
        <div className="flex justify-between items-center mt-2">
          <p className={`text-sm ${wordCount > 200 ? 'text-error' : 'text-dark-500'}`}>
            {wordCount}/200 words
          </p>
          {wordCount > 200 && (
            <span className="text-error text-sm">⚠️ Exceeds limit</span>
          )}
        </div>
        {errors.description && (
          <p className="text-error text-sm mt-1 flex items-center">
            <span className="mr-1">⚠️</span> {errors.description.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
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

