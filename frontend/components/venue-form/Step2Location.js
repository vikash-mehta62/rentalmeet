'use client';

import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { MapPin, Navigation, Building, Map, ParkingCircle, Bus, Train } from 'lucide-react';

const parkingOptions = ['Free', 'Paid', 'Limited', 'None'];

export default function Step2Location() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: formData.location
  });

  const onSubmit = (data) => {
    setFormData({ location: data });
    setStep(3);
    toast.success('Location details saved! 🎉');
  };

  const goBack = () => {
    setStep(1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-slide-up">
      {/* Complete Address */}
      <div className="form-group">
        <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
          <Building className="w-4 h-4 mr-2 text-primary-500" />
          Complete Address *
        </label>
        <textarea
          {...register('address', { required: 'Address is required' })}
          rows={3}
          className="input-field resize-none"
          placeholder="Floor 3, Skyline Tower, MP Nagar"
        />
        {errors.address && (
          <p className="text-error text-sm mt-1 flex items-center">
            <span className="mr-1">⚠️</span> {errors.address.message}
          </p>
        )}
      </div>

      {/* Landmark */}
      <div className="form-group">
        <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
          <Navigation className="w-4 h-4 mr-2 text-primary-500" />
          Landmark *
        </label>
        <input
          type="text"
          {...register('landmark', { required: 'Landmark is required' })}
          className="input-field"
          placeholder="Near DB City Mall"
        />
        {errors.landmark && (
          <p className="text-error text-sm mt-1 flex items-center">
            <span className="mr-1">⚠️</span> {errors.landmark.message}
          </p>
        )}
      </div>

      {/* City and Area */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <MapPin className="w-4 h-4 mr-2 text-primary-500" />
            City *
          </label>
          <input
            type="text"
            {...register('city', { required: 'City is required' })}
            className="input-field"
            placeholder="Bhopal"
          />
          {errors.city && (
            <p className="text-error text-sm mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {errors.city.message}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <Map className="w-4 h-4 mr-2 text-primary-500" />
            Area/Locality *
          </label>
          <input
            type="text"
            {...register('area', { required: 'Area is required' })}
            className="input-field"
            placeholder="MP Nagar, Arera Colony"
          />
          {errors.area && (
            <p className="text-error text-sm mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {errors.area.message}
            </p>
          )}
        </div>
      </div>

      {/* Pincode */}
      <div className="form-group">
        <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
          <MapPin className="w-4 h-4 mr-2 text-primary-500" />
          Pincode *
        </label>
        <input
          type="text"
          {...register('pincode', { 
            required: 'Pincode is required',
            pattern: {
              value: /^[0-9]{6}$/,
              message: 'Enter valid 6-digit pincode'
            }
          })}
          className="input-field"
          placeholder="462001"
          maxLength={6}
        />
        {errors.pincode && (
          <p className="text-error text-sm mt-1 flex items-center">
            <span className="mr-1">⚠️</span> {errors.pincode.message}
          </p>
        )}
      </div>

      {/* Google Maps Link */}
      <div className="form-group">
        <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
          <Map className="w-4 h-4 mr-2 text-primary-500" />
          Google Maps Link *
        </label>
        <input
          type="url"
          {...register('googleMapLink', { required: 'Google Maps link is required' })}
          className="input-field"
          placeholder="https://maps.google.com/..."
        />
        <p className="text-xs text-dark-500 mt-1">
          Open Google Maps → Share → Copy link
        </p>
        {errors.googleMapLink && (
          <p className="text-error text-sm mt-1 flex items-center">
            <span className="mr-1">⚠️</span> {errors.googleMapLink.message}
          </p>
        )}
      </div>

      {/* Parking */}
      <div className="form-group">
        <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
          <ParkingCircle className="w-4 h-4 mr-2 text-primary-500" />
          Parking Availability *
        </label>
        <select
          {...register('parkingAvailability', { required: 'Select parking option' })}
          className="input-field"
        >
          <option value="">Select parking type</option>
          {parkingOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {errors.parkingAvailability && (
          <p className="text-error text-sm mt-1 flex items-center">
            <span className="mr-1">⚠️</span> {errors.parkingAvailability.message}
          </p>
        )}
      </div>

      {/* Public Transport */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <Bus className="w-4 h-4 mr-2 text-primary-500" />
            Nearest Bus/Auto Stand
          </label>
          <input
            type="text"
            {...register('nearestBusAuto')}
            className="input-field"
            placeholder="MP Nagar Bus Stand - 500m"
          />
        </div>

        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <Train className="w-4 h-4 mr-2 text-primary-500" />
            Nearest Metro/Train Station
          </label>
          <input
            type="text"
            {...register('nearestMetroTrain')}
            className="input-field"
            placeholder="MP Nagar Metro - 500m"
          />
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
