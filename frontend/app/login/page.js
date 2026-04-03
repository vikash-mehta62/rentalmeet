'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function Login() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Wait for hydration and get role from URL
  useEffect(() => {
    setHydrated(true);
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    if (role) {
      setSelectedRole(role);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!hydrated) return;
    
    if (token && user) {
      console.log('User already logged in, redirecting...');
      
      // Check for redirect parameter
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect');
      
      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }
      
      // Default redirect based on role
      if (user.role === 'owner') {
        router.push('/owner/dashboard');
      } else if (user.role === 'admin' || user.role === 'subadmin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'customer') {
        router.push('/customer/dashboard');
      } else if (user.role === 'employee') {
        router.push('/employee/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [hydrated, token, user, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      console.log('Attempting login...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (data.success) {
        console.log('Login successful, saving auth...');
        setAuth(data.user, data.token);
        
        console.log('Auth saved, redirecting based on role:', data.user.role);
        
        // Check for redirect parameter
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect');
        
        if (redirectUrl) {
          router.push(redirectUrl);
          return;
        }
        
        // Default redirect based on role
        if (data.user.role === 'owner') {
          router.push('/owner/dashboard');
        } else if (data.user.role === 'admin' || data.user.role === 'subadmin') {
          router.push('/admin/dashboard');
        } else if (data.user.role === 'customer') {
          router.push('/customer/dashboard');
        } else if (data.user.role === 'employee') {
          router.push('/employee/dashboard');
        } else {
          router.push('/');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login form if already logged in
  if (token && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-slide-up">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-orange rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">
              Login as {' '}
              <span className="font-semibold text-primary-500">
                {selectedRole === 'customer' ? 'Client (User)' : 
                 selectedRole === 'owner' ? 'Business Owner' : 
                 'Service Vendor'}
              </span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-500 font-semibold hover:text-primary-600">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

