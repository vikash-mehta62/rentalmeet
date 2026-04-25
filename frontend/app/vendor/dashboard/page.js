'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import VendorLayout from '@/components/vendor/VendorLayout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Plus, TrendingUp, Briefcase, CheckCircle2, Clock,
  XCircle, AlertCircle, Edit, Eye, IndianRupee, MapPin
} from 'lucide-react';

export default function VendorDashboard() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [services, setServices] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingStats, setBookingStats] = useState({ total: 0, enquiry: 0 });

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const [svcRes, statsRes, bookRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/service-bookings`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [svcData, statsData, bookData] = await Promise.all([svcRes.json(), statsRes.json(), bookRes.json()]);
      if (svcData.success) setServices(svcData.services.slice(0, 5));
      if (statsData.success) setStats(statsData.stats);
      if (bookData.success) {
        setRecentBookings(bookData.bookings.slice(0, 3));
        setBookingStats(bookData.stats);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
    const map = {
      approved:  { bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle2, label: 'Approved' },
      pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock,        label: 'Pending Review' },
      rejected:  { bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle,      label: 'Rejected' },
      draft:     { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: AlertCircle,  label: 'Draft' },
    };
    const b = map[status] || map.draft;
    const Icon = b.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${b.bg} ${b.text}`}>
        <Icon className="w-3.5 h-3.5" />{b.label}
      </span>
    );
  };

  if (loading) {
    return (
      <VendorLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout title="Dashboard" subtitle="Manage your services">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Services', value: stats.total,    color: 'bg-white border-gray-100',         text: 'text-gray-800' },
          { label: 'Approved',       value: stats.approved, color: 'bg-green-50 border-green-200',     text: 'text-green-700' },
          { label: 'Pending Review', value: stats.pending,  color: 'bg-yellow-50 border-yellow-200',   text: 'text-yellow-700' },
          { label: 'Rejected',       value: stats.rejected, color: 'bg-red-50 border-red-200',         text: 'text-red-700' },
          { label: 'Enquiries',      value: bookingStats.enquiry, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
        ].map(({ label, value, color, text }) => (
          <div key={label} className={`rounded-xl border shadow-sm p-4 ${color}`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* My Services */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">My Services</h2>
          <div className="flex items-center gap-3">
            <Link href="/vendor/services" className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-1 text-sm">
              View All <TrendingUp className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-10">
            <Briefcase className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No services yet</h3>
            <p className="text-gray-400 text-sm mb-5">Start by adding your first service listing</p>
            <Link href="/vendor/services/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors">
              <Plus className="w-4 h-4" /> Add Your First Service
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map(svc => (
              <div key={svc._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    {svc.featuredImage ? (
                      <img src={svc.featuredImage} alt={svc.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{svc.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{svc.category}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {svc.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{svc.city}</span>}
                        {svc.startingPrice && <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{svc.startingPrice.toLocaleString()}+</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {getStatusBadge(svc.status)}
                    <div className="flex gap-2">
                      <Link href={`/vendor/services/${svc._id}`}
                        className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
                {svc.status === 'rejected' && svc.rejectionReason && (
                  <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                    <strong>Rejected:</strong> {svc.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Enquiries</h2>
            <Link href="/vendor/bookings" className="text-primary-500 hover:text-primary-600 font-semibold text-sm">View All</Link>
          </div>
          <div className="space-y-3">
            {recentBookings.map(b => (
              <div key={b._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-primary-600">{b.bookingNumber || '—'}</code>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.status === 'enquiry' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{b.status}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{b.customerInfo?.name}</p>
                  <p className="text-xs text-gray-400">{b.serviceSnapshot?.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-600">₹{b.pricing?.total?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{b.eventDate ? new Date(b.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Service CTA */}
      <div className="mb-6">
        <Link href="/vendor/services/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add New Service
        </Link>
      </div>

    </VendorLayout>
  );
}
