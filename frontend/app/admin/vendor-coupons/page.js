'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Tag, Plus, X, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;

const EMPTY = {
  serviceId: '',
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscount: '',
  minBookingAmount: '',
  maxUses: '',
  expiryDate: ''
};

export default function AdminVendorCouponsPage() {
  const { token } = useAuthStore();
  const [coupons, setCoupons] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponRes, serviceRes] = await Promise.all([
        fetch(`${API}/admin/service-coupons`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/admin/vendor-services`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [couponData, serviceData] = await Promise.all([couponRes.json(), serviceRes.json()]);
      if (couponData.success) setCoupons(couponData.coupons || []);
      if (serviceData.success) setServices((serviceData.services || []).filter((s) => s.status === 'approved'));
    } catch {
      toast.error('Failed to load vendor coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) {
      toast.error('Code and discount are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/service-coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          serviceId: form.serviceId || null,
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : 0,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiryDate: form.expiryDate || null
        })
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to create coupon');
        return;
      }

      toast.success('Vendor coupon created');
      setForm(EMPTY);
      setShowForm(false);
      fetchData();
    } catch {
      toast.error('Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (coupon) => {
    try {
      const res = await fetch(`${API}/admin/service-coupons/${coupon._id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to update coupon');
        return;
      }

      setCoupons((prev) => prev.map((c) => (c._id === coupon._id ? data.coupon : c)));
      toast.success(data.coupon.isActive ? 'Coupon activated' : 'Coupon deactivated');
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  const deleteCoupon = async (coupon) => {
    if (!confirm(`Delete coupon ${coupon.code}?`)) return;
    try {
      const res = await fetch(`${API}/admin/service-coupons/${coupon._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to delete coupon');
        return;
      }

      setCoupons((prev) => prev.filter((c) => c._id !== coupon._id));
      toast.success('Coupon deleted');
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const getStatusBadge = (c) => {
    const now = new Date();
    const expired = c.expiryDate && new Date(c.expiryDate) < now;
    const limitReached = c.maxUses !== null && c.usedCount >= c.maxUses;

    if (!c.isActive) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Inactive</span>;
    if (expired) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">Expired</span>;
    if (limitReached) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600">Limit Reached</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Active</span>;
  };

  return (
    <AdminLayout title="Vendor Coupons" subtitle="Manage service coupons for vendors">
      <PermissionGuard permission="vendorCoupons">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{coupons.length} coupon(s)</p>
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Vendor Coupon'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-soft">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary-600" /> Create Vendor Coupon
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={lbl}>Service</label>
                <select
                  className={inp}
                  value={form.serviceId}
                  onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))}
                >
                  <option value="">All Services (Global)</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Code *</label>
                <input
                  className={inp}
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="SVC20"
                  required
                />
              </div>
              <div>
                <label className={lbl}>Discount Type *</label>
                <select
                  className={inp}
                  value={form.discountType}
                  onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (Rs)</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Discount Value *</label>
                <input
                  type="number"
                  min="0"
                  className={inp}
                  value={form.discountValue}
                  onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                  required
                />
              </div>
              {form.discountType === 'percentage' && (
                <div>
                  <label className={lbl}>Max Discount</label>
                  <input
                    type="number"
                    min="0"
                    className={inp}
                    value={form.maxDiscount}
                    onChange={(e) => setForm((p) => ({ ...p, maxDiscount: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <label className={lbl}>Min Booking Amount</label>
                <input
                  type="number"
                  min="0"
                  className={inp}
                  value={form.minBookingAmount}
                  onChange={(e) => setForm((p) => ({ ...p, minBookingAmount: e.target.value }))}
                />
              </div>
              <div>
                <label className={lbl}>Max Uses</label>
                <input
                  type="number"
                  min="1"
                  className={inp}
                  value={form.maxUses}
                  onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                />
              </div>
              <div>
                <label className={lbl}>Expiry Date</label>
                <input
                  type="date"
                  className={inp}
                  value={form.expiryDate}
                  onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Code</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Service</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Uses</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Expiry</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">No vendor coupons yet.</td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-black text-primary-600 tracking-wider text-sm flex items-center gap-1">
                        <Tag className="w-3 h-3" />{c.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.service ? (
                        <>
                          <p className="font-semibold">{c.service.title}</p>
                          <p className="text-gray-400">{c.service.category}</p>
                        </>
                      ) : (
                        <span className="text-indigo-600 font-semibold">All Services</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.serviceVendor ? (
                        <>
                          <p className="font-semibold">{c.serviceVendor.name}</p>
                          <p className="text-gray-400">{c.serviceVendor.email}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}%${c.maxDiscount ? ` (max Rs ${c.maxDiscount})` : ''}`
                        : `Rs ${c.discountValue}`} off
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(c)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCoupon(c)}
                          className={`p-1.5 rounded-lg transition-colors ${c.isActive ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
                        >
                          {c.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteCoupon(c)}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PermissionGuard>
    </AdminLayout>
  );
}

