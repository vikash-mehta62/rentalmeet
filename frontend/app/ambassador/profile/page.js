'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import {
  User,
  Award,
  CreditCard,
  MapPin,
  Share2,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  Save,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function AmbassadorProfilePage() {
  const { token, user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  const [formData, setFormData] = useState({
    parentName: '',
    dateOfBirth: '',
    whatsAppNumber: '',
    currentAddress: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    areaCoverage: '',
    currentOccupation: '',
    companyName: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.profile) {
        setProfile(json.profile);
        const p = json.profile;
        setFormData({
          parentName: p.personalInfo?.parentName || '',
          dateOfBirth: p.personalInfo?.dateOfBirth || '',
          whatsAppNumber: p.personalInfo?.whatsAppNumber || '',
          currentAddress: p.addressDetails?.currentAddress || '',
          city: p.addressDetails?.city || '',
          district: p.addressDetails?.district || '',
          state: p.addressDetails?.state || '',
          pincode: p.addressDetails?.pincode || '',
          areaCoverage: p.addressDetails?.areaCoverage || '',
          currentOccupation: p.professionalDetails?.currentOccupation || '',
          companyName: p.professionalDetails?.companyName || '',
          accountHolderName: p.bankDetails?.accountHolderName || '',
          bankName: p.bankDetails?.bankName || '',
          accountNumber: p.bankDetails?.accountNumber || '',
          ifscCode: p.bankDetails?.ifscCode || '',
          upiId: p.bankDetails?.upiId || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ error: '', success: '' });

    try {
      const body = {
        personalInfo: {
          parentName: formData.parentName,
          dateOfBirth: formData.dateOfBirth,
          whatsAppNumber: formData.whatsAppNumber
        },
        addressDetails: {
          currentAddress: formData.currentAddress,
          city: formData.city,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode,
          areaCoverage: formData.areaCoverage
        },
        professionalDetails: {
          currentOccupation: formData.currentOccupation,
          companyName: formData.companyName
        },
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          upiId: formData.upiId
        }
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({ success: 'Profile updated successfully!', error: '' });
      } else {
        setFeedback({ error: json.message || 'Update failed', success: '' });
      }
    } catch {
      setFeedback({ error: 'Failed to update profile', success: '' });
    } finally {
      setSaving(false);
    }
  };

  const referralCode = user?.referralCode || profile?.ambassadorId || 'RMAMB';
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/register-ambassador?ref=${referralCode}` : '';

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Join the RentalMeet Venue Ambassador Program and earn ₹100-₹200 per verified venue + 25% recurring booking profit share! Apply here: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500';

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Official Ambassador ID Badge Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest rounded-full">
              {profile?.level || 'LV.1'} • {profile?.badge || 'Bronze Explorer'}
            </span>
            <span className="text-xs text-slate-400">Status: {profile?.status?.toUpperCase()}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black">{user?.name}</h1>
          <p className="text-xs font-mono text-primary-400 font-bold">
            Official Partner ID: {profile?.ambassadorId || 'RM-AMB-PENDING'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Verified Venues</p>
            <p className="text-xl font-black text-white">{profile?.totalVenuesApproved || 0}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Wallet Balance</p>
            <p className="text-xl font-black text-green-400">₹{(profile?.walletBalance || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Referral Link & Share Widget */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-primary-600">
          <Share2 className="w-5 h-5" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Ambassador Referral Link</h3>
        </div>
        <p className="text-xs text-slate-500">
          Share your referral link with friends and other partners to invite them to the RentalMeet network.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono select-all"
          />
          <button
            type="button"
            onClick={copyReferral}
            className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            type="button"
            onClick={shareWhatsApp}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          >
            Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Profile &amp; Bank Details
          </h3>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {feedback.error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {feedback.error}
          </div>
        )}

        {feedback.success && (
          <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-center gap-2 border border-green-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {feedback.success}
          </div>
        )}

        {/* Section 1: Personal */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Parent&apos;s Name</label>
              <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Date of Birth</label>
              <input type="text" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">WhatsApp Number</label>
              <input type="text" name="whatsAppNumber" value={formData.whatsAppNumber} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Section 2: Address & Coverage */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Address &amp; Coverage</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Current Address</label>
              <input type="text" name="currentAddress" value={formData.currentAddress} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Coverage Localities</label>
              <input type="text" name="areaCoverage" value={formData.areaCoverage} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">District</label>
              <input type="text" name="district" value={formData.district} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Pin Code</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Section 3: Bank Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bank &amp; UPI Details (For Payouts)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">UPI ID</label>
              <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="e.g. name@upi" className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Account Holder Name</label>
              <input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Bank Name</label>
              <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Account Number</label>
              <input type="password" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">IFSC Code</label>
              <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} className={inputClass + ' uppercase'} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
