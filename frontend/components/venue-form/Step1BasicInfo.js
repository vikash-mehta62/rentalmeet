'use client';

import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Building2, Users, FileText, Maximize2 } from 'lucide-react';

const capacityOptions = [
  '10-20', '20-30', '30-40', '40-50', '50-100', '100-200', '200-300',
  '300-400', '400-500', '500-600', '600-700', '700-800', '800-1000',
  '1000-1500', '1500-2000', 'More than 2000'
];

export default function Step1BasicInfo() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: formData.basicInfo
  });
  const [venueTypes, setVenueTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const description = watch('description', '');
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

  // Fetch venue types from API
  useEffect(() => {
    fetchVenueTypes();
  }, []);

  const fetchVenueTypes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venue-types`);
      const data = await response.json();
      if (data.success) {
        setVenueTypes(data.venueTypes);
      }
    } catch (error) {
      console.error('Error fetching venue types:', error);
      toast.error('Failed to load venue types');
    } finally {
      setLoadingTypes(false);
    }
  };

  const onSubmit = (data) => {
    if (wordCount > 200) {
      toast.error('Description must be 200 words or less');
      return;
    }
    
    setFormData({ basicInfo: data });
    setStep(2);
    toast.success('Step 1 completed! 🎉');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-slide-up">
      {/* Row 1: Business Name | Venue Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Business Name */}
        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <Building2 className="w-4 h-4 mr-2 text-primary-500" />
            Business/Venue Name *
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

        {/* Venue Type - Single Select Dropdown */}
        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <Building2 className="w-4 h-4 mr-2 text-primary-500" />
            Venue Type *
          </label>
          {loadingTypes ? (
            <div className="flex items-center py-3 px-4 bg-gray-50 rounded-lg">
              <div className="w-5 h-5 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600 text-sm">Loading...</span>
            </div>
          ) : (
            <select
              {...register('venueType', { required: 'Venue type is required' })}
              className="input-field"
            >
              <option value="">Select venue type</option>
              {venueTypes.map((type) => (
                <option key={type._id} value={type.name}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
          )}
          {errors.venueType && (
            <p className="text-error text-sm mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {errors.venueType.message}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Maximum Capacity | Total Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

