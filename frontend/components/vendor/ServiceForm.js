'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import VendorLayout from './VendorLayout';
import toast from 'react-hot-toast';
import {
  User, Building2, MapPin, IndianRupee, Image, FileText,
  CreditCard, Calendar, CheckCircle2, ChevronRight, ChevronLeft,
  Upload, Plus, X, ArrowLeft
} from 'lucide-react';
import StateCitySelect from './StateCitySelect';
import { serviceCategories } from '@/data/serviceData';

const STEPS = [
  { id: 1, label: 'Contact',      icon: User },
  { id: 2, label: 'Business',     icon: Building2 },
  { id: 3, label: 'Address',      icon: MapPin },
  { id: 4, label: 'Pricing',      icon: IndianRupee },
  { id: 5, label: 'Portfolio',    icon: Image },
  { id: 6, label: 'Documents',    icon: FileText },
  { id: 7, label: 'Bank',         icon: CreditCard },
  { id: 8, label: 'Availability', icon: Calendar },
];

// Same categories as other-services page
const CATEGORIES = serviceCategories.map(c => c.id);

const CATEGORY_UNITS = {
  'Catering & Food':       ['Per Person','Per Plate','Per Unit','Per Item'],
  'Photography & Video':   ['Per Event','Per Day','Per Session','Per Album','Per Unit','Per Night'],
  'Decoration & Flowers':  ['Per Event','Per Arch','Per Table','Per Setup','Per Area','Per Unit','Per Day','Per Night'],
  'Entertainment & Music': ['Per Event','Per Day','Per Session','Per Programme','Per Unit','Per Night'],
  'Event Management':      ['Per Event','Per Day','Per Person','Per Unit'],
  'AV & Tech Equipment':   ['Per Event','Per Day','Per Unit','Per Setup'],
  'Transportation':        ['Per KM','Per Trip','Per Day','Per Night','Per Person','Per Event'],
  'Security Services':     ['Per Guard','Per Bouncer','Per Day','Per Event','Per Person','Per Night'],
  'Celebrity':             ['Per Appearance','Per Event','Per Day','Per Post'],
  'Cleaning Services':     ['Per Event','Per Day','Per Area','Per Unit'],
  'Other':                 ['Per Event','Per Day','Per Hour','Per Person','Per Unit'],
};

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const TERMS = [
  'I/We agree to pay RentalMeet platform fee as per policy',
  'I confirm all information provided is accurate and truthful',
  'I will maintain quality standards as represented in my portfolio',
  'I will respond to booking inquiries within 2 hours',
  'I will honor confirmed bookings and provide services as promised',
  'I have all necessary licenses and permits for my business',
  'I agree to RentalMeet\'s vendor terms and conditions',
  'I agree to receive booking notifications via email/SMS/WhatsApp',
  'I understand that RentalMeet acts as a platform for lead generation and booking',
  'Payouts for services booked through the platform will follow standard billing cycles',
];

const STORAGE_KEY = 'vendor_service_form';
const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-white';
const lbl = 'block text-xs font-semibold text-gray-600 mb-1';
const req = <span className="text-red-500 ml-0.5">*</span>;

const DEFAULT_STATE = {
  step: 1,
  contact: { fullName:'', primaryMobile:'', secondaryMobile:'', role:'owner' },
  biz: { title:'', category:'', companyName:'', brandName:'', experienceYears:'', description:'', specialization:[], specializationInput:'', tags:'' },
  addr: { officeAddress:'', state:null, city:null, area:'', village:'', pincode:'', serviceableAreas:'', website:'', instagram:'', facebook:'' },
  pricing: { startingPrice:'', minimumOrderPrice:'', packages:[{ sno:1, name:'', price:'', unit:'', quantity:'' }] },
  portfolio: { featuredImage:'', images:[], videoLinks:['','',''], previousWorkLinks:['','',''] },
  bizDocs: { registrationCertificate:'', msme:'', gst:'', pan:'', tradeLicense:'', fssai:'' },
  ownerDocs: { aadhaarFront:'', aadhaarBack:'', pan:'', selfie:'' },
  bank: { accountHolderName:'', accountNumber:'', ifsc:'', bankName:'', branchName:'', accountType:'savings', upiId:'', proof:'' },
  avail: DAYS.map(d => ({ day:d, isAvailable:true, startTime:'09:00', endTime:'18:00' })),
  publicHoliday: { isAvailable:false, startTime:'09:00', endTime:'18:00' },
  advanceBooking: '24h',
  customDays: '',
  confirmationHours: 3,
  termsChecked: Array(TERMS.length).fill(false),
};

function FileField({ label, value, onUpload, uploading, required, accept='image/*,.pdf' }) {
  return (
    <div>
      <label className={lbl}>{label}{required && req}</label>
      {value ? (
        <div className="rounded-xl overflow-hidden border-2 border-green-400">
          {/\.(jpg|jpeg|png|webp)$/i.test(value)
            ? <img src={value} alt="" className="w-full h-28 object-contain bg-gray-50" />
            : <div className="flex items-center gap-2 bg-green-50 px-3 py-3"><FileText className="w-5 h-5 text-green-600" /><span className="text-xs text-green-700">Document uploaded</span></div>}
          <div className="flex items-center justify-between px-3 py-1.5 bg-green-600">
            <span className="text-white text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</span>
            <div className="flex gap-3">
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-xs underline">View</a>
              <label className="text-white/80 hover:text-white text-xs underline cursor-pointer">
                Change<input type="file" accept={accept} className="hidden" onChange={e => { const f=e.target.files[0]; if(f) onUpload(f); }} />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
          {uploading
            ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
            : <><Upload className="w-5 h-5 text-gray-400 mb-1" /><span className="text-xs text-gray-400">Click to upload</span><span className="text-[10px] text-gray-300 mt-0.5">JPG, PNG, PDF (max 10MB)</span></>}
          <input type="file" accept={accept} className="hidden" onChange={e => { const f=e.target.files[0]; if(f) onUpload(f); }} />
        </label>
      )}
    </div>
  );
}

export default function ServiceForm({ serviceId }) {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const isEdit = !!serviceId;
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState({});

  // Load from localStorage or defaults
  const [formState, setFormState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY + (serviceId || '_new'));
      return saved ? { ...DEFAULT_STATE, ...JSON.parse(saved) } : DEFAULT_STATE;
    } catch { return DEFAULT_STATE; }
  });

  const { step, contact, biz, addr, pricing, portfolio, bizDocs, ownerDocs, bank, avail, publicHoliday, advanceBooking, customDays, confirmationHours, termsChecked } = formState;

  // Save to localStorage on every change
  const update = useCallback((patch) => {
    setFormState(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY + (serviceId || '_new'), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [serviceId]);

  // Auto-fill contact from logged-in user (only for new service, only if fields are empty)
  useEffect(() => {
    if (isEdit || !user) return;
    setFormState(prev => {
      const c = prev.contact;
      // Only fill if fields are still empty (don't overwrite user's edits)
      if (c.fullName || c.primaryMobile) return prev;
      return {
        ...prev,
        contact: {
          ...c,
          fullName: user.name || '',
          primaryMobile: user.phone || '',
        }
      };
    });
  }, [user, isEdit]);

  const setStep = (s) => update({ step: s });
  const setContact = (v) => update({ contact: typeof v === 'function' ? v(formState.contact) : v });
  const setBiz = (v) => update({ biz: typeof v === 'function' ? v(formState.biz) : v });
  const setAddr = (v) => {
    setFormState(prev => {
      const next = { ...prev, addr: typeof v === 'function' ? v(prev.addr) : v };
      try { localStorage.setItem(STORAGE_KEY + (serviceId || '_new'), JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const setPricing = (v) => update({ pricing: typeof v === 'function' ? v(pricing) : v });
  const setPortfolio = (v) => update({ portfolio: typeof v === 'function' ? v(portfolio) : v });
  const setBizDocs = (v) => update({ bizDocs: typeof v === 'function' ? v(bizDocs) : v });
  const setOwnerDocs = (v) => update({ ownerDocs: typeof v === 'function' ? v(ownerDocs) : v });
  const setBank = (v) => update({ bank: typeof v === 'function' ? v(bank) : v });
  const setAvail = (v) => update({ avail: typeof v === 'function' ? v(avail) : v });
  const setPublicHoliday = (v) => update({ publicHoliday: typeof v === 'function' ? v(publicHoliday) : v });
  const setAdvanceBooking = (v) => update({ advanceBooking: v });
  const setCustomDays = (v) => update({ customDays: v });
  const setConfirmationHours = (v) => update({ confirmationHours: v });
  const setTermsChecked = (v) => update({ termsChecked: typeof v === 'function' ? v(termsChecked) : v });

  // Load existing service for edit
  useEffect(() => {
    if (!isEdit || !token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services/${serviceId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (!d.success) return;
      const s = d.service;
      update({
        contact: s.contactInfo || DEFAULT_STATE.contact,
        biz: { title:s.title||'', category:s.category||'', companyName:s.companyName||'', brandName:s.brandName||'', experienceYears:s.experienceYears||'', description:s.description||'', specialization: Array.isArray(s.specialization) ? s.specialization : (s.specialization ? [s.specialization] : []), specializationInput:'', tags:(s.tags||[]).join(', ') },
        addr: { officeAddress:s.officeAddress||'', state:s.state ? { label:s.state, value:s.state, name:s.state } : null, city:s.city ? { label:s.city, value:s.city, name:s.city } : null, area:s.area||'', village:s.village||'', pincode:s.pincode||'', serviceableAreas:(s.serviceableAreas||[]).join(', '), website:s.website||'', instagram:s.instagram||'', facebook:s.facebook||'' },
        pricing: { startingPrice:s.startingPrice||'', minimumOrderPrice:s.minimumOrderPrice||'', packages:s.packages?.length ? s.packages : DEFAULT_STATE.pricing.packages },
        portfolio: { featuredImage:s.featuredImage||'', images:s.images||[], videoLinks:[...(s.videoLinks||[]),...Array(3).fill('')].slice(0,3), previousWorkLinks:[...(s.previousWorkLinks||[]),...Array(3).fill('')].slice(0,3) },
        bizDocs: s.businessDocs || DEFAULT_STATE.bizDocs,
        ownerDocs: s.ownerDocs || DEFAULT_STATE.ownerDocs,
        bank: s.bankDetails || DEFAULT_STATE.bank,
        avail: s.availability?.length ? s.availability : DEFAULT_STATE.avail,
        publicHoliday: s.publicHoliday || DEFAULT_STATE.publicHoliday,
        advanceBooking: s.advanceBooking || '24h',
      });
    });
  }, [serviceId, token]);

  const uploadFile = async (file, key) => {
    setUploading(p => ({ ...p, [key]: true }));
    const fd = new FormData(); fd.append('file', file); fd.append('folder', 'vendor-services');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
      });
      const data = await res.json();
      if (data.success) return data.url;
      toast.error('Upload failed'); return null;
    } catch { toast.error('Upload failed'); return null; }
    finally { setUploading(p => ({ ...p, [key]: false })); }
  };

  const validateStep = () => {
    if (step === 1 && !contact.fullName) { toast.error('Full name is required'); return false; }
    if (step === 1 && !contact.primaryMobile) { toast.error('Primary mobile is required'); return false; }
    if (step === 2 && !biz.title) { toast.error('Service title is required'); return false; }
    if (step === 2 && !biz.category) { toast.error('Category is required'); return false; }
    if (step === 2 && !biz.companyName) { toast.error('Company name is required'); return false; }
    if (step === 3 && !addr.city) { toast.error('City is required'); return false; }
    if (step === 3 && !addr.state) { toast.error('State is required'); return false; }
    if (step === 4 && !pricing.startingPrice) { toast.error('Starting price is required'); return false; }
    if (step === 6) {
      const hasDoc = bizDocs.registrationCertificate || bizDocs.gst || bizDocs.pan || bizDocs.msme || bizDocs.tradeLicense || bizDocs.fssai;
      if (!hasDoc) { toast.error('Please upload at least one business document'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(Math.min(step + 1, 8));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(Math.max(step - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPayload = () => ({
    contactInfo: contact,
    title: biz.title, category: biz.category, companyName: biz.companyName,
    brandName: biz.brandName, experienceYears: biz.experienceYears ? Number(biz.experienceYears) : undefined,
    description: biz.description, specialization: biz.specialization,
    tags: biz.tags.split(',').map(t => t.trim()).filter(Boolean),
    officeAddress: addr.officeAddress, state: addr.state?.name || addr.state, city: addr.city?.name || addr.city,
    area: addr.area, village: addr.village, pincode: addr.pincode,
    serviceableAreas: addr.serviceableAreas.split(',').map(s => s.trim()).filter(Boolean),
    website: addr.website, instagram: addr.instagram, facebook: addr.facebook,
    startingPrice: pricing.startingPrice ? Number(pricing.startingPrice) : undefined,
    minimumOrderPrice: pricing.minimumOrderPrice ? Number(pricing.minimumOrderPrice) : undefined,
    packages: pricing.packages.filter(p => p.name),
    featuredImage: portfolio.featuredImage, images: portfolio.images,
    videoLinks: portfolio.videoLinks.filter(Boolean),
    previousWorkLinks: portfolio.previousWorkLinks.filter(Boolean),
    businessDocs: bizDocs, ownerDocs, bankDetails: bank,
    availability: avail, publicHoliday, advanceBooking,
    customAdvanceDays: advanceBooking === 'custom' ? Number(customDays) : undefined,
    confirmationHours: Number(confirmationHours) || 3,
    termsAccepted: termsChecked.every(Boolean),
    status: 'pending',
  });

  const handleSubmit = async () => {
    if (!termsChecked.every(Boolean)) { toast.error('Please accept all terms'); return; }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/vendor/services/${serviceId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/vendor/services`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        // Submit for review
        const svcId = data.service._id;
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services/${svcId}/submit`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }
        });
        // Clear localStorage
        try { localStorage.removeItem(STORAGE_KEY + (serviceId || '_new')); } catch {}
        toast.success('Service submitted for review! We\'ll respond in 24-48 hours.');
        router.push('/vendor/services');
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Something went wrong'); }
    finally { setSubmitting(false); }
  };

  const units = CATEGORY_UNITS[biz.category] || CATEGORY_UNITS['Other'];
  const updatePkg = (i, f, v) => setPricing(p => { const pkgs = [...p.packages]; pkgs[i] = { ...pkgs[i], [f]: v }; return { ...p, packages: pkgs }; });
  const updateAvail = (i, f, v) => setAvail(p => { const a = [...p]; a[i] = { ...a[i], [f]: v }; return a; });

  return (
    <VendorLayout title={isEdit ? 'Edit Service' : 'Add New Service'} subtitle={`Step ${step} of ${STEPS.length}`}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/vendor/services')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </button>

        {/* Step bar */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon; const done = step > s.id; const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setStep(s.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${active?'bg-primary-500 text-white':done?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:block">{s.label}</span>
                </button>
                {i < STEPS.length-1 && <div className={`w-3 h-0.5 flex-shrink-0 ${done?'bg-green-400':'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {step===1 && <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 mb-2">Contact Information</h2>
            <div><label className={lbl}>Full Name{req}</label><input className={inp} value={contact.fullName} onChange={e=>setContact(p=>({...p,fullName:e.target.value}))} placeholder="Your full name" /></div>
            <div><label className={lbl}>Primary Mobile{req}</label><div className="flex"><span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-sm text-gray-500">+91</span><input className={inp+' rounded-l-none'} value={contact.primaryMobile} onChange={e=>setContact(p=>({...p,primaryMobile:e.target.value}))} placeholder="10-digit mobile" maxLength={10} /></div></div>
            <div><label className={lbl}>Alternate Mobile</label><div className="flex"><span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-sm text-gray-500">+91</span><input className={inp+' rounded-l-none'} value={contact.secondaryMobile} onChange={e=>setContact(p=>({...p,secondaryMobile:e.target.value}))} placeholder="Optional" maxLength={10} /></div></div>
            <div><label className={lbl}>Your Role{req}</label><select className={inp} value={contact.role} onChange={e=>setContact(p=>({...p,role:e.target.value}))}><option value="owner">Owner</option><option value="manager">Manager</option><option value="representative">Representative</option></select></div>
          </div>}

          {step===2 && <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 mb-2">Business Information</h2>
            <div><label className={lbl}>Service Title{req}</label><input className={inp} value={biz.title} onChange={e=>setBiz(p=>({...p,title:e.target.value}))} placeholder="e.g. Royal Wedding Photography" /></div>
            <div><label className={lbl}>Business / Company Name{req}</label><input className={inp} value={biz.companyName} onChange={e=>setBiz(p=>({...p,companyName:e.target.value}))} /></div>
            <div><label className={lbl}>Brand Name (if different)</label><input className={inp} value={biz.brandName} onChange={e=>setBiz(p=>({...p,brandName:e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Category{req}</label><select className={inp} value={biz.category} onChange={e=>setBiz(p=>({...p,category:e.target.value}))}><option value="">Select</option>{serviceCategories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
              <div><label className={lbl}>Years of Experience{req}</label><input type="number" min="0" className={inp} value={biz.experienceYears} onChange={e=>setBiz(p=>({...p,experienceYears:e.target.value}))} /></div>
            </div>
            <div><label className={lbl}>Service Description{req}</label><textarea className={inp} rows={3} value={biz.description} onChange={e=>setBiz(p=>({...p,description:e.target.value}))} placeholder="Describe your service..." /></div>
            <div>
              <label className={lbl}>Specialization</label>
              <div className="flex gap-2 mb-2">
                <input
                  className={inp}
                  value={biz.specializationInput}
                  onChange={e => setBiz(p => ({ ...p, specializationInput: e.target.value }))}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && biz.specializationInput.trim()) {
                      e.preventDefault();
                      const val = biz.specializationInput.trim().replace(/,$/, '');
                      if (val && !biz.specialization.includes(val)) {
                        setBiz(p => ({ ...p, specialization: [...p.specialization, val], specializationInput: '' }));
                      } else {
                        setBiz(p => ({ ...p, specializationInput: '' }));
                      }
                    }
                  }}
                  placeholder="Type & press Enter to add (e.g. North Indian)"
                />
                <button type="button"
                  onClick={() => {
                    const val = biz.specializationInput.trim();
                    if (val && !biz.specialization.includes(val)) {
                      setBiz(p => ({ ...p, specialization: [...p.specialization, val], specializationInput: '' }));
                    }
                  }}
                  className="px-3 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap">
                  Add
                </button>
              </div>
              {biz.specialization.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {biz.specialization.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {s}
                      <button type="button" onClick={() => setBiz(p => ({ ...p, specialization: p.specialization.filter((_, idx) => idx !== i) }))}
                        className="ml-1 text-primary-400 hover:text-red-500 transition-colors font-bold">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>}

          {step===3 && <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 mb-2">Business Address</h2>
            <div><label className={lbl}>Office / Work Address{req}</label><input className={inp} value={addr.officeAddress} onChange={e=>setAddr(p=>({...p,officeAddress:e.target.value}))} /></div>
            <StateCitySelect
              state={addr.state} city={addr.city} pincode={addr.pincode}
              onStateChange={v=>setAddr(p=>({...p,state:v}))}
              onCityChange={v=>setAddr(p=>({...p,city:v}))}
              onPincodeChange={v=>setAddr(p=>({...p,pincode:v}))}
            />
            <div><label className={lbl}>Village</label><input className={inp} value={addr.village} onChange={e=>setAddr(p=>({...p,village:e.target.value}))} /></div>
            <div><label className={lbl}>Serviceable Areas</label><input className={inp} value={addr.serviceableAreas} onChange={e=>setAddr(p=>({...p,serviceableAreas:e.target.value}))} placeholder="Bhopal, Indore, Gwalior etc." /></div>
            <hr className="border-gray-100" />
            <h3 className="text-sm font-bold text-gray-700">Online Presence</h3>
            <div><label className={lbl}>Website</label><input className={inp} value={addr.website} onChange={e=>setAddr(p=>({...p,website:e.target.value}))} placeholder="https://yourwebsite.com" /></div>
            <div><label className={lbl}>Instagram</label><div className="flex"><span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-sm text-gray-500">@</span><input className={inp+' rounded-l-none'} value={addr.instagram} onChange={e=>setAddr(p=>({...p,instagram:e.target.value}))} /></div></div>
            <div><label className={lbl}>Facebook</label><div className="flex"><span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-sm text-gray-500">/</span><input className={inp+' rounded-l-none'} value={addr.facebook} onChange={e=>setAddr(p=>({...p,facebook:e.target.value}))} /></div></div>
          </div>}

          {step===4 && <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 mb-2">Service Details & Rates</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Starting Price (₹){req}</label><input type="number" className={inp} value={pricing.startingPrice} onChange={e=>setPricing(p=>({...p,startingPrice:e.target.value}))} /></div>
              <div><label className={lbl}>Minimum Order (₹){req}</label><input type="number" className={inp} value={pricing.minimumOrderPrice} onChange={e=>setPricing(p=>({...p,minimumOrderPrice:e.target.value}))} /></div>
            </div>
            <div>
              <label className={lbl}>Rate List / Packages</label>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-2 py-2 text-left font-semibold text-gray-500 w-8">S.No</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-500">Service</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-500 w-24">Rate (₹)</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-500 w-36">Unit</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-500 w-16">Qty</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {pricing.packages.map((pkg,i)=>(
                      <tr key={i} className="bg-white">
                        <td className="px-2 py-1.5 text-gray-400">{i+1}</td>
                        <td className="px-2 py-1.5"><input className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs" value={pkg.name} onChange={e=>updatePkg(i,'name',e.target.value)} placeholder="Service name" /></td>
                        <td className="px-2 py-1.5"><input type="number" className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs" value={pkg.price} onChange={e=>updatePkg(i,'price',e.target.value)} /></td>
                        <td className="px-2 py-1.5"><select className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white" value={pkg.unit} onChange={e=>updatePkg(i,'unit',e.target.value)}><option value="">Select</option>{units.map(u=><option key={u}>{u}</option>)}</select></td>
                        <td className="px-2 py-1.5"><input type="number" className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs" value={pkg.quantity} onChange={e=>updatePkg(i,'quantity',e.target.value)} /></td>
                        <td className="px-2 py-1.5"><button type="button" onClick={()=>setPricing(p=>({...p,packages:p.packages.filter((_,idx)=>idx!==i)}))} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={()=>setPricing(p=>({...p,packages:[...p.packages,{sno:p.packages.length+1,name:'',price:'',unit:'',quantity:''}]}))}
                className="flex items-center gap-1.5 text-xs text-primary-600 font-semibold hover:underline mt-2"><Plus className="w-3.5 h-3.5" /> Add Row</button>
            </div>
          </div>}

          {step===5 && <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 mb-2">Portfolio & Gallery</h2>
            <FileField label="Featured Photo (max 1)" value={portfolio.featuredImage} required uploading={uploading['featuredImage']} accept="image/*"
              onUpload={async f=>{const url=await uploadFile(f,'featuredImage');if(url)setPortfolio(p=>({...p,featuredImage:url}));}} />
            <div>
              <label className={lbl}>Service Photos (max 5)</label>
              <div className="grid grid-cols-5 gap-2">
                {[0,1,2,3,4].map(i=>(
                  <div key={i}>
                    {portfolio.images[i] ? (
                      <div className="relative rounded-xl overflow-hidden border border-green-400 h-16">
                        <img src={portfolio.images[i]} alt="" className="w-full h-full object-cover" />
                        <button onClick={()=>setPortfolio(p=>({...p,images:p.images.filter((_,idx)=>idx!==i)}))} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">×</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-16 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-400 transition-all">
                        {uploading[`img${i}`]?<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500"/>:<><Upload className="w-3.5 h-3.5 text-gray-300"/><span className="text-[9px] text-gray-300 mt-0.5">{i+1}</span></>}
                        <input type="file" accept="image/*" className="hidden" onChange={async e=>{const f=e.target.files[0];if(f&&portfolio.images.length<5){const url=await uploadFile(f,`img${i}`);if(url)setPortfolio(p=>({...p,images:[...p.images,url]}));}}} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div><label className={lbl}>Video Links (max 3 — YouTube/Facebook/Instagram)</label>
              {[0,1,2].map(i=><input key={i} className={inp+' mb-2'} value={portfolio.videoLinks[i]||''} onChange={e=>{const v=[...portfolio.videoLinks];v[i]=e.target.value;setPortfolio(p=>({...p,videoLinks:v}));}} placeholder={`Video link ${i+1}`} />)}
            </div>
            <div><label className={lbl}>Previous Event Links (max 3)</label>
              {[0,1,2].map(i=><input key={i} className={inp+' mb-2'} value={portfolio.previousWorkLinks[i]||''} onChange={e=>{const v=[...portfolio.previousWorkLinks];v[i]=e.target.value;setPortfolio(p=>({...p,previousWorkLinks:v}));}} placeholder={`Work link ${i+1}`} />)}
            </div>
          </div>}

          {step===6 && <div className="space-y-5">
            <h2 className="text-base font-bold text-gray-800">Business Documents</h2>
            <p className="text-xs text-gray-500">Upload any one document — Registration Certificate, GST, PAN, Trade License, MSME, or FSSAI</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[['registrationCertificate','Registration Certificate',false],['msme','MSME Certificate',false],['gst','GST Certificate',false],['pan','PAN Card (Business)',false],['tradeLicense','Trade License',false],['fssai','FSSAI License (Catering)',false]].map(([f,l,r])=>(
                <FileField key={f} label={l} required={r} value={bizDocs[f]} uploading={uploading[`biz_${f}`]}
                  onUpload={async file=>{const url=await uploadFile(file,`biz_${f}`);if(url)setBizDocs(p=>({...p,[f]:url}));}} />
              ))}
            </div>
            <h2 className="text-base font-bold text-gray-800 pt-2">Owner / Manager Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[['aadhaarFront','Aadhaar Card — Front',true],['aadhaarBack','Aadhaar Card — Back',true],['pan','PAN Card',false],['selfie','Selfie / Photo',true]].map(([f,l,r])=>(
                <FileField key={f} label={l} required={r} value={ownerDocs[f]} uploading={uploading[`own_${f}`]}
                  onUpload={async file=>{const url=await uploadFile(file,`own_${f}`);if(url)setOwnerDocs(p=>({...p,[f]:url}));}} />
              ))}
            </div>
          </div>}

          {step===7 && <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-800 mb-2">Bank Details for Payouts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={lbl}>Account Holder Name{req}</label><input className={inp} value={bank.accountHolderName} onChange={e=>setBank(p=>({...p,accountHolderName:e.target.value}))} /></div>
              <div><label className={lbl}>Account Number{req}</label><input className={inp} inputMode="numeric" value={bank.accountNumber} onChange={e=>setBank(p=>({...p,accountNumber:e.target.value.replace(/\D/g,'').slice(0,18)}))} placeholder="Numeric only" maxLength={18} /></div>
              <div><label className={lbl}>IFSC Code{req}</label><input className={inp+' uppercase'} value={bank.ifsc} onChange={e=>setBank(p=>({...p,ifsc:e.target.value.replace(/[^A-Za-z0-9]/g,'').slice(0,11).toUpperCase()}))} placeholder="e.g. SBIN0001234" maxLength={11} /></div>
              <div><label className={lbl}>Bank Name{req}</label><input className={inp} value={bank.bankName} onChange={e=>setBank(p=>({...p,bankName:e.target.value}))} /></div>
              <div><label className={lbl}>Branch Name</label><input className={inp} value={bank.branchName} onChange={e=>setBank(p=>({...p,branchName:e.target.value}))} /></div>
              <div><label className={lbl}>Account Type{req}</label><div className="flex gap-4 mt-1">{['savings','current'].map(t=><label key={t} className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={bank.accountType===t} onChange={()=>setBank(p=>({...p,accountType:t}))} className="accent-primary-500" /><span className="text-sm capitalize">{t}</span></label>)}</div></div>
              <div><label className={lbl}>UPI ID (optional)</label><input className={inp} value={bank.upiId} onChange={e=>setBank(p=>({...p,upiId:e.target.value}))} placeholder="yourname@upi" /></div>
            </div>
            <FileField label="Bank A/C Proof (Cheque / Passbook / Statement)" required value={bank.proof} uploading={uploading['bank_proof']}
              onUpload={async f=>{const url=await uploadFile(f,'bank_proof');if(url)setBank(p=>({...p,proof:url}));}} />
          </div>}

          {step===8 && <div className="space-y-5">
            <h2 className="text-base font-bold text-gray-800">Service Availability</h2>
            <div className="space-y-2">
              {avail.map((a,i)=>(
                <div key={a.day} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">{a.day}</span>
                  <div className="flex gap-3">{['Yes','No'].map(opt=><label key={opt} className="flex items-center gap-1 cursor-pointer text-xs"><input type="radio" checked={a.isAvailable===(opt==='Yes')} onChange={()=>updateAvail(i,'isAvailable',opt==='Yes')} className="accent-primary-500" />{opt}</label>)}</div>
                  {a.isAvailable && <><input type="time" value={a.startTime} onChange={e=>updateAvail(i,'startTime',e.target.value)} className="px-2 py-1 border border-gray-300 rounded-lg text-xs" /><span className="text-gray-400 text-xs">to</span><input type="time" value={a.endTime} onChange={e=>updateAvail(i,'endTime',e.target.value)} className="px-2 py-1 border border-gray-300 rounded-lg text-xs" /></>}
                </div>
              ))}
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-3 py-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">Public Holidays</span>
                <div className="flex gap-3">{['Yes','No'].map(opt=><label key={opt} className="flex items-center gap-1 cursor-pointer text-xs"><input type="radio" checked={publicHoliday.isAvailable===(opt==='Yes')} onChange={()=>setPublicHoliday(p=>({...p,isAvailable:opt==='Yes'}))} className="accent-primary-500" />{opt}</label>)}</div>
                {publicHoliday.isAvailable && <><input type="time" value={publicHoliday.startTime} onChange={e=>setPublicHoliday(p=>({...p,startTime:e.target.value}))} className="px-2 py-1 border border-gray-300 rounded-lg text-xs" /><span className="text-gray-400 text-xs">to</span><input type="time" value={publicHoliday.endTime} onChange={e=>setPublicHoliday(p=>({...p,endTime:e.target.value}))} className="px-2 py-1 border border-gray-300 rounded-lg text-xs" /></>}
              </div>
            </div>
            <div><label className={lbl}>Advance Booking Required</label>
              <div className="space-y-2 mt-1">
                {[['same-day','Same day allowed'],['24h','24 hours minimum'],['48h','48 hours minimum'],['1week','1 week minimum'],['custom','Custom']].map(([v,l])=>(
                  <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" checked={advanceBooking===v} onChange={()=>setAdvanceBooking(v)} className="accent-primary-500" />{l}
                    {v==='custom'&&advanceBooking==='custom'&&<input type="number" min="1" className="ml-2 px-2 py-1 border border-gray-300 rounded-lg text-xs w-20" value={customDays} onChange={e=>setCustomDays(e.target.value)} placeholder="days" />}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={lbl}>Maximum time to confirm a booking request <span className="text-gray-400 font-normal">(max 3 hours)</span></label>
              <div className="flex gap-3 mt-1">
                {[1, 2, 3].map(h => (
                  <button key={h} type="button" onClick={() => setConfirmationHours(h)}
                    className={`px-5 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${confirmationHours === h ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'}`}>
                    {h} Hr{h > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              <p className="text-xs text-orange-500 mt-1">Default: 3 hours. Customers will see this on your service page.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-800 mb-3">Terms & Conditions</h3>
              <div className="bg-white border border-amber-200 rounded-lg p-4 h-64 overflow-y-auto text-xs text-gray-700 space-y-3 leading-relaxed">
                <p className="font-bold text-gray-800">RentalMeet Vendor Service Agreement</p>

                <p className="font-semibold text-gray-700">1. Platform Fee & Payouts</p>
                <p>• I/We agree to pay RentalMeet platform fee as per the applicable policy on all confirmed bookings made through the platform.</p>
                <p>• Platform fee will be deducted before payout. Payouts for services booked through the platform will follow standard billing cycles as communicated by RentalMeet.</p>

                <p className="font-semibold text-gray-700">2. Information Accuracy</p>
                <p>• I confirm that all information provided during registration — including business details, portfolio, pricing, documents, and bank details — is accurate, truthful, and up to date.</p>
                <p>• Providing false or misleading information may lead to immediate suspension or termination of my vendor account.</p>

                <p className="font-semibold text-gray-700">3. Service Quality Standards</p>
                <p>• I will maintain the quality standards as represented in my portfolio and service listing.</p>
                <p>• I will ensure that the services delivered match the description provided on the platform.</p>

                <p className="font-semibold text-gray-700">4. Booking Commitments</p>
                <p>• I will respond to booking inquiries within 2 hours of receiving them.</p>
                <p>• I will honor all confirmed bookings and provide services as promised to the customer.</p>
                <p>• Cancellation of confirmed bookings without valid reason may result in penalties or account suspension.</p>

                <p className="font-semibold text-gray-700">5. Legal Compliance</p>
                <p>• I have all necessary licenses, permits, and registrations required to operate my business legally.</p>
                <p>• I will comply with all applicable local, state, and national laws and regulations.</p>

                <p className="font-semibold text-gray-700">6. Platform Role</p>
                <p>• I understand that RentalMeet acts as a platform for lead generation and booking facilitation only.</p>
                <p>• RentalMeet is not responsible for disputes arising from service delivery between vendor and customer.</p>

                <p className="font-semibold text-gray-700">7. Communications</p>
                <p>• I agree to receive booking notifications, updates, and communications from RentalMeet via email, SMS, and WhatsApp.</p>

                <p className="font-semibold text-gray-700">8. Account Termination</p>
                <p>• RentalMeet reserves the right to suspend or terminate a vendor account in case of policy violations, fraudulent activity, or repeated customer complaints.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mt-4 pt-4 border-t border-amber-200">
                <input
                  type="checkbox"
                  checked={termsChecked.every(Boolean)}
                  onChange={e => setTermsChecked(Array(TERMS.length).fill(e.target.checked))}
                  className="w-4 h-4 mt-0.5 accent-primary-500 flex-shrink-0"
                />
                <span className="text-xs text-gray-700 font-medium">
                  I declare that all information provided is true and correct. I have read, understood, and agree to all the terms and conditions of the RentalMeet Vendor Service Agreement. I understand that providing false information may lead to immediate termination of my vendor account.
                </span>
              </label>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-primary-800 mb-3">What Happens After Submission?</h3>
              <div className="space-y-2">
                {[
                  { step: '1', label: 'Application Received', time: 'Immediately', color: 'bg-blue-100 text-blue-700' },
                  { step: '2', label: 'Application Review', time: '24–48 hours', color: 'bg-yellow-100 text-yellow-700' },
                  { step: '3', label: 'Document Verification', time: '24–48 hours', color: 'bg-orange-100 text-orange-700' },
                  { step: '4', label: 'Vendor Approval', time: '3–5 business days', color: 'bg-purple-100 text-purple-700' },
                  { step: '5', label: 'Profile Goes Live', time: '3–5 business days', color: 'bg-green-100 text-green-700' },
                ].map(({ step: s, label, time, color }) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>{s}</span>
                    <span className="text-xs text-primary-800 flex-1">{label}</span>
                    <span className="text-xs font-semibold text-primary-700">{time}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-primary-600 mt-3 pt-3 border-t border-primary-200">
                You will receive email/SMS updates at each stage. Our team may contact you for additional information if required.
              </p>
            </div>
          </div>}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button onClick={handleBack} disabled={step===1}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs text-gray-400">{step} / {STEPS.length}</span>
            {step < 8 ? (
              <button onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || !termsChecked.every(Boolean)}
                className="flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting...' : <><CheckCircle2 className="w-4 h-4" /> Submit for Review</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
