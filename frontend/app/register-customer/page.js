'use client';

import { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, Camera, Upload, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { State, City } from 'country-state-city';
import Navbar from '@/components/Navbar';

const STEPS = ['Account', 'KYC Documents', 'Done'];

function CustomerRegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  // Step 1 — account info
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', city: '', state: '' });
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [targetType, setTargetType] = useState('customer');
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  // Email OTP states
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  // Phone OTP states
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);

  // Step 2 — KYC
  const [idProofType, setIdProofType] = useState('Aadhaar');
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);
  const [idProofBackFile, setIdProofBackFile] = useState(null);
  const [idProofBackPreview, setIdProofBackPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Back side required for Aadhaar and Voter ID
  const needsBack = ['Aadhaar', 'Voter ID'].includes(idProofType);

  const handleChange = e => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };
  const stateOptions = useMemo(() => State.getStatesOfCountry('IN'), []);
  const cityOptions = useMemo(
    () => (selectedStateCode ? City.getCitiesOfState('IN', selectedStateCode) : []),
    [selectedStateCode]
  );
  const targetConfig = useMemo(() => {
    const config = {
      customer: {
        role: 'customer',
        subtitle: 'Register as a Client (User)',
        dashboardPath: '/customer/dashboard',
        heroTitle: 'Client Account',
        badge: 'Customer Registration',
        heroDescription: 'Book venues faster, track bookings, and manage events easily with RentalMeet.',
        heroImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80',
        features: ['Browse 500+ premium venues', 'Instant booking confirmation', 'Secure payments & easy cancellation']
      },
      venue: {
        role: 'owner',
        subtitle: 'Register as a Venue Owner',
        dashboardPath: '/owner/dashboard',
        heroTitle: 'Venue Owner',
        badge: 'Venue Owner Registration',
        heroDescription: 'List your spaces and start receiving booking requests from verified customers.',
        heroImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1400&q=80',
        features: ['List unlimited venues', 'Get confirmed bookings daily', 'Track earnings in real-time']
      },
      vendor: {
        role: 'vendor',
        subtitle: 'Register as a Vendor Partner',
        dashboardPath: '/vendor/dashboard',
        heroTitle: 'Vendor Partner',
        badge: 'Vendor Registration',
        heroDescription: 'Grow your business with service leads and direct customer referrals.',
        heroImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&q=80',
        features: ['Reach thousands of event planners', 'Manage bookings & payments', 'Build your brand online']
      }
    };
    return config[targetType] || config.customer;
  }, [targetType]);

  useEffect(() => {
    const targetParam = (searchParams.get('target') || '').toLowerCase();
    const roleParam = (searchParams.get('role') || '').toLowerCase();
    const roleToTarget = { owner: 'venue', vendor: 'vendor', customer: 'customer' };
    const resolvedTarget = ['customer', 'venue', 'vendor'].includes(targetParam)
      ? targetParam
      : (roleToTarget[roleParam] || 'customer');

    setTargetType(resolvedTarget);

    const ref = (searchParams.get('ref') || '').trim().toUpperCase();
    setReferralCode(ref);
  }, [searchParams]);

  useEffect(() => {
    const code = referralCode.trim().toUpperCase();
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
  }, [referralCode]);

  const handleSendEmailOtp = async () => {
    if (!form.name?.trim()) {
      setError('Please fill in Full Name first to verify email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setEmailOtpLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email })
      });
      const data = await res.json();
      if (data.success) {
        setEmailOtpSent(true);
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch {
      setError('Failed to send email verification code. Please try again.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtpCode.length !== 6) return;
    setError('');
    setEmailOtpLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: emailOtpCode })
      });
      const data = await res.json();
      if (data.success) {
        setEmailVerified(true);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch {
      setError('Failed to verify email code. Please try again.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!form.name?.trim()) {
      setError('Please fill in Full Name first to verify phone');
      return;
    }
    if (form.phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setPhoneOtpLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone })
      });
      const data = await res.json();
      if (data.success) {
        setPhoneOtpSent(true);
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch {
      setError('Failed to send phone verification code. Please try again.');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtpCode.length !== 6) return;
    setError('');
    setPhoneOtpLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, otp: phoneOtpCode })
      });
      const data = await res.json();
      if (data.success) {
        setPhoneVerified(true);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch {
      setError('Failed to verify phone code. Please try again.');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // Step 1 submit — register account
  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone || !form.password) { setError('All fields required'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.phone.length !== 10) { setError('Phone must be 10 digits'); return; }
    if (referralCode && referralError) { setError('Please enter a valid referral code'); return; }

    if (!emailVerified || !phoneVerified) {
      setError('Please verify both your email address and phone number first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: targetConfig.role,
          city: form.city,
          state: form.state,
          referralCode: referralCode || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setAuth(data.user, data.token);
        setStep(1);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  // Camera
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { toast.error('Camera access denied. Please upload a selfie instead.'); }
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(blob));
      closeCamera();
    }, 'image/jpeg', 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraOpen(false);
  };

  useEffect(() => () => closeCamera(), []);

  // Step 2 submit — upload KYC
  const handleKYC = async () => {
    if (!idProofFile) { toast.error('Please upload your ID proof'); return; }
    if (!selfieFile) { toast.error('Please take a selfie or upload one'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('idProof', idProofFile);
      if (idProofBackFile) {
        fd.append('idProofBack', idProofBackFile);
      }
      fd.append('selfie', selfieFile);
      fd.append('idProofType', idProofType);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/kyc-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch { toast.error('Upload failed'); }
    finally { setLoading(false); }
  };

  const inputCls = 'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <Navbar />
      <main className="w-full h-full pt-[80px]">
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
          <div className="relative w-full md:w-1/2 bg-dark-900 flex items-center justify-center p-8 lg:p-16 overflow-hidden min-h-[320px] md:min-h-0">
            <img
              src={targetConfig.heroImage}
              alt={targetConfig.heroTitle}
              className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105 hover:scale-100 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-700/60 to-dark-900/90" />

            <div className="relative z-10 max-w-lg w-full">
              <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
              <div className="space-y-5">
                <span className="px-3 py-1 bg-primary-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {targetConfig.badge}
                </span>
                <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                  Start Your <br />
                  <span className="text-primary-400">{targetConfig.heroTitle}</span><br />
                  <span className="text-white">Journey</span>
                </h2>
                <p className="text-base text-gray-200 font-light max-w-md">
                  {targetConfig.heroDescription}
                </p>
                {targetConfig.features && (
                  <ul className="space-y-2.5 pt-2">
                    {targetConfig.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                        <span className="w-5 h-5 rounded-full bg-primary-500/30 border border-primary-400 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-start p-6 sm:p-8 lg:p-14 overflow-y-auto">
            <div className="w-full max-w-xl">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
        
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* ── STEP 0: Account Info ── */}
          {step === 0 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Create Account</h1>
              <p className="text-sm text-gray-500 text-center mb-6">{targetConfig.subtitle}</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
              <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} className={inputCls} required /></div>
                    
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          name="email"
                          type="email"
                          placeholder="Email Address *"
                          value={form.email}
                          onChange={handleChange}
                          className={inputCls + ' pr-24'}
                          required
                          disabled={emailVerified}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          {emailVerified ? (
                            <span className="text-green-600 font-bold text-xs px-2 select-none">✓ Verified</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={emailOtpLoading || !form.email}
                              className="px-2.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-[10px] transition-colors disabled:opacity-50"
                            >
                              {emailOtpLoading ? '...' : emailOtpSent ? 'Resend' : 'Verify'}
                            </button>
                          )}
                        </div>
                      </div>

                      {emailOtpSent && !emailVerified && (
                        <div className="flex gap-2 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100 animate-slide-up">
                          <input
                            type="text"
                            placeholder="6-digit Email OTP"
                            value={emailOtpCode}
                            onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500 text-center tracking-widest font-bold"
                            maxLength="6"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyEmailOtp}
                            disabled={emailOtpCode.length !== 6 || emailOtpLoading}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                          >
                            Verify
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          name="phone"
                          type="tel"
                          placeholder="10-digit Phone *"
                          value={form.phone}
                          onChange={handleChange}
                          maxLength={10}
                          className={inputCls + ' pr-24'}
                          required
                          disabled={phoneVerified}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          {phoneVerified ? (
                            <span className="text-green-600 font-bold text-xs px-2 select-none">✓ Verified</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendPhoneOtp}
                              disabled={phoneOtpLoading || form.phone.length !== 10}
                              className="px-2.5 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-[10px] transition-colors disabled:opacity-50"
                            >
                              {phoneOtpLoading ? '...' : phoneOtpSent ? 'Resend' : 'Verify'}
                            </button>
                          )}
                        </div>
                      </div>

                      {phoneOtpSent && !phoneVerified && (
                        <div className="flex gap-2 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100 animate-slide-up">
                          <input
                            type="text"
                            placeholder="6-digit Phone OTP"
                            value={phoneOtpCode}
                            onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-primary-500 text-center tracking-widest font-bold"
                            maxLength="6"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyPhoneOtp}
                            disabled={phoneOtpCode.length !== 6 || phoneOtpLoading}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                          >
                            Verify
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          name="referralCode"
                          placeholder="Referral Code (optional)"
                          value={referralCode}
                          onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setError(''); }}
                          className={inputCls}
                        />
                      </div>
                      {referralLoading && <p className="text-xs text-gray-500">Checking referral...</p>}
                      {!!referrerName && !referralLoading && (
                        <p className="text-xs text-green-600 font-semibold">Referred by: {referrerName}</p>
                      )}
                      {!!referralError && !referralLoading && (
                        <p className="text-xs text-red-500">{referralError}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          name="state"
                          value={selectedStateCode}
                          onChange={(e) => {
                            const code = e.target.value;
                            const selected = stateOptions.find((s) => s.isoCode === code);
                            setSelectedStateCode(code);
                            setForm((p) => ({ ...p, state: selected?.name || '', city: '' }));
                          }}
                          className={inputCls}
                        >
                          <option value="">Select State</option>
                          {stateOptions.map((s) => (
                            <option key={s.isoCode} value={s.isoCode}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          name="city"
                          value={form.city}
                          onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                          disabled={!selectedStateCode}
                          className={`${inputCls} ${!selectedStateCode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
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
                    <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="password" type={showPwd ? 'text' : 'password'} placeholder="Password (min 6 chars) *" value={form.password} onChange={handleChange} className={inputCls + ' pr-10'} required /><button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                    <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="confirm" type={showPwd ? 'text' : 'password'} placeholder="Confirm Password *" value={form.confirm} onChange={handleChange} className={inputCls} required /></div>
                  
                
                <button type="submit" disabled={loading || !emailVerified || !phoneVerified} className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : !emailVerified || !phoneVerified ? (
                    'Verify Email & Phone to Continue'
                  ) : (
                    'Continue to KYC →'
                  )}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <Link href="/login" className="text-primary-500 font-semibold">Login</Link></p>
            </>
          )}

          {/* ── STEP 1: KYC Documents ── */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Verify Your Identity</h1>
              <p className="text-sm text-gray-500 text-center mb-2">Required to book venues on RentalMeet</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">ID proof, address proof and real-time selfie are mandatory. You cannot book venues without completing KYC.</p>
              </div>

              <div className="space-y-5">
                {/* ID Proof Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ID Proof Type *</label>
                  <select value={idProofType} onChange={e => { setIdProofType(e.target.value); setIdProofBackFile(null); setIdProofBackPreview(null); }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500">
                    {['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* ID Proof Upload — Front */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload {idProofType} {needsBack ? '— Front Side *' : '*'}
                  </label>
                  {idProofPreview ? (
                    <div className="relative">
                      <img src={idProofPreview} alt="ID Proof" className="w-full h-40 object-cover rounded-xl border-2 border-green-400" />
                      <button onClick={() => { setIdProofFile(null); setIdProofPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✕</button>
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload {needsBack ? 'front side' : idProofType}</span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (max 5MB)</span>
                      <input type="file" accept="image/*,.pdf" className="hidden"
                        onChange={e => { const f = e.target.files[0]; if (f) { setIdProofFile(f); setIdProofPreview(URL.createObjectURL(f)); } }} />
                    </label>
                  )}
                </div>

                {/* ID Proof Back — only for Aadhaar & Voter ID */}
                {needsBack && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload {idProofType} — Back Side *
                    </label>
                    {idProofBackPreview ? (
                      <div className="relative">
                        <img src={idProofBackPreview} alt="ID Proof Back" className="w-full h-40 object-cover rounded-xl border-2 border-green-400" />
                        <button onClick={() => { setIdProofBackFile(null); setIdProofBackPreview(null); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✕</button>
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Click to upload back side</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (max 5MB)</span>
                        <input type="file" accept="image/*,.pdf" className="hidden"
                          onChange={e => { const f = e.target.files[0]; if (f) { setIdProofBackFile(f); setIdProofBackPreview(URL.createObjectURL(f)); } }} />
                      </label>
                    )}
                  </div>
                )}

                {/* Selfie */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Real-time Selfie *</label>
                  <p className="text-xs text-gray-400 mb-2">Take a live selfie using your camera for identity verification</p>

                  {cameraOpen ? (
                    <div className="space-y-3">
                      <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border-2 border-primary-400" style={{ maxHeight: 240 }} />
                      <div className="flex gap-2">
                        <button onClick={captureSelfie} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                          <Camera className="w-4 h-4" /> Capture
                        </button>
                        <button onClick={closeCamera} className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold">Cancel</button>
                      </div>
                    </div>
                  ) : selfiePreview ? (
                    <div className="relative">
                      <img src={selfiePreview} alt="Selfie" className="w-full h-40 object-cover rounded-xl border-2 border-green-400" />
                      <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✕</button>
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Selfie Captured</div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={openCamera} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm transition-colors">
                        <Camera className="w-4 h-4" /> Open Camera
                      </button>
                      <label className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 text-sm text-gray-500 font-semibold">
                        <Upload className="w-4 h-4" /> Upload Photo
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files[0]; if (f) { setSelfieFile(f); setSelfiePreview(URL.createObjectURL(f)); } }} />
                      </label>
                    </div>
                  )}
                </div>

                <button onClick={handleKYC} disabled={loading || !idProofFile || !selfieFile}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? 'Uploading...' : <><CheckCircle2 className="w-4 h-4" /> Complete Registration</>}
                </button>

                <button onClick={() => { setStep(2); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                  Skip for now (you can complete KYC later from your profile)
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Done ── */}
          {step === 2 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
              <p className="text-gray-500 text-sm mb-6">Your account has been created successfully. You can now browse and book venues.</p>
              <button onClick={() => router.push(targetConfig.dashboardPath)}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors">
                Go to Dashboard →
              </button>
            </div>
          )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CustomerRegister() {
  return (
    <Suspense fallback={null}>
      <CustomerRegisterInner />
    </Suspense>
  );
}
