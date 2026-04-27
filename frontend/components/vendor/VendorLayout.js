'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  LayoutDashboard, Briefcase, LogOut, Menu, X, ChevronLeft, ChevronRight, Bell, BookOpen, Tag, FileText
} from 'lucide-react';

const NAV = [
  { href: '/vendor/dashboard',           label: 'Dashboard',           icon: LayoutDashboard },
  { href: '/vendor/services',            label: 'My Services',         icon: Briefcase },
  { href: '/vendor/bookings',            label: 'Bookings',            icon: BookOpen },
  { href: '/vendor/quotation-downloads', label: 'Quotation Downloads', icon: FileText },
  { href: '/vendor/coupons',             label: 'Service Coupons',     icon: Tag },
];

export default function VendorLayout({ children, title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (hydrated && (!token || user?.role !== 'vendor')) router.push('/login');
  }, [hydrated, token, user]);

  if (!hydrated || !token || user?.role !== 'vendor') return null;

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        ${collapsed ? 'lg:w-16' : 'lg:w-56'}`}>

        {/* Logo */}
        <div className={`flex items-center border-b border-gray-100 px-4 py-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div>
              <img src="/logo.png" alt="RentalMeet" className="h-8 w-auto object-contain"
                onError={e => e.target.style.display='none'} />
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Vendor Portal</p>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button onClick={() => setCollapsed(p => !p)} className="hidden lg:flex p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${collapsed ? 'justify-center' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            {title && <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>}
            {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex p-2 text-gray-400 hover:bg-gray-100 rounded-xl relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="text-sm font-bold text-gray-800 max-w-[180px] truncate">{user?.name || 'Vendor'}</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{user?.companyName || user?.vendorCategory || 'Vendor'}</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100">
              <img src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || 'Vendor'}&background=random`} alt="user" />
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

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
