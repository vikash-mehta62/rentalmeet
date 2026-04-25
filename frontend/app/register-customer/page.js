'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, Camera, Upload, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const STEPS = ['Account', 'KYC Documents', 'Done'];

export default function CustomerRegister() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  // Step 1 — account info
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', city: '', state: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  // Step 2 — KYC
  const [idProofType, setIdProofType] = useState('Aadhaar');
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleChange = e => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  // Step 1 submit — register account
  const handleRegister = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) { setError('All fields required'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.phone.length !== 10) { setError('Phone must be 10 digits'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: 'customer', city: form.city, state: form.state })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setAuth(data.user, data.token);
        setStep(1);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  // Camera
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { toast.error('Camera access denied. Please upload a selfie instead.'); }
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(blob));
      closeCamera();
    }, 'image/jpeg', 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraOpen(false);
  };

  useEffect(() => () => closeCamera(), []);

  // Step 2 submit — upload KYC
  const handleKYC = async () => {
    if (!idProofFile) { toast.error('Please upload your ID proof'); return; }
    if (!selfieFile) { toast.error('Please take a selfie or upload one'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('idProof', idProofFile);
      fd.append('selfie', selfieFile);
      fd.append('idProofType', idProofType);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/kyc-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch { toast.error('Upload failed'); }
    finally { setLoading(false); }
  };

  const inputCls = 'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-500 mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="RentalMeet" className="h-14 w-auto object-contain" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* ── STEP 0: Account Info ── */}
          {step === 0 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Create Account</h1>
              <p className="text-sm text-gray-500 text-center mb-6">Register as a Client (User)</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} className={inputCls} required /></div>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="email" type="email" placeholder="Email Address *" value={form.email} onChange={handleChange} className={inputCls} required /></div>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="phone" type="tel" placeholder="10-digit Phone *" value={form.phone} onChange={handleChange} maxLength={10} className={inputCls} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="city" placeholder="City" value={form.city} onChange={handleChange} className={inputCls} /></div>
                  <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="state" placeholder="State" value={form.state} onChange={handleChange} className={inputCls} /></div>
                </div>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="password" type={showPwd ? 'text' : 'password'} placeholder="Password (min 6 chars) *" value={form.password} onChange={handleChange} className={inputCls + ' pr-10'} required /><button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input name="confirm" type={showPwd ? 'text' : 'password'} placeholder="Confirm Password *" value={form.confirm} onChange={handleChange} className={inputCls} required /></div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                  {loading ? 'Creating...' : 'Continue to KYC →'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <Link href="/login" className="text-primary-500 font-semibold">Login</Link></p>
            </>
          )}

          {/* ── STEP 1: KYC Documents ── */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Verify Your Identity</h1>
              <p className="text-sm text-gray-500 text-center mb-2">Required to book venues on RentalMeet</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">ID proof and real-time selfie are mandatory. You cannot book venues without completing KYC.</p>
              </div>

              <div className="space-y-5">
                {/* ID Proof Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ID Proof Type *</label>
                  <select value={idProofType} onChange={e => setIdProofType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500">
                    {['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* ID Proof Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload {idProofType} *</label>
                  {idProofPreview ? (
                    <div className="relative">
                      <img src={idProofPreview} alt="ID Proof" className="w-full h-40 object-cover rounded-xl border-2 border-green-400" />
                      <button onClick={() => { setIdProofFile(null); setIdProofPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✕</button>
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload {idProofType}</span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (max 5MB)</span>
                      <input type="file" accept="image/*,.pdf" className="hidden"
                        onChange={e => { const f = e.target.files[0]; if (f) { setIdProofFile(f); setIdProofPreview(URL.createObjectURL(f)); } }} />
                    </label>
                  )}
                </div>

                {/* Selfie */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Real-time Selfie *</label>
                  <p className="text-xs text-gray-400 mb-2">Take a live selfie using your camera for identity verification</p>

                  {cameraOpen ? (
                    <div className="space-y-3">
                      <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border-2 border-primary-400" style={{ maxHeight: 240 }} />
                      <div className="flex gap-2">
                        <button onClick={captureSelfie} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                          <Camera className="w-4 h-4" /> Capture
                        </button>
                        <button onClick={closeCamera} className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold">Cancel</button>
                      </div>
                    </div>
                  ) : selfiePreview ? (
                    <div className="relative">
                      <img src={selfiePreview} alt="Selfie" className="w-full h-40 object-cover rounded-xl border-2 border-green-400" />
                      <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✕</button>
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Selfie Captured</div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={openCamera} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm transition-colors">
                        <Camera className="w-4 h-4" /> Open Camera
                      </button>
                      <label className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 text-sm text-gray-500 font-semibold">
                        <Upload className="w-4 h-4" /> Upload Photo
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files[0]; if (f) { setSelfieFile(f); setSelfiePreview(URL.createObjectURL(f)); } }} />
                      </label>
                    </div>
                  )}
                </div>

                <button onClick={handleKYC} disabled={loading || !idProofFile || !selfieFile}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? 'Uploading...' : <><CheckCircle2 className="w-4 h-4" /> Complete Registration</>}
                </button>

                <button onClick={() => { setStep(2); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                  Skip for now (you can complete KYC later from your profile)
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Done ── */}
          {step === 2 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
              <p className="text-gray-500 text-sm mb-6">Your account has been created successfully. You can now browse and book venues.</p>
              <button onClick={() => router.push('/customer/dashboard')}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm transition-colors">
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}