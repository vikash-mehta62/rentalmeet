'use client';

import { useState } from 'react';
import {
  X, Building2, MapPin, IndianRupee, Clock, Users,
  Check, Loader2, UserCheck, ShieldCheck, Sparkles, AlertCircle,
  FileCheck, Coffee, Utensils, Wifi, Shield, Lock, Navigation,
  Bus, Train, ParkingCircle, FileText, Camera, Award, CreditCard,
  Download, Eye, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const CAPACITY_OPTIONS = [
  '10-20', '20-30', '30-40', '40-50', '50-100', '100-200', '200-300',
  '300-400', '400-500', '500-600', '600-700', '700-800', '800-1000',
  '1000-1500', '1500-2000', 'More than 2000'
];

const PARKING_OPTIONS = ['Free', 'Paid', 'Limited', 'None'];

const FOOD_TYPE_OPTIONS = ['Veg', 'Non-Veg', 'Both'];

const ADVANCE_DAYS = ['1 Day', '2 Days', '3 Days', '4 Days', '5 Days', '6 Days'];
const ADVANCE_WEEKS = ['1 Week', '2 Weeks', '3 Weeks', '4 Weeks'];
const ALL_ADVANCE_RULES = [...ADVANCE_DAYS, ...ADVANCE_WEEKS];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BUSINESS_PROOF_TYPES = [
  'Udyam Aadhaar (MSME)',
  'Gumasta (Shop & Establishment)',
  'Building Permission',
  'Fire NOC',
  'FSSAI Certificate',
  'Firm Registration',
  'Trade License',
  'Certificate of Incorporation',
  'Partnership Deed',
  'Other'
];

const BASIC_AMENITIES = [
  'High-Speed WiFi', 'Air Conditioning', 'Projector', 'Projection Screen',
  'Whiteboard', 'Sound System', 'Microphone', 'LED / Smart TV',
  'Video Conferencing', 'Conference Phone', 'Comfortable Seating',
  'Printing / Photocopy'
];

const ADDITIONAL_FACILITIES = [
  'Separate Washrooms', 'Power Backup', 'Security Personnel',
  'Daily Cleaning', 'Reception Service', 'Storage Space',
  'Valet Parking', 'Wheelchair Access', 'Elevator And Lift'
];

export default function AdminVenueQuickEditModal({
  venue,
  token,
  venueTypes = [],
  onClose,
  onSaveSuccess
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // Form State initialized from venue
  const [formData, setFormData] = useState({
    businessName: venue?.businessName || '',
    description: venue?.description || '',
    areaSqft: venue?.areaSqft || 0,
    foodType: venue?.foodType || 'Veg',
    capacity: venue?.capacity || '50-100',
    status: venue?.status || 'approved',
    rejectionReason: venue?.rejectionReason || '',
    suspensionReason: venue?.suspensionReason || '',
    venueType: Array.isArray(venue?.venueType)
      ? venue.venueType
      : (venue?.venueType ? [venue.venueType] : []),

    // Location
    location: {
      address: venue?.location?.address || '',
      landmark: venue?.location?.landmark || '',
      city: venue?.location?.city || '',
      area: venue?.location?.area || '',
      state: venue?.location?.state || '',
      pincode: venue?.location?.pincode || '',
      googleMapLink: venue?.location?.googleMapLink || '',
      parkingType: venue?.location?.parkingType || 'Free',
      nearestMetro: venue?.location?.nearestMetro || '',
      nearestBusStop: venue?.location?.nearestBusStop || '',
      nearestRailway: venue?.location?.nearestRailway || ''
    },

    // Pricing
    pricing: {
      perHour: {
        weekday: venue?.pricing?.perHour?.weekday ?? 0,
        weekend: venue?.pricing?.perHour?.weekend ?? 0
      },
      halfDay: {
        weekday: venue?.pricing?.halfDay?.weekday ?? 0,
        weekend: venue?.pricing?.halfDay?.weekend ?? 0
      },
      fullDay: {
        weekday: venue?.pricing?.fullDay?.weekday ?? 0,
        weekend: venue?.pricing?.fullDay?.weekend ?? 0
      },
      extraHourRate: {
        weekday: venue?.pricing?.extraHourRate?.weekday ?? 0,
        weekend: venue?.pricing?.extraHourRate?.weekend ?? 0
      },
      enabledOptions: {
        perHour: venue?.pricing?.enabledOptions?.perHour ?? true,
        halfDay: venue?.pricing?.enabledOptions?.halfDay ?? false,
        fullDay: venue?.pricing?.enabledOptions?.fullDay ?? false
      },
      availableDays: venue?.pricing?.availableDays || venue?.availability?.availableDays || DAYS_OF_WEEK,
      advanceBookingRule: venue?.pricing?.advanceBookingRule || venue?.availability?.advanceBookingRule || '1 Day',
      confirmationHours: venue?.pricing?.confirmationHours ?? venue?.availability?.confirmationHours ?? 3
    },

    // Availability & Timings
    availability: {
      openingTime: venue?.availability?.openingTime || venue?.pricing?.openingTime || '09:00',
      closingTime: venue?.availability?.closingTime || venue?.pricing?.closingTime || '22:00',
      advanceBookingRule: venue?.availability?.advanceBookingRule || venue?.pricing?.advanceBookingRule || '1 Day',
      confirmationHours: venue?.availability?.confirmationHours ?? venue?.pricing?.confirmationHours ?? 3,
      availableDays: venue?.availability?.availableDays || venue?.pricing?.availableDays || DAYS_OF_WEEK,
      onlineBookingSchedule: {
        enabled: venue?.availability?.onlineBookingSchedule?.enabled ?? true,
        openingTime: venue?.availability?.onlineBookingSchedule?.openingTime || venue?.pricing?.onlineBookingOpeningTime || '06:00',
        closingTime: venue?.availability?.onlineBookingSchedule?.closingTime || venue?.pricing?.onlineBookingClosingTime || '02:00'
      }
    },

    // Amenities
    amenities: {
      basic: venue?.amenities?.basic || [],
      additional: venue?.amenities?.additional || []
    },

    // Owner & Authorised Person
    ownerInfo: {
      fullName: venue?.ownerInfo?.fullName || venue?.owner?.name || '',
      email: venue?.ownerInfo?.email || venue?.owner?.email || '',
      mobile: venue?.ownerInfo?.mobile || venue?.owner?.phone || '',
      alternatePhone: venue?.ownerInfo?.alternatePhone || '',
      role: venue?.ownerInfo?.role || 'Owner',
      hasGST: venue?.ownerInfo?.hasGST ?? (venue?.documents?.hasGST || false),
      gstNumber: venue?.ownerInfo?.gstNumber || venue?.documents?.gstNumber || '',
      authorisedPerson: {
        fullName: venue?.ownerInfo?.authorisedPerson?.fullName || venue?.ownerInfo?.authorisedPerson?.name || '',
        name: venue?.ownerInfo?.authorisedPerson?.name || venue?.ownerInfo?.authorisedPerson?.fullName || '',
        designation: venue?.ownerInfo?.authorisedPerson?.designation || venue?.ownerInfo?.authorisedPerson?.role || 'Authorised Person',
        role: venue?.ownerInfo?.authorisedPerson?.role || venue?.ownerInfo?.authorisedPerson?.designation || 'Authorised Person',
        mobile: venue?.ownerInfo?.authorisedPerson?.mobile || venue?.ownerInfo?.authorisedPerson?.phone || '',
        phone: venue?.ownerInfo?.authorisedPerson?.phone || venue?.ownerInfo?.authorisedPerson?.mobile || '',
        alternatePhone: venue?.ownerInfo?.authorisedPerson?.alternatePhone || '',
        email: venue?.ownerInfo?.authorisedPerson?.email || ''
      }
    },

    // Documents
    documents: {
      idProof: {
        type: venue?.documents?.idProof?.type || 'Both',
        number: venue?.documents?.idProof?.number || venue?.documents?.idProof?.aadhaarNumber || '',
        aadhaarNumber: venue?.documents?.idProof?.aadhaarNumber || venue?.documents?.idProof?.number || '',
        aadhaarFrontUrl: venue?.documents?.idProof?.aadhaarFrontUrl || venue?.documents?.idProof?.frontUrl || '',
        aadhaarBackUrl: venue?.documents?.idProof?.aadhaarBackUrl || venue?.documents?.idProof?.backUrl || '',
        panNumber: venue?.documents?.idProof?.panNumber || '',
        panUrl: venue?.documents?.idProof?.panUrl || ''
      },
      selfieUrl: venue?.documents?.selfieUrl || '',
      businessProof: {
        type: venue?.documents?.businessProof?.type || 'Udyam Aadhaar (MSME)',
        otherSpecify: venue?.documents?.businessProof?.otherSpecify || '',
        documentUrl: venue?.documents?.businessProof?.documentUrl || venue?.documents?.businessProof?.url || '',
        url: venue?.documents?.businessProof?.documentUrl || venue?.documents?.businessProof?.url || ''
      },
      hasGST: venue?.documents?.hasGST ?? venue?.ownerInfo?.hasGST ?? false,
      gstNumber: venue?.documents?.gstNumber || venue?.ownerInfo?.gstNumber || '',
      gstDocUrl: venue?.documents?.gstDocUrl || venue?.ownerInfo?.gstCertificateUrl || '',
      fireNOC: {
        url: venue?.documents?.fireNOC?.url || ''
      },
      fssai: {
        url: venue?.documents?.fssai?.url || ''
      }
    },

    // Bank Details
    bankDetails: {
      accountHolderName: venue?.bankDetails?.accountHolderName || '',
      accountNumber: venue?.bankDetails?.accountNumber || '',
      ifscCode: venue?.bankDetails?.ifscCode || '',
      bankName: venue?.bankDetails?.bankName || '',
      branchName: venue?.bankDetails?.branchName || '',
      accountType: venue?.bankDetails?.accountType || 'Current',
      bankProofUrl: venue?.bankDetails?.bankProofUrl || ''
    },

    // Custom Platform Fee & GST
    customPlatformFee: {
      enabled: venue?.customPlatformFee?.enabled ?? false,
      feeType: venue?.customPlatformFee?.feeType || 'percentage',
      feeValue: venue?.customPlatformFee?.feeValue ?? (venue?.customPlatformFee?.percentage || 0)
    },
    customGST: {
      enabled: venue?.customGST?.enabled ?? false,
      rate: venue?.customGST?.rate ?? 18,
      cgstRate: venue?.customGST?.cgstRate ?? 9,
      sgstRate: venue?.customGST?.sgstRate ?? 9,
      hsnCode: venue?.customGST?.hsnCode || '9973'
    }
  });

  const handleSave = async () => {
    if (!formData.businessName.trim()) {
      toast.error('Venue name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        documents: {
          ...formData.documents,
          businessProof: {
            type: formData.documents.businessProof?.type || 'Udyam Aadhaar (MSME)',
            otherSpecify: formData.documents.businessProof?.otherSpecify || '',
            documentUrl: formData.documents.businessProof?.documentUrl || formData.documents.businessProof?.url || ''
          }
        }
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues/${venue._id}/quick-edit`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Venue updated successfully! ✅');
        if (onSaveSuccess) {
          onSaveSuccess(data.venue);
        }
        onClose();
      } else {
        toast.error(data.message || 'Failed to update venue');
      }
    } catch (err) {
      console.error('Quick edit error:', err);
      toast.error('Failed to update venue');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General & Status', icon: Building2 },
    { id: 'location', label: 'Location & Parking', icon: MapPin },
    { id: 'pricing', label: 'Pricing', icon: IndianRupee },
    { id: 'timings', label: 'Timings & Window', icon: Clock },
    { id: 'amenities', label: 'Amenities', icon: Coffee },
    { id: 'contacts', label: 'Owner & Authorised', icon: UserCheck },
    { id: 'documents', label: 'Documents & Proofs', icon: FileCheck },
    { id: 'bank', label: 'Bank Account Details', icon: CreditCard },
    { id: 'fees', label: 'Fee & GST Settings', icon: ShieldCheck }
  ];

  const toggleVenueType = (typeName) => {
    const current = formData.venueType || [];
    if (current.includes(typeName)) {
      setFormData({
        ...formData,
        venueType: current.filter(t => t !== typeName)
      });
    } else {
      setFormData({
        ...formData,
        venueType: [...current, typeName]
      });
    }
  };

  const toggleAmenity = (category, item) => {
    const current = formData.amenities[category] || [];
    if (current.includes(item)) {
      setFormData({
        ...formData,
        amenities: {
          ...formData.amenities,
          [category]: current.filter(i => i !== item)
        }
      });
    } else {
      setFormData({
        ...formData,
        amenities: {
          ...formData.amenities,
          [category]: [...current, item]
        }
      });
    }
  };

  const toggleAvailableDay = (day) => {
    const current = formData.availability.availableDays || [];
    const newDays = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    
    setFormData({
      ...formData,
      pricing: { ...formData.pricing, availableDays: newDays },
      availability: { ...formData.availability, availableDays: newDays }
    });
  };

  const copyOwnerToAuthorised = () => {
    setFormData({
      ...formData,
      ownerInfo: {
        ...formData.ownerInfo,
        authorisedPerson: {
          fullName: formData.ownerInfo.fullName,
          name: formData.ownerInfo.fullName,
          designation: formData.ownerInfo.role || 'Venue Owner / Proprietor',
          role: formData.ownerInfo.role || 'Venue Owner / Proprietor',
          mobile: formData.ownerInfo.mobile,
          phone: formData.ownerInfo.mobile,
          alternatePhone: formData.ownerInfo.alternatePhone,
          email: formData.ownerInfo.email
        }
      }
    });
    toast.success('Copied owner info to Authorised Person! ✅');
  };

  const wordCount = formData.description
    ? formData.description.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 border border-primary-500/30 rounded-xl text-primary-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Admin Venue Master Edit</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/30 text-primary-300 font-bold uppercase tracking-wider">
                  Full Access
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Venue: <strong className="text-white">{venue?.businessName}</strong> ({venue?.sku || 'Venue'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950 px-3 overflow-x-auto flex-shrink-0">
          <div className="flex gap-1 py-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200 dark:border-slate-700'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: GENERAL & STATUS */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Venue / Business Name *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 font-semibold"
                    placeholder="Elite Conference Center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Status Dropdown *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="approved">Approved (Active & Live)</option>
                    <option value="pending">Pending Review</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                    <option value="resubmitted">Resubmitted ↩</option>
                  </select>
                </div>
              </div>

              {/* Status Reason if Rejected / Suspended */}
              {(formData.status === 'rejected' || formData.status === 'suspended' || formData.status === 'resubmitted') && (
                <div>
                  <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1.5">
                    {formData.status === 'suspended' ? 'Suspension Reason' : 'Rejection Reason'}
                  </label>
                  <input
                    type="text"
                    value={formData.status === 'suspended' ? formData.suspensionReason : formData.rejectionReason}
                    onChange={(e) => {
                      if (formData.status === 'suspended') {
                        setFormData({ ...formData, suspensionReason: e.target.value });
                      } else {
                        setFormData({ ...formData, rejectionReason: e.target.value });
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-red-300 dark:border-red-900/60 dark:bg-slate-800 text-red-700 dark:text-red-300"
                    placeholder="Reason for rejection or suspension..."
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Food Type Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Food Type Dropdown *
                  </label>
                  <select
                    value={formData.foodType}
                    onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-primary-500"
                  >
                    {FOOD_TYPE_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Capacity Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Maximum Capacity Dropdown *
                  </label>
                  <select
                    value={typeof formData.capacity === 'string' ? formData.capacity : `${formData.capacity}`}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select capacity range</option>
                    {CAPACITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} persons</option>
                    ))}
                  </select>
                </div>

                {/* Total Area */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Total Area (sq.ft) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.areaSqft}
                    onChange={(e) => setFormData({ ...formData, areaSqft: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Venue Type Dropdown & Badges */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Venue Categories / Types (Multi-select)
                </label>
                <div className="flex flex-wrap gap-2">
                  {venueTypes && venueTypes.length > 0 ? (
                    venueTypes.map((type) => {
                      const isSelected = formData.venueType.includes(type.name);
                      return (
                        <button
                          key={type._id || type.name}
                          type="button"
                          onClick={() => toggleVenueType(type.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                              : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-400'
                          }`}
                        >
                          {isSelected && '✓ '} {type.name}
                        </button>
                      );
                    })
                  ) : (
                    ['Banquet Hall', 'Party Lawn', 'Conference Room', 'Resort', 'Rooftop', 'Poolside', 'Farmhouse', 'Auditorium', 'Coworking Space'].map((t) => {
                      const isSelected = formData.venueType.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleVenueType(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                              : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-400'
                          }`}
                        >
                          {isSelected && '✓ '} {t}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Venue Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Venue Description (Max 200 words)
                  </label>
                  <span className={`text-xs ${wordCount > 200 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                    {wordCount}/200 words
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Describe venue highlights, seating, ambiance, and special features..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: LOCATION & PARKING */}
          {activeTab === 'location' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Complete Address *
                </label>
                <textarea
                  rows={3}
                  value={formData.location.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500"
                  placeholder="Floor, Building, Road..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Landmark *
                  </label>
                  <input
                    type="text"
                    value={formData.location.landmark}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, landmark: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="Near City Center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    value={formData.location.area}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, area: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="MP Nagar, Zone 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="Bhopal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.location.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, state: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="Madhya Pradesh"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.location.pincode}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, pincode: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="462011"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Parking Type Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Parking Type Dropdown *
                  </label>
                  <select
                    value={formData.location.parkingType}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, parkingType: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                  >
                    {PARKING_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p} Parking</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    value={formData.location.googleMapLink}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, googleMapLink: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>

              {/* Nearest Transit Connectivity */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  Transit & Connectivity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Train className="w-3.5 h-3.5 text-purple-600" /> Nearest Metro
                    </label>
                    <input
                      type="text"
                      value={formData.location.nearestMetro}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, nearestMetro: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="e.g. AIIMS Metro (1.2 km)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-emerald-600" /> Nearest Bus Stop
                    </label>
                    <input
                      type="text"
                      value={formData.location.nearestBusStop}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, nearestBusStop: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="e.g. MP Nagar Bus Stop"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Train className="w-3.5 h-3.5 text-orange-600" /> Nearest Railway Station
                    </label>
                    <input
                      type="text"
                      value={formData.location.nearestRailway}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, nearestRailway: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="e.g. Rani Kamlapati (3 km)"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-slate-800">
                {/* Per Hour */}
                <div className="p-4 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="optPerHour"
                      checked={formData.pricing.enabledOptions.perHour}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: {
                          ...formData.pricing,
                          enabledOptions: { ...formData.pricing.enabledOptions, perHour: e.target.checked }
                        }
                      })}
                      className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor="optPerHour" className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer">
                      Per Hour Pricing
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Weekday (₹/hr)</span>
                      <input
                        type="number"
                        disabled={!formData.pricing.enabledOptions.perHour}
                        value={formData.pricing.perHour.weekday}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            perHour: { ...formData.pricing.perHour, weekday: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-28 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Weekend (₹/hr)</span>
                      <input
                        type="number"
                        disabled={!formData.pricing.enabledOptions.perHour}
                        value={formData.pricing.perHour.weekend}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            perHour: { ...formData.pricing.perHour, weekend: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-28 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Half Day */}
                <div className="p-4 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="optHalfDay"
                      checked={formData.pricing.enabledOptions.halfDay}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: {
                          ...formData.pricing,
                          enabledOptions: { ...formData.pricing.enabledOptions, halfDay: e.target.checked }
                        }
                      })}
                      className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor="optHalfDay" className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer">
                      Half Day Pricing (4 Hours)
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Weekday (₹)</span>
                      <input
                        type="number"
                        disabled={!formData.pricing.enabledOptions.halfDay}
                        value={formData.pricing.halfDay.weekday}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            halfDay: { ...formData.pricing.halfDay, weekday: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-28 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Weekend (₹)</span>
                      <input
                        type="number"
                        disabled={!formData.pricing.enabledOptions.halfDay}
                        value={formData.pricing.halfDay.weekend}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            halfDay: { ...formData.pricing.halfDay, weekend: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-28 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Full Day */}
                <div className="p-4 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="optFullDay"
                      checked={formData.pricing.enabledOptions.fullDay}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: {
                          ...formData.pricing,
                          enabledOptions: { ...formData.pricing.enabledOptions, fullDay: e.target.checked }
                        }
                      })}
                      className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                    />
                    <label htmlFor="optFullDay" className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer">
                      Full Day Pricing (8+ Hours)
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Weekday (₹)</span>
                      <input
                        type="number"
                        disabled={!formData.pricing.enabledOptions.fullDay}
                        value={formData.pricing.fullDay.weekday}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            fullDay: { ...formData.pricing.fullDay, weekday: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-28 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Weekend (₹)</span>
                      <input
                        type="number"
                        disabled={!formData.pricing.enabledOptions.fullDay}
                        value={formData.pricing.fullDay.weekend}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            fullDay: { ...formData.pricing.fullDay, weekend: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-28 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-900 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Extra Hour Rate */}
                <div className="p-4 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Extra Hour Rate</p>
                    <p className="text-xs text-gray-500">Overtime hourly charge</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Weekday (₹/hr)</span>
                      <input
                        type="number"
                        value={formData.pricing.extraHourRate.weekday}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            extraHourRate: { ...formData.pricing.extraHourRate, weekday: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-28 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 block mb-1">Weekend (₹/hr)</span>
                      <input
                        type="number"
                        value={formData.pricing.extraHourRate.weekend}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            extraHourRate: { ...formData.pricing.extraHourRate, weekend: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-28 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIMINGS & ONLINE WINDOW */}
          {activeTab === 'timings' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Available Days */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Available Days of Week *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isChecked = formData.availability.availableDays?.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleAvailableDay(day)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all border text-center ${
                          isChecked
                            ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                            : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {isChecked && '✓ '} {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Venue Operating Schedule */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Venue Physical Operating Hours
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Venue Opens At (HH:MM)
                    </label>
                    <input
                      type="time"
                      value={formData.availability.openingTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        availability: { ...formData.availability, openingTime: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Venue Closes At (HH:MM)
                    </label>
                    <input
                      type="time"
                      value={formData.availability.closingTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        availability: { ...formData.availability, closingTime: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Online Booking Window */}
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Online Booking Window (Accepting Bookings)
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.availability.onlineBookingSchedule.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability,
                          onlineBookingSchedule: {
                            ...formData.availability.onlineBookingSchedule,
                            enabled: e.target.checked
                          }
                        }
                      })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">Active</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability,
                          onlineBookingSchedule: { ...formData.availability.onlineBookingSchedule, openingTime: '06:00', closingTime: '02:00' }
                        }
                      });
                      toast.success('Preset applied: 6 AM to 2 AM Next Day');
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-200"
                  >
                    6:00 AM – 2:00 AM (Next Day)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability,
                          onlineBookingSchedule: { ...formData.availability.onlineBookingSchedule, openingTime: '08:00', closingTime: '23:00' }
                        }
                      });
                      toast.success('Preset applied: 8 AM to 11 PM');
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-200"
                  >
                    8:00 AM – 11:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability,
                          onlineBookingSchedule: { ...formData.availability.onlineBookingSchedule, openingTime: '00:00', closingTime: '23:59' }
                        }
                      });
                      toast.success('Preset applied: 24 Hours Open');
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-200"
                  >
                    24 Hours Active
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                      Online Booking Opens (e.g. 06:00)
                    </label>
                    <input
                      type="time"
                      value={formData.availability.onlineBookingSchedule.openingTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability,
                          onlineBookingSchedule: {
                            ...formData.availability.onlineBookingSchedule,
                            openingTime: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-indigo-200 dark:border-indigo-800 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                      Online Booking Closes (e.g. 02:00)
                    </label>
                    <input
                      type="time"
                      value={formData.availability.onlineBookingSchedule.closingTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        availability: {
                          ...formData.availability,
                          onlineBookingSchedule: {
                            ...formData.availability.onlineBookingSchedule,
                            closingTime: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-indigo-200 dark:border-indigo-800 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Minimum Advance Booking Rule */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Minimum Advance Booking Required:
                  </label>
                  <select
                    value={formData.availability.advanceBookingRule}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, advanceBookingRule: e.target.value },
                      availability: { ...formData.availability, advanceBookingRule: e.target.value }
                    })}
                    className="px-3 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-800"
                  >
                    {ALL_ADVANCE_RULES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {ADVANCE_DAYS.map((rule) => (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, advanceBookingRule: rule },
                          availability: { ...formData.availability, advanceBookingRule: rule }
                        })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.availability.advanceBookingRule === rule
                            ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-400'
                        }`}
                      >
                        {rule}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ADVANCE_WEEKS.map((rule) => (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, advanceBookingRule: rule },
                          availability: { ...formData.availability, advanceBookingRule: rule }
                        })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.availability.advanceBookingRule === rule
                            ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-400'
                        }`}
                      >
                        {rule}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirmation Hours */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Time to Confirm Booking Request (Max 3 Hours):
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 0.5, label: '30 Min' },
                    { value: 1, label: '1 Hr' },
                    { value: 2, label: '2 Hrs' },
                    { value: 3, label: '3 Hrs' }
                  ].map(({ value, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, confirmationHours: value },
                        availability: { ...formData.availability, confirmationHours: value }
                      })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        formData.availability.confirmationHours === value
                          ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-amber-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AMENITIES */}
          {activeTab === 'amenities' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-primary-600" />
                  Basic Amenities
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {BASIC_AMENITIES.map((amenity) => {
                    const isChecked = formData.amenities.basic?.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity('basic', amenity)}
                        className={`p-3 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                          isChecked
                            ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-700 dark:text-primary-300'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{amenity}</span>
                        {isChecked && <Check className="w-4 h-4 text-primary-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Additional Facilities & Safety
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ADDITIONAL_FACILITIES.map((facility) => {
                    const isChecked = formData.amenities.additional?.includes(facility);
                    return (
                      <button
                        key={facility}
                        type="button"
                        onClick={() => toggleAmenity('additional', facility)}
                        className={`p-3 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{facility}</span>
                        {isChecked && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: OWNER & AUTHORISED PERSON */}
          {activeTab === 'contacts' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Owner Info */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary-600" />
                    Venue Owner Details
                  </h4>
                  <button
                    type="button"
                    onClick={copyOwnerToAuthorised}
                    className="text-xs text-primary-600 hover:text-primary-700 font-bold underline"
                  >
                    Copy to Authorised Person
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Owner Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.ownerInfo.fullName}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: { ...formData.ownerInfo, fullName: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Owner Email *
                    </label>
                    <input
                      type="email"
                      value={formData.ownerInfo.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: { ...formData.ownerInfo, email: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Owner Mobile *
                    </label>
                    <input
                      type="text"
                      value={formData.ownerInfo.mobile}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: { ...formData.ownerInfo, mobile: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Alternate Mobile
                    </label>
                    <input
                      type="text"
                      value={formData.ownerInfo.alternatePhone}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: { ...formData.ownerInfo, alternatePhone: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Authorised Person */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Booking Authorised Person (For Booking & Coordination)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Authorised Person Name *
                    </label>
                    <input
                      type="text"
                      value={formData.ownerInfo.authorisedPerson?.fullName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: {
                          ...formData.ownerInfo,
                          authorisedPerson: {
                            ...formData.ownerInfo.authorisedPerson,
                            fullName: e.target.value,
                            name: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-200 dark:border-blue-800 dark:bg-slate-800"
                      placeholder="Operational Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Designation / Role Dropdown *
                    </label>
                    <select
                      value={formData.ownerInfo.authorisedPerson?.designation || 'Venue Owner / Proprietor'}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: {
                          ...formData.ownerInfo,
                          authorisedPerson: {
                            ...formData.ownerInfo.authorisedPerson,
                            designation: e.target.value,
                            role: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-200 dark:border-blue-800 dark:bg-slate-800 font-semibold"
                    >
                      <option value="Venue Owner / Proprietor">Venue Owner / Proprietor</option>
                      <option value="General Manager / Director">General Manager / Director</option>
                      <option value="Booking & Sales Manager">Booking & Sales Manager</option>
                      <option value="Operations Coordinator">Operations Coordinator</option>
                      <option value="Authorised Representative">Authorised Representative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Authorised Mobile *
                    </label>
                    <input
                      type="text"
                      value={formData.ownerInfo.authorisedPerson?.mobile || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: {
                          ...formData.ownerInfo,
                          authorisedPerson: {
                            ...formData.ownerInfo.authorisedPerson,
                            mobile: e.target.value,
                            phone: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-200 dark:border-blue-800 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Authorised Alternate Mobile
                    </label>
                    <input
                      type="text"
                      value={formData.ownerInfo.authorisedPerson?.alternatePhone || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: {
                          ...formData.ownerInfo,
                          authorisedPerson: {
                            ...formData.ownerInfo.authorisedPerson,
                            alternatePhone: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-200 dark:border-blue-800 dark:bg-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Authorised Email
                    </label>
                    <input
                      type="email"
                      value={formData.ownerInfo.authorisedPerson?.email || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: {
                          ...formData.ownerInfo,
                          authorisedPerson: {
                            ...formData.ownerInfo.authorisedPerson,
                            email: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-200 dark:border-blue-800 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS & PROOFS */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* ID Proofs (Aadhaar & PAN) */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  Authorised Person / Owner ID Proofs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      value={formData.documents.idProof?.aadhaarNumber || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          idProof: { ...formData.documents.idProof, aadhaarNumber: e.target.value, number: e.target.value }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="XXXX XXXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      value={formData.documents.idProof?.panNumber || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          idProof: { ...formData.documents.idProof, panNumber: e.target.value.toUpperCase() }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 uppercase font-mono"
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Aadhaar Front Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.documents.idProof?.aadhaarFrontUrl || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          idProof: { ...formData.documents.idProof, aadhaarFrontUrl: e.target.value }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Aadhaar Back Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.documents.idProof?.aadhaarBackUrl || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          idProof: { ...formData.documents.idProof, aadhaarBackUrl: e.target.value }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      PAN Card Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.documents.idProof?.panUrl || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          idProof: { ...formData.documents.idProof, panUrl: e.target.value }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Owner Selfie URL
                    </label>
                    <input
                      type="url"
                      value={formData.documents.selfieUrl || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: { ...formData.documents, selfieUrl: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Business Documentation */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Business Documentation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                      Business Document Type Dropdown *
                    </label>
                    <select
                      value={formData.documents.businessProof?.type || 'Udyam Aadhaar (MSME)'}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          businessProof: { ...formData.documents.businessProof, type: e.target.value }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 dark:bg-slate-800 font-semibold"
                    >
                      {BUSINESS_PROOF_TYPES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                      Business Document URL
                    </label>
                    <input
                      type="url"
                      value={formData.documents.businessProof?.documentUrl || formData.documents.businessProof?.url || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          businessProof: {
                            ...formData.documents.businessProof,
                            documentUrl: e.target.value,
                            url: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                  {formData.documents.businessProof?.type === 'Other' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                        Specify Other Document
                      </label>
                      <input
                        type="text"
                        value={formData.documents.businessProof?.otherSpecify || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          documents: {
                            ...formData.documents,
                            businessProof: { ...formData.documents.businessProof, otherSpecify: e.target.value }
                          }
                        })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 dark:bg-slate-800"
                        placeholder="e.g. Gram Panchayat NOC"
                      />
                    </div>
                  )}
                </div>

                {/* GST Section */}
                <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800/80">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="editHasGST"
                      checked={formData.documents.hasGST}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setFormData({
                          ...formData,
                          documents: { ...formData.documents, hasGST: val },
                          ownerInfo: { ...formData.ownerInfo, hasGST: val }
                        });
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="editHasGST" className="text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
                      I have GST Registration
                    </label>
                  </div>

                  {formData.documents.hasGST && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                          GST Number
                        </label>
                        <input
                          type="text"
                          value={formData.documents.gstNumber || ''}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setFormData({
                              ...formData,
                              documents: { ...formData.documents, gstNumber: val },
                              ownerInfo: { ...formData.ownerInfo, gstNumber: val }
                            });
                          }}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 dark:bg-slate-800 uppercase font-mono"
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                          GST Certificate URL
                        </label>
                        <input
                          type="url"
                          value={formData.documents.gstDocUrl || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            documents: { ...formData.documents, gstDocUrl: e.target.value }
                          })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 dark:bg-slate-800"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fire NOC & FSSAI */}
              <div className="p-4 bg-orange-50/60 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800">
                <h4 className="text-xs font-bold text-orange-950 dark:text-orange-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-orange-600" />
                  Safety & Compliance Certificates (Fire NOC & FSSAI)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-orange-900 dark:text-orange-300 mb-1">
                      Fire NOC Certificate URL
                    </label>
                    <input
                      type="url"
                      value={formData.documents.fireNOC?.url || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          fireNOC: { ...formData.documents.fireNOC, url: e.target.value }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-orange-200 dark:border-orange-800 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-orange-900 dark:text-orange-300 mb-1">
                      FSSAI Certificate URL
                    </label>
                    <input
                      type="url"
                      value={formData.documents.fssai?.url || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          fssai: { ...formData.documents.fssai, url: e.target.value }
                        }
                      })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-orange-200 dark:border-orange-800 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: BANK ACCOUNT DETAILS */}
          {activeTab === 'bank' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Payout Bank Account Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountHolderName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Account Type Dropdown
                    </label>
                    <select
                      value={formData.bankDetails.accountType}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountType: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    >
                      <option value="Current">Current Account</option>
                      <option value="Savings">Savings Account</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.ifscCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 uppercase font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.bankName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.branchName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, branchName: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Bank Proof (Cancelled Cheque / Passbook URL)
                    </label>
                    <input
                      type="url"
                      value={formData.bankDetails.bankProofUrl}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, bankProofUrl: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: FEES & GST */}
          {activeTab === 'fees' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Custom Platform Fee */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Custom Platform Fee for Venue
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.customPlatformFee.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        customPlatformFee: { ...formData.customPlatformFee, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Custom Override</span>
                  </label>
                </div>
                {formData.customPlatformFee.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Fee Type Dropdown</label>
                      <select
                        value={formData.customPlatformFee.feeType}
                        onChange={(e) => setFormData({
                          ...formData,
                          customPlatformFee: { ...formData.customPlatformFee, feeType: e.target.value }
                        })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Fee Value {formData.customPlatformFee.feeType === 'fixed' ? '(₹)' : '(%)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.customPlatformFee.feeValue}
                        onChange={(e) => setFormData({
                          ...formData,
                          customPlatformFee: { ...formData.customPlatformFee, feeValue: Number(e.target.value) || 0 }
                        })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Custom GST */}
              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Custom GST Rate for Venue
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.customGST.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        customGST: { ...formData.customGST, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Custom GST Override</span>
                  </label>
                </div>
                {formData.customGST.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Total Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.customGST.rate}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setFormData({
                            ...formData,
                            customGST: { ...formData.customGST, rate: val, cgstRate: val / 2, sgstRate: val / 2 }
                          });
                        }}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">CGST Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.customGST.cgstRate}
                        onChange={(e) => setFormData({
                          ...formData,
                          customGST: { ...formData.customGST, cgstRate: Number(e.target.value) || 0 }
                        })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">SGST Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.customGST.sgstRate}
                        onChange={(e) => setFormData({
                          ...formData,
                          customGST: { ...formData.customGST, sgstRate: Number(e.target.value) || 0 }
                        })}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 scale-[1.01] active:scale-[0.99]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving All Changes...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
