'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { State, City } from 'country-state-city';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, User, Mail, Phone, Lock, Eye, EyeOff,
  ArrowLeft, MapPin, Briefcase, AlertCircle, CheckCircle2,
  Copy, Check, Upload, X, Loader2, Sparkles, Car, UtensilsCrossed,
  IndianRupee, Layers, Camera, ArrowRight, ShieldCheck, ExternalLink,
  Navigation
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { uploadToStorage, compressImage, fileToBase64 } from '@/lib/storage';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';

// ── 12 Specific Categories ──────────────────────────────────────────────────
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

// ── Standard Capacities ─────────────────────────────────────────────────────
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

const VENDOR_CATEGORIES = [
  'Catering',
  'Makeup & Beauty',
  'Photography',
  'Entertainment',
  'Decor & Floral',
  'Security',
  'Celebrity',
  'Logistics & Support'
];

const PHOTO_SLOTS = [
  { key: 'Front / Entrance', label: 'Front / Entrance Photo', required: true, hint: 'Exterior or main entrance view' },
  { key: 'Main Hall / Space', label: 'Main Hall / Space Photo', required: true, hint: 'Central hall or main function space' },
  { key: 'Seating Area', label: 'Seating Area Photo', required: true, hint: 'Guest chairs, tables, or stage seating' },
  { key: 'Parking', label: 'Parking Area Photo', required: false, hint: 'Vehicle parking area' },
  { key: 'Facilities', label: 'Facilities Photo', required: false, hint: 'Restrooms, air conditioning, stage, etc.' },
  { key: 'Outdoor Area', label: 'Outdoor Area Photo', required: false, hint: 'Lawn, garden, terrace or open deck' },
  { key: 'Other', label: 'Other Photo', required: false, hint: 'Any additional view' }
];

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, setAuth } = useAuthStore();

  const [hydrated, setHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Account / User details
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'owner',
    referralCode: '',
    vendorCategory: ''
  });

  // State & City selections for user/venue
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [selectedStateName, setSelectedStateName] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');

  // Referral state
  const [referrerName, setReferrerName] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [customImages, setCustomImages] = useState(null);

  // Phone OTP state (ONLY phone OTP, Email OTP completely removed)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(0);

  // Venue details (for role === 'owner')
  const [venueData, setVenueData] = useState({
    venueName: '',
    description: '',
    categories: [],
    capacity: '',
    totalAreaSqft: '',
    foodType: 'Veg',
    address: '',
    area: '',
    landmark: '',
    pincode: '',
    googleMapLink: '',
    parkingType: 'None',
    carsCapacity: '',
    twoWheelerCapacity: '',
    carCharges: '',
    twoWheelerCharges: '',
    selectedPricingModels: ['onlyRent'],
    pricingOnlyRent: {
      hourly: '',
      halfDay: '',
      fullDay: ''
    },
    pricingRentWithAmenities: {
      hourly: '',
      halfDay: '',
      fullDay: ''
    },
    pricingPerPax: {
      withoutFood: '',
      onlyBreakfast: '',
      breakfastLunch: '',
      onlyLunch: '',
      onlyDinner: '',
      allMeals: ''
    },
    photos: []
  });

  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  useEffect(() => {
    fetchCustomImages();
  }, []);

  const fetchCustomImages = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth-images`);
      const data = await res.json();
      if (data.success && data.data) {
        setCustomImages(data.data);
      }
    } catch {
      // ignore
    }
  };

  const stateOptions = useMemo(() => State.getStatesOfCountry('IN'), []);
  const cityOptions = useMemo(
    () => (selectedStateCode ? City.getCitiesOfState('IN', selectedStateCode) : []),
    [selectedStateCode]
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Countdown timer for Phone OTP
  useEffect(() => {
    if (phoneOtpCountdown > 0) {
      const timer = setTimeout(() => setPhoneOtpCountdown(phoneOtpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneOtpCountdown]);

  useEffect(() => {
    if (!hydrated) return;
    const roleParam = (searchParams.get('role') || '').toLowerCase();
    const refParam = (searchParams.get('ref') || '').trim().toUpperCase();

    if (roleParam === 'customer') {
      const redirect = searchParams.get('redirect');
      router.replace('/register-customer' + (redirect ? `?redirect=${redirect}` : ''));
      return;
    }

    if (roleParam === 'ambassador') {
      const q = refParam ? `?ref=${refParam}` : '';
      router.replace('/register-ambassador' + q);
      return;
    }

    const normalizedRole = roleParam === 'vendor' ? 'vendor' : 'owner';
    setFormData((prev) => ({
      ...prev,
      role: normalizedRole,
      referralCode: refParam || ''
    }));
  }, [hydrated, router, searchParams]);

  // Check referral code
  useEffect(() => {
    const code = String(formData.referralCode || '').trim().toUpperCase();
    if (!code) {
      setReferrerName('');
      setReferralError('');
      return;
    }

    let mounted = true;
    setReferralLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/referrer/${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data.success) {
          setReferrerName(data.referrer?.name || '');
          setReferralError('');
        } else {
          setReferrerName('');
          setReferralError(data.message || 'Invalid referral code');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setReferrerName('');
        setReferralError('Unable to verify referral code');
      })
      .finally(() => {
        if (mounted) setReferralLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [formData.referralCode]);

  const handleUserChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleVenueChange = (field, value) => {
    setVenueData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle Category selection
  const toggleCategory = (cat) => {
    setVenueData((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat]
      };
    });
  };

  // Toggle Pricing Model
  const togglePricingModel = (model) => {
    setVenueData((prev) => {
      const exists = prev.selectedPricingModels.includes(model);
      if (exists && prev.selectedPricingModels.length === 1) {
        toast.error('At least one pricing model must be selected');
        return prev;
      }
      return {
        ...prev,
        selectedPricingModels: exists
          ? prev.selectedPricingModels.filter((m) => m !== model)
          : [...prev.selectedPricingModels, model]
      };
    });
  };

  // Phone OTP actions
  const handleSendPhoneOtp = async () => {
    if (!formData.name?.trim()) {
      setError('Please enter your Full Name first');
      toast.error('Please enter your Full Name first');
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setPhoneOtpLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, phone: cleanPhone })
      });
      const data = await res.json();
      if (data.success) {
        setPhoneOtpSent(true);
        setPhoneOtpCountdown(60);
        toast.success(data.message || 'OTP sent to your phone number!');
      } else {
        setError(data.message || 'Failed to send verification code');
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch {
      setError('Failed to send phone verification code. Please try again.');
      toast.error('Network error sending OTP');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const cleanOtp = phoneOtpCode.trim();
    if (cleanOtp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setPhoneOtpLoading(true);
    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp })
      });
      const data = await res.json();
      if (data.success) {
        setPhoneVerified(true);
        toast.success('Phone verified successfully! ✓');
      } else {
        setError(data.message || 'Invalid verification code');
        toast.error(data.message || 'Invalid OTP code');
      }
    } catch {
      setError('Failed to verify phone code. Please try again.');
      toast.error('Network error verifying code');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // Auto-Detect Location (GPS & Reverse Geocoding)
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

        setVenueData((prev) => ({
          ...prev,
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

            const matchedState = stateOptions.find(
              (s) => s.name.toLowerCase() === detectedState.toLowerCase()
            );
            if (matchedState) {
              setSelectedStateCode(matchedState.isoCode);
              setSelectedStateName(matchedState.name);
              setSelectedCityName(detectedCity);
            }

            setVenueData((prev) => ({
              ...prev,
              address: prev.address || detectedAddress,
              area: prev.area || detectedArea,
              pincode: prev.pincode || detectedPincode,
              googleMapLink: gMapUrl
            }));

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

  // Photo upload
  const handlePhotoUpload = async (e, slotKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size must be under 8MB');
      return;
    }

    setUploadingCategory(slotKey);
    try {
      toast.loading(`Uploading ${slotKey} photo...`, { id: 'photo-upload' });
      let uploaded;
      try {
        uploaded = await uploadToStorage(file, 'venues');
      } catch (storageErr) {
        // Direct unauthenticated upload fallback
        const fileToUpload = await compressImage(file);
        const base64 = await fileToBase64(fileToUpload);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/upload/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, folder: 'venues' })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Direct upload failed');
        }
        const data = await res.json();
        uploaded = { url: data.url, publicId: data.publicId };
      }

      setVenueData((prev) => {
        const filtered = prev.photos.filter((p) => p.category !== slotKey);
        const newPhoto = {
          url: uploaded.url,
          publicId: uploaded.publicId,
          category: slotKey,
          isFeatured: slotKey === 'Front / Entrance' || prev.photos.length === 0
        };
        return {
          ...prev,
          photos: [...filtered, newPhoto]
        };
      });

      toast.success(`${slotKey} photo uploaded!`, { id: 'photo-upload' });
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Failed to upload photo. Please try again.', { id: 'photo-upload' });
    } finally {
      setUploadingCategory(null);
    }
  };

  const removePhoto = (slotKey) => {
    setVenueData((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.category !== slotKey)
    }));
    toast.success('Photo removed');
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Common validations
    if (!formData.name?.trim()) {
      setError('Full Name is required');
      toast.error('Full Name is required');
      return;
    }
    if (!formData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      toast.error('Valid email address is required (this will be your Login Email ID)');
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Phone number must be 10 digits');
      toast.error('Phone number must be 10 digits');
      return;
    }
    if (!phoneVerified) {
      setError('Please verify your phone number with OTP first');
      toast.error('Please verify your phone number with OTP first');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    if (!selectedStateName) {
      setError('Please select a State');
      toast.error('Please select a State');
      return;
    }
    if (!selectedCityName) {
      setError('Please select a City');
      toast.error('Please select a City');
      return;
    }

    // Role-specific validations
    const isOwner = formData.role === 'owner';
    if (isOwner) {
      if (!venueData.venueName?.trim()) {
        setError('Venue Name is required');
        toast.error('Venue Name is required');
        return;
      }
      if (venueData.categories.length === 0) {
        setError('Please select at least 1 Venue Category');
        toast.error('Please select at least 1 Venue Category');
        return;
      }
      if (!venueData.capacity) {
        setError('Please select Venue Capacity');
        toast.error('Please select Venue Capacity');
        return;
      }
      if (!venueData.totalAreaSqft || Number(venueData.totalAreaSqft) <= 0) {
        setError('Total Area (in Sq.Ft.) is required');
        toast.error('Total Area (in Sq.Ft.) is required');
        return;
      }
      if (!venueData.address?.trim()) {
        setError('Venue Address is required');
        toast.error('Venue Address is required');
        return;
      }

      // Mandatory photos validation (Minimum 3: Front / Entrance, Main Hall / Space, Seating Area)
      const hasFront = venueData.photos.some((p) => p.category === 'Front / Entrance');
      const hasHall = venueData.photos.some((p) => p.category === 'Main Hall / Space');
      const hasSeating = venueData.photos.some((p) => p.category === 'Seating Area');

      if (!hasFront || !hasHall || !hasSeating) {
        const missing = [];
        if (!hasFront) missing.push('Front / Entrance');
        if (!hasHall) missing.push('Main Hall / Space');
        if (!hasSeating) missing.push('Seating Area');
        setError(`Mandatory photos missing: ${missing.join(', ')}`);
        toast.error(`Mandatory photos missing: ${missing.join(', ')}`);
        return;
      }

      if (!termsAccepted) {
        setError('Please agree to the Terms & Conditions');
        toast.error('Please agree to the Terms & Conditions');
        return;
      }
    } else {
      if (!formData.vendorCategory) {
        setError('Please select a Vendor Category');
        toast.error('Please select a Vendor Category');
        return;
      }
    }

    setLoading(true);
    try {
      const { getOrCreateDeviceId } = require('@/lib/pushNotification');
      const deviceId = getOrCreateDeviceId();

      // Build payload
      const registerPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: cleanPhone,
        password: formData.password,
        role: formData.role,
        referralCode: formData.referralCode || undefined,
        city: selectedCityName,
        state: selectedStateName,
        deviceId,
        ...(formData.role === 'vendor' && {
          accountType: 'company',
          vendorCategory: formData.vendorCategory
        })
      };

      // If owner, attach venueData
      if (isOwner) {
        registerPayload.venueData = {
          businessName: venueData.venueName.trim(),
          description: venueData.description?.trim() || undefined,
          venueType: venueData.categories,
          capacity: venueData.capacity,
          areaSqft: Number(venueData.totalAreaSqft),
          foodType: venueData.foodType,
          location: {
            address: venueData.address.trim(),
            landmark: venueData.landmark?.trim() || '',
            state: selectedStateName,
            city: selectedCityName,
            area: venueData.area?.trim() || selectedCityName,
            pincode: venueData.pincode?.trim() || '000000',
            googleMapLink: venueData.googleMapLink?.trim() || '',
            parkingAvailability: venueData.parkingType,
            parkingDetails: {
              type: venueData.parkingType,
              carsCapacity: Number(venueData.carsCapacity || 0),
              twoWheelerCapacity: Number(venueData.twoWheelerCapacity || 0),
              carCharges: Number(venueData.carCharges || 0),
              twoWheelerCharges: Number(venueData.twoWheelerCharges || 0)
            }
          },
          parkingDetails: {
            type: venueData.parkingType,
            cars: {
              capacity: Number(venueData.carsCapacity || 0),
              isChargeable: venueData.parkingType === 'Paid' || Number(venueData.carCharges) > 0,
              chargePerVehicle: Number(venueData.carCharges || 0)
            },
            twoWheelers: {
              capacity: Number(venueData.twoWheelerCapacity || 0),
              isChargeable: venueData.parkingType === 'Paid' || Number(venueData.twoWheelerCharges) > 0,
              chargePerVehicle: Number(venueData.twoWheelerCharges || 0)
            }
          },
          pricing: {
            enabledOptions: {
              perHour: !!(venueData.pricingOnlyRent.hourly || venueData.pricingRentWithAmenities.hourly),
              halfDay: !!(venueData.pricingOnlyRent.halfDay || venueData.pricingRentWithAmenities.halfDay),
              fullDay: !!(venueData.pricingOnlyRent.fullDay || venueData.pricingRentWithAmenities.fullDay)
            },
            selectedPricingModels: venueData.selectedPricingModels,
            onlyRent: {
              hourly: { rate: Number(venueData.pricingOnlyRent.hourly || 0) },
              halfDay: { rate: Number(venueData.pricingOnlyRent.halfDay || 0) },
              fullDay: { rate: Number(venueData.pricingOnlyRent.fullDay || 0) }
            },
            rentWithAmenities: {
              hourly: { rate: Number(venueData.pricingRentWithAmenities.hourly || 0) },
              halfDay: { rate: Number(venueData.pricingRentWithAmenities.halfDay || 0) },
              fullDay: { rate: Number(venueData.pricingRentWithAmenities.fullDay || 0) }
            },
            perPax: {
              withoutFood: { rate: Number(venueData.pricingPerPax.withoutFood || 0), minPax: 50 },
              breakfastOnly: { rate: Number(venueData.pricingPerPax.onlyBreakfast || 0), minPax: 50 },
              breakfastLunch: { rate: Number(venueData.pricingPerPax.breakfastLunch || 0), minPax: 50 },
              lunchOnly: { rate: Number(venueData.pricingPerPax.onlyLunch || 0), minPax: 50 },
              dinnerOnly: { rate: Number(venueData.pricingPerPax.onlyDinner || 0), minPax: 50 },
              allMeals: { rate: Number(venueData.pricingPerPax.allMeals || 0), minPax: 50 }
            }
          },
          images: venueData.photos.map((p) => ({
            url: p.url,
            category: p.category,
            isFeatured: p.isFeatured
          }))
        };
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerPayload)
      });
      const data = await res.json();

      if (data.success) {
        // Authenticate the user session
        setAuth(data.user, data.token);

        // Store registration result for the Thank You / Credentials Modal
        setRegistrationResult({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          name: formData.name.trim(),
          venueName: venueData.venueName.trim() || 'Your Venue',
          token: data.token,
          user: data.user,
          role: formData.role
        });

        // Show thank you & credentials screen
        setShowSuccessModal(true);
        toast.success(isOwner ? 'Venue & Account registered successfully! 🎉' : 'Account created successfully! 🎉');
      } else {
        setError(data.message || 'Registration failed');
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Something went wrong during registration. Please try again.');
      toast.error('Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = () => {
    if (registrationResult?.email) {
      navigator.clipboard.writeText(registrationResult.email);
      setCopiedEmail(true);
      toast.success('Login Email ID copied! 📋');
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const copyPassword = () => {
    if (registrationResult?.password) {
      navigator.clipboard.writeText(registrationResult.password);
      setCopiedPassword(true);
      toast.success('Password copied! 📋');
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const copyAllCredentials = () => {
    if (registrationResult) {
      const msg = `RentalMeet Venue Owner Credentials:\n\nVenue: ${registrationResult.venueName}\nLogin Link: https://rentalmeet.com/login?role=owner\nLogin Email ID: ${registrationResult.email}\nPassword: ${registrationResult.password}\n\nNote: Please use your Email ID and Password to login.`;
      navigator.clipboard.writeText(msg);
      toast.success('All Login Credentials copied! 📋');
    }
  };

  const handleGoToDashboard = () => {
    if (registrationResult?.user?.role === 'vendor') {
      router.push('/vendor/dashboard');
    } else {
      router.push('/owner/dashboard');
    }
  };

  const handleGoToLogin = () => {
    router.push(`/login?role=${formData.role || 'owner'}`);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isVendor = formData.role === 'vendor';
  const inp = 'w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 text-sm transition-all outline-none text-slate-800 dark:text-slate-100 placeholder:text-gray-400';

  const targetMeta = isVendor
    ? {
        title: 'Vendor Partner',
        subtitle: 'Grow your service business with RentalMeet leads.',
        image: '/login/vendor.jpg',
        badge: 'Vendor Registration',
        features: ['Reach thousands of event planners', 'Manage bookings & payments', 'Build your brand online'],
        bg: 'bg-white',
        theme: 'light'
      }
    : {
        title: 'Venue Owner',
        subtitle: 'List your venue in minutes and receive booking enquiries directly.',
        image: '/login/venues.jpg',
        badge: 'Venue Owner Registration',
        features: [
          'Instant venue listing',
          'Direct client enquiries & bookings',
          'Zero listing fee to get started',
          'Dedicated owner dashboard & calendar'
        ],
        bg: 'bg-[#f4efea]',
        theme: 'light'
      };

  if (customImages) {
    if (isVendor) {
      if (customImages.vendorRegister) targetMeta.image = customImages.vendorRegister;
      else if (customImages.vendorLogin) targetMeta.image = customImages.vendorLogin;
    } else {
      if (customImages.venueRegister) targetMeta.image = customImages.venueRegister;
      else if (customImages.ownerRegister) targetMeta.image = customImages.ownerRegister;
      else if (customImages.venueLogin) targetMeta.image = customImages.venueLogin;
      else if (customImages.ownerLogin) targetMeta.image = customImages.ownerLogin;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="w-full pt-[80px]">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">

          {/* Left Side: Visual & Content with Photo (Matching Login Page) */}
          <div className={`w-full lg:w-5/12 xl:w-4/12 ${targetMeta.bg} dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 flex flex-col justify-between lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] lg:overflow-y-auto transition-all duration-500`}>
            <div className="space-y-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
              
              <div className="space-y-3">
                <span className="px-3 py-1 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {targetMeta.badge}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-tight">
                  Start Your <br />
                  <span className="text-primary-600">{targetMeta.title}</span> <br />
                  <span className="text-gray-800 dark:text-gray-200">Journey</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed">
                  {targetMeta.subtitle} Join thousands of professionals already earning on RentalMeet.
                </p>

                <ul className="space-y-2.5 pt-2">
                  {targetMeta.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Central Photo Display */}
            <div className="flex-1 flex items-center justify-center py-6 min-h-[260px] w-full">
              <img
                src={targetMeta.image}
                alt={targetMeta.title}
                className="max-w-full max-h-[380px] object-contain rounded-2xl shadow-md border border-gray-150 dark:border-slate-800 bg-white p-2.5"
              />
            </div>

            {/* Bottom Note */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Already registered?</span>
              <Link
                href={`/login?role=${formData.role || 'owner'}`}
                className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Sign In &rarr;
              </Link>
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="w-full lg:w-7/12 xl:w-8/12 p-4 sm:p-6 lg:p-10 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Top Breadcrumb & Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isVendor ? 'Vendor Registration' : 'Register as Venue Owner'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {isVendor
                      ? 'Create your vendor account to offer event services'
                      : 'Create your owner account and register your venue details'}
                  </p>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">Signing up as:</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {isVendor ? 'Vendor' : 'Venue Owner'}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-300 text-sm flex items-center gap-3 shadow-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* ════════════════════════════════════════════════════════════════════
                SECTION 1: OWNER ACCOUNT & CONTACT DETAILS
            ════════════════════════════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Owner Account &amp; Contact Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your personal login and verification details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isVendor ? 'Contact Person Name' : 'Owner / Contact Full Name'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleUserChange}
                      placeholder="e.g. Ramesh Kumar Sharma"
                      className={inp + ' pl-10'}
                      required
                    />
                  </div>
                </div>

                {/* Email Address (Login ID) - NO OTP required */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-full">
                      Used for Login
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleUserChange}
                      placeholder="e.g. ramesh.sharma@example.com"
                      className={inp + ' pl-10'}
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    You will use this Email ID to sign in to your RentalMeet account.
                  </p>
                </div>

                {/* Phone Number with Phone OTP Verification */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleUserChange}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      disabled={phoneVerified}
                      className={inp + ' pl-10 pr-24'}
                      required
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {phoneVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs px-2.5 py-1 bg-emerald-50 rounded-lg select-none">
                          <Check className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={phoneOtpLoading || formData.phone.length !== 10 || phoneOtpCountdown > 0}
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
                        >
                          {phoneOtpLoading
                            ? 'Sending...'
                            : phoneOtpSent
                            ? phoneOtpCountdown > 0
                              ? `Resend (${phoneOtpCountdown}s)`
                              : 'Resend OTP'
                            : 'Verify Phone'}
                        </button>
                      )}
                    </div>
                  </div>

                  {phoneOtpSent && !phoneVerified && (
                    <div className="flex gap-2 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 animate-slide-up mt-2">
                      <input
                        type="text"
                        placeholder="6-digit Phone OTP"
                        value={phoneOtpCode}
                        onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary-500 text-center tracking-widest font-bold"
                        maxLength="6"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhoneOtp}
                        disabled={phoneOtpCode.length !== 6 || phoneOtpLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                      >
                        {phoneOtpLoading ? 'Verifying...' : 'Submit OTP'}
                      </button>
                    </div>
                  )}
                </div>

                {/* State & City */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedStateCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const stateObj = stateOptions.find((s) => s.isoCode === code);
                        setSelectedStateCode(code);
                        setSelectedStateName(stateObj?.name || '');
                        setSelectedCityName('');
                      }}
                      className={inp}
                      required
                    >
                      <option value="">Select State</option>
                      {stateOptions.map((s) => (
                        <option key={s.isoCode} value={s.isoCode}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCityName}
                      onChange={(e) => setSelectedCityName(e.target.value)}
                      disabled={!selectedStateCode}
                      className={inp}
                      required
                    >
                      <option value="">
                        {selectedStateCode ? 'Select City' : 'State First'}
                      </option>
                      {cityOptions.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleUserChange}
                      placeholder="Min 6 characters"
                      className={inp + ' pl-10 pr-10'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleUserChange}
                      placeholder="Repeat password"
                      className={inp + ' pl-10'}
                      required
                    />
                  </div>
                </div>

                {/* Referral Code (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Referral Code (Optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleUserChange}
                      placeholder="e.g. RM-OWN-1234"
                      className={inp + ' pl-10 uppercase font-medium'}
                      maxLength="12"
                    />
                    {referralLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {referrerName && (
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">
                      ✓ Referrer Verified: {referrerName}
                    </p>
                  )}
                  {referralError && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {referralError}
                    </p>
                  )}
                </div>

                {/* Vendor Category (if vendor) */}
                {isVendor && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Vendor Service Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="vendorCategory"
                      value={formData.vendorCategory}
                      onChange={handleUserChange}
                      className={inp}
                      required
                    >
                      <option value="">Select Category</option>
                      {VENDOR_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                SECTION 2: VENUE INFORMATION (Only for Venue Owner)
            ════════════════════════════════════════════════════════════════════ */}
            {!isVendor && (
              <>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Venue Information &amp; Categories
                      </h2>
                      <p className="text-xs text-slate-500">
                        Space details, categories, capacity &amp; food options
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Venue Name */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Venue / Business Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={venueData.venueName}
                          onChange={(e) => handleVenueChange('venueName', e.target.value)}
                          placeholder="e.g. Royal Palace Banquet &amp; Convention Center"
                          className={inp + ' pl-10'}
                          required
                        />
                      </div>
                    </div>

                    {/* About Venue / Description */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        About Venue / Description <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={venueData.description}
                        onChange={(e) => handleVenueChange('description', e.target.value)}
                        placeholder="Brief description about the venue, suitable events, hospitality..."
                        className={inp + ' resize-none'}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        If left blank, an elegant automated description highlighting your venue and city will be generated.
                      </p>
                    </div>

                    {/* Venue Categories (12 standard categories) */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Select Venue Categories (Select all that apply) <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-slate-400 font-medium">
                          {venueData.categories.length} selected
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {VENUE_CATEGORIES.map((cat) => {
                          const isSelected = venueData.categories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleCategory(cat)}
                              className={`p-3 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-primary-500'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <span>{cat}</span>
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-primary-600 text-white'
                                    : 'border border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Capacity Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Guest Capacity <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={venueData.capacity}
                        onChange={(e) => handleVenueChange('capacity', e.target.value)}
                        className={inp}
                        required
                      >
                        <option value="">Select Capacity Range</option>
                        {CAPACITY_OPTIONS.map((cap) => (
                          <option key={cap} value={cap}>
                            {cap} Guests
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Total Area Sqft */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Total Area (in Sq. Ft.) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="50"
                        value={venueData.totalAreaSqft}
                        onChange={(e) => handleVenueChange('totalAreaSqft', e.target.value)}
                        placeholder="e.g. 5000"
                        className={inp}
                        required
                      />
                    </div>

                    {/* Allowed Food Type */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Food Type Allowed <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Veg', 'Non Veg', 'Both'].map((ft) => (
                          <button
                            key={ft}
                            type="button"
                            onClick={() => handleVenueChange('foodType', ft)}
                            className={`py-3 px-4 rounded-xl border text-center text-xs font-bold transition-all ${
                              venueData.foodType === ft
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {ft === 'Non Veg' ? 'Non-Vegetarian' : ft === 'Both' ? 'Both (Veg & Non-Veg)' : 'Vegetarian Only'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 3: VENUE LOCATION & PARKING
                ════════════════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          Venue Location &amp; Parking Facilities
                        </h2>
                        <p className="text-xs text-slate-500">
                          Complete venue address, maps &amp; parking capacity
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoDetectLocation}
                      disabled={detectingLocation}
                      className="self-start sm:self-auto px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800 shadow-xs"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${detectingLocation ? 'animate-spin' : ''}`} />
                      {detectingLocation ? 'Detecting...' : 'Auto Detect GPS'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Complete Address */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Complete Venue Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows="2"
                        value={venueData.address}
                        onChange={(e) => handleVenueChange('address', e.target.value)}
                        placeholder="House / Plot / Building No., Street, Sector, Area"
                        className={inp}
                        required
                      />
                    </div>

                    {/* Location / Area */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Location / Area <span className="text-slate-400 font-normal text-[11px]">(Optional / Not mandatory)</span>
                      </label>
                      <input
                        type="text"
                        value={venueData.area}
                        onChange={(e) => handleVenueChange('area', e.target.value)}
                        placeholder="e.g. MP Nagar Zone 2, Civil Lines, Malviya Nagar..."
                        className={inp}
                      />
                    </div>

                    {/* Landmark */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Prominent Landmark
                      </label>
                      <input
                        type="text"
                        value={venueData.landmark}
                        onChange={(e) => handleVenueChange('landmark', e.target.value)}
                        placeholder="e.g. Near Metro Station / Behind City Mall"
                        className={inp}
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
                        value={venueData.pincode}
                        onChange={(e) => handleVenueChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="e.g. 110001"
                        className={inp + ' font-mono'}
                      />
                    </div>

                    {/* Google Map Link */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Google Maps Location Link (Optional)
                      </label>
                      <input
                        type="url"
                        value={venueData.googleMapLink}
                        onChange={(e) => handleVenueChange('googleMapLink', e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        className={inp}
                      />
                    </div>

                    {/* Parking Details */}
                    <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Parking Availability
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {['None', 'Free', 'Limited', 'Paid'].map((pt) => (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => handleVenueChange('parkingType', pt)}
                            className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                              venueData.parkingType === pt
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {pt === 'None' ? 'No Parking' : pt}
                          </button>
                        ))}
                      </div>

                      {venueData.parkingType !== 'None' && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Cars (4-Wheelers) Capacity
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={venueData.carsCapacity}
                              onChange={(e) => handleVenueChange('carsCapacity', e.target.value)}
                              placeholder="e.g. 50"
                              className={inp}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Bikes (2-Wheelers) Capacity
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={venueData.twoWheelerCapacity}
                              onChange={(e) => handleVenueChange('twoWheelerCapacity', e.target.value)}
                              placeholder="e.g. 100"
                              className={inp}
                            />
                          </div>

                          {venueData.parkingType === 'Paid' && (
                            <>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Car Charges (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={venueData.carCharges}
                                  onChange={(e) => handleVenueChange('carCharges', e.target.value)}
                                  placeholder="e.g. 50"
                                  className={inp}
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Bike Charges (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={venueData.twoWheelerCharges}
                                  onChange={(e) => handleVenueChange('twoWheelerCharges', e.target.value)}
                                  placeholder="e.g. 20"
                                  className={inp}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 4: PRICING MODELS
                ════════════════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Pricing Model Configuration
                      </h2>
                      <p className="text-xs text-slate-500">
                        Enable rental and catering pricing models
                      </p>
                    </div>
                  </div>

                  {/* Pricing Model Selector Chips */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { key: 'onlyRent', label: '1. Only Rent' },
                        { key: 'rentWithAmenities', label: '2. Rent with Included Amenities' },
                        { key: 'perPax', label: '3. Per Pax (Per Person Food Packages)' }
                      ].map((m) => {
                        const isSelected = venueData.selectedPricingModels.includes(m.key);
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => togglePricingModel(m.key)}
                            className={`py-2 px-4 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span>{m.label}</span>
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                isSelected ? 'bg-primary-600 text-white' : 'border border-slate-300'
                              }`}
                            >
                              {isSelected && '✓'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Only Rent Inputs */}
                    {venueData.selectedPricingModels.includes('onlyRent') && (
                      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          <IndianRupee className="w-4 h-4 text-primary-600" /> Only Rent Rates
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Hourly Rate (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={venueData.pricingOnlyRent.hourly}
                              onChange={(e) =>
                                setVenueData((p) => ({
                                  ...p,
                                  pricingOnlyRent: { ...p.pricingOnlyRent, hourly: e.target.value }
                                }))
                              }
                              placeholder="e.g. 2000"
                              className={inp}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Half-Day Rate (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={venueData.pricingOnlyRent.halfDay}
                              onChange={(e) =>
                                setVenueData((p) => ({
                                  ...p,
                                  pricingOnlyRent: { ...p.pricingOnlyRent, halfDay: e.target.value }
                                }))
                              }
                              placeholder="e.g. 15000"
                              className={inp}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Full-Day Rate (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={venueData.pricingOnlyRent.fullDay}
                              onChange={(e) =>
                                setVenueData((p) => ({
                                  ...p,
                                  pricingOnlyRent: { ...p.pricingOnlyRent, fullDay: e.target.value }
                                }))
                              }
                              placeholder="e.g. 25000"
                              className={inp}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rent with Amenities Inputs */}
                    {venueData.selectedPricingModels.includes('rentWithAmenities') && (
                      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          <IndianRupee className="w-4 h-4 text-emerald-600" /> Rent with Included Amenities Rates
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Hourly Rate (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={venueData.pricingRentWithAmenities.hourly}
                              onChange={(e) =>
                                setVenueData((p) => ({
                                  ...p,
                                  pricingRentWithAmenities: { ...p.pricingRentWithAmenities, hourly: e.target.value }
                                }))
                              }
                              placeholder="e.g. 3500"
                              className={inp}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Half-Day Rate (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={venueData.pricingRentWithAmenities.halfDay}
                              onChange={(e) =>
                                setVenueData((p) => ({
                                  ...p,
                                  pricingRentWithAmenities: { ...p.pricingRentWithAmenities, halfDay: e.target.value }
                                }))
                              }
                              placeholder="e.g. 25000"
                              className={inp}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Full-Day Rate (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={venueData.pricingRentWithAmenities.fullDay}
                              onChange={(e) =>
                                setVenueData((p) => ({
                                  ...p,
                                  pricingRentWithAmenities: { ...p.pricingRentWithAmenities, fullDay: e.target.value }
                                }))
                              }
                              placeholder="e.g. 45000"
                              className={inp}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Per Pax Inputs */}
                    {venueData.selectedPricingModels.includes('perPax') && (
                      <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          <UtensilsCrossed className="w-4 h-4 text-amber-600" /> Per Pax Rates (Rate per Person)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { key: 'withoutFood', label: 'Without Food (₹)' },
                            { key: 'onlyBreakfast', label: 'Breakfast Only (₹)' },
                            { key: 'breakfastLunch', label: 'Breakfast + Lunch (₹)' },
                            { key: 'onlyLunch', label: 'Lunch Only (₹)' },
                            { key: 'onlyDinner', label: 'Dinner Only (₹)' },
                            { key: 'allMeals', label: 'All Meals (₹)' }
                          ].map((pp) => (
                            <div key={pp.key}>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                {pp.label}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={venueData.pricingPerPax[pp.key]}
                                onChange={(e) =>
                                  setVenueData((p) => ({
                                    ...p,
                                    pricingPerPax: { ...p.pricingPerPax, [pp.key]: e.target.value }
                                  }))
                                }
                                placeholder="₹ / person"
                                className={inp}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 5: VENUE PHOTOS
                ════════════════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                      5
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Venue Photos
                      </h2>
                      <p className="text-xs text-slate-500">
                        Upload minimum 3 mandatory photos (Front / Entrance, Main Hall / Space, Seating Area)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PHOTO_SLOTS.map((slot) => {
                      const existingPhoto = venueData.photos.find((p) => p.category === slot.key);
                      const isUploading = uploadingCategory === slot.key;

                      return (
                        <div
                          key={slot.key}
                          className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                            existingPhoto
                              ? 'bg-green-50/40 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                              : slot.required
                              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                              : 'bg-white dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {slot.label}
                              </span>
                              {slot.required ? (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded">
                                  Required *
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Optional</span>
                              )}
                            </div>
                            {slot.hint && (
                              <p className="text-[10px] text-slate-400 line-clamp-1">{slot.hint}</p>
                            )}
                          </div>

                          <div className="mt-3 aspect-video relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            {existingPhoto ? (
                              <>
                                <img
                                  src={existingPhoto.url}
                                  alt={slot.label}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(slot.key)}
                                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors"
                                  title="Remove photo"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors text-slate-400 hover:text-slate-600">
                                {isUploading ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                                ) : (
                                  <>
                                    <Camera className="w-4 h-4 mb-0.5" />
                                    <span className="text-[9px] font-semibold">Upload</span>
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
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════
                    SECTION 6: TERMS & DECLARATION
                ════════════════════════════════════════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                      required
                    />
                    <label htmlFor="termsAccepted" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer select-none">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Declaration &amp; Terms Agreement:
                      </span>{' '}
                      I certify that I am the authorized owner / representative of this venue, and all information provided is accurate. By submitting, I agree to the RentalMeet Terms of Service and Privacy Policy.
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !phoneVerified}
                className="w-full py-4.5 bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-700 hover:to-amber-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-primary-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account &amp; Registering Venue...</span>
                  </>
                ) : !phoneVerified ? (
                  <>
                    <Phone className="w-5 h-5" />
                    <span>Please Verify Phone Number with OTP to Register</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isVendor ? 'Complete Vendor Registration' : 'Register & Submit Venue Listing'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Already have an account link */}
          <div className="mt-8 text-center border-t border-slate-200 dark:border-slate-800 pt-6">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                href={`/login?role=${formData.role}`}
                className="text-primary-600 font-bold hover:underline"
              >
                Sign In with your Email &amp; Password
              </Link>
            </p>
          </div>

            </div>
          </div>

        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════════════════
          SUCCESS MODAL: THANK YOU & EXPLICIT LOGIN CREDENTIALS
      ════════════════════════════════════════════════════════════════════════ */}
      {showSuccessModal && registrationResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-in my-8">
            
            {/* Header / Celebration */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Registration Successful! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Welcome <span className="font-bold text-slate-800 dark:text-slate-200">{registrationResult.name}</span>! Your venue{' '}
                <span className="font-bold text-primary-600 dark:text-primary-400">"{registrationResult.venueName}"</span> has been successfully listed.
              </p>
            </div>

            {/* Prominent Login Credentials Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Your Login Credentials
                </span>
                <span className="text-[10px] text-slate-400">Save for login</span>
              </div>

              {/* Warning Notice: Login using Email */}
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> Always log in using your <strong>Email ID</strong> and <strong>Password</strong>. (Mobile number is not used for login).
                </span>
              </div>

              {/* Login Email ID */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Login Email ID:
                </label>
                <div className="flex items-center justify-between gap-2 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                  <span className="font-mono text-sm font-bold text-emerald-400 select-all truncate">
                    {registrationResult.email}
                  </span>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="p-1.5 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shrink-0"
                    title="Copy Email"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Password:
                </label>
                <div className="flex items-center justify-between gap-2 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
                  <span className="font-mono text-sm font-bold text-amber-300 select-all truncate">
                    {registrationResult.password}
                  </span>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="p-1.5 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shrink-0"
                    title="Copy Password"
                  >
                    {copiedPassword ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Copy All Credentials Button */}
              <button
                type="button"
                onClick={copyAllCredentials}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy All Credentials to Clipboard
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoToDashboard}
                className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>Go to Owner Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToLogin}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors text-center"
              >
                Go to Sign In Page
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
