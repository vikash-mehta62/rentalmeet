'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Calendar, User, LogOut, Menu, X, 
  Home, Plus, ChevronLeft, ChevronRight, Bell, Tag, FileText
} from 'lucide-react';

export default function OwnerLayout({ children, title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();
  
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || user?.role !== 'owner') {
      router.push('/login');
    }
  }, [token, user, hydrated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { href: '/owner/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/owner/venues', icon: Building2, label: 'My Venues' },
    { href: '/owner/bookings', icon: Calendar, label: 'Bookings' },
    { href: '/owner/quotation-downloads', icon: FileText, label: 'Quotations' },
    { href: '/owner/coupons', icon: Tag, label: 'Coupons' },
    { href: '/register-venue', icon: Plus, label: 'Add New Venue' },
    { href: '/owner/profile', icon: User, label: 'Profile' },
  ];

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans overflow-x-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`fixed top-[30px] bottom-0 left-0 z-50 bg-[#F1F5F9] text-slate-700 transition-all duration-300 ease-in-out border-r border-slate-200
          ${isCollapsed ? 'w-20' : 'w-72'} 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full relative overflow-hidden">
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-primary-600 rounded-full items-center justify-center border-2 border-[#F1F5F9] hover:bg-primary-500 transition-colors z-50 shadow-lg shadow-primary-900/40"
          >
            {isCollapsed ? <ChevronRight size={14} className="text-white" /> : <ChevronLeft size={14} className="text-white" />}
          </button>

        {/* --- SIDEBAR LOGO SECTION --- */}
<div className={`pt-10 pb-6 flex items-center justify-center transition-all duration-300`}>
  <Link href="/owner/dashboard" className="block group">
    <div className={`
      relative bg-white p-2 rounded-xl shadow-lg shadow-black/10 overflow-hidden transition-all duration-500 group-hover:shadow-primary-500/20
      ${isCollapsed 
        ? 'w-12 h-12 rounded-lg'
        : 'w-48 h-20'
      }
    `}>
      <img 
        src="/logo.png" 
        alt="Logo" 
        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" 
      />
    </div>
  </Link>
</div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
              <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                    active
                      ? 'bg-primary-500 text-white border border-primary-400 shadow-md'
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500 group-hover:text-primary-600'}`} />
                  {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>}
                  
                  {isCollapsed && (
                    <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-bold uppercase tracking-wider z-50 whitespace-nowrap border border-slate-700">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="mt-auto p-4 border-t border-slate-200 bg-slate-100">
            {!isCollapsed && (
              <div className="mb-4 p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-3">
                  <img 
                    src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=0EA5E9&color=fff&bold=true`} 
                    className="w-10 h-10 rounded-xl border-2 border-slate-200 shadow-lg object-cover"
                    alt="avatar"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black text-slate-800 truncate leading-tight">{user?.name}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Owner Partner</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className={`group flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-300
                ${isCollapsed ? 'justify-center hover:bg-rose-500/10' : 'bg-rose-500/5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20'}
              `}
            >
              <LogOut className={`w-5 h-5 transition-transform group-hover:-translate-x-1 ${isCollapsed ? 'text-slate-500 group-hover:text-rose-500' : 'text-rose-500'}`} />
              {!isCollapsed && <span className="text-sm font-black text-rose-500 uppercase tracking-widest">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-lg sticky top-[30px] z-40 border-b border-slate-200">
          <div className="px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="flex flex-col">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">{title}</h1>
                  {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{subtitle}</p>}
                </div>
              </div>

            
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)] transition-all">
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
