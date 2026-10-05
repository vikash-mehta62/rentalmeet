'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { uploadToStorage } from '@/lib/storage';
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
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';

// ── 12 Specific Categories from Venue form- Revised.docx ──────────────────────
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

// ── Exact Capacities from Venue form- Revised.docx ─────────────────────────────
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

// ── Food Types ─────────────────────────────────────────────────────────────────
const FOOD_TYPES = ['Veg', 'Non-Veg', 'Both'];

// ── Photo Categories from Venue form- Revised.docx ─────────────────────────────
const PHOTO_SLOTS = [
  { key: 'Front / Entrance', label: 'Front / Entrance Photo', required: true, hint: 'Exterior or main entrance view' },
  { key: 'Main Hall / Space', label: 'Main Hall / Space Photo', required: true, hint: 'Central hall or main function space' },
  { key: 'Seating Area', label: 'Seating Area Photo', required: true, hint: 'Guest chairs, tables, or stage seating' },
  { key: 'Parking', label: 'Parking Area Photo', required: false, hint: 'Vehicle parking area' },
  { key: 'Facilities', label: 'Facilities Photo', required: false, hint: 'Restrooms, air conditioning, stage, etc.' },
  { key: 'Outdoor Area', label: 'Outdoor Area Photo', required: false, hint: 'Lawn, garden, terrace or open deck' },
  { key: 'Other', label: 'Other Photo', required: false, hint: 'Any additional view' }
];

export default function AmbassadorAddVenuePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  // Authentication guard
  useEffect(() => {
    if (!token) {
      router.push('/login?role=ambassador');
    }
  }, [token, router]);

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
    termsAccepted: false
  });

  // UI helpers
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState(null);

  // OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [debugOtp, setDebugOtp] = useState('');

  // Success Modal State
  const [submittedVenue, setSubmittedVenue] = useState(null);
  const [ownerCredentials, setOwnerCredentials] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Timer countdown
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

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

  const toggleCategory = (cat) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      const updated = exists
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: updated };
    });
  };

  const togglePricingModel = (model) => {
    setFormData((prev) => {
      const exists = prev.pricingModels.includes(model);
      if (exists && prev.pricingModels.length === 1) {
        toast.error('Select at least one pricing model');
        return prev;
      }
      const updated = exists
        ? prev.pricingModels.filter((m) => m !== model)
        : [...prev.pricingModels, model];
      return { ...prev, pricingModels: updated };
    });
  };

  // ── Auto Detect Location (GPS + Reverse Geocode) ───────────────────────────
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
          // Free Nominatim reverse geocode for quick autofill
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
        setDetectingLocation(false);
        if (err.code === 1) {
          toast.error('Location permission denied. Please allow location access in your browser settings.');
        } else if (err.code === 2) {
          toast.error('GPS position unavailable. Please enter address manually.');
        } else if (err.code === 3) {
          toast.error('Location request timed out. Please try again or enter manually.');
        } else {
          toast.error('Unable to fetch GPS position. Please enter address manually.');
        }
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  // ── Mobile OTP Verification ────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const cleanPhone = formData.mobile.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          name: formData.authorizedPerson || formData.venueName || 'Venue Owner',
          purpose: 'owner_verification'
        })
      });

      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        if (data.otp) setDebugOtp(data.otp);
        toast.success(data.message || 'OTP sent to mobile number!');
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch {
      toast.error('Network error sending OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!enteredOtp || enteredOtp.trim().length < 4) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.mobile.replace(/\D/g, '').slice(-10),
          otp: enteredOtp.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsPhoneVerified(true);
        setOtpSent(false);
        toast.success('Mobile number verified successfully! 🎉');
      } else {
        toast.error(data.message || 'Invalid or expired OTP');
      }
    } catch {
      toast.error('Network error verifying OTP');
    } finally {
      setVerifyingOtp(false);
    }
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
        // Replace existing photo for this category if already present, or append
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
      toast.error('Authorized Person Name is required');
      return false;
    }
    const cleanPhone = formData.mobile.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      toast.error('Venue Mobile Number must be 10 digits');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Valid Venue Email is required');
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
    if (formData.pricingModels.length === 0) {
      toast.error('Please select at least 1 Pricing Model');
      return false;
    }

    // Verify minimum 3 photos
    if (formData.photos.length < 3) {
      toast.error(`At least 3 photos are required (Current: ${formData.photos.length}/3)`);
      return false;
    }

    // Check 3 mandatory categories
    const categoriesUploaded = formData.photos.map((p) => p.category);
    const hasFront = categoriesUploaded.includes('Front / Entrance');
    const hasHall = categoriesUploaded.includes('Main Hall / Space');
    const hasSeating = categoriesUploaded.includes('Seating Area');

    if (!hasFront || !hasHall || !hasSeating) {
      const missing = [];
      if (!hasFront) missing.push('Front / Entrance');
      if (!hasHall) missing.push('Main Hall / Space');
      if (!hasSeating) missing.push('Seating Area');
      toast.error(`Mandatory photos missing: ${missing.join(', ')}`);
      return false;
    }

    if (!formData.termsAccepted) {
      toast.error('Please accept the Terms & Conditions declaration');
      return false;
    }

    return true;
  };

  // ── Provisional Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const cleanPhone = formData.mobile.replace(/\D/g, '').slice(-10);

      // Build payload matching backend Venue schema and Phase-1 specification
      const payload = {
        businessName: formData.venueName.trim(),
        description: formData.description?.trim() || undefined,
        venueType: formData.categories,
        foodType: formData.foodType,
        capacity: formData.capacity,
        areaSqft: Number(formData.totalAreaSqft),
        termsAccepted: true,
        listingSource: 'ambassador',
        onboardingPhase: 1,
        isProvisional: true,

        // Owner Info
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
        toast.success('Venue provisionally submitted! 🎉');
        setSubmittedVenue(data.venue);
        setOwnerCredentials(
          data.ownerCredentials || {
            isNewAccount: true,
            loginId: formData.email.trim().toLowerCase(),
            email: formData.email.trim().toLowerCase(),
            password: `RM@${cleanPhone.slice(-4)}`
          }
        );
        setShowSuccessModal(true);
      } else {
        toast.error(data.message || 'Venue submission failed');
      }
    } catch (err) {
      console.error('Error submitting venue:', err);
      toast.error('Network error submitting venue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Share Message Generator ────────────────────────────────────────────────
  const getShareMessage = () => {
    const loginEmail = ownerCredentials?.email || ownerCredentials?.loginId || formData.email;
    const password = ownerCredentials?.password || `RM@${formData.mobile.slice(-4)}`;
    const loginLink = 'https://rentalmeet.com/login?role=owner';

    return `Your venue "${formData.venueName}" has been added to RentalMeet.\n\nPlease complete your venue profile to make your venue eligible for booking.\n\nLogin Link : ${loginLink}\nLogin Email ID : ${loginEmail}\nPassword : ${password}`;
  };

  const copyShareMessage = () => {
    navigator.clipboard.writeText(getShareMessage());
    toast.success('Login credentials and message copied to clipboard! 📋');
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
    setIsPhoneVerified(false);
    setOtpSent(false);
    setEnteredOtp('');
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
      termsAccepted: false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* ── Top Header Strip ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-500 via-primary-600 to-primary-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary-500/10 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Single Page Onboarding Form
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Venue Onboarding Process
            </h1>
            <p className="text-sm text-primary-100 mt-1 font-medium italic">
              “Find the venue → capture basic details → upload photos → submit to RentalMeet.”
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 text-xs text-white max-w-xs self-start md:self-auto">
            <div className="font-bold flex items-center gap-1.5 text-amber-200">
              <Info className="w-4 h-4" /> 3-Step Simple Process
            </div>
            <p className="mt-1 text-[11px] text-white/90 leading-relaxed">
              <strong>Step 1:</strong> Ambassador lists venue &amp; provisional submit.<br />
              <strong>Step 2:</strong> Owner logs in to complete profile &amp; KYC.<br />
              <strong>Step 3:</strong> RentalMeet reviews &amp; activates booking!
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── SECTION 1: Basic Info & Owner Details ────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-primary-50 dark:bg-primary-950/50 text-primary-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. Venue &amp; Authorized Person Information
              </h2>
              <p className="text-xs text-slate-500">Provide core contact information to establish owner account</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Venue Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.venueName}
                  onChange={(e) => handleChange('venueName', e.target.value)}
                  placeholder="Ex. Grand Crystal Banquet / Royal Palace Hotel"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Name (Authorized Person) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Name (Authorized Person) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.authorizedPerson}
                  onChange={(e) => handleChange('authorizedPerson', e.target.value)}
                  placeholder="Ex. Rajesh Kumar (Owner / Manager)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Venue Mobile No. + OTP Verify */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Venue Mobile No. <span className="text-red-500">*</span>
                </label>
                {isPhoneVerified ? (
                  <span className="text-[11px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    Verify via OTP recommended
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleChange('mobile', val);
                      setIsPhoneVerified(false);
                      setOtpSent(false);
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                {!isPhoneVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || otpTimer > 0 || formData.mobile.length !== 10}
                    className="px-4 py-2.5 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/60 dark:hover:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-200 dark:border-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {sendingOtp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : otpTimer > 0 ? (
                      `Resend (${otpTimer}s)`
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                )}
              </div>

              {/* Inline OTP Verification Box */}
              {otpSent && !isPhoneVerified && (
                <div className="mt-2.5 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-amber-800 dark:text-amber-200">
                    <span>Enter 6-digit OTP sent to {formData.mobile}</span>
                    {debugOtp && (
                      <span className="font-mono text-[10px] bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-100">
                        OTP: {debugOtp}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit OTP"
                      className="w-36 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-center font-mono text-sm tracking-widest focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || enteredOtp.length < 4}
                      className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {verifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Verify
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Venue Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Venue Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Ex. contact@crystalbanquet.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* About Venue / Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                About Venue / Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description about the venue, facilities, suitable events..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                If left blank, a professional venue description will be generated automatically.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Location & Address ────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Venue Address &amp; Location
                </h2>
                <p className="text-xs text-slate-500">Provide address details and auto-capture GPS coordinates</p>
              </div>
            </div>

            {/* Auto Detect Location Button */}
            <button
              type="button"
              onClick={handleAutoDetectLocation}
              disabled={detectingLocation}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 transition-colors self-start sm:self-auto disabled:opacity-60"
            >
              {detectingLocation ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting Location...
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" /> Auto Detect Location
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {/* Full Venue Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Venue Address <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Ex. Plot No. 45, Near Airport Road, MP Nagar Zone 2..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
              />
            </div>

            {/* State & City Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* State Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">Select State</option>
                  {stateOptions.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled={!formData.state}
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                >
                  <option value="">{formData.state ? 'Select City' : 'Select State First'}</option>
                  {cityOptions.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location / Area (Not Mandatory / Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Location / Area <span className="text-slate-400 font-normal text-[11px]">(Optional / Not mandatory)</span>
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => handleChange('area', e.target.value)}
                  placeholder="Ex. MP Nagar Zone 2, Civil Lines, Malviya Nagar..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pincode <span className="text-slate-400 font-normal text-[11px]">(Optional - 6 digits)</span>
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="e.g. 462011"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {formData.googleMapLink && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="truncate mr-2">📍 Coordinates linked: {formData.googleMapLink}</span>
                <a
                  href={formData.googleMapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 font-bold hover:underline whitespace-nowrap"
                >
                  View on Map
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 3: Category, Food & Specifications ──────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. Venue Category, Food &amp; Space Specifications
              </h2>
              <p className="text-xs text-slate-500">Select categories, food allowance, capacity, and total area</p>
            </div>
          </div>

          {/* Venue Category: Multi Checkbox (Select minimum 1) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Venue Category <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal ml-1">
                  (Multi-checkbox, Select minimum 1 category)
                </span>
              </label>
              <span className="text-xs font-semibold text-primary-600">
                {formData.categories.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {VENUE_CATEGORIES.map((cat) => {
                const isSelected = formData.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 shadow-xs ring-1 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat}</span>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food Type, Capacity & Total Area */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-2">
            {/* Food Type Allow */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-primary-500" />
                Food Type Allow <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.foodType}
                onChange={(e) => handleChange('foodType', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {FOOD_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Venue Capacity Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary-500" />
                Venue Capacity <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {CAPACITY_OPTIONS.map((cap) => (
                  <option key={cap} value={cap}>
                    {cap} Pax
                  </option>
                ))}
              </select>
            </div>

            {/* Total Area in Sq.Ft. */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-primary-500" />
                Total Area (in Sq.Ft.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.totalAreaSqft}
                onChange={(e) => handleChange('totalAreaSqft', e.target.value)}
                placeholder="Ex. 3500"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Pricing Model ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  4. Pricing Model
                </h2>
                <p className="text-xs text-slate-500">
                  Select Minimum 1 Model (Only Rent, Rent with Amenities, or Per Pax)
                </p>
              </div>
            </div>
          </div>

          {/* Model Selector Tabs / Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Applicable Pricing Models <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Only Rent', 'Rent (Included Amenities)', 'Per Pax'].map((model) => {
                const isSelected = formData.pricingModels.includes(model);
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => togglePricingModel(model)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{model}</span>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model 1: Only Rent Table */}
          {formData.pricingModels.includes('Only Rent') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Only Rent
                </h3>
                <span className="text-[11px] text-slate-500">Rental rates without additional services</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Duration Type</th>
                      <th className="p-2.5">Rate (₹)</th>
                      <th className="p-2.5">Extra Per Hr. (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Hourly</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 500"
                          value={formData.onlyRent.hourlyRate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              onlyRent: { ...prev.onlyRent, hourlyRate: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 500"
                          value={formData.onlyRent.hourlyExtraPerHour}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              onlyRent: { ...prev.onlyRent, hourlyExtraPerHour: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Half Day (6 Hrs)</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 3000"
                          value={formData.onlyRent.halfDayRate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              onlyRent: { ...prev.onlyRent, halfDayRate: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 500"
                          value={formData.onlyRent.halfDayExtraPerHour}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              onlyRent: { ...prev.onlyRent, halfDayExtraPerHour: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Full Day (12 Hrs.)</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 6000"
                          value={formData.onlyRent.fullDayRate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              onlyRent: { ...prev.onlyRent, fullDayRate: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 500"
                          value={formData.onlyRent.fullDayExtraPerHour}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              onlyRent: { ...prev.onlyRent, fullDayExtraPerHour: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Model 2: Rent (Included Amenities) Table */}
          {formData.pricingModels.includes('Rent (Included Amenities)') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Rent (Included Amenities)
                </h3>
                <span className="text-[11px] text-slate-500">Rates with core amenities included</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Duration Type</th>
                      <th className="p-2.5">Rate (₹)</th>
                      <th className="p-2.5">Extra Per Hr. (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Hourly</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 500"
                          value={formData.rentWithAmenities.hourlyRate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              rentWithAmenities: { ...prev.rentWithAmenities, hourlyRate: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 500"
                          value={formData.rentWithAmenities.hourlyExtraPerHour}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              rentWithAmenities: { ...prev.rentWithAmenities, hourlyExtraPerHour: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Half Day (6 Hrs)</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 3000"
                          value={formData.rentWithAmenities.halfDayRate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              rentWithAmenities: { ...prev.rentWithAmenities, halfDayRate: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 500"
                          value={formData.rentWithAmenities.halfDayExtraPerHour}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              rentWithAmenities: { ...prev.rentWithAmenities, halfDayExtraPerHour: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Full Day (12 Hrs.)</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 6000"
                          value={formData.rentWithAmenities.fullDayRate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              rentWithAmenities: { ...prev.rentWithAmenities, fullDayRate: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          placeholder="Ex. 500"
                          value={formData.rentWithAmenities.fullDayExtraPerHour}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              rentWithAmenities: { ...prev.rentWithAmenities, fullDayExtraPerHour: e.target.value }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Model 3: Per Pax Table */}
          {formData.pricingModels.includes('Per Pax') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Per Pax (Per Person)
                </h3>
                <span className="text-[11px] text-slate-500">Rates per person according to catering choice</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Meal / Package Type</th>
                      <th className="p-2.5">Rate (₹)</th>
                      <th className="p-2.5">Minimum Pax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {[
                      { keyRate: 'withoutFoodRate', keyPax: 'withoutFoodMinPax', label: 'Per Pax without Food', exRate: '200' },
                      { keyRate: 'onlyBreakfastRate', keyPax: 'onlyBreakfastMinPax', label: 'Per Pax with Only Breakfast', exRate: '300' },
                      { keyRate: 'breakfastLunchRate', keyPax: 'breakfastLunchMinPax', label: 'Per Pax with Breakfast+Lunch', exRate: '400' },
                      { keyRate: 'onlyLunchRate', keyPax: 'onlyLunchMinPax', label: 'Per Pax with Only Lunch', exRate: '500' },
                      { keyRate: 'onlyDinnerRate', keyPax: 'onlyDinnerMinPax', label: 'Per Pax with Only Dinner', exRate: '600' },
                      { keyRate: 'allMealsRate', keyPax: 'allMealsMinPax', label: 'Per Pax with Breakfast+Lunch+Dinner', exRate: '750' }
                    ].map((row) => (
                      <tr key={row.keyRate}>
                        <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{row.label}</td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            placeholder={`Ex. ${row.exRate}`}
                            value={formData.perPax[row.keyRate]}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                perPax: { ...prev.perPax, [row.keyRate]: e.target.value }
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            placeholder="50"
                            value={formData.perPax[row.keyPax]}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                perPax: { ...prev.perPax, [row.keyPax]: e.target.value }
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
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

        {/* ── SECTION 5: Parking Details ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                5. Parking Details
              </h2>
              <p className="text-xs text-slate-500">
                Select parking availability and capacity/charges. <span className="text-primary-600 dark:text-primary-400 font-medium">(Paid parking charges are payable directly at the venue during event)</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Parking Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['None', 'Free', 'Limited', 'Paid'].map((type) => {
                  const isSelected = formData.parkingType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleChange('parkingType', type)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {type === 'None' ? 'None (No Parking)' : type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic fields based on Parking Type */}
            {(formData.parkingType === 'Free' || formData.parkingType === 'Limited') && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    No. of Cars
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.parkingCarsCapacity}
                    onChange={(e) => handleChange('parkingCarsCapacity', e.target.value)}
                    placeholder="Ex. 25"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    No. of Two Wheeler
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.parkingTwoWheelerCapacity}
                    onChange={(e) => handleChange('parkingTwoWheelerCapacity', e.target.value)}
                    placeholder="Ex. 60"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {formData.parkingType === 'Paid' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Car Charges (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.parkingCarCharges}
                      onChange={(e) => handleChange('parkingCarCharges', e.target.value)}
                      placeholder="Ex. 50"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Two Wheeler Charges (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.parkingTwoWheelerCharges}
                      onChange={(e) => handleChange('parkingTwoWheelerCharges', e.target.value)}
                      placeholder="Ex. 20"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="font-bold">ℹ️ Note:</span>
                  <span>Paid parking charges are collected directly at the venue by the venue management during the event. It is not charged online during customer booking.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 6: Venue Photos ─────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-pink-50 dark:bg-pink-950/50 text-pink-600 rounded-xl">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  6. Venue Photos Upload
                </h2>
                <p className="text-xs text-slate-500">
                  Minimum 3 Photos required. Front, Main Hall, and Seating Area are mandatory (*).
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Supported: <span className="font-semibold text-slate-600 dark:text-slate-300">JPG, JPEG, PNG, WebP</span> • Max size: <span className="font-semibold text-slate-600 dark:text-slate-300">5 MB</span> (Auto-compressed)
                </p>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${
              formData.photos.length >= 3
                ? 'bg-green-50 dark:bg-green-950/40 border-green-200 text-green-700 dark:text-green-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-700 dark:text-amber-300'
            }`}>
              {formData.photos.length} / 3 Minimum Photos
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {PHOTO_SLOTS.map((slot) => {
              const uploadedPhoto = formData.photos.find((p) => p.category === slot.key);
              const isUploadingThis = uploadingCategory === slot.key;

              return (
                <div
                  key={slot.key}
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[160px] ${
                    uploadedPhoto
                      ? 'border-green-300 dark:border-green-800/80 bg-green-50/20 dark:bg-green-950/10'
                      : slot.required
                      ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {slot.label} {slot.required && <span className="text-red-500">*</span>}
                      </span>
                      {uploadedPhoto ? (
                        <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        slot.required && (
                          <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{slot.hint}</p>
                  </div>

                  {uploadedPhoto ? (
                    <div className="mt-3 relative group">
                      <img
                        src={uploadedPhoto.url}
                        alt={slot.key}
                        className="w-full h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(slot.key)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition-colors">
                        {isUploadingThis ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span>Upload Photo</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingThis}
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

        {/* ── SECTION 7: Terms & Declaration ──────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="termsAccepted"
              required
              checked={formData.termsAccepted}
              onChange={(e) => handleChange('termsAccepted', e.target.checked)}
              className="mt-1 w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
            />
            <label htmlFor="termsAccepted" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer select-none">
              <span className="font-bold text-slate-900 dark:text-white">
                Terms &amp; Declaration Certification:
              </span>{' '}
              I certify that I have personally visited or communicated with the authorized person of this venue and captured authentic details. Submitting this form provisionally creates the venue listing and sends onboarding credentials to the venue owner for complete profile setup.
            </label>
          </div>

          {/* Submission Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-700 hover:to-amber-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-primary-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting Provisional Venue...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> PROVISIONAL SUBMIT
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {/* ── SUCCESS MODAL ──────────────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Venue Provisionally Submitted! 🎉
                </h3>
                <p className="text-xs text-slate-500">
                  {submittedVenue?.businessName} has been added to RentalMeet
                </p>
              </div>
            </div>

            {/* Generated Credentials / Notification Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>SMS / WhatsApp / Email Template:</span>
                <span className="text-[10px] text-primary-600 font-normal">Ready to share</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 leading-relaxed border border-slate-200 dark:border-slate-800 whitespace-pre-wrap select-all">
                {getShareMessage()}
              </div>
            </div>

            {/* Share & Actions Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={shareViaWhatsApp}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Share on WhatsApp
              </button>

              <button
                type="button"
                onClick={shareViaSms}
                className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Phone className="w-4 h-4" /> Send SMS
              </button>
            </div>

            <button
              type="button"
              onClick={copyShareMessage}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Copy className="w-4 h-4" /> Copy Message &amp; Credentials
            </button>

            {/* Bottom Nav Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-bold text-primary-600 hover:underline"
              >
                + Onboard Another Venue
              </button>

              <Link
                href="/ambassador/venues"
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                View in My Venues &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
