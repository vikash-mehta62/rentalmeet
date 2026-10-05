'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { MapPin, Navigation, Building, Map, ParkingCircle, Bus, Train, Locate } from 'lucide-react';
import StateCitySelect from '@/components/vendor/StateCitySelect';

const parkingOptions = ['Free', 'Paid', 'Limited', 'None'];

export default function Step2Location() {
  const { formData, setFormData, setStep } = useVenueFormStore();

  // Initialize state/city from saved formData
  const savedLocation = formData.location || {};
  const [selectedState, setSelectedState] = useState(
    savedLocation.state
      ? { label: savedLocation.state, value: savedLocation.stateCode || savedLocation.state, name: savedLocation.state }
      : null
  );
  const [selectedCity, setSelectedCity] = useState(
    savedLocation.city
      ? { label: savedLocation.city, value: savedLocation.city, name: savedLocation.city }
      : null
  );

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: savedLocation
  });

  const [loadingLocation, setLoadingLocation] = useState(false);

  const onSubmit = (data) => {
    if (!selectedState) { toast.error('State is required'); return; }
    if (!selectedCity) { toast.error('City is required'); return; }

    setFormData({
      location: {
        ...data,
        state: selectedState.name,
        stateCode: selectedState.value,
        city: selectedCity.name,
        parkingDetails: {
          type: data.parkingAvailability,
          carsCapacity: Number(data.parkingCarsCapacity || data.parkingDetails?.carsCapacity || 0),
          twoWheelerCapacity: Number(data.parkingTwoWheelerCapacity || data.parkingDetails?.twoWheelerCapacity || 0),
          carCharges: Number(data.parkingCarCharges || data.parkingDetails?.carCharges || 0),
          twoWheelerCharges: Number(data.parkingTwoWheelerCharges || data.parkingDetails?.twoWheelerCharges || 0)
        }
      }
    });
    setStep(3);
    toast.success('Location details saved! 🎉');
  };

  const goBack = () => setStep(1);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValue('googleMapLink', `https://www.google.com/maps?q=${latitude},${longitude}`);
        setLoadingLocation(false);
        toast.success('Location captured! 📍');
      },
      () => {
        setLoadingLocation(false);
        toast.error('Unable to get your location. Please enter manually.');
      }
    );
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

      {/* State & City Dropdowns */}
      <div className="form-group">
        <StateCitySelect
          state={selectedState}
          city={selectedCity}
          onStateChange={(v) => { setSelectedState(v); setSelectedCity(null); }}
          onCityChange={(v) => setSelectedCity(v)}
          required={true}
          inline={true}
        />
      </div>

      {/* Village | Area/Locality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            pattern: { value: /^[0-9]{6}$/, message: 'Enter valid 6-digit pincode' }
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

      {/* Parking Availability */}
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

        {/* Dynamic Parking Details */}
        {(watch('parkingAvailability') === 'Free' || watch('parkingAvailability') === 'Limited') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">No. of Cars</label>
              <input
                type="number"
                min={0}
                {...register('parkingCarsCapacity')}
                defaultValue={savedLocation.parkingDetails?.carsCapacity || ''}
                placeholder="Ex. 25"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">No. of Two Wheeler</label>
              <input
                type="number"
                min={0}
                {...register('parkingTwoWheelerCapacity')}
                defaultValue={savedLocation.parkingDetails?.twoWheelerCapacity || ''}
                placeholder="Ex. 60"
                className="input-field text-sm"
              />
            </div>
          </div>
        )}

        {watch('parkingAvailability') === 'Paid' && (
          <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Car Charges (₹)</label>
                <input
                  type="number"
                  min={0}
                  {...register('parkingCarCharges')}
                  defaultValue={savedLocation.parkingDetails?.carCharges || ''}
                  placeholder="Ex. 50"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Two Wheeler Charges (₹)</label>
                <input
                  type="number"
                  min={0}
                  {...register('parkingTwoWheelerCharges')}
                  defaultValue={savedLocation.parkingDetails?.twoWheelerCharges || ''}
                  placeholder="Ex. 20"
                  className="input-field text-sm"
                />
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
              <span className="font-bold">ℹ️ Note:</span>
              <span>Paid parking charges are payable directly at the venue during event. (Not charged online during customer booking).</span>
            </div>
          </div>
        )}
      </div>

      {/* Nearest Transport */}
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
            placeholder="MP Nagar Bus Stand - 0.5 KM"
          />
          <p className="text-xs text-dark-500 mt-1">Include distance (e.g., "Bus Stand - 0.5 KM")</p>
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
            placeholder="MP Nagar Metro - 1.2 KM"
          />
          <p className="text-xs text-dark-500 mt-1">Include distance (e.g., "Metro Station - 1.2 KM")</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <button type="button" onClick={goBack} className="btn-secondary flex items-center group">
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <button type="submit" className="btn-primary flex items-center group">
          Next Step
          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
