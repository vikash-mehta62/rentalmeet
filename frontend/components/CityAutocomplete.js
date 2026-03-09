'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

export default function CityAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search city...",
  className = ""
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Load Google Places API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const searchCities = async (input) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    try {
      if (window.google && window.google.maps) {
        const service = new window.google.maps.places.AutocompleteService();
        
        service.getPlacePredictions(
          {
            input: input,
            types: ['(cities)'],
            componentRestrictions: { country: 'in' } // Restrict to India
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              // Store both full description and city name
              const cities = predictions.map(prediction => ({
                fullName: prediction.description, // e.g., "Jabalpur, Madhya Pradesh, India"
                cityName: prediction.description.split(',')[0].trim() // e.g., "Jabalpur"
              }));
              setSuggestions(cities);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
            }
            setLoading(false);
          }
        );
      }
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Debounce API calls
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchCities(inputValue);
    }, 300);
  };

  const selectCity = (cityObj) => {
    onChange(cityObj.cityName); // Only save city name
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className={className}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((cityObj, index) => (
            <button
              key={index}
              onClick={() => selectCity(cityObj)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{cityObj.fullName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
