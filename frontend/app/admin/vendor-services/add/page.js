'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { uploadToStorage } from '@/lib/storage';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import toast from 'react-hot-toast';
import { State, City } from 'country-state-city';
import {
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Loader2,
  Copy,
  MessageCircle,
  Sparkles,
  Camera,
  Plus,
  Trash2,
  IndianRupee,
  Building2,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Globe,
  Instagram,
  Navigation
} from 'lucide-react';

const SERVICE_CATEGORIES = [
  'Catering',
  'Makeup & Beauty',
  'Photography',
  'Entertainment',
  'Decor & Floral',
  'Security',
  'Celebrity',
  'Logistics & Support'
];

export default function AdminAddVendorServicePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [vendorMode, setVendorMode] = useState('new'); // 'new'
  const [existingVendors, setExistingVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Vendor info
    vendorId: '',
    vendorName: '',
    vendorMobile: '',
    vendorEmail: '',
    vendorRole: 'owner',

    // Service details
    title: '',
    category: 'Photography',
    companyName: '',
    brandName: '',
    experienceYears: '',
    description: '',
    specialization: '',
    tags: '',

    // Location
    state: '',
    stateCode: '',
    city: '',
    area: '',
    pincode: '',
    officeAddress: '',
    serviceableAreas: '',
    website: '',
    instagram: '',
    facebook: '',

    // Pricing
    startingPrice: '',
    minimumOrderPrice: '',
    packages: [
      { sno: 1, name: 'Standard Package', price: '', unit: 'Per Event', minQty: 1 }
    ],

    // Media
    featuredImage: '',
    images: [],

    // Policies
    advanceBooking: '24h',
    confirmationHours: 3,

    // Certification
    adminCertified: false
  });

  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingAccountError, setExistingAccountError] = useState({ mobile: '', email: '' });

  // Real-time check if vendor mobile already exists
  const checkMobileExists = async (mobileVal) => {
    const clean = (mobileVal || '').replace(/\D/g, '').slice(-10);
    if (clean.length !== 10 || !token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/check-vendor-exists?mobile=${clean}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.exists) {
        setExistingAccountError(prev => ({ ...prev, mobile: data.message || `Account with mobile number ${clean} already exists.` }));
      } else {
        setExistingAccountError(prev => ({ ...prev, mobile: '' }));
      }
    } catch (err) {
      console.error('Error checking mobile exists:', err);
    }
  };

  // Real-time check if vendor email already exists
  const checkEmailExists = async (emailVal) => {
    const clean = (emailVal || '').trim().toLowerCase();
    if (!clean || !clean.includes('@') || !token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/check-vendor-exists?email=${encodeURIComponent(clean)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.exists) {
        setExistingAccountError(prev => ({ ...prev, email: data.message || `Account with email address ${clean} already exists.` }));
      } else {
        setExistingAccountError(prev => ({ ...prev, email: '' }));
      }
    } catch (err) {
      console.error('Error checking email exists:', err);
    }
  };

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedService, setSubmittedService] = useState(null);
  const [vendorCredentials, setVendorCredentials] = useState(null);

  // States list from country-state-city
  const stateOptions = State.getStatesOfCountry('IN');
  const [cityOptions, setCityOptions] = useState([]);

  // Fetch registered vendors for dropdown
  useEffect(() => {
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors-list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.vendors)) {
            setExistingVendors(d.vendors);
            if (d.vendors.length > 0) {
              setFormData(prev => ({ ...prev, vendorId: d.vendors[0]._id }));
            }
          }
          setLoadingVendors(false);
        })
        .catch(() => setLoadingVendors(false));
    }
  }, [token]);

  // Update cities when state changes
  useEffect(() => {
    if (formData.stateCode) {
      const cities = City.getCitiesOfState('IN', formData.stateCode);
      setCityOptions(cities);
    } else {
      setCityOptions([]);
    }
  }, [formData.stateCode]);

  const handleStateChange = (e) => {
    const selectedStateName = e.target.value;
    const matchedState = stateOptions.find(s => s.name === selectedStateName);
    setFormData(prev => ({
      ...prev,
      state: selectedStateName,
      stateCode: matchedState ? matchedState.isoCode : '',
      city: ''
    }));
  };

  // GPS Auto-Detect Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.address) {
            const detectedAddress = data.display_name || '';
            const detectedState = data.address.state || '';
            const detectedCity =
              data.address.city ||
              data.address.town ||
              data.address.suburb ||
              data.address.state_district ||
              '';
            const detectedPincode = (data.address.postcode || '').replace(/\D/g, '').slice(0, 6);
            const detectedArea = data.address.suburb || data.address.neighbourhood || '';

            const matchedState = stateOptions.find(
              s => s.name.toLowerCase() === detectedState.toLowerCase()
            );

            setFormData(prev => ({
              ...prev,
              officeAddress: prev.officeAddress || detectedAddress,
              state: matchedState ? matchedState.name : prev.state,
              stateCode: matchedState ? matchedState.isoCode : prev.stateCode,
              city: detectedCity || prev.city,
              area: prev.area || detectedArea,
              pincode: prev.pincode || detectedPincode
            }));
            toast.success('Location detected successfully! 📍');
          } else {
            toast.success('Coordinates captured! 📍');
          }
        } catch {
          toast.error('Could not reverse geocode coordinates');
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        console.error('Geo error:', err);
        toast.error('Unable to retrieve GPS coordinates.');
        setDetectingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Featured Photo Upload
  const handleFeaturedUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be under 50MB');
      return;
    }

    setUploadingFeatured(true);
    try {
      toast.loading('Uploading featured photo...', { id: 'featured-upload' });
      const uploaded = await uploadToStorage(file, 'vendor-services');
      setFormData(prev => ({ ...prev, featuredImage: uploaded.url }));
      toast.success('Featured photo uploaded! 📸', { id: 'featured-upload' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image', { id: 'featured-upload' });
    } finally {
      setUploadingFeatured(false);
    }
  };

  // Gallery Photos Upload
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (formData.images.length + files.length > 6) {
      toast.error('Maximum 6 gallery photos allowed');
      return;
    }

    setUploadingGallery(true);
    try {
      toast.loading(`Uploading ${files.length} photo(s)...`, { id: 'gallery-upload' });
      const urls = [];
      for (const file of files) {
        const uploaded = await uploadToStorage(file, 'vendor-services');
        urls.push(uploaded.url);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success('Gallery photos uploaded!', { id: 'gallery-upload' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload some gallery photos', { id: 'gallery-upload' });
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryPhoto = (idx) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  // Package builder handlers
  const handleAddPackage = () => {
    setFormData(prev => ({
      ...prev,
      packages: [
        ...prev.packages,
        { sno: prev.packages.length + 1, name: '', price: '', unit: 'Per Event', minQty: 1 }
      ]
    }));
  };

  const handleUpdatePackage = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.packages];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, packages: updated };
    });
  };

  const handleRemovePackage = (index) => {
    if (formData.packages.length === 1) {
      toast.error('At least one package is recommended');
      return;
    }
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index).map((p, i) => ({ ...p, sno: i + 1 }))
    }));
  };

  // Validation
  const validateForm = () => {
    if (!formData.vendorName.trim()) {
      toast.error('Vendor Full Name is required');
      return false;
    }
    const cleanPhone = formData.vendorMobile.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Valid 10-digit Vendor Mobile Number is required');
      return false;
    }
    if (!formData.vendorEmail.trim()) {
      toast.error('Vendor Email Address is required');
      return false;
    }
    if (existingAccountError.mobile) {
      toast.error(existingAccountError.mobile);
      return false;
    }
    if (existingAccountError.email) {
      toast.error(existingAccountError.email);
      return false;
    }

    if (!formData.title.trim()) {
      toast.error('Service Title is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Please select a Service Category');
      return false;
    }
    if (!formData.companyName.trim()) {
      toast.error('Company / Business Name is required');
      return false;
    }
    if (!formData.startingPrice || Number(formData.startingPrice) <= 0) {
      toast.error('Valid Starting Price is required');
      return false;
    }
    if (!formData.featuredImage) {
      toast.error('Featured Image is required');
      return false;
    }
    if (!formData.city) {
      toast.error('City is required');
      return false;
    }
    if (!formData.adminCertified) {
      toast.error('Please confirm the admin certification checkbox');
      return false;
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        vendorName: formData.vendorName.trim(),
        vendorMobile: formData.vendorMobile.trim(),
        vendorEmail: formData.vendorEmail.trim().toLowerCase(),

        title: formData.title.trim(),
        category: formData.category,
        companyName: formData.companyName.trim(),
        brandName: formData.brandName.trim() || undefined,
        experienceYears: Number(formData.experienceYears) || 0,
        description: formData.description.trim(),
        specialization: formData.specialization ? formData.specialization.split(',').map(s => s.trim()).filter(Boolean) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],

        officeAddress: formData.officeAddress.trim() || undefined,
        state: formData.state || undefined,
        city: formData.city || undefined,
        area: formData.area.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        serviceableAreas: formData.serviceableAreas ? formData.serviceableAreas.split(',').map(a => a.trim()).filter(Boolean) : [formData.city],
        website: formData.website.trim() || undefined,
        instagram: formData.instagram.trim() || undefined,
        facebook: formData.facebook.trim() || undefined,

        startingPrice: Number(formData.startingPrice),
        minimumOrderPrice: Number(formData.minimumOrderPrice) || Number(formData.startingPrice),
        packages: formData.packages.filter(p => p.name && p.price).map((p, idx) => ({
          sno: idx + 1,
          name: p.name.trim(),
          price: Number(p.price),
          unit: p.unit || 'Per Event',
          minQty: Number(p.minQty) || 1
        })),

        featuredImage: formData.featuredImage,
        images: formData.images,

        advanceBooking: formData.advanceBooking,
        confirmationHours: Number(formData.confirmationHours) || 3
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendor-services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Vendor service published and approved! 🎉');
        setSubmittedService(data.service);
        setVendorCredentials(data.vendorCredentials);
        setShowSuccessModal(true);
      } else {
        toast.error(data.message || 'Failed to create vendor service');
      }
    } catch (err) {
      console.error('Error submitting vendor service:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getShareMessage = () => {
    const loginId = vendorCredentials?.loginId || vendorCredentials?.email || formData.vendorEmail;
    const password = vendorCredentials?.password || 'Provided during onboarding';
    const loginUrl = vendorCredentials?.loginUrl || 'https://rentalmeet.com/login?role=vendor';

    return `Hello! Your vendor service "${formData.title}" has been successfully listed and verified on RentalMeet by Admin (${user?.name || 'RentalMeet Team'}).\n\nPlease login to your Vendor Dashboard to manage your service bookings and enquiries:\n\nLogin Portal: ${loginUrl}\nLogin Email / ID: ${loginId}\nPassword: ${password}\n\nBest regards,\nRentalMeet Partner Support`;
  };

  const copyShareMessage = () => {
    navigator.clipboard.writeText(getShareMessage());
    toast.success('Share message copied to clipboard! 📋');
  };

  return (
    <AdminLayout title="+ Add Service" subtitle="Onboard and verify a new vendor service instantly">
      <PermissionGuard permission="vendorServices">
        <div className="max-w-5xl mx-auto pb-16">

          {/* Top Bar with Back Link */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/admin/vendor-services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Vendor Services
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Listing as: <span className="font-bold">{user?.name || 'Administrator'}</span> ({user?.role || 'admin'})
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── CARD 1: VENDOR ACCOUNT ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">1</div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Vendor Account & Identification</h2>
                  <p className="text-xs text-slate-500">Enter new vendor contact details (login credentials will be generated)</p>
                </div>
              </div>

              {/* Mode Selector & Existing Dropdown (commented out as requested - keeping only new vendor fields) */}
              {/*
              <div className="grid grid-cols-2 gap-4 mb-5">
                <label
                  onClick={() => setVendorMode('existing')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${vendorMode === 'existing' ? 'border-primary-500 bg-primary-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <input
                    type="radio"
                    name="vendorMode"
                    checked={vendorMode === 'existing'}
                    onChange={() => setVendorMode('existing')}
                    className="accent-primary-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Existing Registered Vendor</span>
                    <span className="text-[11px] text-slate-500">Select from vendors already in the database</span>
                  </div>
                </label>

                <label
                  onClick={() => setVendorMode('new')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${vendorMode === 'new' ? 'border-primary-500 bg-primary-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <input
                    type="radio"
                    name="vendorMode"
                    checked={vendorMode === 'new'}
                    onChange={() => setVendorMode('new')}
                    className="accent-primary-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">+ Create New Vendor Account</span>
                    <span className="text-[11px] text-slate-500">Auto-create vendor login credentials</span>
                  </div>
                </label>
              </div>

              {vendorMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Vendor <span className="text-red-500">*</span>
                  </label>
                  {loadingVendors ? (
                    <div className="py-2 text-xs text-slate-400">Loading registered vendors...</div>
                  ) : existingVendors.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      No registered vendors found. Please select "Create New Vendor Account" above.
                    </div>
                  ) : (
                    <select
                      value={formData.vendorId}
                      onChange={e => {
                        const sel = existingVendors.find(v => v._id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          vendorId: e.target.value,
                          companyName: prev.companyName || sel?.companyName || sel?.name || ''
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      {existingVendors.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.name} ({v.email}) {v.phone ? `· ${v.phone}` : ''} {v.companyName ? `· ${v.companyName}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : null}
              */}

              {/* Vendor Fields (Always shown, matching Admin Add Venue style) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vendor Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma"
                      value={formData.vendorName}
                      onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vendor Mobile (10 digits) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={formData.vendorMobile}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, vendorMobile: val });
                        if (existingAccountError.mobile) setExistingAccountError(prev => ({ ...prev, mobile: '' }));
                      }}
                      onBlur={e => checkMobileExists(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none font-mono ${
                        existingAccountError.mobile ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {existingAccountError.mobile && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {existingAccountError.mobile}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vendor Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="e.g. vendor@example.com"
                      value={formData.vendorEmail}
                      onChange={e => {
                        setFormData({ ...formData, vendorEmail: e.target.value });
                        if (existingAccountError.email) setExistingAccountError(prev => ({ ...prev, email: '' }));
                      }}
                      onBlur={e => checkEmailExists(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none ${
                        existingAccountError.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {existingAccountError.email && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {existingAccountError.email}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-3">
                Vendor login credentials will be generated automatically upon creation.
              </p>
            </div>

            {/* ── CARD 2: SERVICE DETAILS ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">2</div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Service Profile & Offering</h2>
                  <p className="text-xs text-slate-500">Service title, category, company branding, and experience</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Service Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Candid Wedding Photography & 4K Teaser Films"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    {SERVICE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Company / Business Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. LensCraft Studios"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Brand Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LensCraft Weddings"
                    value={formData.brandName}
                    onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 8"
                    value={formData.experienceYears}
                    onChange={e => setFormData({ ...formData, experienceYears: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Service Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what services are included, specialty offerings, client assurances..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Specializations (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Candid, Pre-wedding, Drone Cinematography"
                    value={formData.specialization}
                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Search Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. wedding, photographer, shoot, 4k"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ── CARD 3: LOCATION & SERVICE AREAS ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">3</div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Location & Serviceable Cities</h2>
                    <p className="text-xs text-slate-500">Vendor base office location and operational regions</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {detectingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-primary-600" />}
                  Auto-Detect GPS
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={handleStateChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Select State</option>
                    {stateOptions.map(s => (
                      <option key={s.isoCode} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  {cityOptions.length > 0 ? (
                    <select
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="">Select City</option>
                      {cityOptions.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Bhopal"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 462001"
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Office / Studio Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 102, Commercial Enclave, MP Nagar"
                    value={formData.officeAddress}
                    onChange={e => setFormData({ ...formData, officeAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Serviceable Areas (Cities)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bhopal, Indore, Jaipur"
                    value={formData.serviceableAreas}
                    onChange={e => setFormData({ ...formData, serviceableAreas: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Website Link (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Instagram Handle (Optional)
                  </label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="@lenscraftstudios"
                      value={formData.instagram}
                      onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD 4: PRICING & PACKAGES ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">4</div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Pricing & Package Builder</h2>
                  <p className="text-xs text-slate-500">Set base starting price and customizable client packages</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Starting Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 15000"
                      value={formData.startingPrice}
                      onChange={e => setFormData({ ...formData, startingPrice: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Minimum Order / Booking Price (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 20000"
                      value={formData.minimumOrderPrice}
                      onChange={e => setFormData({ ...formData, minimumOrderPrice: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Package Builder List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Service Packages</span>
                  <button
                    type="button"
                    onClick={handleAddPackage}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Package
                  </button>
                </div>

                {formData.packages.map((pkg, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 w-6">#{pkg.sno}</span>
                    <input
                      type="text"
                      placeholder="Package Name (e.g. Gold Wedding Package)"
                      value={pkg.name}
                      onChange={e => handleUpdatePackage(idx, 'name', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <div className="relative w-32">
                      <IndianRupee className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        placeholder="Price"
                        value={pkg.price}
                        onChange={e => handleUpdatePackage(idx, 'price', e.target.value)}
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <select
                      value={pkg.unit}
                      onChange={e => handleUpdatePackage(idx, 'unit', e.target.value)}
                      className="w-28 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                    >
                      <option value="Per Event">Per Event</option>
                      <option value="Per Day">Per Day</option>
                      <option value="Per Plate">Per Plate</option>
                      <option value="Per Person">Per Person</option>
                      <option value="Per Hour">Per Hour</option>
                      <option value="Per Unit">Per Unit</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemovePackage(idx)}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CARD 5: MEDIA & PORTFOLIO ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">5</div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Featured Image & Gallery</h2>
                  <p className="text-xs text-slate-500">Upload high-resolution photography showcasing the service</p>
                </div>
              </div>

              {/* Featured Image */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Featured / Cover Photo <span className="text-red-500">*</span>
                </label>

                {formData.featuredImage ? (
                  <div className="relative w-full sm:w-80 h-44 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                    <img src={formData.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, featuredImage: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-primary-50/20 transition-all">
                      <Camera className="w-7 h-7 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">Click to Upload Featured Photo</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG under 8MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFeaturedUpload}
                        disabled={uploadingFeatured}
                        className="hidden"
                      />
                    </label>

                    <div className="sm:w-64 flex flex-col justify-center">
                      <span className="text-[11px] text-slate-400 block mb-1 text-center">or paste image URL:</span>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        onBlur={e => {
                          if (e.target.value.trim()) setFormData({ ...formData, featuredImage: e.target.value.trim() });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Additional Gallery Photos (Max 6)
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Upload Photos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      disabled={uploadingGallery}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryPhoto(i)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200">
                    No gallery photos added yet. Optional.
                  </p>
                )}
              </div>
            </div>

            {/* ── CARD 6: ADMIN CERTIFICATION & PUBLISH ── */}
            <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="adminCertified"
                  checked={formData.adminCertified}
                  onChange={e => setFormData({ ...formData, adminCertified: e.target.checked })}
                  className="mt-1 w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="adminCertified" className="cursor-pointer">
                  <span className="text-sm font-bold text-emerald-950 block">
                    Admin Verification & Instant Live Publishing Certification
                  </span>
                  <span className="text-xs text-emerald-800 leading-relaxed block mt-0.5">
                    I confirm that I have reviewed the vendor and service details. This service will be marked as{' '}
                    <strong>Approved</strong> and published immediately under <strong>Listed by: {user?.name || 'Administrator'}</strong>.
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/admin/vendor-services"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-7 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Publishing Service...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Save & Publish Service
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* ── SUCCESS MODAL ── */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Service Published! 🎉
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                "{formData.title}" is now live and listed by <span className="font-semibold">{user?.name}</span>.
              </p>

              {/* Vendor Account Credentials Card */}
              {vendorCredentials?.isNewAccount && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900">New Vendor Account Created</span>
                    <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-semibold">Ready</span>
                  </div>
                  <div className="space-y-1 text-xs text-amber-900">
                    <p><strong>Login ID:</strong> {vendorCredentials.loginId}</p>
                    <p><strong>Password:</strong> {vendorCredentials.password}</p>
                    <p><strong>Login URL:</strong> {vendorCredentials.loginUrl}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
                <button
                  onClick={copyShareMessage}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" /> Copy Share Details
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getShareMessage())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                </a>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/admin/vendor-services');
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View in Vendor Services List
                </button>

                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setFormData({
                      vendorId: existingVendors[0]?._id || '',
                      vendorName: '',
                      vendorMobile: '',
                      vendorEmail: '',
                      vendorRole: 'owner',
                      title: '',
                      category: 'Photography',
                      companyName: '',
                      brandName: '',
                      experienceYears: '',
                      description: '',
                      specialization: '',
                      tags: '',
                      state: '',
                      stateCode: '',
                      city: '',
                      area: '',
                      pincode: '',
                      officeAddress: '',
                      serviceableAreas: '',
                      website: '',
                      instagram: '',
                      facebook: '',
                      startingPrice: '',
                      minimumOrderPrice: '',
                      packages: [{ sno: 1, name: 'Standard Package', price: '', unit: 'Per Event', minQty: 1 }],
                      featuredImage: '',
                      images: [],
                      advanceBooking: '24h',
                      confirmationHours: 3,
                      adminCertified: false
                    });
                  }}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700"
                >
                  + Add Another Service
                </button>
              </div>
            </div>
          </div>
        )}

      </PermissionGuard>
    </AdminLayout>
  );
}
