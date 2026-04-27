'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Home, User, LogOut, Menu, X, ChevronLeft, ChevronRight, Bell, Settings
} from 'lucide-react';

export default function EmployeeLayout({ children, activePage = 'dashboard' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/employee/dashboard' },
    { id: 'profile', label: 'My Profile', icon: User, href: '/employee/profile' },
  ];

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 bg-[#F1F5F9] text-slate-700 transition-all duration-300 ease-in-out border-r border-slate-200
        ${isCollapsed ? 'w-20' : 'w-72'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full relative">
          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-primary-600 rounded-full items-center justify-center border-2 border-[#F1F5F9] hover:bg-primary-500 z-50 shadow-lg"
          >
            {isCollapsed ? <ChevronRight size={14} className="text-white" /> : <ChevronLeft size={14} className="text-white" />}
          </button>

          {/* Logo */}
          <div className="pt-10 pb-6 flex items-center justify-center transition-all duration-300">
            <Link href="/" className="block group">
              <div className={`relative bg-white p-2 rounded-xl shadow-lg shadow-black/10 overflow-hidden transition-all duration-500 ${isCollapsed ? 'w-12 h-12 rounded-lg' : 'w-48 h-20'}`}>
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 space-y-1.5 mt-4 font-medium overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id || pathname === item.href;
              return (
                <Link key={item.id} href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${
                    isActive
                      ? 'bg-primary-500 text-white border border-primary-400 shadow-md'
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-transparent'
                  }`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-primary-600'}`} />
                  {!isCollapsed && <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap border border-slate-700">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>
      </aside>

        {/* Main */}
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200 shadow-sm">
          <div className="px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl">
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="flex flex-col">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">
                    {activePage.replace('-', ' ')}
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Employee Portal</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="hidden sm:flex p-2.5 text-slate-400 hover:text-primary-600 transition-all relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="hidden sm:flex p-2.5 text-slate-400 hover:text-slate-600 transition-all">
                  <Settings className="w-5 h-5" />
                </button>
                <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
                <div className="hidden sm:flex flex-col text-right leading-tight">
                  <span className="text-sm font-bold text-slate-800 max-w-[180px] truncate">{user?.name || 'Employee'}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user?.employeeDetails?.position || 'Employee'}</span>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100">
                  <img src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt="user" />
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
