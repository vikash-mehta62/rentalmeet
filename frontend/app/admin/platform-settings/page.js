'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Percent, Save, Settings as SettingsIcon, Calculator, Upload, X, Building2, Briefcase, Plus, Trash2, Layers, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceCategories } from '@/data/serviceData';
import InvoiceDownload from '@/components/booking/InvoiceDownload';

const DEFAULT_VENUE_COST_SLABS = [
  { label: 'Up to ₹10,000', minCost: 0, maxCost: 10000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: '₹10,001 – ₹20,000', minCost: 10001, maxCost: 20000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: '₹20,001 – ₹30,000', minCost: 20001, maxCost: 30000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: '₹30,001 – ₹50,000', minCost: 30001, maxCost: 50000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: '₹50,001 – ₹1,00,000', minCost: 50001, maxCost: 100000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: 'Above ₹1,00,000', minCost: 100001, maxCost: null, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 }
];

const DEFAULT_VENUE = {
  venueCGST: 9,
  venueSGST: 9,
  venueHSN: '9973',
  platformFeeType: 'percentage',
  platformFeeValue: 5,
  platformFeePercentage: 5,
  platformCGST: 9,
  platformSGST: 9
};

const DEFAULT_SVC = {
  serviceCGST: 9,
  serviceSGST: 9,
  serviceHSN: '',
  servicePlatformFee: 5,
  servicePlatformCGST: 9,
  servicePlatformSGST: 9,
  serviceCategoryRates: []
};

export default function PlatformSettings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('venues'); // 'venues' | 'services'
  const [settings, setSettings] = useState({ ...DEFAULT_VENUE, ...DEFAULT_SVC });
  const [venue, setVenue] = useState(DEFAULT_VENUE);
  const [venueCostSlabs, setVenueCostSlabs] = useState(DEFAULT_VENUE_COST_SLABS);
  const [svc, setSvc] = useState(DEFAULT_SVC);
  const [gstSignatureFile, setGstSignatureFile] = useState(null);
  const [platformSignatureFile, setPlatformSignatureFile] = useState(null);
  const [gstSignaturePreview, setGstSignaturePreview] = useState(null);
  const [platformSignaturePreview, setPlatformSignaturePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Live calculator amount
  const [testBookingAmount, setTestBookingAmount] = useState(15000);

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

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
          venueHSN: data.settings.venueHSN ?? '9973',
          platformFeeType: data.settings.platformFeeType ?? 'percentage',
          platformFeeValue: data.settings.platformFeeValue ?? data.settings.platformFeePercentage ?? 5,
          platformFeePercentage: data.settings.platformFeeType === 'fixed' ? 0 : (data.settings.platformFeePercentage ?? data.settings.platformFeeValue ?? 5),
          platformCGST: data.settings.platformCGST ?? 9,
          platformSGST: data.settings.platformSGST ?? 9,
        });
        if (Array.isArray(data.settings.venueCostSlabs) && data.settings.venueCostSlabs.length > 0) {
          setVenueCostSlabs(data.settings.venueCostSlabs);
        } else {
          setVenueCostSlabs(DEFAULT_VENUE_COST_SLABS);
        }
        setSvc({
          serviceCGST: data.settings.serviceCGST ?? 9,
          serviceSGST: data.settings.serviceSGST ?? 9,
          serviceHSN: data.settings.serviceHSN ?? '',
          servicePlatformFee: data.settings.servicePlatformFee ?? 5,
          servicePlatformCGST: data.settings.servicePlatformCGST ?? data.settings.platformCGST ?? 9,
          servicePlatformSGST: data.settings.servicePlatformSGST ?? data.settings.platformSGST ?? 9,
          serviceCategoryRates: data.settings.serviceCategoryRates ?? [],
        });
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSlab = (index, field, value) => {
    setVenueCostSlabs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      // Venue fields
      Object.entries(venue).forEach(([k, v]) => formData.append(k, v));
      // Venue cost slabs array
      formData.append('venueCostSlabs', JSON.stringify(venueCostSlabs));

      // Service fields
      formData.append('serviceCGST', svc.serviceCGST);
      formData.append('serviceSGST', svc.serviceSGST);
      formData.append('serviceHSN', svc.serviceHSN);
      formData.append('servicePlatformFee', svc.servicePlatformFee);
      formData.append('servicePlatformCGST', svc.servicePlatformCGST);
      formData.append('servicePlatformSGST', svc.servicePlatformSGST);
      formData.append('serviceCategoryRates', JSON.stringify(svc.serviceCategoryRates));
      if (gstSignatureFile) formData.append('gstInvoiceSignature', gstSignatureFile);
      if (platformSignatureFile) formData.append('platformInvoiceSignature', platformSignatureFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Platform fee settings saved successfully!');
        setGstSignatureFile(null);
        setPlatformSignatureFile(null);
        setGstSignaturePreview(null);
        setPlatformSignaturePreview(null);
        fetchSettings();
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
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

  // Preview calc using dynamic slabs
  const calcVenue = (amt = testBookingAmount) => {
    const cgst = amt * (venue.venueCGST || 0) / 100;
    const sgst = amt * (venue.venueSGST || 0) / 100;

    // Find matching slab
    const matchingSlab = venueCostSlabs.find(slab => {
      const min = Number(slab.minCost || 0);
      const max = slab.maxCost !== null && slab.maxCost !== undefined && slab.maxCost > 0 ? Number(slab.maxCost) : Infinity;
      return amt >= min && amt <= max;
    }) || {
      feeType: venue.platformFeeType,
      feeValue: venue.platformFeeValue,
      cgst: venue.platformCGST,
      sgst: venue.platformSGST,
      label: 'Default Global'
    };

    const pFee = matchingSlab.feeType === 'fixed'
      ? (matchingSlab.feeValue || 0)
      : amt * (matchingSlab.feeValue || 0) / 100;
    const pCgst = pFee * (matchingSlab.cgst || 0) / 100;
    const pSgst = pFee * (matchingSlab.sgst || 0) / 100;

    return {
      amt,
      cgst,
      sgst,
      venueTotal: amt + cgst + sgst,
      slabLabel: matchingSlab.label,
      feeType: matchingSlab.feeType,
      feeValue: matchingSlab.feeValue,
      cgstRate: matchingSlab.cgst,
      sgstRate: matchingSlab.sgst,
      pFee,
      pCgst,
      pSgst,
      pTotal: pFee + pCgst + pSgst,
      total: amt + cgst + sgst + pFee + pCgst + pSgst
    };
  };

  const calcSvc = (amt = 10000, catId = '') => {
    const rate = getCatRate(catId);
    const cgst = amt * (rate?.cgst ?? svc.serviceCGST) / 100;
    const sgst = amt * (rate?.sgst ?? svc.serviceSGST) / 100;
    const pFee = amt * (rate?.platformFee ?? svc.servicePlatformFee) / 100;
    const pCgstPct = rate?.platformCGST ?? svc.servicePlatformCGST;
    const pSgstPct = rate?.platformSGST ?? svc.servicePlatformSGST;
    const pCgst = pFee * (pCgstPct || 0) / 100;
    const pSgst = pFee * (pSgstPct || 0) / 100;
    return { amt, cgst, sgst, svcTotal: amt + cgst + sgst, pFee, pCgst, pSgst, pTotal: pFee + pCgst + pSgst, total: amt + cgst + sgst + pFee + pCgst + pSgst };
  };

  const ve = calcVenue(testBookingAmount);
  const se = calcSvc();

  const inp = 'w-full px-3 py-2 text-center font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none';

  if (loading) {
    return (
      <AdminLayout title="Platform Fee" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Fee" subtitle="Manage Venue Cost Slabs & Vendor Service Platform Fees">
      <PermissionGuard permission="platformSettings">

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setTab('venues')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${tab === 'venues' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Building2 className="w-4 h-4" /> Venues (Cost Slabs System)
          </button>
          <button
            onClick={() => setTab('services')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${tab === 'services' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Briefcase className="w-4 h-4" /> Vendor Services
          </button>
        </div>

        {/* ── VENUES TAB (COST SLABS SYSTEM) ── */}
        {tab === 'venues' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">

              {/* 1. Category / Cost-wise Platform Fee System */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary-600" />
                      Platform Fee — Category-wise / Cost-slab System
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Venue की booking cost के हिसाब से Platform Fee, CGST % और SGST % सेट करें।
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-full">
                    6 Slabs Active
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 font-bold uppercase text-[11px] border-b">
                        <th className="py-3 px-3">Venue Cost (₹)</th>
                        <th className="py-3 px-3 text-center">Fee Type</th>
                        <th className="py-3 px-3 text-center">Platform Fee</th>
                        <th className="py-3 px-3 text-center">CGST %</th>
                        <th className="py-3 px-3 text-center">SGST %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {venueCostSlabs.map((slab, i) => (
                        <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-3 font-semibold text-gray-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                              <span className="text-sm font-bold">{slab.label}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 block ml-3.5">
                              {slab.maxCost ? `₹${slab.minCost.toLocaleString()} to ₹${slab.maxCost.toLocaleString()}` : `₹${slab.minCost.toLocaleString()}+`}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <select
                              value={slab.feeType}
                              onChange={e => updateSlab(i, 'feeType', e.target.value)}
                              className="px-2 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option value="percentage">% Percent</option>
                              <option value="fixed">₹ Fixed</option>
                            </select>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="relative inline-block w-24">
                              <input
                                type="number"
                                min="0"
                                step={slab.feeType === 'fixed' ? '1' : '0.1'}
                                value={slab.feeValue}
                                onChange={e => updateSlab(i, 'feeValue', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-center font-bold text-xs border-2 border-gray-200 rounded-lg focus:border-primary-500 outline-none"
                              />
                              <span className="absolute right-2 top-2 text-[10px] font-bold text-gray-400 pointer-events-none">
                                {slab.feeType === 'fixed' ? '₹' : '%'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={slab.cgst}
                              onChange={e => updateSlab(i, 'cgst', parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1.5 text-center font-bold text-xs border-2 border-gray-200 rounded-lg focus:border-primary-500 outline-none"
                            />
                          </td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={slab.sgst}
                              onChange={e => updateSlab(i, 'sgst', parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1.5 text-center font-bold text-xs border-2 border-gray-200 rounded-lg focus:border-primary-500 outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                  <span className="font-bold">ℹ️ Note:</span>
                  <span>
                    The booking subtotal automatically falls into its matching cost slab. If a venue has configured a custom platform fee override in venue settings, that override takes precedence.
                  </span>
                </div>
              </div>

              {/* 2. Global Fallback & Venue GST Settings */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">⚙️</span> Default Venue GST & Global Platform Fee Fallback
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  These rates are applied if a venue is registered for GST, and for bookings where no slab matches.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Venue GST (Applies ONLY if Venue has GSTIN) */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Venue GST Rates (Venue Invoice)</h4>
                    <p className="text-[11px] text-gray-500 mb-3">Only applied if venue owner has GST number in profile.</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">CGST %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={venue.venueCGST}
                          onChange={e => setVenue(p => ({ ...p, venueCGST: parseFloat(e.target.value) || 0 }))}
                          className={inp}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">SGST %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={venue.venueSGST}
                          onChange={e => setVenue(p => ({ ...p, venueSGST: parseFloat(e.target.value) || 0 }))}
                          className={inp}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">HSN Code</label>
                        <input
                          type="text"
                          value={venue.venueHSN}
                          onChange={e => setVenue(p => ({ ...p, venueHSN: e.target.value }))}
                          placeholder="9973"
                          className="w-full px-2 py-2 border-2 border-gray-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Global Fallback Platform Fee */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Global Platform Fee (Fallback)</h4>
                    <p className="text-[11px] text-gray-500 mb-3">Used when booking cost is outside configured slabs.</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fee Type</label>
                        <select
                          value={venue.platformFeeType}
                          onChange={e => setVenue(p => ({ ...p, platformFeeType: e.target.value }))}
                          className="w-full px-2 py-2 text-xs font-bold border-2 border-gray-300 rounded-lg outline-none bg-white"
                        >
                          <option value="percentage">% Percentage</option>
                          <option value="fixed">₹ Fixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fee Value</label>
                        <input
                          type="number"
                          min="0"
                          step={venue.platformFeeType === 'fixed' ? '1' : '0.1'}
                          value={venue.platformFeeValue}
                          onChange={e => setVenue(p => ({ ...p, platformFeeValue: parseFloat(e.target.value) || 0 }))}
                          className={inp}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">CGST on Fee %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={venue.platformCGST}
                          onChange={e => setVenue(p => ({ ...p, platformCGST: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 text-center font-bold text-xs border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5">SGST on Fee %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={venue.platformSGST}
                          onChange={e => setVenue(p => ({ ...p, platformSGST: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 text-center font-bold text-xs border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Invoice Signatures */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-lg">✍️</span> Invoice Signatures
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'GST/Venue Invoice Signature', file: gstSignatureFile, preview: gstSignaturePreview, existing: settings.gstInvoiceSignature, setFile: setGstSignatureFile, setPreview: setGstSignaturePreview },
                    { label: 'Platform Invoice Signature', file: platformSignatureFile, preview: platformSignaturePreview, existing: settings.platformInvoiceSignature, setFile: setPlatformSignatureFile, setPreview: setPlatformSignaturePreview },
                  ].map(({ label, file, preview, existing, setFile, setPreview }) => (
                    <div key={label} className="p-3 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-3 hover:border-primary-400 transition-colors text-center text-xs text-gray-500">
                          <Upload className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                          <span className="truncate block">{file ? file.name : 'Choose image'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
                        </label>
                        {(preview || existing) && (
                          <div className="relative flex-shrink-0">
                            <img src={preview || existing} alt="" className="w-20 h-14 object-contain border border-gray-200 rounded bg-white" />
                            {preview && (
                              <button onClick={() => { setFile(null); setPreview(null); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving Settings...' : 'Save All Platform Fee Settings'}
              </button>
            </div>

            {/* Right Column: Live Slab Calculator & Preview */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-green-500" /> Live Slab Calculator
                  </h3>
                  <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded">
                    Interactive
                  </span>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Enter Venue Booking Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="500"
                      value={testBookingAmount}
                      onChange={e => setTestBookingAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 border-2 border-primary-300 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none text-base"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[5000, 15000, 25000, 40000, 75000, 150000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTestBookingAmount(amt)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${testBookingAmount === amt ? 'bg-primary-500 text-white border-primary-500 font-bold' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                        ₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Matching Slab Badge */}
                <div className="p-2.5 mb-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
                  <span className="font-semibold">Matching Slab:</span>
                  <span className="font-bold px-2 py-0.5 bg-amber-200 rounded text-amber-950">
                    {ve.slabLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Venue Invoice Card */}
                  <div className="bg-blue-50/70 rounded-xl p-3.5 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-blue-900">📄 Venue Invoice</p>
                      <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">If Venue Has GST</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div className="flex justify-between">
                        <span>Venue Rental</span>
                        <span>₹{ve.amt.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CGST ({venue.venueCGST}%)</span>
                        <span>₹{ve.cgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({venue.venueSGST}%)</span>
                        <span>₹{ve.sgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-blue-950 border-t border-blue-200 pt-1.5 mt-1">
                        <span>Venue Total</span>
                        <span>₹{ve.venueTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Platform Invoice Card */}
                  <div className="bg-purple-50/70 rounded-xl p-3.5 border border-purple-200">
                    <p className="text-xs font-bold text-purple-900 mb-2">📄 Platform Invoice</p>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div className="flex justify-between">
                        <span>
                          Platform Fee ({ve.feeType === 'fixed' ? `Fixed ₹${ve.feeValue}` : `${ve.feeValue}%`})
                        </span>
                        <span>₹{ve.pFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CGST on Fee ({ve.cgstRate}%)</span>
                        <span>₹{ve.pCgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST on Fee ({ve.sgstRate}%)</span>
                        <span>₹{ve.pSgst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-purple-950 border-t border-purple-200 pt-1.5 mt-1">
                        <span>Platform Total</span>
                        <span>₹{ve.pTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Grand Total */}
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 text-white shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-emerald-100 font-bold">Customer Total</p>
                        <p className="text-xs text-emerald-100/80">Venue + Platform Fee</p>
                      </div>
                      <span className="text-2xl font-black">₹{ve.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Sample Invoice Download */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Download Sample Invoice</p>
                    <InvoiceDownload
                      booking={{
                        bookingNumber: 'SAMPLE-001',
                        status: 'confirmed',
                        paymentStatus: 'paid',
                        bookingDate: new Date().toISOString(),
                        startTime: '09:00 AM',
                        endTime: '05:00 PM',
                        bookingType: 'fullday',
                        amount: ve.total,
                        createdAt: new Date().toISOString(),
                        venue: {
                          businessName: 'Sample Venue',
                          location: { city: 'Bhopal', area: 'MP Nagar' },
                          ownerInfo: { hasGST: true, gstNumber: '23AAAAA0000A1Z5' },
                          documents: {}
                        },
                        customer: { name: 'Sample Customer', email: 'customer@example.com' },
                        customerDetails: { phone: '9999999999', eventType: 'Corporate Meeting', guestCount: 50 },
                        paymentDetails: { razorpay_payment_id: 'pay_sample123', razorpay_order_id: 'order_sample123', paidAt: new Date().toISOString() },
                        priceBreakdown: {
                          basePrice: ve.amt,
                          subtotal: ve.amt,
                          venueCGST: ve.cgst,
                          venueSGST: ve.sgst,
                          venueCGSTRate: venue.venueCGST,
                          venueSGSTRate: venue.venueSGST,
                          gst: ve.cgst + ve.sgst,
                          platformFee: ve.pFee,
                          platformFeeType: ve.feeType,
                          platformFeeValue: ve.feeValue,
                          platformFeeRate: ve.feeValue,
                          platformFeePercentage: ve.feeType === 'percentage' ? ve.feeValue : 0,
                          platformFeeCGST: ve.pCgst,
                          platformFeeSGST: ve.pSgst,
                          platformFeeGST: ve.pCgst + ve.pSgst,
                          platformFeeTotal: ve.pTotal,
                          discount: 0,
                          total: ve.total
                        },
                        selectedAmenities: { basic: [], beverages: [], refreshmentFood: [], lunchThalis: [], additional: [] }
                      }}
                      userRole="admin"
                    />
                  </div>
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
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">CGST on Fee %</label><input type="number" min="0" max="100" step="0.1" value={svc.servicePlatformCGST} onChange={e => setSvc(p => ({ ...p, servicePlatformCGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">SGST on Fee %</label><input type="number" min="0" max="100" step="0.1" value={svc.servicePlatformSGST} onChange={e => setSvc(p => ({ ...p, servicePlatformSGST: parseFloat(e.target.value) || 0 }))} className={inp} /></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">These rates are independent from venue platform fee rates</p>
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
                  {[[`Platform Fee (${svc.servicePlatformFee}%)`, se.pFee], [`CGST (${svc.servicePlatformCGST}%)`, se.pCgst], [`SGST (${svc.servicePlatformSGST}%)`, se.pSgst]].map(([l, v]) => (
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
