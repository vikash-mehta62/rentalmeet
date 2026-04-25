'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, Building2, Users, BookOpen, Settings,
  LogOut, Menu, X, IndianRupee, Shield, BarChart3, 
  Grid3x3, MessageSquare, Image as ImageIcon, ChevronLeft, ChevronRight, Tag, FileText, HelpCircle, Briefcase, Package
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

    { name: 'Venues', href: '/admin/venues', icon: Building2, permission: 'venues', section: 'Venues' },
    { name: 'Venue Types', href: '/admin/venue-types', icon: Grid3x3, permission: 'venueTypes', section: 'Venues' },
    { name: 'Bookings', href: '/admin/bookings', icon: BookOpen, permission: 'bookings', section: 'Venues' },
    { name: 'Payments', href: '/admin/payments', icon: IndianRupee, permission: 'payments', section: 'Venues' },
    { name: 'Coupons', href: '/admin/coupons', icon: Tag, permission: 'bookings', section: 'Venues' },
    { name: 'Quotations', href: '/admin/quotation-downloads', icon: FileText, permission: 'bookings', section: 'Venues' },

    // { name: 'Vendors', href: '/admin/vendors', icon: Briefcase, permission: 'users', section: 'Vendors' },
    { name: 'Vendor Services', href: '/admin/vendor-services', icon: Package, permission: 'users', section: 'Vendors' },
    { name: 'Service Bookings', href: '/admin/service-bookings', icon: Package, permission: 'users', section: 'Vendors' },
    { name: 'Service Quotations', href: '/admin/service-quotation-downloads', icon: Package, permission: 'users', section: 'Vendors' },

    { name: 'Users', href: '/admin/users', icon: Users, permission: 'users', section: 'System' },
    { name: 'Employees', href: '/admin/employees', icon: Users, permission: 'employees', section: 'System' },
    { name: 'SubAdmins', href: '/admin/subadmins', icon: Shield, permission: 'subadmins', section: 'System' },
    { name: 'FAQ Management', href: '/admin/faqs', icon: HelpCircle, permission: 'settings', section: 'System' },
    { name: 'Chatbot Settings', href: '/admin/chatbot', icon: MessageSquare, permission: 'settings', section: 'System' },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3, permission: 'reports', section: 'System' },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare, permission: 'reviews', section: 'System' },
    { name: 'GST/Platform', href: '/admin/platform-settings', icon: Settings, permission: 'platformSettings', section: 'System' },
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
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-[30px] left-0 z-50 bottom-0 bg-[#F1F5F9] text-slate-700 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 border-r border-slate-200 flex flex-col`}
      >
        {/* Top: Logo */}
        <div className="h-20 flex items-center justify-center px-4 border-b border-slate-200 relative">
          {/* Logo */}
          {!sidebarCollapsed ? (
            <Link href="/admin/dashboard">
              <img src="/logo.png" alt="RentalMeet" className="h-12 w-auto object-contain" />
            </Link>
          ) : (
            <Link href="/admin/dashboard">
              <img src="/logo.png" alt="RentalMeet" className="h-9 w-9 object-contain" />
            </Link>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Collapse Toggle — floating on right edge */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-[52px] z-50 w-6 h-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-md hover:bg-amber-600 transition-colors border-2 border-[#F1F5F9]"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Middle: Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 custom-scrollbar">
          {groupedNavigation.map((group, groupIndex) => (
            <div key={group.section} className={`${groupIndex > 0 ? 'mt-4 pt-4 border-t border-slate-200' : ''}`}>
              {!sidebarCollapsed && group.section !== 'Overview' && (
                <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {group.section}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.name : ''}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-amber-500 text-white font-semibold shadow-lg shadow-amber-500/30'
                          : 'hover:bg-slate-200 hover:text-slate-900 text-slate-600'
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-amber-600'}`} />
                      {!sidebarCollapsed && <span className="text-[14px]">{item.name}</span>}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                          {item.name}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: Profile & Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-100">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3 p-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center ring-2 ring-amber-500/30 shadow-lg">
                  <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[11px] text-amber-600 uppercase font-bold tracking-wider">
                    {user?.role === 'admin' ? 'Super Admin' : 'Sub Admin'}
                  </p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-200 text-sm font-bold">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center ring-2 ring-amber-500/30 shadow-lg">
                <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <button onClick={handleLogout} title="Logout" className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-200">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="sticky top-[0px] z-30 bg-white/70 backdrop-blur-lg border-b border-slate-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 bg-slate-100 text-slate-600 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
                {subtitle && <p className="text-xs text-slate-500 font-medium italic">{subtitle}</p>}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
