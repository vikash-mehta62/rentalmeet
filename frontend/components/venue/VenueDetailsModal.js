'use client';

import { useState, useEffect, useRef } from 'react';
import VenueReviews from '@/components/venue/VenueReviews';
import {
  X, Building2, MapPin, IndianRupee, Calendar, Clock, Users, FileText,
  Image as ImageIcon, Utensils, CheckCircle, XCircle, Ban, Loader2,
  Phone, Mail, User, CreditCard, FileCheck, Download, Edit3, Navigation,
  Bus, Train, ShieldCheck, Check, Sparkles, Shield, Wifi, Coffee,
  ChevronDown, AlertTriangle, AlertCircle, PlayCircle, PauseCircle, ShieldAlert,
  RefreshCw, Car, Bike, Globe, ExternalLink
} from 'lucide-react';
import { normalizeCustomGST, normalizeCustomPlatformFee } from '@/lib/venuePricing';
import { downloadVenuePDF } from '@/utils/generateVenuePDF';

const DEFAULT_CUSTOM_PLATFORM_FEE = { enabled: false, feeType: 'fixed', feeValue: 0, percentage: 0, platformCGSTRate: 9, platformSGSTRate: 9 };
const DEFAULT_CUSTOM_GST = { enabled: false, rate: 18, cgstRate: 9, sgstRate: 9, hsnCode: '9973' };

const REJECTION_REASONS = [
  'Incomplete or inaccurate venue information',
  'Poor quality images or missing required photos',
  'Pricing does not match platform or market standards',
  'Location or address details are invalid/unclear',
  'Amenities or capacity information is misleading',
  'Duplicate listing detected on platform',
  'Missing owner identification or property documents',
  'other'
];

const SUSPENSION_REASONS = [
  'Venue temporarily closed / Under renovation',
  'Owner requested temporary listing pause',
  'Quality or customer safety compliance issues reported',
  'Repeated booking rejections or communication failure',
  'Pricing dispute or unauthorized rate change',
  'Account verification / KYC compliance audit pending',
  'other'
];

const STOP_BOOKING_REASONS = [
  'Temporary maintenance / Renovation work in progress',
  'Venue owner requested pause on new online bookings',
  'High offline booking demand / Dates fully blocked',
  'Administrative review or safety verification hold',
  'Payment settlement or bank documentation pending',
  'other'
];

export default function VenueDetailsModal({ 
  venue, 
  onClose, 
  onStatusUpdate, 
  onToggleBooking,
  showActions = false, 
  platformSettings = null, 
  customSettings = null, 
  onUpdateSettings = null,
  onQuickEdit = null,
  onVenueUpdated = null
}) {
  const [currentVenue, setCurrentVenue] = useState(venue);
  const [activeTab, setActiveTab] = useState('basic');
  const [actionLoading, setActionLoading] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Status changer and stop booking states
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, targetStatus: '', reason: '', customReason: '' });
  const [stopBookingModal, setStopBookingModal] = useState({ open: false, reason: '', customReason: '' });
  const [submittingAction, setSubmittingAction] = useState(false);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    setCurrentVenue(venue);
  }, [venue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [localCustomSettings, setLocalCustomSettings] = useState(customSettings || {
    customPlatformFee: DEFAULT_CUSTOM_PLATFORM_FEE,
    customGST: DEFAULT_CUSTOM_GST
  });
  const normalizedVenuePlatformFee = normalizeCustomPlatformFee(currentVenue.customPlatformFee, platformSettings || {});
  const normalizedVenueGST = normalizeCustomGST(currentVenue.customGST || DEFAULT_CUSTOM_GST, platformSettings || {});
  const localCustomGST = normalizeCustomGST(localCustomSettings.customGST || DEFAULT_CUSTOM_GST, platformSettings || {});
  const localCustomPlatformFee = normalizeCustomPlatformFee(localCustomSettings.customPlatformFee || DEFAULT_CUSTOM_PLATFORM_FEE, platformSettings || {});
  const effectiveVenueGST = localCustomGST.enabled
    ? localCustomGST
    : normalizeCustomGST({ enabled: true, cgstRate: platformSettings?.venueCGST, sgstRate: platformSettings?.venueSGST, hsnCode: platformSettings?.venueHSN }, platformSettings || {});
  const effectivePlatformFee = localCustomPlatformFee.enabled
    ? localCustomPlatformFee
    : normalizeCustomPlatformFee({
        enabled: true,
        feeType: platformSettings?.platformFeeType || 'percentage',
        feeValue: platformSettings?.platformFeeValue ?? platformSettings?.platformFeePercentage,
        platformCGSTRate: platformSettings?.platformCGST,
        platformSGSTRate: platformSettings?.platformSGST
      }, platformSettings || {});
  const effectivePlatformFeeLabel = effectivePlatformFee.feeType === 'fixed'
    ? `Rs.${effectivePlatformFee.feeValue}`
    : `${effectivePlatformFee.feeValue}%`;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Building2 },
    { id: 'location', label: 'Location & Parking', icon: MapPin },
    { id: 'amenities', label: 'Amenities & Food', icon: Utensils },
    { id: 'pricing', label: 'Pricing & Taxes', icon: IndianRupee },
    { id: 'images', label: 'Photos', icon: ImageIcon },
    { id: 'owner', label: 'Owner & Authorised', icon: User },
    { id: 'documents', label: 'Documents & Proofs', icon: FileCheck },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
    { id: 'rules', label: 'Rules & Policies', icon: ShieldCheck },
    { id: 'reviews', label: 'Reviews', icon: FileText },
  ];

  if (showActions && (currentVenue.status === 'approved' || currentVenue.status === 'suspended')) {
    tabs.push({ id: 'settings', label: 'Custom Settings', icon: CreditCard });
  }

  // Handle status change selection
  const handleSelectStatus = (targetStatus) => {
    setStatusMenuOpen(false);
    if (targetStatus === 'rejected' || targetStatus === 'suspended') {
      setStatusModal({ open: true, targetStatus, reason: '', customReason: '' });
    } else {
      executeStatusChange(targetStatus, '');
    }
  };

  const executeStatusChange = async (targetStatus, reason = '') => {
    if (submittingAction) return;
    setSubmittingAction(true);
    try {
      if (onStatusUpdate) {
        const result = await onStatusUpdate(currentVenue._id, targetStatus, reason);
        if (result && result.venue) {
          setCurrentVenue(prev => ({ ...prev, ...result.venue }));
          if (onVenueUpdated) onVenueUpdated(result.venue);
        } else {
          setCurrentVenue(prev => ({
            ...prev,
            status: targetStatus,
            rejectionReason: targetStatus === 'rejected' ? reason : (targetStatus === 'approved' ? '' : prev.rejectionReason),
            suspensionReason: targetStatus === 'suspended' ? reason : (targetStatus === 'approved' ? '' : prev.suspensionReason)
          }));
        }
      }
      setStatusModal({ open: false, targetStatus: '', reason: '', customReason: '' });
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Stop Booking / Allow Booking toggle
  const executeToggleBooking = async (isBookingStopped, reason = '') => {
    if (submittingAction) return;
    setSubmittingAction(true);
    try {
      if (onToggleBooking) {
        const result = await onToggleBooking(currentVenue._id, isBookingStopped, reason);
        if (result && result.venue) {
          setCurrentVenue(prev => ({ ...prev, ...result.venue }));
          if (onVenueUpdated) onVenueUpdated(result.venue);
        } else {
          setCurrentVenue(prev => ({
            ...prev,
            isBookingStopped,
            stopBookingReason: isBookingStopped ? reason : '',
            stoppedBookingAt: isBookingStopped ? new Date() : null
          }));
        }
      }
      setStopBookingModal({ open: false, reason: '', customReason: '' });
    } catch (err) {
      console.error('Toggle booking error:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (onUpdateSettings) {
      setSettingsLoading(true);
      try {
        await onUpdateSettings({
          ...localCustomSettings,
          customPlatformFee: normalizeCustomPlatformFee(localCustomSettings.customPlatformFee, platformSettings || {}),
          customGST: normalizeCustomGST(localCustomSettings.customGST, platformSettings || {})
        });
      } catch (err) {
        console.error('Update settings error:', err);
      } finally {
        setSettingsLoading(false);
      }
    }
  };

  // Normalize amenities whether strings or objects
  const basicAmenitiesList = (currentVenue.amenities?.basic || []).map(a => 
    typeof a === 'string' ? { name: a, available: true, type: 'Included' } : a
  ).filter(a => a && a.available !== false);

  const additionalFacilitiesList = (currentVenue.amenities?.additional || []).map(a => 
    typeof a === 'string' ? { name: a, available: true, type: 'Included' } : a
  ).filter(a => a && a.available !== false);

  const onlineBookingSched = currentVenue.availability?.onlineBookingSchedule || currentVenue.pricing?.onlineBookingSchedule;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col relative">
        
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-dark-800">{currentVenue.businessName}</h2>
              
              {/* Venue Lifecycle Status Badge */}
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                currentVenue.status === 'approved' ? 'bg-green-100 text-green-700' :
                currentVenue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                currentVenue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                currentVenue.status === 'resubmitted' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {currentVenue.status}
              </span>

              {/* Booking Acceptance Status Badge (Separate!) */}
              {currentVenue.isBookingStopped ? (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1 shadow-xs">
                  <PauseCircle className="w-3 h-3 text-rose-600" /> Bookings Stopped
                </span>
              ) : (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 shadow-xs">
                  <PlayCircle className="w-3 h-3 text-emerald-600" /> Bookings Allowed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">SKU: {currentVenue.sku || 'N/A'}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Changer Dropdown */}
            {showActions && (
              <div className="relative" ref={statusMenuRef}>
                <button
                  type="button"
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  disabled={submittingAction}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Change Status</span>
                  <ChevronDown className="w-3 h-3 text-gray-300" />
                </button>

                {statusMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      Set Venue Status
                    </div>
                    {currentVenue.status !== 'approved' && (
                      <button
                        onClick={() => handleSelectStatus('approved')}
                        className="w-full text-left px-3 py-2 hover:bg-green-50 text-green-700 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Approve Venue
                      </button>
                    )}
                    {currentVenue.status !== 'suspended' && (
                      <button
                        onClick={() => handleSelectStatus('suspended')}
                        className="w-full text-left px-3 py-2 hover:bg-amber-50 text-amber-700 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Suspend Venue (with reason)
                      </button>
                    )}
                    {currentVenue.status !== 'rejected' && (
                      <button
                        onClick={() => handleSelectStatus('rejected')}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-700 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-600" /> Reject Venue (with reason)
                      </button>
                    )}
                    {currentVenue.status !== 'pending' && (
                      <button
                        onClick={() => handleSelectStatus('pending')}
                        className="w-full text-left px-3 py-2 hover:bg-yellow-50 text-yellow-800 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-yellow-600" /> Set Pending
                      </button>
                    )}
                    {currentVenue.status !== 'resubmitted' && (
                      <button
                        onClick={() => handleSelectStatus('resubmitted')}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 font-semibold flex items-center gap-2 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Mark Resubmitted
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Stop Booking / Allow Booking Toggle (Separate Control!) */}
            {showActions && (
              currentVenue.isBookingStopped ? (
                <button
                  type="button"
                  onClick={() => executeToggleBooking(false)}
                  disabled={submittingAction}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  title="Allow new online bookings for this venue"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-white" />
                  <span>Allow Booking</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStopBookingModal({ open: true, reason: '', customReason: '' })}
                  disabled={submittingAction}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  title="Stop/pause all online bookings for this venue"
                >
                  <PauseCircle className="w-3.5 h-3.5 text-white" />
                  <span>Stop Booking</span>
                </button>
              )
            )}

            <button
              onClick={async () => {
                setPdfLoading(true);
                try {
                  await downloadVenuePDF(currentVenue, platformSettings);
                } finally {
                  setPdfLoading(false);
                }
              }}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              title="Download Complete Venue PDF Dossier"
            >
              {pdfLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{pdfLoading ? 'Generating...' : 'Download PDF'}</span>
            </button>
            {onQuickEdit && (
              <button
                onClick={() => onQuickEdit(currentVenue)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                title="Quick edit venue details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Quick Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-3 overflow-x-auto flex-shrink-0">
          <div className="flex gap-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 font-medium text-xs transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary-500 text-primary-600 bg-white -mb-px font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              
              {/* Highlight Status & Booking Control Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {/* 1. Venue Listing Lifecycle Status */}
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between space-y-2 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary-600" /> Listing Status
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        currentVenue.status === 'approved' ? 'bg-green-100 text-green-700' :
                        currentVenue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        currentVenue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        currentVenue.status === 'resubmitted' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {currentVenue.status}
                      </span>
                    </div>

                    {(currentVenue.status === 'rejected' || currentVenue.status === 'suspended' || currentVenue.status === 'resubmitted') && (currentVenue.rejectionReason || currentVenue.suspensionReason || currentVenue.statusReason) && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
                        <span className="font-bold">Status Reason:</span> {currentVenue.rejectionReason || currentVenue.suspensionReason || currentVenue.statusReason}
                      </div>
                    )}
                  </div>

                  {showActions && (
                    <div className="pt-1 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Quick Set:</span>
                      {currentVenue.status !== 'approved' && (
                        <button
                          onClick={() => handleSelectStatus('approved')}
                          className="px-2 py-0.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded text-[10px] font-bold"
                        >
                          Approve
                        </button>
                      )}
                      {currentVenue.status !== 'suspended' && (
                        <button
                          onClick={() => handleSelectStatus('suspended')}
                          className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold"
                        >
                          Suspend (Reason)
                        </button>
                      )}
                      {currentVenue.status !== 'rejected' && (
                        <button
                          onClick={() => handleSelectStatus('rejected')}
                          className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold"
                        >
                          Reject (Reason)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Venue Online Booking Acceptance Status (SEPARATE!) */}
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between space-y-2 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary-600" /> Booking Acceptance
                      </span>
                      {currentVenue.isBookingStopped ? (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                          <PauseCircle className="w-3 h-3 text-rose-600" /> Stopped / Paused
                        </span>
                      ) : (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <PlayCircle className="w-3 h-3 text-emerald-600" /> Allowed (Active)
                        </span>
                      )}
                    </div>

                    {currentVenue.isBookingStopped ? (
                      <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800">
                        <p><span className="font-bold">Stop Reason:</span> {currentVenue.stopBookingReason || 'Stopped by administration'}</p>
                        {currentVenue.stoppedBookingAt && (
                          <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                            Paused on: {new Date(currentVenue.stoppedBookingAt).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-gray-500">
                        Customers are currently permitted to place online bookings for this venue.
                      </p>
                    )}
                  </div>

                  {showActions && (
                    <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Booking Control:</span>
                      {currentVenue.isBookingStopped ? (
                        <button
                          type="button"
                          onClick={() => executeToggleBooking(false)}
                          disabled={submittingAction}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <PlayCircle className="w-3 h-3" /> Resume / Allow Booking
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStopBookingModal({ open: true, reason: '', customReason: '' })}
                          disabled={submittingAction}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <PauseCircle className="w-3 h-3" /> Stop Booking
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Business Name</label>
                  <p className="text-sm text-gray-900 font-bold">{currentVenue.businessName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Category / Venue Type</label>
                  <p className="text-sm text-gray-900 font-semibold">{Array.isArray(currentVenue.venueType) ? currentVenue.venueType.join(', ') : currentVenue.venueType}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Food Type</label>
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold border border-emerald-200">
                    {currentVenue.foodType || 'Veg'}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Guest Capacity</label>
                  <p className="text-sm text-gray-900 font-semibold">{currentVenue.capacity} guests</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Total Space Area</label>
                  <p className="text-sm text-gray-900 font-semibold">{currentVenue.areaSqft} sq.ft</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Year Established</label>
                  <p className="text-sm text-gray-900 font-semibold">{currentVenue.yearEstablished || 'Not Specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Floor Level</label>
                  <p className="text-sm text-gray-900 font-semibold">{currentVenue.floor || 'Ground Floor'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Total Bookings Completed</label>
                  <p className="text-sm text-gray-900 font-bold text-primary-600">{currentVenue.totalBookings || 0}</p>
                </div>
              </div>

              {/* Seating Arrangements Card */}
              {currentVenue.seatingArrangements && currentVenue.seatingArrangements.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary-600" />
                    Seating Arrangements Supported
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentVenue.seatingArrangements.map((seat, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Available Card */}
              {currentVenue.servicesAvailable && currentVenue.servicesAvailable.length > 0 && (
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Services Available
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentVenue.servicesAvailable.map((srv, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white text-indigo-900 rounded-lg text-xs font-semibold border border-indigo-200 shadow-xs flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Venue Description & Highlights</label>
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {currentVenue.description || 'No description provided.'}
                </div>
              </div>

              {currentVenue.rating > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Rating</label>
                    <p className="text-sm text-gray-900 font-bold">⭐ {currentVenue.rating.toFixed(1)} / 5.0</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Customer Reviews</label>
                    <p className="text-sm text-gray-900 font-semibold">{currentVenue.reviewCount} verified reviews</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Complete Physical Address</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium">{venue.location?.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Landmark</label>
                  <p className="text-sm text-gray-900 font-medium">{venue.location?.landmark || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Area / Locality</label>
                  <p className="text-sm text-gray-900 font-medium">{venue.location?.area || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">City</label>
                  <p className="text-sm text-gray-900 font-medium">{venue.location?.city || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">State</label>
                  <p className="text-sm text-gray-900 font-medium">{venue.location?.state || 'N/A'}</p>
                </div>
                {venue.location?.village && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Village / Ward</label>
                    <p className="text-sm text-gray-900 font-medium">{venue.location?.village}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Pincode</label>
                  <p className="text-sm text-gray-900 font-medium">{venue.location?.pincode || 'N/A'}</p>
                </div>
              </div>

              {/* Comprehensive Parking Details Card */}
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-blue-600" />
                  Parking Facility & Capacity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <span className="text-gray-500 block mb-1">Parking Type</span>
                    <span className="font-bold text-blue-950 px-2.5 py-0.5 rounded bg-blue-100/70 text-xs">
                      {venue.parkingDetails?.type || venue.location?.parkingAvailability || venue.location?.parkingType || 'Free'} Parking
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <span className="text-gray-500 block mb-1 flex items-center gap-1">
                      <Bike className="w-3.5 h-3.5 text-blue-600" /> 2-Wheeler / Bike
                    </span>
                    <p className="font-bold text-gray-900">
                      {venue.parkingDetails?.twoWheelers?.capacity || venue.location?.parkingDetails?.twoWheelerCapacity || 0} Capacity
                    </p>
                    <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                      {(venue.parkingDetails?.twoWheelers?.isChargeable || venue.location?.parkingDetails?.twoWheelerCharges > 0)
                        ? `₹${venue.parkingDetails?.twoWheelers?.chargePerVehicle || venue.location?.parkingDetails?.twoWheelerCharges}/bike`
                        : 'Free of charge'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <span className="text-gray-500 block mb-1 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-blue-600" /> 4-Wheeler / Car
                    </span>
                    <p className="font-bold text-gray-900">
                      {venue.parkingDetails?.cars?.capacity || venue.location?.parkingDetails?.carsCapacity || 0} Capacity
                    </p>
                    <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                      {(venue.parkingDetails?.cars?.isChargeable || venue.location?.parkingDetails?.carCharges > 0)
                        ? `₹${venue.parkingDetails?.cars?.chargePerVehicle || venue.location?.parkingDetails?.carCharges}/car`
                        : 'Free of charge'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <span className="text-gray-500 block mb-1">Valet Parking</span>
                    <span className={`font-bold px-2.5 py-0.5 rounded text-xs inline-block ${
                      (venue.parkingDetails?.valetAvailable || venue.location?.parkingDetails?.valetParking)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {(venue.parkingDetails?.valetAvailable || venue.location?.parkingDetails?.valetParking) ? '✓ Available' : '✗ Not Available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transit Connectivity */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-primary-600" />
                  Transit & Connectivity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Train className="w-3.5 h-3.5 text-purple-600" /> Nearest Metro Station
                    </span>
                    <p className="text-xs font-semibold text-gray-900">{venue.location?.nearestMetro || venue.location?.nearestMetroTrain || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Bus className="w-3.5 h-3.5 text-emerald-600" /> Nearest Bus / Auto Stand
                    </span>
                    <p className="text-xs font-semibold text-gray-900">{venue.location?.nearestBusStop || venue.location?.nearestBusAuto || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Train className="w-3.5 h-3.5 text-orange-600" /> Nearest Railway Station
                    </span>
                    <p className="text-xs font-semibold text-gray-900">{venue.location?.nearestRailway || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {venue.location?.googleMapLink && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Google Maps Direction Link</label>
                  <a
                    href={venue.location.googleMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline text-xs font-bold inline-flex items-center gap-1.5 bg-primary-50 px-3 py-2 rounded-lg border border-primary-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Google Maps Direction ({venue.location.googleMapLink}) →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Amenities Tab */}
          {activeTab === 'amenities' && (
            <div className="space-y-5">
              {/* 4 Categorized Amenity Groups */}
              {(() => {
                const groups = {
                  'Basic Facilities': [],
                  'Meeting / Conference Facilities': [],
                  'Event Facilities': [],
                  'Food Facilities': [],
                  'Other Facilities': []
                };

                basicAmenitiesList.forEach(item => {
                  const cat = item.category || 'Basic Facilities';
                  if (groups[cat]) {
                    groups[cat].push(item);
                  } else {
                    groups['Other Facilities'].push(item);
                  }
                });

                const groupIcons = {
                  'Basic Facilities': Shield,
                  'Meeting / Conference Facilities': Users,
                  'Event Facilities': Sparkles,
                  'Food Facilities': Utensils,
                  'Other Facilities': Check
                };

                const groupColors = {
                  'Basic Facilities': 'border-slate-200 bg-slate-50/70',
                  'Meeting / Conference Facilities': 'border-blue-200 bg-blue-50/70',
                  'Event Facilities': 'border-purple-200 bg-purple-50/70',
                  'Food Facilities': 'border-amber-200 bg-amber-50/70',
                  'Other Facilities': 'border-emerald-200 bg-emerald-50/70'
                };

                return Object.entries(groups).map(([groupTitle, items]) => {
                  if (!items || items.length === 0) return null;
                  const GroupIcon = groupIcons[groupTitle] || Shield;
                  const colorClass = groupColors[groupTitle] || 'border-gray-200 bg-gray-50';

                  return (
                    <div key={groupTitle} className={`p-4 rounded-xl border ${colorClass}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <GroupIcon className="w-4 h-4 text-primary-600" />
                          {groupTitle} ({items.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {items.map((amenity, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-xs flex flex-col justify-between space-y-1">
                            <span className="font-medium text-gray-900 text-xs">{amenity.name}</span>
                            <div className="flex items-center justify-between pt-0.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                amenity.type === 'Paid' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {amenity.type || 'Included'}
                              </span>
                              {amenity.type === 'Paid' && amenity.rate > 0 && (
                                <span className="text-[11px] font-bold text-orange-700">
                                  ₹{amenity.rate} {amenity.rateType ? `(${amenity.rateType})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Beverages */}
              {venue.amenities?.beverages && venue.amenities.beverages.filter(b => b.available).length > 0 && (
                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-blue-950 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-blue-600" /> Beverages Offered
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {venue.amenities.beverages.filter(b => b.available).map((bev, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-2.5 border border-blue-100 shadow-xs">
                        <p className="font-bold text-gray-900 text-xs mb-0.5">{bev.name}</p>
                        {bev.brand && <p className="text-[10px] text-gray-500">Brand: {bev.brand}</p>}
                        {bev.ratePerUnit && <p className="text-xs text-blue-700 font-bold mt-1">₹{bev.ratePerUnit}/unit</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Refreshment/Food */}
              {venue.amenities?.refreshmentFood && venue.amenities.refreshmentFood.filter(f => f.available).length > 0 && (
                <div className="p-4 bg-orange-50/70 rounded-xl border border-orange-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-orange-950 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-orange-600" /> Refreshments & Snacks
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {venue.amenities.refreshmentFood.filter(f => f.available).map((food, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-2.5 border border-orange-100 shadow-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{food.name}</p>
                          {food.items && <p className="text-[11px] text-gray-500 mt-0.5">{food.items}</p>}
                        </div>
                        {food.ratePerPlate && <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">₹{food.ratePerPlate}/plate</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lunch Thalis */}
              {venue.amenities?.lunchThalis && venue.amenities.lunchThalis.filter(t => t.available !== false).length > 0 && (
                <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-amber-950 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-600" /> Lunch Thalis & Meal Packages
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {venue.amenities.lunchThalis.filter(t => t.available !== false).map((thali, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-3 border border-amber-200 shadow-xs">
                        <h4 className="font-bold text-gray-900 text-xs mb-2 text-amber-950">{thali.thaliType || thali.type}</h4>
                        {thali.categories && thali.categories.map((cat, catIdx) => (
                          <div key={catIdx} className="bg-amber-50/50 rounded-lg p-2 mb-1.5 text-xs flex items-center justify-between">
                            <span className="font-medium text-gray-800">{cat.category}</span>
                            <span className="font-bold text-amber-800">₹{cat.ratePerPlate}/plate</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kitchen & Dining Access */}
              {(venue.amenities?.kitchenAccess?.available || venue.amenities?.diningArea?.available) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {venue.amenities?.kitchenAccess?.available && (
                    <div className="bg-purple-50/80 rounded-xl p-3.5 border border-purple-200 text-xs">
                      <p className="font-bold text-purple-950 mb-1">Kitchen Access</p>
                      <p className="text-gray-700">{venue.amenities.kitchenAccess.type} {venue.amenities.kitchenAccess.charges ? `(₹${venue.amenities.kitchenAccess.charges})` : ''}</p>
                    </div>
                  )}
                  {venue.amenities?.diningArea?.available && (
                    <div className="bg-purple-50/80 rounded-xl p-3.5 border border-purple-200 text-xs">
                      <p className="font-bold text-purple-950 mb-1">Dining Area Access</p>
                      <p className="text-gray-700">{venue.amenities.diningArea.type} {venue.amenities.diningArea.charges ? `(₹${venue.amenities.diningArea.charges})` : ''}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Facilities */}
              {additionalFacilitiesList.length > 0 && (
                <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-emerald-950 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" /> Additional Facilities & Safety
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {additionalFacilitiesList.map((amenity, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-2.5 border border-emerald-100 shadow-xs flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="font-medium text-emerald-950 text-xs">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pricing & Timings Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {venue.pricing?.perHour && (
                  <div className="bg-blue-50/80 rounded-xl p-3.5 border border-blue-200">
                    <h4 className="font-bold text-blue-900 text-xs uppercase mb-2">Per Hour Pricing</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between bg-white p-2 rounded">
                        <span className="text-gray-500">Weekday:</span>
                        <span className="font-bold text-primary-600">₹{venue.pricing.perHour.weekday}/hr</span>
                      </div>
                      <div className="flex justify-between bg-white p-2 rounded">
                        <span className="text-gray-500">Weekend:</span>
                        <span className="font-bold text-primary-600">₹{venue.pricing.perHour.weekend}/hr</span>
                      </div>
                    </div>
                  </div>
                )}
                {venue.pricing?.halfDay && (
                  <div className="bg-emerald-50/80 rounded-xl p-3.5 border border-emerald-200">
                    <h4 className="font-bold text-emerald-900 text-xs uppercase mb-2">Half Day (4 hrs)</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between bg-white p-2 rounded">
                        <span className="text-gray-500">Weekday:</span>
                        <span className="font-bold text-emerald-700">₹{venue.pricing.halfDay.weekday}</span>
                      </div>
                      <div className="flex justify-between bg-white p-2 rounded">
                        <span className="text-gray-500">Weekend:</span>
                        <span className="font-bold text-emerald-700">₹{venue.pricing.halfDay.weekend}</span>
                      </div>
                    </div>
                  </div>
                )}
                {venue.pricing?.fullDay && (
                  <div className="bg-purple-50/80 rounded-xl p-3.5 border border-purple-200">
                    <h4 className="font-bold text-purple-900 text-xs uppercase mb-2">Full Day (8+ hrs)</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between bg-white p-2 rounded">
                        <span className="text-gray-500">Weekday:</span>
                        <span className="font-bold text-purple-700">₹{venue.pricing.fullDay.weekday}</span>
                      </div>
                      <div className="flex justify-between bg-white p-2 rounded">
                        <span className="text-gray-500">Weekend:</span>
                        <span className="font-bold text-purple-700">₹{venue.pricing.fullDay.weekend}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Extra Hour Rate */}
              {venue.pricing?.extraHourRate && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-900 block">Extra Hour Overtime Charge</span>
                    <span className="text-gray-500">Applicable for hours extending beyond booked slot</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-gray-700">Weekday: <strong>₹{venue.pricing.extraHourRate.weekday}/hr</strong></span>
                    <span className="font-semibold text-gray-700">Weekend: <strong>₹{venue.pricing.extraHourRate.weekend}/hr</strong></span>
                  </div>
                </div>
              )}

              {/* Taxes & GST Settings Card */}
              <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200">
                <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  Taxes & GST Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-teal-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">GST Application Mode</span>
                    <span className="font-bold text-teal-950 px-2 py-0.5 rounded bg-teal-100/70 text-xs">
                      {venue.taxSettings?.gstType || (venue.ownerInfo?.hasGST ? 'Extra (Exclusive)' : 'Not Applicable')}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-teal-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">Applicable GST Rate</span>
                    <p className="font-bold text-gray-900 text-sm">
                      {venue.taxSettings?.gstRate ? `${venue.taxSettings.gstRate}%` : '18% Standard'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-teal-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">GSTIN Registration Number</span>
                    <p className="font-mono font-bold text-teal-950">
                      {venue.taxSettings?.gstin || venue.ownerInfo?.gstNumber || venue.documents?.gstNumber || 'Not provided / Unregistered'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Availability & Operating Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" /> Physical Operating Hours
                  </h4>
                  <p className="text-xs text-gray-700">
                    Opens: <strong>{venue.availability?.openingTime || venue.pricing?.openingTime || '09:00'}</strong> — Closes: <strong>{venue.availability?.closingTime || venue.pricing?.closingTime || '22:00'}</strong>
                  </p>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Online Booking Window
                  </h4>
                  <p className="text-xs text-indigo-900">
                    Accepting Bookings: <strong>{onlineBookingSched?.openingTime || '06:00'}</strong> to <strong>{onlineBookingSched?.closingTime || '02:00 next day'}</strong>
                  </p>
                </div>
              </div>

              {/* Advance Booking & Confirmation Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-500 block mb-1">Minimum Advance Booking Rule:</span>
                  <p className="text-sm font-bold text-primary-600">
                    {venue.availability?.advanceBookingRule || venue.pricing?.advanceBookingRule || '1 Day'}
                  </p>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs text-gray-500 block mb-1">Maximum Time to Confirm Booking:</span>
                  <p className="text-sm font-bold text-amber-600">
                    {venue.availability?.confirmationHours ?? venue.pricing?.confirmationHours ?? 3} Hours
                  </p>
                </div>
              </div>

              {/* Available Days */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Available Days of Week</label>
                <div className="flex flex-wrap gap-1.5">
                  {(venue.availability?.availableDays || venue.pricing?.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).map((d) => (
                    <span key={d} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-semibold">
                      ✓ {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              {venue.images && venue.images.length > 0 ? (
                ['Featured', 'Front / Entrance', 'Main Hall / Space', 'Additional Hall', 'Seating Area', 'Stage', 'Dining Area', 'Kitchen', 'Bedroom', 'Washroom', 'Parking', 'Garden / Lawn', 'Outdoor Area', 'Exterior', 'Interior', 'Amenities', 'Other', 'Additional'].map(category => {
                  const categoryImages = venue.images.filter(img => img.category === category);
                  if (categoryImages.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-800">{category} Photos ({categoryImages.length})</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {categoryImages.map((img, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-xs bg-slate-100">
                            <img
                              src={img.url}
                              alt={`${category} ${idx + 1}`}
                              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {img.isFeatured && (
                              <span className="absolute top-1.5 right-1.5 bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-xs">
                                ⭐ Featured Cover
                              </span>
                            )}
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> View Photo
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No images uploaded</p>
                </div>
              )}
            </div>
          )}

          {/* Owner & Authorised Tab */}
          {activeTab === 'owner' && (
            <div className="space-y-4">
              {/* Owner Details Card */}
              <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200">
                <h3 className="text-sm font-bold mb-3 text-amber-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-600" />
                  Venue Owner Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-500 block mb-0.5">Owner Full Name</label>
                    <p className="text-sm font-bold text-gray-900">{venue.ownerInfo?.fullName || venue.owner?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Owner Email</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {venue.ownerInfo?.email || venue.owner?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Owner Mobile</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {venue.ownerInfo?.mobile || venue.owner?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Alternate Mobile</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {venue.ownerInfo?.alternatePhone || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Authorised Person Card */}
              <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-bold mb-3 text-blue-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Booking Authorised Person (For Booking & Coordination)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-500 block mb-0.5">Authorised Person Name</label>
                    <p className="text-sm text-gray-900 font-bold">{venue.ownerInfo?.authorisedPerson?.fullName || venue.ownerInfo?.authorisedPerson?.name || 'Same as Owner'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Designation / Role</label>
                    <p className="text-sm text-gray-900 font-semibold">{venue.ownerInfo?.authorisedPerson?.designation || venue.ownerInfo?.authorisedPerson?.role || 'Venue Owner / Proprietor'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Authorised Mobile</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {venue.ownerInfo?.authorisedPerson?.mobile || venue.ownerInfo?.authorisedPerson?.phone || venue.ownerInfo?.mobile || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Authorised Alternate Mobile</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {venue.ownerInfo?.authorisedPerson?.alternatePhone || 'None'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-gray-500 block mb-0.5">Authorised Email</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {venue.ownerInfo?.authorisedPerson?.email || venue.ownerInfo?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Pages & Web Links Card */}
              {(venue.socialLinks?.website || venue.socialLinks?.instagram || venue.socialLinks?.facebook || venue.socialLinks?.youtube || venue.socialLinks?.virtualTour) && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-primary-600" />
                    Social Media & Virtual Tour Links
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {venue.socialLinks?.website && (
                      <div>
                        <span className="text-gray-500 block mb-0.5">Official Website:</span>
                        <a href={venue.socialLinks.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline font-semibold flex items-center gap-1 truncate">
                          <Globe className="w-3 h-3 flex-shrink-0" /> {venue.socialLinks.website}
                        </a>
                      </div>
                    )}
                    {venue.socialLinks?.virtualTour && (
                      <div>
                        <span className="text-gray-500 block mb-0.5">360° Virtual Tour:</span>
                        <a href={venue.socialLinks.virtualTour} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline font-semibold flex items-center gap-1 truncate">
                          <ExternalLink className="w-3 h-3 flex-shrink-0" /> {venue.socialLinks.virtualTour}
                        </a>
                      </div>
                    )}
                    {venue.socialLinks?.instagram && (
                      <div>
                        <span className="text-gray-500 block mb-0.5">Instagram Profile:</span>
                        <a href={venue.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline font-semibold flex items-center gap-1 truncate">
                          <ExternalLink className="w-3 h-3 flex-shrink-0" /> {venue.socialLinks.instagram}
                        </a>
                      </div>
                    )}
                    {venue.socialLinks?.facebook && (
                      <div>
                        <span className="text-gray-500 block mb-0.5">Facebook Page:</span>
                        <a href={venue.socialLinks.facebook} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold flex items-center gap-1 truncate">
                          <ExternalLink className="w-3 h-3 flex-shrink-0" /> {venue.socialLinks.facebook}
                        </a>
                      </div>
                    )}
                    {venue.socialLinks?.youtube && (
                      <div>
                        <span className="text-gray-500 block mb-0.5">YouTube Video:</span>
                        <a href={venue.socialLinks.youtube} target="_blank" rel="noreferrer" className="text-red-600 hover:underline font-semibold flex items-center gap-1 truncate">
                          <ExternalLink className="w-3 h-3 flex-shrink-0" /> {venue.socialLinks.youtube}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* 1. Authorised Person ID Proofs (Aadhaar & PAN) */}
              <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-bold mb-3 text-blue-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  1. Authorised Person ID Proofs (Aadhaar & PAN)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aadhaar Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-900">Aadhaar Card</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Mandatory</span>
                    </div>
                    <p className="text-xs font-mono font-bold text-gray-800 mb-3">
                      Number: {venue.documents?.idProof?.aadhaarNumber || venue.documents?.idProof?.number || 'Not provided'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-500 block mb-1">Front Image</span>
                        {(venue.documents?.idProof?.aadhaarFrontUrl || venue.documents?.idProof?.frontUrl) ? (
                          <a href={venue.documents.idProof.aadhaarFrontUrl || venue.documents.idProof.frontUrl} target="_blank" rel="noreferrer">
                            <img
                              src={venue.documents.idProof.aadhaarFrontUrl || venue.documents.idProof.frontUrl}
                              alt="Aadhaar Front"
                              className="w-full h-24 object-contain bg-gray-50 rounded border hover:opacity-90"
                            />
                          </a>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">No image</p>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block mb-1">Back Image</span>
                        {(venue.documents?.idProof?.aadhaarBackUrl || venue.documents?.idProof?.backUrl) ? (
                          <a href={venue.documents.idProof.aadhaarBackUrl || venue.documents.idProof.backUrl} target="_blank" rel="noreferrer">
                            <img
                              src={venue.documents.idProof.aadhaarBackUrl || venue.documents.idProof.backUrl}
                              alt="Aadhaar Back"
                              className="w-full h-24 object-contain bg-gray-50 rounded border hover:opacity-90"
                            />
                          </a>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">No image</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PAN Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-900">PAN Card</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Mandatory</span>
                    </div>
                    <p className="text-xs font-mono font-bold text-gray-800 mb-3">
                      Number: {venue.documents?.idProof?.panNumber || 'Not provided'}
                    </p>
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-1">PAN Card Image</span>
                      {(venue.documents?.idProof?.panUrl) ? (
                        <a href={venue.documents.idProof.panUrl} target="_blank" rel="noreferrer">
                          <img
                            src={venue.documents.idProof.panUrl}
                            alt="PAN Card"
                            className="w-full h-24 object-contain bg-gray-50 rounded border hover:opacity-90"
                          />
                        </a>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">No image</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner / Authorised Person Selfie */}
              {venue.documents?.selfieUrl && (
                <div className="bg-green-50/80 rounded-xl p-4 border border-green-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-green-900 mb-1">Live Captured Verification Selfie</h3>
                    <p className="text-xs text-gray-600">Captured during verification</p>
                  </div>
                  <a href={venue.documents.selfieUrl} target="_blank" rel="noreferrer">
                    <img
                      src={venue.documents.selfieUrl}
                      alt="Selfie"
                      className="w-20 h-20 object-cover rounded-xl border border-green-300 hover:opacity-90"
                    />
                  </a>
                </div>
              )}

              {/* 2. Business Documentation */}
              <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-200">
                <h3 className="text-sm font-bold mb-3 text-emerald-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  2. Business Documentation Proof
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-gray-500 block mb-1">Business Proof Type:</span>
                    <p className="text-sm font-bold text-emerald-950 bg-white px-3 py-1.5 rounded border border-emerald-200">
                      {venue.documents?.businessProof?.type || 'Not specified'}
                    </p>
                  </div>
                  {venue.documents?.businessProof?.otherSpecify && (
                    <div>
                      <span className="text-gray-500 block mb-1">Other Specified:</span>
                      <p className="text-sm font-semibold text-gray-900 bg-white px-3 py-1.5 rounded border border-emerald-200">
                        {venue.documents.businessProof.otherSpecify}
                      </p>
                    </div>
                  )}
                </div>
                {(venue.documents?.businessProof?.documentUrl || venue.documents?.businessProof?.url) && (
                  <div>
                    <a
                      href={venue.documents.businessProof.documentUrl || venue.documents.businessProof.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white px-3 py-2 rounded-lg border border-emerald-300"
                    >
                      <Download className="w-3.5 h-3.5" /> View / Download Business Proof
                    </a>
                  </div>
                )}
              </div>

              {/* 3. Property Documentation Proof */}
              <div className="bg-indigo-50/80 rounded-xl p-4 border border-indigo-200">
                <h3 className="text-sm font-bold mb-3 text-indigo-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  3. Property Ownership / Tenancy Proof
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-gray-500 block mb-1">Property Proof Type:</span>
                    <p className="text-sm font-bold text-indigo-950 bg-white px-3 py-1.5 rounded border border-indigo-200">
                      {venue.documents?.propertyProof?.type || 'Not specified'}
                    </p>
                  </div>
                  {venue.documents?.propertyProof?.otherSpecify && (
                    <div>
                      <span className="text-gray-500 block mb-1">Specified Detail:</span>
                      <p className="text-sm font-semibold text-gray-900 bg-white px-3 py-1.5 rounded border border-indigo-200">
                        {venue.documents.propertyProof.otherSpecify}
                      </p>
                    </div>
                  )}
                </div>
                {(venue.documents?.propertyProof?.documentUrl || venue.documents?.propertyProof?.url) && (
                  <div>
                    <a
                      href={venue.documents.propertyProof.documentUrl || venue.documents.propertyProof.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-white px-3 py-2 rounded-lg border border-indigo-300"
                    >
                      <Download className="w-3.5 h-3.5" /> View / Download Property Proof
                    </a>
                  </div>
                )}
              </div>

              {/* 4. Applicable Certificates & NOCs */}
              <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200">
                <h3 className="text-sm font-bold mb-3 text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  4. Applicable Certificates & Compliance NOCs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Fire NOC */}
                  <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
                    <span className="text-xs font-bold text-amber-900 block mb-1">Fire NOC Certificate</span>
                    {(venue.documents?.fireNOC?.url || venue.documents?.applicableCertificates?.fireNOCUrl) ? (
                      <a
                        href={venue.documents.fireNOC?.url || venue.documents.applicableCertificates?.fireNOCUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Fire NOC
                      </a>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">Not provided</p>
                    )}
                  </div>

                  {/* FSSAI Certificate */}
                  <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
                    <span className="text-xs font-bold text-amber-900 block mb-1">FSSAI Food License</span>
                    {(venue.documents?.fssai?.url || venue.documents?.applicableCertificates?.fssaiUrl) ? (
                      <a
                        href={venue.documents.fssai?.url || venue.documents.applicableCertificates?.fssaiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download FSSAI Certificate
                      </a>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">Not provided</p>
                    )}
                  </div>

                  {/* Trade License */}
                  {venue.documents?.applicableCertificates?.tradeLicenseUrl && (
                    <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
                      <span className="text-xs font-bold text-amber-900 block mb-1">Municipal Trade License</span>
                      <a
                        href={venue.documents.applicableCertificates.tradeLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Trade License
                      </a>
                    </div>
                  )}

                  {/* Pollution / Safety */}
                  {venue.documents?.applicableCertificates?.pollutionCertificateUrl && (
                    <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-xs">
                      <span className="text-xs font-bold text-amber-900 block mb-1">Pollution / Safety Clearance</span>
                      <a
                        href={venue.documents.applicableCertificates.pollutionCertificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Clearance Certificate
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* GST Registration Certificate */}
              <div className="bg-purple-50/80 rounded-xl p-4 border border-purple-200">
                <h3 className="text-sm font-bold mb-2 text-purple-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  GST Registration Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-0.5">Has GST Registration:</span>
                    <span className="font-bold text-gray-900">{venue.ownerInfo?.hasGST || venue.documents?.hasGST ? '✓ Yes' : '✗ No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">GST Number:</span>
                    <span className="font-mono font-bold text-purple-950">{venue.ownerInfo?.gstNumber || venue.documents?.gstNumber || 'N/A'}</span>
                  </div>
                  {(venue.documents?.gstDocUrl || venue.ownerInfo?.gstCertificateUrl) && (
                    <div className="sm:col-span-2 mt-1">
                      <a
                        href={venue.documents?.gstDocUrl || venue.ownerInfo?.gstCertificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-white px-3 py-1.5 rounded-lg border border-purple-300"
                      >
                        <Download className="w-3.5 h-3.5" /> Download GST Registration Certificate
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bank Details Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-200">
                <h3 className="text-sm font-bold mb-3 text-emerald-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Payout Bank Account Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-gray-500 block mb-0.5">Account Holder Name</label>
                    <p className="text-sm font-bold text-gray-900">{venue.bankDetails?.accountHolderName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Account Type</label>
                    <p className="text-sm font-bold text-emerald-800">{venue.bankDetails?.accountType || 'Current'} Account</p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Bank Name</label>
                    <p className="text-sm font-bold text-gray-900">{venue.bankDetails?.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Branch Name</label>
                    <p className="text-sm text-gray-900">{venue.bankDetails?.branchName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">IFSC Code</label>
                    <p className="text-sm font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded border border-emerald-200 inline-block">
                      {venue.bankDetails?.ifscCode || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-0.5">Account Number</label>
                    <p className="text-sm font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded border border-emerald-200 inline-block">
                      {venue.bankDetails?.accountNumber || 'N/A'}
                    </p>
                  </div>
                  {venue.bankDetails?.bankProofUrl && (
                    <div className="sm:col-span-2 pt-2">
                      <label className="text-gray-500 block mb-1">Bank Proof (Passbook / Cancelled Cheque)</label>
                      <a
                        href={venue.bankDetails.bankProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white px-3.5 py-2 rounded-lg border border-emerald-300 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Bank Proof Document
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rules & Policies Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Venue Rules & Policies */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold mb-3 text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary-600" />
                  Venue Rules & Guest Guidelines
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 block mb-1">Alcohol Policy:</span>
                    <span className={`font-bold ${venue.rulesAndPolicies?.alcoholAllowed ? 'text-green-700' : 'text-rose-700'}`}>
                      {venue.rulesAndPolicies?.alcoholAllowed ? '✓ Allowed' : '✗ Not Allowed'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 block mb-1">Smoking Policy:</span>
                    <span className={`font-bold ${venue.rulesAndPolicies?.smokingAllowed ? 'text-green-700' : 'text-rose-700'}`}>
                      {venue.rulesAndPolicies?.smokingAllowed ? '✓ Allowed' : '✗ Not Allowed'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 block mb-1">Outside Food Allowed:</span>
                    <span className={`font-bold ${venue.rulesAndPolicies?.outsideFoodAllowed ? 'text-green-700' : 'text-rose-700'}`}>
                      {venue.rulesAndPolicies?.outsideFoodAllowed ? '✓ Allowed' : '✗ Not Allowed'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 block mb-1">Music / DJ Deadline:</span>
                    <span className="font-bold text-gray-800">
                      {venue.rulesAndPolicies?.musicDeadline || '10:00 PM'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 block mb-1">Firecrackers Policy:</span>
                    <span className={`font-bold ${venue.rulesAndPolicies?.firecrackersAllowed ? 'text-green-700' : 'text-rose-700'}`}>
                      {venue.rulesAndPolicies?.firecrackersAllowed ? '✓ Allowed' : '✗ Not Allowed'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-gray-500 block mb-1">Pet Friendly:</span>
                    <span className={`font-bold ${venue.rulesAndPolicies?.petFriendly ? 'text-green-700' : 'text-rose-700'}`}>
                      {venue.rulesAndPolicies?.petFriendly ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>

                {venue.rulesAndPolicies?.customRules && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Custom House Rules</label>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-gray-700 whitespace-pre-line">
                      {venue.rulesAndPolicies.customRules}
                    </div>
                  </div>
                )}
              </div>

              {/* 4-Tier Custom Cancellation Policy */}
              <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200">
                <h3 className="text-sm font-bold mb-3 text-rose-950 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  4-Tier Custom Cancellation Policy
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">Tier 1: Before {venue.cancellationPolicy?.tier1?.days || 7} Days</span>
                    <p className="text-base font-bold text-emerald-600">{venue.cancellationPolicy?.tier1?.refundPercent ?? 100}% Refund</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">Tier 2: Within {venue.cancellationPolicy?.tier2?.days || 3} Days</span>
                    <p className="text-base font-bold text-amber-600">{venue.cancellationPolicy?.tier2?.refundPercent ?? 50}% Refund</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">Tier 3: Within {venue.cancellationPolicy?.tier3?.hours || 24} Hours</span>
                    <p className="text-base font-bold text-rose-600">{venue.cancellationPolicy?.tier3?.refundPercent ?? 0}% Refund</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">Tier 4: Event Day / No-Show</span>
                    <p className="text-base font-bold text-rose-700">{venue.cancellationPolicy?.tier4?.refundPercent ?? 0}% Refund</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Settings Tab (Admin Only) */}
          {activeTab === 'settings' && showActions && (venue.status === 'approved' || venue.status === 'suspended') && (
            <div className="space-y-4">
              {/* Effective Settings Preview */}
              {platformSettings && (
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-300">
                  <h3 className="text-xs font-semibold text-gray-600 mb-2">Effective Booking Settings</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-500 block mb-0.5">Venue GST</span>
                      <span className="font-semibold text-gray-900">
                        CGST {effectiveVenueGST.cgstRate}% + SGST {effectiveVenueGST.sgstRate}%
                      </span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        HSN {effectiveVenueGST.hsnCode} {localCustomGST.enabled ? '(Custom)' : '(Default)'}
                      </span>
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-500 block mb-0.5">Platform Fee</span>
                      <span className="font-semibold text-gray-900">{effectivePlatformFeeLabel}</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        CGST {effectivePlatformFee.platformCGSTRate}% + SGST {effectivePlatformFee.platformSGSTRate}% {localCustomPlatformFee.enabled ? '(Custom)' : '(Default)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom GST */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Custom Venue GST</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localCustomGST.enabled}
                      onChange={(e) => setLocalCustomSettings({
                        ...localCustomSettings,
                        customGST: { ...localCustomGST, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                {localCustomGST.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">CGST %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={localCustomGST.cgstRate}
                        onChange={(e) => setLocalCustomSettings({
                          ...localCustomSettings,
                          customGST: { ...localCustomGST, cgstRate: Number(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">SGST %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={localCustomGST.sgstRate}
                        onChange={(e) => setLocalCustomSettings({
                          ...localCustomSettings,
                          customGST: { ...localCustomGST, sgstRate: Number(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">HSN Code</label>
                      <input
                        type="text"
                        value={localCustomGST.hsnCode}
                        onChange={(e) => setLocalCustomSettings({
                          ...localCustomSettings,
                          customGST: { ...localCustomGST, hsnCode: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Platform Fee */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Custom Platform Fee</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localCustomPlatformFee.enabled}
                      onChange={(e) => setLocalCustomSettings({
                        ...localCustomSettings,
                        customPlatformFee: { ...localCustomPlatformFee, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                {localCustomPlatformFee.enabled && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">Fee Type</label>
                        <select
                          value={localCustomPlatformFee.feeType}
                          onChange={(e) => setLocalCustomSettings({
                            ...localCustomSettings,
                            customPlatformFee: { ...localCustomPlatformFee, feeType: e.target.value }
                          })}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">
                          {localCustomPlatformFee.feeType === 'percentage' ? 'Fee Percentage (%)' : 'Fee Amount (₹)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step={localCustomPlatformFee.feeType === 'percentage' ? '0.01' : '1'}
                          value={localCustomPlatformFee.feeValue}
                          onChange={(e) => setLocalCustomSettings({
                            ...localCustomSettings,
                            customPlatformFee: { ...localCustomPlatformFee, feeValue: Number(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleUpdateSettings}
                  disabled={settingsLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {settingsLoading ? 'Saving...' : 'Save Settings Override'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-500">ID: {currentVenue._id}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setPdfLoading(true);
                try {
                  await downloadVenuePDF(currentVenue, platformSettings);
                } finally {
                  setPdfLoading(false);
                }
              }}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              {pdfLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{pdfLoading ? 'Generating PDF...' : 'Download Venue PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* ── Modal 1: Status Change with Reason (Reject / Suspend / Custom) ── */}
      {statusModal.open && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  statusModal.targetStatus === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 capitalize">
                    {statusModal.targetStatus === 'rejected' ? 'Reject Venue Listing' : 'Suspend Venue Listing'}
                  </h3>
                  <p className="text-[11px] text-gray-500">{currentVenue.businessName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusModal({ open: false, targetStatus: '', reason: '', customReason: '' })}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              Please specify a reason for marking this venue as <strong className="uppercase text-gray-800">{statusModal.targetStatus}</strong>. This reason will be recorded in audit history and notified to the owner.
            </p>

            {/* Reason Selection Dropdown */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Select Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={statusModal.reason}
                onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Choose a standard reason --</option>
                {(statusModal.targetStatus === 'rejected' ? REJECTION_REASONS : SUSPENSION_REASONS).map((r, idx) => (
                  <option key={idx} value={r}>
                    {r === 'other' ? 'Other / Custom Reason (Specify below)' : r}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Reason Textarea */}
            {(statusModal.reason === 'other' || statusModal.customReason) && (
              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Custom Reason Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={statusModal.customReason}
                  onChange={(e) => setStatusModal({ ...statusModal, customReason: e.target.value })}
                  placeholder="Enter detailed reason description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStatusModal({ open: false, targetStatus: '', reason: '', customReason: '' })}
                className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  submittingAction || 
                  !statusModal.reason || 
                  (statusModal.reason === 'other' && !statusModal.customReason?.trim())
                }
                onClick={() => {
                  const finalReason = statusModal.reason === 'other' 
                    ? statusModal.customReason?.trim() 
                    : (statusModal.customReason?.trim() ? `${statusModal.reason} - ${statusModal.customReason.trim()}` : statusModal.reason);
                  executeStatusChange(statusModal.targetStatus, finalReason);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 ${
                  statusModal.targetStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {submittingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  `Confirm ${statusModal.targetStatus === 'rejected' ? 'Rejection' : 'Suspension'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Stop Booking Reason Modal ── */}
      {stopBookingModal.open && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <PauseCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Stop Online Bookings</h3>
                  <p className="text-[11px] text-gray-500">{currentVenue.businessName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStopBookingModal({ open: false, reason: '', customReason: '' })}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Notice:</span> Stopping bookings will immediately pause online customer checkouts for this venue across the platform. Default is Allowed.
            </div>

            {/* Reason Selection Dropdown */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reason for Stopping Bookings (Optional)
              </label>
              <select
                value={stopBookingModal.reason}
                onChange={(e) => setStopBookingModal({ ...stopBookingModal, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Choose reason (or type below) --</option>
                {STOP_BOOKING_REASONS.map((r, idx) => (
                  <option key={idx} value={r}>
                    {r === 'other' ? 'Other / Custom Reason (Specify below)' : r}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Reason / Notes */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Custom Notes / Reason Details
              </label>
              <textarea
                value={stopBookingModal.customReason}
                onChange={(e) => setStopBookingModal({ ...stopBookingModal, customReason: e.target.value })}
                placeholder="e.g. Under scheduled maintenance until next Monday..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStopBookingModal({ open: false, reason: '', customReason: '' })}
                className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => {
                  const finalReason = stopBookingModal.reason === 'other' 
                    ? stopBookingModal.customReason?.trim() 
                    : (stopBookingModal.customReason?.trim() 
                        ? (stopBookingModal.reason ? `${stopBookingModal.reason} - ${stopBookingModal.customReason.trim()}` : stopBookingModal.customReason.trim())
                        : stopBookingModal.reason);
                  executeToggleBooking(true, finalReason || 'Bookings temporarily stopped by administration');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {submittingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  '🚫 Confirm Stop Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
