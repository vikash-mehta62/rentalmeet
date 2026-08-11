'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';
import Image from 'next/image';
import {
  LayoutDashboard, Building2, Users, BookOpen, Settings,
  LogOut, Menu, X, IndianRupee, Shield, BarChart3, Bell, 
  Grid3x3, MessageSquare, Image as ImageIcon, ChevronLeft, ChevronRight, Tag, FileText, HelpCircle, Briefcase, Package, Wallet, Home, Award
} from 'lucide-react';

export default function AdminLayout({ children, title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && (!token || (user?.role !== 'admin' && user?.role !== 'subadmin'))) {
      router.push('/login');
    }
  }, [hydrated, token, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, permission: 'dashboard', section: 'Overview' },
    { name: 'Hero Slides', href: '/admin/hero-slides', icon: ImageIcon, permission: 'heroSlides', section: 'System' },
    { name: 'Auth Custom Images', href: '/admin/auth-images', icon: ImageIcon, permission: 'authImages', section: 'System' },

    { name: 'Venues', href: '/admin/venues', icon: Building2, permission: 'venues', section: 'Venues' },
    { name: 'Venue Types', href: '/admin/venue-types', icon: Grid3x3, permission: 'venueTypes', section: 'Venues' },
    { name: 'Bookings', href: '/admin/bookings', icon: BookOpen, permission: 'bookings', section: 'Venues' },
    { name: 'Payments', href: '/admin/payments', icon: IndianRupee, permission: 'payments', section: 'Venues' },
    { name: 'Coupons', href: '/admin/coupons', icon: Tag, permission: 'coupons', section: 'Venues' },
    { name: 'Quotations', href: '/admin/quotation-downloads', icon: FileText, permission: 'quotations', section: 'Venues' },

    { name: 'Vendor Services', href: '/admin/vendor-services', icon: Package, permission: 'vendorServices', section: 'Vendors' },
    { name: 'Vendor Payments', href: '/admin/vendor-payments', icon: IndianRupee, permission: 'vendorPayments', section: 'Vendors' },
    { name: 'Vendor Coupons', href: '/admin/vendor-coupons', icon: Tag, permission: 'vendorCoupons', section: 'Vendors' },
    { name: 'Service Bookings', href: '/admin/service-bookings', icon: Package, permission: 'serviceBookings', section: 'Vendors' },
    { name: 'Service Quotations', href: '/admin/service-quotation-downloads', icon: Package, permission: 'serviceQuotations', section: 'Vendors' },

    { name: 'Users', href: '/admin/users', icon: Users, permission: 'users', section: 'System' },
    { name: 'Ambassadors', href: '/admin/ambassadors', icon: Award, permission: 'ambassadors', section: 'System' },
    { name: 'Employees', href: '/admin/employees', icon: Users, permission: 'employees', section: 'System' },
    { name: 'SubAdmins', href: '/admin/subadmins', icon: Shield, permission: 'subadmins', section: 'System' },
    { name: 'FAQ Management', href: '/admin/faqs', icon: HelpCircle, permission: 'faqs', section: 'System' },
    { name: 'Blog', href: '/admin/blogs', icon: FileText, permission: 'faqs', section: 'System' },
    { name: 'Chatbot Settings', href: '/admin/chatbot', icon: MessageSquare, permission: 'chatbot', section: 'System' },
    { name: 'Finance', href: '/admin/expenses', icon: Wallet, permission: 'expenses', section: 'System' },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3, permission: 'reports', section: 'System' },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare, permission: 'reviews', section: 'System' },
    { name: 'GST/Platform', href: '/admin/platform-settings', icon: Settings, permission: 'platformSettings', section: 'System' },
    { name: 'Push Notifications', href: '/admin/push-notifications', icon: Bell, permission: 'notifications', section: 'System' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings', section: 'System' },
  ];

  const filteredNavigation = user?.role === 'admin' 
    ? navigation 
    : navigation.filter(item => user?.permissions?.[item.permission]);

  const sectionOrder = ['Overview', 'Venues', 'Vendors', 'System'];
  const groupedNavigation = sectionOrder
    .map(section => ({
      section,
      items: filteredNavigation.filter(item => item.section === section)
    }))
    .filter(group => group.items.length > 0);

  if (!hydrated || !token || (user?.role !== 'admin' && user?.role !== 'subadmin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-56'}`}>

        {/* Logo */}
        <div className={`flex items-center border-b border-gray-100 px-4 py-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div>
              <img src="/logo.png" alt="RentalMeet" className="h-8 w-auto object-contain"
                onError={e => e.target.style.display='none'} />
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Admin Portal</p>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button onClick={() => setSidebarCollapsed(p => !p)} className="hidden lg:flex p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
          {groupedNavigation.map((group, groupIndex) => (
            <div key={group.section} className={`${groupIndex > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}`}>
              {!sidebarCollapsed && group.section !== 'Overview' && (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {group.section}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!sidebarCollapsed && item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Back to Home */}
        <div className="p-2 border-t border-gray-100">
          <Link href="/" onClick={() => setSidebarOpen(false)}
            title={sidebarCollapsed ? 'Back to Home' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-purple-600 hover:bg-purple-50 hover:text-purple-700 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}>
            <Home className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && 'Back to Home'}
          </Link>
        </div>

      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            {title && <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>}
            {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell token={token} />
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="text-sm font-bold text-gray-800 max-w-[180px] truncate">{user?.name || 'Admin'}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user?.role === 'admin' ? 'Super Admin' : 'Sub Admin'}</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100">
              <img src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=random`} alt="user" />
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 w-full">
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
