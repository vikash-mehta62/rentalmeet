'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Users, Calendar, ChevronDown } from 'lucide-react';

export default function SearchFilter() {
  const router = useRouter();
  const [locations, setLocations] = useState({ cities: [], locations: [] });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const capacityOptions = [
    { value: '10', label: '10-20 persons' },
    { value: '20', label: '20-50 persons' },
    { value: '50', label: '50-100 persons' },
    { value: '100', label: '100-200 persons' },
    { value: '200', label: '200-500 persons' },
    { value: '500', label: '500+ persons' }
  ];

  useEffect(() => {
    fetchLocations();
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

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedCity) params.append('city', selectedCity);
    if (selectedLocation) params.append('location', selectedLocation);
    if (selectedCapacity) params.append('capacity', selectedCapacity);
    if (selectedDate) params.append('date', selectedDate);
    
    router.push(`/venues?${params.toString()}`);
  };

  const getAreasForCity = () => {
    if (!selectedCity) return [];
    const cityData = locations.locations.find(loc => loc.city === selectedCity);
    return cityData ? cityData.areas : [];
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

        {/* Location Dropdown */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59F0A] z-10 pointer-events-none" />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedLocation('');
            }}
            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
          >
            <option value="">Location (Bhopal, etc.)</option>
            {locations.cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Persons Dropdown */}
        <div className="relative">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59F0A] z-10 pointer-events-none" />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
          <select
            value={selectedCapacity}
            onChange={(e) => setSelectedCapacity(e.target.value)}
            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
          >
            <option value="">Persons</option>
            {capacityOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Date Input */}
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59F0A] z-10 pointer-events-none" />
          <input
            type="date"
            placeholder="Select Date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59F0A] focus:border-transparent outline-none transition-all cursor-pointer"
          />
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
                setSelectedCity(city);
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
    </div>
  );
}

