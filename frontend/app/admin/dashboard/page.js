'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Building2, Users, BookOpen, Briefcase, ArrowRight } from 'lucide-react';

const COLOR_MAP = {
  blue:    'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-600',
  green:   'bg-green-50 border-green-200 hover:border-green-400 text-green-600',
  yellow:  'bg-yellow-50 border-yellow-200 hover:border-yellow-400 text-yellow-600',
  emerald: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-600',
  sky:     'bg-sky-50 border-sky-200 hover:border-sky-400 text-sky-600',
  pink:    'bg-pink-50 border-pink-200 hover:border-pink-400 text-pink-600',
  violet:  'bg-violet-50 border-violet-200 hover:border-violet-400 text-violet-600',
  orange:  'bg-orange-50 border-orange-200 hover:border-orange-400 text-orange-600',
  teal:    'bg-teal-50 border-teal-200 hover:border-teal-400 text-teal-600',
  red:     'bg-red-50 border-red-200 hover:border-red-400 text-red-600',
  purple:  'bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-600',
  indigo:  'bg-indigo-50 border-indigo-200 hover:border-indigo-400 text-indigo-600',
  rose:    'bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-600',
  amber:   'bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-600',
};

function StatCard({ label, value, sub, color, href, onClick }) {
  const cls = COLOR_MAP[color] || COLOR_MAP.blue;
  const [bg, border, hoverBorder, textColor] = cls.split(' ');
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer w-full ${bg} ${border} ${hoverBorder}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-3xl font-black mb-1 ${textColor}`}>{value}</p>
          <p className="text-sm font-bold text-gray-800">{label}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <ArrowRight className={`w-4 h-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${textColor}`} />
      </div>
    </button>
  );
}

function Section({ icon: Icon, title, iconColor, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVenues: 0, pendingVenues: 0, approvedVenues: 0,
    totalUsers: 0, totalOwners: 0, totalCustomers: 0, totalVendors: 0,
    totalBookings: 0, pendingBookings: 0, confirmedBookings: 0, completedBookings: 0, cancelledBookings: 0,
    totalRevenue: 0, totalQuotationDownloads: 0, totalServiceQuotationDownloads: 0,
    totalServiceBookings: 0, serviceBookingEnquiries: 0,
    totalVendorServices: 0, pendingVendorServices: 0, approvedVendorServices: 0
  });

  useEffect(() => {
    if (token) fetchDashboardStats();
  }, [token]);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const go = (href) => router.push(href);

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Loading statistics...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your platform">
      <PermissionGuard permission="dashboard">

        {/* ── VENUES ─────────────────────────────────────────────────── */}
        <Section icon={Building2} title="Venues" iconColor="text-blue-500">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Venues"   value={stats.totalVenues}              sub={`${stats.approvedVenues} approved`}   color="blue"   onClick={() => go('/admin/venues')} />
            <StatCard label="Approved"       value={stats.approvedVenues}           sub="Live on platform"                     color="green"  onClick={() => go('/admin/venues')} />
            <StatCard label="Pending"        value={stats.pendingVenues}            sub="Awaiting approval"                    color="yellow" onClick={() => go('/admin/venues')} />
            <StatCard label="Venue Bookings" value={stats.totalBookings}            sub={`${stats.pendingBookings} pending`}   color="violet" onClick={() => go('/admin/bookings')} />
            <StatCard label="Completed"      value={stats.completedBookings}        sub="Bookings done"                        color="teal"   onClick={() => go('/admin/bookings')} />
            <StatCard label="Quotation DLs"  value={stats.totalQuotationDownloads}  sub="Downloaded"                           color="indigo" onClick={() => go('/admin/quotation-downloads')} />
          </div>
        </Section>

        {/* ── VENDORS ────────────────────────────────────────────────── */}
        <Section icon={Briefcase} title="Vendors & Services" iconColor="text-purple-500">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Vendors"      value={stats.totalVendors || 0}              sub="Registered vendors"                           color="purple" onClick={() => go('/admin/vendors')} />
            <StatCard label="Vendor Services"    value={stats.totalVendorServices}            sub={`${stats.approvedVendorServices} approved`}   color="indigo" onClick={() => go('/admin/vendor-services')} />
            <StatCard label="Pending Services"   value={stats.pendingVendorServices}          sub="Awaiting approval"                            color="amber"  onClick={() => go('/admin/vendor-services')} />
            <StatCard label="Service Bookings"   value={stats.totalServiceBookings}           sub={`${stats.serviceBookingEnquiries} enquiries`} color="rose"   onClick={() => go('/admin/service-bookings')} />
            <StatCard label="Service Quotations" value={stats.totalServiceQuotationDownloads || 0} sub="Downloaded"                              color="orange" onClick={() => go('/admin/service-quotation-downloads')} />
            <StatCard label="Cancelled"          value={stats.cancelledBookings || 0}         sub="All bookings"                                 color="red"    onClick={() => go('/admin/bookings')} />
          </div>
        </Section>

        {/* ── USERS ──────────────────────────────────────────────────── */}
        <Section icon={Users} title="Users" iconColor="text-emerald-500">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Users" value={stats.totalUsers}     sub="All registered"       color="emerald" onClick={() => go('/admin/users')} />
            <StatCard label="Owners"      value={stats.totalOwners}    sub="Venue owners"          color="sky"     onClick={() => go('/admin/users')} />
            <StatCard label="Customers"   value={stats.totalCustomers} sub="Registered customers"  color="pink"    onClick={() => go('/admin/users')} />
            <StatCard label="Vendors"     value={stats.totalVendors || 0} sub="Service vendors"    color="purple"  onClick={() => go('/admin/vendors')} />
          </div>
        </Section>

        {/* ── Quick Actions ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/admin/venues" className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
              <Building2 className="w-6 h-6 text-primary-500" />
              <div><p className="font-semibold text-dark-800">Manage Venues</p><p className="text-xs text-gray-600">Approve or reject venues</p></div>
            </a>
            <a href="/admin/users" className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
              <Users className="w-6 h-6 text-primary-500" />
              <div><p className="font-semibold text-dark-800">Manage Users</p><p className="text-xs text-gray-600">View and manage all users</p></div>
            </a>
            <a href="/admin/bookings" className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all">
              <BookOpen className="w-6 h-6 text-primary-500" />
              <div><p className="font-semibold text-dark-800">View Bookings</p><p className="text-xs text-gray-600">Monitor all bookings</p></div>
            </a>
          </div>
        </div>

      </PermissionGuard>
    </AdminLayout>
  );
}
