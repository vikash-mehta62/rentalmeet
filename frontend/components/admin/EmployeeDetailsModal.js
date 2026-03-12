'use client';

import { useState } from 'react';
import {
  X, User, MapPin, GraduationCap, Briefcase, FileText, CreditCard,
  Phone, Mail, Calendar, Download, AlertCircle
} from 'lucide-react';

export default function EmployeeDetailsModal({ employee, onClose }) {
  const [activeTab, setActiveTab] = useState('basic');

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'contact', label: 'Contact & Address', icon: MapPin },
    { id: 'qualifications', label: 'Qualifications', icon: GraduationCap },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
    { id: 'emergency', label: 'Emergency Contact', icon: AlertCircle },
  ];

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-dark-800">{employee.name}</h2>
            <p className="text-xs text-gray-500">
              Employee ID: {employee.userId || `RM-${employee._id?.slice(-8).toUpperCase()}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-3 overflow-x-auto flex-shrink-0">
          <div className="flex gap-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 font-medium text-xs transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary-500 text-primary-600 bg-white -mb-px'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Photo */}
              {employee.employeeDetails?.photo && (
                <div className="flex justify-center mb-4">
                  <img
                    src={employee.employeeDetails.photo}
                    alt={employee.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Title</label>
                  <p className="text-sm text-gray-900">{employee.employeeDetails?.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name</label>
                  <p className="text-sm text-gray-900">{employee.name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Father's/Husband's Name</label>
                  <p className="text-sm text-gray-900">{employee.employeeDetails?.fatherOrHusbandName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Date of Birth</label>
                  <p className="text-sm text-gray-900">{formatDate(employee.employeeDetails?.dateOfBirth)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Gender</label>
                  <p className="text-sm text-gray-900">{employee.employeeDetails?.gender || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Marital Status</label>
                  <p className="text-sm text-gray-900">{employee.employeeDetails?.maritalStatus || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Blood Group</label>
                  <p className="text-sm text-gray-900">{employee.employeeDetails?.bloodGroup || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    employee.isActive !== false
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {employee.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Contact & Address Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold mb-3 text-blue-900 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {employee.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Phone</label>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {employee.phone}
                    </p>
                  </div>
                  {employee.alternatePhone && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Alternate Phone</label>
                      <p className="text-sm text-gray-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {employee.alternatePhone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-sm font-semibold mb-3 text-green-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Address Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Full Address</label>
                    <p className="text-sm text-gray-900">{employee.address || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">City</label>
                      <p className="text-sm text-gray-900">{employee.city || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">State</label>
                      <p className="text-sm text-gray-900">{employee.state || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Pincode</label>
                      <p className="text-sm text-gray-900">{employee.pincode || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Qualifications Tab */}
          {activeTab === 'qualifications' && (
            <div className="space-y-4">
              {/* 10th Standard */}
              {employee.employeeDetails?.qualification?.tenth && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold mb-3 text-blue-900">10th Standard</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Board</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.tenth.board || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Year</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.tenth.year || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Percentage</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.tenth.percentage ? `${employee.employeeDetails.qualification.tenth.percentage}%` : 'N/A'}</p>
                    </div>
                  </div>
                  {employee.employeeDetails.qualification.tenth.certificate && (
                    <div className="mt-3">
                      <a
                        href={employee.employeeDetails.qualification.tenth.certificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-xs inline-flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3 h-3" />
                        Download Certificate
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* 12th Standard */}
              {employee.employeeDetails?.qualification?.twelfth && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-semibold mb-3 text-green-900">12th Standard</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Board</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.twelfth.board || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Year</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.twelfth.year || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Percentage</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.twelfth.percentage ? `${employee.employeeDetails.qualification.twelfth.percentage}%` : 'N/A'}</p>
                    </div>
                  </div>
                  {employee.employeeDetails.qualification.twelfth.certificate && (
                    <div className="mt-3">
                      <a
                        href={employee.employeeDetails.qualification.twelfth.certificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-xs inline-flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3 h-3" />
                        Download Certificate
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Graduation */}
              {employee.employeeDetails?.qualification?.graduation && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-sm font-semibold mb-3 text-orange-900">Graduation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Degree</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.graduation.degree || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">University</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.graduation.university || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Year</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.graduation.year || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Percentage</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.graduation.percentage ? `${employee.employeeDetails.qualification.graduation.percentage}%` : 'N/A'}</p>
                    </div>
                  </div>
                  {employee.employeeDetails.qualification.graduation.certificate && (
                    <div className="mt-3">
                      <a
                        href={employee.employeeDetails.qualification.graduation.certificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-xs inline-flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3 h-3" />
                        Download Certificate
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Post Graduation */}
              {employee.employeeDetails?.qualification?.postGraduation && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold mb-3 text-purple-900">Post Graduation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Degree</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.postGraduation.degree || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">University</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.postGraduation.university || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Year</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.postGraduation.year || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Percentage</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.qualification.postGraduation.percentage ? `${employee.employeeDetails.qualification.postGraduation.percentage}%` : 'N/A'}</p>
                    </div>
                  </div>
                  {employee.employeeDetails.qualification.postGraduation.certificate && (
                    <div className="mt-3">
                      <a
                        href={employee.employeeDetails.qualification.postGraduation.certificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-xs inline-flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3 h-3" />
                        Download Certificate
                      </a>
                    </div>
                  )}
                </div>
              )}

              {!employee.employeeDetails?.qualification?.tenth && 
               !employee.employeeDetails?.qualification?.twelfth &&
               !employee.employeeDetails?.qualification?.graduation &&
               !employee.employeeDetails?.qualification?.postGraduation && (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No qualification information available</p>
                </div>
              )}
            </div>
          )}

          {/* Employment Tab */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Position</label>
                  <p className="text-sm text-gray-900">{employee.employeeDetails?.position || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Department</label>
                  <p className="text-sm text-gray-900">{employee.employeeDetails?.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Employment Type</label>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    employee.employeeDetails?.employmentType === 'Permanent'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {employee.employeeDetails?.employmentType || 'N/A'}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Joining Date</label>
                  <p className="text-sm text-gray-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(employee.employeeDetails?.joiningDate)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Previous Experience</label>
                  <p className="text-sm text-gray-900">
                    {employee.employeeDetails?.previousExperience || 0} years
                  </p>
                </div>
              </div>

              {/* Compensation Details */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold mb-3 text-blue-900">Compensation Details</h3>
                {employee.employeeDetails?.employmentType === 'Permanent' ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Monthly Salary</label>
                    <p className="text-lg font-bold text-primary-600">
                      ₹{employee.employeeDetails?.salary?.toLocaleString('en-IN') || 'N/A'}
                    </p>
                  </div>
                ) : employee.employeeDetails?.contractDetails ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Payment Type</label>
                      <p className="text-sm text-gray-900">
                        {employee.employeeDetails.contractDetails.paymentType === 'perLead' ? 'Per Lead' : 'Overall Contract'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Amount</label>
                      <p className="text-lg font-bold text-primary-600">
                        ₹{employee.employeeDetails.contractDetails.amount?.toLocaleString('en-IN') || 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No compensation details available</p>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Aadhaar Card */}
              {employee.employeeDetails?.documents?.aadhaarNumber && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold mb-3 text-blue-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Aadhaar Card
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Aadhaar Number</label>
                      <p className="text-sm text-gray-900 font-mono bg-white px-2.5 py-1.5 rounded border border-blue-300">
                        {employee.employeeDetails.documents.aadhaarNumber}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {employee.employeeDetails.documents.aadhaarFront && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Front Side</label>
                          <img
                            src={employee.employeeDetails.documents.aadhaarFront}
                            alt="Aadhaar Front"
                            className="w-full h-40 object-contain bg-white rounded-lg border border-gray-300 p-2"
                          />
                          <a
                            href={employee.employeeDetails.documents.aadhaarFront}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-xs mt-1.5 inline-flex items-center gap-1 font-medium"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                      )}
                      {employee.employeeDetails.documents.aadhaarBack && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1.5">Back Side</label>
                          <img
                            src={employee.employeeDetails.documents.aadhaarBack}
                            alt="Aadhaar Back"
                            className="w-full h-40 object-contain bg-white rounded-lg border border-gray-300 p-2"
                          />
                          <a
                            href={employee.employeeDetails.documents.aadhaarBack}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-xs mt-1.5 inline-flex items-center gap-1 font-medium"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PAN Card */}
              {employee.employeeDetails?.documents?.panNumber && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-sm font-semibold mb-3 text-green-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    PAN Card
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">PAN Number</label>
                      <p className="text-sm text-gray-900 font-mono bg-white px-2.5 py-1.5 rounded border border-green-300">
                        {employee.employeeDetails.documents.panNumber}
                      </p>
                    </div>
                    {employee.employeeDetails.documents.panCard && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1.5">PAN Card Image</label>
                        <img
                          src={employee.employeeDetails.documents.panCard}
                          alt="PAN Card"
                          className="w-full max-w-md h-48 object-contain bg-white rounded-lg border border-gray-300 p-2"
                        />
                        <a
                          href={employee.employeeDetails.documents.panCard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-xs mt-2 inline-flex items-center gap-1 font-medium"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!employee.employeeDetails?.documents?.aadhaarNumber && 
               !employee.employeeDetails?.documents?.panNumber && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No documents uploaded</p>
                </div>
              )}
            </div>
          )}

          {/* Bank Details Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              {employee.employeeDetails?.bankDetails ? (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold mb-3 text-purple-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    Bank Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Account Holder Name</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.bankDetails.accountHolderName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Bank Name</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.bankDetails.bankName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Branch Name</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.bankDetails.branchName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">IFSC Code</label>
                      <p className="text-sm text-gray-900 font-mono bg-white px-2.5 py-1.5 rounded border border-purple-300">
                        {employee.employeeDetails.bankDetails.ifscCode || 'N/A'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Account Number</label>
                      <p className="text-sm text-gray-900 font-mono bg-white px-2.5 py-1.5 rounded border border-purple-300">
                        {employee.employeeDetails.bankDetails.accountNumber 
                          ? '****' + employee.employeeDetails.bankDetails.accountNumber.slice(-4) 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No bank details available</p>
                </div>
              )}
            </div>
          )}

          {/* Emergency Contact Tab */}
          {activeTab === 'emergency' && (
            <div className="space-y-4">
              {employee.employeeDetails?.emergencyContact ? (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-sm font-semibold mb-3 text-red-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Emergency Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Name</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.emergencyContact.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Relationship</label>
                      <p className="text-sm text-gray-900">{employee.employeeDetails.emergencyContact.relationship || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Phone</label>
                      <p className="text-sm text-gray-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {employee.employeeDetails.emergencyContact.phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No emergency contact information available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
