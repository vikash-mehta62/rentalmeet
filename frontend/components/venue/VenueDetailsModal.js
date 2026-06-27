'use client';

import { useState } from 'react';
import VenueReviews from '@/components/venue/VenueReviews';
import {
  X, Building2, MapPin, IndianRupee, Calendar, Clock, Users, FileText,
  Image as ImageIcon, Utensils, CheckCircle, XCircle, Ban,
  Phone, Mail, User, CreditCard, FileCheck, Download
} from 'lucide-react';
import { normalizeCustomGST, normalizeCustomPlatformFee } from '@/lib/venuePricing';

const DEFAULT_CUSTOM_PLATFORM_FEE = { enabled: false, feeType: 'fixed', feeValue: 0, percentage: 0, platformCGSTRate: 9, platformSGSTRate: 9 };
const DEFAULT_CUSTOM_GST = { enabled: false, rate: 18, cgstRate: 9, sgstRate: 9, hsnCode: '9973' };

export default function VenueDetailsModal({ 
  venue, 
  onClose, 
  onStatusUpdate, 
  showActions = false, 
  platformSettings = null, 
  customSettings = null, 
  onUpdateSettings = null 
}) {
  const [activeTab, setActiveTab] = useState('basic');
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
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'amenities', label: 'Amenities', icon: Utensils },
    { id: 'pricing', label: 'Pricing', icon: IndianRupee },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'images', label: 'Photos', icon: ImageIcon },
    { id: 'owner', label: 'Owner Info', icon: User },
    { id: 'documents', label: 'Documents', icon: FileCheck },
    { id: 'reviews', label: 'Reviews', icon: FileText },
  ];

  if (showActions && (venue.status === 'approved' || venue.status === 'suspended')) {
    tabs.push({ id: 'settings', label: 'Custom Settings', icon: CreditCard });
  }

  const handleUpdateSettings = () => {
    if (onUpdateSettings) {
      onUpdateSettings({
        ...localCustomSettings,
        customPlatformFee: normalizeCustomPlatformFee(localCustomSettings.customPlatformFee, platformSettings || {}),
        customGST: normalizeCustomGST(localCustomSettings.customGST, platformSettings || {})
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-dark-800">{venue.businessName}</h2>
            <p className="text-xs text-gray-500">SKU: {venue.sku}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
                  className={`flex items-center gap-1.5 px-3 py-2.5 font-medium text-xs transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary-500 text-primary-600 bg-white -mb-px'
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Business Name</label>
                  <p className="text-sm text-gray-900">{venue.businessName}</p>
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
                  {(venue.status === 'rejected' || venue.status === 'resubmitted') && venue.rejectionReason && (
                    <div className={`mt-2 px-2.5 py-2 rounded-lg text-xs border ${
                      venue.status === 'resubmitted'
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <span className="font-semibold">
                        {venue.status === 'resubmitted' ? '↩ Previous rejection reason:' : '✗ Rejection reason:'}
                      </span>{' '}
                      {venue.rejectionReason}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Venue Type</label>
                  <p className="text-sm text-gray-900">{venue.venueType?.join(', ')}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Food Type</label>
                  <p className="text-sm text-gray-900">{venue.foodType || 'Veg'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Capacity</label>
                  <p className="text-sm text-gray-900">{venue.capacity} guests</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Area</label>
                  <p className="text-sm text-gray-900">{venue.areaSqft} sq.ft</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Total Bookings</label>
                  <p className="text-sm text-gray-900">{venue.totalBookings || 0}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Description</label>
                <p className="text-sm text-gray-700 leading-relaxed">{venue.description}</p>
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
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Address</label>
                  <p className="text-sm text-gray-900">{venue.location?.address}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Landmark</label>
                  <p className="text-sm text-gray-900">{venue.location?.landmark}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">State</label>
                  <p className="text-sm text-gray-900">{venue.location?.state}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">City</label>
                  <p className="text-sm text-gray-900">{venue.location?.city}</p>
                </div>
                {venue.location?.village && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Village</label>
                    <p className="text-sm text-gray-900">{venue.location?.village}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Area</label>
                  <p className="text-sm text-gray-900">{venue.location?.area}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Pincode</label>
                  <p className="text-sm text-gray-900">{venue.location?.pincode}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Parking</label>
                  <p className="text-sm text-gray-900">{venue.location?.parkingAvailability}</p>
                </div>
              </div>
              {venue.location?.nearestBusAuto && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Nearest Bus/Auto</label>
                  <p className="text-sm text-gray-900">{venue.location.nearestBusAuto}</p>
                </div>
              )}
              {venue.location?.nearestMetroTrain && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Nearest Metro/Train</label>
                  <p className="text-sm text-gray-900">{venue.location.nearestMetroTrain}</p>
                </div>
              )}
              {venue.location?.googleMapLink && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Google Map</label>
                  <a
                    href={venue.location.googleMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline text-sm font-medium"
                  >
                    View on Google Maps →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Amenities Tab */}
          {activeTab === 'amenities' && (
            <div className="space-y-4">
              {/* Basic Amenities */}
              {venue.amenities?.basic && venue.amenities.basic.filter(a => a.available).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4" />
                    Basic Amenities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {venue.amenities.basic.map((amenity, idx) => (
                      amenity.available && (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between mb-0.5">
                            <span className="font-medium text-gray-900 text-sm">{amenity.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              amenity.type === 'Included' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {amenity.type}
                            </span>
                          </div>
                          {amenity.type === 'Paid' && amenity.rate && (
                            <p className="text-xs text-gray-600">
                              ₹{amenity.rate} {amenity.rateType === 'Per Use' ? '/ use' : ''}
                            </p>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Beverages */}
              {venue.amenities?.beverages && venue.amenities.beverages.filter(b => b.available).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800">Beverages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {venue.amenities.beverages.map((bev, idx) => (
                      bev.available && (
                        <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="font-medium text-gray-900 text-sm mb-0.5">{bev.name}</p>
                          {bev.brand && <p className="text-xs text-gray-600 mb-0.5">Brand: {bev.brand}</p>}
                          {bev.ratePerUnit && <p className="text-xs text-primary-600 font-semibold">₹{bev.ratePerUnit}/unit</p>}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Refreshment/Food */}
              {venue.amenities?.refreshmentFood && venue.amenities.refreshmentFood.filter(f => f.available).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800">Refreshments & Food</h3>
                  <div className="space-y-2">
                    {venue.amenities.refreshmentFood.map((food, idx) => (
                      food.available && (
                        <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-medium text-gray-900 text-sm">{food.name}</p>
                            {food.ratePerPlate && <p className="text-primary-600 font-semibold text-sm">₹{food.ratePerPlate}/plate</p>}
                          </div>
                          {food.items && <p className="text-xs text-gray-600">{food.items}</p>}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Lunch Thalis */}
              {venue.amenities?.lunchThalis && venue.amenities.lunchThalis.filter(t => t.available).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800">Lunch Thalis</h3>
                  <div className="space-y-3">
                    {venue.amenities.lunchThalis.map((thali, idx) => (
                      thali.available && (
                        <div key={idx} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                          <h4 className="font-semibold text-gray-900 text-sm mb-2">{thali.thaliType}</h4>
                          {thali.categories && thali.categories.map((cat, catIdx) => (
                            <div key={catIdx} className="bg-white rounded-lg p-2.5 mb-1.5 last:mb-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-medium text-gray-800 text-xs">{cat.category}</span>
                                <span className="text-primary-600 font-semibold text-xs">₹{cat.ratePerPlate}/plate</span>
                              </div>
                              <p className="text-xs text-gray-600">{cat.numberOfItems} items: {cat.itemNames}</p>
                            </div>
                          ))}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Kitchen & Dining */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {venue.amenities?.kitchenAccess?.available && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="font-medium text-gray-900 text-sm mb-0.5">Kitchen Access</p>
                    <p className="text-xs text-gray-600">
                      {venue.amenities.kitchenAccess.type}
                      {venue.amenities.kitchenAccess.type === 'Paid' && venue.amenities.kitchenAccess.charges && 
                        ` - ₹${venue.amenities.kitchenAccess.charges}`}
                    </p>
                  </div>
                )}
                {venue.amenities?.diningArea?.available && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="font-medium text-gray-900 text-sm mb-0.5">Dining Area</p>
                    <p className="text-xs text-gray-600">
                      {venue.amenities.diningArea.type}
                      {venue.amenities.diningArea.type === 'Paid' && venue.amenities.diningArea.charges && 
                        ` - ₹${venue.amenities.diningArea.charges}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Amenities */}
              {venue.amenities?.additional && venue.amenities.additional.filter(a => a.available).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-800">Additional Amenities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {venue.amenities.additional.map((amenity, idx) => (
                      amenity.available && (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between mb-0.5">
                            <span className="font-medium text-gray-900 text-sm">{amenity.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              amenity.type === 'Included' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {amenity.type}
                            </span>
                          </div>
                          {amenity.type === 'Paid' && amenity.charges && (
                            <p className="text-xs text-gray-600">₹{amenity.charges}</p>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {!venue.amenities?.basic?.filter(a => a.available).length && 
               !venue.amenities?.beverages?.filter(b => b.available).length &&
               !venue.amenities?.refreshmentFood?.filter(f => f.available).length &&
               !venue.amenities?.lunchThalis?.filter(t => t.available).length &&
               !venue.amenities?.kitchenAccess?.available &&
               !venue.amenities?.diningArea?.available &&
               !venue.amenities?.additional?.filter(a => a.available).length && (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No amenities information available</p>
                </div>
              )}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {venue.pricing?.enabledOptions?.perHour && venue.pricing?.perHour && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 text-sm mb-2 text-center">Per Hour</h4>
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Weekday</p>
                        <p className="text-lg font-bold text-primary-600">₹{venue.pricing.perHour.weekday}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Weekend</p>
                        <p className="text-lg font-bold text-primary-600">₹{venue.pricing.perHour.weekend}</p>
                      </div>
                    </div>
                  </div>
                )}
                {venue.pricing?.enabledOptions?.halfDay && venue.pricing?.halfDay && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-800 text-sm mb-2 text-center">Half Day</h4>
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Weekday</p>
                        <p className="text-lg font-bold text-primary-600">₹{venue.pricing.halfDay.weekday}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Weekend</p>
                        <p className="text-lg font-bold text-primary-600">₹{venue.pricing.halfDay.weekend}</p>
                      </div>
                    </div>
                  </div>
                )}
                {venue.pricing?.enabledOptions?.fullDay && venue.pricing?.fullDay && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-gray-800 text-sm mb-2 text-center">Full Day</h4>
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Weekday</p>
                        <p className="text-lg font-bold text-primary-600">₹{venue.pricing.fullDay.weekday}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Weekend</p>
                        <p className="text-lg font-bold text-primary-600">₹{venue.pricing.fullDay.weekend}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {venue.pricing?.extraHourRate && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Extra Hour Charges</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-0.5">Weekday</p>
                      <p className="text-base font-bold text-primary-600">₹{venue.pricing.extraHourRate.weekday}/hr</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-500 mb-0.5">Weekend</p>
                      <p className="text-base font-bold text-primary-600">₹{venue.pricing.extraHourRate.weekend}/hr</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Platform Charges Info */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h4 className="font-semibold text-gray-800 text-sm mb-2">Platform Charges</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">GST Rate</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {normalizedVenueGST.enabled
                        ? `CGST ${normalizedVenueGST.cgstRate}% + SGST ${normalizedVenueGST.sgstRate}% (Custom)`
                        : 'Default'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Platform Fee</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {normalizedVenuePlatformFee.enabled 
                        ? `${normalizedVenuePlatformFee.feeType === 'fixed' ? 'Rs.' : ''}${normalizedVenuePlatformFee.feeValue}${normalizedVenuePlatformFee.feeType === 'percentage' ? '%' : ''} (Custom)` 
                        : 'Default'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Opening Time</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {venue.availability?.openingTime || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Closing Time</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {venue.availability?.closingTime || 'Not specified'}
                  </p>
                </div>
              </div>
              
              {venue.availability?.availableDays && venue.availability.availableDays.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Available Days</label>
                  <div className="flex flex-wrap gap-1.5">
                    {venue.availability.availableDays.map((day, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {venue.availability?.advanceBookingRule && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Advance Booking Rule</label>
                  <p className="text-sm text-gray-900">{venue.availability.advanceBookingRule}</p>
                </div>
              )}
              
              {venue.availability?.blackoutDates && venue.availability.blackoutDates.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Blackout Dates</label>
                  <div className="space-y-1.5">
                    {venue.availability.blackoutDates.map((blackout, idx) => (
                      <div key={idx} className="bg-red-50 rounded-lg p-2.5 border border-red-200">
                        <p className="font-medium text-gray-900 text-sm">
                          {new Date(blackout.date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                        {blackout.reason && <p className="text-xs text-gray-600 mt-0.5">{blackout.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              {venue.images && venue.images.length > 0 ? (
                <>
                  {['Featured', 'Exterior', 'Interior', 'Amenities', 'Additional'].map(category => {
                    const categoryImages = venue.images.filter(img => img.category === category);
                    if (categoryImages.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h3 className="text-sm font-semibold mb-2 text-gray-800">{category} Images</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {categoryImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={img.url}
                                alt={`${category} ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              />
                              {img.isFeatured && (
                                <span className="absolute top-1.5 right-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                                  Featured
                                </span>
                              )}
                              <a
                                href={img.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                              >
                                <span className="text-white text-xs font-semibold flex items-center gap-1">
                                  <Download className="w-3 h-3" />
                                  View
                                </span>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No images uploaded</p>
                </div>
              )}
            </div>
          )}

          {/* Owner Info Tab */}
          {activeTab === 'owner' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold mb-3 text-blue-900 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name</label>
                    <p className="text-sm text-gray-900">{venue.ownerInfo?.fullName || venue.owner?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Role</label>
                    <p className="text-sm text-gray-900">{venue.ownerInfo?.role || 'Owner'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {venue.ownerInfo?.email || venue.owner?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Mobile</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {venue.ownerInfo?.mobile || venue.owner?.phone || 'N/A'}
                    </p>
                  </div>
                  {venue.ownerInfo?.alternatePhone && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Alternate Phone</label>
                      <p className="text-sm text-gray-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {venue.ownerInfo.alternatePhone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* GST Information */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-semibold mb-2 text-green-900">GST Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Has GST</label>
                    <p className="text-sm text-gray-900">
                      {venue.ownerInfo?.hasGST ? '✓ Yes' : '✗ No'}
                    </p>
                  </div>
                  {venue.ownerInfo?.hasGST && venue.ownerInfo?.gstNumber && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">GST Number</label>
                      <p className="text-sm text-gray-900 font-mono bg-white px-2.5 py-1.5 rounded border border-green-300">
                        {venue.ownerInfo.gstNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Details */}
              {venue.bankDetails && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold mb-2 text-purple-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Account Holder</label>
                      <p className="text-sm text-gray-900">{venue.bankDetails.accountHolderName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Account Type</label>
                      <p className="text-sm text-gray-900">{venue.bankDetails.accountType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Bank Name</label>
                      <p className="text-sm text-gray-900">{venue.bankDetails.bankName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Branch</label>
                      <p className="text-sm text-gray-900">{venue.bankDetails.branchName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">IFSC Code</label>
                      <p className="text-sm text-gray-900 font-mono bg-white px-2.5 py-1.5 rounded border border-purple-300">
                        {venue.bankDetails.ifscCode || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Account Number</label>
                      <p className="text-sm text-gray-900 font-mono bg-white px-2.5 py-1.5 rounded border border-purple-300">
                        {venue.bankDetails.accountNumber ? '****' + venue.bankDetails.accountNumber.slice(-4) : 'N/A'}
                      </p>
                    </div>
                    {venue.bankDetails.bankProofUrl && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Bank Proof (Passbook / Cancelled Cheque)</label>
                        <a href={venue.bankDetails.bankProofUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary-600 font-semibold underline hover:text-primary-700">
                          View Document
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
              {/* ID Proof */}
              {venue.documents?.idProof && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold mb-3 text-blue-900 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" />
                    ID Proof
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Type</label>
                        <p className="text-sm text-gray-900 bg-white px-2.5 py-1.5 rounded border border-blue-300">
                          {venue.documents.idProof.type}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Number</label>
                        <p className="text-sm text-gray-900 font-mono bg-white px-2.5 py-1.5 rounded border border-blue-300">
                          {venue.documents.idProof.number}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {venue.documents.idProof.frontUrl && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Front Side</label>
                          <img
                            src={venue.documents.idProof.frontUrl}
                            alt="ID Proof Front"
                            className="w-full h-40 object-contain bg-white rounded-lg border border-gray-300 p-2"
                          />
                          <a
                            href={venue.documents.idProof.frontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-xs mt-1.5 inline-flex items-center gap-1 font-medium"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                      )}
                      {venue.documents.idProof.backUrl && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Back Side</label>
                          <img
                            src={venue.documents.idProof.backUrl}
                            alt="ID Proof Back"
                            className="w-full h-40 object-contain bg-white rounded-lg border border-gray-300 p-2"
                          />
                          <a
                            href={venue.documents.idProof.backUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-xs mt-1.5 inline-flex items-center gap-1 font-medium"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Selfie */}
              {venue.documents?.selfieUrl && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-semibold mb-2 text-green-900">Owner Selfie</h3>
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={venue.documents.selfieUrl}
                      alt="Owner Selfie"
                      className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <a
                      href={venue.documents.selfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-xs inline-flex items-center gap-1 font-medium"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                  </div>
                </div>
              )}

              {/* Business Proof */}
              {venue.documents?.businessProof && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-sm font-semibold mb-3 text-orange-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Business Proof
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Type</label>
                        <p className="text-sm text-gray-900 bg-white px-2.5 py-1.5 rounded border border-orange-300">
                          {venue.documents.businessProof.type}
                        </p>
                      </div>
                      {venue.documents.businessProof.otherSpecify && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Specify</label>
                          <p className="text-sm text-gray-900 bg-white px-2.5 py-1.5 rounded border border-orange-300">
                            {venue.documents.businessProof.otherSpecify}
                          </p>
                        </div>
                      )}
                    </div>
                    {venue.documents.businessProof.documentUrl && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1.5">Document</label>
                        {venue.documents.businessProof.documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={venue.documents.businessProof.documentUrl}
                            alt="Business Proof"
                            className="w-full max-w-xl h-48 object-contain bg-white rounded-lg border border-gray-300 p-2"
                          />
                        ) : (
                          <div className="bg-white rounded-lg p-4 border border-gray-300 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-gray-400" />
                            <div>
                              <p className="text-gray-700 text-sm font-medium">Document uploaded</p>
                              <p className="text-xs text-gray-500">Click download to view</p>
                            </div>
                          </div>
                        )}
                        <a
                          href={venue.documents.businessProof.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-xs mt-2 inline-flex items-center gap-1 font-medium"
                        >
                          <Download className="w-3 h-3" />
                          Download Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                        onChange={(e) => {
                          const cgstRate = parseFloat(e.target.value) || 0;
                          const next = { ...localCustomGST, cgstRate, rate: cgstRate + localCustomGST.sgstRate };
                          setLocalCustomSettings({ ...localCustomSettings, customGST: next });
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                        onChange={(e) => {
                          const sgstRate = parseFloat(e.target.value) || 0;
                          const next = { ...localCustomGST, sgstRate, rate: localCustomGST.cgstRate + sgstRate };
                          setLocalCustomSettings({ ...localCustomSettings, customGST: next });
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                        placeholder={platformSettings?.venueHSN || '9973'}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <p className="md:col-span-3 text-xs text-gray-500">
                      Total GST: {(localCustomGST.cgstRate + localCustomGST.sgstRate).toLocaleString('en-IN')}%
                    </p>
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">Fee Type</label>
                      <select
                        value={localCustomPlatformFee.feeType}
                        onChange={(e) => setLocalCustomSettings({
                          ...localCustomSettings,
                          customPlatformFee: { ...localCustomPlatformFee, feeType: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      >
                        <option value="fixed">Fixed Amount (₹)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">
                        Fee Value {localCustomPlatformFee.feeType === 'fixed' ? '(Rs.)' : '(%)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={localCustomPlatformFee.feeType === 'fixed' ? '1' : '0.01'}
                        value={localCustomPlatformFee.feeValue}
                        onChange={(e) => setLocalCustomSettings({
                          ...localCustomSettings,
                          customPlatformFee: { ...localCustomPlatformFee, feeValue: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">CGST on Fee %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={localCustomPlatformFee.platformCGSTRate}
                        onChange={(e) => setLocalCustomSettings({
                          ...localCustomSettings,
                          customPlatformFee: { ...localCustomPlatformFee, platformCGSTRate: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">SGST on Fee %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={localCustomPlatformFee.platformSGSTRate}
                        onChange={(e) => setLocalCustomSettings({
                          ...localCustomSettings,
                          customPlatformFee: { ...localCustomPlatformFee, platformSGSTRate: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <p className="md:col-span-4 text-xs text-gray-500">
                      Platform fee GST: {(localCustomPlatformFee.platformCGSTRate + localCustomPlatformFee.platformSGSTRate).toLocaleString('en-IN')}%
                    </p>
                  </div>
                )}
              </div>

              {/* Update Settings Button */}
              <button
                onClick={handleUpdateSettings}
                className="w-full px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                Update Custom Settings
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && onStatusUpdate && (
          <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex-shrink-0">
            <div className="flex gap-2">
              {(venue.status === 'pending' || venue.status === 'resubmitted') && (
                <>
                  <button
                    onClick={() => onStatusUpdate(venue._id, 'approve')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => onStatusUpdate(venue._id, 'reject')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {venue.status === 'approved' && (
                <button
                  onClick={() => onStatusUpdate(venue._id, 'suspend')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  <Ban className="w-4 h-4" />
                  Suspend
                </button>
              )}
              {venue.status === 'suspended' && (
                <button
                  onClick={() => onStatusUpdate(venue._id, 'activate')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Activate
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
