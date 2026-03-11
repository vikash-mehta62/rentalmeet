'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard, ChevronDown, User, Settings, Moon, Sun } from 'lucide-react';
import { useAuthStore, useThemeStore } from '@/lib/store';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const [hydrated, setHydrated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [registerDropdownOpen, setRegisterDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const loginDropdownRef = useRef(null);
  const registerDropdownRef = useRef(null);

  const isHomePage = pathname === '/';
  const isVenueDetailsPage = pathname.startsWith('/venues/') && pathname !== '/venues';

  // Handle Hydration & Scroll
  useEffect(() => {
    setHydrated(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(e.target)) {
        setLoginDropdownOpen(false);
      }
      if (registerDropdownRef.current && !registerDropdownRef.current.contains(e.target)) {
        setRegisterDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    const roles = {
      owner: '/owner/dashboard',
      admin: '/admin/dashboard',
      customer: '/customer/dashboard',
    };
    return roles[user.role] || '/';
  };

  // Dynamic Styles Logic - dark mode supported
  const navBg = 'bg-white dark:bg-slate-900 shadow-md py-4';
  const textColor = 'text-slate-700 dark:text-slate-200';
  const logoColor = 'text-slate-900 dark:text-slate-100';
  const linkBase = "text-[12px] font-bold uppercase tracking-[0.15em] transition-all duration-300";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-500 ease-in-out ${navBg}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* 1. Logo Section */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group relative z-50"
            onClick={() => {
              // Clear booking data when going to home
              localStorage.removeItem('bookingData');
              localStorage.removeItem('pendingBooking');
            }}
          >
            <img 
              src="/logo.png" 
              alt="RentalMeet Logo" 
              className="h-12 w-auto object-contain"
            />
           
          </Link>

          {/* 2. Desktop Navigation (Center) */}
          <div className="hidden md:flex items-center gap-10">
            {[
              { name: 'Home', href: '/' },
              { name: 'Venues', href: '/venues' },
              { name: 'Other Serives', href: '/other-services' },
            ].map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => {
                  if (link.href === '/') {
                    // Clear booking data when going to home
                    localStorage.removeItem('bookingData');
                    localStorage.removeItem('pendingBooking');
                  }
                }}
                className={`${linkBase} relative group ${
                  pathname === link.href 
                  ? 'text-primary-500' 
                  : `${textColor} hover:text-primary-500`
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary-500 transition-all duration-300 ${pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            ))}
          </div>

          {/* 3. Auth Actions (Right) */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle Theme"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {hydrated && token ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-primary-400 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>
                    Hi, {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''} ${textColor}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-300">
                    <Link href={getDashboardLink()} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 transition-colors">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <div className="h-px bg-slate-100 my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Login Dropdown */}
                <div className="relative" ref={loginDropdownRef}>
                  <button
                    onClick={() => {
                      setLoginDropdownOpen(!loginDropdownOpen);
                      setRegisterDropdownOpen(false);
                    }}
                    className={`px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] ${textColor} hover:text-primary-500 hover:border-primary-500 transition-all flex items-center gap-2`}
                  >
                    Login
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${loginDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {loginDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-300">
                      <Link
                        href="/login?role=customer"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 text-base font-bold text-slate-900 dark:text-slate-100 bg-primary-50 dark:bg-slate-700/50 hover:bg-primary-100 dark:hover:bg-slate-700 border-l-4 border-primary-500 transition-colors"
                      >
                        <User className="w-5 h-5 text-primary-600" />
                        User
                      </Link>
                      <Link
                        href="/login?role=owner"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Venue Login
                      </Link>
                      <Link
                        href="/login?role=vendor"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Business Login
                      </Link>
                    </div>
                  )}
                </div>

                {/* Register Dropdown */}
                <div className="relative" ref={registerDropdownRef}>
                  <button
                    onClick={() => {
                      setRegisterDropdownOpen(!registerDropdownOpen);
                      setLoginDropdownOpen(false);
                    }}
                    className="px-6 py-2.5 bg-primary-500 text-white border border-slate-800 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-200 transition-all active:scale-95 flex items-center gap-2"
                  >
                    Register
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${registerDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {registerDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-300">
                      <Link
                        href="/register?role=customer"
                        onClick={() => setRegisterDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 text-base font-bold text-slate-900 dark:text-slate-100 bg-primary-50 dark:bg-slate-700/50 hover:bg-primary-100 dark:hover:bg-slate-700 border-l-4 border-primary-500 transition-colors"
                      >
                        <User className="w-5 h-5 text-primary-600" />
                        User
                      </Link>
                      <Link
                        href="/register?role=owner"
                        onClick={() => setRegisterDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        List Your Venues
                      </Link>
                      <Link
                        href="/register?role=vendor"
                        onClick={() => setRegisterDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        List Your Business
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 5. Mobile Sidebar (Full Screen Overlay) */}
      <div className={`fixed inset-0 z-[110] transition-visibility duration-300 ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobileMenuOpen(false)} />
        
        {/* Drawer */}
        <div className={`absolute right-0 inset-y-0 w-[80%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-300"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {['Home', 'Venues',"Other Services"].map((item) => (
                <Link 
                  key={item} 
                  href={item === 'Home' ? '/' : `/${item.toLowerCase()}`} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-4 rounded-2xl text-base font-bold transition-all ${pathname === (item === 'Home' ? '/' : `/${item.toLowerCase()}`) ? 'bg-primary-50 text-primary-600 dark:bg-slate-700/50 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="p-6 border-t border-slate-50 dark:border-slate-800">
              {hydrated && token ? (
                <div className="space-y-3">
                  <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold uppercase text-xs tracking-widest">
                    <LayoutDashboard className="w-4 h-4" /> My Dashboard
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full py-4 border border-red-100 text-red-500 rounded-2xl font-bold uppercase text-xs tracking-widest">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary-100">
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}


