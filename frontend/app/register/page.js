'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { State, City } from 'country-state-city';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, User, Mail, Phone, Lock, Eye, EyeOff,
  ArrowLeft, MapPin, Briefcase, Settings, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import Navbar from '@/components/Navbar';

const VENDOR_CATEGORIES = [
  'Catering & Food', 'Photography & Video', 'Decoration & Flowers',
  'Entertainment & Music', 'Event Management', 'AV & Tech Equipment',
  'Transportation', 'Security Services', 'Cleaning Services', 'Other'
];

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, setAuth } = useAuthStore();

  const [hydrated, setHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: 'owner', referralCode: '', city: '', state: ''
  });
  const [referrerName, setReferrerName] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [error, setError] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');

  const stateOptions = useMemo(() => State.getStatesOfCountry('IN'), []);
  const cityOptions = useMemo(
    () => (selectedStateCode ? City.getCitiesOfState('IN', selectedStateCode) : []),
    [selectedStateCode]
  );

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

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const role = (searchParams.get('role') || '').toLowerCase();
    const ref = (searchParams.get('ref') || '').trim().toUpperCase();

    if (role === 'customer') {
      const redirect = searchParams.get('redirect');
      router.replace('/register-customer' + (redirect ? `?redirect=${redirect}` : ''));
      return;
    }

    const normalizedRole = role === 'vendor' ? 'vendor' : 'owner';
    setFormData((prev) => ({
      ...prev,
      role: normalizedRole,
      referralCode: ref || ''
    }));
  }, [hydrated, router, searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    if (token && user) {
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) { router.push(redirectUrl); return; }
      const routes = { owner: '/owner/dashboard', admin: '/admin/dashboard', customer: '/customer/dashboard', vendor: '/vendor/dashboard' };
      router.push(routes[user.role] || '/');
    }
  }, [hydrated, token, user, router, searchParams]);

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
      .finally(() => { if (mounted) setReferralLoading(false); });

    return () => { mounted = false; };
  }, [formData.referralCode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSendEmailOtp = async () => {
    if (!formData.name?.trim()) {
      setError('Please fill in Contact / Full Name first to verify email');
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
        body: JSON.stringify({ email: formData.email, otp: emailOtpCode })
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
    if (!formData.name?.trim()) {
      setError('Please fill in Contact / Full Name first to verify phone');
      return;
    }
    if (formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
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
        body: JSON.stringify({ phone: formData.phone, otp: phoneOtpCode })
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('All fields are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (formData.phone.length !== 10) { setError('Phone number must be 10 digits'); return; }
    if (formData.referralCode && referralError) { setError('Please enter a valid referral code'); return; }

    if (!emailVerified || !phoneVerified) {
      setError('Please verify both your email address and phone number first');
      return;
    }

    setLoading(true);
    try {
      const body = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        referralCode: formData.referralCode || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        ...(formData.role === 'vendor' && {
          accountType: 'company'
        })
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        setAuth(data.user, data.token);
        const routes = { owner: '/owner/dashboard', customer: '/customer/dashboard', vendor: '/vendor/dashboard' };
        router.push(routes[data.user.role] || '/');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated || (token && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inp = 'w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 text-sm transition-all outline-none';
  const isVendor = formData.role === 'vendor';
  
  const targetMeta = isVendor
    ? {
        title: 'Vendor Partner',
        subtitle: 'Grow your service business with RentalMeet leads.',
        image: '/login/vendor.jpg',
        badge: 'Vendor Registration',
        features: ['Reach thousands of event planners', 'Manage bookings & payments', 'Build your brand online'],
        bg: 'bg-white',
        theme: 'light',
        overlay: '',
        imgFit: 'object-contain opacity-100 p-4'
      }
    : {
        title: 'Venue Owner',
        subtitle: 'List your spaces and start receiving bookings quickly.',
        image: '/login/venues.jpg',
        badge: 'Venue Owner Registration',
        features: ['List unlimited venues', 'Get confirmed bookings daily', 'Track earnings in real-time'],
        bg: 'bg-[#f4efea]',
        theme: 'light',
        overlay: '',
        imgFit: 'object-contain opacity-100 p-4'
      };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="w-full h-full pt-[80px]">
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
          
          {/* Left Side: Visual & Content */}
          <div className={`w-full md:w-1/2 ${targetMeta.bg} flex flex-col ${targetMeta.theme === 'light' ? 'justify-start p-8 lg:p-12' : 'relative items-center justify-center p-8 lg:p-16'} overflow-hidden min-h-[320px] md:min-h-0 transition-all duration-500`}>
            {targetMeta.theme === 'light' ? (
              <div className="flex flex-col h-full justify-between max-w-lg w-full mx-auto">
                <div className="mb-6">
                  <Link 
                    href="/" 
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                  </Link>
                  <div className="space-y-3">
                    <span className="px-3 py-1 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {targetMeta.badge}
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
                      Start Your <br />
                      <span className="text-primary-600">{targetMeta.title}</span> <br />
                      <span className="text-gray-800">Journey</span>
                    </h2>
                    <p className="text-sm text-gray-600 font-light">
                      {targetMeta.subtitle} Join hundreds of professionals already earning on RentalMeet.
                    </p>
                    <ul className="space-y-2 pt-2">
                      {targetMeta.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs text-gray-700">
                          <span className="w-4 h-4 rounded-full bg-primary-100 border border-primary-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center min-h-[280px] w-full">
                  <img
                    src={targetMeta.image}
                    alt={targetMeta.title}
                    className="max-w-full max-h-[380px] object-contain rounded-xl shadow-md border border-gray-150 bg-white p-2"
                  />
                </div>
              </div>
            ) : (
              <>
                <img 
                  src={targetMeta.image} 
                  alt={targetMeta.title} 
                  className={`absolute inset-0 w-full h-full ${targetMeta.imgFit}`} 
                />
                {targetMeta.overlay && <div className={`absolute inset-0 ${targetMeta.overlay}`} />}
                
                <div className="relative z-10 max-w-lg w-full">
                  <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                  </Link>
                  <div className="space-y-5">
                    <span className="px-3 py-1 bg-primary-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {targetMeta.badge}
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                      Start Your <br />
                      <span className="text-primary-400">{targetMeta.title}</span><br />
                      <span className="text-white">Journey</span>
                    </h2>
                    <p className="text-base text-gray-200 font-light max-w-md">
                      {targetMeta.subtitle} Join hundreds of professionals already earning on RentalMeet.
                    </p>
                    <ul className="space-y-2.5 pt-2">
                      {targetMeta.features.map((f, i) => (
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
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Side: Registration Form */}
          <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-start p-8 lg:p-20 overflow-y-auto">
            <div className="w-full max-w-md">
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Create Account</h1>
                <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-sm text-gray-600">Registering as</span>
                  <span className="text-sm font-black text-primary-600 uppercase tracking-widest">
                    {isVendor ? 'Vendor' : 'Venue Owner'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-3 rounded-r-xl">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={isVendor ? 'Contact Person Name *' : 'Full Name *'}
                    className={inp}
                    required
                  />
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
                        setFormData((p) => ({ ...p, state: selected?.name || '', city: '' }));
                      }}
                      className={inp}
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
                      value={formData.city}
                      onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                      disabled={!selectedStateCode}
                      className={`${inp} ${!selectedStateCode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
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

                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email Address *"
                      className={inp + ' pr-24'}
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
                          disabled={emailOtpLoading || !formData.email}
                          className="px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-[10px] transition-colors disabled:opacity-50"
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
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone *"
                      maxLength="10"
                      className={inp + ' pr-24'}
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
                          disabled={phoneOtpLoading || formData.phone.length !== 10}
                          className="px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-[10px] transition-colors disabled:opacity-50"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Password *" className={inp} required />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm *" className={inp} required />
                  </div>
                </div>

                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    placeholder="Referral Code (optional)"
                    className={inp + ' uppercase font-medium'}
                    maxLength="10"
                  />
                  {referralLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}
                </div>

                {referrerName && <p className="text-[11px] px-2 text-green-600 font-bold flex items-center gap-1">✓ Verified Referrer: {referrerName}</p>}
                {referralError && <p className="text-[11px] px-2 text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {referralError}</p>}

                <button 
                  type="submit" 
                  disabled={loading || !emailVerified || !phoneVerified}
                  className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-base shadow-lg shadow-primary-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : !emailVerified || !phoneVerified ? (
                    'Verify Email & Phone to Continue'
                  ) : (
                    'Create Your Account'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary-600 font-bold hover:underline underline-offset-4">Sign In</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
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
