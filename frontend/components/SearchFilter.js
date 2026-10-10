'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Users, Calendar, ChevronDown, MapPin, Loader2,
  Building2, Briefcase, Presentation, Landmark, PartyPopper,
  TreePine, BedDouble, Utensils, Laptop, Home, BookOpen,
  Flower2, Sparkles, X
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import CityAutocomplete from './CityAutocomplete';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

// ── 12 Specific Categories with matching Replit color palettes ──────────────
const CATEGORY_ITEMS = [
  { id: 'Meeting Hall', label: 'Meeting Hall', icon: Briefcase, bg: '#E3F2FD', iconColor: '#1565C0', border: '#90CAF9' },
  { id: 'Conference Hall', label: 'Conference Hall', icon: Presentation, bg: '#F3E5F5', iconColor: '#6A1B9A', border: '#CE93D8' },
  { id: 'Auditorium', label: 'Auditoriums', icon: Landmark, bg: '#FFEBEE', iconColor: '#B71C1C', border: '#EF9A9A' },
  { id: 'Banquet Hall', label: 'Banquet Hall', icon: PartyPopper, bg: '#FFF3E0', iconColor: '#E65100', border: '#FFB74D' },
  { id: 'Farm House', label: 'Farm House', icon: TreePine, bg: '#E8F5E9', iconColor: '#2E7D32', border: '#A5D6A7' },
  { id: 'Hotel', label: 'Hotel', icon: BedDouble, bg: '#FFFDE7', iconColor: '#F57F17', border: '#FFF176' },
  { id: 'Restaurant', label: 'Restaurant', icon: Utensils, bg: '#FFF3E0', iconColor: '#E65100', border: '#FFCC80' },
  { id: 'Co-Work Space', label: 'Co-Work Space', icon: Laptop, bg: '#E0F7FA', iconColor: '#00695C', border: '#80DEEA' },
  { id: 'Guest House', label: 'Guest House', icon: Home, bg: '#FCE4EC', iconColor: '#C2185B', border: '#F48FB1' },
  { id: 'Training Center', label: 'Training Center', icon: BookOpen, bg: '#E8EAF6', iconColor: '#283593', border: '#9FA8DA' },
  { id: 'Marriage Garden', label: 'Marriage Garden', icon: Flower2, bg: '#F1F8E9', iconColor: '#558B2F', border: '#C5E1A5' },
  { id: 'Play Zone', label: 'Play Zones', icon: Sparkles, bg: '#EDE7F6', iconColor: '#4527A0', border: '#B39DDB' },
];

const POPULAR_CITIES = [
  'Bhopal',
  'Indore',
  'Jabalpur',
  'Gwalior',
  'Ujjain',
  'Khajuraho',
  'Chhindwara'
];

export default function SearchFilter() {
  const router = useRouter();
  const [venueTypes, setVenueTypes] = useState([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [personsInput, setPersonsInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedVenueType, setSelectedVenueType] = useState('');
  const [selectedFoodType, setSelectedFoodType] = useState('');
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
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (cityInput.trim()) {
      const cleanCity = cityInput.trim().split(',')[0].trim();
      params.append('location', cleanCity);
      params.append('city', cleanCity);
    }
    if (selectedVenueType) params.append('type', selectedVenueType);
    if (selectedFoodType) params.append('foodType', selectedFoodType);
    if (personsInput) params.append('capacity', personsInput);
    if (selectedDate) params.append('date', selectedDate.toISOString().split('T')[0]);

    router.push(`/venues?${params.toString()}`);
  };

  const handleCityClick = (city) => {
    setCityInput(city);
    const params = new URLSearchParams();
    params.append('location', city);
    params.append('city', city);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedVenueType) params.append('type', selectedVenueType);
    if (selectedFoodType) params.append('foodType', selectedFoodType);
    if (personsInput) params.append('capacity', personsInput);
    if (selectedDate) params.append('date', selectedDate.toISOString().split('T')[0]);
    router.push(`/venues?${params.toString()}`);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-xl p-4 sm:p-5 md:p-6 border border-slate-100 dark:border-slate-800 transition-all">
      
      {/* ── 1. TOP 13 CATEGORY BUTTONS ─────────────────────────────────── */}
      <div className="mb-4 sm:mb-5 overflow-x-auto pb-1 scrollbar-none">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: 'repeat(13, minmax(74px, 1fr))',
            minWidth: '1020px'
          }}
        >
          {/* All Venues Button */}
          <button
            type="button"
            onClick={() => setSelectedVenueType('')}
            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all cursor-pointer ${
              selectedVenueType === ''
                ? 'border-[#F59F0A] bg-[#F59F0A] text-white shadow-md scale-102 ring-2 ring-[#F59F0A]/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#F59F0A]/60'
            }`}
          >
            <Building2 className="h-5 w-5" />
            <span className="text-[11px] font-bold leading-tight text-center">
              All Venues
            </span>
          </button>

          {/* 12 Specific Category Buttons */}
          {CATEGORY_ITEMS.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedVenueType === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedVenueType(isSelected ? '' : cat.id)}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected ? 'scale-102 shadow-md' : 'hover:brightness-95'
                }`}
                style={{
                  backgroundColor: isSelected ? cat.iconColor : cat.bg,
                  borderColor: isSelected ? cat.iconColor : cat.border,
                  color: isSelected ? '#ffffff' : cat.iconColor
                }}
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-[11px] font-bold leading-tight text-center">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. UNIFIED SEARCH INPUT BAR ─────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-2 sm:p-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-2 items-center">
          
          {/* 1. Venue Name Search */}
          <div className="lg:col-span-2 flex items-center h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Search className="mr-2 h-4 w-4 flex-shrink-0 text-[#F59F0A]" />
            <input
              type="text"
              placeholder="Search venue name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 2. Location (City / Area) */}
          <div className="lg:col-span-2 flex items-center h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative">
            <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-[#F59F0A]" />
            <input
              type="text"
              placeholder="Location (Bhopal, Indore...)"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none pr-5"
            />
            <button
              type="button"
              onClick={detectCurrentLocation}
              disabled={detectingLocation}
              title="Detect Current Location"
              className="text-[#F59F0A] hover:text-[#D97706] disabled:opacity-50"
            >
              {detectingLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* 3. Venue Type Select */}
          <div className="lg:col-span-2 flex items-center h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Building2 className="mr-2 h-4 w-4 flex-shrink-0 text-[#F59F0A]" />
            <select
              value={selectedVenueType}
              onChange={(e) => setSelectedVenueType(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-slate-900">All Venue Types</option>
              {CATEGORY_ITEMS.map((cat) => (
                <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Food Type Select */}
          <div className="lg:col-span-2 flex items-center h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Utensils className="mr-2 h-4 w-4 flex-shrink-0 text-[#F59F0A]" />
            <select
              value={selectedFoodType}
              onChange={(e) => setSelectedFoodType(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-slate-900">All Food Types</option>
              <option value="Veg" className="dark:bg-slate-900">Veg</option>
              <option value="Non-Veg" className="dark:bg-slate-900">Non-Veg</option>
              <option value="Both" className="dark:bg-slate-900">Both</option>
            </select>
          </div>

          {/* 5. Persons Input */}
          <div className="lg:col-span-1 flex items-center h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Users className="mr-1.5 h-4 w-4 flex-shrink-0 text-[#F59F0A]" />
            <input
              type="number"
              min="1"
              placeholder="Persons"
              value={personsInput}
              onChange={(e) => setPersonsInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* 6. Date Picker */}
          <div className="lg:col-span-2 flex items-center h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0 text-[#F59F0A] pointer-events-none" />
            <DatePicker
              selected={selectedDate}
              onChange={(d) => setSelectedDate(d)}
              minDate={new Date()}
              placeholderText="Select Date"
              dateFormat="dd/MM/yyyy"
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            />
          </div>

          {/* 7. Search Button */}
          <div className="lg:col-span-1 flex items-center">
            <button
              type="button"
              onClick={handleSearch}
              className="w-full h-10 bg-[#F59F0A] hover:bg-[#D97706] text-white font-bold rounded-lg transition-all duration-300 text-xs shadow-md flex items-center justify-center cursor-pointer"
            >
              Search
            </button>
          </div>

        </div>
      </div>

      {/* ── 3. POPULAR CITIES ROW ───────────────────────────────────────── */}
      <div className="mt-4 flex flex-col items-center justify-center gap-2">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          POPULAR CITIES
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleCityClick(city)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#F59F0A] hover:text-[#F59F0A] transition-all cursor-pointer shadow-2xs"
            >
              <MapPin className="h-3 w-3 text-slate-400" />
              <span>{city}</span>
            </button>
          ))}
        </div>
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
