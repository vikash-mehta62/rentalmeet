'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, TrendingUp, MapPin, Users, Star, Shield, Clock, ArrowRight, Sparkles, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Wait for hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    
    if (user.role === 'owner') return '/owner/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'customer') return '/customer/dashboard';
    return '/';
  };

  const features = [
    {
      icon: Building2,
      title: 'Wide Selection',
      description: 'Choose from meeting halls, conference rooms, banquet halls, and more',
      color: 'text-primary-500'
    },
    {
      icon: CheckCircle2,
      title: 'Verified Venues',
      description: 'All venues are verified by our team for quality and authenticity',
      color: 'text-success'
    },
    {
      icon: TrendingUp,
      title: 'Best Prices',
      description: 'Transparent pricing with no hidden charges. Book with confidence',
      color: 'text-primary-600'
    }
  ];

  const stats = [
    { number: '500+', label: 'Venues Listed', icon: Building2 },
    { number: '10K+', label: 'Happy Customers', icon: Users },
    { number: '4.8/5', label: 'Average Rating', icon: Star },
    { number: '24/7', label: 'Support', icon: Clock }
  ];

  const benefits = [
    { icon: Shield, text: 'Secure Payment' },
    { icon: CheckCircle2, text: 'Verified Venues' },
    { icon: Clock, text: '24-48 Hr Payout' },
    { icon: Star, text: 'Premium Quality' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-orange rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold font-heading text-dark-700">
                Rental<span className="text-primary-500">Meet</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-dark-700 hover:text-primary-500 font-medium transition-colors">
                Home
              </Link>
              <Link href="/venues" className="text-dark-700 hover:text-primary-500 font-medium transition-colors">
                Browse Venues
              </Link>
              <Link href="/about" className="text-dark-700 hover:text-primary-500 font-medium transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-dark-700 hover:text-primary-500 font-medium transition-colors">
                Contact
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {hydrated && token && user ? (
                <>
                  <span className="text-dark-700 font-medium">Hi, {user.name}</span>
                  <Link href={getDashboardLink()} className="text-dark-700 hover:text-primary-500 font-semibold transition-colors">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="btn-secondary">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-dark-700 hover:text-primary-500 font-semibold transition-colors">
                    Login
                  </Link>
                  <Link href="/register" className="btn-primary">
                    Register as Owner
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-dark-50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-dark-100 animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              <Link href="/" className="block py-2 text-dark-700 hover:text-primary-500 font-medium">
                Home
              </Link>
              <Link href="/venues" className="block py-2 text-dark-700 hover:text-primary-500 font-medium">
                Browse Venues
              </Link>
              <Link href="/about" className="block py-2 text-dark-700 hover:text-primary-500 font-medium">
                About
              </Link>
              <Link href="/contact" className="block py-2 text-dark-700 hover:text-primary-500 font-medium">
                Contact
              </Link>
              <div className="pt-4 space-y-2 border-t">
                {hydrated && token && user ? (
                  <>
                    <p className="text-sm text-gray-600 px-2">Hi, {user.name}</p>
                    <Link href={getDashboardLink()} className="block w-full text-center py-3 bg-primary-500 text-white rounded-xl font-semibold">
                      Dashboard
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-center py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block w-full text-center py-3 border-2 border-primary-500 text-primary-500 rounded-xl font-semibold">
                      Login
                    </Link>
                    <Link href="/register" className="block w-full text-center btn-primary">
                      Register as Owner
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-50 via-white to-primary-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-600 px-4 py-2 rounded-full mb-6 animate-pulse-slow">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Premium Venue Booking Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold font-heading text-dark-800 mb-6 leading-tight">
                Book Your Perfect
                <span className="gradient-text block">Meeting Space</span>
              </h1>
              
              <p className="text-xl text-dark-500 mb-8 leading-relaxed">
                Find and book premium venues for meetings, conferences, and events. 
                Connect with verified spaces across Bhopal.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/venues" className="btn-primary flex items-center justify-center group">
                  Browse Venues
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/register-venue" className="btn-secondary flex items-center justify-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  List Your Venue
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2 text-dark-600">
                    <benefit.icon className="w-5 h-5 text-primary-500" />
                    <span className="text-sm font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Image/Illustration */}
            <div className="relative animate-fade-in">
              <div className="relative z-10 bg-white rounded-3xl shadow-large p-8 animate-float">
                <div className="aspect-square bg-gradient-orange rounded-2xl flex items-center justify-center">
                  <Building2 className="w-32 h-32 text-white" />
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-600 font-medium">Available Venues</span>
                    <span className="text-2xl font-bold text-primary-500">500+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-600 font-medium">Happy Customers</span>
                    <span className="text-2xl font-bold text-primary-500">10K+</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-primary-200 rounded-full blur-3xl opacity-30 animate-pulse-slow"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-primary-300 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-dark-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-dark-800 mb-4">
              Why Choose <span className="gradient-text">RentalMeet</span>
            </h2>
            <p className="text-xl text-dark-500 max-w-2xl mx-auto">
              We make venue booking simple, secure, and hassle-free
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="card group hover:scale-105 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 ${feature.color} bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-dark-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-dark-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-orange relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-6">
            Ready to List Your Venue?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 500+ venue owners earning with RentalMeet. Zero registration fee!
          </p>
          <Link 
            href="/register-venue" 
            className="inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-dark-50 transition-all duration-300 shadow-large hover:shadow-glow group"
          >
            Register Your Venue Now
            <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-orange rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">RentalMeet</span>
              </div>
              <p className="text-dark-300">
                Book Your Premium Meeting Venues
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-dark-300">
                <li><Link href="/venues" className="hover:text-primary-500 transition-colors">Browse Venues</Link></li>
                <li><Link href="/register-venue" className="hover:text-primary-500 transition-colors">List Venue</Link></li>
                <li><Link href="/about" className="hover:text-primary-500 transition-colors">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-dark-300">
                <li><Link href="/contact" className="hover:text-primary-500 transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-primary-500 transition-colors">FAQ</Link></li>
                <li><Link href="/terms" className="hover:text-primary-500 transition-colors">Terms</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-dark-300">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-primary-500" />
                  <span>G-137, Gautam Nagar, Near Chetak Bridge, Bhopal</span>
                </li>
                <li>📧 info@rentalmeet.com</li>
                <li>📞 0755-4545348</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-dark-700 pt-8 text-center text-dark-300">
            <p>&copy; 2026 RentalMeet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
