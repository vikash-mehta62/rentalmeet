'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import EmployeeLayout from '@/components/employee/EmployeeLayout';
import {
  User, Lock, Eye, EyeOff, FileText, CreditCard,
  Users, Copy, CheckCircle, AlertCircle, Upload, ExternalLink, Gift, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'info',       label: 'My Info' },
  { id: 'personal',   label: 'Personal' },
  { id: 'education',  label: 'Education' },
  { id: 'documents',  label: 'Documents' },
  { id: 'bank',       label: 'Bank Details' },
  { id: 'referrals',  label: 'My Referrals' },
  { id: 'password',   label: 'Password' },
];

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
  </div>
);

export default function EmployeeProfile() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fullUser, setFullUser] = useState(null);
  const [copyMessage, setCopyMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState({});
  const [uploadedUrls, setUploadedUrls] = useState({});

  // Form state — all editable fields
  const [form, setForm] = useState({
    // personal
    name: '', phone: '', alternatePhone: '', address: '', city: '', state: '', pincode: '',
    fatherOrHusbandName: '', dateOfBirth: '', bloodGroup: '', maritalStatus: '',
    emergencyName: '', emergencyRelationship: '', emergencyPhone: '',
    // education
    tenthBoard: '', tenthYear: '', tenthPercentage: '',
    twelfthBoard: '', twelfthYear: '', twelfthPercentage: '',
    graduationDegree: '', graduationUniversity: '', graduationYear: '', graduationPercentage: '',
    pgDegree: '', pgUniversity: '', pgYear: '', pgPercentage: '',
    // documents
    aadhaarNumber: '', panNumber: '',
    // bank
    accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '',
    // password
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const fetchProfile = () => {
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const u = data.user;
          setFullUser(u);
          const d = u.employeeDetails || {};
          const q = d.qualification || {};
          const docs = d.documents || {};
          const bank = d.bankDetails || {};
          const ec = d.emergencyContact || {};
          setForm(prev => ({
            ...prev,
            name: u.name || '', phone: u.phone || '', alternatePhone: u.alternatePhone || '',
            address: u.address || '', city: u.city || '', state: u.state || '', pincode: u.pincode || '',
            fatherOrHusbandName: d.fatherOrHusbandName || '',
            dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().split('T')[0] : '',
            bloodGroup: d.bloodGroup || '', maritalStatus: d.maritalStatus || '',
            emergencyName: ec.name || '', emergencyRelationship: ec.relationship || '', emergencyPhone: ec.phone || '',
            tenthBoard: q.tenth?.board || '', tenthYear: q.tenth?.year || '', tenthPercentage: q.tenth?.percentage || '',
            twelfthBoard: q.twelfth?.board || '', twelfthYear: q.twelfth?.year || '', twelfthPercentage: q.twelfth?.percentage || '',
            graduationDegree: q.graduation?.degree || '', graduationUniversity: q.graduation?.university || '',
            graduationYear: q.graduation?.year || '', graduationPercentage: q.graduation?.percentage || '',
            pgDegree: q.postGraduation?.degree || '', pgUniversity: q.postGraduation?.university || '',
            pgYear: q.postGraduation?.year || '', pgPercentage: q.postGraduation?.percentage || '',
            aadhaarNumber: docs.aadhaarNumber || '', panNumber: docs.panNumber || '',
            accountHolderName: bank.accountHolderName || '', accountNumber: bank.accountNumber || '',
            ifscCode: bank.ifscCode || '', bankName: bank.bankName || '', branchName: bank.branchName || '',
          }));
          // Pre-fill uploaded URLs from existing data
          setUploadedUrls({
            photo: d.photo || null,
            aadhaarFront: docs.aadhaarFront || null, aadhaarBack: docs.aadhaarBack || null,
            panCard: docs.panCard || null,
            tenthCertificate: q.tenth?.certificate || null,
            twelfthCertificate: q.twelfth?.certificate || null,
            graduationCertificate: q.graduation?.certificate || null,
            pgCertificate: q.postGraduation?.certificate || null,
          });
        }
      });
  };

  useEffect(() => {
    if (!token || user?.role !== 'employee') { router.push('/login'); return; }
    fetchProfile().finally(() => setFetching(false));
  }, [token]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // Upload file to cloudinary via backend
  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setUploading(p => ({ ...p, [field]: true }));
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'employees');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
      });
      const data = await res.json();
      if (data.success) {
        setUploadedUrls(p => ({ ...p, [field]: data.url }));
        toast.success('Uploaded!');
      } else toast.error(data.message || 'Upload failed');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(p => ({ ...p, [field]: false })); }
  };

  const selfUpdate = async (payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/employee-self-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) { await fetchProfile(); toast.success('Saved!'); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const handlePersonal = (e) => {
    e.preventDefault();
    selfUpdate({
      name: form.name, phone: form.phone, alternatePhone: form.alternatePhone,
      address: form.address, city: form.city, state: form.state, pincode: form.pincode,
      fatherOrHusbandName: form.fatherOrHusbandName, dateOfBirth: form.dateOfBirth,
      bloodGroup: form.bloodGroup, maritalStatus: form.maritalStatus,
      emergencyContact: { name: form.emergencyName, relationship: form.emergencyRelationship, phone: form.emergencyPhone }
    });
  };

  const handleEducation = (e) => {
    e.preventDefault();
    selfUpdate({
      qualification: {
        tenth: { board: form.tenthBoard, year: form.tenthYear, percentage: form.tenthPercentage, certificate: uploadedUrls.tenthCertificate },
        twelfth: { board: form.twelfthBoard, year: form.twelfthYear, percentage: form.twelfthPercentage, certificate: uploadedUrls.twelfthCertificate },
        graduation: { degree: form.graduationDegree, university: form.graduationUniversity, year: form.graduationYear, percentage: form.graduationPercentage, certificate: uploadedUrls.graduationCertificate },
        postGraduation: { degree: form.pgDegree, university: form.pgUniversity, year: form.pgYear, percentage: form.pgPercentage, certificate: uploadedUrls.pgCertificate }
      }
    });
  };

  const handleDocuments = (e) => {
    e.preventDefault();
    selfUpdate({
      documents: {
        aadhaarNumber: form.aadhaarNumber, aadhaarFront: uploadedUrls.aadhaarFront, aadhaarBack: uploadedUrls.aadhaarBack,
        panNumber: form.panNumber, panCard: uploadedUrls.panCard
      }
    });
  };

  const handleBank = (e) => {
    e.preventDefault();
    selfUpdate({
      bankDetails: {
        accountHolderName: form.accountHolderName, accountNumber: form.accountNumber,
        ifscCode: form.ifscCode, bankName: form.bankName, branchName: form.branchName
      }
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      });
      const data = await res.json();
      if (data.success) { toast.success('Password changed!'); setForm(p => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' })); }
      else toast.error(data.message || 'Failed');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const buildReferralLink = (target) => {
    const code = fullUser?.referralCode || '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const baseMap = {
      customer: `${origin}/register-customer`,
      venue: `${origin}/register?role=owner`,
      vendor: `${origin}/register?role=vendor`
    };
    const baseUrl = baseMap[target] || baseMap.customer;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}ref=${encodeURIComponent(code)}`;
  };

  const handleCopyLink = async (target) => {
    const link = buildReferralLink(target);
    try {
      await navigator.clipboard.writeText(link);
      setCopyMessage(`${target}-copied`);
      setTimeout(() => setCopyMessage(''), 1800);
    } catch {
      setCopyMessage('copy-failed');
      setTimeout(() => setCopyMessage(''), 1800);
    }
  };

  const handleShareLink = async (target) => {
    const link = buildReferralLink(target);
    const titleMap = {
      customer: 'Register as Customer',
      venue: 'Register as Venue Owner',
      vendor: 'Register as Vendor Partner'
    };
    const text = `Use my referral code (${fullUser?.referralCode || ''}) and join RentalMeet.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: titleMap[target], text, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        setCopyMessage(`${target}-shared`);
        setTimeout(() => setCopyMessage(''), 1800);
      }
    } catch {}
  };

  if (!token || user?.role !== 'employee') return null;

  if (fetching) return (
    <EmployeeLayout activePage="profile">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    </EmployeeLayout>
  );

  const d = fullUser?.employeeDetails || {};
  const docs = d.documents || {};
  const qual = d.qualification || {};
  const bank = d.bankDetails || {};

  const inp = "w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm";
  const lbl = "block text-sm font-medium text-gray-700 mb-1";
  const sec = "text-sm font-bold text-gray-700 mb-3 mt-1";

  // File upload field component (inline)
  const FileField = ({ label, field, accept = "image/*,.pdf" }) => (
    <div>
      <label className={lbl}>{label}</label>
      <input type="file" accept={accept} onChange={(e) => handleFileUpload(e, field)}
        className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 border border-gray-300 rounded-xl px-2 py-1.5" />
      {uploading[field] && <p className="text-xs text-blue-600 mt-1">⏳ Uploading...</p>}
      {uploadedUrls[field] && !uploading[field] && (
        <a href={uploadedUrls[field]} target="_blank" rel="noopener noreferrer"
          className="text-xs text-green-600 mt-1 inline-flex items-center gap-1 font-medium">
          <CheckCircle className="w-3 h-3" /> Uploaded — <span className="underline">View</span>
        </a>
      )}
    </div>
  );

  const SaveBtn = () => (
    <button type="submit" disabled={loading} className="w-full btn-primary py-2.5 font-semibold disabled:opacity-50 mt-2">
      {loading ? 'Saving...' : 'Save Changes'}
    </button>
  );


  return (
    <EmployeeLayout activePage="profile">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0">
            {d.photo
              ? <img src={d.photo} alt="photo" className="w-14 h-14 rounded-full object-cover" />
              : fullUser?.name?.charAt(0)?.toUpperCase() || 'E'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{fullUser?.name}</h1>
            <p className="text-sm text-gray-500">{d.position || 'Employee'}{d.department ? ` · ${d.department}` : ''}</p>
            <p className="text-xs text-gray-400">{fullUser?.userId}</p>
          </div>
        </div>

        {/* Tabs + Content */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px
                  ${activeTab === id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5">

            {/* ── MY INFO (read-only) ── */}
            {activeTab === 'info' && (
              <div className="space-y-5">
                <div>
                  <p className={sec}>Employment (set by admin)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Employee ID" value={fullUser?.userId} />
                    <Field label="Position" value={d.position} />
                    <Field label="Department" value={d.department} />
                    <Field label="Employment Type" value={d.employmentType} />
                    <Field label="Joining Date" value={d.joiningDate ? new Date(d.joiningDate).toLocaleDateString('en-IN') : null} />
                    <Field label="Experience (yrs)" value={d.previousExperience} />
                  </div>
                </div>
                <hr />
                <div>
                  <p className={sec}>Personal</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Title" value={d.title} />
                    <Field label="Full Name" value={fullUser?.name} />
                    <Field label="Gender" value={d.gender} />
                    <Field label="Father / Husband Name" value={d.fatherOrHusbandName} />
                    <Field label="Date of Birth" value={d.dateOfBirth ? new Date(d.dateOfBirth).toLocaleDateString('en-IN') : null} />
                    <Field label="Blood Group" value={d.bloodGroup} />
                    <Field label="Marital Status" value={d.maritalStatus} />
                    <Field label="Email" value={fullUser?.email} />
                    <Field label="Phone" value={fullUser?.phone} />
                    <Field label="Alternate Phone" value={fullUser?.alternatePhone} />
                    <Field label="Address" value={fullUser?.address} />
                    <Field label="City" value={fullUser?.city} />
                    <Field label="State" value={fullUser?.state} />
                    <Field label="Pincode" value={fullUser?.pincode} />
                  </div>
                </div>
                <hr />
                <div>
                  <p className={sec}>Emergency Contact</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Name" value={d.emergencyContact?.name} />
                    <Field label="Relationship" value={d.emergencyContact?.relationship} />
                    <Field label="Phone" value={d.emergencyContact?.phone} />
                  </div>
                </div>
                <hr />
                <div>
                  <p className={sec}>Education</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="10th Board" value={qual.tenth?.board} />
                    <Field label="10th Year" value={qual.tenth?.year} />
                    <Field label="10th %" value={qual.tenth?.percentage} />
                    <Field label="12th Board" value={qual.twelfth?.board} />
                    <Field label="12th Year" value={qual.twelfth?.year} />
                    <Field label="12th %" value={qual.twelfth?.percentage} />
                    <Field label="Graduation Degree" value={qual.graduation?.degree} />
                    <Field label="University" value={qual.graduation?.university} />
                    <Field label="Graduation Year" value={qual.graduation?.year} />
                    <Field label="PG Degree" value={qual.postGraduation?.degree} />
                    <Field label="PG University" value={qual.postGraduation?.university} />
                    <Field label="PG Year" value={qual.postGraduation?.year} />
                  </div>
                </div>
                <hr />
                <div>
                  <p className={sec}>Bank Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Account Holder" value={bank.accountHolderName} />
                    <Field label="Account Number" value={bank.accountNumber} />
                    <Field label="IFSC" value={bank.ifscCode} />
                    <Field label="Bank Name" value={bank.bankName} />
                    <Field label="Branch" value={bank.branchName} />
                  </div>
                </div>
              </div>
            )}

            {/* ── PERSONAL EDIT ── */}
            {activeTab === 'personal' && (
              <form onSubmit={handlePersonal} className="space-y-5">
            
                <div>
                  <p className={sec}>Basic Info</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={lbl}>Full Name</label><input name="name" value={form.name} onChange={handleChange} className={inp} required /></div>
                    <div><label className={lbl}>Phone</label><input name="phone" value={form.phone} onChange={handleChange} maxLength="10" className={inp} /></div>
                    <div><label className={lbl}>Alternate Phone</label><input name="alternatePhone" value={form.alternatePhone} onChange={handleChange} maxLength="10" className={inp} /></div>
                    <div><label className={lbl}>Date of Birth</label><input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} className={inp} /></div>
                    <div><label className={lbl}>Blood Group</label>
                      <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className={inp}>
                        <option value="">Select</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div><label className={lbl}>Marital Status</label>
                      <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className={inp}>
                        <option value="">Select</option>
                        {['Single','Married','Divorced','Widowed'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2"><label className={lbl}>Father / Husband Name</label><input name="fatherOrHusbandName" value={form.fatherOrHusbandName} onChange={handleChange} className={inp} /></div>
                  </div>
                </div>
                <div>
                  <p className={sec}>Address</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><label className={lbl}>Address</label><input name="address" value={form.address} onChange={handleChange} className={inp} /></div>
                    <div><label className={lbl}>City</label><input name="city" value={form.city} onChange={handleChange} className={inp} /></div>
                    <div><label className={lbl}>State</label><input name="state" value={form.state} onChange={handleChange} className={inp} /></div>
                    <div><label className={lbl}>Pincode</label><input name="pincode" value={form.pincode} onChange={handleChange} maxLength="6" className={inp} /></div>
                  </div>
                </div>
                <div>
                  <p className={sec}>Emergency Contact</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={lbl}>Name</label><input name="emergencyName" value={form.emergencyName} onChange={handleChange} className={inp} /></div>
                    <div><label className={lbl}>Relationship</label><input name="emergencyRelationship" value={form.emergencyRelationship} onChange={handleChange} className={inp} /></div>
                    <div><label className={lbl}>Phone</label><input name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} maxLength="10" className={inp} /></div>
                  </div>
                </div>
                <SaveBtn />
              </form>
            )}

            {/* ── EDUCATION EDIT ── */}
            {activeTab === 'education' && (
              <form onSubmit={handleEducation} className="space-y-5">
                {[
                  { title: '10th', fields: [['tenthBoard','Board'],['tenthYear','Year'],['tenthPercentage','Percentage / CGPA']], certField: 'tenthCertificate' },
                  { title: '12th', fields: [['twelfthBoard','Board'],['twelfthYear','Year'],['twelfthPercentage','Percentage / CGPA']], certField: 'twelfthCertificate' },
                  { title: 'Graduation', fields: [['graduationDegree','Degree'],['graduationUniversity','University'],['graduationYear','Year'],['graduationPercentage','Percentage / CGPA']], certField: 'graduationCertificate' },
                  { title: 'Post Graduation (Optional)', fields: [['pgDegree','Degree'],['pgUniversity','University'],['pgYear','Year'],['pgPercentage','Percentage / CGPA']], certField: 'pgCertificate' },
                ].map(({ title, fields, certField }) => (
                  <div key={title} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className={sec}>{title}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fields.map(([name, label]) => (
                        <div key={name}><label className={lbl}>{label}</label><input name={name} value={form[name]} onChange={handleChange} className={inp} /></div>
                      ))}
                      <div className="md:col-span-2"><FileField label="Certificate (Image / PDF)" field={certField} /></div>
                    </div>
                  </div>
                ))}
                <SaveBtn />
              </form>
            )}

            {/* ── DOCUMENTS EDIT ── */}
            {activeTab === 'documents' && (
              <form onSubmit={handleDocuments} className="space-y-5">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className={sec}>Aadhaar Card</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><label className={lbl}>Aadhaar Number</label><input name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange} maxLength="12" placeholder="XXXXXXXXXXXX" className={inp} /></div>
                    <FileField label="Aadhaar Front" field="aadhaarFront" />
                    <FileField label="Aadhaar Back" field="aadhaarBack" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className={sec}>PAN Card</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={lbl}>PAN Number</label><input name="panNumber" value={form.panNumber} onChange={handleChange} maxLength="10" placeholder="ABCDE1234F" className={inp} /></div>
                    <FileField label="PAN Card Image" field="panCard" />
                  </div>
                </div>
                <SaveBtn />
              </form>
            )}

            {/* ── BANK EDIT ── */}
            {activeTab === 'bank' && (
              <form onSubmit={handleBank} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={lbl}>Account Holder Name</label><input name="accountHolderName" value={form.accountHolderName} onChange={handleChange} className={inp} /></div>
                  <div><label className={lbl}>Account Number</label><input name="accountNumber" value={form.accountNumber} onChange={handleChange} className={inp} /></div>
                  <div><label className={lbl}>IFSC Code</label><input name="ifscCode" value={form.ifscCode} onChange={handleChange} className={inp} /></div>
                  <div><label className={lbl}>Bank Name</label><input name="bankName" value={form.bankName} onChange={handleChange} className={inp} /></div>
                  <div><label className={lbl}>Branch Name</label><input name="branchName" value={form.branchName} onChange={handleChange} className={inp} /></div>
                </div>
                <SaveBtn />
              </form>
            )}

            {/* ── REFERRALS ── */}
            {activeTab === 'referrals' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Referral Code</h3>
                      <p className="text-xs text-white/80">Share & Earn Rewards</p>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
                    <p className="text-xs text-white/80 mb-1">Your Code</p>
                    <p className="text-2xl font-black tracking-wider">{fullUser?.referralCode || 'N/A'}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{fullUser?.referralCount || 0} Referrals</span>
                    </div>
                    <span className="text-xs text-white/80">Copy + Share links</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: 'customer', label: 'Customer to Customer' },
                      { key: 'venue', label: 'Customer to Venue' },
                      { key: 'vendor', label: 'Customer to Vendor' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-2 bg-white/10 rounded-lg px-2.5 py-2">
                        <span className="text-[11px] font-semibold">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(item.key)}
                            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            {copyMessage === `${item.key}-copied` ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareLink(item.key)}
                            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-colors"
                          >
                            <Share2 className="w-3 h-3" />
                            {copyMessage === `${item.key}-shared` ? 'Shared' : 'Share'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {fullUser?.referrals?.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Name</th>
                          <th className="px-4 py-3 text-left">Email</th>
                          <th className="px-4 py-3 text-left">Role</th>
                          <th className="px-4 py-3 text-left">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {fullUser.referrals.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{r.user?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-500">{r.user?.email || 'N/A'}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">{r.user?.role || 'N/A'}</span></td>
                            <td className="px-4 py-3 text-gray-500">{r.joinedAt ? new Date(r.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No referrals yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PASSWORD ── */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm New Password']].map(([name, label]) => (
                  <div key={name}>
                    <label className={lbl}>{label}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} name={name} value={form[name]} onChange={handleChange}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm" required />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
