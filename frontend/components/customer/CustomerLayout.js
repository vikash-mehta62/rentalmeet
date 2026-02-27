'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Building2, Calendar, Home, Search, Menu, X, 
  LogOut, ChevronLeft, ChevronRight, Bell, Settings, User
} from 'lucide-react';

export default function CustomerLayout({ children, activePage = 'dashboard' }) {
  const router = useRouter();
  const pathname = usePathname(); // Current path check karne ke liye
  const { user, logout } = useAuthStore();
  
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Links wahi hain jo aapne di thi
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/customer/dashboard' },
    { id: 'bookings', label: 'My Bookings', icon: Calendar, href: '/customer/bookings' },
    { id: 'venues', label: 'Browse Venues', icon: Search, href: '/venues' },
  ];

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      
      {/* --- SIDEBAR (OWNER PANEL DESIGN) --- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-[#0f172a] text-white transition-all duration-300 ease-in-out border-r border-slate-800
          ${isCollapsed ? 'w-20' : 'w-72'} 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full relative">
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-primary-600 rounded-full items-center justify-center border-2 border-[#0f172a] hover:bg-primary-500 transition-colors z-50 shadow-lg"
          >
            {isCollapsed ? <ChevronRight size={14} className="text-white" /> : <ChevronLeft size={14} className="text-white" />}
          </button>

          {/* Logo Section (Premium White Box) */}
          <div className={`pt-10 pb-6 flex items-center justify-center transition-all duration-300`}>
            <Link href="/" className="block group">
              <div className={`
                relative bg-white p-2 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-500
                ${isCollapsed ? 'w-12 h-12 rounded-lg' : 'w-48 h-20'}
              `}>
                <img 
                  src="/logo-new.jpeg" 
                  alt="Logo" 
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                />
              </div>
            </Link>
          </div>

          {/* Navigation Items (Links from your customer layout) */}
          <nav className="flex-1 px-4 space-y-1.5 mt-4 font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id || pathname === item.href;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                    isActive
                      ? 'bg-primary-600/10 text-primary-400 border border-primary-500/20 shadow-inner'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-primary-400'}`} />
                  {!isCollapsed && <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>}
                  
                  {isCollapsed && (
                    <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-bold uppercase tracking-wider z-50 whitespace-nowrap border border-slate-700">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer (User Card & Logout) */}
          <div className="mt-auto p-4 border-t border-slate-800/50 bg-[#0d1321]">
            {!isCollapsed && (
              <div className="mb-4 relative group p-4 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/60 border border-slate-700/50 transition-all hover:border-primary-500/30">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative">
                    <img 
                      src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=0EA5E9&color=fff&bold=true`} 
                      className="w-10 h-10 rounded-xl border-2 border-slate-700 shadow-lg transition-all"
                      alt="avatar"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0d1321] rounded-full"></div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black text-white truncate leading-tight tracking-tight italic">
                      {user?.name || 'Customer'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Premium Member</span>
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
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200 shadow-sm">
          <div className="px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
                >
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="flex flex-col">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
                    {activePage.replace('-', ' ')}
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Customer Portal</p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <button className="hidden sm:flex p-2.5 text-slate-400 hover:text-primary-600 transition-all relative">
                   <Bell size={20} />
                   <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="hidden sm:flex p-2.5 text-slate-400 hover:text-slate-600 transition-all">
                  <Settings size={20} />
                </button>
                <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100">
                  <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt="user" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-4 sm:p-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
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
