'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { uploadToStorage } from '@/lib/storage';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import toast from 'react-hot-toast';
import { State, City } from 'country-state-city';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Loader2,
  Share2,
  Copy,
  MessageCircle,
  Car,
  ShieldCheck,
  Sparkles,
  Camera,
  Check,
  Layers,
  IndianRupee,
  UtensilsCrossed,
  Users,
  Maximize2,
  ArrowRight,
  Info,
  ArrowLeft,
  KeyRound,
  ExternalLink
} from 'lucide-react';

// ── 12 Standard Categories ───────────────────────────────────────────────────
const VENUE_CATEGORIES = [
  'Meeting Hall',
  'Restaurant',
  'Conference Hall',
  'Co-Work Space',
  'Auditorium',
  'Guest House',
  'Banquet Hall',
  'Training Center',
  'Farm House',
  'Marriage Garden',
  'Hotel',
  'Play Zone'
];

// ── Capacity Options ──────────────────────────────────────────────────────────
const CAPACITY_OPTIONS = [
  'Up to 10',
  '10-25',
  '25–50',
  '50–100',
  '100–150',
  '150–200',
  '200-300',
  '300-400',
  '400-500',
  '500-700',
  '700-1000',
  '1000-1500',
  '1500-2000',
  '2000+'
];

// ── Food Types ───────────────────────────────────────────────────────────────
const FOOD_TYPES = ['Veg', 'Non-Veg', 'Both'];

// ── Photo Categories ─────────────────────────────────────────────────────────
const PHOTO_SLOTS = [
  { key: 'Front / Entrance', label: 'Front / Entrance Photo', required: true, hint: 'Exterior or main entrance view' },
  { key: 'Main Hall / Space', label: 'Main Hall / Space Photo', required: true, hint: 'Central hall or main function space' },
  { key: 'Seating Area', label: 'Seating Area Photo', required: true, hint: 'Guest chairs, tables, or stage seating' },
  { key: 'Parking', label: 'Parking Area Photo', required: false, hint: 'Vehicle parking area' },
  { key: 'Facilities', label: 'Facilities Photo', required: false, hint: 'Restrooms, air conditioning, stage, etc.' },
  { key: 'Outdoor Area', label: 'Outdoor Area Photo', required: false, hint: 'Lawn, garden, terrace or open deck' },
  { key: 'Other', label: 'Other Photo', required: false, hint: 'Any additional view' }
];

export default function AdminAddVenuePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  // ── Form State ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // Basic Details
    venueName: '',
    authorizedPerson: '',
    mobile: '',
    email: '',
    description: '',

    // Location
    address: '',
    area: '',
    pincode: '',
    state: '',
    stateCode: '',
    city: '',
    googleMapLink: '',
    latitude: null,
    longitude: null,

    // Specifications
    categories: [],
    foodType: 'Veg',
    capacity: '50–100',
    totalAreaSqft: '',

    // Pricing Models
    pricingModels: ['Only Rent'], // 'Only Rent', 'Rent (Included Amenities)', 'Per Pax'
    onlyRent: {
      hourlyRate: '',
      hourlyExtraPerHour: '',
      halfDayRate: '',
      halfDayExtraPerHour: '',
      fullDayRate: '',
      fullDayExtraPerHour: ''
    },
    rentWithAmenities: {
      hourlyRate: '',
      hourlyExtraPerHour: '',
      halfDayRate: '',
      halfDayExtraPerHour: '',
      fullDayRate: '',
      fullDayExtraPerHour: ''
    },
    perPax: {
      withoutFoodRate: '',
      withoutFoodMinPax: '50',
      onlyBreakfastRate: '',
      onlyBreakfastMinPax: '50',
      breakfastLunchRate: '',
      breakfastLunchMinPax: '50',
      onlyLunchRate: '',
      onlyLunchMinPax: '50',
      onlyDinnerRate: '',
      onlyDinnerMinPax: '50',
      allMealsRate: '',
      allMealsMinPax: '50'
    },

    // Parking
    parkingType: 'None', // 'None', 'Free', 'Limited', 'Paid'
    parkingCarsCapacity: '',
    parkingTwoWheelerCapacity: '',
    parkingCarCharges: '',
    parkingTwoWheelerCharges: '',

    // Photos: array of { url, publicId, category, isFeatured }
    photos: [],

    // Terms
    adminCertified: true
  });

  // UI helpers
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState(null);

  // Success Modal State
  const [submittedVenue, setSubmittedVenue] = useState(null);
  const [ownerCredentials, setOwnerCredentials] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Indian States & Cities list
  const stateOptions = State.getStatesOfCountry('IN').map((s) => ({
    name: s.name,
    code: s.isoCode
  }));

  const cityOptions = formData.stateCode
    ? City.getCitiesOfState('IN', formData.stateCode).map((c) => c.name)
    : [];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStateChange = (stateName) => {
    const matched = stateOptions.find((s) => s.name === stateName);
    setFormData((prev) => ({
      ...prev,
      state: stateName,
      stateCode: matched ? matched.code : '',
      city: ''
    }));
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category]
      };
    });
  };

  const handlePricingModelToggle = (model) => {
    setFormData((prev) => {
      const exists = prev.pricingModels.includes(model);
      if (exists && prev.pricingModels.length === 1) {
        toast.error('At least one pricing model must be selected');
        return prev;
      }
      return {
        ...prev,
        pricingModels: exists
          ? prev.pricingModels.filter((m) => m !== model)
          : [...prev.pricingModels, model]
      };
    });
  };

  const handleNestedPricingChange = (modelGroup, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [modelGroup]: {
        ...prev[modelGroup],
        [field]: value
      }
    }));
  };

  // ── Auto-Detect Location (GPS & Reverse Geocoding) ─────────────────────────
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const gMapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
          googleMapLink: gMapUrl
        }));

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
            const detectedArea = data.address.suburb || data.address.neighbourhood || data.address.residential || '';

            setFormData((prev) => {
              const matchedState = stateOptions.find(
                (s) => s.name.toLowerCase() === detectedState.toLowerCase()
              );
              return {
                ...prev,
                address: prev.address || detectedAddress,
                state: matchedState ? matchedState.name : prev.state,
                stateCode: matchedState ? matchedState.code : prev.stateCode,
                city: detectedCity || prev.city,
                area: prev.area || detectedArea,
                pincode: prev.pincode || detectedPincode
              };
            });
            toast.success('Location, address & pincode detected! 📍');
          } else {
            toast.success('Coordinates captured from GPS! 📍');
          }
        } catch {
          toast.success('GPS coordinates captured! 📍');
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        console.error('Geo error:', err);
        toast.error('Unable to retrieve location. Please paste Google Maps link manually.');
        setDetectingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ── Photo Upload ───────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size must be under 8MB');
      return;
    }

    setUploadingCategory(category);
    try {
      toast.loading(`Uploading ${category} photo...`, { id: 'upload-toast' });
      const uploaded = await uploadToStorage(file, 'venues');

      setFormData((prev) => {
        const filtered = prev.photos.filter((p) => p.category !== category);
        const newPhoto = {
          url: uploaded.url,
          publicId: uploaded.publicId,
          category,
          isFeatured: category === 'Front / Entrance' || prev.photos.length === 0
        };
        return {
          ...prev,
          photos: [...filtered, newPhoto]
        };
      });

      toast.success(`${category} photo uploaded!`, { id: 'upload-toast' });
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast.error('Failed to upload photo. Please try again.', { id: 'upload-toast' });
    } finally {
      setUploadingCategory(null);
    }
  };

  const removePhoto = (category) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.category !== category)
    }));
    toast.success(`${category} photo removed`);
  };

  // ── Form Validation ────────────────────────────────────────────────────────
  const validateForm = () => {
    if (!formData.venueName.trim()) {
      toast.error('Venue Name is required');
      return false;
    }
    if (!formData.authorizedPerson.trim()) {
      toast.error('Authorized Person / Owner Name is required');
      return false;
    }
    const cleanPhone = formData.mobile.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      toast.error('Owner Mobile Number must be 10 digits');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Valid Owner Login Email is required');
      return false;
    }
    if (!formData.address.trim()) {
      toast.error('Venue Address is required');
      return false;
    }
    if (!formData.state) {
      toast.error('Please select State');
      return false;
    }
    if (!formData.city) {
      toast.error('Please select City');
      return false;
    }
    if (formData.categories.length === 0) {
      toast.error('Please select at least 1 Venue Category');
      return false;
    }
    if (!formData.foodType) {
      toast.error('Please select Allowed Food Type');
      return false;
    }
    if (!formData.capacity) {
      toast.error('Please select Venue Capacity');
      return false;
    }
    if (!formData.totalAreaSqft || Number(formData.totalAreaSqft) <= 0) {
      toast.error('Total Area (in Sq.Ft.) is required');
      return false;
    }

    // Required photos
    const hasFront = formData.photos.some((p) => p.category === 'Front / Entrance');
    const hasHall = formData.photos.some((p) => p.category === 'Main Hall / Space');
    const hasSeating = formData.photos.some((p) => p.category === 'Seating Area');

    if (!hasFront || !hasHall || !hasSeating) {
      const missing = [];
      if (!hasFront) missing.push('Front / Entrance');
      if (!hasHall) missing.push('Main Hall / Space');
      if (!hasSeating) missing.push('Seating Area');
      toast.error(`Mandatory photos missing: ${missing.join(', ')}`);
      return false;
    }

    if (!formData.adminCertified) {
      toast.error('Please confirm admin certification checkbox');
      return false;
    }

    return true;
  };

  // ── Admin Venue Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const cleanPhone = formData.mobile.replace(/\D/g, '').slice(-10);

      // Build payload matching backend Venue schema and Admin onboarding
      const payload = {
        businessName: formData.venueName.trim(),
        description: formData.description?.trim() || undefined,
        venueType: formData.categories,
        foodType: formData.foodType,
        capacity: formData.capacity,
        areaSqft: Number(formData.totalAreaSqft),
        termsAccepted: true,
        listingSource: 'admin',
        onboardingPhase: 1,
        isProvisional: false,

        // Owner Info (Admin registers on behalf of owner without OTP)
        ownerInfo: {
          fullName: formData.authorizedPerson.trim(),
          mobile: cleanPhone,
          email: formData.email.trim().toLowerCase(),
          authorisedPerson: {
            name: formData.authorizedPerson.trim(),
            fullName: formData.authorizedPerson.trim(),
            phone: cleanPhone,
            mobile: cleanPhone,
            email: formData.email.trim().toLowerCase()
          }
        },

        // Location
        location: {
          address: formData.address.trim(),
          landmark: formData.address.trim(),
          state: formData.state,
          city: formData.city,
          area: formData.area?.trim() || formData.city,
          pincode: formData.pincode?.trim() || '000000',
          googleMapLink:
            formData.googleMapLink ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              formData.venueName + ' ' + formData.city
            )}`,
          parkingAvailability: formData.parkingType,
          parkingDetails: {
            type: formData.parkingType,
            carsCapacity: Number(formData.parkingCarsCapacity || 0),
            twoWheelerCapacity: Number(formData.parkingTwoWheelerCapacity || 0),
            carCharges: Number(formData.parkingCarCharges || 0),
            twoWheelerCharges: Number(formData.parkingTwoWheelerCharges || 0)
          }
        },

        // Pricing Models
        pricing: {
          selectedPricingModels: formData.pricingModels,
          onlyRent: {
            hourly: {
              rate: Number(formData.onlyRent.hourlyRate || 0),
              extraPerHour: Number(formData.onlyRent.hourlyExtraPerHour || 0)
            },
            halfDay: {
              rate: Number(formData.onlyRent.halfDayRate || 0),
              extraPerHour: Number(formData.onlyRent.halfDayExtraPerHour || 0)
            },
            fullDay: {
              rate: Number(formData.onlyRent.fullDayRate || 0),
              extraPerHour: Number(formData.onlyRent.fullDayExtraPerHour || 0)
            }
          },
          rentWithAmenities: {
            hourly: {
              rate: Number(formData.rentWithAmenities.hourlyRate || 0),
              extraPerHour: Number(formData.rentWithAmenities.hourlyExtraPerHour || 0)
            },
            halfDay: {
              rate: Number(formData.rentWithAmenities.halfDayRate || 0),
              extraPerHour: Number(formData.rentWithAmenities.halfDayExtraPerHour || 0)
            },
            fullDay: {
              rate: Number(formData.rentWithAmenities.fullDayRate || 0),
              extraPerHour: Number(formData.rentWithAmenities.fullDayExtraPerHour || 0)
            }
          },
          perPax: {
            withoutFood: {
              rate: Number(formData.perPax.withoutFoodRate || 0),
              minPax: Number(formData.perPax.withoutFoodMinPax || 50)
            },
            breakfastOnly: {
              rate: Number(formData.perPax.onlyBreakfastRate || 0),
              minPax: Number(formData.perPax.onlyBreakfastMinPax || 50)
            },
            breakfastLunch: {
              rate: Number(formData.perPax.breakfastLunchRate || 0),
              minPax: Number(formData.perPax.breakfastLunchMinPax || 50)
            },
            lunchOnly: {
              rate: Number(formData.perPax.onlyLunchRate || 0),
              minPax: Number(formData.perPax.onlyLunchMinPax || 50)
            },
            dinnerOnly: {
              rate: Number(formData.perPax.onlyDinnerRate || 0),
              minPax: Number(formData.perPax.onlyDinnerMinPax || 50)
            },
            allMeals: {
              rate: Number(formData.perPax.allMealsRate || 0),
              minPax: Number(formData.perPax.allMealsMinPax || 50)
            }
          }
        },

        // Photos
        images: formData.photos.map((p) => ({
          url: p.url,
          category: p.category,
          isFeatured: p.isFeatured
        }))
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Venue successfully created and approved! 🎉');
        setSubmittedVenue(data.venue);
        setOwnerCredentials(
          data.ownerCredentials || {
            isNewAccount: true,
            loginId: formData.email.trim().toLowerCase(),
            email: formData.email.trim().toLowerCase(),
            password: `RM@${cleanPhone.slice(-4)}`,
            loginUrl: 'https://rentalmeet.com/login?role=owner'
          }
        );
        setShowSuccessModal(true);
      } else {
        toast.error(data.message || 'Venue creation failed');
      }
    } catch (err) {
      console.error('Error adding venue as admin:', err);
      toast.error('Network error adding venue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Share Message Generator ────────────────────────────────────────────────
  const getShareMessage = () => {
    const loginEmail = ownerCredentials?.loginId || ownerCredentials?.email || formData.email;
    const password = ownerCredentials?.password || `RM@${formData.mobile.slice(-4)}`;
    const loginLink = ownerCredentials?.loginUrl || 'https://rentalmeet.com/login?role=owner';

    return `Your venue "${formData.venueName}" has been successfully listed on RentalMeet by Admin.\n\nPlease login to manage your venue and bookings:\n\nLogin Link : ${loginLink}\nLogin Email ID : ${loginEmail}\nPassword : ${password}`;
  };

  const copyShareMessage = () => {
    navigator.clipboard.writeText(getShareMessage());
    toast.success('Login credentials and message copied to clipboard! 📋');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied! 📋`);
  };

  const shareViaWhatsApp = () => {
    const phone = formData.mobile.replace(/\D/g, '').slice(-10);
    const text = encodeURIComponent(getShareMessage());
    const url = `https://wa.me/91${phone}?text=${text}`;
    window.open(url, '_blank');
  };

  const shareViaSms = () => {
    const phone = formData.mobile.replace(/\D/g, '').slice(-10);
    const text = encodeURIComponent(getShareMessage());
    window.location.href = `sms:+91${phone}?body=${text}`;
  };

  const handleResetForm = () => {
    setShowSuccessModal(false);
    setSubmittedVenue(null);
    setOwnerCredentials(null);
    setFormData({
      venueName: '',
      authorizedPerson: '',
      mobile: '',
      email: '',
      address: '',
      area: '',
      pincode: '',
      state: '',
      stateCode: '',
      city: '',
      googleMapLink: '',
      latitude: null,
      longitude: null,
      categories: [],
      foodType: 'Veg',
      capacity: '50–100',
      totalAreaSqft: '',
      pricingModels: ['Only Rent'],
      onlyRent: {
        hourlyRate: '',
        hourlyExtraPerHour: '',
        halfDayRate: '',
        halfDayExtraPerHour: '',
        fullDayRate: '',
        fullDayExtraPerHour: ''
      },
      rentWithAmenities: {
        hourlyRate: '',
        hourlyExtraPerHour: '',
        halfDayRate: '',
        halfDayExtraPerHour: '',
        fullDayRate: '',
        fullDayExtraPerHour: ''
      },
      perPax: {
        withoutFoodRate: '',
        withoutFoodMinPax: '50',
        onlyBreakfastRate: '',
        onlyBreakfastMinPax: '50',
        breakfastLunchRate: '',
        breakfastLunchMinPax: '50',
        onlyLunchRate: '',
        onlyLunchMinPax: '50',
        onlyDinnerRate: '',
        onlyDinnerMinPax: '50',
        allMealsRate: '',
        allMealsMinPax: '50'
      },
      parkingType: 'None',
      parkingCarsCapacity: '',
      parkingTwoWheelerCapacity: '',
      parkingCarCharges: '',
      parkingTwoWheelerCharges: '',
      photos: [],
      adminCertified: true
    });
  };

  return (
    <AdminLayout>
      <PermissionGuard permission="addVenue">
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
          {/* Breadcrumb & Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
                <Link href="/admin/venues" className="hover:text-primary-600 flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Venues
                </Link>
                <span>/</span>
                <span className="text-gray-800">Add New Venue</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Building2 className="w-7 h-7 text-primary-600" />
                Add New Venue
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Admin Direct Onboarding • Audit Log Recorded
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Mode: Auto-Approved
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── SECTION 1: Venue Basic & Owner Details ──────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Venue &amp; Owner Information</h2>
                    <p className="text-[11px] text-gray-500">Provide venue name and owner details for account generation</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Venue Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Royal Crystal Banquet"
                      value={formData.venueName}
                      onChange={(e) => handleChange('venueName', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Authorized Person / Owner Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.authorizedPerson}
                      onChange={(e) => handleChange('authorizedPerson', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Owner Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={formData.mobile}
                      onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Owner Login Email ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. owner@gmail.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-primary-600 font-medium mt-1">
                    Owner will use this Email ID to log in
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    About Venue / Description <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description about the venue, suitable events, hospitality, ambiance..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    If left blank, an elegant automated description highlighting your venue and city will be generated.
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Venue Address & Location ─────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Venue Address &amp; Location</h2>
                    <p className="text-[11px] text-gray-500">Provide complete address, state, city, and area</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={detectingLocation}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-blue-200"
                >
                  <Navigation className={`w-3.5 h-3.5 ${detectingLocation ? 'animate-spin' : ''}`} />
                  {detectingLocation ? 'Detecting...' : 'Auto Detect GPS'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Venue Address / Street <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      placeholder="Building, street, landmark, road name..."
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white outline-none"
                    >
                      <option value="">Select State</option>
                      {stateOptions.map((s) => (
                        <option key={s.code} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={!formData.stateCode}
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white outline-none disabled:bg-gray-100"
                    >
                      <option value="">{formData.stateCode ? 'Select City' : 'Select State first'}</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Location / Area field */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Location / Area <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MP Nagar, Civil Lines"
                      value={formData.area}
                      onChange={(e) => handleChange('area', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  {/* Optional Pincode field */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Pincode <span className="text-gray-400 text-[10px] font-normal">(Optional - 6 digits)</span>
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="e.g. 462011"
                      value={formData.pincode}
                      onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Google Maps Link <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/... or https://www.google.com/maps?q=..."
                    value={formData.googleMapLink}
                    onChange={(e) => handleChange('googleMapLink', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 3: Venue Type & Specifications ─────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Venue Categories &amp; Specifications</h2>
                    <p className="text-[11px] text-gray-500">Select applicable categories, seating capacity, and food preferences</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {formData.categories.length} selected
                </span>
              </div>

              {/* 12 Categories */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Venue Categories (Multi-select) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {VENUE_CATEGORIES.map((cat) => {
                    const isSelected = formData.categories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary-50 border-primary-500 text-primary-800 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specifications: Capacity, Area, Food Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Venue Capacity <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.capacity}
                    onChange={(e) => handleChange('capacity', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white outline-none"
                  >
                    {CAPACITY_OPTIONS.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap} Guests
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Total Area (in Sq.Ft.) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Maximize2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 5000"
                      value={formData.totalAreaSqft}
                      onChange={(e) => handleChange('totalAreaSqft', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Allowed Food Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FOOD_TYPES.map((ft) => (
                      <button
                        type="button"
                        key={ft}
                        onClick={() => handleChange('foodType', ft)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                          formData.foodType === ft
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {ft}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 4: Parking Facility ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Parking Facility</h2>
                    <p className="text-[11px] text-gray-500">Configure parking availability, capacities, and charges</p>
                  </div>
                </div>
                <Car className="w-5 h-5 text-gray-400" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['None', 'Free', 'Limited', 'Paid'].map((pt) => (
                  <button
                    type="button"
                    key={pt}
                    onClick={() => handleChange('parkingType', pt)}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                      formData.parkingType === pt
                        ? 'bg-primary-50 border-primary-500 text-primary-800 ring-2 ring-primary-500/20'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {pt === 'None' ? '🚫 No Parking' : pt === 'Free' ? '🆓 Free Parking' : pt === 'Limited' ? '⚠️ Limited' : '💳 Paid Parking'}
                  </button>
                ))}
              </div>

              {formData.parkingType !== 'None' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Cars Capacity
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 50"
                      value={formData.parkingCarsCapacity}
                      onChange={(e) => handleChange('parkingCarsCapacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Two-Wheelers Capacity
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 100"
                      value={formData.parkingTwoWheelerCapacity}
                      onChange={(e) => handleChange('parkingTwoWheelerCapacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  {formData.parkingType === 'Paid' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Car Parking Charge (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder="e.g. 100"
                          value={formData.parkingCarCharges}
                          onChange={(e) => handleChange('parkingCarCharges', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Bike Parking Charge (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder="e.g. 30"
                          value={formData.parkingTwoWheelerCharges}
                          onChange={(e) => handleChange('parkingTwoWheelerCharges', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 5: Pricing Models ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                    5
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Pricing Models</h2>
                    <p className="text-[11px] text-gray-500">Configure Only Rent, Rent with Amenities, or Per Pax rates</p>
                  </div>
                </div>
                <IndianRupee className="w-5 h-5 text-gray-400" />
              </div>

              {/* Model Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'Only Rent', label: '1. Only Rent' },
                  { key: 'Rent (Included Amenities)', label: '2. Rent + Amenities' },
                  { key: 'Per Pax', label: '3. Per Pax' }
                ].map((m) => {
                  const isSelected = formData.pricingModels.includes(m.key);
                  return (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => handlePricingModelToggle(m.key)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-primary-50 border-primary-500 text-primary-800'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{m.label}</span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-primary-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Only Rent Tab */}
              {formData.pricingModels.includes('Only Rent') && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <h3 className="text-xs font-bold text-gray-900">Only Rent Rates (Venue Only)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Hourly Rate (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 1500"
                        value={formData.onlyRent.hourlyRate}
                        onChange={(e) => handleNestedPricingChange('onlyRent', 'hourlyRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Half Day Rate (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 8000"
                        value={formData.onlyRent.halfDayRate}
                        onChange={(e) => handleNestedPricingChange('onlyRent', 'halfDayRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Full Day Rate (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 15000"
                        value={formData.onlyRent.fullDayRate}
                        onChange={(e) => handleNestedPricingChange('onlyRent', 'fullDayRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Rent with Amenities Tab */}
              {formData.pricingModels.includes('Rent (Included Amenities)') && (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3">
                  <h3 className="text-xs font-bold text-blue-900">Rent Included Amenities Rates</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Hourly Rate (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 2500"
                        value={formData.rentWithAmenities.hourlyRate}
                        onChange={(e) => handleNestedPricingChange('rentWithAmenities', 'hourlyRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Half Day Rate (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 12000"
                        value={formData.rentWithAmenities.halfDayRate}
                        onChange={(e) => handleNestedPricingChange('rentWithAmenities', 'halfDayRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Full Day Rate (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 22000"
                        value={formData.rentWithAmenities.fullDayRate}
                        onChange={(e) => handleNestedPricingChange('rentWithAmenities', 'fullDayRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Per Pax Tab */}
              {formData.pricingModels.includes('Per Pax') && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-emerald-900">Per Person (Per Pax) Rates</h3>
                    <span className="text-[11px] text-emerald-700">All 6 catering package rates &amp; minimum pax</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-emerald-100/60 text-emerald-900 font-semibold border-b border-emerald-200">
                        <tr>
                          <th className="p-3">Meal / Package Type</th>
                          <th className="p-3">Rate (₹ / Pax)</th>
                          <th className="p-3 w-36">Minimum Pax</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {[
                          { keyRate: 'withoutFoodRate', keyPax: 'withoutFoodMinPax', label: 'Without Food', exRate: '250' },
                          { keyRate: 'onlyBreakfastRate', keyPax: 'onlyBreakfastMinPax', label: 'Only Breakfast', exRate: '350' },
                          { keyRate: 'breakfastLunchRate', keyPax: 'breakfastLunchMinPax', label: 'Breakfast + Lunch', exRate: '550' },
                          { keyRate: 'onlyLunchRate', keyPax: 'onlyLunchMinPax', label: 'Only Lunch', exRate: '500' },
                          { keyRate: 'onlyDinnerRate', keyPax: 'onlyDinnerMinPax', label: 'Only Dinner', exRate: '600' },
                          { keyRate: 'allMealsRate', keyPax: 'allMealsMinPax', label: 'All Meals (Breakfast + Lunch + Dinner)', exRate: '850' }
                        ].map((row) => (
                          <tr key={row.keyRate} className="hover:bg-emerald-50/30">
                            <td className="p-3 font-semibold text-gray-800">{row.label}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                placeholder={`e.g. ${row.exRate}`}
                                value={formData.perPax[row.keyRate]}
                                onChange={(e) => handleNestedPricingChange('perPax', row.keyRate, e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={1}
                                placeholder="50"
                                value={formData.perPax[row.keyPax]}
                                onChange={(e) => handleNestedPricingChange('perPax', row.keyPax, e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION 6: Photo Upload ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                    6
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Venue Photos</h2>
                    <p className="text-[11px] text-gray-500">
                      Upload minimum 3 mandatory photos (Entrance, Main Hall, Seating)
                    </p>
                  </div>
                </div>
                <Camera className="w-5 h-5 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {PHOTO_SLOTS.map((slot) => {
                  const uploaded = formData.photos.find((p) => p.category === slot.key);
                  const isUploading = uploadingCategory === slot.key;

                  return (
                    <div
                      key={slot.key}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        uploaded
                          ? 'bg-green-50/40 border-green-200'
                          : slot.required
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-dashed border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-800">{slot.label}</span>
                          {slot.required ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                              Required
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Optional</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500">{slot.hint}</p>
                      </div>

                      {uploaded ? (
                        <div className="mt-2.5 relative group">
                          <img
                            src={uploaded.url}
                            alt={slot.key}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(slot.key)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-md shadow transition-colors"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2.5">
                          <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 cursor-pointer transition-colors">
                            {isUploading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 text-gray-400" />
                                <span>Upload</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploading}
                              onChange={(e) => handlePhotoUpload(e, slot.key)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 7: Admin Confirmation & Submit ──────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="adminCertified"
                  required
                  checked={formData.adminCertified}
                  onChange={(e) => handleChange('adminCertified', e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="adminCertified" className="text-xs text-gray-700 leading-relaxed cursor-pointer select-none">
                  <span className="font-bold text-gray-900">Admin Certification &amp; Instant Approval:</span>{' '}
                  I confirm that as an administrator, I have verified the venue details. Submitting this form directly creates an active, approved venue listing on the platform and generates owner credentials for dashboard access.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-700 hover:to-amber-700 text-white font-bold text-sm tracking-wide rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Adding &amp; Approving Venue...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> CREATE &amp; APPROVE VENUE
                  </>
                )}
              </button>
            </div>

          </form>

          {/* ── SUCCESS MODAL WITH OWNER LOGIN EMAIL & PASSWORD ───────────────── */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-in">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      Venue Created &amp; Approved! 🎉
                    </h3>
                    <p className="text-xs text-gray-500">
                      {submittedVenue?.businessName} is now listed on RentalMeet
                    </p>
                  </div>
                </div>

                {/* Owner Credentials Highlight Box */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-primary-50 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-700" /> Owner Login Credentials
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                      Ready to Use
                    </span>
                  </div>

                  <div className="space-y-2 bg-white p-3 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Login Email ID:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-gray-900 font-mono">
                          {ownerCredentials?.loginId || ownerCredentials?.email || formData.email}
                        </strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(ownerCredentials?.loginId || ownerCredentials?.email || formData.email, 'Login Email')}
                          className="p-1 hover:bg-gray-100 text-gray-500 rounded"
                          title="Copy Email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-1.5">
                      <span className="text-gray-500">Password:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-gray-900 font-mono">
                          {ownerCredentials?.password || `RM@${formData.mobile.slice(-4)}`}
                        </strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(ownerCredentials?.password || `RM@${formData.mobile.slice(-4)}`, 'Password')}
                          className="p-1 hover:bg-gray-100 text-gray-500 rounded"
                          title="Copy Password"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-1.5">
                      <span className="text-gray-500">Login URL:</span>
                      <a
                        href={ownerCredentials?.loginUrl || 'https://rentalmeet.com/login?role=owner'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        rentalmeet.com/login <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 leading-tight">
                    💡 Please share the <strong>Login Email ID</strong> and <strong>Password</strong> with the owner so they can log in to their dashboard.
                  </p>
                </div>

                {/* Message Template Preview */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-700">Quick Share Message Template:</span>
                  <div className="p-3 bg-gray-50 rounded-xl text-xs font-mono text-gray-700 leading-relaxed border border-gray-200 whitespace-pre-wrap select-all max-h-32 overflow-y-auto">
                    {getShareMessage()}
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={shareViaWhatsApp}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={shareViaSms}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Send SMS
                  </button>
                </div>

                <button
                  type="button"
                  onClick={copyShareMessage}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-200"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Message &amp; Credentials
                </button>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    + Add Another Venue
                  </button>

                  <Link
                    href="/admin/venues"
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Go to Venues List &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
