'use client';

import { useState } from 'react';
import VenueReviews from '@/components/venue/VenueReviews';
import {
  X, Building2, MapPin, IndianRupee, Calendar, Clock, Users, FileText,
  Image as ImageIcon, Utensils, CheckCircle, XCircle, Ban, Loader2,
  Phone, Mail, User, CreditCard, FileCheck, Download, Edit3, Navigation,
  Bus, Train, ShieldCheck, Check, Sparkles, Shield, Wifi, Coffee
} from 'lucide-react';
import { normalizeCustomGST, normalizeCustomPlatformFee } from '@/lib/venuePricing';
import { downloadVenuePDF } from '@/utils/generateVenuePDF';

const DEFAULT_CUSTOM_PLATFORM_FEE = { enabled: false, feeType: 'fixed', feeValue: 0, percentage: 0, platformCGSTRate: 9, platformSGSTRate: 9 };
const DEFAULT_CUSTOM_GST = { enabled: false, rate: 18, cgstRate: 9, sgstRate: 9, hsnCode: '9973' };

export default function VenueDetailsModal({ 
  venue, 
  onClose, 
  onStatusUpdate, 
  showActions = false, 
  platformSettings = null, 
  customSettings = null, 
  onUpdateSettings = null,
  onQuickEdit = null
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [actionLoading, setActionLoading] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [localCustomSettings, setLocalCustomSettings] = useState(customSettings || {
    customPlatformFee: DEFAULT_CUSTOM_PLATFORM_FEE,
    customGST: DEFAULT_CUSTOM_GST
  });
  const normalizedVenuePlatformFee = normalizeCustomPlatformFee(venue.customPlatformFee, platformSettings || {});
  const normalizedVenueGST = normalizeCustomGST(venue.customGST || DEFAULT_CUSTOM_GST, platformSettings || {});
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
    { id: 'pricing', label: 'Pricing & Timings', icon: IndianRupee },
    { id: 'images', label: 'Photos', icon: ImageIcon },
    { id: 'owner', label: 'Owner & Authorised', icon: User },
    { id: 'documents', label: 'Documents & Proofs', icon: FileCheck },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
    { id: 'reviews', label: 'Reviews', icon: FileText },
  ];

  if (showActions && (venue.status === 'approved' || venue.status === 'suspended')) {
    tabs.push({ id: 'settings', label: 'Custom Settings', icon: CreditCard });
  }

  const handleAction = async (action) => {
    if (actionLoading) return;
    setActionLoading(action);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(venue._id, action);
      }
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setActionLoading(null);
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
  const basicAmenitiesList = (venue.amenities?.basic || []).map(a => 
    typeof a === 'string' ? { name: a, available: true, type: 'Included' } : a
  ).filter(a => a && a.available !== false);

  const additionalFacilitiesList = (venue.amenities?.additional || []).map(a => 
    typeof a === 'string' ? { name: a, available: true, type: 'Included' } : a
  ).filter(a => a && a.available !== false);

  const onlineBookingSched = venue.availability?.onlineBookingSchedule || venue.pricing?.onlineBookingSchedule;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-dark-800">{venue.businessName}</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                venue.status === 'approved' ? 'bg-green-100 text-green-700' :
                venue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                venue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                venue.status === 'resubmitted' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {venue.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">SKU: {venue.sku || 'N/A'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setPdfLoading(true);
                try {
                  await downloadVenuePDF(venue, platformSettings);
                } finally {
                  setPdfLoading(false);
                }
              }}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
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
                onClick={() => onQuickEdit(venue)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Business Name</label>
                  <p className="text-sm text-gray-900 font-bold">{venue.businessName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    venue.status === 'approved' ? 'bg-green-100 text-green-700' :
                    venue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    venue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    venue.status === 'resubmitted' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {venue.status?.toUpperCase()}
                  </span>
                  {(venue.status === 'rejected' || venue.status === 'resubmitted' || venue.status === 'suspended') && (venue.rejectionReason || venue.suspensionReason) && (
                    <div className="mt-2 px-2.5 py-2 rounded-lg text-xs border bg-red-50 border-red-200 text-red-800">
                      <span className="font-semibold">Reason:</span> {venue.rejectionReason || venue.suspensionReason}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Venue Type</label>
                  <p className="text-sm text-gray-900 font-semibold">{Array.isArray(venue.venueType) ? venue.venueType.join(', ') : venue.venueType}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Food Type Dropdown</label>
                  <p className="text-sm text-gray-900 font-semibold">{venue.foodType || 'Veg'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Capacity Dropdown</label>
                  <p className="text-sm text-gray-900 font-semibold">{venue.capacity} guests</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Total Area</label>
                  <p className="text-sm text-gray-900 font-semibold">{venue.areaSqft} sq.ft</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Total Bookings</label>
                  <p className="text-sm text-gray-900">{venue.totalBookings || 0}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Venue Description</label>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {venue.description || 'No description provided.'}
                </div>
              </div>
              {venue.rating > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Rating</label>
                    <p className="text-sm text-gray-900">⭐ {venue.rating.toFixed(1)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Reviews</label>
                    <p className="text-sm text-gray-900">{venue.reviewCount} reviews</p>
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
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Complete Address</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{venue.location?.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Landmark</label>
                  <p className="text-sm text-gray-900">{venue.location?.landmark || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Area / Locality</label>
                  <p className="text-sm text-gray-900">{venue.location?.area || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">City</label>
                  <p className="text-sm text-gray-900">{venue.location?.city || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">State</label>
                  <p className="text-sm text-gray-900">{venue.location?.state || 'N/A'}</p>
                </div>
                {venue.location?.village && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Village</label>
                    <p className="text-sm text-gray-900">{venue.location?.village}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Pincode</label>
                  <p className="text-sm text-gray-900">{venue.location?.pincode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Parking Availability Dropdown</label>
                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
                    {venue.location?.parkingAvailability || venue.location?.parkingType || 'Free'} Parking
                  </span>
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
                      <Train className="w-3.5 h-3.5 text-purple-600" /> Nearest Metro
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
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Google Maps</label>
                  <a
                    href={venue.location.googleMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Open Google Maps Direction →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Amenities Tab */}
          {activeTab === 'amenities' && (
            <div className="space-y-4">
              {/* Basic Amenities */}
              {basicAmenitiesList.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-primary-600" />
                    Basic Amenities
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {basicAmenitiesList.map((amenity, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-xs">{amenity.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          amenity.type === 'Paid' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {amenity.type || 'Included'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Beverages */}
              {venue.amenities?.beverages && venue.amenities.beverages.filter(b => b.available).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-blue-600" /> Beverages
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {venue.amenities.beverages.filter(b => b.available).map((bev, idx) => (
                      <div key={idx} className="bg-blue-50 rounded-lg p-2.5 border border-blue-200">
                        <p className="font-bold text-gray-900 text-xs mb-0.5">{bev.name}</p>
                        {bev.brand && <p className="text-[11px] text-gray-600">Brand: {bev.brand}</p>}
                        {bev.ratePerUnit && <p className="text-[11px] text-blue-700 font-bold">₹{bev.ratePerUnit}/unit</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Refreshment/Food */}
              {venue.amenities?.refreshmentFood && venue.amenities.refreshmentFood.filter(f => f.available).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-orange-600" /> Refreshments & Food
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {venue.amenities.refreshmentFood.filter(f => f.available).map((food, idx) => (
                      <div key={idx} className="bg-orange-50 rounded-lg p-2.5 border border-orange-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{food.name}</p>
                          {food.items && <p className="text-[11px] text-gray-600">{food.items}</p>}
                        </div>
                        {food.ratePerPlate && <span className="text-xs font-bold text-orange-700">₹{food.ratePerPlate}/plate</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lunch Thalis */}
              {venue.amenities?.lunchThalis && venue.amenities.lunchThalis.filter(t => t.available !== false).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800">Lunch Thalis</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {venue.amenities.lunchThalis.filter(t => t.available !== false).map((thali, idx) => (
                      <div key={idx} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <h4 className="font-bold text-gray-900 text-xs mb-1.5">{thali.thaliType || thali.type}</h4>
                        {thali.categories && thali.categories.map((cat, catIdx) => (
                          <div key={catIdx} className="bg-white rounded p-1.5 mb-1 text-xs flex items-center justify-between">
                            <span className="font-medium">{cat.category}</span>
                            <span className="font-bold text-primary-600">₹{cat.ratePerPlate}/plate</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kitchen & Dining */}
              {(venue.amenities?.kitchenAccess?.available || venue.amenities?.diningArea?.available) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {venue.amenities?.kitchenAccess?.available && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-xs">
                      <p className="font-bold text-purple-900">Kitchen Access</p>
                      <p className="text-gray-600">{venue.amenities.kitchenAccess.type} {venue.amenities.kitchenAccess.charges ? `- ₹${venue.amenities.kitchenAccess.charges}` : ''}</p>
                    </div>
                  )}
                  {venue.amenities?.diningArea?.available && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-xs">
                      <p className="font-bold text-purple-900">Dining Area</p>
                      <p className="text-gray-600">{venue.amenities.diningArea.type} {venue.amenities.diningArea.charges ? `- ₹${venue.amenities.diningArea.charges}` : ''}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Facilities */}
              {additionalFacilitiesList.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" /> Additional Facilities & Safety
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {additionalFacilitiesList.map((amenity, idx) => (
                      <div key={idx} className="bg-emerald-50 rounded-lg p-2 border border-emerald-200 flex items-center gap-2">
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
                  <span className="text-xs text-gray-500 block mb-1">Minimum Advance Booking Rule Dropdown:</span>
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
                ['Featured', 'Exterior', 'Interior', 'Amenities', 'Additional'].map(category => {
                  const categoryImages = venue.images.filter(img => img.category === category);
                  if (categoryImages.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-800">{category} Photos</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {categoryImages.map((img, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-xs">
                            <img
                              src={img.url}
                              alt={`${category} ${idx + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            {img.isFeatured && (
                              <span className="absolute top-1.5 right-1.5 bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                                Featured
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
                    <label className="text-gray-500 block mb-0.5">Designation / Role Dropdown</label>
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
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Authorised Person ID Proofs (Aadhaar & PAN) */}
              <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-bold mb-3 text-blue-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  Authorised Person ID Proofs (Aadhaar & PAN)
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
                          <img
                            src={venue.documents.idProof.aadhaarFrontUrl || venue.documents.idProof.frontUrl}
                            alt="Aadhaar Front"
                            className="w-full h-24 object-contain bg-gray-50 rounded border"
                          />
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">No image</p>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block mb-1">Back Image</span>
                        {(venue.documents?.idProof?.aadhaarBackUrl || venue.documents?.idProof?.backUrl) ? (
                          <img
                            src={venue.documents.idProof.aadhaarBackUrl || venue.documents.idProof.backUrl}
                            alt="Aadhaar Back"
                            className="w-full h-24 object-contain bg-gray-50 rounded border"
                          />
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
                        <img
                          src={venue.documents.idProof.panUrl}
                          alt="PAN Card"
                          className="w-full h-24 object-contain bg-gray-50 rounded border"
                        />
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
                    <h3 className="text-xs font-bold text-green-900 mb-1">Owner / Authorised Person Selfie</h3>
                    <p className="text-xs text-gray-600">Live captured verification photo</p>
                  </div>
                  <img
                    src={venue.documents.selfieUrl}
                    alt="Selfie"
                    className="w-20 h-20 object-cover rounded-xl border border-green-300"
                  />
                </div>
              )}

              {/* Business Documentation */}
              <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-200">
                <h3 className="text-sm font-bold mb-3 text-emerald-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Business Documentation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-gray-500 block mb-1">Business Proof Type Dropdown:</span>
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

              {/* GST Details */}
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

              {/* Fire NOC & FSSAI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-orange-50/80 rounded-xl p-3.5 border border-orange-200">
                  <h4 className="text-xs font-bold text-orange-900 mb-2">Fire NOC Certificate</h4>
                  {venue.documents?.fireNOC?.url ? (
                    <a
                      href={venue.documents.fireNOC.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-white px-3 py-1.5 rounded-lg border border-orange-300"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Fire NOC
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Not provided</p>
                  )}
                </div>

                <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-900 mb-2">FSSAI Certificate</h4>
                  {venue.documents?.fssai?.url ? (
                    <a
                      href={venue.documents.fssai.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-white px-3 py-1.5 rounded-lg border border-amber-300"
                    >
                      <Download className="w-3.5 h-3.5" /> Download FSSAI Certificate
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Not provided</p>
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
                    <label className="text-gray-500 block mb-0.5">Account Type Dropdown</label>
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

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <VenueReviews venueId={venue._id} />
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
          <span className="text-xs text-gray-500">ID: {venue._id}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setPdfLoading(true);
                try {
                  await downloadVenuePDF(venue, platformSettings);
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
    </div>
  );
}
