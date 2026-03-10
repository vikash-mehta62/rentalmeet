'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Percent, Save, IndianRupee, Settings as SettingsIcon, Calculator
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlatformSettings() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    gstRate: 18,
    platformFeeType: 'percentage',
    platformFeeValue: 5
  });
  const [newSettings, setNewSettings] = useState({
    gstRate: 18,
    platformFeeType: 'percentage',
    platformFeeValue: 5
  });

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
    if (newSettings.gstRate < 0 || newSettings.gstRate > 100) {
      toast.error('GST rate must be between 0 and 100');
      return;
    }

    if (newSettings.platformFeeValue < 0) {
      toast.error('Platform fee must be positive');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Platform settings updated successfully!');
        setSettings(newSettings);
        fetchSettings();
      } else {
        toast.error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  // Calculate example
  const calculateExample = (amount = 10000) => {
    const subtotal = amount;
    const gst = (subtotal * newSettings.gstRate) / 100;
    const platformFee = newSettings.platformFeeType === 'fixed' 
      ? newSettings.platformFeeValue 
      : (subtotal * newSettings.platformFeeValue) / 100;
    const total = subtotal + gst + platformFee;
    const ownerEarnings = subtotal;
    return { subtotal, gst, platformFee, total, ownerEarnings };
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
      {/* Current Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* GST Rate */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-soft border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700 font-semibold">Current GST Rate</p>
            <Percent className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-5xl font-bold text-blue-900">{settings.gstRate}%</p>
          <p className="text-xs text-blue-600 mt-1">Applied on all bookings</p>
        </div>

        {/* Platform Fee */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-soft border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-purple-700 font-semibold">Current Platform Fee</p>
            <IndianRupee className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-5xl font-bold text-purple-900">
            {settings.platformFeeType === 'fixed' ? '₹' : ''}{settings.platformFeeValue}{settings.platformFeeType === 'percentage' ? '%' : ''}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {settings.platformFeeType === 'fixed' ? 'Fixed amount' : 'Percentage based'}
          </p>
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
          
          <div className="space-y-4">
            {/* GST Rate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                GST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newSettings.gstRate}
                onChange={(e) => setNewSettings({ ...newSettings, gstRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 text-xl font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter GST percentage (e.g., 18 for 18%)</p>
            </div>

            {/* Platform Fee Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Platform Fee Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewSettings({ ...newSettings, platformFeeType: 'fixed' })}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    newSettings.platformFeeType === 'fixed'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Fixed Amount
                </button>
                <button
                  type="button"
                  onClick={() => setNewSettings({ ...newSettings, platformFeeType: 'percentage' })}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    newSettings.platformFeeType === 'percentage'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Percentage
                </button>
              </div>
            </div>

            {/* Platform Fee Value */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Platform Fee {newSettings.platformFeeType === 'fixed' ? '(₹)' : '(%)'}
              </label>
              <input
                type="number"
                min="0"
                step={newSettings.platformFeeType === 'fixed' ? '1' : '0.1'}
                value={newSettings.platformFeeValue}
                onChange={(e) => setNewSettings({ ...newSettings, platformFeeValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 text-xl font-bold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {newSettings.platformFeeType === 'fixed' 
                  ? 'Enter fixed amount in rupees (e.g., 500)'
                  : 'Enter percentage (e.g., 5 for 5%)'}
              </p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Important Note:</p>
              <p className="text-xs text-yellow-700">
                Changes will apply to all new bookings.
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
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-4">Example with ₹10,000 booking:</p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Booking Amount:</span>
                <span className="text-lg font-bold">₹{example.subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">GST ({newSettings.gstRate}%):</span>
                <span className="text-lg font-semibold text-blue-600">+ ₹{example.gst.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">
                  Platform Fee ({newSettings.platformFeeType === 'fixed' ? '₹' : ''}{newSettings.platformFeeValue}{newSettings.platformFeeType === 'percentage' ? '%' : ''}):
                </span>
                <span className="text-lg font-semibold text-purple-600">+ ₹{example.platformFee.toLocaleString()}</span>
              </div>
              
              <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Customer Pays:</span>
                <span className="text-2xl font-bold text-primary-600">₹{example.total.toLocaleString()}</span>
              </div>

              
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-800 mb-2">Breakdown:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Customer pays: ₹{example.total.toLocaleString()}</li>
            <li>• Platform earns: ₹{example.platformFee.toLocaleString()} (Platform Fee)</li>
              <li>• Government gets: ₹{example.gst.toLocaleString()} (GST)</li>
            <li>• Venue owner gets: ₹{example.ownerEarnings.toLocaleString()}</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
