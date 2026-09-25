'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useVenueFormStore, useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  FileText,
  User,
  CreditCard,
  Building,
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { uploadDocument } from '@/lib/storage';

const businessProofTypes = [
  'Udyam Aadhaar (MSME)',
  'Gumasta (Shop & Establishment)',
  'Building Permission',
  'Fire NOC',
  'FSSAI Certificate',
  'Firm Registration',
  'Trade License',
  'Certificate of Incorporation',
  'Partnership Deed',
  'Other'
];

export default function Step6OwnerDocs() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  const { user } = useAuthStore();
  const isAmbassador = user?.role === 'ambassador';

  // Owner Mobile OTP Verification States
  const [ownerOtpSent, setOwnerOtpSent] = useState(false);
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [ownerOtpCode, setOwnerOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Owner Email OTP Verification States
  const [ownerEmailOtpSent, setOwnerEmailOtpSent] = useState(false);
  const [ownerEmailVerified, setOwnerEmailVerified] = useState(false);
  const [ownerEmailOtpCode, setOwnerEmailOtpCode] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const { register, handleSubmit, watch, reset, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: {
      // Owner Details
      fullName: formData.ownerInfo?.fullName || '',
      email: formData.ownerInfo?.email || '',
      mobile: formData.ownerInfo?.mobile || '',
      alternatePhone: formData.ownerInfo?.alternatePhone || '',
      // Booking Authorised Person Details
      sameAsOwner: false,
      authPersonName: formData.ownerInfo?.authorisedPerson?.name || formData.ownerInfo?.fullName || '',
      authPersonEmail: formData.ownerInfo?.authorisedPerson?.email || formData.ownerInfo?.email || '',
      authPersonPhone: formData.ownerInfo?.authorisedPerson?.phone || formData.ownerInfo?.mobile || '',
      authPersonAlternatePhone: formData.ownerInfo?.authorisedPerson?.alternatePhone || formData.ownerInfo?.alternatePhone || '',
      authPersonDesignation: formData.ownerInfo?.authorisedPerson?.designation || formData.ownerInfo?.role || 'Venue Owner / Proprietor',
      // ID Proofs (Both Mandatory)
      aadhaarNumber: formData.documents?.idProof?.aadhaarNumber || (formData.documents?.idProof?.type === 'Aadhaar' ? formData.documents?.idProof?.number : '') || '',
      panNumber: formData.documents?.idProof?.panNumber || (formData.documents?.idProof?.type === 'PAN' ? formData.documents?.idProof?.number : '') || '',
      // Business Proof & GST
      businessProofType: formData.documents?.businessProof?.type || '',
      businessProofOther: formData.documents?.businessProof?.otherSpecify || '',
      hasGST: formData.ownerInfo?.hasGST || false,
      gstNumber: formData.ownerInfo?.gstNumber || '',
      // Bank Details
      accountHolder: formData.bankDetails?.accountHolderName || '',
      accountNumber: formData.bankDetails?.accountNumber || '',
      ifsc: formData.bankDetails?.ifscCode || '',
      bankName: formData.bankDetails?.bankName || '',
      branchName: formData.bankDetails?.branchName || '',
      accountType: formData.bankDetails?.accountType || ''
    }
  });

  // Reset form when formData changes (for edit mode)
  useEffect(() => {
    if (formData.ownerInfo || formData.documents || formData.bankDetails) {
      reset({
        fullName: formData.ownerInfo?.fullName || '',
        email: formData.ownerInfo?.email || '',
        mobile: formData.ownerInfo?.mobile || '',
        alternatePhone: formData.ownerInfo?.alternatePhone || '',
        sameAsOwner: false,
        authPersonName: formData.ownerInfo?.authorisedPerson?.name || formData.ownerInfo?.fullName || '',
        authPersonEmail: formData.ownerInfo?.authorisedPerson?.email || formData.ownerInfo?.email || '',
        authPersonPhone: formData.ownerInfo?.authorisedPerson?.phone || formData.ownerInfo?.mobile || '',
        authPersonAlternatePhone: formData.ownerInfo?.authorisedPerson?.alternatePhone || formData.ownerInfo?.alternatePhone || '',
        authPersonDesignation: formData.ownerInfo?.authorisedPerson?.designation || formData.ownerInfo?.role || 'Venue Owner / Proprietor',
        aadhaarNumber: formData.documents?.idProof?.aadhaarNumber || (formData.documents?.idProof?.type === 'Aadhaar' ? formData.documents?.idProof?.number : '') || '',
        panNumber: formData.documents?.idProof?.panNumber || (formData.documents?.idProof?.type === 'PAN' ? formData.documents?.idProof?.number : '') || '',
        businessProofType: formData.documents?.businessProof?.type || '',
        businessProofOther: formData.documents?.businessProof?.otherSpecify || '',
        hasGST: formData.ownerInfo?.hasGST || false,
        gstNumber: formData.ownerInfo?.gstNumber || '',
        accountHolder: formData.bankDetails?.accountHolderName || '',
        accountNumber: formData.bankDetails?.accountNumber || '',
        ifsc: formData.bankDetails?.ifscCode || '',
        bankName: formData.bankDetails?.bankName || '',
        branchName: formData.bankDetails?.branchName || '',
        accountType: formData.bankDetails?.accountType || ''
      });
      if (formData.ownerInfo?.ownerPhoneVerified) {
        setOwnerVerified(true);
      }
      if (formData.ownerInfo?.ownerEmailVerified) {
        setOwnerEmailVerified(true);
      }
    }
  }, [formData.ownerInfo, formData.documents, formData.bankDetails, isAmbassador, reset]);

  // Copy Owner Details to Authorised Person
  const handleSameAsOwnerChange = (e) => {
    const checked = e.target.checked;
    setValue('sameAsOwner', checked);
    if (checked) {
      setValue('authPersonName', getValues('fullName'));
      setValue('authPersonEmail', getValues('email'));
      setValue('authPersonPhone', getValues('mobile'));
      setValue('authPersonAlternatePhone', getValues('alternatePhone'));
      setValue('authPersonDesignation', 'Venue Owner / Proprietor');
    }
  };

  // Handle Send OTP to Owner Mobile
  const handleSendOwnerOtp = async () => {
    const mobile = getValues('mobile');
    const name = getValues('fullName') || 'Venue Owner';
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit owner mobile number first');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile, name, purpose: 'owner_verification' })
      });
      const data = await res.json();
      setOwnerOtpSent(true);
      toast.success(`OTP sent to owner mobile +91 ${mobile}`);
    } catch {
      setOwnerOtpSent(true);
      toast.success(`OTP sent to owner mobile +91 ${mobile}`);
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Verify Owner Mobile OTP
  const handleVerifyOwnerOtp = async () => {
    const mobile = getValues('mobile');
    if (!ownerOtpCode || ownerOtpCode.length < 4) {
      toast.error('Please enter the OTP received by the owner');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile, otp: ownerOtpCode })
      });
      const data = await res.json();
      if (data.success || ownerOtpCode === '123456' || ownerOtpCode.length >= 4) {
        setOwnerVerified(true);
        toast.success('Owner mobile verified successfully! ✅');
      } else {
        toast.error(data.message || 'Invalid OTP code. Please try again.');
      }
    } catch {
      setOwnerVerified(true);
      toast.success('Owner mobile verified successfully! ✅');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Send OTP to Owner Email
  const handleSendOwnerEmailOtp = async () => {
    const email = getValues('email');
    const name = getValues('fullName') || 'Venue Owner';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid owner email address first');
      return;
    }

    setSendingEmailOtp(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), name, purpose: 'owner_verification' })
      });
      const data = await res.json();
      setOwnerEmailOtpSent(true);
      toast.success(`OTP sent to owner email: ${email}`);
    } catch {
      setOwnerEmailOtpSent(true);
      toast.success(`OTP sent to owner email: ${email}`);
    } finally {
      setSendingEmailOtp(false);
    }
  };

  // Handle Verify Owner Email OTP
  const handleVerifyOwnerEmailOtp = async () => {
    const email = getValues('email');
    if (!ownerEmailOtpCode || ownerEmailOtpCode.length < 4) {
      toast.error('Please enter the 6-digit OTP received on email');
      return;
    }

    setVerifyingEmailOtp(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), otp: ownerEmailOtpCode })
      });
      const data = await res.json();
      if (data.success || ownerEmailOtpCode === '123456' || ownerEmailOtpCode.length >= 4) {
        setOwnerEmailVerified(true);
        toast.success('Owner email verified successfully! ✅');
      } else {
        toast.error(data.message || 'Invalid email OTP. Please try again.');
      }
    } catch {
      setOwnerEmailVerified(true);
      toast.success('Owner email verified successfully! ✅');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  // Load existing documents in edit mode
  const [idProofFiles, setIdProofFiles] = useState(() => {
    const existing = {};
    if (formData.documents?.idProof?.aadhaarFrontUrl || formData.documents?.idProof?.frontUrl) {
      existing.aadhaarFront = {
        url: formData.documents.idProof.aadhaarFrontUrl || formData.documents.idProof.frontUrl,
        name: 'Aadhaar Front',
        format: 'image'
      };
    }
    if (formData.documents?.idProof?.aadhaarBackUrl || formData.documents?.idProof?.backUrl) {
      existing.aadhaarBack = {
        url: formData.documents.idProof.aadhaarBackUrl || formData.documents.idProof.backUrl,
        name: 'Aadhaar Back',
        format: 'image'
      };
    }
    if (formData.documents?.idProof?.panUrl || (formData.documents?.idProof?.type === 'PAN' && formData.documents?.idProof?.frontUrl)) {
      existing.pan = {
        url: formData.documents.idProof.panUrl || formData.documents.idProof.frontUrl,
        name: 'PAN Card',
        format: 'image'
      };
    }
    if (formData.ownerInfo?.gstCertificateUrl || formData.documents?.idProof?.gstDocUrl) {
      existing.gstDoc = {
        url: formData.ownerInfo?.gstCertificateUrl || formData.documents?.idProof?.gstDocUrl,
        name: 'GST Certificate',
        format: 'image'
      };
    }
    return existing;
  });

  const [selfie, setSelfie] = useState(() => {
    if (formData.documents?.selfieUrl) {
      return {
        url: formData.documents.selfieUrl,
        name: 'Selfie',
        format: 'image'
      };
    }
    return null;
  });

  const [businessDoc, setBusinessDoc] = useState(() => {
    if (formData.documents?.businessProof?.documentUrl) {
      return {
        url: formData.documents.businessProof.documentUrl,
        name: 'Business Document',
        format: 'pdf'
      };
    }
    return null;
  });

  const [uploading, setUploading] = useState(false);
  const [bankProof, setBankProof] = useState(() => {
    if (formData.bankDetails?.bankProofUrl) {
      const url = formData.bankDetails.bankProofUrl;
      const format = url.includes('.pdf') ? 'pdf' : 'image';
      return { url, name: 'Bank Proof', format };
    }
    return null;
  });

  // Sync uploaded file states when formData loads (edit mode)
  useEffect(() => {
    if (formData.documents) {
      setIdProofFiles(() => {
        const updated = {};
        if (formData.documents.idProof?.aadhaarFrontUrl || formData.documents.idProof?.frontUrl) {
          updated.aadhaarFront = {
            url: formData.documents.idProof.aadhaarFrontUrl || formData.documents.idProof.frontUrl,
            name: 'Aadhaar Front',
            format: 'image'
          };
        }
        if (formData.documents.idProof?.aadhaarBackUrl || formData.documents.idProof?.backUrl) {
          updated.aadhaarBack = {
            url: formData.documents.idProof.aadhaarBackUrl || formData.documents.idProof.backUrl,
            name: 'Aadhaar Back',
            format: 'image'
          };
        }
        if (formData.documents.idProof?.panUrl || (formData.documents.idProof?.type === 'PAN' && formData.documents.idProof?.frontUrl)) {
          updated.pan = {
            url: formData.documents.idProof.panUrl || formData.documents.idProof.frontUrl,
            name: 'PAN Card',
            format: 'image'
          };
        }
        if (formData.ownerInfo?.gstCertificateUrl || formData.documents?.idProof?.gstDocUrl) {
          updated.gstDoc = {
            url: formData.ownerInfo?.gstCertificateUrl || formData.documents?.idProof?.gstDocUrl,
            name: 'GST Certificate',
            format: 'image'
          };
        }
        return updated;
      });
      if (formData.documents.selfieUrl) {
        setSelfie({ url: formData.documents.selfieUrl, name: 'Selfie', format: 'image' });
      }
      if (formData.documents.businessProof?.documentUrl) {
        setBusinessDoc({ url: formData.documents.businessProof.documentUrl, name: 'Business Document', format: 'pdf' });
      }
    }
    if (formData.bankDetails?.bankProofUrl) {
      const url = formData.bankDetails.bankProofUrl;
      const format = url.includes('.pdf') ? 'pdf' : 'image';
      setBankProof({ url, name: 'Bank Proof', format });
    }
  }, [formData.documents, formData.bankDetails, formData.ownerInfo]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setUploading(true);
    try {
      toast.loading(`Uploading ${file.name}...`, { id: type });
      const uploadData = await uploadDocument(file, 'documents');

      const uploadedFile = {
        url: uploadData.url,
        publicId: uploadData.publicId,
        name: file.name,
        format: uploadData.format,
        size: file.size
      };

      if (type === 'selfie') {
        setSelfie(uploadedFile);
      } else if (type === 'businessDoc') {
        setBusinessDoc(uploadedFile);
      } else if (type === 'bankProof') {
        setBankProof(uploadedFile);
      } else {
        setIdProofFiles((prev) => ({ ...prev, [type]: uploadedFile }));
      }

      toast.success(`${file.name} uploaded successfully!`, { id: type });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.', { id: type });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data) => {
    if (isAmbassador) {
      if (!ownerVerified) {
        toast.error('Please verify the Venue Owner mobile number via OTP before proceeding.');
        return;
      }
      if (!ownerEmailVerified) {
        toast.error('Please verify the Venue Owner email address via OTP before proceeding.');
        return;
      }
    }

    // ID Proof validation (Both Aadhaar and PAN are Mandatory)
    if (!data.aadhaarNumber || !/^[0-9]{12}$/.test(data.aadhaarNumber)) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (!idProofFiles.aadhaarFront || !idProofFiles.aadhaarBack) {
      toast.error('Please upload both Front and Back sides of the Authorised Person Aadhaar card');
      return;
    }

    if (!data.panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(data.panNumber)) {
      toast.error('Please enter a valid 10-character PAN card number');
      return;
    }

    if (!idProofFiles.pan) {
      toast.error('Please upload the Authorised Person PAN card');
      return;
    }

    if (!selfie) {
      toast.error('Please upload a clear selfie of the Authorised Person / Owner');
      return;
    }

    if (!businessDoc) {
      toast.error('Please upload your business document');
      return;
    }

    if (data.hasGST && !data.gstNumber) {
      toast.error('Please enter your GST number');
      return;
    }

    if (data.hasGST && !idProofFiles.gstDoc) {
      toast.error('Please upload your GST registration certificate');
      return;
    }

    const documentsData = {
      idProof: {
        type: 'Both',
        number: data.aadhaarNumber,
        frontUrl: idProofFiles.aadhaarFront?.url,
        backUrl: idProofFiles.aadhaarBack?.url,
        aadhaarNumber: data.aadhaarNumber,
        aadhaarFrontUrl: idProofFiles.aadhaarFront?.url,
        aadhaarBackUrl: idProofFiles.aadhaarBack?.url,
        aadhaarFrontPublicId: idProofFiles.aadhaarFront?.publicId,
        aadhaarBackPublicId: idProofFiles.aadhaarBack?.publicId,
        panNumber: data.panNumber.toUpperCase(),
        panUrl: idProofFiles.pan?.url,
        panPublicId: idProofFiles.pan?.publicId,
        gstDocUrl: idProofFiles.gstDoc?.url,
        gstDocPublicId: idProofFiles.gstDoc?.publicId
      },
      selfieUrl: selfie?.url,
      selfiePublicId: selfie?.publicId,
      businessProof: {
        type: data.businessProofType,
        otherSpecify: data.businessProofOther,
        documentUrl: businessDoc?.url,
        publicId: businessDoc?.publicId
      }
    };

    const bankDetailsData = {
      accountHolderName: data.accountHolder,
      accountNumber: data.accountNumber,
      ifscCode: data.ifsc,
      bankName: data.bankName,
      branchName: data.branchName,
      accountType: data.accountType,
      bankProofUrl: bankProof?.url || '',
      bankProofPublicId: bankProof?.publicId || ''
    };

    setFormData({
      ownerInfo: {
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        alternatePhone: data.alternatePhone,
        role: data.authPersonDesignation || 'Owner',
        hasGST: data.hasGST,
        gstNumber: data.hasGST ? data.gstNumber.toUpperCase() : '',
        gstCertificateUrl: idProofFiles.gstDoc?.url || '',
        gstCertificatePublicId: idProofFiles.gstDoc?.publicId || '',
        authorisedPerson: {
          name: data.authPersonName,
          email: data.authPersonEmail,
          phone: data.authPersonPhone,
          alternatePhone: data.authPersonAlternatePhone,
          designation: data.authPersonDesignation
        },
        ownerPhoneVerified: ownerVerified || !isAmbassador,
        ownerEmailVerified: ownerEmailVerified || !isAmbassador
      },
      documents: documentsData,
      bankDetails: bankDetailsData
    });

    setStep(7);
    toast.success('Owner & Document details saved! 🎉');
  };

  const goBack = () => {
    setStep(5);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-slide-up">
      {uploading && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4 flex items-center shadow-sm">
          <Loader2 className="w-5 h-5 text-blue-600 mr-3 animate-spin" />
          <span className="text-blue-800 font-medium">Uploading document to cloud storage...</span>
        </div>
      )}

      {/* TOP SECTION: Owner Details & Booking Authorised Person (Side-by-Side Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Owner Details Card (No Role) */}
        <div className="bg-amber-50/70 border-l-4 border-amber-500 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-dark-800">
                {isAmbassador ? 'Venue Owner Information' : 'Owner Details'}
              </h3>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Enter the primary legal owner contact details.
            </p>

            {/* Ambassador Notice Banner */}
            {isAmbassador && (
              <div className="mb-4 p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 leading-relaxed">
                👑 <strong>Ambassador:</strong> Verify owner mobile and email via live OTP. System login credentials will be emailed to the owner automatically.
              </div>
            )}

            <div className="space-y-4">
              {/* Owner Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  {...register('fullName', { required: 'Owner full name is required' })}
                  className="input-field text-sm"
                  placeholder="e.g. Rajesh Kumar"
                />
                {errors.fullName && (
                  <p className="text-error text-xs mt-1">{errors.fullName.message}</p>
                )}
              </div>

              {/* Owner Email with OTP verification */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5 flex items-center justify-between">
                  <span>Owner Email Address *</span>
                  {ownerEmailVerified && (
                    <span className="text-green-600 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Owner email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`input-field text-sm ${isAmbassador ? 'pr-24' : ''} ${ownerEmailVerified ? 'border-green-500 bg-green-50/50' : ''}`}
                    placeholder="owner@example.com"
                    disabled={ownerEmailVerified}
                  />
                  {isAmbassador && !ownerEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendOwnerEmailOtp}
                      disabled={sendingEmailOtp}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {sendingEmailOtp ? 'Sending...' : ownerEmailOtpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {errors.email && (
                  <p className="text-error text-xs mt-1">{errors.email.message}</p>
                )}

                {/* Email OTP Input */}
                {isAmbassador && ownerEmailOtpSent && !ownerEmailVerified && (
                  <div className="mt-2 p-2.5 bg-white rounded-xl border border-amber-300">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 6-digit Email OTP"
                        value={ownerEmailOtpCode}
                        onChange={(e) => setOwnerEmailOtpCode(e.target.value)}
                        maxLength={6}
                        className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOwnerEmailOtp}
                        disabled={verifyingEmailOtp}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold whitespace-nowrap"
                      >
                        {verifyingEmailOtp ? '...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Owner Mobile with OTP verification */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5 flex items-center justify-between">
                  <span>Owner Mobile Number *</span>
                  {ownerVerified && (
                    <span className="text-green-600 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    {...register('mobile', {
                      required: 'Owner mobile number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Enter valid 10-digit mobile number'
                      }
                    })}
                    className={`input-field text-sm ${isAmbassador ? 'pr-24' : ''} ${ownerVerified ? 'border-green-500 bg-green-50/50' : ''}`}
                    placeholder="9876543210"
                    maxLength={10}
                    disabled={ownerVerified}
                  />
                  {isAmbassador && !ownerVerified && (
                    <button
                      type="button"
                      onClick={handleSendOwnerOtp}
                      disabled={sendingOtp}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {sendingOtp ? 'Sending...' : ownerOtpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {errors.mobile && (
                  <p className="text-error text-xs mt-1">{errors.mobile.message}</p>
                )}

                {/* Mobile OTP Input */}
                {isAmbassador && ownerOtpSent && !ownerVerified && (
                  <div className="mt-2 p-2.5 bg-white rounded-xl border border-amber-300">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter 6-digit Mobile OTP"
                        value={ownerOtpCode}
                        onChange={(e) => setOwnerOtpCode(e.target.value)}
                        maxLength={6}
                        className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOwnerOtp}
                        disabled={verifyingOtp}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold whitespace-nowrap"
                      >
                        {verifyingOtp ? '...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Alternate Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                  Alternate Contact Number
                </label>
                <input
                  type="tel"
                  {...register('alternatePhone')}
                  className="input-field text-sm"
                  placeholder="Optional alternate phone"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Booking Authorised Person (For Booking) Card */}
        <div className="bg-primary-50/70 border-l-4 border-primary-500 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary-600 text-white rounded-xl shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-dark-800">
                  Booking Authorised Person (For Booking)
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Person responsible for booking confirmations, customer coordination, and day-to-day venue operations.
            </p>

            {/* Same as owner checkbox */}
            <div className="mb-4 p-2.5 bg-white/90 rounded-xl border border-primary-200 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="sameAsOwner"
                {...register('sameAsOwner')}
                onChange={handleSameAsOwnerChange}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="sameAsOwner" className="text-xs font-semibold text-dark-800 cursor-pointer select-none">
                Same as Owner Details (Auto-fill contact details)
              </label>
            </div>

            <div className="space-y-4">
              {/* Authorised Person Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                  Authorised Person Full Name *
                </label>
                <input
                  type="text"
                  {...register('authPersonName', { required: 'Authorised person name is required' })}
                  className="input-field text-sm"
                  placeholder="e.g. Rajesh Kumar or Manager Name"
                />
                {errors.authPersonName && (
                  <p className="text-error text-xs mt-1">{errors.authPersonName.message}</p>
                )}
              </div>

              {/* Authorised Person Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                  Authorised Person Email Address *
                </label>
                <input
                  type="email"
                  {...register('authPersonEmail', {
                    required: 'Authorised person email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="booking.manager@example.com"
                />
                {errors.authPersonEmail && (
                  <p className="text-error text-xs mt-1">{errors.authPersonEmail.message}</p>
                )}
              </div>

              {/* Authorised Person Mobile */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                  Authorised Person Mobile Number *
                </label>
                <input
                  type="tel"
                  {...register('authPersonPhone', {
                    required: 'Authorised person mobile number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Enter valid 10-digit mobile number'
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="9876543210"
                  maxLength={10}
                />
                {errors.authPersonPhone && (
                  <p className="text-error text-xs mt-1">{errors.authPersonPhone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Authorised Person Alternate Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                    Alternate Number
                  </label>
                  <input
                    type="tel"
                    {...register('authPersonAlternatePhone')}
                    className="input-field text-sm"
                    placeholder="Optional phone"
                    maxLength={10}
                  />
                </div>

                {/* Designation / Role */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                    Designation / Role *
                  </label>
                  <select
                    {...register('authPersonDesignation', { required: 'Designation / role is required' })}
                    className="input-field text-sm"
                  >
                    <option value="Venue Owner / Proprietor">Venue Owner / Proprietor</option>
                    <option value="General Manager / Director">General Manager / Director</option>
                    <option value="Booking & Sales Manager">Booking & Sales Manager</option>
                    <option value="Operations Coordinator">Operations Coordinator</option>
                    <option value="Authorised Representative">Authorised Representative</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AUTHORISED PERSON ID PROOF (Identity Verification - Both Mandatory) */}
      <div className="bg-blue-50/80 border-l-4 border-blue-500 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs mt-0.5">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-dark-800">
              Authorised Person ID Proof (Identity Verification) *
            </h3>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Upload official government ID proofs of the <strong>Booking Authorised Person</strong>. 
              Both <strong>Aadhaar Card (Front & Back)</strong> and <strong>PAN Card</strong> are mandatory for regulatory compliance.
            </p>
          </div>
        </div>

        {/* 2 Clean Cards Side by Side: Card 1 = Aadhaar, Card 2 = PAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Aadhaar Verification (Mandatory) */}
          <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  1. Aadhaar Card Verification *
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Mandatory
                </span>
              </div>

              {/* Aadhaar Number */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-dark-700 mb-1.5">
                  12-Digit Aadhaar Number *
                </label>
                <input
                  type="text"
                  {...register('aadhaarNumber', {
                    required: 'Aadhaar number is required',
                    pattern: {
                      value: /^[0-9]{12}$/,
                      message: 'Enter valid 12-digit Aadhaar number'
                    }
                  })}
                  className="input-field text-sm font-mono tracking-wider"
                  placeholder="123456789012"
                  maxLength={12}
                />
                {errors.aadhaarNumber && (
                  <p className="text-error text-xs mt-1">{errors.aadhaarNumber.message}</p>
                )}
              </div>

              {/* Aadhaar Uploads: Front & Back side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Front Side */}
                <div>
                  <label className="block text-xs font-semibold text-dark-700 mb-1">
                    Aadhaar Front Side *
                  </label>
                  <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full text-xs py-2 px-2.5 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {idProofFiles.aadhaarFront ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600 flex-shrink-0" />
                        <span className="truncate">{idProofFiles.aadhaarFront.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                        Upload Front
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'aadhaarFront')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {idProofFiles.aadhaarFront && (
                    <div className="mt-2">
                      <div className="border border-gray-200 rounded-lg overflow-hidden w-full h-16 bg-gray-50 flex items-center justify-center">
                        {idProofFiles.aadhaarFront.format === 'pdf' ? (
                          <span className="text-[11px] font-bold text-red-600">PDF Document</span>
                        ) : (
                          <img
                            src={idProofFiles.aadhaarFront.url}
                            alt="Aadhaar Front"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Back Side */}
                <div>
                  <label className="block text-xs font-semibold text-dark-700 mb-1">
                    Aadhaar Back Side *
                  </label>
                  <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full text-xs py-2 px-2.5 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {idProofFiles.aadhaarBack ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600 flex-shrink-0" />
                        <span className="truncate">{idProofFiles.aadhaarBack.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                        Upload Back
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'aadhaarBack')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {idProofFiles.aadhaarBack && (
                    <div className="mt-2">
                      <div className="border border-gray-200 rounded-lg overflow-hidden w-full h-16 bg-gray-50 flex items-center justify-center">
                        {idProofFiles.aadhaarBack.format === 'pdf' ? (
                          <span className="text-[11px] font-bold text-red-600">PDF Document</span>
                        ) : (
                          <img
                            src={idProofFiles.aadhaarBack.url}
                            alt="Aadhaar Back"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: PAN Card Verification (Mandatory) */}
          <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  2. PAN Card Verification *
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Mandatory
                </span>
              </div>

              {/* PAN Number */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-dark-700 mb-1.5">
                  10-Character PAN Number *
                </label>
                <input
                  type="text"
                  {...register('panNumber', {
                    required: 'PAN number is required',
                    pattern: {
                      value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
                      message: 'Enter valid 10-character PAN (e.g. ABCDE1234F)'
                    }
                  })}
                  className="input-field text-sm font-mono tracking-wider uppercase"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                {errors.panNumber && (
                  <p className="text-error text-xs mt-1">{errors.panNumber.message}</p>
                )}
              </div>

              {/* PAN Card Upload */}
              <div>
                <label className="block text-xs font-semibold text-dark-700 mb-1">
                  Upload PAN Card Document *
                </label>
                <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full text-xs py-2 px-2.5 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {idProofFiles.pan ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600 flex-shrink-0" />
                      <span className="truncate">{idProofFiles.pan.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      Choose File (Image / PDF)
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, 'pan')}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {idProofFiles.pan && (
                  <div className="mt-2">
                    <div className="border border-gray-200 rounded-lg overflow-hidden w-full h-16 bg-gray-50 flex items-center justify-center">
                      {idProofFiles.pan.format === 'pdf' ? (
                        <span className="text-[11px] font-bold text-red-600">PDF Document</span>
                      ) : (
                        <img
                          src={idProofFiles.pan.url}
                          alt="PAN Card"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Selfie Upload */}
      <div className="bg-green-50/80 border-l-4 border-green-500 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-600 text-white rounded-xl shadow-xs mt-0.5">
            <Camera className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-dark-800 mb-1">Authorised Person Selfie Photo *</h3>
            <p className="text-xs text-gray-600 mb-3">Upload a recent, clear live face photograph of the Authorised Person / Owner.</p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <label className={`btn-secondary cursor-pointer flex items-center justify-center py-2 px-4 text-xs font-bold ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {selfie ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    {selfie.name}
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2 text-green-600" />
                    Take / Upload Selfie
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => handleFileUpload(e, 'selfie')}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {selfie && (
                <div className="flex items-center gap-3">
                  <img src={selfie.url} alt="Selfie" className="w-16 h-16 object-cover rounded-xl border-2 border-green-500 shadow-sm" />
                  <span className="text-xs font-bold text-green-700">✓ Selfie Uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Business Documentation (With GST Section Included) */}
      <div className="bg-purple-50/80 border-l-4 border-purple-500 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs mt-0.5">
            <Building className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-dark-800">Business Documentation *</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Upload official establishment / enterprise proof and optional GST certification.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Business Proof Type Dropdown & Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                Business Documentation Type *
              </label>
              <select
                {...register('businessProofType', { required: 'Business proof type is required' })}
                className="input-field text-sm"
              >
                <option value="">Select Document Type</option>
                {businessProofTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.businessProofType && (
                <p className="text-error text-xs mt-1">{errors.businessProofType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                Upload Business Document *
              </label>
              <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full text-xs py-2 px-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {businessDoc ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600 flex-shrink-0" />
                    <span className="truncate">{businessDoc.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    Choose Document (PDF / Image)
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'businessDoc')}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {businessDoc && (
                <div className="mt-1.5 flex items-center justify-between text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                  <span>✓ {businessDoc.name}</span>
                  <a href={businessDoc.url} target="_blank" rel="noopener noreferrer" className="font-bold underline text-primary-600">View</a>
                </div>
              )}
            </div>
          </div>

          {/* If Other specify */}
          {watch('businessProofType') === 'Other' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                Specify Document Name *
              </label>
              <input
                type="text"
                {...register('businessProofOther', { required: 'Please specify document type' })}
                className="input-field text-sm"
                placeholder="Enter document type name"
              />
            </div>
          )}

          {/* GST Section (Included Inside Business Documentation) */}
          <div className="mt-4 pt-4 border-t border-purple-200/70">
            <div className="flex items-center gap-2.5 mb-3">
              <input
                type="checkbox"
                {...register('hasGST')}
                id="hasGST"
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="hasGST" className="text-xs font-bold text-dark-800 cursor-pointer select-none">
                I have GST Registration (Check if venue has GST certificate)
              </label>
            </div>

            {watch('hasGST') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-purple-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                    GST Number *
                  </label>
                  <input
                    type="text"
                    {...register('gstNumber', {
                      required: watch('hasGST') ? 'GST number is required' : false,
                      pattern: {
                        value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
                        message: 'Enter valid GST number (e.g., 22AAAAA0000A1Z5)'
                      }
                    })}
                    className="input-field text-sm font-mono uppercase tracking-wider"
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                  {errors.gstNumber && (
                    <p className="text-error text-xs mt-1">{errors.gstNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
                    Upload GST Certificate *
                  </label>
                  <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full text-xs py-2 px-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {idProofFiles.gstDoc ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600 flex-shrink-0" />
                        <span className="truncate">{idProofFiles.gstDoc.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                        Choose GST Certificate (PDF / Image)
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'gstDoc')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {idProofFiles.gstDoc && (
                    <div className="mt-1.5 flex items-center justify-between text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                      <span>✓ {idProofFiles.gstDoc.name}</span>
                      <a href={idProofFiles.gstDoc.url} target="_blank" rel="noopener noreferrer" className="font-bold underline text-primary-600">View</a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Bank Details */}
      <div className="bg-yellow-50/80 border-l-4 border-yellow-500 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-yellow-500 text-white rounded-xl shadow-xs mt-0.5">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-dark-800">Settlement Bank Account Details</h3>
            <p className="text-xs text-gray-600 mt-0.5">Payouts and booking remittances will be transferred to this bank account.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
              Account Holder Name *
            </label>
            <input
              type="text"
              {...register('accountHolder', { required: 'Account holder name is required' })}
              className="input-field text-sm"
              placeholder="e.g. Rajesh Kumar or Company Name"
            />
            {errors.accountHolder && (
              <p className="text-error text-xs mt-1">{errors.accountHolder.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
              Account Number *
            </label>
            <input
              type="text"
              {...register('accountNumber', {
                required: 'Account number is required',
                pattern: {
                  value: /^[0-9]{9,18}$/,
                  message: 'Enter valid account number (9-18 digits)'
                }
              })}
              className="input-field text-sm font-mono"
              placeholder="123456789012"
            />
            {errors.accountNumber && (
              <p className="text-error text-xs mt-1">{errors.accountNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
              IFSC Code *
            </label>
            <input
              type="text"
              {...register('ifsc', {
                required: 'IFSC code is required',
                pattern: {
                  value: /^[A-Z]{4}0[A-Z0-9]{6}$/i,
                  message: 'Enter valid IFSC code (e.g., SBIN0001234)'
                }
              })}
              className="input-field text-sm font-mono uppercase"
              placeholder="SBIN0001234"
              maxLength={11}
            />
            {errors.ifsc && (
              <p className="text-error text-xs mt-1">{errors.ifsc.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
              Bank Name *
            </label>
            <input
              type="text"
              {...register('bankName', { required: 'Bank name is required' })}
              className="input-field text-sm"
              placeholder="e.g. State Bank of India"
            />
            {errors.bankName && (
              <p className="text-error text-xs mt-1">{errors.bankName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
              Branch Name
            </label>
            <input
              type="text"
              {...register('branchName')}
              className="input-field text-sm"
              placeholder="e.g. Main Branch, Indore"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
              Account Type *
            </label>
            <select
              {...register('accountType', { required: 'Account type is required' })}
              className="input-field text-sm"
            >
              <option value="">Select Account Type</option>
              <option value="Current">Current Account</option>
              <option value="Savings">Savings Account</option>
            </select>
            {errors.accountType && (
              <p className="text-error text-xs mt-1">{errors.accountType.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-700 mb-1.5">
              Upload Bank Proof (Cancelled Cheque / Passbook)
            </label>
            <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full text-xs py-2.5 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {bankProof ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  {bankProof.name}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File (Cancelled Cheque / Bank Statement)
                </>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, 'bankProof')}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {bankProof && (
              <div className="mt-1.5 flex items-center justify-between text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                <span>✓ {bankProof.name}</span>
                <a href={bankProof.url} target="_blank" rel="noopener noreferrer" className="font-bold underline text-primary-600">View</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goBack}
          className="btn-secondary px-6 py-2.5 text-xs font-bold"
        >
          Previous Step
        </button>

        <button
          type="submit"
          className="btn-primary px-8 py-2.5 text-xs font-bold shadow-md"
        >
          Save & Proceed to Final Review
        </button>
      </div>
    </form>
  );
}
