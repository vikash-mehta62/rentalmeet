'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import OwnerLayout from '@/components/owner/OwnerLayout';
import toast from 'react-hot-toast';
import {
  Tag, Plus, Trash2, Eye, ToggleLeft, ToggleRight,
  Calendar, Users, Percent, IndianRupee, Copy, ChevronDown, ChevronUp, X, Pencil, Download, FileText
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function OwnerCoupons() {
  const { token } = useAuthStore();
  const [venues, setVenues] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedCoupon, setExpandedCoupon] = useState(null);
  const [usageData, setUsageData] = useState({});
  const [editModal, setEditModal] = useState(null); // coupon being edited
  const [editForm, setEditForm] = useState({ maxUses: '', expiryDate: '' });
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'downloads'
  const [downloads, setDownloads] = useState([]);
  const [downloadsLoading, setDownloadsLoading] = useState(false);

  const [form, setForm] = useState({
    venueId: '',
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minBookingAmount: '',
    maxUses: '',
    expiryDate: ''
  });

  useEffect(() => {
    if (token) {
      fetchVenues();
      fetchCoupons();
    }
  }, [token]);

  const fetchVenues = async () => {
    const res = await fetch(`${API}/owner/venues`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setVenues(data.venues.filter(v => v.status === 'approved'));
  };

  const fetchCoupons = async () => {
    setLoading(true);
    const res = await fetch(`${API}/owner/coupons`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setCoupons(data.coupons);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.venueId || !form.code || !form.discountValue) {
      toast.error('Please fill required fields');
      return;
    }
    const res = await fetch(`${API}/owner/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        venueId: form.venueId,
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : 0,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiryDate: form.expiryDate || null
      })
    });
    const data = await res.js
on();
    if (data.success) {
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ venueId: '', code: '', discountType: 'percentage', discountValue: '', maxDiscount: '', minBookingAmount: '', maxUses: '', expiryDate: '' });
      fetchCoupons();
    } else {
      toast.error(data.message || 'Failed to create coupon');
    }
  };

  const toggleActive = async (coupon) => {
    const res = await fetch(`${API}/owner/coupons/${coupon._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !coupon.isActive })
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Coupon ${data.coupon.isActive ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    const res = await fetch(`${API}/owner/coupons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) { toast.success('Deleted'); fetchCoupons(); }
  };

  const openEdit = (coupon) => {
    setEditModal(coupon);
    setEditForm({
      maxUses: coupon.maxUses ?? '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : ''
    });
  };

  const handleEditSave = async () => {
    const res = await fetch(`${API}/owner/coupons/${editModal._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        maxUses: editForm.maxUses !== '' ? Number(editForm.maxUses) : null,
        expiryDate: editForm.expiryDate || null
      })
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Coupon updated!');
      setEditModal(null);
      fetchCoupons();
    } else {
      toast.error(data.message || 'Failed to update');
    }
  };

  const loadUsage = async (couponId) => {
    if (expandedCoupon === couponId) { setExpandedCoupon(null); return; }
    const res = await fetch(`${API}/owner/coupons/${couponId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) {
      setUsageData(prev => ({ ...prev, [couponId]: data.coupon.usages }));
      setExpandedCoupon(couponId);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const handleDownload = async (coupon) => {
    try {
      const res = await fetch(`${API}/owner/coupons/${coupon._id}/download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) { toast.error('Failed to record download'); return; }

      // Build simple text content for download
      const venue = coupon.venue;
      const content = [
        `QUOTATION`,
        `Quotation No: ${data.quotationNumber}`,
        `Date: ${new Date().toLocaleDateString('en-IN')}`,
        ``,
        `Venue: ${venue?.businessName}`,
        `SKU: ${venue?.sku}`,
        ``,
        `Coupon Code: ${coupon.code}`,
        `Discount: ${coupon.discountType === 'percentage' ? `${coupon.discountValue}%${coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ''}` : `₹${coupon.discountValue}`}`,
        coupon.minBookingAmount > 0 ? `Min Booking: ₹${coupon.minBookingAmount}` : '',
        coupon.maxUses ? `Max Uses: ${coupon.maxUses}` : 'Max Uses: Unlimited',
        coupon.expiryDate ? `Valid Till: ${new Date(coupon.expiryDate).toLocaleDateString('en-IN')}` : 'No Expiry',
      ].filter(Boolean).join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.quotationNumber}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded: ${data.quotationNumber}`);
    } catch {
      toast.error('Download failed');
    }
  };

  const fetchDownloads = async () => {
    setDownloadsLoading(true);
    try {
      const res = await fetch(`${API}/owner/coupon-downloads`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setDownloads(data.records);
    } catch {}
    setDownloadsLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'downloads' && downloads.length === 0) fetchDownloads();
  };

  const isExpired = (date) => date && new Date() > new Date(date);

  return (
    <OwnerLayout title="Coupons" subtitle="Manage discount coupons for your venues">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
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
              <Download size={14} className="inline mr-1.5" />Downloads
            </button>
          </div>
          {activeTab === 'coupons' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Cancel' : 'New Coupon'}
            </button>
          )}
        </div>

        {/* Create Form */}
        {activeTab === 'coupons' && showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-5 text-lg">Create Coupon</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Venue *</label>
                  <select
                    value={form.venueId}
                    onChange={e => setForm(p => ({ ...p, venueId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select venue</option>
                    {venues.map(v => <option key={v._id} value={v._id}>{v.businessName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Coupon Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SAVE20"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Discount Value * {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                    min="1"
                    max={form.discountType === 'percentage' ? 100 : undefined}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                {form.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Discount Cap (₹) <span className="text-slate-400 font-normal">optional</span></label>
                    <input
                      type="number"
                      value={form.maxDiscount}
                      onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min Booking Amount (₹) <span className="text-slate-400 font-normal">optional</span></label>
                  <input
                    type="number"
                    value={form.minBookingAmount}
                    onChange={e => setForm(p => ({ ...p, minBookingAmount: e.target.value }))}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Uses <span className="text-slate-400 font-normal">optional (blank = unlimited)</span></label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expiry Date <span className="text-slate-400 font-normal">optional</span></label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons List */}
        {activeTab === 'coupons' && (loading ? (
          <div className="text-center py-16 text-slate-400">Loading...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No coupons yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first coupon to offer discounts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map(coupon => {
              const expired = isExpired(coupon.expiryDate);
              const limitReached = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
              const isOpen = expandedCoupon === coupon._id;

              return (
                <div key={coupon._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start gap-3 justify-between">
                      {/* Left: Code + venue */}
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 flex items-center gap-2">
                          <Tag size={14} className="text-primary-600" />
                          <span className="font-black text-primary-700 tracking-widest text-sm">{coupon.code}</span>
                          <button onClick={() => copyCode(coupon.code)} className="text-primary-400 hover:text-primary-600 transition-colors">
                            <Copy size={12} />
                          </button>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{coupon.venue?.businessName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% off${coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ''}`
                              : `₹${coupon.discountValue} off`}
                          </p>
                        </div>
                      </div>

                      {/* Right: Stats + actions */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Status badges */}
                        <div className="flex gap-2 flex-wrap">
                          {!coupon.isActive && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-medium">Inactive</span>
                          )}
                          {expired && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Expired</span>
                          )}
                          {limitReached && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">Limit Reached</span>
                          )}
                          {coupon.isActive && !expired && !limitReached && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">Active</span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Users size={12} />
                          <span>{coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''} uses</span>
                        </div>

                        {/* Activated date */}
                        {coupon.activatedAt && (
                          <div className="flex items-center gap-1 text-xs text-green-600" title="Activated on">
                            <span>✅ {new Date(coupon.activatedAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        )}

                        {/* Deactivated date */}
                        {coupon.deactivatedAt && (
                          <div className="flex items-center gap-1 text-xs text-red-500" title="Deactivated on">
                            <span>🚫 {new Date(coupon.deactivatedAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        )}

                        {/* Valid till (expiry) */}
                        {coupon.expiryDate && (
                          <div className="flex items-center gap-1 text-xs text-slate-500" title="Valid till">
                            <Calendar size={12} />
                            <span>{new Date(coupon.expiryDate).toLocaleDateString('en-IN')}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <button onClick={() => openEdit(coupon)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Edit expiry & count">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => toggleActive(coupon)} className="text-slate-400 hover:text-primary-600 transition-colors" title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                          {coupon.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                        </button>
                        <button onClick={() => loadUsage(coupon._id)} className="text-slate-400 hover:text-blue-600 transition-colors" title="View usage">
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <button onClick={() => handleDownload(coupon)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Download quotation">
                          <Download size={16} />
                        </button>
                        <button onClick={() => deleteCoupon(coupon._id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Quotation number + Min amount info */}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {coupon.quotationNumber && (
                        <span className="text-xs text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">
                          <FileText size={10} className="inline mr-1" />{coupon.quotationNumber}
                        </span>
                      )}
                      {coupon.minBookingAmount > 0 && (
                        <p className="text-xs text-slate-400">Min booking: ₹{coupon.minBookingAmount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Usage Details */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Usage History</p>
                      {!usageData[coupon._id] || usageData[coupon._id].length === 0 ? (
                        <p className="text-sm text-slate-400">No usage yet</p>
                      ) : (
                        <div className="space-y-2">
                          {usageData[coupon._id].map((u, i) => (
                            <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-slate-200 text-sm">
                              <div>
                                <p className="font-semibold text-slate-700">{u.user?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{u.user?.email} · {u.user?.phone}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">-₹{u.discountAmount}</p>
                                <p className="text-xs text-slate-400">{new Date(u.usedAt).toLocaleDateString('en-IN')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Downloads Tab */}
        {activeTab === 'downloads' && (
          downloadsLoading ? (
            <div className="text-center py-16 text-slate-400">Loading...</div>
          ) : downloads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Download className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No downloads yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Quotation No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Coupon</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Venue</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Downloaded By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {downloads.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-indigo-600 text-xs">{d.quotationNumber}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{d.couponCode}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">{d.venueSnapshot?.businessName || d.venue?.businessName}</p>
                        <p className="text-xs text-slate-400">{d.venueSnapshot?.city}, {d.venueSnapshot?.state}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">{d.downloadedBy?.name || 'You'}</p>
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{d.role}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(d.downloadedAt).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Edit Coupon</h2>
                <p className="text-xs text-gray-500 mt-0.5">{editModal.code}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Max Uses (leave empty for unlimited)</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.maxUses}
                  onChange={e => setEditForm(p => ({ ...p, maxUses: e.target.value }))}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Expiry Date (leave empty for no expiry)</label>
                <input
                  type="date"
                  value={editForm.expiryDate}
                  onChange={e => setEditForm(p => ({ ...p, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                onClick={handleEditSave}
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}
