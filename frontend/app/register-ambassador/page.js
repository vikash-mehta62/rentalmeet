'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { State, City } from 'country-state-city';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Briefcase,
  Building2,
  CreditCard,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  ShieldCheck,
  Clock
} from 'lucide-react';

const VENUE_NETWORK_OPTIONS = [
  { id: 'hotels', label: 'Hotels' },
  { id: 'meetingRooms', label: 'Meeting Rooms' },
  { id: 'conferenceHalls', label: 'Conference Halls' },
  { id: 'trainingCentres', label: 'Training Centres' },
  { id: 'coachingInstitutes', label: 'Coaching Institutes' },
  { id: 'banquetHalls', label: 'Banquet Halls' },
  { id: 'marriageGardens', label: 'Marriage Gardens' },
  { id: 'farmHouses', label: 'Farm Houses' },
  { id: 'coworkingSpaces', label: 'Coworking Spaces' },
  { id: 'schoolsColleges', label: 'Schools / Colleges' }
];

export default function RegisterAmbassadorPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [assignedAmbassadorId, setAssignedAmbassadorId] = useState('');

  // OTP Verification States
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);

  // Referral State
  const [referrerName, setReferrerName] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState('');

  // File Upload State
  const [uploading, setUploading] = useState({});

  // Main Form Data State
  const [formData, setFormData] = useState({
    // Step 1: Personal & Auth
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: 'Male',
    aadhaarNumber: '',
    panNumber: '',

    // Step 2: Address & Coverage
    currentAddress: '',
    state: '',
    city: '',
    district: '',
    pincode: '',
    areaCoverage: '',

    // Step 3: Professional & Profile
    currentOccupation: '',
    companyName: '',
    educationQualification: '',
    workExperience: '',
    salesMarketingExperience: false,
    digitalMarketingExperience: false,
    profileType: 'Venue Explorer (Part-Time)',
    cityCoverage: '',
    districtCoverage: '',
    stateCoverage: '',

    // Step 4: Venue Network & Performance
    venueNetwork: {
      hotels: false,
      meetingRooms: false,
      conferenceHalls: false,
      trainingCentres: false,
      coachingInstitutes: false,
      banquetHalls: false,
      marriageGardens: false,
      farmHouses: false,
      coworkingSpaces: false,
      schoolsColleges: false
    },
    venuesPerDay: '2-3 Venues',
    venuesPerMonth: '50-100 Venues',
    preferredWorkingTime: 'Flexible / Part-Time',
    preferredAreaCoverage: '',

    // Step 5: Bank & Referral
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    referralCode: '',

    // Step 6: Documents & Declaration
    passportPhoto: '',
    aadhaarFront: '',
    aadhaarBack: '',
    panCard: '',
    identityProof: '',
    identityProofBack: '',
    identityProofType: 'Aadhaar',
    bankProof: '',
    addressProof: '',
    declarationAgreed: true,
    applicantSignatureName: '',
    place: ''
  });

  const [selectedStateCode, setSelectedStateCode] = useState('');
  const stateOptions = useMemo(() => State.getStatesOfCountry('IN'), []);
  const cityOptions = useMemo(
    () => (selectedStateCode ? City.getCitiesOfState('IN', selectedStateCode) : []),
    [selectedStateCode]
  );

  // Verify referral code on change
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

    return () => { mounted = false; };
  }, [formData.referralCode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleNetworkToggle = (networkKey) => {
    setFormData((prev) => ({
      ...prev,
      venueNetwork: {
        ...prev.venueNetwork,
        [networkKey]: !prev.venueNetwork[networkKey]
      }
    }));
  };

  // Upload file helper
  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploading((p) => ({ ...p, [fieldName]: true }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        body: data
      });
      const json = await res.json();
      if (json.success && json.url) {
        setFormData((p) => ({ ...p, [fieldName]: json.url }));
      } else {
        alert(json.message || 'Upload failed');
      }
    } catch {
      alert('File upload failed. Please try again.');
    } finally {
      setUploading((p) => ({ ...p, [fieldName]: false }));
    }
  };

  // OTP handlers
  const handleSendEmailOtp = async () => {
    if (!formData.name?.trim()) {
      setError('Please fill in Full Name first');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setEmailOtpLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email })
      });
      const data = await res.json();
      if (data.success) setEmailOtpSent(true);
      else setError(data.message || 'Failed to send verification code');
    } catch {
      setError('Failed to send verification code');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtpCode.length !== 6) return;
    setEmailOtpLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: emailOtpCode })
      });
      const data = await res.json();
      if (data.success) setEmailVerified(true);
      else setError(data.message || 'Invalid code');
    } catch {
      setError('Verification failed');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!formData.name?.trim()) {
      setError('Please fill in Full Name first');
      return;
    }
    if (formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setPhoneOtpLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, phone: formData.phone })
      });
      const data = await res.json();
      if (data.success) setPhoneOtpSent(true);
      else setError(data.message || 'Failed to send phone code');
    } catch {
      setError('Failed to send phone verification code');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtpCode.length !== 6) return;
    setPhoneOtpLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone, otp: phoneOtpCode })
      });
      const data = await res.json();
      if (data.success) setPhoneVerified(true);
      else setError(data.message || 'Invalid code');
    } catch {
      setError('Verification failed');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
        setError('Please fill all required personal fields');
        return;
      }
      if (!formData.gender) {
        setError('Please select your Gender');
        return;
      }
      if (!formData.aadhaarNumber || formData.aadhaarNumber.replace(/\s/g, '').length < 12) {
        setError('Please enter a valid 12-digit Aadhaar Card Number');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (!emailVerified || !phoneVerified) {
        setError('Please verify both your email and phone number with OTP first');
        return;
      }
    } else if (step === 2) {
      if (!formData.currentAddress || !formData.state || !formData.city) {
        setError('Please complete the current address, state, and city');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  // Final Application Submission
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.aadhaarFront && !formData.identityProof) {
      setError('Please upload your Aadhaar Card (Front Side)');
      return;
    }

    if (!formData.declarationAgreed) {
      setError('Please accept the declaration terms to complete your application');
      return;
    }

    setLoading(true);
    try {
      const body = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        referralCode: formData.referralCode || undefined,
        personalInfo: {
          fullName: formData.name,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          mobileNumber: formData.phone,
          whatsAppNumber: formData.phone,
          email: formData.email,
          aadhaarNumber: formData.aadhaarNumber,
          panNumber: formData.panNumber
        },
        addressDetails: {
          currentAddress: formData.currentAddress,
          city: formData.city,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode || '',
          areaCoverage: formData.areaCoverage || formData.city
        },
        professionalDetails: {
          currentOccupation: formData.currentOccupation,
          companyName: formData.companyName,
          educationQualification: formData.educationQualification,
          workExperience: formData.workExperience,
          salesMarketingExperience: formData.salesMarketingExperience,
          digitalMarketingExperience: formData.digitalMarketingExperience
        },
        profileType: formData.profileType,
        preferredWorkingArea: {
          cityCoverage: formData.cityCoverage || formData.city,
          districtCoverage: formData.districtCoverage,
          stateCoverage: formData.stateCoverage || formData.state
        },
        venueNetwork: formData.venueNetwork,
        expectedPerformance: {
          venuesPerDay: formData.venuesPerDay,
          venuesPerMonth: formData.venuesPerMonth,
          preferredWorkingTime: formData.preferredWorkingTime,
          preferredAreaCoverage: formData.preferredAreaCoverage || formData.areaCoverage
        },
        bankDetails: {
          accountHolderName: formData.accountHolderName || formData.name,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          upiId: formData.upiId
        },
        documents: {
          passportPhoto: formData.passportPhoto,
          aadhaarFront: formData.aadhaarFront || formData.identityProof,
          aadhaarBack: formData.aadhaarBack || formData.identityProofBack,
          panCard: formData.panCard,
          identityProof: formData.aadhaarFront || formData.identityProof,
          identityProofBack: formData.aadhaarBack || formData.identityProofBack,
          identityProofType: 'Aadhaar',
          bankProof: formData.bankProof,
          addressProof: formData.addressProof
        },
        declaration: {
          agreed: formData.declarationAgreed,
          applicantSignatureName: formData.applicantSignatureName || formData.name,
          place: formData.place || formData.city
        }
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        setAssignedAmbassadorId(data.ambassadorId || `RMA${formData.phone.replace(/\D/g, '').slice(-10)}`);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.message || 'Application submission failed');
      }
    } catch {
      setError('Something went wrong submitting your application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 text-sm outline-none transition-all';

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 pt-36">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-500 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <div>
              <span className="px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-300 dark:border-amber-800">
                Application Submitted
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
                Your Application is Under Review
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Thank you for applying to become a RentalMeet Venue Ambassador. Your application has been submitted to Admin for verification and approval.
              </p>
            </div>

            {/* Application Details Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Applicant Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formData.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Assigned Ambassador ID:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">{assignedAmbassadorId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Referral Code:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">{assignedAmbassadorId}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Application Status:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Pending Approval
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 text-left">
              💡 <strong>Login Notice:</strong> You will be able to log in to your Ambassador Portal with your registered email and password as soon as your application is approved by the admin team.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/login"
                className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all text-center"
              >
                Go to Login Page
              </Link>
              <Link
                href="/"
                className="flex-1 py-3.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-center transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pt-32">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="w-4 h-4 text-amber-600" />
              Venue Acquisition Partner Program
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-900 dark:text-white">
              Venue Ambassador <span className="text-primary-600">Application Form</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              &quot;Find Venues. Create Income. Build India&apos;s Largest Venue Network.&quot;
            </p>
          </div>

          {/* Step Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Step {step} of 6: {
                  step === 1 ? 'Personal Information' :
                  step === 2 ? 'Address & Coverage' :
                  step === 3 ? 'Professional Profile' :
                  step === 4 ? 'Venue Network' :
                  step === 5 ? 'Bank & Referral' : 'Documents & Declaration'
                }
              </span>
              <span className="text-xs font-bold text-primary-600">{Math.round((step / 6) * 100)}% Complete</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300 rounded-full"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-sm flex items-center gap-3 rounded-r-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* STEP 1: Personal Information & Credentials */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Part A: Personal Information &amp; Account Setup
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name as per Aadhaar"
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass} required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Email with OTP */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@domain.com"
                    disabled={emailVerified}
                    className={`${inputClass} pr-24`}
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {emailVerified ? (
                      <span className="text-green-600 font-bold text-xs px-2">✓ Verified</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={emailOtpLoading || !formData.email}
                        className="px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xs transition-colors"
                      >
                        {emailOtpLoading ? '...' : emailOtpSent ? 'Resend' : 'Verify'}
                      </button>
                    )}
                  </div>
                </div>

                {emailOtpSent && !emailVerified && (
                  <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                    <input
                      type="text"
                      placeholder="6-digit Email OTP"
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-center font-bold tracking-widest bg-white dark:bg-slate-800"
                      maxLength="6"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmailOtp}
                      disabled={emailOtpCode.length !== 6 || emailOtpLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>

              {/* Phone with OTP */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Phone Number (WhatsApp Number) *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    disabled={phoneVerified}
                    className={`${inputClass} pr-24`}
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {phoneVerified ? (
                      <span className="text-green-600 font-bold text-xs px-2">✓ Verified</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendPhoneOtp}
                        disabled={phoneOtpLoading || formData.phone.length !== 10}
                        className="px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xs transition-colors"
                      >
                        {phoneOtpLoading ? '...' : phoneOtpSent ? 'Resend' : 'Verify'}
                      </button>
                    )}
                  </div>
                </div>

                {phoneOtpSent && !phoneVerified && (
                  <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                    <input
                      type="text"
                      placeholder="6-digit Phone OTP"
                      value={phoneOtpCode}
                      onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-center font-bold tracking-widest bg-white dark:bg-slate-800"
                      maxLength="6"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhoneOtp}
                      disabled={phoneOtpCode.length !== 6 || phoneOtpLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>

              {/* Separate Aadhaar & PAN Card Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Aadhaar Card Number *</label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                    placeholder="12-digit Aadhaar Number"
                    maxLength="12"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">PAN Card Number (Optional)</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, panNumber: e.target.value.toUpperCase().slice(0, 10) }))}
                    placeholder="10-digit PAN (e.g. ABCDE1234F)"
                    maxLength="10"
                    className={inputClass + ' uppercase'}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Create Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className={inputClass}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-8 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Address & Coverage */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Part B: Address &amp; Coverage Area Details
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Current Address *</label>
                <textarea
                  name="currentAddress"
                  value={formData.currentAddress}
                  onChange={handleChange}
                  placeholder="House/Flat No, Street, Landmark"
                  rows="2"
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">State *</label>
                  <select
                    name="state"
                    value={selectedStateCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const selected = stateOptions.find((s) => s.isoCode === code);
                      setSelectedStateCode(code);
                      setFormData((p) => ({ ...p, state: selected?.name || '', city: '' }));
                    }}
                    className={inputClass}
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">City *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    disabled={!selectedStateCode}
                    className={inputClass}
                    required
                  >
                    <option value="">{selectedStateCode ? 'Select City' : 'Select State First'}</option>
                    {cityOptions.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="District Name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Pin Code (Optional)</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6-digit Pincode"
                    maxLength="6"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Area / Locality You Will Cover *
                </label>
                <input
                  type="text"
                  name="areaCoverage"
                  value={formData.areaCoverage}
                  onChange={handleChange}
                  placeholder="e.g., MP Nagar, Arera Colony, Hoshangabad Road"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 3: Professional & Profile Details */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Part C &amp; D: Professional Background &amp; Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Current Occupation</label>
                  <input
                    type="text"
                    name="currentOccupation"
                    value={formData.currentOccupation}
                    onChange={handleChange}
                    placeholder="e.g. Student, Freelancer, Sales Exec"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Company / Organization (If any)</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Company Name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Education Qualification</label>
                  <input
                    type="text"
                    name="educationQualification"
                    value={formData.educationQualification}
                    onChange={handleChange}
                    placeholder="e.g. Graduate, 12th, MBA"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Work Experience</label>
                  <input
                    type="text"
                    name="workExperience"
                    value={formData.workExperience}
                    onChange={handleChange}
                    placeholder="e.g. 1 Year in Marketing / Fresher"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">I want to join RentalMeet as:</label>
                <select name="profileType" value={formData.profileType} onChange={handleChange} className={inputClass}>
                  <option value="Venue Explorer (Part-Time)">Venue Explorer (Part-Time)</option>
                  <option value="Venue Champion">Venue Champion</option>
                  <option value="City Venue Partner">City Venue Partner</option>
                  <option value="Full-Time Venue Acquisition Partner">Full-Time Venue Acquisition Partner</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="salesMarketingExperience"
                    checked={formData.salesMarketingExperience}
                    onChange={handleChange}
                    className="w-4 h-4 accent-primary-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    I have Sales / Marketing Experience
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="digitalMarketingExperience"
                    checked={formData.digitalMarketingExperience}
                    onChange={handleChange}
                    className="w-4 h-4 accent-primary-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    I have Digital Marketing Experience
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: Venue Network & Performance */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Part E &amp; F: Venue Network &amp; Expected Performance
              </h2>

              <p className="text-xs text-slate-500">Do you have existing contacts with any of these venue types?</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VENUE_NETWORK_OPTIONS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleNetworkToggle(v.id)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                      formData.venueNetwork[v.id]
                        ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-700 dark:text-primary-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{v.label}</span>
                    {formData.venueNetwork[v.id] ? <CheckCircle2 className="w-4 h-4 text-primary-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Expected Venues Per Day</label>
                  <select name="venuesPerDay" value={formData.venuesPerDay} onChange={handleChange} className={inputClass}>
                    <option value="1-2 Venues">1-2 Venues</option>
                    <option value="3-5 Venues (Challenge eligible)">3-5 Venues (Challenge eligible)</option>
                    <option value="5+ Venues">5+ Venues</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Expected Venues Per Month</label>
                  <select name="venuesPerMonth" value={formData.venuesPerMonth} onChange={handleChange} className={inputClass}>
                    <option value="20-50 Venues">20-50 Venues (LV.1)</option>
                    <option value="51-200 Venues">51-200 Venues (LV.2)</option>
                    <option value="200+ Venues">200+ Venues (LV.3/LV.4)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Bank Details & Referral */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Part G &amp; H: Bank Details for Payouts &amp; Referral
              </h2>

              <p className="text-xs text-slate-500">Provide bank or UPI details for direct instant reward transfers.</p>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">UPI ID (Fastest Payouts)</label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="e.g. yourname@okhdfcbank"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Account Holder Name</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    placeholder="Name as per Bank"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g., HDFC, SBI, ICICI"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Account Number</label>
                  <input
                    type="password"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Account Number (Encrypted)"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    placeholder="e.g. HDFC0001234"
                    className={inputClass + ' uppercase'}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Referred By (Ambassador Referral Code)</label>
                <div className="relative">
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    placeholder="e.g. AMB82910X (Optional)"
                    className={inputClass + ' uppercase'}
                  />
                  {referralLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {referrerName && <p className="text-xs text-green-600 font-bold mt-1">✓ Verified Referrer: {referrerName}</p>}
                {referralError && <p className="text-xs text-red-500 font-bold mt-1">✗ {referralError}</p>}
              </div>
            </div>
          )}

          {/* STEP 6: Document Upload & Declaration */}
          {step === 6 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Part I &amp; J: Document Upload &amp; Declaration
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Aadhaar Card Front - Mandatory */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Aadhaar Card (Front Side) *
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold mt-2 hover:border-primary-500">
                    <Upload className="w-4 h-4 text-primary-600" />
                    {uploading.aadhaarFront ? 'Uploading...' : formData.aadhaarFront ? 'Change Front' : 'Upload Aadhaar Front'}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'aadhaarFront')} />
                  </label>
                  {formData.aadhaarFront && <p className="text-[11px] text-green-600 font-bold mt-1">✓ Uploaded</p>}
                </div>

                {/* Aadhaar Card Back - Optional */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Aadhaar Card (Back Side)
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold mt-2 hover:border-primary-500">
                    <Upload className="w-4 h-4 text-primary-600" />
                    {uploading.aadhaarBack ? 'Uploading...' : formData.aadhaarBack ? 'Change Back' : 'Upload Aadhaar Back'}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'aadhaarBack')} />
                  </label>
                  {formData.aadhaarBack && <p className="text-[11px] text-green-600 font-bold mt-1">✓ Uploaded</p>}
                </div>

                {/* PAN Card - Optional */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    PAN Card (Optional)
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold mt-2 hover:border-primary-500">
                    <Upload className="w-4 h-4 text-primary-600" />
                    {uploading.panCard ? 'Uploading...' : formData.panCard ? 'Change PAN' : 'Upload PAN Card'}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'panCard')} />
                  </label>
                  {formData.panCard && <p className="text-[11px] text-green-600 font-bold mt-1">✓ Uploaded</p>}
                </div>

                {/* Passport Photo */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Passport Size Photo</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold mt-2 hover:border-primary-500">
                    <Upload className="w-4 h-4 text-primary-600" />
                    {uploading.passportPhoto ? 'Uploading...' : formData.passportPhoto ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'passportPhoto')} />
                  </label>
                  {formData.passportPhoto && <p className="text-[11px] text-green-600 font-bold mt-1">✓ Uploaded</p>}
                </div>
              </div>

              {/* Declaration */}
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Applicant Declaration:</p>
                <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4">
                  <li>The information provided by me is true and correct.</li>
                  <li>I agree to follow RentalMeet™ venue verification guidelines.</li>
                  <li>I will not upload fake, duplicate, or misleading venue information.</li>
                  <li>I understand payments will be made only for verified &amp; approved venue listings.</li>
                  <li>I agree to RentalMeet™ Ambassador Program terms &amp; conditions.</li>
                </ul>

                <label className="flex items-center gap-3 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="declarationAgreed"
                    checked={formData.declarationAgreed}
                    onChange={handleChange}
                    className="w-4 h-4 accent-primary-600 rounded"
                    required
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    I agree and accept all the terms above.
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Applicant Signature / Full Name</label>
                  <input
                    type="text"
                    name="applicantSignatureName"
                    value={formData.applicantSignatureName || formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Place</label>
                  <input
                    type="text"
                    name="place"
                    value={formData.place || formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Bhopal, Indore"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => { setError(''); setStep((s) => s - 1); }}
                className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            ) : <div />}

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={loading}
                className="px-10 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Submit & Join Network'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
