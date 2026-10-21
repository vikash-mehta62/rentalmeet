'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import VendorLayout from '@/components/vendor/VendorLayout';
import {
  Save, Building2, User, Phone, Mail, MapPin, CreditCard, ShieldCheck, AlertCircle, FileText
} from 'lucide-react';
import { State, City } from 'country-state-city';
import toast from 'react-hot-toast';

export default function VendorProfilePage() {
  const { user, token, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('business');

  // Business & GST Details
  const [businessInfo, setBusinessInfo] = useState({
    companyName: '',
    hasGST: false,
    gstNumber: '',
    legalName: '',
    panNumber: '',
    category: ''
  });

  // Personal Info
  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    altPhone: ''
  });

  // Address
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Bank Details
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });

  const stateOptions = useMemo(() => State.getStatesOfCountry('IN'), []);
  const selectedStateCode = useMemo(() => {
    const matched = stateOptions.find(s => s.name === address.state);
    return matched?.isoCode || '';
  }, [address.state, stateOptions]);

  const cityOptions = useMemo(() => {
    return selectedStateCode ? City.getCitiesOfState('IN', selectedStateCode) : [];
  }, [selectedStateCode]);

  useEffect(() => {
    if (token) fetchVendorProfile();
  }, [token]);

  const fetchVendorProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const p = data.profile || {};
        const u = data.user || user || {};

        setBusinessInfo({
          companyName: p.businessInfo?.companyName || u.companyName || '',
          hasGST: Boolean(p.businessInfo?.hasGST || p.businessInfo?.gstNumber || u.gstNumber),
          gstNumber: p.businessInfo?.gstNumber || u.gstNumber || '',
          legalName: p.businessInfo?.legalName || u.name || '',
          panNumber: p.businessInfo?.panNumber || u.panNumber || '',
          category: p.businessInfo?.category || ''
        });

        setBasicInfo({
          fullName: p.basicInfo?.fullName || u.name || '',
          email: u.email || '',
          phone: p.basicInfo?.phone || u.phone || '',
          altPhone: p.basicInfo?.altPhone || ''
        });

        setAddress({
          street: p.address?.street || u.address || '',
          city: p.address?.city || u.city || '',
          state: p.address?.state || u.state || '',
          pincode: p.address?.pincode || u.pincode || ''
        });

        setBankDetails({
          accountHolderName: p.bankDetails?.accountHolderName || '',
          accountNumber: p.bankDetails?.accountNumber || '',
          ifscCode: p.bankDetails?.ifscCode || '',
          bankName: p.bankDetails?.bankName || ''
        });

        if (data.user) {
          updateUser(data.user);
        }
      } else {
        toast.error('Failed to load profile');
      }
    } catch {
      toast.error('Error fetching vendor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (businessInfo.hasGST && !businessInfo.gstNumber.trim()) {
      return toast.error('Please enter your 15-digit GSTIN number');
    }
    if (businessInfo.hasGST && businessInfo.gstNumber.trim().length !== 15) {
      return toast.error('GSTIN must be exactly 15 characters');
    }

    setSaving(true);
    try {
      const payload = {
        businessInfo: {
          companyName: businessInfo.companyName.trim(),
          hasGST: businessInfo.hasGST,
          gstNumber: businessInfo.hasGST ? businessInfo.gstNumber.trim().toUpperCase() : '',
          legalName: businessInfo.legalName.trim(),
          panNumber: businessInfo.panNumber.trim().toUpperCase(),
          category: businessInfo.category
        },
        basicInfo: {
          fullName: basicInfo.fullName.trim(),
          phone: basicInfo.phone.trim(),
          altPhone: basicInfo.altPhone.trim()
        },
        address: {
          street: address.street.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim()
        },
        bankDetails: {
          accountHolderName: bankDetails.accountHolderName.trim(),
          accountNumber: bankDetails.accountNumber.trim(),
          ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
          bankName: bankDetails.bankName.trim()
        }
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Vendor profile & GST details updated successfully!');
        if (data.user) updateUser(data.user);
        fetchVendorProfile();
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch {
      toast.error('Network error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white transition-all';

  if (loading) {
    return (
      <VendorLayout title="My Profile" subtitle="Loading profile...">
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout title="My Profile" subtitle="Manage your Business, GST & Contact Information">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Profile Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-md">
              {(businessInfo.companyName || basicInfo.fullName || 'V').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {businessInfo.companyName || basicInfo.fullName || 'Vendor Profile'}
                </h2>
                {businessInfo.hasGST ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> GST Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    Non-GST Registered
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {basicInfo.email} · {basicInfo.phone || 'No phone'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white rounded-t-2xl overflow-hidden shadow-sm">
          {[
            { id: 'business', label: 'Business & GST Details', icon: Building2 },
            { id: 'personal', label: 'Personal & Contact', icon: User },
            { id: 'address', label: 'Address Information', icon: MapPin },
            { id: 'bank', label: 'Bank Details', icon: CreditCard },
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
                  active
                    ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">

          {/* TAB 1: Business & GST Information */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  Business & GST Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  अगर आपके पास GSTIN नंबर है तो इसे दर्ज करें। GST नंबर होने पर ही Customer Service Invoices पर GST लगेगा।
                </p>
              </div>

              {/* GST Toggle Card */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">GST Registration Status</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    क्या आपका बिजनेस GST के अंतर्गत रजिस्टर्ड है?
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={businessInfo.hasGST}
                    onChange={(e) => setBusinessInfo(p => ({
                      ...p,
                      hasGST: e.target.checked,
                      gstNumber: e.target.checked ? p.gstNumber : ''
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {businessInfo.hasGST ? (
                <div className="p-4 bg-primary-50/50 rounded-xl border border-primary-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        15-Digit GSTIN Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="e.g. 23AAAAA0000A1Z5"
                        value={businessInfo.gstNumber}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, gstNumber: e.target.value.toUpperCase().trim() })}
                        className={`${inp} uppercase font-mono font-bold tracking-wider`}
                        required={businessInfo.hasGST}
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        Customer Invoices will generate with CGST + SGST under this GSTIN.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Legal Business Name (As on GST Certificate)
                      </label>
                      <input
                        type="text"
                        placeholder="Legal Entity Name"
                        value={businessInfo.legalName}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, legalName: e.target.value })}
                        className={inp}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. AAAAA0000A"
                        value={businessInfo.panNumber}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, panNumber: e.target.value.toUpperCase().trim() })}
                        className={`${inp} uppercase font-mono font-bold`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Company / Trade Name
                      </label>
                      <input
                        type="text"
                        placeholder="Trade Name shown to customers"
                        value={businessInfo.companyName}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, companyName: e.target.value })}
                        className={inp}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-bold">Non-GST Registered Supply</p>
                    <p className="mt-0.5">
                      आपकी सेवाओं के बिलिंग में GST नहीं लगाया जाएगा (0% GST / Composition Scheme / Non-taxable Supply).
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Display Business / Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Catering Services"
                    value={businessInfo.companyName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, companyName: e.target.value })}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary Service Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Catering, Photography, Decor"
                    value={businessInfo.category}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, category: e.target.value })}
                    className={inp}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Personal & Contact */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" />
                  Personal & Contact Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">Vendor representative contact information.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={basicInfo.fullName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                    className={inp}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address (Account)</label>
                  <input
                    type="email"
                    value={basicInfo.email}
                    disabled
                    className={`${inp} bg-gray-100 text-gray-500 cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Phone Number *</label>
                  <input
                    type="tel"
                    value={basicInfo.phone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                    className={inp}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Alternate Phone Number</label>
                  <input
                    type="tel"
                    value={basicInfo.altPhone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, altPhone: e.target.value })}
                    className={inp}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Address */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  Address Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">Registered address for billing and invoices.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address</label>
                <textarea
                  rows={2}
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="Office / Shop / Workshop Address"
                  className={inp}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value, city: '' })}
                    className={inp}
                  >
                    <option value="">Select State</option>
                    {stateOptions.map(s => (
                      <option key={s.isoCode} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <select
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className={inp}
                  >
                    <option value="">Select City</option>
                    {cityOptions.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    placeholder="e.g. 462001"
                    className={inp}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Bank Details */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                  Bank Account Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Settlements and service booking payouts will be transferred to this account.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                    placeholder="Name as in Bank Passbook"
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    placeholder="Bank Account Number"
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase().trim() })}
                    placeholder="e.g. SBIN0001234"
                    className={`${inp} uppercase font-mono font-bold`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    placeholder="e.g. State Bank of India"
                    className={inp}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              * Required fields. Profile updates will reflect across invoices immediately.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>

        </form>

      </div>
    </VendorLayout>
  );
}
