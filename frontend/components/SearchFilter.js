'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Calendar, ChevronDown, Grid3x3, MapPin, Loader2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import CityAutocomplete from './CityAutocomplete';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

export default function SearchFilter() {
  const router = useRouter();
  const [venueTypes, setVenueTypes] = useState([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [personsInput, setPersonsInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedVenueType, setSelectedVenueType] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

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
    }
  };

  // Get city name from coordinates using reverse geocoding
  const getCityFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        // Find city from address components
        for (const result of data.results) {
          for (const component of result.address_components) {
            if (component.types.includes('locality')) {
              return component.long_name;
            }
          }
        }
        // Fallback to first result's formatted address
        return data.results[0].formatted_address.split(',')[0];
      }
      return null;
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      return null;
    }
  };

  // Get location from IP address (fallback)
  const getLocationFromIP = async () => {
    try {
      // Using ipapi.co for IP-based location (free, no API key needed)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.city) {
        return data.city;
      }
      return null;
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return null;
    }
  };

  // Detect current location
  const detectCurrentLocation = async () => {
    setDetectingLocation(true);
    
    try {
      // Check if Geolocation API is available
      if ('geolocation' in navigator) {
        // Try GPS first
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const city = await getCityFromCoordinates(latitude, longitude);
            
            if (city) {
              setCityInput(city);
              toast.success(`Location detected: ${city}`);
            } else {
              // Fallback to IP-based location
              const ipCity = await getLocationFromIP();
              if (ipCity) {
                setCityInput(ipCity);
                toast.success(`Location detected: ${ipCity}`);
              } else {
                toast.error('Could not detect location');
              }
            }
            setDetectingLocation(false);
          },
          async (error) => {
            console.error('GPS error:', error);
            
            // GPS failed, try IP-based location
            const ipCity = await getLocationFromIP();
            if (ipCity) {
              setCityInput(ipCity);
              toast.success(`Location detected: ${ipCity}`);
            } else {
              toast.error('Could not detect location. Please enter manually.');
            }
            setDetectingLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        // Geolocation not available, use IP-based location
        const ipCity = await getLocationFromIP();
        if (ipCity) {
          setCityInput(ipCity);
          toast.success(`Location detected: ${ipCity}`);
        } else {
          toast.error('Location detection not available');
        }
        setDetectingLocation(false);
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      toast.error('Failed to detect location');
      setDetectingLocation(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (cityInput) params.append('location', cityInput);
    if (personsInput) params.append('capacity', personsInput);
    if (selectedDate) params.append('date', selectedDate.toISOString().split('T')[0]);
    if (selectedVenueType) params.append('type', selectedVenueType);
    
    router.push(`/venues?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl p-4 border border-transparent dark:border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F59F0A]" />
          <input
            type="text"
            placeholder="Search venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        {/* City Input */}
        <div className="relative">
          <CityAutocomplete
            value={cityInput}
            onChange={setCityInput}
            placeholder="Search city..."
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <button
            onClick={detectCurrentLocation}
            disabled={detectingLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#F59F0A] hover:text-[#D97706] transition-colors disabled:opacity-50"
            title="Detect current location"
          >
            {detectingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </button>
          
          {/* Around Me Button */}
          <button
            onClick={async () => {
              setDetectingLocation(true);
              try {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude } = position.coords;
                      const city = await getCityFromCoordinates(latitude, longitude);
                      if (city) {
                        setCityInput(city);
                        toast.success(`Searching venues around ${city}`);
                        const params = new URLSearchParams();
                        if (searchQuery) params.append('search', searchQuery);
                        params.append('location', city);
                        if (personsInput) params.append('capacity', personsInput);
                        if (selectedDate) params.append('date', selectedDate.toISOString().split('T')[0]);
                        if (selectedVenueType) params.append('type', selectedVenueType);
                        router.push(`/venues?${params.toString()}`);
                      } else {
                        const ipCity = await getLocationFromIP();
                        if (ipCity) { setCityInput(ipCity); toast.success(`Searching venues around ${ipCity}`); }
                        else toast.error('Could not detect location');
                      }
                      setDetectingLocation(false);
                    },
                    async () => {
                      const ipCity = await getLocationFromIP();
                      if (ipCity) { setCityInput(ipCity); toast.success(`Searching venues around ${ipCity}`); }
                      else toast.error('Could not detect location');
                      setDetectingLocation(false);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                } else {
                  const ipCity = await getLocationFromIP();
                  if (ipCity) { setCityInput(ipCity); toast.success(`Searching venues around ${ipCity}`); }
                  else toast.error('Location detection not available');
                  setDetectingLocation(false);
                }
              } catch { toast.error('Failed to detect location'); setDetectingLocation(false); }
            }}
            disabled={detectingLocation}
            className="absolute -bottom-6 left-0 text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-2 py-0.5 rounded transition-all flex items-center gap-1 disabled:opacity-50"
          >
            {detectingLocation ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /><span>Detecting...</span></> : <><MapPin className="w-2.5 h-2.5" /><span>Around Me</span></>}
          </button>
        </div>

        {/* Persons Input */}
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F59F0A]" />
          <input
            type="number"
            placeholder="Persons"
            value={personsInput}
            onChange={(e) => setPersonsInput(e.target.value)}
            min="1"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Date Picker */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F59F0A] z-10 pointer-events-none" />
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            minDate={new Date()}
            placeholderText="Select Date"
            dateFormat="dd/MM/yyyy"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all cursor-pointer bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            calendarClassName="custom-calendar"
          />
        </div>

        {/* Venue Type */}
        <div className="relative">
          <Grid3x3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F59F0A] z-10 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 z-10 pointer-events-none" />
          <select
            value={selectedVenueType}
            onChange={(e) => setSelectedVenueType(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all appearance-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            <option value="">Venue Type</option>
            {venueTypes.map(type => (
              <option key={type._id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex justify-center mt-5">
        <button
          onClick={handleSearch}
          className="bg-[#F59F0A] hover:bg-[#D97706] text-white font-semibold px-10 py-2 rounded-lg transition-all duration-300 text-sm"
        >
          Search
        </button>
      </div>

      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .react-datepicker__header {
          background-color: #F59F0A;
          border-bottom: none;
          border-radius: 12px 12px 0 0;
          padding: 16px 0;
        }
        
        .react-datepicker__current-month {
          color: white;
          font-weight: 600;
          font-size: 16px;
        }
        
        .react-datepicker__day-name {
          color: white;
          font-weight: 500;
          width: 40px;
          line-height: 40px;
        }
        
        .react-datepicker__day {
          width: 40px;
          line-height: 40px;
          margin: 4px;
          border-radius: 8px;
          color: #374151;
          font-weight: 500;
        }
        
        .react-datepicker__day:hover {
          background-color: #FEF3C7;
          color: #92400E;
        }
        
        .react-datepicker__day--selected {
          background-color: #F59F0A;
          color: white;
          font-weight: 600;
        }
        
        .react-datepicker__day--keyboard-selected {
          background-color: #FCD34D;
          color: #92400E;
        }
        
        .react-datepicker__day--today {
          font-weight: 700;
          color: #F59F0A;
        }
        
        .react-datepicker__day--disabled {
          color: #d1d5db;
          cursor: not-allowed;
        }
        
        .react-datepicker__day--disabled:hover {
          background-color: transparent;
        }
        
        .react-datepicker__navigation {
          top: 18px;
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: white;
          border-width: 2px 2px 0 0;
        }
        
        .react-datepicker__month {
          margin: 16px;
        }
        
        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
    </div>
  );
}
