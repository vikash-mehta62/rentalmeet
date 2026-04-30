'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import Navbar from '@/components/Navbar';

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, setAuth } = useAuthStore();

  const [hydrated, setHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const role = (searchParams.get('role') || 'customer').toLowerCase();
    const normalized = role === 'owner' || role === 'vendor' || role === 'customer' ? role : 'customer';
    setSelectedRole(normalized);
  }, [hydrated, searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    if (!(token && user)) return;

    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      router.push(redirectUrl);
      return;
    }

    if (user.role === 'owner') router.push('/owner/dashboard');
    else if (user.role === 'admin' || user.role === 'subadmin') router.push('/admin/dashboard');
    else if (user.role === 'employee') router.push('/employee/dashboard');
    else if (user.role === 'vendor') router.push('/vendor/dashboard');
    else router.push('/');
  }, [hydrated, token, user, router, searchParams]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Login failed');
        return;
      }

      setAuth(data.user, data.token);

      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }

      if (data.user.role === 'owner') router.push('/owner/dashboard');
      else if (data.user.role === 'admin' || data.user.role === 'subadmin') router.push('/admin/dashboard');
      else if (data.user.role === 'employee') router.push('/employee/dashboard');
      else if (data.user.role === 'vendor') router.push('/vendor/dashboard');
      else router.push('/');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = useMemo(() => {
    const meta = {
      customer: {
        badge: 'Client Login',
        title: 'Client Account',
        subtitle: 'Access bookings, confirmations, and venue management in one place.',
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1400&q=80'
      },
      owner: {
        badge: 'Venue Login',
        title: 'Venue Owner',
        subtitle: 'Manage your listed venues, bookings, coupons, and business performance.',
        image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1400&q=80'
      },
      vendor: {
        badge: 'Vendor Login',
        title: 'Vendor Partner',
        subtitle: 'Handle service enquiries, quotations, and customer bookings efficiently.',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&q=80'
      }
    };
    return meta[selectedRole] || meta.customer;
  }, [selectedRole]);

  if (!hydrated || (token && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = 'w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 text-sm transition-all outline-none';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="w-full h-full pt-[80px]">
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
          <div className="relative w-full md:w-1/2 bg-dark-900 flex items-center justify-center p-8 lg:p-16 overflow-hidden">
            <img
              src={roleMeta.image}
              alt={roleMeta.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 hover:scale-100 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/40 to-dark-900/90" />

            <div className="relative z-10 max-w-lg">
              <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
              <div className="space-y-4">
                <span className="px-3 py-1 bg-primary-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {roleMeta.badge}
                </span>
                <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                  Welcome Back <br />
                  <span className="text-primary-400">{roleMeta.title}</span>
                </h2>
                <p className="text-lg text-gray-200 font-light max-w-md">{roleMeta.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-6 sm:p-8 lg:p-14 overflow-y-auto">
            <div className="w-full max-w-lg">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
                <p className="text-gray-500">
                  Login as{' '}
                  <span className="text-primary-600 font-semibold uppercase text-sm tracking-wider">
                    {selectedRole === 'customer' ? 'Client (User)' : selectedRole === 'owner' ? 'Venue Owner' : 'Vendor'}
                  </span>
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
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className={inputCls}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={inputCls}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Don&apos;t have an account?{' '}
                <Link
                  href={selectedRole === 'customer' ? '/register-customer' : `/register?role=${selectedRole}`}
                  className="text-primary-500 font-semibold hover:text-primary-600"
                >
                  Register here
                </Link>
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                  <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Secure</p>
                  <p className="text-[11px] text-gray-500 mt-1">Encrypted login flow</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                  <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Fast</p>
                  <p className="text-[11px] text-gray-500 mt-1">Instant dashboard access</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                  <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Role Based</p>
                  <p className="text-[11px] text-gray-500 mt-1">Customer, Venue, Vendor</p>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
