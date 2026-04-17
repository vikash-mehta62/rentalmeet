'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  Building2, Users, BookOpen, IndianRupee,
  Calendar, CheckCircle, Clock, UserCheck, UserCog, FileDown
} from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVenues: 0, pendingVenues: 0, approvedVenues: 0,
    totalUsers: 0, totalOwners: 0, totalCustomers: 0,
    totalBookings: 0, pendingBookings: 0, confirmedBookings: 0, completedBookings: 0,
    totalRevenue: 0, totalQuotationDownloads: 0,
    totalServiceBookings: 0, serviceBookingEnquiries: 0
  });

  useEffect(() => {
    if (token) fetchDashboardStats();
  }, [token]);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Venues',
      value: stats.totalVenues,
      sub: `${stats.approvedVenues} approved · ${stats.pendingVenues} pending`,
      icon: Building2,
      gradient: 'from-blue-500 to-blue-700',
      light: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      sub: `${stats.totalOwners} owners · ${stats.totalCustomers} customers`,
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-700',
      light: 'bg-emerald-50 text-emerald-600'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      sub: `${stats.pendingBookings} pending · ${stats.confirmedBookings} confirmed`,
      icon: BookOpen,
      gradient: 'from-violet-500 to-violet-700',
      light: 'bg-violet-50 text-violet-600'
    },
    {
      title: 'Completed',
      value: stats.completedBookings,
      sub: 'Bookings completed',
      icon: CheckCircle,
      gradient: 'from-teal-500 to-teal-700',
      light: 'bg-teal-50 text-teal-600'
    },
    {
      title: 'Owners',
      value: stats.totalOwners,
      sub: 'Registered venue owners',
      icon: UserCog,
      gradient: 'from-sky-500 to-sky-700',
      light: 'bg-sky-50 text-sky-600'
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      sub: 'Registered customers',
      icon: UserCheck,
      gradient: 'from-pink-500 to-rose-600',
      light: 'bg-pink-50 text-pink-600'
    },
    {
      title: 'Pending Venues',
      value: stats.pendingVenues,
      sub: 'Awaiting approval',
      icon: Clock,
      gradient: 'from-yellow-500 to-yellow-600',
      light: 'bg-yellow-50 text-yellow-600'
    },
    {
      title: 'Quotation Downloads',
      value: stats.totalQuotationDownloads,
      sub: 'Total quotations downloaded',
      icon: FileDown,
      gradient: 'from-indigo-500 to-indigo-700',
      light: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Service Bookings',
      value: stats.totalServiceBookings,
      sub: `${stats.serviceBookingEnquiries} enquiries`,
      icon: FileDown,
      gradient: 'from-purple-500 to-purple-700',
      light: 'bg-purple-50 text-purple-600'
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Loading statistics...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your platform">
      <PermissionGuard permission="dashboard">

        {/* Stats Grid */}
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className={`bg-gradient-to-br ${stat.gradient} p-3 flex flex-col gap-1`}>
                  <div className="flex items-center justify-between">
                    <div className="bg-white/20 rounded-lg p-1.5">
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xl font-black text-white">{stat.value}</span>
                  </div>
                </div>
                <div className="bg-white px-2.5 py-2">
                  <p className="text-xs font-bold text-gray-800 leading-tight">{stat.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-dark-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/admin/venues" className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
              <Building2 className="w-6 h-6 text-primary-500" />
              <div>
                <p className="font-semibold text-dark-800">Manage Venues</p>
                <p className="text-xs text-gray-600">Approve or reject venues</p>
              </div>
            </a>
            <a href="/admin/users" className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
              <Users className="w-6 h-6 text-primary-500" />
              <div>
                <p className="font-semibold text-dark-800">Manage Users</p>
                <p className="text-xs text-gray-600">View and manage all users</p>
              </div>
            </a>
            <a href="/admin/bookings" className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
              <BookOpen className="w-6 h-6 text-primary-500" />
              <div>
                <p className="font-semibold text-dark-800">View Bookings</p>
                <p className="text-xs text-gray-600">Monitor all bookings</p>
              </div>
            </a>
          </div>
        </div>

      </PermissionGuard>
    </AdminLayout>
  );
}
