'use client';

import { useState, useEffect, useRef } from 'react';
import { State, City } from 'country-state-city';
import {
  X, Briefcase, MapPin, IndianRupee, Clock,
  Check, Loader2, Sparkles, AlertCircle,
  FileCheck, Camera, CreditCard,
  Download, Eye, Image as ImageIcon, Trash2, Plus, Star, Upload,
  ExternalLink, CheckCircle2, ChevronDown, AlertTriangle, PlayCircle,
  PauseCircle, ShieldAlert, RefreshCw, Globe, Phone, User, Tag,
  Calendar, Layers, Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToStorage } from '@/lib/storage';

const VENDOR_CATEGORIES = [
  'Catering',
  'Makeup & Beauty',
  'Photography',
  'Entertainment',
  'Security & Bouncer',
  'Decor & Floral',
  'Celebrity / Artist',
  'Logistic & Support'
];

const PACKAGE_UNITS = [
  'Per Unit',
  'Per Person',
  'Per Event',
  'Per Day',
  'Per Hour',
  'Per Plate',
  'Per Item',
  'Per Session',
  'Fixed'
];

const ADVANCE_BOOKING_OPTIONS = [
  { value: 'same-day', label: 'Same Day' },
  { value: '24h', label: '24 Hours Before' },
  { value: '48h', label: '48 Hours Before' },
  { value: '1week', label: '1 Week Before' },
  { value: 'custom', label: 'Custom Days' },
];

const REJECTION_REASONS = [
  'Incomplete service details or pricing',
  'Poor quality portfolio photos or missing required images',
  'Pricing does not comply with platform or industry standards',
  'Invalid or unverifiable location / contact information',
  'Incomplete business or owner identity verification documents',
  'Duplicate listing detected on platform',
  'other'
];

const SUSPENSION_REASONS = [
  'Vendor temporarily unavailable / fully booked',
  'Quality or service delivery compliance issues reported',
  'Vendor requested temporary listing pause',
  'Repeated booking cancellations or non-responsive to enquiries',
  'Pricing dispute or unauthorized rate modification',
  'Account verification / KYC compliance audit pending',
  'other'
];

const STOP_BOOKING_REASONS = [
  'Vendor fully booked / maximum capacity reached',
  'Service temporarily unavailable / operational maintenance',
  'Vendor requested booking pause',
  'Seasonal closure / off-season',
  'Quality / compliance review in progress',
  'Pricing review in progress',
  'other'
];

const TABS = [
  { id: 'basic', label: '1. Basic Info', icon: Briefcase },
  { id: 'location', label: '2. Location & Contact', icon: MapPin },
  { id: 'pricing', label: '3. Pricing & Packages', icon: IndianRupee },
  { id: 'portfolio', label: '4. Portfolio & Media', icon: Camera },
  { id: 'availability', label: '5. Availability & Rules', icon: Clock },
  { id: 'documents', label: '6. Documents & Proofs', icon: FileCheck },
  { id: 'bank', label: '7. Bank Details', icon: CreditCard }
];

export default function AdminVendorServiceQuickEditModal({
  service,
  token,
  onClose,
  onSaveSuccess
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);

  // Status Changer & Stop Booking Admin States
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, targetStatus: '', reason: '', customReason: '' });
  const [stopBookingModal, setStopBookingModal] = useState({ open: false, reason: '', customReason: '' });
  const statusMenuRef = useRef(null);

  // States & Cities from library
  const [indianStates, setIndianStates] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  // Upload States
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState({});

  // Dynamic tags / input temp states
  const [tagInput, setTagInput] = useState('');
  const [specInput, setSpecInput] = useState('');
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [workLinkInput, setWorkLinkInput] = useState('');

  // Initialize Indian States
  useEffect(() => {
    try {
      const states = State.getStatesOfCountry('IN');
      setIndianStates(states || []);
    } catch (_) {}
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form State initialized comprehensively from service
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: service?.title || '',
    category: service?.category || VENDOR_CATEGORIES[0],
    companyName: service?.companyName || '',
    brandName: service?.brandName || '',
    experienceYears: service?.experienceYears || 0,
    description: service?.description || '',
    specialization: Array.isArray(service?.specialization) ? service.specialization : [],
    tags: Array.isArray(service?.tags) ? service.tags : [],

    // Contact info
    contactInfo: {
      fullName: service?.contactInfo?.fullName || service?.vendor?.name || '',
      primaryMobile: service?.contactInfo?.primaryMobile || service?.vendor?.phone || '',
      secondaryMobile: service?.contactInfo?.secondaryMobile || '',
      role: service?.contactInfo?.role || 'owner'
    },

    // Step 2: Location
    officeAddress: service?.officeAddress || '',
    state: service?.state || '',
    city: service?.city || '',
    area: service?.area || '',
    village: service?.village || '',
    pincode: service?.pincode || '',
    serviceableAreas: Array.isArray(service?.serviceableAreas)
      ? service.serviceableAreas.join(', ')
      : (service?.serviceableAreas || ''),
    website: service?.website || '',
    instagram: service?.instagram || '',
    facebook: service?.facebook || '',

    // Step 3: Pricing
    startingPrice: service?.startingPrice || 0,
    minimumOrderPrice: service?.minimumOrderPrice || 0,
    packages: Array.isArray(service?.packages) && service.packages.length > 0
      ? service.packages.map((pkg, idx) => ({
          sno: pkg.sno || idx + 1,
          name: pkg.name || '',
          price: pkg.price || 0,
          unit: pkg.unit || 'Per Unit',
          minQty: pkg.minQty ?? 1,
          maxQty: pkg.maxQty ?? null
        }))
      : [
          { sno: 1, name: 'Standard Package', price: service?.startingPrice || 1000, unit: 'Per Unit', minQty: 1, maxQty: null }
        ],

    // Step 4: Portfolio
    featuredImage: service?.featuredImage || '',
    images: Array.isArray(service?.images) ? service.images : [],
    videoLinks: Array.isArray(service?.videoLinks) ? service.videoLinks : [],
    previousWorkLinks: Array.isArray(service?.previousWorkLinks) ? service.previousWorkLinks : [],

    // Step 5: Availability
    advanceBooking: service?.advanceBooking || '24h',
    customAdvanceDays: service?.customAdvanceDays || 3,
    confirmationHours: service?.confirmationHours || 3,
    publicHoliday: {
      isAvailable: service?.publicHoliday?.isAvailable ?? false,
      startTime: service?.publicHoliday?.startTime || '09:00',
      endTime: service?.publicHoliday?.endTime || '20:00'
    },
    availability: Array.isArray(service?.availability) && service.availability.length > 0
      ? service.availability
      : [
          { day: 'Monday', isAvailable: true, startTime: '09:00', endTime: '21:00' },
          { day: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '21:00' },
          { day: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '21:00' },
          { day: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '21:00' },
          { day: 'Friday', isAvailable: true, startTime: '09:00', endTime: '21:00' },
          { day: 'Saturday', isAvailable: true, startTime: '09:00', endTime: '21:00' },
          { day: 'Sunday', isAvailable: true, startTime: '09:00', endTime: '21:00' }
        ],

    // Step 6: Documents
    businessDocs: {
      registrationCertificate: service?.businessDocs?.registrationCertificate || '',
      msme: service?.businessDocs?.msme || '',
      gst: service?.businessDocs?.gst || '',
      pan: service?.businessDocs?.pan || '',
      tradeLicense: service?.businessDocs?.tradeLicense || '',
      fssai: service?.businessDocs?.fssai || ''
    },
    ownerDocs: {
      aadhaarFront: service?.ownerDocs?.aadhaarFront || '',
      aadhaarBack: service?.ownerDocs?.aadhaarBack || '',
      pan: service?.ownerDocs?.pan || '',
      selfie: service?.ownerDocs?.selfie || ''
    },

    // Step 7: Bank
    bankDetails: {
      accountHolderName: service?.bankDetails?.accountHolderName || '',
      accountNumber: service?.bankDetails?.accountNumber || '',
      ifsc: service?.bankDetails?.ifsc || '',
      bankName: service?.bankDetails?.bankName || '',
      branchName: service?.bankDetails?.branchName || '',
      accountType: service?.bankDetails?.accountType || 'savings',
      upiId: service?.bankDetails?.upiId || '',
      proof: service?.bankDetails?.proof || ''
    },

    // Status & Booking Control
    status: service?.status || 'approved',
    rejectionReason: service?.rejectionReason || '',
    isBookingStopped: service?.isBookingStopped ?? false,
    stopBookingReason: service?.stopBookingReason || '',
    stoppedBookingAt: service?.stoppedBookingAt || null,
    isActive: service?.isActive ?? true
  });

  // Populate Cities when state changes
  useEffect(() => {
    if (formData.state && indianStates.length > 0) {
      try {
        const foundState = indianStates.find(
          s => s.name.toLowerCase() === formData.state.toLowerCase() || s.isoCode === formData.state
        );
        if (foundState) {
          const cities = City.getCitiesOfState('IN', foundState.isoCode);
          setCitiesList(cities || []);
        } else {
          setCitiesList([]);
        }
      } catch (_) {
        setCitiesList([]);
      }
    }
  }, [formData.state, indianStates]);

  // Status Selector execution
  const handleSelectStatus = (targetStatus) => {
    setStatusMenuOpen(false);
    if (targetStatus === 'rejected' || targetStatus === 'suspended') {
      setStatusModal({ open: true, targetStatus, reason: '', customReason: '' });
    } else {
      setFormData(prev => ({
        ...prev,
        status: targetStatus,
        rejectionReason: ''
      }));
      toast.success(`Status set to ${targetStatus.toUpperCase()}`);
    }
  };

  const confirmStatusChange = () => {
    const finalReason = statusModal.reason === 'other' ? statusModal.customReason : statusModal.reason;
    if (!finalReason) {
      toast.error('Please specify a reason');
      return;
    }
    setFormData(prev => ({
      ...prev,
      status: statusModal.targetStatus,
      rejectionReason: finalReason
    }));
    setStatusModal({ open: false, targetStatus: '', reason: '', customReason: '' });
    toast.success(`Status updated to ${statusModal.targetStatus.toUpperCase()}`);
  };

  const confirmStopBooking = () => {
    const finalReason = stopBookingModal.reason === 'other' ? stopBookingModal.customReason : stopBookingModal.reason;
    if (!finalReason) {
      toast.error('Please specify a reason to pause bookings');
      return;
    }
    setFormData(prev => ({
      ...prev,
      isBookingStopped: true,
      stopBookingReason: finalReason,
      stoppedBookingAt: new Date()
    }));
    setStopBookingModal({ open: false, reason: '', customReason: '' });
    toast.success('Online bookings paused');
  };

  const resumeBooking = () => {
    setFormData(prev => ({
      ...prev,
      isBookingStopped: false,
      stopBookingReason: '',
      stoppedBookingAt: null
    }));
    toast.success('Online bookings resumed');
  };

  // Upload Featured Image
  const handleFeaturedImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFeatured(true);
    try {
      toast.loading('Uploading cover image...', { id: 'feat' });
      const res = await uploadToStorage(file, `vendor-services/${service._id || 'temp'}`);
      setFormData(prev => ({ ...prev, featuredImage: res.url }));
      toast.success('Featured cover image updated! ✅', { id: 'feat' });
    } catch (err) {
      toast.error('Upload failed: ' + err.message, { id: 'feat' });
    } finally {
      setUploadingFeatured(false);
    }
  };

  // Upload Gallery Images
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    const newImgs = [...(formData.images || [])];
    for (const f of files) {
      try {
        toast.loading(`Uploading ${f.name}...`, { id: f.name });
        const res = await uploadToStorage(f, `vendor-services/${service._id || 'temp'}/gallery`);
        newImgs.push(res.url);
        toast.success(`${f.name} uploaded! ✅`, { id: f.name });
      } catch (err) {
        toast.error(`Failed ${f.name}`, { id: f.name });
      }
    }
    setFormData(prev => ({ ...prev, images: newImgs }));
    setUploadingGallery(false);
  };

  // Upload Document
  const handleDocUpload = async (folderGroup, docKey, file) => {
    if (!file) return;
    setUploadingDoc(prev => ({ ...prev, [`${folderGroup}_${docKey}`]: true }));
    try {
      toast.loading(`Uploading document...`, { id: docKey });
      const res = await uploadToStorage(file, `vendor-docs/${service._id || 'temp'}/${docKey}`);
      setFormData(prev => ({
        ...prev,
        [folderGroup]: {
          ...prev[folderGroup],
          [docKey]: res.url
        }
      }));
      toast.success('Document uploaded! ✅', { id: docKey });
    } catch (err) {
      toast.error('Document upload failed: ' + err.message, { id: docKey });
    } finally {
      setUploadingDoc(prev => ({ ...prev, [`${folderGroup}_${docKey}`]: false }));
    }
  };

  // Package Management
  const handleAddPackage = () => {
    const newSno = (formData.packages?.length || 0) + 1;
    setFormData(prev => ({
      ...prev,
      packages: [
        ...(prev.packages || []),
        {
          sno: newSno,
          name: `Package ${newSno}`,
          price: 1000,
          unit: 'Per Unit',
          minQty: 1,
          maxQty: null
        }
      ]
    }));
  };

  const handleUpdatePackage = (index, field, value) => {
    setFormData(prev => {
      const updated = [...(prev.packages || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, packages: updated };
    });
  };

  const handleRemovePackage = (index) => {
    setFormData(prev => {
      const updated = (prev.packages || []).filter((_, i) => i !== index);
      return { ...prev, packages: updated };
    });
  };

  // Tag & Specialization Helpers
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };
  const removeTag = (t) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(item => item !== t) }));
  };

  const addSpec = () => {
    if (specInput.trim() && !formData.specialization.includes(specInput.trim())) {
      setFormData(prev => ({ ...prev, specialization: [...prev.specialization, specInput.trim()] }));
      setSpecInput('');
    }
  };
  const removeSpec = (s) => {
    setFormData(prev => ({ ...prev, specialization: prev.specialization.filter(item => item !== s) }));
  };

  const addVideoLink = () => {
    if (videoLinkInput.trim() && !formData.videoLinks.includes(videoLinkInput.trim())) {
      setFormData(prev => ({ ...prev, videoLinks: [...prev.videoLinks, videoLinkInput.trim()] }));
      setVideoLinkInput('');
    }
  };
  const removeVideoLink = (l) => {
    setFormData(prev => ({ ...prev, videoLinks: prev.videoLinks.filter(item => item !== l) }));
  };

  const addWorkLink = () => {
    if (workLinkInput.trim() && !formData.previousWorkLinks.includes(workLinkInput.trim())) {
      setFormData(prev => ({ ...prev, previousWorkLinks: [...prev.previousWorkLinks, workLinkInput.trim()] }));
      setWorkLinkInput('');
    }
  };
  const removeWorkLink = (l) => {
    setFormData(prev => ({ ...prev, previousWorkLinks: prev.previousWorkLinks.filter(item => item !== l) }));
  };

  // Submit Quick Edit
  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      toast.error('Service title is required');
      setActiveTab('basic');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        companyName: formData.companyName?.trim(),
        brandName: formData.brandName?.trim(),
        experienceYears: Number(formData.experienceYears) || 0,
        description: formData.description,
        specialization: formData.specialization,
        tags: formData.tags,

        contactInfo: {
          fullName: formData.contactInfo.fullName,
          primaryMobile: formData.contactInfo.primaryMobile,
          secondaryMobile: formData.contactInfo.secondaryMobile,
          role: formData.contactInfo.role
        },

        officeAddress: formData.officeAddress,
        state: formData.state,
        city: formData.city,
        area: formData.area,
        village: formData.village,
        pincode: formData.pincode,
        serviceableAreas: formData.serviceableAreas,
        website: formData.website,
        instagram: formData.instagram,
        facebook: formData.facebook,

        startingPrice: Number(formData.startingPrice) || 0,
        minimumOrderPrice: Number(formData.minimumOrderPrice) || 0,
        packages: formData.packages,

        featuredImage: formData.featuredImage,
        images: formData.images,
        videoLinks: formData.videoLinks,
        previousWorkLinks: formData.previousWorkLinks,

        businessDocs: formData.businessDocs,
        ownerDocs: formData.ownerDocs,
        bankDetails: formData.bankDetails,

        availability: formData.availability,
        publicHoliday: formData.publicHoliday,
        advanceBooking: formData.advanceBooking,
        customAdvanceDays: Number(formData.customAdvanceDays) || 0,
        confirmationHours: Number(formData.confirmationHours) || 3,

        status: formData.status,
        rejectionReason: formData.rejectionReason,
        isBookingStopped: formData.isBookingStopped,
        stopBookingReason: formData.stopBookingReason,
        isActive: formData.isActive
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendor-services/${service._id}/quick-edit`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Vendor service updated successfully! ✅');
        if (onSaveSuccess) {
          onSaveSuccess(data.service);
        }
        onClose();
      } else {
        toast.error(data.message || 'Failed to update vendor service');
      }
    } catch (err) {
      console.error('Quick edit error:', err);
      toast.error('Failed to update vendor service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[94vh] overflow-hidden flex flex-col relative border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-600/30 border border-primary-500/40 text-primary-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight">{formData.title || 'Vendor Service Quick Edit'}</h2>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  formData.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  formData.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  formData.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  formData.status === 'resubmitted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {formData.status}
                </span>
                {formData.isBookingStopped ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold inline-flex items-center gap-1">
                    <PauseCircle className="w-3 h-3" /> Bookings Paused
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold inline-flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" /> Bookings Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Admin Full Management & Quick Editor • Category: <strong className="text-slate-300">{formData.category || 'N/A'}</strong> • Vendor: <strong className="text-slate-300">{service.vendor?.name || 'N/A'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Selector Dropdown */}
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Set Status</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {statusMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Change Service Status
                  </div>
                  <button
                    onClick={() => handleSelectStatus('approved')}
                    className="w-full text-left px-3 py-2 hover:bg-green-50 text-green-700 font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Approve Service
                  </button>
                  <button
                    onClick={() => handleSelectStatus('suspended')}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 text-amber-700 font-semibold flex items-center gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Suspend (Reason)
                  </button>
                  <button
                    onClick={() => handleSelectStatus('rejected')}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-700 font-semibold flex items-center gap-2"
                  >
                    <X className="w-3.5 h-3.5 text-red-600" /> Reject (Reason)
                  </button>
                  <button
                    onClick={() => handleSelectStatus('pending')}
                    className="w-full text-left px-3 py-2 hover:bg-yellow-50 text-yellow-800 font-semibold flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-yellow-600" /> Mark Pending
                  </button>
                  <button
                    onClick={() => handleSelectStatus('resubmitted')}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 font-semibold flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Mark Resubmitted
                  </button>
                </div>
              )}
            </div>

            {/* Toggle Booking Button */}
            {formData.isBookingStopped ? (
              <button
                type="button"
                onClick={resumeBooking}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" /> Resume Booking
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStopBookingModal({ open: true, reason: '', customReason: '' })}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" /> Stop Booking
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save All'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7 Navigation Tabs */}
        <div className="border-b border-gray-200 bg-slate-50 px-3 overflow-x-auto flex-shrink-0">
          <div className="flex gap-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 font-bold text-xs transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-b-2 border-primary-600 text-primary-700 bg-white -mb-px shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Service Title / Name *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Royal Wedding Photography & Films"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Service Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 font-medium"
                  >
                    {VENDOR_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company / Firm Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Royal Events Pvt Ltd"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Brand / Trade Name</label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Royal Visuals"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={e => setFormData({ ...formData, experienceYears: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Service Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the services provided, equipment, team expertise, special packages..."
                />
              </div>

              {/* Specializations Chips */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Specializations</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={specInput}
                    onChange={e => setSpecInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpec(); } }}
                    placeholder="e.g. Candid, Drone, Pre-wedding"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addSpec}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.specialization.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-200">
                      {s}
                      <button type="button" onClick={() => removeSpec(s)} className="hover:text-red-600 font-bold ml-1">×</button>
                    </span>
                  ))}
                  {formData.specialization.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No specializations added</span>
                  )}
                </div>
              </div>

              {/* Search Tags Chips */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Search & Discovery Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="e.g. wedding, catering, best photographer, jaipur"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-red-600 font-bold ml-1">×</button>
                    </span>
                  ))}
                  {formData.tags.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No tags added</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCATION & CONTACT */}
          {activeTab === 'location' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary-600" /> Contact Person Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.contactInfo.fullName}
                      onChange={e => setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, fullName: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Mobile</label>
                    <input
                      type="text"
                      value={formData.contactInfo.primaryMobile}
                      onChange={e => setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, primaryMobile: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Alternate Phone</label>
                    <input
                      type="text"
                      value={formData.contactInfo.secondaryMobile}
                      onChange={e => setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, secondaryMobile: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Role / Designation</label>
                    <select
                      value={formData.contactInfo.role}
                      onChange={e => setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, role: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="owner">Owner / Proprietor</option>
                      <option value="manager">Manager / Coordinator</option>
                      <option value="representative">Authorized Representative</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Office / Studio Address</label>
                  <input
                    type="text"
                    value={formData.officeAddress}
                    onChange={e => setFormData({ ...formData, officeAddress: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="Shop/Office number, building name, road..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                    <select
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value, city: '' })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(s => (
                        <option key={s.isoCode} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                    {citiesList.length > 0 ? (
                      <select
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white"
                      >
                        <option value="">Select City</option>
                        {citiesList.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Jaipur"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Area / Locality</label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={e => setFormData({ ...formData, area: e.target.value })}
                      placeholder="e.g. Mansarovar, Malviya Nagar"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="e.g. 302020"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Serviceable Areas (Comma Separated)</label>
                  <input
                    type="text"
                    value={formData.serviceableAreas}
                    onChange={e => setFormData({ ...formData, serviceableAreas: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    placeholder="e.g. Jaipur, Vaishali Nagar, Mansarovar, C-Scheme, Tonk Road"
                  />
                </div>

                {/* Social & Web */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-blue-500" /> Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <span className="text-pink-600 font-bold">IG</span> Instagram Handle / URL
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="e.g. royalkeep_studios"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <span className="text-blue-600 font-bold">FB</span> Facebook Page / URL
                    </label>
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="e.g. royalkeep"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING & PACKAGES */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Starting Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.startingPrice}
                      onChange={e => setFormData({ ...formData, startingPrice: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 text-sm font-bold text-emerald-800 border border-emerald-200 rounded-xl bg-white"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Displayed as starting quote on discovery cards.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Minimum Order Value (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.minimumOrderPrice}
                      onChange={e => setFormData({ ...formData, minimumOrderPrice: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 text-sm font-bold text-emerald-800 border border-emerald-200 rounded-xl bg-white"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Minimum cart/booking order threshold for customers.</p>
                </div>
              </div>

              {/* Packages List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Packages & Rates List</h3>
                    <p className="text-xs text-gray-500">Configure tiered packages with units and pricing.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPackage}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Package
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.packages.map((pkg, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-3 items-center">
                      <div className="w-8 text-center text-xs font-bold text-slate-400">#{idx + 1}</div>
                      
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Package Name</label>
                        <input
                          type="text"
                          value={pkg.name}
                          onChange={e => handleUpdatePackage(idx, 'name', e.target.value)}
                          placeholder="e.g. Standard Wedding Package"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-medium"
                        />
                      </div>

                      <div className="w-full md:w-32">
                        <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={pkg.price}
                          onChange={e => handleUpdatePackage(idx, 'price', Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-bold text-emerald-700"
                        />
                      </div>

                      <div className="w-full md:w-36">
                        <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Rate Unit</label>
                        <select
                          value={pkg.unit || 'Per Unit'}
                          onChange={e => handleUpdatePackage(idx, 'unit', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-semibold"
                        >
                          {PACKAGE_UNITS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-20">
                        <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Min Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={pkg.minQty ?? 1}
                          onChange={e => handleUpdatePackage(idx, 'minQty', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePackage(idx)}
                        disabled={formData.packages.length <= 1}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PORTFOLIO & MEDIA */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              {/* Featured Image */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Featured Cover Photo
                </h4>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {formData.featuredImage ? (
                    <div className="relative group w-44 h-28 rounded-xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                      <img src={formData.featuredImage} alt="Cover" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, featuredImage: '' })}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove cover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-44 h-28 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs">
                      <ImageIcon className="w-6 h-6 mb-1 text-gray-400" />
                      No cover photo
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-gray-600">
                      High quality landscape orientation image recommended (min 1200x800px).
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                      {uploadingFeatured ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{uploadingFeatured ? 'Uploading...' : 'Upload / Replace Cover'}</span>
                      <input type="file" accept="image/*" onChange={handleFeaturedImageUpload} className="hidden" disabled={uploadingFeatured} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Gallery Photos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Portfolio & Gallery Images ({formData.images.length})</h4>
                    <p className="text-xs text-gray-500">Showcase past work, setup pictures, and service deliverables.</p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                    {uploadingGallery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{uploadingGallery ? 'Uploading...' : '+ Upload Photos'}</span>
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" disabled={uploadingGallery} />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {formData.images.map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-slate-100 shadow-xs">
                      <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white/90 text-gray-800 rounded-lg hover:bg-white">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            images: formData.images.filter((_, i) => i !== idx)
                          })}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.images.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-gray-400 border border-dashed rounded-xl">
                      No gallery photos added yet. Click &quot;+ Upload Photos&quot; to add.
                    </div>
                  )}
                </div>
              </div>

              {/* Video Links */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">YouTube / Video Showreel Links</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={videoLinkInput}
                    onChange={e => setVideoLinkInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addVideoLink}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
                  >
                    + Add Link
                  </button>
                </div>
                <div className="space-y-1.5">
                  {formData.videoLinks.map((link, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate max-w-lg flex items-center gap-1.5">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" /> {link}
                      </a>
                      <button type="button" onClick={() => removeVideoLink(link)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">×</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Previous Work Links */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Drive / Portfolio Work Links</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={workLinkInput}
                    onChange={e => setWorkLinkInput(e.target.value)}
                    placeholder="https://drive.google.com/... or portfolio link"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addWorkLink}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
                  >
                    + Add Link
                  </button>
                </div>
                <div className="space-y-1.5">
                  {formData.previousWorkLinks.map((link, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate max-w-lg flex items-center gap-1.5">
                        <LinkIcon className="w-3 h-3 flex-shrink-0" /> {link}
                      </a>
                      <button type="button" onClick={() => removeWorkLink(link)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AVAILABILITY & RULES */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Advance Booking Notice</label>
                  <select
                    value={formData.advanceBooking}
                    onChange={e => setFormData({ ...formData, advanceBooking: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                  >
                    {ADVANCE_BOOKING_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {formData.advanceBooking === 'custom' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Custom Advance Notice (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.customAdvanceDays}
                      onChange={e => setFormData({ ...formData, customAdvanceDays: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Order Confirmation Window</label>
                  <select
                    value={formData.confirmationHours}
                    onChange={e => setFormData({ ...formData, confirmationHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium"
                  >
                    <option value={1}>1 Hour to confirm</option>
                    <option value={2}>2 Hours to confirm</option>
                    <option value={3}>3 Hours to confirm</option>
                  </select>
                </div>
              </div>

              {/* Public Holidays Toggle */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Public Holidays Availability</h4>
                  <p className="text-xs text-gray-500">Enable if the vendor accepts bookings on festivals & public holidays.</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.publicHoliday.isAvailable}
                      onChange={e => setFormData({
                        ...formData,
                        publicHoliday: { ...formData.publicHoliday, isAvailable: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                  <span className="text-xs font-bold text-gray-700">
                    {formData.publicHoliday.isAvailable ? 'Available on Holidays' : 'Closed on Holidays'}
                  </span>
                </div>
              </div>

              {/* Weekly Working Days */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Weekly Working Schedule</h4>
                <div className="space-y-2">
                  {formData.availability.map((dayItem, idx) => (
                    <div key={dayItem.day || idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs gap-3">
                      <div className="flex items-center gap-2.5 w-36">
                        <input
                          type="checkbox"
                          id={`day-${idx}`}
                          checked={dayItem.isAvailable}
                          onChange={e => {
                            const updated = [...formData.availability];
                            updated[idx] = { ...updated[idx], isAvailable: e.target.checked };
                            setFormData({ ...formData, availability: updated });
                          }}
                          className="w-4 h-4 text-primary-600 rounded border-gray-300"
                        />
                        <label htmlFor={`day-${idx}`} className="font-semibold text-gray-800 cursor-pointer">
                          {dayItem.day}
                        </label>
                      </div>

                      {dayItem.isAvailable ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={dayItem.startTime || '09:00'}
                            onChange={e => {
                              const updated = [...formData.availability];
                              updated[idx] = { ...updated[idx], startTime: e.target.value };
                              setFormData({ ...formData, availability: updated });
                            }}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            value={dayItem.endTime || '21:00'}
                            onChange={e => {
                              const updated = [...formData.availability];
                              updated[idx] = { ...updated[idx], endTime: e.target.value };
                              setFormData({ ...formData, availability: updated });
                            }}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-rose-500 italic">Day Off (Closed)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENTS & PROOFS */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Business Documents */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Business Registrations & Proofs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'registrationCertificate', label: 'Company Registration / Incorporation' },
                    { key: 'msme', label: 'MSME / Udyam Certificate' },
                    { key: 'gst', label: 'GST Certificate' },
                    { key: 'pan', label: 'Business PAN Card' },
                    { key: 'tradeLicense', label: 'Trade License / Gumasta' },
                    { key: 'fssai', label: 'FSSAI License (Catering / Food)' }
                  ].map(doc => {
                    const currentUrl = formData.businessDocs[doc.key];
                    const isUploading = uploadingDoc[`businessDocs_${doc.key}`];
                    return (
                      <div key={doc.key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700">{doc.label}</span>
                          {currentUrl ? (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Uploaded</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Not Uploaded</span>
                          )}
                        </div>

                        {currentUrl && (
                          <div className="flex items-center gap-2">
                            <a
                              href={currentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-semibold truncate"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" /> View Document
                            </a>
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                businessDocs: { ...formData.businessDocs, [doc.key]: '' }
                              })}
                              className="text-[10px] text-rose-500 hover:text-rose-700 font-bold ml-auto"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer shadow-xs">
                          {isUploading ? <Loader2 className="w-3 h-3 animate-spin text-primary-600" /> : <Upload className="w-3 h-3 text-gray-500" />}
                          <span>{isUploading ? 'Uploading...' : (currentUrl ? 'Replace File' : 'Upload File')}</span>
                          <input
                            type="file"
                            onChange={e => handleDocUpload('businessDocs', doc.key, e.target.files?.[0])}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Owner KYC Documents */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Owner / Signatory Identity Proofs</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'aadhaarFront', label: 'Aadhaar Card (Front)' },
                    { key: 'aadhaarBack', label: 'Aadhaar Card (Back)' },
                    { key: 'pan', label: 'Owner PAN Card' },
                    { key: 'selfie', label: 'Owner Photo / Selfie' }
                  ].map(doc => {
                    const currentUrl = formData.ownerDocs[doc.key];
                    const isUploading = uploadingDoc[`ownerDocs_${doc.key}`];
                    return (
                      <div key={doc.key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700">{doc.label}</span>
                          {currentUrl ? (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Uploaded</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Not Uploaded</span>
                          )}
                        </div>

                        {currentUrl && (
                          <div className="flex items-center gap-2">
                            <a
                              href={currentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-semibold truncate"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" /> View Document
                            </a>
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                ownerDocs: { ...formData.ownerDocs, [doc.key]: '' }
                              })}
                              className="text-[10px] text-rose-500 hover:text-rose-700 font-bold ml-auto"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer shadow-xs">
                          {isUploading ? <Loader2 className="w-3 h-3 animate-spin text-primary-600" /> : <Upload className="w-3 h-3 text-gray-500" />}
                          <span>{isUploading ? 'Uploading...' : (currentUrl ? 'Replace File' : 'Upload File')}</span>
                          <input
                            type="file"
                            onChange={e => handleDocUpload('ownerDocs', doc.key, e.target.files?.[0])}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BANK DETAILS */}
          {activeTab === 'bank' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.bankDetails.accountHolderName}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.bankDetails.accountNumber}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bankDetails.ifsc}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, ifsc: e.target.value.toUpperCase() }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankDetails.bankName}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={formData.bankDetails.branchName}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, branchName: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Type</label>
                  <select
                    value={formData.bankDetails.accountType}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountType: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="savings">Savings Account</option>
                    <option value="current">Current Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.bankDetails.upiId}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, upiId: e.target.value }
                    })}
                    placeholder="e.g. mobile@upi"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Passbook / Cheque Proof */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Cancelled Cheque / Passbook Copy</h4>
                {formData.bankDetails.proof ? (
                  <div className="flex items-center gap-3">
                    <a
                      href={formData.bankDetails.proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Uploaded Cheque / Passbook
                    </a>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, proof: '' }
                      })}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-2">No bank proof document uploaded yet.</p>
                )}

                <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer shadow-xs">
                  {uploadingDoc['bankDetails_proof'] ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600" /> : <Upload className="w-3.5 h-3.5 text-gray-500" />}
                  <span>{uploadingDoc['bankDetails_proof'] ? 'Uploading...' : 'Upload Passbook / Cheque'}</span>
                  <input
                    type="file"
                    onChange={e => handleDocUpload('bankDetails', 'proof', e.target.files?.[0])}
                    className="hidden"
                    disabled={uploadingDoc['bankDetails_proof']}
                  />
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-gray-500">
            {formData.isBookingStopped ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <PauseCircle className="w-3.5 h-3.5" /> Online bookings are paused for this service.
              </span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Service is active and taking online bookings.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Reject / Suspend Reason Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 capitalize">
                {statusModal.targetStatus === 'rejected' ? 'Reject Vendor Service' : 'Suspend Vendor Service'}
              </h3>
              <button
                type="button"
                onClick={() => setStatusModal({ open: false, targetStatus: '', reason: '', customReason: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500">
              Select the primary reason for {statusModal.targetStatus === 'rejected' ? 'rejection' : 'suspension'}. This will be visible to the vendor.
            </p>

            <div className="space-y-2">
              {(statusModal.targetStatus === 'rejected' ? REJECTION_REASONS : SUSPENSION_REASONS).map(r => (
                <label key={r} className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="radio"
                    name="statusReason"
                    value={r}
                    checked={statusModal.reason === r}
                    onChange={() => setStatusModal(prev => ({ ...prev, reason: r }))}
                    className="mt-0.5 text-primary-600"
                  />
                  <span>{r === 'other' ? 'Other reason (specify below)' : r}</span>
                </label>
              ))}
            </div>

            {statusModal.reason === 'other' && (
              <textarea
                rows={3}
                value={statusModal.customReason}
                onChange={e => setStatusModal(prev => ({ ...prev, customReason: e.target.value }))}
                placeholder="Enter specific reason..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
              />
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setStatusModal({ open: false, targetStatus: '', reason: '', customReason: '' })}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm ${
                  statusModal.targetStatus === 'rejected' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Confirm {statusModal.targetStatus === 'rejected' ? 'Rejection' : 'Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Booking Modal */}
      {stopBookingModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-rose-600" /> Stop / Pause Online Bookings
              </h3>
              <button
                type="button"
                onClick={() => setStopBookingModal({ open: false, reason: '', customReason: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              When online bookings are stopped, customers will not be able to place new orders for this service.
            </p>

            <div className="space-y-2">
              {STOP_BOOKING_REASONS.map(r => (
                <label key={r} className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="radio"
                    name="stopBookingReason"
                    value={r}
                    checked={stopBookingModal.reason === r}
                    onChange={() => setStopBookingModal(prev => ({ ...prev, reason: r }))}
                    className="mt-0.5 text-rose-600"
                  />
                  <span>{r === 'other' ? 'Other reason (specify below)' : r}</span>
                </label>
              ))}
            </div>

            {stopBookingModal.reason === 'other' && (
              <textarea
                rows={3}
                value={stopBookingModal.customReason}
                onChange={e => setStopBookingModal(prev => ({ ...prev, customReason: e.target.value }))}
                placeholder="Enter specific reason for pausing bookings..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
              />
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setStopBookingModal({ open: false, reason: '', customReason: '' })}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStopBooking}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Pause Bookings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
