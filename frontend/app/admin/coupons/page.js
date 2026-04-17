'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Tag, Plus, X, CheckCircle, XCircle, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;

const EMPTY = {
  code: '', discountType: 'percentage', discountValue: '',
  maxDiscount: '', minBookingAmount: '', maxUses: '', expiryDate: '',
  appliesTo: 'total'
};

export default function AdminCoupons() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('venues');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  // Service coupons state
  const [svcCoupons, setSvcCoupons] = useState([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [showSvcForm, setShowSvcForm] = useState(false);
  const [svcForm, setSvcForm] = useState({ ...EMPTY, serviceId: '' });
  const [svcSaving, setSvcSaving] = useState(false);
  const [allServices, setAllServices] = useState([]);

  useEffect(() => { if (token) { fetchCoupons(); fetchSvcCoupons(); fetchAllServices(); } }, [token]);

  const fetchSvcCoupons = async () => {
    setSvcLoading(true);
    try {
      const res = await fetch(`${API}/admin/service-coupons`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSvcCoupons(data.coupons);
    } catch {}
    setSvcLoading(false);
  };

  const fetchAllServices = async () => {
    try {
      const res = await fetch(`${API}/admin/vendor-services`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAllServices(data.services.filter(s => s.status === 'approved'));
    } catch {}
  };

  const handleCreateSvc = async (e) => {
    e.preventDefault();
    if (!svcForm.code || !svcForm.discountValue) return toast.error('Code and discount required');
    setSvcSaving(true);
    try {
      const res = await fetch(`${API}/admin/service-coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceId: svcForm.serviceId || null, code: svcForm.code, discountType: svcForm.discountType, discountValue: Number(svcForm.discountValue), maxDiscount: svcForm.maxDiscount ? Number(svcForm.maxDiscount) : null, minBookingAmount: svcForm.minBookingAmount ? Number(svcForm.minBookingAmount) : 0, maxUses: svcForm.maxUses ? Number(svcForm.maxUses) : null, expiryDate: svcForm.expiryDate || null })
      });
      const data = await res.json();
      if (data.success) { toast.success('Coupon created!'); setSvcForm({ ...EMPTY, serviceId: '' }); setShowSvcForm(false); fetchSvcCoupons(); }
      else toast.error(data.message);
    } catch { toast.error('Failed'); }
    setSvcSaving(false);
  };

  const handleToggleSvc = async (id) => {
    const res = await fetch(`${API}/admin/service-coupons/${id}/toggle`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { setSvcCoupons(p => p.map(c => c._id === id ? data.coupon : c)); toast.success(data.coupon.isActive ? 'Activated' : 'Deactivated'); }
  };

  const handleDeleteSvc = async (id) => {
    if (!confirm('Delete?')) return;
    const res = await fetch(`${API}/admin/service-coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { setSvcCoupons(p => p.filter(c => c._id !== id)); toast.success('Deleted'); }
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setCoupons(data.coupons);
    } catch (e) {}
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) return toast.error('Code and discount value required');
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          appliesTo: form.appliesTo,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : 0,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiryDate: form.expiryDate || null
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Coupon created!');
        setForm(EMPTY);
        setShowForm(false);
        fetchCoupons();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch (e) { toast.error('Something went wrong'); }
    setSaving(false);
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API}/admin/coupons/${id}/toggle`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.map(c => c._id === id ? data.coupon : c));
        toast.success(data.coupon.isActive ? 'Activated' : 'Deactivated');
      }
    } catch (e) { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(`${API}/admin/coupons/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) { setCoupons(prev => prev.filter(c => c._id !== id)); toast.success('Deleted'); }
    } catch (e) { toast.error('Failed'); }
  };

  const filtered = coupons.filter(c =>
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (c) => {
    const now = new Date();
    const expired = c.expiryDate && new Date(c.expiryDate) < now;
    const limitReached = c.maxUses !== null && c.usedCount >= c.maxUses;
    if (!c.isActive) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Inactive</span>;
    if (expired) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">Expired</span>;
    if (limitReached) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600">Limit Reached</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Active</span>;
  };

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500";
  const lbl = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <AdminLayout title="Admin Coupons" subtitle="Global coupons — apply to all venues">
      <PermissionGuard permission="coupons">

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl overflow-hidden shadow-sm">
          <button onClick={() => setActiveTab('venues')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'venues' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            Venue Coupons
          </button>
          <button onClick={() => setActiveTab('services')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'services' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            Service Coupons
          </button>
        </div>

        {activeTab === 'venues' && (<>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by code..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <button onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Coupon'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-soft">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary-600" /> Create Global Coupon
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={lbl}>Code *</label>
                <input className={inp} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20" required />
              </div>
              <div>
                <label className={lbl}>Applies To *</label>
                <select className={inp} value={form.appliesTo} onChange={e => setForm(p => ({ ...p, appliesTo: e.target.value }))}>
                  <option value="total">Total (Venue + Amenities)</option>
                  <option value="platformFee">Platform Fee Only</option>
                  <option value="amenities">Amenities Only</option>
                  <option value="baseAmount">Base Amount Only</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Discount Type *</label>
                <select className={inp} value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₹)</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Discount Value *</label>
                <input type="number" min="0" className={inp} value={form.discountValue}
                  onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                  placeholder={form.discountType === 'percentage' ? '10' : '500'} required />
              </div>
              {form.discountType === 'percentage' && (
                <div>
                  <label className={lbl}>Max Discount (₹)</label>
                  <input type="number" min="0" className={inp} value={form.maxDiscount}
                    onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))} placeholder="Optional cap" />
                </div>
              )}
              <div>
                <label className={lbl}>Min Booking Amount (₹)</label>
                <input type="number" min="0" className={inp} value={form.minBookingAmount}
                  onChange={e => setForm(p => ({ ...p, minBookingAmount: e.target.value }))} placeholder="0 = no minimum" />
              </div>
              <div>
                <label className={lbl}>Max Uses</label>
                <input type="number" min="1" className={inp} value={form.maxUses}
                  onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="Blank = unlimited" />
              </div>
              <div>
                <label className={lbl}>Expiry Date</label>
                <input type="date" className={inp} value={form.expiryDate}
                  onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY); }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Code</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Venue</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Applies To</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Min Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Uses</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Expiry</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No coupons yet. Create one above.</td></tr>
              ) : filtered.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 font-black text-primary-600 tracking-wider text-sm">
                      <Tag className="w-3.5 h-3.5" />{c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.venue
                      ? <><p className="font-semibold text-slate-800 text-xs">{c.venue.businessName}</p><p className="text-[10px] text-gray-400">{c.venue.location?.city}</p></>
                      : <span className="text-xs text-indigo-600 font-semibold">🌐 All Venues</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.appliesTo === 'platformFee' ? 'bg-blue-100 text-blue-700' :
                      c.appliesTo === 'amenities' ? 'bg-green-100 text-green-700' :
                      c.appliesTo === 'baseAmount' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {c.appliesTo === 'platformFee' ? 'Platform Fee' :
                       c.appliesTo === 'amenities' ? 'Amenities' :
                       c.appliesTo === 'baseAmount' ? 'Base Amount' : 'Total'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}`
                      : `₹${c.discountValue}`} off
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {c.minBookingAmount > 0 ? `₹${c.minBookingAmount}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(c)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(c._id)} title={c.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-lg transition-colors ${c.isActive ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}>
                        {c.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(c._id)} title="Delete"
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </>)} {/* end venues tab */}

      {/* ── SERVICE COUPONS TAB ── */}
      {activeTab === 'services' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">{svcCoupons.length} service coupon(s)</p>
            <button onClick={() => setShowSvcForm(p => !p)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors">
              {showSvcForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showSvcForm ? 'Cancel' : 'New Service Coupon'}
            </button>
          </div>

          {showSvcForm && (
            <form onSubmit={handleCreateSvc} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-soft">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-purple-600" />Create Service Coupon</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={lbl}>Service (blank = all services)</label>
                  <select className={inp} value={svcForm.serviceId} onChange={e => setSvcForm(p => ({ ...p, serviceId: e.target.value }))}>
                    <option value="">All Services (Global)</option>
                    {allServices.map(s => <option key={s._id} value={s._id}>{s.title} — {s.vendor?.name}</option>)}
                  </select>
                </div>
                <div><label className={lbl}>Code *</label><input className={inp} value={svcForm.code} onChange={e => setSvcForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SVC20" required /></div>
                <div><label className={lbl}>Type *</label><select className={inp} value={svcForm.discountType} onChange={e => setSvcForm(p => ({ ...p, discountType: e.target.value }))}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (₹)</option></select></div>
                <div><label className={lbl}>Value *</label><input type="number" min="0" className={inp} value={svcForm.discountValue} onChange={e => setSvcForm(p => ({ ...p, discountValue: e.target.value }))} required /></div>
                {svcForm.discountType === 'percentage' && <div><label className={lbl}>Max Discount (₹)</label><input type="number" min="0" className={inp} value={svcForm.maxDiscount} onChange={e => setSvcForm(p => ({ ...p, maxDiscount: e.target.value }))} /></div>}
                <div><label className={lbl}>Min Booking (₹)</label><input type="number" min="0" className={inp} value={svcForm.minBookingAmount} onChange={e => setSvcForm(p => ({ ...p, minBookingAmount: e.target.value }))} /></div>
                <div><label className={lbl}>Max Uses</label><input type="number" min="1" className={inp} value={svcForm.maxUses} onChange={e => setSvcForm(p => ({ ...p, maxUses: e.target.value }))} /></div>
                <div><label className={lbl}>Expiry Date</label><input type="date" className={inp} value={svcForm.expiryDate} onChange={e => setSvcForm(p => ({ ...p, expiryDate: e.target.value }))} /></div>
              </div>
              <div className="mt-4 flex gap-3">
                <button type="submit" disabled={svcSaving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{svcSaving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
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
                {svcLoading ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
                : svcCoupons.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No service coupons yet.</td></tr>
                : svcCoupons.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="font-black text-purple-600 tracking-wider text-sm flex items-center gap-1"><Tag className="w-3 h-3" />{c.code}</span></td>
                    <td className="px-4 py-3 text-xs">{c.service ? <><p className="font-semibold">{c.service.title}</p><p className="text-gray-400">{c.service.category}</p></> : <span className="text-indigo-600 font-semibold">🌐 All Services</span>}</td>
                    <td className="px-4 py-3 text-xs">{c.serviceVendor ? <><p className="font-semibold">{c.serviceVendor.name}</p><p className="text-gray-400">{c.serviceVendor.email}</p></> : <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-xs">{c.discountType === 'percentage' ? `${c.discountValue}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}` : `₹${c.discountValue}`} off</td>
                    <td className="px-4 py-3 text-xs">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3">{getStatusBadge(c)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggleSvc(c._id)} className={`p-1.5 rounded-lg transition-colors ${c.isActive ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}>
                          {c.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDeleteSvc(c._id)} className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      </PermissionGuard>
    </AdminLayout>
  );
}
