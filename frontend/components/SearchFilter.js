'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Users, Calendar, ChevronDown, Grid3x3 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function SearchFilter() {
  const router = useRouter();
  const [locations, setLocations] = useState({ cities: [], locations: [] });
  const [venueTypes, setVenueTypes] = useState([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [personsInput, setPersonsInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedVenueType, setSelectedVenueType] = useState('');

  useEffect(() => {
    fetchLocations();
    fetchVenueTypes();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/locations/all`);
      const data = await response.json();
      if (data.success) {
        setLocations(data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

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

  // Location autocomplete
  const handleLocationInput = (value) => {
    setLocationInput(value);
    if (value.length > 0) {
      const allLocations = [
        ...locations.cities,
        ...locations.locations.flatMap(loc => loc.areas.map(area => `${area}, ${loc.city}`))
      ];
      const filtered = allLocations.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setLocationSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectLocation = (location) => {
    setLocationInput(location);
    setSelectedLocation(location);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedLocation) params.append('location', selectedLocation);
    if (personsInput) params.append('capacity', personsInput);
    if (selectedDate) params.append('date', selectedDate.toISOString().split('T')[0]);
    if (selectedVenueType) params.append('type', selectedVenueType);
    
    router.push(`/venues?${params.toString()}`);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59F0A]" />
          <input
            type="text"
            placeholder="Search venue name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Location Input with Autocomplete */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59F0A] z-10" />
          <input
            type="text"
            placeholder="Location (Bhopal, etc.)"
            value={locationInput}
            onChange={(e) => handleLocationInput(e.target.value)}
            onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all"
          />
          {showSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {locationSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => selectLocation(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Persons Input */}
        <div className="relative">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59F0A]" />
          <input
            type="number"
            placeholder="Persons"
            value={personsInput}
            onChange={(e) => setPersonsInput(e.target.value)}
            min="1"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Date Picker */}
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59F0A] z-10 pointer-events-none" />
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            minDate={new Date()}
            placeholderText="Select Date"
            dateFormat="dd/MM/yyyy"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all cursor-pointer"
            calendarClassName="custom-calendar"
          />
        </div>

        {/* Venue Type Dropdown */}
        <div className="relative">
          <Grid3x3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59F0A] z-10 pointer-events-none" />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
          <select
            value={selectedVenueType}
            onChange={(e) => setSelectedVenueType(e.target.value)}
            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
          >
            <option value="">Venue Type</option>
            {venueTypes.map(type => (
              <option key={type._id} value={type.name}>{type.icon} {type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSearch}
          className="bg-[#F59F0A] hover:bg-[#D97706] text-white font-semibold px-12 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
        >
          Search
        </button>
      </div>

      {/* Popular Cities */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-center text-sm font-semibold text-gray-700 mb-4">
          POPULAR CITIES
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {locations.cities.slice(0, 7).map((city) => (
            <button
              key={city}
              onClick={() => {
                setLocationInput(city);
                setSelectedLocation(city);
                handleSearch();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{city}</span>
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
