'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, MapPin, Briefcase, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const VENDOR_CATEGORIES = [
  'Catering & Food', 'Photography & Video', 'Decoration & Flowers',
  'Entertainment & Music', 'Event Management', 'AV & Tech Equipment',
  'Transportation', 'Security Services', 'Cleaning Services', 'Other'
];

export default function Register() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: 'customer', referralCode: '', city: '', state: '',
    // vendor-specific
    businessName: '', businessCategory: '', businessCity: '', businessState: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setHydrated(true);
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    // Customer registration has its own dedicated page
    if (role === 'customer') {
      const redirect = params.get('redirect');
      router.replace('/register-customer' + (redirect ? `?redirect=${redirect}` : ''));
      return;
    }
    if (role) setFormData(prev => ({ ...prev, role }));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (token && user) {
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect');
      if (redirectUrl) { router.push(redirectUrl); return; }
      const routes = { owner: '/owner/dashboard', admin: '/admin/dashboard', customer: '/customer/dashboard', vendor: '/vendor/dashboard' };
      router.push(routes[user.role] || '/');
    }
  }, [hydrated, token, user, router]);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.phone || !formData.password) { setError('All fields are required'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (formData.phone.length !== 10) { setError('Phone number must be 10 digits'); return; }
    if (formData.role === 'vendor' && !formData.businessName) { setError('Business name is required'); return; }
    if (formData.role === 'vendor' && !formData.businessCategory) { setError('Please select a business category'); return; }

    setLoading(true);
    try {
      const body = {
        name: formData.name, email: formData.email, phone: formData.phone,
        password: formData.password, role: formData.role,
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        setAuth(data.user, data.token);
        const routes = { owner: '/owner/dashboard', customer: '/customer/dashboard', vendor: '/vendor/dashboard' };
        router.push(routes[data.user.role] || '/');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  if (!hydrated) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (token && user) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  const inp = 'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="RentalMeet" className="h-12 w-auto object-contain" onError={e => { e.target.style.display='none'; }} />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-dark-800 mb-1">Create Account</h1>
            <p className="text-sm text-gray-500">
              Register as{' '}
              <span className="font-semibold text-primary-500">
                {formData.role === 'customer' ? 'Client (User)' : formData.role === 'owner' ? 'Space Owner' : 'Service Vendor'}
              </span>
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">I want to register as: *</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'customer', icon: User, label: 'Client' },
                { role: 'owner', icon: Building2, label: 'Owner' },
                { role: 'vendor', icon: Settings, label: 'Vendor' },
              ].map(({ role, icon: Icon, label }) => (
                <button key={role} type="button" onClick={() => setFormData(p => ({ ...p, role }))}
                  className={`p-3 border-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
                    formData.role === role ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder={formData.role === 'vendor' ? 'Contact Person Name *' : 'Full Name *'}
                className={inp} required />
            </div>

            {/* Vendor-specific fields */}
            {formData.role === 'vendor' && (
              <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Business Details
                </p>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" name="businessName" value={formData.businessName} onChange={handleChange}
                    placeholder="Business / Company Name *" className={inp} required />
                </div>
                <div className="relative">
                  <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select name="businessCategory" value={formData.businessCategory} onChange={handleChange}
                    className={inp + ' appearance-none'} required>
                    <option value="">Select Business Category *</option>
                    {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" name="businessCity" value={formData.businessCity} onChange={handleChange}
                      placeholder="City" className={inp} />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" name="businessState" value={formData.businessState} onChange={handleChange}
                      placeholder="State" className={inp} />
                  </div>
                </div>
              </div>
            )}

            {/* Customer city/state */}
            {formData.role === 'customer' && (
              <div className="grid grid-cols-2 gap-2">
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

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="Email Address *" className={inp} required />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="10-digit Phone *" maxLength="10" className={inp} required />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                placeholder="Password (min 6 chars) *" className={inp + ' pr-10'} required />
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                placeholder="Confirm Password *" className={inp} required />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" name="referralCode" value={formData.referralCode} onChange={handleChange}
                placeholder="Referral Code (optional)" className={inp + ' uppercase'} maxLength="10" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Creating Account...' : 'Create Account â†’'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-500 font-semibold hover:text-primary-600">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
