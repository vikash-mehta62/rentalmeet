'use client';

import { useState, useRef, useEffect } from 'react';
import { State, City } from 'country-state-city';
import { ChevronDown, Search, MapPin, Loader2 } from 'lucide-react';

// ── Reusable searchable select ────────────────────────────────────────────────
function SearchSelect({ label, value, options, onChange, disabled, placeholder, required }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(q.toLowerCase())
  );

  // Close on outside mousedown
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false); setQ('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const handleSelect = (opt) => {
    onChange(opt);
    setOpen(false);
    setQ('');
  };

  const handleOptionMouseDown = (e, opt) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelect(opt);
  };

  const displayLabel = value?.label || '';

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Trigger */}
      <div
        onClick={() => { if (!disabled) setOpen(p => !p); }}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl text-sm transition-all
          ${disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 bg-white hover:border-primary-400 cursor-pointer'}
          ${open ? 'border-primary-500 ring-2 ring-primary-100' : ''}`}
      >
        <span className={`truncate select-none ${!displayLabel ? 'text-gray-400' : 'text-gray-800'}`}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute z-[300] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-400 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No results</p>
            ) : filtered.map(opt => (
              <div
                key={opt.value}
                onMouseDown={(e) => handleOptionMouseDown(e, opt)}
                className={`px-3 py-2.5 text-sm cursor-pointer border-b border-gray-50 last:border-0 select-none
                  ${value?.value === opt.value
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function StateCitySelect({
  state, city, pincode,
  onStateChange, onCityChange, onPincodeChange,
  required = true,
  inline = false
}) {
  const [fetchingPin, setFetchingPin] = useState(false);

  // Build options from country-state-city
  const stateOptions = State.getStatesOfCountry('IN').map(s => ({
    label: s.name,
    value: s.isoCode,   // e.g. "MP", "MH"
    name: s.name
  }));

  const cityOptions = state?.value
    ? City.getCitiesOfState('IN', state.value).map(c => ({
        label: c.name,
        value: c.name,
        name: c.name
      }))
    : [];

  const handleStateChange = (opt) => {
    onStateChange(opt);          // { label, value, name }
    onCityChange(null);
    if (onPincodeChange) onPincodeChange('');
  };

  const handleCityChange = async (opt) => {
    onCityChange(opt);           // { label, value, name }
    if (!onPincodeChange || !opt) return;

    // Auto-fetch pincode
    setFetchingPin(true);
    try {
      const res = await fetch(
        `https://api.postalpincode.com/postoffice/${encodeURIComponent(opt.name)}`
      );
      const data = await res.json();
      if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const offices = data[0].PostOffice;
        const match = state?.name
          ? offices.find(p => p.State?.toLowerCase().includes(state.name.toLowerCase().slice(0, 4)))
          : null;
        const pin = (match || offices[0])?.Pincode;
        if (pin) onPincodeChange(pin);
      }
    } catch {}
    finally { setFetchingPin(false); }
  };

  return (
    <div className={inline ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'}>
      {/* State */}
      <SearchSelect
        label="State"
        value={state}
        options={stateOptions}
        onChange={handleStateChange}
        placeholder="Select state"
        required={required}
      />

      {/* City */}
      <SearchSelect
        label="City"
        value={city}
        options={cityOptions}
        onChange={handleCityChange}
        disabled={!state}
        placeholder={state ? 'Select city' : 'Select state first'}
        required={required}
      />

      {/* Pincode */}
      {onPincodeChange && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Pincode{required && <span className="text-red-500 ml-0.5">*</span>}
            {fetchingPin && (
              <span className="ml-2 text-[10px] text-primary-500 font-normal">
                <Loader2 className="w-3 h-3 animate-spin inline mr-0.5" />Auto-filling...
              </span>
            )}
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={pincode}
              onChange={e => onPincodeChange(e.target.value)}
              maxLength={6}
              placeholder="6-digit pincode"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
