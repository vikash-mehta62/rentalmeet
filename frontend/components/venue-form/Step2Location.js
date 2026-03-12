'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { MapPin, Navigation, Building, Map, ParkingCircle, Bus, Train, Locate } from 'lucide-react';

const parkingOptions = ['Free', 'Paid', 'Limited', 'None'];

export default function Step2Location() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: formData.location
  });
  const [loadingLocation, setLoadingLocation] = useState(false);

  const onSubmit = (data) => {
    setFormData({ location: data });
    setStep(3);
    toast.success('Location details saved! 🎉');
  };

  const goBack = () => {
    setStep(1);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setValue('googleMapLink', mapsLink);
        setLoadingLocation(false);
        toast.success('Location captured! 📍');
      },
      (error) => {
        setLoadingLocation(false);
        toast.error('Unable to get your location. Please enter manually.');
        console.error('Geolocation error:', error);
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-slide-up">
      {/* 1. Complete Address (Full Width) */}
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

      {/* 2. Landmark | State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="form-group">
          <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
            <MapPin className="w-4 h-4 mr-2 text-primary-500" />
            State *
          </label>
          <input
            type="text"
            {...register('state', { required: 'State is required' })}
            className="input-field"
            placeholder="Madhya Pradesh"
          />
          {errors.state && (
            <p className="text-error text-sm mt-1 flex items-center">
              <span className="mr-1">⚠️</span> {errors.state.message}
            </p>
          )}
        </div>
      </div>

      {/* 3. City | Village */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            Village <span className="text-dark-400 ml-1">(Optional)</span>
          </label>
          <input
            type="text"
            {...register('village')}
            className="input-field"
            placeholder="Village name (if applicable)"
          />
        </div>
      </div>

      {/* 4. Area/Locality | Pincode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* 5. Google Maps Link with Current Location Button */}
      <div className="form-group">
        <label className="flex items-center text-sm font-semibold text-dark-700 mb-2">
          <Map className="w-4 h-4 mr-2 text-primary-500" />
          Google Maps Link *
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            {...register('googleMapLink', { required: 'Google Maps link is required' })}
            className="input-field flex-1"
            placeholder="https://maps.google.com/..."
          />
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={loadingLocation}
            className="btn-secondary flex items-center whitespace-nowrap px-4"
          >
            <Locate className={`w-4 h-4 mr-2 ${loadingLocation ? 'animate-spin' : ''}`} />
            {loadingLocation ? 'Getting...' : 'Use My Location'}
          </button>
        </div>
        <p className="text-xs text-dark-500 mt-1">
          Open Google Maps → Share → Copy link, or click "Use My Location"
        </p>
        {errors.googleMapLink && (
          <p className="text-error text-sm mt-1 flex items-center">
            <span className="mr-1">⚠️</span> {errors.googleMapLink.message}
          </p>
        )}
      </div>

      {/* 6. Parking Availability (Full Width) */}
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

      {/* 7. Nearest Bus/Auto Stand | Nearest Metro/Train Station */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <p className="text-xs text-dark-500 mt-1">
            Include distance (e.g., "Bus Stand - 500m")
          </p>
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
            placeholder="MP Nagar Metro - 1.2km"
          />
          <p className="text-xs text-dark-500 mt-1">
            Include distance (e.g., "Metro Station - 1.2km")
          </p>
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
