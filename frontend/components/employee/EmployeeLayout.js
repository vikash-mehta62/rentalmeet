'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Home, User, LogOut, Menu, X, ChevronLeft, ChevronRight, Bell, Settings
} from 'lucide-react';

export default function EmployeeLayout({ children, activePage = 'dashboard', title, subtitle }) {
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        ${isCollapsed ? 'lg:w-16' : 'lg:w-56'}`}>

        {/* Logo */}
        <div className={`flex items-center border-b border-gray-100 px-4 py-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div>
              <img src="/logo.png" alt="RentalMeet" className="h-8 w-auto object-contain"
                onError={e => e.target.style.display='none'} />
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Employee Portal</p>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button onClick={() => setIsCollapsed(p => !p)} className="hidden lg:flex p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id || pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.id} href={item.href} onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && item.label}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">
              {title || activePage.replace('-', ' ')}
            </h1>
            <p className="text-xs text-gray-400 truncate">{subtitle || 'Employee Portal'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex p-2 text-gray-400 hover:bg-gray-100 rounded-xl relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="text-sm font-bold text-gray-800 max-w-[180px] truncate">{user?.name || 'Employee'}</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{user?.employeeDetails?.position || 'Employee'}</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100">
              <img src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || 'Employee'}&background=random`} alt="user" />
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
