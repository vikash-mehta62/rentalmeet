'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  Percent, Save, Settings as SettingsIcon, Calculator, Upload, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlatformSettings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    venueCGST: 9,
    venueSGST: 9,
    venueHSN: '',
    platformFeePercentage: 5,
    platformCGST: 9,
    platformSGST: 9,
    gstInvoiceSignature: null,
    platformInvoiceSignature: null
  });
  const [newSettings, setNewSettings] = useState({
    venueCGST: 9,
    venueSGST: 9,
    venueHSN: '',
    platformFeePercentage: 5,
    platformCGST: 9,
    platformSGST: 9
  });
  const [gstSignatureFile, setGstSignatureFile] = useState(null);
  const [platformSignatureFile, setPlatformSignatureFile] = useState(null);
  const [gstSignaturePreview, setGstSignaturePreview] = useState(null);
  const [platformSignaturePreview, setPlatformSignaturePreview] = useState(null);

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
  }, [token]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setNewSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (newSettings.venueCGST < 0 || newSettings.venueCGST > 100) {
      toast.error('Venue CGST must be between 0 and 100');
      return;
    }

    if (newSettings.venueSGST < 0 || newSettings.venueSGST > 100) {
      toast.error('Venue SGST must be between 0 and 100');
      return;
    }

    if (newSettings.platformFeePercentage < 0 || newSettings.platformFeePercentage > 100) {
      toast.error('Platform fee must be between 0 and 100');
      return;
    }

    if (newSettings.platformCGST < 0 || newSettings.platformCGST > 100) {
      toast.error('Platform CGST must be between 0 and 100');
      return;
    }

    if (newSettings.platformSGST < 0 || newSettings.platformSGST > 100) {
      toast.error('Platform SGST must be between 0 and 100');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('venueCGST', newSettings.venueCGST);
      formData.append('venueSGST', newSettings.venueSGST);
      formData.append('venueHSN', newSettings.venueHSN);
      formData.append('platformFeePercentage', newSettings.platformFeePercentage);
      formData.append('platformCGST', newSettings.platformCGST);
      formData.append('platformSGST', newSettings.platformSGST);
      
      // Add signature files if selected
      if (gstSignatureFile) {
        formData.append('gstInvoiceSignature', gstSignatureFile);
      }
      if (platformSignatureFile) {
        formData.append('platformInvoiceSignature', platformSignatureFile);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Platform settings updated successfully!');
        setSettings(data.settings);
        setNewSettings(data.settings);
        setGstSignatureFile(null);
        setPlatformSignatureFile(null);
        setGstSignaturePreview(null);
        setPlatformSignaturePreview(null);
        fetchSettings();
      } else {
        toast.error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleGstSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setGstSignatureFile(file);
      setGstSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handlePlatformSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setPlatformSignatureFile(file);
      setPlatformSignaturePreview(URL.createObjectURL(file));
    }
  };

  // Calculate example with 2 separate invoices
  const calculateExample = (amount = 10000) => {
    const bookingAmount = amount;
    
    // Venue Invoice
    const venueCGST = (bookingAmount * (newSettings.venueCGST || 0)) / 100;
    const venueSGST = (bookingAmount * (newSettings.venueSGST || 0)) / 100;
    const venueTotal = bookingAmount + venueCGST + venueSGST;
    
    // Platform Invoice
    const platformFee = (bookingAmount * (newSettings.platformFeePercentage || 0)) / 100;
    const platformCGST = (platformFee * (newSettings.platformCGST || 0)) / 100;
    const platformSGST = (platformFee * (newSettings.platformSGST || 0)) / 100;
    const platformTotal = platformFee + platformCGST + platformSGST;
    
    // Total
    const customerPays = venueTotal + platformTotal;
    
    return { 
      bookingAmount,
      venueCGST, 
      venueSGST, 
      venueTotal,
      platformFee,
      platformCGST,
      platformSGST,
      platformTotal,
      customerPays
    };
  };

  const example = calculateExample();

  if (loading) {
    return (
      <AdminLayout title="Platform Settings" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Settings" subtitle="Manage GST & Platform Fee">
      <PermissionGuard permission="platformSettings">
        {/* Current Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Venue GST */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-soft border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-700 font-semibold">Venue GST Rate</p>
              <Percent className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-5xl font-bold text-blue-900">{(settings.venueCGST || 0) + (settings.venueSGST || 0)}%</p>
            <p className="text-xs text-blue-600 mt-1">CGST {settings.venueCGST}% + SGST {settings.venueSGST}%</p>
          </div>

          {/* Platform Fee */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-soft border border-purple-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-purple-700 font-semibold">Platform Fee + GST</p>
              <Percent className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-5xl font-bold text-purple-900">{settings.platformFeePercentage || 0}%</p>
            <p className="text-xs text-purple-600 mt-1">+ GST {(settings.platformCGST || 0) + (settings.platformSGST || 0)}%</p>
          </div>
        </div>

      {/* Update Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-dark-800 mb-4 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary-500" />
            Update Settings
          </h2>
          
          <div className="space-y-6">
            {/* Venue GST Section */}
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-3">1️⃣ Venue GST Settings</h3>
              <p className="text-xs text-blue-700 mb-4">For Venue Invoice</p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Venue CGST (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newSettings.venueCGST}
                      onChange={(e) => setNewSettings({ ...newSettings, venueCGST: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-lg font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Venue SGST (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newSettings.venueSGST}
                      onChange={(e) => setNewSettings({ ...newSettings, venueSGST: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-lg font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    HSN Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSettings.venueHSN}
                    onChange={(e) => setNewSettings({ ...newSettings, venueHSN: e.target.value })}
                    placeholder="e.g., 9973"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Platform Fee Section */}
            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-3">2️⃣ Platform Fee Settings</h3>
              <p className="text-xs text-purple-700 mb-4">For Platform Invoice</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Platform Fee (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newSettings.platformFeePercentage}
                    onChange={(e) => setNewSettings({ ...newSettings, platformFeePercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 text-xl font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Platform CGST (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newSettings.platformCGST}
                      onChange={(e) => setNewSettings({ ...newSettings, platformCGST: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-lg font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Platform SGST (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={newSettings.platformSGST}
                      onChange={(e) => setNewSettings({ ...newSettings, platformSGST: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-lg font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Upload Section */}
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-3">3️⃣ Invoice Signatures</h3>
              <p className="text-xs text-green-700 mb-4">Upload signatures for invoices (Optional)</p>
              
              <div className="space-y-4">
                {/* GST Invoice Signature */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    GST/Venue Invoice Signature
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors">
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">
                            {gstSignatureFile ? gstSignatureFile.name : 'Choose signature image'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGstSignatureChange}
                        className="hidden"
                      />
                    </label>
                    {(gstSignaturePreview || settings.gstInvoiceSignature) && (
                      <div className="relative">
                        <img
                          src={gstSignaturePreview || settings.gstInvoiceSignature}
                          alt="GST Signature"
                          className="w-24 h-16 object-contain border border-gray-300 rounded"
                        />
                        {gstSignaturePreview && (
                          <button
                            onClick={() => {
                              setGstSignatureFile(null);
                              setGstSignaturePreview(null);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Invoice Signature */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Platform Invoice Signature
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors">
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">
                            {platformSignatureFile ? platformSignatureFile.name : 'Choose signature image'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePlatformSignatureChange}
                        className="hidden"
                      />
                    </label>
                    {(platformSignaturePreview || settings.platformInvoiceSignature) && (
                      <div className="relative">
                        <img
                          src={platformSignaturePreview || settings.platformInvoiceSignature}
                          alt="Platform Signature"
                          className="w-24 h-16 object-contain border border-gray-300 rounded"
                        />
                        {platformSignaturePreview && (
                          <button
                            onClick={() => {
                              setPlatformSignatureFile(null);
                              setPlatformSignaturePreview(null);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  Max file size: 2MB. Recommended: PNG with transparent background
                </p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Important Note:</p>
              <p className="text-xs text-yellow-700">
                Changes will apply to all new bookings. Two separate invoices will be generated: Venue Invoice and Platform Invoice.
              </p>
            </div>

            <button
              onClick={handleUpdateSettings}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
            >
              <Save className="w-5 h-5" />
              Update Settings
            </button>
          </div>
        </div>

        {/* Preview Calculation */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-dark-800 mb-4 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-green-500" />
            Preview Calculation
          </h2>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">Example with ₹10,000 booking:</p>
            
            {/* Venue Invoice */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                📄 Venue Invoice
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Booking Amount:</span>
                  <span className="font-bold">₹{example.bookingAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">CGST ({newSettings.venueCGST || 0}%):</span>
                  <span className="font-semibold text-blue-600">₹{(example.venueCGST || 0).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">SGST ({newSettings.venueSGST || 0}%):</span>
                  <span className="font-semibold text-blue-600">₹{(example.venueSGST || 0).toLocaleString()}</span>
                </div>
                
                <div className="border-t-2 border-blue-300 pt-2 flex justify-between items-center">
                  <span className="font-bold text-blue-900">Venue Total:</span>
                  <span className="text-xl font-bold text-blue-900">₹{example.venueTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Platform Invoice */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
              <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                📄 Platform Invoice
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Platform Fee ({newSettings.platformFeePercentage || 0}%):</span>
                  <span className="font-bold">₹{(example.platformFee || 0).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">CGST ({newSettings.platformCGST || 0}%):</span>
                  <span className="font-semibold text-purple-600">₹{(example.platformCGST || 0).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">SGST ({newSettings.platformSGST || 0}%):</span>
                  <span className="font-semibold text-purple-600">₹{(example.platformSGST || 0).toLocaleString()}</span>
                </div>
                
                <div className="border-t-2 border-purple-300 pt-2 flex justify-between items-center">
                  <span className="font-bold text-purple-900">Platform Total:</span>
                  <span className="text-xl font-bold text-purple-900">₹{example.platformTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Final Total */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-green-900">Customer Pays:</span>
                <span className="text-3xl font-bold text-green-900">₹{example.customerPays.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-2">💡 Breakdown:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Customer pays: ₹{example.customerPays.toLocaleString()}</li>
              <li>• Venue gets: ₹{example.bookingAmount.toLocaleString()}</li>
              <li>• Platform earns: ₹{example.platformFee.toLocaleString()}</li>
              <li>• Total GST: ₹{((example.venueCGST + example.venueSGST + example.platformCGST + example.platformSGST) || 0).toLocaleString()}</li>
              <li className="pt-2 border-t border-blue-300 font-semibold">• 2 Separate Invoices Generated</li>
            </ul>
          </div>
        </div>
      </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
