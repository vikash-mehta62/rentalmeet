'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  MapPin,
  Share2,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  Save,
  AlertCircle,
  CheckCircle2,
  FileText,
  ExternalLink,
  Award,
  Sparkles
} from 'lucide-react';

export default function AmbassadorProfilePage() {
  const { token, user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  const [formData, setFormData] = useState({
    // Part A: Personal & KYC
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    aadhaarNumber: '',
    panNumber: '',

    // Part B: Address & Coverage
    currentAddress: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    areaCoverage: '',

    // Part C: Professional & Profile
    currentOccupation: '',
    companyName: '',
    profileType: 'Venue Explorer (Part-Time)',

    // Part D: Bank Details
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
        const u = json.user || user;
        setFormData({
          name: p.personalInfo?.fullName || u?.name || '',
          email: p.personalInfo?.email || u?.email || '',
          phone: p.personalInfo?.mobileNumber || u?.phone || '',
          dateOfBirth: p.personalInfo?.dateOfBirth || '',
          gender: p.personalInfo?.gender || 'Male',
          aadhaarNumber: p.personalInfo?.aadhaarNumber || '',
          panNumber: p.personalInfo?.panNumber || '',
          currentAddress: p.addressDetails?.currentAddress || '',
          city: p.addressDetails?.city || '',
          district: p.addressDetails?.district || '',
          state: p.addressDetails?.state || '',
          pincode: p.addressDetails?.pincode || '',
          areaCoverage: p.addressDetails?.areaCoverage || '',
          currentOccupation: p.professionalDetails?.currentOccupation || '',
          companyName: p.professionalDetails?.companyName || '',
          profileType: p.profileType || 'Venue Explorer (Part-Time)',
          accountHolderName: p.bankDetails?.accountHolderName || '',
          bankName: p.bankDetails?.bankName || '',
          accountNumber: p.bankDetails?.accountNumber || '',
          ifscCode: p.bankDetails?.ifscCode || '',
          upiId: p.bankDetails?.upiId || ''
        });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
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
          fullName: formData.name,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          mobileNumber: formData.phone,
          whatsAppNumber: formData.phone,
          aadhaarNumber: formData.aadhaarNumber,
          panNumber: formData.panNumber
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
        profileType: formData.profileType,
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
        setFeedback({ success: 'Ambassador profile updated successfully!', error: '' });
      } else {
        setFeedback({ error: json.message || 'Update failed', success: '' });
      }
    } catch {
      setFeedback({ error: 'Failed to update profile. Please try again.', success: '' });
    } finally {
      setSaving(false);
    }
  };

  const referralCode = profile?.ambassadorId || user?.referralCode || (user?.phone ? `RMA${user.phone.slice(-10)}` : 'RMA');
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/register-ambassador?ref=${referralCode}` : '';

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Join the RentalMeet Venue Ambassador Program! Earn ₹100-₹200 per verified venue listing + 25% recurring booking profit share! Apply here using Partner ID ${referralCode}: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const inputClass =
    'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-slate-800 transition-all';

  // SKELETON LOADER
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse p-4 sm:p-6">
        {/* Header Skeleton */}
        <div className="h-44 rounded-3xl bg-slate-200 dark:bg-slate-800/80 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-6 w-36 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="h-8 w-64 bg-slate-300 dark:bg-slate-700 rounded-xl" />
          </div>
          <div className="h-4 w-48 bg-slate-300 dark:bg-slate-700 rounded-lg" />
        </div>

        {/* Share Skeleton */}
        <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800/80 p-6" />

        {/* Form Skeleton */}
        <div className="rounded-3xl bg-slate-200 dark:bg-slate-800/80 p-8 space-y-6">
          <div className="h-6 w-48 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded-xl" />
            <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded-xl" />
            <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded-xl" />
            <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Official Ambassador ID Badge Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              {profile?.assignedLevel || profile?.level || 'LV.1'} • {profile?.badge || 'Bronze Explorer'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              profile?.applicationStatus === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {profile?.applicationStatus || 'Approved'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black">{formData.name || user?.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Official Partner ID:</span>
            <span className="px-2.5 py-1 rounded-lg bg-primary-950/80 border border-primary-500/40 text-primary-300 font-mono font-black text-xs sm:text-sm">
              {profile?.ambassadorId || referralCode}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 z-10">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Approved Venues</p>
            <p className="text-xl sm:text-2xl font-black text-white">{profile?.totalVenuesApproved || 0}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Wallet Balance</p>
            <p className="text-xl sm:text-2xl font-black text-green-400">₹{(profile?.walletBalance || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Referral Link & Share Widget */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <Share2 className="w-5 h-5" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Ambassador Referral Link</h3>
        </div>
        <p className="text-xs text-slate-500">
          Share your referral link with venue owners and partners to register under your partner network.
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
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Ambassador Details &amp; Bank Settings
            </h2>
            <p className="text-xs text-slate-500">Manage your profile, locality coverage, and payout accounts</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {feedback.error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-3 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {feedback.error}
          </div>
        )}

        {feedback.success && (
          <div className="p-4 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-xs rounded-xl flex items-center gap-3 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            {feedback.success}
          </div>
        )}

        {/* Section 1: Personal & KYC */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
            <User className="w-4 h-4 text-primary-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Part A: Personal Information &amp; KYC</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Full Name (As per Aadhaar) *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Date of Birth *</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass} required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Phone Number (WhatsApp Number) *
              </label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Email Address (Read-Only)</label>
              <input type="email" name="email" value={formData.email} readOnly disabled className={inputClass + ' opacity-75 cursor-not-allowed'} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Aadhaar Card Number *</label>
              <input
                type="text"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={(e) => setFormData((p) => ({ ...p, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                placeholder="12-digit Aadhaar Number"
                maxLength="12"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">PAN Card Number (Optional)</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={(e) => setFormData((p) => ({ ...p, panNumber: e.target.value.toUpperCase().slice(0, 10) }))}
                placeholder="10-digit PAN (e.g. ABCDE1234F)"
                maxLength="10"
                className={inputClass + ' uppercase'}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Profile Type</label>
              <select name="profileType" value={formData.profileType} onChange={handleChange} className={inputClass}>
                <option value="Venue Explorer (Part-Time)">Venue Explorer (Part-Time)</option>
                <option value="City Venue Partner">City Venue Partner</option>
                <option value="Full-Time Venue Acquisition Partner">Full-Time Venue Acquisition Partner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Address & Coverage */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
            <MapPin className="w-4 h-4 text-primary-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Part B: Address &amp; Coverage Area</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Current Address *</label>
              <input type="text" name="currentAddress" value={formData.currentAddress} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Area / Localities You Cover *</label>
              <input type="text" name="areaCoverage" value={formData.areaCoverage} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">State *</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">District</label>
              <input type="text" name="district" value={formData.district} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Pin Code (Optional)</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Section 3: Professional Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Building2 className="w-4 h-4 text-primary-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Part C: Professional Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Current Occupation</label>
              <input type="text" name="currentOccupation" value={formData.currentOccupation} onChange={handleChange} placeholder="e.g. Freelancer / Sales Executive" className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Company Name</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company or Organization" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Section 4: Bank Details for Payouts */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
            <CreditCard className="w-4 h-4 text-primary-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Part D: Bank &amp; UPI Details (Direct Payouts)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">UPI ID (Fastest Transfer)</label>
              <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="e.g. yourname@okhdfcbank" className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Account Holder Name</label>
              <input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} placeholder="Name as per Bank" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Bank Name</label>
              <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. HDFC, SBI, ICICI" className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Account Number</label>
              <input type="password" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Account Number" className={inputClass} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">IFSC Code</label>
              <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="e.g. HDFC0001234" className={inputClass + ' uppercase'} />
            </div>
          </div>
        </div>

        {/* Section 5: Uploaded KYC Documents Status */}
        {profile?.documents && (
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Part E: KYC Documents Status</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Aadhaar Front</p>
                {profile.documents.aadhaarFront || profile.documents.identityProof ? (
                  <a
                    href={profile.documents.aadhaarFront || profile.documents.identityProof}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-green-600 font-bold hover:underline"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> View Front
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Not Uploaded</span>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Aadhaar Back</p>
                {profile.documents.aadhaarBack || profile.documents.identityProofBack ? (
                  <a
                    href={profile.documents.aadhaarBack || profile.documents.identityProofBack}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-green-600 font-bold hover:underline"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> View Back
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Not Uploaded</span>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">PAN Card</p>
                {profile.documents.panCard ? (
                  <a
                    href={profile.documents.panCard}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-green-600 font-bold hover:underline"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> View PAN
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Not Uploaded</span>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Passport Photo</p>
                {profile.documents.passportPhoto ? (
                  <a
                    href={profile.documents.passportPhoto}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-green-600 font-bold hover:underline"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> View Photo
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Not Uploaded</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
