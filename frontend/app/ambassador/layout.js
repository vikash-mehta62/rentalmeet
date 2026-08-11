'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useThemeStore } from '@/lib/store';
import NotificationBell from '@/components/NotificationBell';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  IndianRupee,
  Zap,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
  Award,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Home,
  ExternalLink,
  Calendar
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/ambassador/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ambassador/venues', label: 'My Listed Venues', icon: Building2 },
  { href: '/ambassador/bookings', label: 'Venue Bookings (25%)', icon: Calendar },
  { href: '/ambassador/add-venue', label: 'List New Venue', icon: PlusCircle, highlight: true },
  { href: '/ambassador/earnings', label: 'Earnings & Wallet', icon: IndianRupee },
  { href: '/ambassador/challenges', label: 'Challenges & Streaks', icon: Zap },
  { href: '/ambassador/leaderboard', label: 'Leaderboard & Awards', icon: Trophy },
  { href: '/ambassador/profile', label: 'Ambassador Profile', icon: User }
];

export default function AmbassadorLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push('/login?role=ambassador');
      return;
    }
    if (user?.role !== 'ambassador' && user?.role !== 'admin') {
      router.push('/');
    }
  }, [token, user, hydrated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Get active page title
  const activeNavItem = NAV_ITEMS.find(
    (item) => pathname === item.href || (item.href !== '/ambassador/dashboard' && pathname.startsWith(item.href))
  );
  const pageTitle = activeNavItem ? activeNavItem.label : 'Ambassador Portal';

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      
      {/* Sidebar Overlay on Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'lg:w-16' : 'lg:w-60'}`}
      >
        {/* Logo Section */}
        <div className={`flex items-center border-b border-slate-100 dark:border-slate-800 px-4 py-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <Link href="/" className="flex flex-col">
              <img
                src="/logo.png"
                alt="RentalMeet"
                className="h-7 w-auto object-contain"
                onError={(e) => (e.target.style.display = 'none')}
              />
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                <Award className="w-3 h-3" /> Ambassador Portal
              </span>
            </Link>
          ) : (
            <Link href="/" className="p-1">
              <Award className="w-6 h-6 text-amber-600" />
            </Link>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed((p) => !p)}
              className="hidden lg:flex p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Card (when expanded) */}
        {!isCollapsed && (
          <div className="p-3 mx-3 my-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-primary-600 flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold truncate">
                  Venue Ambassador
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/ambassador/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary-500 text-white shadow-sm'
                    : item.highlight
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? 'Back to Website' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Website Home</span>}
          </Link>

          {!isCollapsed && (
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-slate-500">
              <span>Theme</span>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                {pageTitle}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                RentalMeet™ Venue Acquisition &amp; Ambassador Portal
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/ambassador/add-venue"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" /> List Venue
            </Link>

            <NotificationBell />

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Ambassador Partner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
