'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tag, Search, Building2, Download, FileText } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminCoupons() {
  const { token } = useAuthStore();
  const [coupons, setCoupons] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [activeTab, setActiveTab] = useState('coupons');
  const [downloads, setDownloads] = useState([]);
  const [downloadsLoading, setDownloadsLoading] = useState(false);
  const [dlVenueFilter, setDlVenueFilter] = useState('');

  useEffect(() => {
    if (token) { fetchCoupons(); fetchVenues(); }
  }, [token]);

  useEffect(() => { fetchCoupons(); }, [selectedVenue]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const url = `${API}/admin/coupons${selectedVenue ? `?venueId=${selectedVenue}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCoupons(data.coupons);
    } catch (e) {}
    setLoading(false);
  };

  const fetchVenues = async () => {
    try {
      const res = await fetch(`${API}/venues?status=all&limit=200`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setVenues(data.venues);
    } catch (e) {}
  };

  const fetchDownloads = async () => {
    setDownloadsLoading(true);
    try {
      const url = `${API}/admin/coupon-downloads${dlVenueFilter ? `?venueId=${dlVenueFilter}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setDownloads(data.records);
    } catch (e) {}
    setDownloadsLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'downloads') fetchDownloads();
  };

  useEffect(() => {
    if (activeTab === 'downloads') fetchDownloads();
  }, [dlVenueFilter]);

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleTabChange('coupons')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'coupons' ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <Tag size={14} className="inline mr-1.5" />Coupons ({coupons.length})
        </button>
        <button
          onClick={() => handleTabChange('downloads')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'downloads' ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <Download size={14} className="inline mr-1.5" />Download History
        </button>
      </div>

      {activeTab === 'coupons' && (<>
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
              {venues.map(v => <option key={v._id} value={v._id}>{v.businessName}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Quotation No</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Venue</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Uses</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Activated</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Valid Till</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No coupons found</td></tr>
              ) : filtered.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {c.quotationNumber
                      ? <span className="font-mono text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded"><FileText size={10} className="inline mr-1" />{c.quotationNumber}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
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
                  <td className="px-4 py-3 text-slate-700">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                  <td className="px-4 py-3 text-xs text-green-600">
                    {c.activatedAt ? new Date(c.activatedAt).toLocaleDateString('en-IN') : '—'}
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
      </>)}

      {activeTab === 'downloads' && (<>
        {/* Venue filter for downloads */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex gap-3">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={dlVenueFilter}
              onChange={e => setDlVenueFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white min-w-[200px]"
            >
              <option value="">All Venues</option>
              {venues.map(v => <option key={v._id} value={v._id}>{v.businessName}</option>)}
            </select>
          </div>
          <span className="text-sm text-slate-500 self-center">{downloads.length} records</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Quotation No</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Coupon</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Venue</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Downloaded By</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {downloadsLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : downloads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No downloads yet</td></tr>
              ) : downloads.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-indigo-600 text-xs">{d.quotationNumber}</td>
                  <td className="px-4 py-3 font-semibold text-primary-600">{d.couponCode}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{d.venueSnapshot?.businessName || d.venue?.businessName}</p>
                    <p className="text-xs text-gray-400">{d.venueSnapshot?.city}, {d.venueSnapshot?.state}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{d.owner?.name}</p>
                    <p className="text-xs text-gray-400">{d.owner?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{d.downloadedBy?.name || '—'}</p>
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{d.role}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(d.downloadedAt).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}
    </AdminLayout>
  );
}

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
