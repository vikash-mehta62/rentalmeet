'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeForm({ employee, onClose, onSuccess, token }) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    title: employee?.employeeDetails?.title || 'Mr',
    name: employee?.name || '',
    fatherOrHusbandName: employee?.employeeDetails?.fatherOrHusbandName || '',
    dateOfBirth: employee?.employeeDetails?.dateOfBirth ? new Date(employee.employeeDetails.dateOfBirth).toISOString().split('T')[0] : '',
    gender: employee?.employeeDetails?.gender || 'Male',
    maritalStatus: employee?.employeeDetails?.maritalStatus || 'Single',
    bloodGroup: employee?.employeeDetails?.bloodGroup || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    alternatePhone: employee?.alternatePhone || '',
    address: employee?.address || '',
    city: employee?.city || '',
    state: employee?.state || '',
    pincode: employee?.pincode || '',
    // Employment details
    position: employee?.employeeDetails?.position || '',
    department: employee?.employeeDetails?.department || '',
    employmentType: employee?.employeeDetails?.employmentType || 'Permanent',
    salary: employee?.employeeDetails?.salary || '',
    contractPaymentType: employee?.employeeDetails?.contractDetails?.paymentType || 'perLead',
    contractAmount: employee?.employeeDetails?.contractDetails?.amount || '',
    joiningDate: employee?.employeeDetails?.joiningDate ? new Date(employee.employeeDetails.joiningDate).toISOString().split('T')[0] : '',
    previousExperience: employee?.employeeDetails?.previousExperience || 0,
    tenth: {
      board: employee?.employeeDetails?.qualification?.tenth?.board || '',
      year: employee?.employeeDetails?.qualification?.tenth?.year || '',
      percentage: employee?.employeeDetails?.qualification?.tenth?.percentage || ''
    },
    twelfth: {
      board: employee?.employeeDetails?.qualification?.twelfth?.board || '',
      year: employee?.employeeDetails?.qualification?.twelfth?.year || '',
      percentage: employee?.employeeDetails?.qualification?.twelfth?.percentage || ''
    },
    graduation: {
      degree: employee?.employeeDetails?.qualification?.graduation?.degree || '',
      university: employee?.employeeDetails?.qualification?.graduation?.university || '',
      year: employee?.employeeDetails?.qualification?.graduation?.year || '',
      percentage: employee?.employeeDetails?.qualification?.graduation?.percentage || ''
    },
    postGraduation: {
      degree: employee?.employeeDetails?.qualification?.postGraduation?.degree || '',
      university: employee?.employeeDetails?.qualification?.postGraduation?.university || '',
      year: employee?.employeeDetails?.qualification?.postGraduation?.year || '',
      percentage: employee?.employeeDetails?.qualification?.postGraduation?.percentage || ''
    },
    aadhaarNumber: employee?.employeeDetails?.documents?.aadhaarNumber || '',
    panNumber: employee?.employeeDetails?.documents?.panNumber || '',
    accountHolderName: employee?.employeeDetails?.bankDetails?.accountHolderName || '',
    accountNumber: employee?.employeeDetails?.bankDetails?.accountNumber || '',
    ifscCode: employee?.employeeDetails?.bankDetails?.ifscCode || '',
    bankName: employee?.employeeDetails?.bankDetails?.bankName || '',
    branchName: employee?.employeeDetails?.bankDetails?.branchName || '',
    emergencyName: employee?.employeeDetails?.emergencyContact?.name || '',
    emergencyRelationship: employee?.employeeDetails?.emergencyContact?.relationship || '',
    emergencyPhone: employee?.employeeDetails?.emergencyContact?.phone || '',
    password: ''
  });

  const [files, setFiles] = useState({
    photo: null, aadhaarFront: null, aadhaarBack: null, panCard: null,
    tenthCertificate: null, twelfthCertificate: null,
    graduationCertificate: null, postGraduationCertificate: null
  });

  // Uploaded URLs — populated instantly on file select
  const [uploadedUrls, setUploadedUrls] = useState({
    photo: employee?.employeeDetails?.photo || null,
    aadhaarFront: employee?.employeeDetails?.documents?.aadhaarFront || null,
    aadhaarBack: employee?.employeeDetails?.documents?.aadhaarBack || null,
    panCard: employee?.employeeDetails?.documents?.panCard || null,
    tenthCertificate: employee?.employeeDetails?.qualification?.tenth?.certificate || null,
    twelfthCertificate: employee?.employeeDetails?.qualification?.twelfth?.certificate || null,
    graduationCertificate: employee?.employeeDetails?.qualification?.graduation?.certificate || null,
    postGraduationCertificate: employee?.employeeDetails?.qualification?.postGraduation?.certificate || null,
  });

  // Per-field uploading state
  const [uploading, setUploading] = useState({});

  const steps = [
    { id: 1, name: 'Basic Details' },
    { id: 2, name: 'Qualification' },
    { id: 3, name: 'Documents & Bank' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size should be less than 5MB'); return; }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) { toast.error('Only JPG, PNG, and PDF files are allowed'); return; }

    setUploading(prev => ({ ...prev, [fieldName]: true }));
    setFiles(prev => ({ ...prev, [fieldName]: file }));

    const toastId = toast.loading(`Uploading ${fieldName.replace(/([A-Z])/g, ' $1').trim()}...`);
    try {
      const url = await uploadFile(file);
      setUploadedUrls(prev => ({ ...prev, [fieldName]: url }));
      toast.success('Uploaded successfully!', { id: toastId });
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(`Upload failed: ${err.message}`, { id: toastId });
      setFiles(prev => ({ ...prev, [fieldName]: null }));
      // Reset the input
      e.target.value = '';
    } finally {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'employees');

    let res;
    try {
      res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
    } catch (networkErr) {
      throw new Error('Network error — check your connection');
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server error ${res.status}: ${text.slice(0, 100)}`);
    }

    const data = await res.json();
    if (data.success) return data.url;
    throw new Error(data.message || 'Upload failed');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // All files already uploaded on select — use uploadedUrls directly
      const employeeData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        role: 'employee',
        employeeDetails: {
          title: formData.title,
          fatherOrHusbandName: formData.fatherOrHusbandName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          maritalStatus: formData.maritalStatus,
          bloodGroup: formData.bloodGroup,
          photo: uploadedUrls.photo,
          position: formData.position,
          department: formData.department,
          employmentType: formData.employmentType,
          salary: formData.employmentType === 'Permanent' ? (formData.salary || undefined) : undefined,
          contractDetails: formData.employmentType === 'Contract' ? {
            paymentType: formData.contractPaymentType,
            amount: formData.contractAmount ? Number(formData.contractAmount) : undefined
          } : undefined,
          joiningDate: formData.joiningDate || undefined,
          previousExperience: formData.previousExperience || 0,
          qualification: {
            tenth: { ...formData.tenth, certificate: uploadedUrls.tenthCertificate },
            twelfth: { ...formData.twelfth, certificate: uploadedUrls.twelfthCertificate },
            graduation: { ...formData.graduation, certificate: uploadedUrls.graduationCertificate },
            postGraduation: { ...formData.postGraduation, certificate: uploadedUrls.postGraduationCertificate }
          },
          documents: {
            aadhaarNumber: formData.aadhaarNumber,
            aadhaarFront: uploadedUrls.aadhaarFront,
            aadhaarBack: uploadedUrls.aadhaarBack,
            panNumber: formData.panNumber,
            panCard: uploadedUrls.panCard
          },
          bankDetails: {
            accountHolderName: formData.accountHolderName,
            accountNumber: formData.accountNumber,
            ifscCode: formData.ifscCode,
            bankName: formData.bankName,
            branchName: formData.branchName
          },
          emergencyContact: {
            name: formData.emergencyName,
            relationship: formData.emergencyRelationship,
            phone: formData.emergencyPhone
          }
        }
      };

      if (!employee && formData.password) employeeData.password = formData.password;

      const url = employee
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/employees/${employee._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/employees`;

      const res = await fetch(url, {
        method: employee ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });
      const data = await res.json();

      if (data.success) {
        toast.success(employee ? 'Employee updated!' : 'Employee created!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Failed to save employee');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Step {currentStep} of {steps.length}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${currentStep >= step.id ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {step.id}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'}`}>{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${currentStep > step.id ? 'bg-primary-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">

          {/* ── Step 1: Basic Details ── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Title <span className="text-red-500">*</span></label>
                  <select name="title" value={formData.title} onChange={handleInputChange} className={inputCls}>
                    {['Mr','Mrs','Ms','Dr','Prof'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputCls} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Father's/Husband's Name <span className="text-red-500">*</span></label>
                  <input type="text" name="fatherOrHusbandName" value={formData.fatherOrHusbandName} onChange={handleInputChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={inputCls} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Gender <span className="text-red-500">*</span></label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputCls}>
                    {['Male','Female','Other'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Marital Status</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} className={inputCls}>
                    {['Single','Married','Divorced','Widowed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className={inputCls}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t pt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>Alternate Phone</label>
                    <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleInputChange} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Full Address <span className="text-red-500">*</span></label>
                    <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className={inputCls} required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelCls}>City <span className="text-red-500">*</span></label><input type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputCls} required /></div>
                    <div><label className={labelCls}>State <span className="text-red-500">*</span></label><input type="text" name="state" value={formData.state} onChange={handleInputChange} className={inputCls} required /></div>
                    <div><label className={labelCls}>Pincode <span className="text-red-500">*</span></label><input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className={inputCls} required /></div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Photo</h3>
                <div className="flex items-center gap-4">
                  {uploadedUrls.photo && (
                    <img src={uploadedUrls.photo} alt="Photo" className="w-16 h-16 rounded-full object-cover border-2 border-primary-300" />
                  )}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} className={inputCls} />
                    {uploading.photo && <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><span className="animate-spin">⏳</span> Uploading...</p>}
                    {uploadedUrls.photo && !uploading.photo && <p className="text-xs text-green-600 mt-1">✓ Uploaded successfully</p>}
                  </div>
                </div>
              </div>

              <div className="border-t pt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelCls}>Name</label><input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleInputChange} className={inputCls} /></div>
                  <div><label className={labelCls}>Relationship</label><input type="text" name="emergencyRelationship" value={formData.emergencyRelationship} onChange={handleInputChange} placeholder="e.g., Father" className={inputCls} /></div>
                  <div><label className={labelCls}>Phone</label><input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} className={inputCls} /></div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="border-t pt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Employment Details</h3>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Position / Designation</label>
                      <input type="text" name="position" value={formData.position} onChange={handleInputChange} placeholder="e.g., Sales Executive" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Department</label>
                      <input type="text" name="department" value={formData.department} onChange={handleInputChange} placeholder="e.g., Operations" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Joining Date</label>
                      <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Previous Experience (years)</label>
                      <input type="number" name="previousExperience" value={formData.previousExperience} onChange={handleInputChange} min="0" className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Employment Type</label>
                    <div className="flex gap-4">
                      {['Permanent', 'Contract'].map(t => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="employmentType" value={t}
                            checked={formData.employmentType === t}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-primary-500" />
                          <span className="text-sm font-medium text-gray-700">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.employmentType === 'Permanent' && (
                    <div>
                      <label className={labelCls}>Monthly Salary (₹)</label>
                      <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} min="0" placeholder="e.g., 25000" className={inputCls} />
                    </div>
                  )}

                  {formData.employmentType === 'Contract' && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelCls}>Payment Type</label>
                        <select name="contractPaymentType" value={formData.contractPaymentType} onChange={handleInputChange} className={inputCls}>
                          <option value="perLead">Per Lead</option>
                          <option value="overall">Overall Contract</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Amount (₹)</label>
                        <input type="number" name="contractAmount" value={formData.contractAmount} onChange={handleInputChange} min="0" placeholder="e.g., 5000" className={inputCls} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!employee && (
                <div className="border-t pt-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Login Credentials</h3>
                  <div>
                    <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={inputCls} required minLength="6" />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Qualification ── */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900">Educational Qualification</h3>

              {/* 10th */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 text-sm">10th Standard</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelCls}>Board</label><input type="text" name="tenth.board" value={formData.tenth.board} onChange={handleInputChange} placeholder="e.g., CBSE" className={inputCls} /></div>
                  <div><label className={labelCls}>Year</label><input type="number" name="tenth.year" value={formData.tenth.year} onChange={handleInputChange} min="1950" max={new Date().getFullYear()} className={inputCls} /></div>
                  <div><label className={labelCls}>Percentage</label><input type="number" name="tenth.percentage" value={formData.tenth.percentage} onChange={handleInputChange} min="0" max="100" step="0.01" className={inputCls} /></div>
                  <div className="md:col-span-3">
                    <label className={labelCls}>Certificate Upload</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'tenthCertificate')} className={inputCls} />
                    {uploading.tenthCertificate && <p className="text-xs text-blue-600 mt-1">⏳ Uploading...</p>}
                    {uploadedUrls.tenthCertificate && !uploading.tenthCertificate && <p className="text-xs text-green-600 mt-1 flex items-center gap-1">✓ Uploaded — <a href={uploadedUrls.tenthCertificate} target="_blank" rel="noopener noreferrer" className="underline">View</a></p>}
                  </div>
                </div>
              </div>

              {/* 12th */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 text-sm">12th Standard</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelCls}>Board</label><input type="text" name="twelfth.board" value={formData.twelfth.board} onChange={handleInputChange} placeholder="e.g., CBSE" className={inputCls} /></div>
                  <div><label className={labelCls}>Year</label><input type="number" name="twelfth.year" value={formData.twelfth.year} onChange={handleInputChange} min="1950" max={new Date().getFullYear()} className={inputCls} /></div>
                  <div><label className={labelCls}>Percentage</label><input type="number" name="twelfth.percentage" value={formData.twelfth.percentage} onChange={handleInputChange} min="0" max="100" step="0.01" className={inputCls} /></div>
                  <div className="md:col-span-3">
                    <label className={labelCls}>Certificate Upload</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'twelfthCertificate')} className={inputCls} />
                    {uploading.twelfthCertificate && <p className="text-xs text-blue-600 mt-1">⏳ Uploading...</p>}
                    {uploadedUrls.twelfthCertificate && !uploading.twelfthCertificate && <p className="text-xs text-green-600 mt-1 flex items-center gap-1">✓ Uploaded — <a href={uploadedUrls.twelfthCertificate} target="_blank" rel="noopener noreferrer" className="underline">View</a></p>}
                  </div>
                </div>
              </div>

              {/* Graduation */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 text-sm">Graduation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Degree</label><input type="text" name="graduation.degree" value={formData.graduation.degree} onChange={handleInputChange} placeholder="e.g., B.Com, B.Tech" className={inputCls} /></div>
                  <div><label className={labelCls}>University</label><input type="text" name="graduation.university" value={formData.graduation.university} onChange={handleInputChange} className={inputCls} /></div>
                  <div><label className={labelCls}>Year</label><input type="number" name="graduation.year" value={formData.graduation.year} onChange={handleInputChange} min="1950" max={new Date().getFullYear()} className={inputCls} /></div>
                  <div><label className={labelCls}>Percentage/CGPA</label><input type="number" name="graduation.percentage" value={formData.graduation.percentage} onChange={handleInputChange} min="0" max="100" step="0.01" className={inputCls} /></div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Certificate Upload</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'graduationCertificate')} className={inputCls} />
                    {uploading.graduationCertificate && <p className="text-xs text-blue-600 mt-1">⏳ Uploading...</p>}
                    {uploadedUrls.graduationCertificate && !uploading.graduationCertificate && <p className="text-xs text-green-600 mt-1 flex items-center gap-1">✓ Uploaded — <a href={uploadedUrls.graduationCertificate} target="_blank" rel="noopener noreferrer" className="underline">View</a></p>}
                  </div>
                </div>
              </div>

              {/* Post Graduation */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3 text-sm">Post Graduation <span className="font-normal text-gray-500">(Optional)</span></h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Degree</label><input type="text" name="postGraduation.degree" value={formData.postGraduation.degree} onChange={handleInputChange} placeholder="e.g., MBA, M.Tech" className={inputCls} /></div>
                  <div><label className={labelCls}>University</label><input type="text" name="postGraduation.university" value={formData.postGraduation.university} onChange={handleInputChange} className={inputCls} /></div>
                  <div><label className={labelCls}>Year</label><input type="number" name="postGraduation.year" value={formData.postGraduation.year} onChange={handleInputChange} min="1950" max={new Date().getFullYear()} className={inputCls} /></div>
                  <div><label className={labelCls}>Percentage/CGPA</label><input type="number" name="postGraduation.percentage" value={formData.postGraduation.percentage} onChange={handleInputChange} min="0" max="100" step="0.01" className={inputCls} /></div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Certificate Upload</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'postGraduationCertificate')} className={inputCls} />
                    {uploading.postGraduationCertificate && <p className="text-xs text-blue-600 mt-1">⏳ Uploading...</p>}
                    {uploadedUrls.postGraduationCertificate && !uploading.postGraduationCertificate && <p className="text-xs text-green-600 mt-1 flex items-center gap-1">✓ Uploaded — <a href={uploadedUrls.postGraduationCertificate} target="_blank" rel="noopener noreferrer" className="underline">View</a></p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Documents & Bank ── */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900">Identity Documents</h3>

              {/* Aadhaar */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 text-sm">Aadhaar Card</h4>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Aadhaar Number <span className="text-red-500">*</span></label>
                    <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleInputChange} placeholder="XXXX XXXX XXXX" maxLength="12" className={inputCls} required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Aadhaar Front</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'aadhaarFront')} className={inputCls} />
                      {uploading.aadhaarFront && <p className="text-xs text-blue-600 mt-1">⏳ Uploading...</p>}
                      {uploadedUrls.aadhaarFront && !uploading.aadhaarFront && <p className="text-xs text-green-600 mt-1">✓ Uploaded — <a href={uploadedUrls.aadhaarFront} target="_blank" rel="noopener noreferrer" className="underline">View</a></p>}
                    </div>
                    <div>
                      <label className={labelCls}>Aadhaar Back</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'aadhaarBack')} className={inputCls} />
                      {uploading.aadhaarBack && <p className="text-xs text-blue-600 mt-1">⏳ Uploading...</p>}
                      {uploadedUrls.aadhaarBack && !uploading.aadhaarBack && <p className="text-xs text-green-600 mt-1">✓ Uploaded — <a href={uploadedUrls.aadhaarBack} target="_blank" rel="noopener noreferrer" className="underline">View</a></p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* PAN */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 text-sm">PAN Card</h4>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>PAN Number <span className="text-red-500">*</span></label>
                    <input type="text" name="panNumber" value={formData.panNumber} onChange={handleInputChange} placeholder="ABCDE1234F" maxLength="10" className={`${inputCls} uppercase`} required />
                  </div>
                  <div>
                    <label className={labelCls}>PAN Card Upload</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'panCard')} className={inputCls} />
                    {uploading.panCard && <p className="text-xs text-blue-600 mt-1">⏳ Uploading...</p>}
                    {uploadedUrls.panCard && !uploading.panCard && <p className="text-xs text-green-600 mt-1">✓ Uploaded — <a href={uploadedUrls.panCard} target="_blank" rel="noopener noreferrer" className="underline">View</a></p>}
                  </div>
                </div>
              </div>

              {/* Bank */}
              <div className="border-t pt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Bank Account Details</h3>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelCls}>Account Holder Name <span className="text-red-500">*</span></label><input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleInputChange} className={inputCls} required /></div>
                    <div><label className={labelCls}>Account Number <span className="text-red-500">*</span></label><input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className={inputCls} required /></div>
                    <div><label className={labelCls}>IFSC Code <span className="text-red-500">*</span></label><input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} placeholder="e.g., SBIN0001234" className={`${inputCls} uppercase`} required /></div>
                    <div><label className={labelCls}>Bank Name <span className="text-red-500">*</span></label><input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="e.g., State Bank of India" className={inputCls} required /></div>
                    <div className="md:col-span-2"><label className={labelCls}>Branch Name</label><input type="text" name="branchName" value={formData.branchName} onChange={handleInputChange} className={inputCls} /></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => currentStep === 1 ? onClose() : setCurrentStep(s => s - 1)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep(s => s + 1)}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium text-sm transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                ) : (
                  employee ? 'Update Employee' : 'Create Employee'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
