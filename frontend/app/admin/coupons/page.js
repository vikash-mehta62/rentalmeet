'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tag, Search, Building2, ChevronDown } from 'lucide-react';

export default function AdminCoupons() {
  const { token } = useAuthStore();
  const [coupons, setCoupons] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');

  useEffect(() => {
    if (token) { fetchCoupons(); fetchVenues(); }
  }, [token]);

  useEffect(() => {
    fetchCoupons();
  }, [selectedVenue]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/coupons${selectedVenue ? `?venueId=${selectedVenue}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCoupons(data.coupons);
    } catch (e) {}
    setLoading(false);
  };

  const fetchVenues = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues?status=all&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setVenues(data.venues);
    } catch (e) {}
  };

  const filtered = coupons.filter(c =>
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.venue?.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const expired = coupon.expiryDate && new Date(coupon.expiryDate) < now;
    const limitReached = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
    if (!coupon.isActive) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Inactive</span>;
    if (expired) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">Expired</span>;
    if (limitReached) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600">Limit Reached</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Active</span>;
  };

  return (
    <AdminLayout title="Coupons" subtitle={`${filtered.length} coupons`}>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or venue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedVenue}
            onChange={e => setSelectedVenue(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white min-w-[200px]"
          >
            <option value="">All Venues</option>
            {venues.map(v => (
              <option key={v._id} value={v._id}>{v.businessName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Code</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Venue</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Discount</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Uses</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Activated</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Deactivated</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Valid Till</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No coupons found</td></tr>
            ) : filtered.map(c => (
              <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-black text-primary-600 tracking-wider">
                    <Tag className="w-3.5 h-3.5" />{c.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{c.venue?.businessName || '—'}</p>
                  <p className="text-xs text-gray-400">{c.venue?.location?.city}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {c.discountType === 'percentage'
                    ? `${c.discountValue}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}`
                    : `₹${c.discountValue}`} off
                  {c.minBookingAmount > 0 && <p className="text-xs text-gray-400">min ₹{c.minBookingAmount}</p>}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}
                </td>
                <td className="px-4 py-3 text-xs text-green-600">
                  {c.activatedAt ? new Date(c.activatedAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-red-500">
                  {c.deactivatedAt ? new Date(c.deactivatedAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3">{getStatusBadge(c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
