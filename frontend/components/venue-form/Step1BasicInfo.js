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

      {/* Venue Type */}
      <div className="form-group">
        <label className="block text-sm font-semibold text-dark-700 mb-3">
          Venue Type (Select all that apply) *
        </label>
        {loadingTypes ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading venue types...</span>
          </div>
        ) : venueTypes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {venueTypes.map((type) => (
              <label key={type._id} className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  value={type.name}
                  {...register('venueType', { required: 'Select at least one venue type' })}
                  className="w-5 h-5 rounded border-dark-200 text-primary-500 focus:ring-primary-500 focus:ring-2 transition-all"
                />
                <span className="text-sm text-dark-700 group-hover:text-primary-500 transition-colors flex items-center gap-1">
                  {type.icon} {type.name}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">No venue types available. Please contact admin.</p>
          </div>
        )}
        {errors.venueType && (
          <p className="text-error text-sm mt-2 flex items-center">
            <span className="mr-1">⚠️</span> {errors.venueType.message}
          </p>
        )}
      </div>

      {/* Description */}
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

      {/* Capacity */}
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

      {/* Area */}
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

