'use client';

import { useState, useEffect } from 'react';
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

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, setAuth } = useAuthStore();

  const [hydrated, setHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: 'owner', referralCode: '', city: '', state: '',
    businessName: '', businessCategory: '', businessCity: '', businessState: ''
  });
  const [referrerName, setReferrerName] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [error, setError] = useState('');

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
    if (formData.role === 'vendor' && !formData.businessName) { setError('Business name is required'); return; }
    if (formData.role === 'vendor' && !formData.businessCategory) { setError('Please select a business category'); return; }
    if (formData.referralCode && referralError) { setError('Please enter a valid referral code'); return; }

    setLoading(true);
    try {
      const body = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        referralCode: formData.referralCode || undefined,
        city: formData.role === 'vendor' ? formData.businessCity : (formData.city || undefined),
        state: formData.role === 'vendor' ? formData.businessState : (formData.state || undefined),
        ...(formData.role === 'vendor' && {
          companyName: formData.businessName,
          vendorCategory: formData.businessCategory,
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
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&q=80'
      }
    : {
        title: 'Venue Owner',
        subtitle: 'List your spaces and start receiving bookings quickly.',
        image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1400&q=80'
      };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="w-full h-full pt-[80px]">
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
          
          {/* Left Side: Visual & Content (Full Width on Mobile, 50% on Desktop) */}
          <div className="relative w-full md:w-1/2 bg-dark-900 flex items-center justify-center p-8 lg:p-16 overflow-hidden">
            <img 
              src={targetMeta.image} 
              alt={targetMeta.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 hover:scale-100 transition-transform duration-1000" 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/40 to-dark-900/90" />
            
            <div className="relative z-10 max-w-lg">
              <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
              <div className="space-y-4">
                <span className="px-3 py-1 bg-primary-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Registration
                </span>
                <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                  Start Your <br />
                  <span className="text-primary-400">{targetMeta.title}</span> Journey
                </h2>
                <p className="text-lg text-gray-200 font-light max-w-md">
                  {targetMeta.subtitle} Join hundreds of professionals already earning on RentalMeet.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-start p-8 lg:p-20 overflow-y-auto">
            <div className="w-full max-w-md">
              <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                <p className="text-gray-500">
                  Registering as <span className="text-primary-600 font-semibold uppercase text-sm tracking-wider">{isVendor ? 'Vendor' : 'Owner'}</span>
                </p>
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

                {isVendor && (
                  <div className="space-y-4 p-5 bg-primary-50/50 border border-primary-100 rounded-2xl">
                    <p className="text-xs font-bold text-primary-700 uppercase tracking-wide flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4" /> Business Information
                    </p>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                      <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Business / Company Name *" className={inp} required />
                    </div>
                    <div className="relative">
                      <Settings className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                      <select name="businessCategory" value={formData.businessCategory} onChange={handleChange} className={inp + ' appearance-none cursor-pointer'} required>
                        <option value="">Select Category *</option>
                        {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" name="businessCity" value={formData.businessCity} onChange={handleChange} placeholder="City" className={inp} />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" name="businessState" value={formData.businessState} onChange={handleChange} placeholder="State" className={inp} />
                      </div>
                    </div>
                  </div>
                )}

                {!isVendor && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className={inp} />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" className={inp} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address *" className={inp} required />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone *" maxLength="10" className={inp} required />
                  </div>
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
                  disabled={loading} 
                  className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-base shadow-lg shadow-primary-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : 'Create Your Account'}
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
