'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useVenueFormStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { FileText, User, CreditCard, Building, Camera, Upload, Loader2, CheckCircle } from 'lucide-react';
import { uploadDocument } from '@/lib/cloudinary';

const businessProofTypes = [
  'Business Regd. Certificate',
  'Trade License',
  'Certificate of Incorporation',
  'Partnership Deed',
  'Udyog Aadhar',
  'Other'
];

export default function Step6OwnerDocs() {
  const { formData, setFormData, setStep } = useVenueFormStore();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      fullName: formData.ownerInfo?.fullName || '',
      email: formData.ownerInfo?.email || '',
      mobile: formData.ownerInfo?.mobile || '',
      alternatePhone: formData.ownerInfo?.alternatePhone || '',
      role: formData.ownerInfo?.role || '',
      aadhaarNumber: formData.documents?.idProof?.number || '',
      panNumber: formData.documents?.idProof?.number || '',
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
        role: formData.ownerInfo?.role || '',
        aadhaarNumber: formData.documents?.idProof?.number || '',
        panNumber: formData.documents?.idProof?.number || '',
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
    }
  }, [formData.ownerInfo, formData.documents, formData.bankDetails]);

  const [idProofType, setIdProofType] = useState(formData.documents?.idProof?.type || 'Aadhaar');
  
  // Load existing documents in edit mode
  const [idProofFiles, setIdProofFiles] = useState(() => {
    const existing = {};
    if (formData.documents?.idProof?.frontUrl) {
      existing.front = {
        url: formData.documents.idProof.frontUrl,
        name: 'ID Proof Front',
        format: 'image'
      };
    }
    if (formData.documents?.idProof?.backUrl) {
      existing.back = {
        url: formData.documents.idProof.backUrl,
        name: 'ID Proof Back',
        format: 'image'
      };
    }
    if (idProofType === 'PAN' && formData.documents?.idProof?.frontUrl) {
      existing.pan = {
        url: formData.documents.idProof.frontUrl,
        name: 'PAN Card',
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
        if (formData.documents.idProof?.frontUrl) {
          updated.front = { url: formData.documents.idProof.frontUrl, name: 'ID Proof Front', format: 'image' };
        }
        if (formData.documents.idProof?.backUrl) {
          updated.back = { url: formData.documents.idProof.backUrl, name: 'ID Proof Back', format: 'image' };
        }
        if (formData.documents.idProof?.type === 'PAN' && formData.documents.idProof?.frontUrl) {
          updated.pan = { url: formData.documents.idProof.frontUrl, name: 'PAN Card', format: 'image' };
        }
        if (formData.documents.idProof?.gstDocUrl) {
          updated.gstDoc = { url: formData.documents.idProof.gstDocUrl, name: 'GST Certificate', format: 'image' };
        }
        return updated;
      });
      if (formData.documents.idProof?.type) setIdProofType(formData.documents.idProof.type);
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
  }, [formData.documents, formData.bankDetails]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Type validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setUploading(true);
    
    try {
      // Upload to Cloudinary
      toast.loading(`Uploading ${file.name}...`, { id: type });
      const cloudinaryData = await uploadDocument(file, 'documents');
      
      const uploadedFile = {
        url: cloudinaryData.url,
        publicId: cloudinaryData.publicId,
        name: file.name,
        format: cloudinaryData.format,
        size: file.size
      };

      if (type === 'selfie') {
        setSelfie(uploadedFile);
      } else if (type === 'businessDoc') {
        setBusinessDoc(uploadedFile);
      } else if (type === 'bankProof') {
        setBankProof(uploadedFile);
      } else {
        setIdProofFiles(prev => ({ ...prev, [type]: uploadedFile }));
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
    // Validation
    if (!selfie) {
      toast.error('Please upload your selfie');
      return;
    }

    if (!businessDoc) {
      toast.error('Please upload business document');
      return;
    }

    if (idProofType === 'Aadhaar' && (!idProofFiles.front || !idProofFiles.back)) {
      toast.error('Please upload both front and back of Aadhaar');
      return;
    }

    if (idProofType === 'PAN' && !idProofFiles.pan) {
      toast.error('Please upload PAN card');
      return;
    }

    const ownerData = {
      ...data,
      idProofType,
      idProofFiles,
      selfie,
      businessDoc
    };

    // Prepare documents data for backend
    const documentsData = {
      idProofType,
      idProofNumber: idProofType === 'Aadhaar' ? data.aadhaarNumber : data.panNumber,
      idProofFrontUrl: idProofFiles.front?.url || idProofFiles.pan?.url,
      idProofBackUrl: idProofFiles.back?.url,
      idProofFrontPublicId: idProofFiles.front?.publicId || idProofFiles.pan?.publicId,
      idProofBackPublicId: idProofFiles.back?.publicId,
      selfieUrl: selfie?.url,
      selfiePublicId: selfie?.publicId,
      businessProofType: data.businessProofType,
      businessProofOther: data.businessProofOther,
      businessProofUrl: businessDoc?.url,
      businessProofPublicId: businessDoc?.publicId
    };

    // Prepare bank details separately
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
      ownerInfo: data,
      documents: documentsData,
      bankDetails: bankDetailsData
    });
    setStep(7);
    toast.success('Documents saved! 🎉');
  };

  const goBack = () => {
    setStep(5);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-slide-up">
      {/* Header with upload status */}
      {uploading && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4 flex items-center">
          <Loader2 className="w-5 h-5 text-blue-600 mr-3 animate-spin" />
          <span className="text-blue-800 font-medium">Uploading document to cloud storage...</span>
        </div>
      )}

      {/* Owner Details */}
      <div className="bg-primary-50 border-l-4 border-primary-500 rounded-xl p-5">
        <div className="flex items-start">
          <User className="w-6 h-6 text-primary-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-4">Owner Details</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('fullName', { required: 'Full name is required' })}
                  className="input-field"
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="text-error text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="input-field"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-error text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  {...register('mobile', { 
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Enter valid 10-digit mobile number'
                    }
                  })}
                  className="input-field"
                  placeholder="9876543210"
                  maxLength={10}
                />
                {errors.mobile && (
                  <p className="text-error text-sm mt-1">{errors.mobile.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Alternate Number
                </label>
                <input
                  type="tel"
                  {...register('alternatePhone')}
                  className="input-field"
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Your Role *
                </label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="input-field"
                >
                  <option value="">Select role</option>
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option>
                  <option value="Representative">Representative</option>
                </select>
                {errors.role && (
                  <p className="text-error text-sm mt-1">{errors.role.message}</p>
                )}
              </div>
            </div>

            {/* GST Section */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  {...register('hasGST')}
                  id="hasGST"
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <label htmlFor="hasGST" className="text-sm font-semibold text-dark-700 cursor-pointer">
                  I have GST Registration
                </label>
              </div>
              
              {watch('hasGST') && (
                <div className="mt-3 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      GST Number *
                    </label>
                    <input
                      type="text"
                      {...register('gstNumber', { 
                        required: watch('hasGST') ? 'GST number is required' : false,
                        pattern: {
                          value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                          message: 'Enter valid GST number (e.g., 22AAAAA0000A1Z5)'
                        }
                      })}
                      className="input-field"
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      style={{ textTransform: 'uppercase' }}
                    />
                    {errors.gstNumber && (
                      <p className="text-error text-sm mt-1">{errors.gstNumber.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Upload GST Certificate *
                    </label>
                    <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {idProofFiles.gstDoc ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          {idProofFiles.gstDoc.name}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
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
                      <div className="mt-2">
                        <p className="text-xs text-green-600 mb-1">✓ Uploaded</p>
                        {idProofFiles.gstDoc.format === 'pdf' ? (
                          <a href={idProofFiles.gstDoc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 underline">View PDF</a>
                        ) : (
                          <img src={idProofFiles.gstDoc.url} alt="GST Certificate" className="w-24 h-16 object-cover rounded border" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ID Proof */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-5">
        <div className="flex items-start">
          <CreditCard className="w-6 h-6 text-blue-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-4">ID Proof *</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Select ID Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="Aadhaar"
                    checked={idProofType === 'Aadhaar'}
                    onChange={(e) => setIdProofType(e.target.value)}
                    className="w-5 h-5 text-primary-500"
                  />
                  <span className="ml-2">Aadhaar</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="PAN"
                    checked={idProofType === 'PAN'}
                    onChange={(e) => setIdProofType(e.target.value)}
                    className="w-5 h-5 text-primary-500"
                  />
                  <span className="ml-2">PAN Card</span>
                </label>
              </div>
            </div>

            {idProofType === 'Aadhaar' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    Aadhaar Number *
                  </label>
                  <input
                    type="text"
                    {...register('aadhaarNumber', { 
                      required: idProofType === 'Aadhaar' ? 'Aadhaar number is required' : false,
                      pattern: {
                        value: /^[0-9]{12}$/,
                        message: 'Enter valid 12-digit Aadhaar number'
                      }
                    })}
                    className="input-field"
                    placeholder="XXXX XXXX XXXX"
                    maxLength={12}
                  />
                  {errors.aadhaarNumber && (
                    <p className="text-error text-sm mt-1">{errors.aadhaarNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    Upload Front *
                  </label>
                  <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {idProofFiles.front ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        {idProofFiles.front.name}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'front')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {idProofFiles.front && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600 mb-1">✓ Uploaded to cloud</p>
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden w-32">
                        <img 
                          src={idProofFiles.front.url} 
                          alt="Aadhaar Front" 
                          className="w-full h-20 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    Upload Back *
                  </label>
                  <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {idProofFiles.back ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        {idProofFiles.back.name}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'back')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {idProofFiles.back && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600 mb-1">✓ Uploaded to cloud</p>
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden w-32">
                        <img 
                          src={idProofFiles.back.url} 
                          alt="Aadhaar Back" 
                          className="w-full h-20 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {idProofType === 'PAN' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    {...register('panNumber', { 
                      required: idProofType === 'PAN' ? 'PAN number is required' : false,
                      pattern: {
                        value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                        message: 'Enter valid PAN number'
                      }
                    })}
                    className="input-field"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.panNumber && (
                    <p className="text-error text-sm mt-1">{errors.panNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    Upload PAN Card *
                  </label>
                  <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {idProofFiles.pan ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        {idProofFiles.pan.name}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
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
                      <p className="text-xs text-green-600 mb-1">✓ Uploaded to cloud</p>
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden w-32">
                        <img 
                          src={idProofFiles.pan.url} 
                          alt="PAN Card" 
                          className="w-full h-20 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selfie */}
      <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-5">
        <div className="flex items-start">
          <Camera className="w-6 h-6 text-green-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-2">Selfie Upload *</h3>
            <p className="text-sm text-gray-600 mb-3">Upload a clear photo of yourself</p>
            
            <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full md:w-auto ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {selfie ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  {selfie.name}
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Take/Upload Selfie
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
              <div className="mt-2">
                <p className="text-xs text-green-600 mb-1">✓ Uploaded to cloud</p>
                <img src={selfie.url} alt="Selfie" className="w-24 h-24 object-cover rounded-lg border-2 border-green-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Documents */}
      <div className="bg-purple-50 border-l-4 border-purple-500 rounded-xl p-5">
        <div className="flex items-start">
          <Building className="w-6 h-6 text-purple-500 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-4">Business Documentation *</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Business Proof Type *
              </label>
              <select
                {...register('businessProofType', { required: 'Business proof type is required' })}
                className="input-field"
              >
                <option value="">Select type</option>
                {businessProofTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.businessProofType && (
                <p className="text-error text-sm mt-1">{errors.businessProofType.message}</p>
              )}
            </div>

            {watch('businessProofType') === 'Other' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Specify Document Type *
                </label>
                <input
                  type="text"
                  {...register('businessProofOther', { required: 'Please specify document type' })}
                  className="input-field"
                  placeholder="Enter document type"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Upload Document *
              </label>
              <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full md:w-auto ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {businessDoc ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    {businessDoc.name}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
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
                <div className="mt-2">
                  <p className="text-xs text-green-600 mb-1">✓ Uploaded to cloud{businessDoc.format ? ` • ${businessDoc.format.toUpperCase()}` : ''}</p>
                  {businessDoc.format === 'pdf' ? (
                    <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50 w-64">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{businessDoc.name}</p>
                          <p className="text-xs text-gray-500">PDF</p>
                        </div>
                        <a 
                          href={businessDoc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-primary-500 text-white text-xs rounded hover:bg-primary-600 flex-shrink-0"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden w-32">
                      <img 
                        src={businessDoc.url} 
                        alt="Business Document" 
                        className="w-full h-20 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-xl p-5">
        <div className="flex items-start">
          <CreditCard className="w-6 h-6 text-yellow-600 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark-800 mb-4">Bank Details for Payouts *</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  {...register('accountHolder', { required: 'Account holder name is required' })}
                  className="input-field"
                />
                {errors.accountHolder && (
                  <p className="text-error text-sm mt-1">{errors.accountHolder.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  {...register('accountNumber', {
                    required: 'Account number is required',
                    pattern: { value: /^\d+$/, message: 'Only numbers allowed' },
                    maxLength: { value: 18, message: 'Max 18 digits' }
                  })}
                  className="input-field"
                  placeholder="Numeric only"
                  maxLength={18}
                  onInput={e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 18); }}
                />
                {errors.accountNumber && (
                  <p className="text-error text-sm mt-1">{errors.accountNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  {...register('ifsc', {
                    required: 'IFSC code is required',
                    pattern: {
                      value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                      message: 'Enter valid IFSC code (e.g. SBIN0001234)'
                    },
                    maxLength: { value: 11, message: 'Max 11 characters' }
                  })}
                  className="input-field"
                  placeholder="SBIN0001234"
                  maxLength={11}
                  style={{ textTransform: 'uppercase' }}
                  onInput={e => { e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 11).toUpperCase(); }}
                />
                {errors.ifsc && (
                  <p className="text-error text-sm mt-1">{errors.ifsc.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  {...register('bankName', { required: 'Bank name is required' })}
                  className="input-field"
                />
                {errors.bankName && (
                  <p className="text-error text-sm mt-1">{errors.bankName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Branch Name *
                </label>
                <input
                  type="text"
                  {...register('branchName', { required: 'Branch name is required' })}
                  className="input-field"
                />
                {errors.branchName && (
                  <p className="text-error text-sm mt-1">{errors.branchName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Account Type *
                </label>
                <select
                  {...register('accountType', { required: 'Account type is required' })}
                  className="input-field"
                >
                  <option value="">Select type</option>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
                {errors.accountType && (
                  <p className="text-error text-sm mt-1">{errors.accountType.message}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              🔒 Your bank details will be encrypted and stored securely
            </p>

            {/* Bank Proof Upload */}
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Bank Proof (Passbook / Cancelled Cheque) *
              </label>
              <label className={`btn-secondary cursor-pointer flex items-center justify-center w-full md:w-auto ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {bankProof ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    {bankProof.name}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Passbook / Cancelled Cheque
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
                <div className="mt-2">
                  <p className="text-xs text-green-600 mb-1">✓ Uploaded</p>
                  {bankProof.format === 'pdf' ? (
                    <a href={bankProof.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 underline">View PDF</a>
                  ) : (
                    <img src={bankProof.url} alt="Bank Proof" className="w-32 h-20 object-cover rounded border-2 border-gray-200" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goBack}
          className="btn-secondary flex items-center group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center group"
        >
          Next Step
          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}

