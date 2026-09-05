'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Check, ChevronUp, ChevronDown, Sparkles, X, Sun, Moon, RotateCcw } from 'lucide-react';

/**
 * Utility: Convert 24h string "HH:MM" to { hours12, minutes, period, hours24 }
 */
export function parse24HourTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    return { hours12: 9, minutes: 0, period: 'AM', hours24: 9 };
  }
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h)) h = 9;
  if (isNaN(m)) m = 0;
  
  h = Math.max(0, Math.min(23, h));
  m = Math.max(0, Math.min(59, m));

  const period = h >= 12 ? 'PM' : 'AM';
  let hours12 = h % 12;
  if (hours12 === 0) hours12 = 12;

  return { hours12, minutes: m, period, hours24: h };
}

/**
 * Utility: Convert { hours12, minutes, period } to 24h "HH:MM"
 */
export function formatTo24HourTime(hours12, minutes, period) {
  let h = hours12 % 12;
  if (period === 'PM') h += 12;
  const hh = String(h).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Utility: Format 24h "HH:MM" to readable "09:00 AM"
 */
export function formatDisplayTime(timeStr) {
  if (!timeStr) return '';
  const { hours12, minutes, period } = parse24HourTime(timeStr);
  const hh = String(hours12).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
}

export default function ClockTimePicker({
  value = '',
  onChange,
  label = 'Select Time',
  required = false,
  error = null,
  presetType = 'general', // 'opening' | 'closing' | 'general'
  helperText = '',
  id = 'clock-time-picker',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('hours'); // 'hours' | 'minutes'
  
  // Internal selection state
  const parsed = parse24HourTime(value || (presetType === 'closing' ? '22:00' : '08:00'));
  const [selectedHour, setSelectedHour] = useState(parsed.hours12);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minutes);
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

  const containerRef = useRef(null);
  const clockFaceRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      const p = parse24HourTime(value);
      setSelectedHour(p.hours12);
      setSelectedMinute(p.minutes);
      setSelectedPeriod(p.period);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Apply current internal state to parent
  const applyTime = useCallback((h = selectedHour, m = selectedMinute, p = selectedPeriod) => {
    const time24 = formatTo24HourTime(h, m, p);
    if (onChange) {
      onChange(time24);
    }
  }, [selectedHour, selectedMinute, selectedPeriod, onChange]);

  const handleHourSelect = (hour, autoAdvance = true) => {
    setSelectedHour(hour);
    applyTime(hour, selectedMinute, selectedPeriod);
    if (autoAdvance) {
      setTimeout(() => {
        setActiveTab('minutes');
      }, 200);
    }
  };

  const handleMinuteSelect = (min) => {
    setSelectedMinute(min);
    applyTime(selectedHour, min, selectedPeriod);
  };

  const handlePeriodToggle = (period) => {
    setSelectedPeriod(period);
    applyTime(selectedHour, selectedMinute, period);
  };

  const handlePresetSelect = (preset24) => {
    const p = parse24HourTime(preset24);
    setSelectedHour(p.hours12);
    setSelectedMinute(p.minutes);
    setSelectedPeriod(p.period);
    if (onChange) {
      onChange(preset24);
    }
  };

  // Adjust time by minutes or hours
  const adjustTime = (type, delta) => {
    if (type === 'hour') {
      let newH = selectedHour + delta;
      if (newH > 12) newH = 1;
      if (newH < 1) newH = 12;
      setSelectedHour(newH);
      applyTime(newH, selectedMinute, selectedPeriod);
    } else {
      let newM = selectedMinute + delta;
      if (newM >= 60) newM = 0;
      if (newM < 0) newM = 55;
      setSelectedMinute(newM);
      applyTime(selectedHour, newM, selectedPeriod);
    }
  };

  // Handle angle calculation on clock face (click or drag)
  const handleClockFacePointer = useCallback((e) => {
    if (!clockFaceRef.current) return;
    const rect = clockFaceRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Calculate angle in degrees (0 deg is top 12 o'clock)
    let angleRad = Math.atan2(dy, dx) + Math.PI / 2;
    if (angleRad < 0) angleRad += 2 * Math.PI;
    const angleDeg = (angleRad * 180) / Math.PI;

    if (activeTab === 'hours') {
      // 360 deg / 12 = 30 deg per hour
      let h = Math.round(angleDeg / 30) % 12;
      if (h === 0) h = 12;
      handleHourSelect(h, !e.touches);
    } else {
      // 360 deg / 60 = 6 deg per minute (snap to nearest 5 or continuous)
      let m = Math.round(angleDeg / 6) % 60;
      // Snap to nearest 5 if close
      const rem = m % 5;
      if (rem <= 1) m = m - rem;
      else if (rem >= 4) m = (m + (5 - rem)) % 60;
      handleMinuteSelect(m);
    }
  }, [activeTab, selectedMinute, selectedPeriod, selectedHour]);

  const onPointerDown = (e) => {
    isDraggingRef.current = true;
    handleClockFacePointer(e);
  };

  const onPointerMove = (e) => {
    if (isDraggingRef.current) {
      handleClockFacePointer(e);
    }
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  // Preset time choices
  const openingPresets = [
    { label: '06:00 AM', value: '06:00' },
    { label: '07:00 AM', value: '07:00' },
    { label: '08:00 AM', value: '08:00' },
    { label: '09:00 AM', value: '09:00' },
    { label: '10:00 AM', value: '10:00' },
    { label: '11:00 AM', value: '11:00' },
  ];

  const closingPresets = [
    { label: '06:00 PM', value: '18:00' },
    { label: '08:00 PM', value: '20:00' },
    { label: '09:00 PM', value: '21:00' },
    { label: '10:00 PM', value: '22:00' },
    { label: '11:00 PM', value: '23:00' },
    { label: '12:00 AM', value: '00:00' },
  ];

  const presets = presetType === 'closing' ? closingPresets : openingPresets;

  // Geometry for clock face
  const clockSize = 220;
  const center = clockSize / 2;
  const radius = 80;

  // Calculate needle angle
  const needleAngle = activeTab === 'hours'
    ? (selectedHour % 12) * 30
    : selectedMinute * 6;

  const needleRad = ((needleAngle - 90) * Math.PI) / 180;
  const needleX = center + radius * Math.cos(needleRad);
  const needleY = center + radius * Math.sin(needleRad);

  const displayTimeFormatted = value ? formatDisplayTime(value) : 'Select Time';
  const display24h = value || formatTo24HourTime(selectedHour, selectedMinute, selectedPeriod);

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      {label && (
        <label className="block text-sm font-semibold text-dark-700 dark:text-gray-200 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main Interactive Trigger Card */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left transition-all duration-200 group flex items-center justify-between p-3.5 rounded-xl border bg-white dark:bg-slate-900 ${
          isOpen
            ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md shadow-primary-500/10'
            : error
            ? 'border-red-500 ring-1 ring-red-500/20 bg-red-50/20'
            : 'border-gray-300 dark:border-slate-700 hover:border-primary-400 hover:shadow-sm'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-3">
          {/* Animated Clock Icon Badge */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
            selectedPeriod === 'AM'
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
          }`}>
            <Clock className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
                {value ? formatDisplayTime(value) : 'Select time'}
              </span>
              {value && (
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                  selectedPeriod === 'AM'
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                    : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/30'
                }`}>
                  {selectedPeriod}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              24h Format: <span className="font-semibold text-gray-700 dark:text-gray-300">{display24h}</span>
            </p>
          </div>
        </div>

        {/* Change Time Pill / Button */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-xs font-semibold group-hover:bg-primary-500 group-hover:text-white transition-colors">
          <Clock className="w-3.5 h-3.5" />
          <span>{isOpen ? 'Close' : 'Set Time'}</span>
        </div>
      </button>

      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{helperText}</p>
      )}

      {error && (
        <p className="text-error text-xs font-medium mt-1.5 animate-fade-in flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {typeof error === 'string' ? error : error.message || 'Time is required'}
        </p>
      )}

      {/* Interactive Clock Modal / Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 right-0 sm:right-auto sm:w-[340px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-5 animate-slide-up backdrop-blur-md">
          {/* Header with Title and Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary-500/10 text-primary-500 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {label.replace('*', '').trim()} Clock
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Digital Time Display & AM/PM Switcher */}
          <div className="my-4 bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-800/80 dark:to-slate-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
            {/* Hour & Minute Clickable Selectors */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('hours')}
                className={`px-3 py-1.5 rounded-lg text-2xl font-black font-mono tracking-wider transition-all ${
                  activeTab === 'hours'
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 scale-105'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-gray-100'
                }`}
              >
                {String(selectedHour).padStart(2, '0')}
              </button>
              <span className="text-2xl font-black text-slate-400 animate-pulse">:</span>
              <button
                type="button"
                onClick={() => setActiveTab('minutes')}
                className={`px-3 py-1.5 rounded-lg text-2xl font-black font-mono tracking-wider transition-all ${
                  activeTab === 'minutes'
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 scale-105'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-gray-200 hover:bg-gray-100'
                }`}
              >
                {String(selectedMinute).padStart(2, '0')}
              </button>
            </div>

            {/* AM / PM Segmented Control */}
            <div className="flex flex-col gap-1 bg-white dark:bg-slate-700 p-1 rounded-xl border border-gray-200 dark:border-slate-600 shadow-sm">
              <button
                type="button"
                onClick={() => handlePeriodToggle('AM')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedPeriod === 'AM'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-300 hover:text-dark-700'
                }`}
              >
                <Sun className="w-3 h-3" />
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodToggle('PM')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedPeriod === 'PM'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-300 hover:text-dark-700'
                }`}
              >
                <Moon className="w-3 h-3" />
                PM
              </button>
            </div>
          </div>

          {/* Mode Switch Pills */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('hours')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'hours'
                  ? 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-800'
                  : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100'
              }`}
            >
              1. Select Hour ({selectedHour})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('minutes')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'minutes'
                  ? 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-800'
                  : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100'
              }`}
            >
              2. Select Minute ({String(selectedMinute).padStart(2, '0')})
            </button>
          </div>

          {/* Analog Clock Face */}
          <div
            ref={clockFaceRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="relative mx-auto my-2 rounded-full cursor-pointer select-none bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-gray-200 dark:border-slate-700 shadow-inner flex items-center justify-center touch-none"
            style={{ width: `${clockSize}px`, height: `${clockSize}px` }}
          >
            {/* Center Pivot Point */}
            <div className="absolute w-3.5 h-3.5 rounded-full bg-primary-500 border-2 border-white dark:border-slate-900 shadow-md z-20" />

            {/* SVG Clock Needle and Target Circle */}
            <svg
              className="absolute inset-0 pointer-events-none z-10"
              width={clockSize}
              height={clockSize}
            >
              {/* Center connecting line */}
              <line
                x1={center}
                y1={center}
                x2={needleX}
                y2={needleY}
                stroke="#F59F0A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Highlight circle on selected point */}
              <circle
                cx={needleX}
                cy={needleY}
                r="16"
                fill="#F59F0A"
                opacity="0.9"
                className="transition-all duration-150"
              />
            </svg>

            {/* Render Numbers on Dial */}
            {activeTab === 'hours' ? (
              // 12 Hour Numbers (1 - 12)
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => {
                const angle = (hour * 30 - 90) * (Math.PI / 180);
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                const isSelected = selectedHour === hour;

                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHourSelect(hour);
                    }}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-20 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isSelected
                        ? 'text-white font-black scale-110'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-slate-700 hover:text-primary-600'
                    }`}
                  >
                    {hour}
                  </button>
                );
              })
            ) : (
              // 60 Minutes (display increments of 5)
              [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => {
                const angle = (min * 6 - 90) * (Math.PI / 180);
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                const isSelected = selectedMinute === min;

                return (
                  <button
                    key={min}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMinuteSelect(min);
                    }}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-20 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold font-mono transition-all ${
                      isSelected
                        ? 'text-white font-black scale-110'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-slate-700 hover:text-primary-600'
                    }`}
                  >
                    {String(min).padStart(2, '0')}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Step Buttons (+/- 15 mins, +/- 1 hour) */}
          <div className="flex items-center justify-between mt-3 px-1 py-1.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-xs">
            <span className="text-gray-500 font-medium ml-2">Quick Adjust:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustTime('minute', -15)}
                className="px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-100 font-semibold"
              >
                -15m
              </button>
              <button
                type="button"
                onClick={() => adjustTime('minute', 15)}
                className="px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-100 font-semibold"
              >
                +15m
              </button>
              <button
                type="button"
                onClick={() => adjustTime('hour', 1)}
                className="px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-100 font-semibold"
              >
                +1 hr
              </button>
            </div>
          </div>

          {/* Popular Presets */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Popular {presetType === 'closing' ? 'Closing' : 'Opening'} Timings
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {presets.map((p) => {
                const isCurrent = value === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handlePresetSelect(p.value)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isCurrent
                        ? 'bg-primary-500 text-white font-bold shadow-sm'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Apply / Confirm Button */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex gap-2">
            <button
              type="button"
              onClick={() => {
                applyTime();
                setIsOpen(false);
              }}
              className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm rounded-xl shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              Done ({formatDisplayTime(formatTo24HourTime(selectedHour, selectedMinute, selectedPeriod))})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
