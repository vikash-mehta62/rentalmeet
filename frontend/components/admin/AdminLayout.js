'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Users, BookOpen, Settings,
  LogOut, Menu, X, IndianRupee, FileText, Shield, BarChart3, Grid3x3, MessageSquare, Image
} from 'lucide-react';

export default function AdminLayout({ children, title, subtitle }) {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Hero Slides', href: '/admin/hero-slides', icon: Image },
    { name: 'Venues', href: '/admin/venues', icon: Building2 },
    { name: 'Venue Types', href: '/admin/venue-types', icon: Grid3x3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Employees', href: '/admin/employees', icon: Users },
    { name: 'SubAdmins', href: '/admin/subadmins', icon: Shield },
    { name: 'Bookings', href: '/admin/bookings', icon: BookOpen },
    { name: 'Payments', href: '/admin/payments', icon: IndianRupee },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
    { name: 'Platform Settings', href: '/admin/platform-settings', icon: Settings },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (!hydrated || !token || (user?.role !== 'admin' && user?.role !== 'subadmin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-primary-600 to-primary-800 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-primary-500">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">RentalMeet</h1>
                <p className="text-xs text-primary-200">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-primary-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-primary-500">
            <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-primary-700 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-primary-200 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-dark-800">{title}</h2>
                {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
