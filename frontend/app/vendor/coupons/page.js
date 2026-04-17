'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import VendorLayout from '@/components/vendor/VendorLayout';
import toast from 'react-hot-toast';
import { Tag, Plus, X, Trash2, ToggleLeft, ToggleRight, Copy } from 'lucide-react';

const EMPTY = { serviceId: '', code: '', discountType: 'percentage', discountValue: '', maxDiscount: '', minBookingAmount: '', maxUses: '', expiryDate: '' };

export default function VendorCoupons() {
  const { token } = useAuthStore();
  const [services, setServices] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/service-coupons`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([svcData, cpData]) => {
      if (svcData.success) setServices(svcData.services.filter(s => s.status === 'approved'));
      if (cpData.success) setCoupons(cpData.coupons);
    }).finally(() => setLoading(false));
  }, [token]);

  const fetchCoupons = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/service-coupons`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setCoupons(data.coupons);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.serviceId || !form.code || !form.discountValue) return toast.error('Service, code and discount required');
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/service-coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, discountValue: Number(form.discountValue), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : 0, maxUses: form.maxUses ? Number(form.maxUses) : null })
      });
      const data = await res.json();
      if (data.success) { toast.success('Coupon created!'); setForm(EMPTY); setShowForm(false); fetchCoupons(); }
      else toast.error(data.message);
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const toggleActive = async (coupon) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/service-coupons/${coupon._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !coupon.isActive })
    });
    const data = await res.json();
    if (data.success) { toast.success(data.coupon.isActive ? 'Activated' : 'Deactivated'); fetchCoupons(); }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/service-coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { toast.success('Deleted'); fetchCoupons(); }
  };

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none';

  return (
    <VendorLayout title="Service Coupons" subtitle="Manage discount coupons for your services">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{coupons.length} coupon(s)</p>
        <button onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-primary-500" />Create Coupon</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Service *</label>
              <select className={inp} value={form.serviceId} onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))} required>
                <option value="">Select service</option>
                {services.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Coupon Code *</label>
              <input className={inp + ' uppercase'} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Type *</label>
              <select className={inp} value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Value *</label>
              <input type="number" min="1" className={inp} value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} required />
            </div>
            {form.discountType === 'percentage' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Max Discount (₹)</label>
                <input type="number" min="0" className={inp} value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))} placeholder="Optional cap" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Min Booking (₹)</label>
              <input type="number" min="0" className={inp} value={form.minBookingAmount} onChange={e => setForm(p => ({ ...p, minBookingAmount: e.target.value }))} placeholder="0 = no min" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Uses</label>
              <input type="number" min="1" className={inp} value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="Blank = unlimited" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date</label>
              <input type="date" className={inp} value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} min={new Date().toISOString().slice(0,10)} />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Tag className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No coupons yet</p>
          <p className="text-gray-400 text-sm mt-1">Create coupons to offer discounts on your services</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => {
            const expired = c.expiryDate && new Date() > new Date(c.expiryDate);
            const limitReached = c.maxUses !== null && c.usedCount >= c.maxUses;
            return (
              <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-primary-600" />
                      <span className="font-black text-primary-700 tracking-widest text-sm">{c.code}</span>
                      <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Copied!'); }} className="text-primary-400 hover:text-primary-600">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{c.service?.title || 'All Services'}</p>
                      <p className="text-xs text-gray-400">
                        {c.discountType === 'percentage' ? `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}` : `₹${c.discountValue} off`}
                        {c.minBookingAmount > 0 ? ` · Min ₹${c.minBookingAmount}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''} uses</div>
                    {expired && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Expired</span>}
                    {limitReached && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">Limit Reached</span>}
                    {!expired && !limitReached && c.isActive && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">Active</span>}
                    {!c.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Inactive</span>}
                    <button onClick={() => toggleActive(c)} className="text-gray-400 hover:text-primary-600 transition-colors">
                      {c.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => deleteCoupon(c._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </VendorLayout>
  );
}
