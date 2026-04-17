'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Percent, Save, Settings as SettingsIcon, Calculator, Upload, X, Building2, Briefcase, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceCategories } from '@/data/serviceData';

const DEFAULT_VENUE = { venueCGST: 9, venueSGST: 9, venueHSN: '', platformFeePercentage: 5, platformCGST: 9, platformSGST: 9 };
const DEFAULT_SVC   = { serviceCGST: 9, serviceSGST: 9, serviceHSN: '', servicePlatformFee: 5, serviceCategoryRates: [] };

export default function PlatformSettings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('venues'); // 'venues' | 'services'
  const [settings, setSettings] = useState({ ...DEFAULT_VENUE, ...DEFAULT_SVC });
  const [venue, setVenue] = useState(DEFAULT_VENUE);
  const [svc, setSvc] = useState(DEFAULT_SVC);
  const [gstSignatureFile, setGstSignatureFile] = useState(null);
  const [platformSignatureFile, setPlatformSignatureFile] = useState(null);
  const [gstSignaturePreview, setGstSignaturePreview] = useState(null);
  const [platformSignaturePreview, setPlatformSignaturePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (token) fetchSettings(); }, [token]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setVenue({
          venueCGST: data.settings.venueCGST ?? 9,
          venueSGST: data.settings.venueSGST ?? 9,
          venueHSN: data.settings.venueHSN ?? '',
          platformFeePercentage: data.settings.platformFeePercentage ?? 5,
          platformCGST: data.settings.platformCGST ?? 9,
          platformSGST: data.settings.platformSGST ?? 9,
        });
        setSvc({
          serviceCGST: data.settings.serviceCGST ?? 9,
          serviceSGST: data.settings.serviceSGST ?? 9,
          serviceHSN: data.settings.serviceHSN ?? '',
          servicePlatformFee: data.settings.servicePlatformFee ?? 5,
          serviceCategoryRates: data.settings.serviceCategoryRates ?? [],
        });
      }
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      // Venue fields
      Object.entries(venue).forEach(([k, v]) => formData.append(k, v));
      // Service fields
      formData.append('serviceCGST', svc.serviceCGST);
      formData.append('serviceSGST', svc.serviceSGST);
      formData.append('serviceHSN', svc.serviceHSN);
      formData.append('servicePlatformFee', svc.servicePlatformFee);
      formData.append('serviceCategoryRates', JSON.stringify(svc.serviceCategoryRates));
      if (gstSignatureFile) formData.append('gstInvoiceSignature', gstSignatureFile);
      if (platformSignatureFile) formData.append('platformInvoiceSignature', platformSignatureFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved!');
        setGstSignatureFile(null); setPlatformSignatureFile(null);
        setGstSignaturePreview(null); setPlatformSignaturePreview(null);
        fetchSettings();
      } else toast.error(data.message);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  // Category rate helpers
  const getCatRate = (catId) => svc.serviceCategoryRates.find(r => r.category === catId);
  const setCatRate = (catId, field, value) => {
    setSvc(p => {
      const rates = [...p.serviceCategoryRates];
      const idx = rates.findIndex(r => r.category === catId);
      if (idx >= 0) rates[idx] = { ...rates[idx], [field]: value };
      else rates.push({ category: catId, cgst: p.serviceCGST, sgst: p.serviceSGST, platformFee: p.servicePlatformFee, hsn: '', [field]: value });
      return { ...p, serviceCategoryRates: rates };
    });
  };
  const removeCatRate = (catId) => setSvc(p => ({ ...p, serviceCategoryRates: p.serviceCategoryRates.filter(r => r.category !== catId) }));
  const addCatRate = (catId) => {
    if (getCatRate(catId)) return;
    setSvc(p => ({ ...p, serviceCategoryRates: [...p.serviceCategoryRates, { category: catId, cgst: p.serviceCGST, sgst: p.serviceSGST, platformFee: p.servicePlatformFee, hsn: '' }] }));
  };

  // Preview calc
  const calcVenue = (amt = 10000) => {
    const cgst = amt * (venue.venueCGST || 0) / 100;
    const sgst = amt * (venue.venueSGST || 0) / 100;
    const pFee = amt * (venue.platformFeePercentage || 0) / 100;
    const pCgst = pFee * (venue.platformCGST || 0) / 100;
    const pSgst = pFee * (venue.platformSGST || 0) / 100;
    return { amt, cgst, sgst, venueTotal: amt + cgst + sgst, pFee, pCgst, pSgst, pTotal: pFee + pCgst + pSgst, total: amt + cgst + sgst + pFee + pCgst + pSgst };
  };
  const calcSvc = (amt = 10000, catId = '') => {
    const rate = getCatRate(catId);
    const cgst = amt * (rate?.cgst ?? svc.serviceCGST) / 100;
    const sgst = amt * (rate?.sgst ?? svc.serviceSGST) / 100;
    const pFee = amt * (rate?.platformFee ?? svc.servicePlatformFee) / 100;
    const pCgstPct = rate?.platformCGST ?? venue.platformCGST;
    const pSgstPct = rate?.platformSGST ?? venue.platformSGST;
    const pCgst = pFee * (pCgstPct || 0) / 100;
    const pSgst = pFee * (pSgstPct || 0) / 100;
    return { amt, cgst, sgst, svcTotal: amt + cgst + sgst, pFee, pCgst, pSgst, pTotal: pFee + pCgst + pSgst, total: amt + cgst + sgst + pFee + pCgst + pSgst };
  };
  const ve = calcVenue();
  const se = calcSvc();

  const inp = 'w-full px-3 py-2 text-center font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none';

  if (loading) return (
    <AdminLayout title="Platform Settings" subtitle="Loading...">
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Platform Settings" subtitle="Manage GST & Platform Fee">
      <PermissionGuard permission="platformSettings">

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl overflow-hidden shadow-sm">
          <button onClick={() => setTab('venues')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${tab === 'venues' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Building2 className="w-4 h-4" /> Venues
          </button>
          <button onClick={() => setTab('services')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${tab === 'services' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Briefcase className="w-4 h-4" /> Vendor Services
          </button>
        </div>

        {/* ── VENUES TAB ── */}
        {tab === 'venues' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              {/* Venue GST */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span className="text-lg">1️⃣</span> Venue GST (for Venue Invoice)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">CGST %</label><input type="number" min="0" max="100" step="0.1" value={venue.venueCGST} onChange={e => setVenue(p => ({ ...p, venueCGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">SGST %</label><input type="number" min="0" max="100" step="0.1" value={venue.venueSGST} onChange={e => setVenue(p => ({ ...p, venueSGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">HSN Code</label><input type="text" value={venue.venueHSN} onChange={e => setVenue(p => ({ ...p, venueHSN: e.target.value }))} placeholder="9973" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
                </div>
              </div>
              {/* Platform Fee */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span className="text-lg">2️⃣</span> Platform Fee (for Platform Invoice)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Platform Fee %</label><input type="number" min="0" max="100" step="0.1" value={venue.platformFeePercentage} onChange={e => setVenue(p => ({ ...p, platformFeePercentage: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">CGST on Fee %</label><input type="number" min="0" max="100" step="0.1" value={venue.platformCGST} onChange={e => setVenue(p => ({ ...p, platformCGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">SGST on Fee %</label><input type="number" min="0" max="100" step="0.1" value={venue.platformSGST} onChange={e => setVenue(p => ({ ...p, platformSGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                </div>
              </div>
              {/* Signatures */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span className="text-lg">3️⃣</span> Invoice Signatures</h3>
                {[
                  { label: 'GST/Venue Invoice Signature', file: gstSignatureFile, preview: gstSignaturePreview, existing: settings.gstInvoiceSignature, setFile: setGstSignatureFile, setPreview: setGstSignaturePreview },
                  { label: 'Platform Invoice Signature', file: platformSignatureFile, preview: platformSignaturePreview, existing: settings.platformInvoiceSignature, setFile: setPlatformSignatureFile, setPreview: setPlatformSignaturePreview },
                ].map(({ label, file, preview, existing, setFile, setPreview }) => (
                  <div key={label} className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-3 hover:border-primary-400 transition-colors text-center text-xs text-gray-500">
                        <Upload className="w-4 h-4 mx-auto mb-1" />{file ? file.name : 'Choose image'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
                      </label>
                      {(preview || existing) && (
                        <div className="relative">
                          <img src={preview || existing} alt="" className="w-20 h-14 object-contain border border-gray-200 rounded" />
                          {preview && <button onClick={() => { setFile(null); setPreview(null); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Venue Settings'}
              </button>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-green-500" /> Preview (₹10,000 booking)</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-bold text-blue-800 mb-2">📄 Venue Invoice</p>
                  {[['Booking Amount', ve.amt], [`CGST (${venue.venueCGST}%)`, ve.cgst], [`SGST (${venue.venueSGST}%)`, ve.sgst]].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-sm text-gray-700"><span>{l}</span><span>₹{v.toLocaleString()}</span></div>
                  ))}
                  <div className="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-2 mt-2"><span>Venue Total</span><span>₹{ve.venueTotal.toLocaleString()}</span></div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-xs font-bold text-purple-800 mb-2">📄 Platform Invoice</p>
                  {[[`Platform Fee (${venue.platformFeePercentage}%)`, ve.pFee], [`CGST (${venue.platformCGST}%)`, ve.pCgst], [`SGST (${venue.platformSGST}%)`, ve.pSgst]].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-sm text-gray-700"><span>{l}</span><span>₹{v.toLocaleString()}</span></div>
                  ))}
                  <div className="flex justify-between font-bold text-purple-900 border-t border-purple-200 pt-2 mt-2"><span>Platform Total</span><span>₹{ve.pTotal.toLocaleString()}</span></div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-300 flex justify-between items-center">
                  <span className="font-bold text-green-900">Customer Pays</span>
                  <span className="text-2xl font-black text-green-900">₹{ve.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SERVICES TAB ── */}
        {tab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              {/* Default service rates */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><span className="text-lg">1️⃣</span> Default Service Rates</h3>
                <p className="text-xs text-gray-400 mb-4">Applies to all categories unless overridden below</p>

                {/* Service GST */}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Service GST (on service amount)</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">CGST %</label><input type="number" min="0" max="100" step="0.1" value={svc.serviceCGST} onChange={e => setSvc(p => ({ ...p, serviceCGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">SGST %</label><input type="number" min="0" max="100" step="0.1" value={svc.serviceSGST} onChange={e => setSvc(p => ({ ...p, serviceSGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">HSN Code</label><input type="text" value={svc.serviceHSN} onChange={e => setSvc(p => ({ ...p, serviceHSN: e.target.value }))} placeholder="998596" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
                </div>

                {/* Platform Fee + GST on fee */}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Platform Fee (on service amount)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Platform Fee %</label><input type="number" min="0" max="100" step="0.1" value={svc.servicePlatformFee} onChange={e => setSvc(p => ({ ...p, servicePlatformFee: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">CGST on Fee %</label><input type="number" min="0" max="100" step="0.1" value={venue.platformCGST} onChange={e => setVenue(p => ({ ...p, platformCGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">SGST on Fee %</label><input type="number" min="0" max="100" step="0.1" value={venue.platformSGST} onChange={e => setVenue(p => ({ ...p, platformSGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">CGST/SGST on platform fee is shared with Venues tab</p>
              </div>

              {/* Per-category overrides */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><span className="text-lg">2️⃣</span> Category-wise Overrides</h3>
                <p className="text-xs text-gray-400 mb-4">Set different rates for specific categories</p>

                {/* Add category */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {serviceCategories.filter(c => !getCatRate(c.id)).map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button key={cat.id} onClick={() => addCatRate(cat.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">
                        <Plus className="w-3 h-3" /><Icon className="w-3 h-3" style={{ color: cat.iconColor }} />{cat.label}
                      </button>
                    );
                  })}
                </div>

                {svc.serviceCategoryRates.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No category overrides — default rates apply to all</p>
                ) : (
                  <div className="space-y-3">
                    {svc.serviceCategoryRates.map(rate => {
                      const cat = serviceCategories.find(c => c.id === rate.category);
                      const Icon = cat?.icon;
                      return (
                        <div key={rate.category} className="border border-gray-200 rounded-xl p-3" style={{ borderLeftColor: cat?.iconColor, borderLeftWidth: 3 }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                              {Icon && <Icon className="w-3.5 h-3.5" style={{ color: cat?.iconColor }} />}{cat?.label || rate.category}
                            </span>
                            <button onClick={() => removeCatRate(rate.category)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-1">
                            <div><label className="block text-[10px] text-gray-400 mb-0.5">Svc CGST %</label><input type="number" min="0" max="100" step="0.1" value={rate.cgst} onChange={e => setCatRate(rate.category, 'cgst', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 text-center text-xs font-bold border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none" /></div>
                            <div><label className="block text-[10px] text-gray-400 mb-0.5">Svc SGST %</label><input type="number" min="0" max="100" step="0.1" value={rate.sgst} onChange={e => setCatRate(rate.category, 'sgst', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 text-center text-xs font-bold border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none" /></div>
                            <div><label className="block text-[10px] text-gray-400 mb-0.5">Platform Fee %</label><input type="number" min="0" max="100" step="0.1" value={rate.platformFee} onChange={e => setCatRate(rate.category, 'platformFee', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 text-center text-xs font-bold border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none" /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-[10px] text-gray-400 mb-0.5">CGST on Fee %</label><input type="number" min="0" max="100" step="0.1" value={rate.platformCGST ?? venue.platformCGST} onChange={e => setCatRate(rate.category, 'platformCGST', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 text-center text-xs font-bold border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none" /></div>
                            <div><label className="block text-[10px] text-gray-400 mb-0.5">SGST on Fee %</label><input type="number" min="0" max="100" step="0.1" value={rate.platformSGST ?? venue.platformSGST} onChange={e => setCatRate(rate.category, 'platformSGST', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 text-center text-xs font-bold border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none" /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Service Settings'}
              </button>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-green-500" /> Preview (₹10,000 service)</h3>
              <p className="text-xs text-gray-400 mb-3">Using default rates (no category override)</p>
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-bold text-blue-800 mb-2">📄 Service Invoice</p>
                  {[['Service Amount', se.amt], [`CGST (${svc.serviceCGST}%)`, se.cgst], [`SGST (${svc.serviceSGST}%)`, se.sgst]].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-sm text-gray-700"><span>{l}</span><span>₹{Math.round(v).toLocaleString()}</span></div>
                  ))}
                  <div className="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-2 mt-2"><span>Service Total</span><span>₹{Math.round(se.svcTotal).toLocaleString()}</span></div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-xs font-bold text-purple-800 mb-2">📄 Platform Invoice</p>
                  {[[`Platform Fee (${svc.servicePlatformFee}%)`, se.pFee], [`CGST (${venue.platformCGST}%)`, se.pCgst], [`SGST (${venue.platformSGST}%)`, se.pSgst]].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-sm text-gray-700"><span>{l}</span><span>₹{Math.round(v).toLocaleString()}</span></div>
                  ))}
                  <div className="flex justify-between font-bold text-purple-900 border-t border-purple-200 pt-2 mt-2"><span>Platform Total</span><span>₹{Math.round(se.pTotal).toLocaleString()}</span></div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-300 flex justify-between items-center">
                  <span className="font-bold text-green-900">Customer Pays</span>
                  <span className="text-2xl font-black text-green-900">₹{Math.round(se.total).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-xs text-yellow-800">
                <p className="font-bold mb-1">💡 How it works:</p>
                <p>• GST (CGST+SGST) is charged on the service amount</p>
                <p>• Platform fee is charged separately on service amount</p>
                <p>• Platform fee also has GST (using venue platform GST rates)</p>
                <p>• Category overrides take priority over default rates</p>
              </div>
            </div>
          </div>
        )}

      </PermissionGuard>
    </AdminLayout>
  );
}
