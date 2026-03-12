'use client';

import { useState } from 'react';
import { X, Upload, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeForm({ employee, onClose, onSuccess, token }) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Details
    title: employee?.employeeDetails?.title || 'Mr',
    name: employee?.name || '',
    fatherOrHusbandName: employee?.employeeDetails?.fatherOrHusbandName || '',
    dateOfBirth: employee?.employeeDetails?.dateOfBirth ? new Date(employee.employeeDetails.dateOfBirth).toISOString().split('T')[0] : '',
    gender: employee?.employeeDetails?.gender || 'Male',
    maritalStatus: employee?.employeeDetails?.maritalStatus || 'Single',
    bloodGroup: employee?.employeeDetails?.bloodGroup || '',
    
    // Contact Details
    email: employee?.email || '',
    phone: employee?.phone || '',
    alternatePhone: employee?.alternatePhone || '',
    
    // Address
    address: employee?.address || '',
    city: employee?.city || '',
    state: employee?.state || '',
    pincode: employee?.pincode || '',
    
    // Qualification
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
    
    // Employment Details
    position: employee?.employeeDetails?.position || '',
    department: employee?.employeeDetails?.department || '',
    employmentType: employee?.employeeDetails?.employmentType || 'Permanent',
    salary: employee?.employeeDetails?.salary || '',
    contractPaymentType: employee?.employeeDetails?.contractDetails?.paymentType || 'perLead', // perLead or overall
    contractAmount: employee?.employeeDetails?.contractDetails?.amount || '',
    joiningDate: employee?.employeeDetails?.joiningDate ? new Date(employee.employeeDetails.joiningDate).toISOString().split('T')[0] : '',
    previousExperience: employee?.employeeDetails?.previousExperience || 0,
    
    // Documents
    aadhaarNumber: employee?.employeeDetails?.documents?.aadhaarNumber || '',
    panNumber: employee?.employeeDetails?.documents?.panNumber || '',
    
    // Bank Details
    accountHolderName: employee?.employeeDetails?.bankDetails?.accountHolderName || '',
    accountNumber: employee?.employeeDetails?.bankDetails?.accountNumber || '',
    ifscCode: employee?.employeeDetails?.bankDetails?.ifscCode || '',
    bankName: employee?.employeeDetails?.bankDetails?.bankName || '',
    branchName: employee?.employeeDetails?.bankDetails?.branchName || '',
    
    // Emergency Contact
    emergencyName: employee?.employeeDetails?.emergencyContact?.name || '',
    emergencyRelationship: employee?.employeeDetails?.emergencyContact?.relationship || '',
    emergencyPhone: employee?.employeeDetails?.emergencyContact?.phone || '',
    
    // Password (only for new employee)
    password: ''
  });

  const [files, setFiles] = useState({
    photo: null,
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    tenthCertificate: null,
    twelfthCertificate: null,
    graduationCertificate: null,
    postGraduationCertificate: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested objects
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }
      
      setFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const uploadFile = async (file, folder) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        return data.url;
      }
      throw new Error(data.message || 'Upload failed');
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setLoading(true);

    try {
      // Upload all files first
      const uploadedUrls = {};
      
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          toast.loading(`Uploading ${key}...`);
          uploadedUrls[key] = await uploadFile(file, 'employees');
          toast.dismiss();
        }
      }

      // Prepare employee data
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
          qualification: {
            tenth: {
              ...formData.tenth,
              certificate: uploadedUrls.tenthCertificate || employee?.employeeDetails?.qualification?.tenth?.certificate
            },
            twelfth: {
              ...formData.twelfth,
              certificate: uploadedUrls.twelfthCertificate || employee?.employeeDetails?.qualification?.twelfth?.certificate
            },
            graduation: {
              ...formData.graduation,
              certificate: uploadedUrls.graduationCertificate || employee?.employeeDetails?.qualification?.graduation?.certificate
            },
            postGraduation: {
              ...formData.postGraduation,
              certificate: uploadedUrls.postGraduationCertificate || employee?.employeeDetails?.qualification?.postGraduation?.certificate
            }
          },
          photo: uploadedUrls.photo || employee?.employeeDetails?.photo,
          position: formData.position,
          department: formData.department,
          employmentType: formData.employmentType,
          salary: formData.employmentType === 'Permanent' ? parseFloat(formData.salary) : undefined,
          contractDetails: formData.employmentType === 'Contract' ? {
            paymentType: formData.contractPaymentType,
            amount: parseFloat(formData.contractAmount)
          } : undefined,
          joiningDate: formData.joiningDate,
          previousExperience: parseInt(formData.previousExperience) || 0,
          documents: {
            aadhaarNumber: formData.aadhaarNumber,
            aadhaarFront: uploadedUrls.aadhaarFront || employee?.employeeDetails?.documents?.aadhaarFront,
            aadhaarBack: uploadedUrls.aadhaarBack || employee?.employeeDetails?.documents?.aadhaarBack,
            panNumber: formData.panNumber,
            panCard: uploadedUrls.panCard || employee?.employeeDetails?.documents?.panCard
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

      // Add password only for new employees
      if (!employee && formData.password) {
        employeeData.password = formData.password;
      }

      const url = employee
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/employees/${employee._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/employees`;

      const response = await fetch(url, {
        method: employee ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(employee ? 'Employee updated successfully!' : 'Employee created successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Basic Details' },
    { id: 2, name: 'Qualification' },
    { id: 3, name: 'Employment' },
    { id: 4, name: 'Documents & Bank' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Step {currentStep} of {steps.length}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.id}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > step.id ? 'bg-primary-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="p-6">
            {/* Step 1: Basic Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's/Husband's Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fatherOrHusbandName"
                      value={formData.fatherOrHusbandName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marital Status
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alternate Phone
                      </label>
                      <input
                        type="tel"
                        name="alternatePhone"
                        value={formData.alternatePhone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pincode <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo Upload</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'photo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    {files.photo && (
                      <p className="text-sm text-green-600 mt-1">✓ {files.photo.name}</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        name="emergencyName"
                        value={formData.emergencyName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        name="emergencyRelationship"
                        value={formData.emergencyRelationship}
                        onChange={handleInputChange}
                        placeholder="e.g., Father, Mother, Spouse"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {!employee && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Credentials</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required={!employee}
                        minLength="6"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Qualification */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Educational Qualification</h3>
                
                {/* 10th Standard */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">10th Standard</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Board
                      </label>
                      <input
                        type="text"
                        name="tenth.board"
                        value={formData.tenth.board}
                        onChange={handleInputChange}
                        placeholder="e.g., CBSE, State Board"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year of Passing
                      </label>
                      <input
                        type="number"
                        name="tenth.year"
                        value={formData.tenth.year}
                        onChange={handleInputChange}
                        min="1950"
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentage
                      </label>
                      <input
                        type="number"
                        name="tenth.percentage"
                        value={formData.tenth.percentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Upload
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'tenthCertificate')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      {files.tenthCertificate && (
                        <p className="text-sm text-green-600 mt-1">✓ {files.tenthCertificate.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 12th Standard */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">12th Standard</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Board
                      </label>
                      <input
                        type="text"
                        name="twelfth.board"
                        value={formData.twelfth.board}
                        onChange={handleInputChange}
                        placeholder="e.g., CBSE, State Board"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year of Passing
                      </label>
                      <input
                        type="number"
                        name="twelfth.year"
                        value={formData.twelfth.year}
                        onChange={handleInputChange}
                        min="1950"
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentage
                      </label>
                      <input
                        type="number"
                        name="twelfth.percentage"
                        value={formData.twelfth.percentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Upload
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'twelfthCertificate')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      {files.twelfthCertificate && (
                        <p className="text-sm text-green-600 mt-1">✓ {files.twelfthCertificate.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Graduation */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">Graduation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree
                      </label>
                      <input
                        type="text"
                        name="graduation.degree"
                        value={formData.graduation.degree}
                        onChange={handleInputChange}
                        placeholder="e.g., B.Com, B.Tech, BA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        University
                      </label>
                      <input
                        type="text"
                        name="graduation.university"
                        value={formData.graduation.university}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year of Passing
                      </label>
                      <input
                        type="number"
                        name="graduation.year"
                        value={formData.graduation.year}
                        onChange={handleInputChange}
                        min="1950"
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentage/CGPA
                      </label>
                      <input
                        type="number"
                        name="graduation.percentage"
                        value={formData.graduation.percentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Upload
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'graduationCertificate')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      {files.graduationCertificate && (
                        <p className="text-sm text-green-600 mt-1">✓ {files.graduationCertificate.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Post Graduation */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-3">Post Graduation (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree
                      </label>
                      <input
                        type="text"
                        name="postGraduation.degree"
                        value={formData.postGraduation.degree}
                        onChange={handleInputChange}
                        placeholder="e.g., MBA, M.Tech, MA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        University
                      </label>
                      <input
                        type="text"
                        name="postGraduation.university"
                        value={formData.postGraduation.university}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year of Passing
                      </label>
                      <input
                        type="number"
                        name="postGraduation.year"
                        value={formData.postGraduation.year}
                        onChange={handleInputChange}
                        min="1950"
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentage/CGPA
                      </label>
                      <input
                        type="number"
                        name="postGraduation.percentage"
                        value={formData.postGraduation.percentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificate Upload
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'postGraduationCertificate')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      {files.postGraduationCertificate && (
                        <p className="text-sm text-green-600 mt-1">✓ {files.postGraduationCertificate.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Employment Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      placeholder="e.g., Sales Executive, Manager"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Sales, Marketing, Operations"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Joining Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="previousExperience"
                      value={formData.previousExperience}
                      onChange={handleInputChange}
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Type & Compensation</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="employmentType"
                          value="Permanent"
                          checked={formData.employmentType === 'Permanent'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Permanent</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="employmentType"
                          value="Contract"
                          checked={formData.employmentType === 'Contract'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Contract</span>
                      </label>
                    </div>
                  </div>

                  {formData.employmentType === 'Permanent' ? (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-3">Permanent Employee Details</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Salary (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          min="0"
                          step="1000"
                          placeholder="e.g., 25000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required={formData.employmentType === 'Permanent'}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <h4 className="font-semibold text-orange-900 mb-3">Contract Employee Details</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="contractPaymentType"
                            value={formData.contractPaymentType}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                            required={formData.employmentType === 'Contract'}
                          >
                            <option value="perLead">Per Lead Basis</option>
                            <option value="overall">Overall Contract Amount</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.contractPaymentType === 'perLead' 
                              ? 'Employee will be paid per lead generated' 
                              : 'Employee will be paid a fixed contract amount'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formData.contractPaymentType === 'perLead' ? 'Amount Per Lead (₹)' : 'Total Contract Amount (₹)'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="contractAmount"
                            value={formData.contractAmount}
                            onChange={handleInputChange}
                            min="0"
                            step="100"
                            placeholder={formData.contractPaymentType === 'perLead' ? 'e.g., 500' : 'e.g., 15000'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            required={formData.employmentType === 'Contract'}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.contractPaymentType === 'perLead' 
                              ? 'Amount to be paid for each lead' 
                              : 'Total amount for the entire contract period'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Documents & Bank Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity Documents</h3>
                
                {/* Aadhaar Card */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Aadhaar Card</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aadhaar Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="aadhaarNumber"
                        value={formData.aadhaarNumber}
                        onChange={handleInputChange}
                        placeholder="XXXX XXXX XXXX"
                        maxLength="12"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Aadhaar Front <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange(e, 'aadhaarFront')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required={!employee}
                        />
                        {files.aadhaarFront && (
                          <p className="text-sm text-green-600 mt-1">✓ {files.aadhaarFront.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Aadhaar Back <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange(e, 'aadhaarBack')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required={!employee}
                        />
                        {files.aadhaarBack && (
                          <p className="text-sm text-green-600 mt-1">✓ {files.aadhaarBack.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAN Card */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">PAN Card</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleInputChange}
                        placeholder="ABCDE1234F"
                        maxLength="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Card Upload <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'panCard')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required={!employee}
                      />
                      {files.panCard && (
                        <p className="text-sm text-green-600 mt-1">✓ {files.panCard.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h3>
                  
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Holder Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="accountHolderName"
                          value={formData.accountHolderName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="ifscCode"
                          value={formData.ifscCode}
                          onChange={handleInputChange}
                          placeholder="e.g., SBIN0001234"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleInputChange}
                          placeholder="e.g., State Bank of India"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch Name
                        </label>
                        <input
                          type="text"
                          name="branchName"
                          value={formData.branchName}
                          onChange={handleInputChange}
                          placeholder="e.g., Main Branch, Bhopal"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Please ensure all information is accurate. Bank details will be used for salary/payment transfers.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
            <button
              type="button"
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {employee ? 'Update Employee' : 'Create Employee'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
