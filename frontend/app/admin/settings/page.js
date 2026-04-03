'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import {
  Settings as SettingsIcon, Save, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetchingTerms, setFetchingTerms] = useState(false);
  const [fetchingContact, setFetchingContact] = useState(false);
  const [contactSettings, setContactSettings] = useState({
    address: '',
    phone: '',
    email: '',
    availability: '',
    filterSettings: {
      capacityMin: 10,
      capacityMax: 1000,
      priceMin: 1000,
      priceMax: 1000000
    },
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
  });
  
  useEffect(() => {
    if (token) {
      fetchTerms();
      fetchContactSettings();
    }
  }, [token]);

  const fetchContactSettings = async () => {
    setFetchingContact(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/contact-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setContactSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
    } finally {
      setFetchingContact(false);
    }
  };

  const fetchTerms = async () => {
    setFetchingTerms(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/terms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.terms) {
        setSettings(prev => ({
          ...prev,
          bookingTerms: data.terms.bookingTerms || prev.bookingTerms,
          cancellationPolicy: data.terms.cancellationPolicy || prev.cancellationPolicy,
          paymentTerms: data.terms.paymentTerms || prev.paymentTerms,
          quotationValidity: data.terms.quotationValidity || prev.quotationValidity
        }));
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    } finally {
      setFetchingTerms(false);
    }
  };
  
  const [settings, setSettings] = useState({
    bookingTerms: [
      { point: 'This quotation is valid for 7 days from the date of issue.', order: 1 },
      { point: 'This is a booking request and not a confirmed booking. Final confirmation subject to venue owner approval.', order: 2 },
      { point: 'Payment to be made after venue owner confirmation through RentalMeet platform.', order: 3 },
      { point: 'Cancellation policy: Full refund if cancelled 48 hours before booking date, 50% refund if cancelled 24 hours before, no refund for same-day cancellations.', order: 4 },
      { point: 'Customer is responsible for any damages to the venue property during the event.', order: 5 }
    ],
    cancellationPolicy: 'Full refund if cancelled 48 hours before booking date, 50% refund if cancelled 24 hours before, no refund for same-day cancellations.',
    paymentTerms: 'Payment to be made after venue owner confirmation through RentalMeet platform.',
    quotationValidity: 7
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/terms`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Terms & Conditions updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update terms');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/contact-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactSettings)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Contact settings updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update contact settings');
      }
    } catch (error) {
      toast.error('Failed to save contact settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Settings" subtitle="Configure platform settings">
      <PermissionGuard permission="settings">
        <div className="max-w-5xl mx-auto space-y-6">
        {/* Contact Settings */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-dark-800 mb-6 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary-500" />
            Contact Information
          </h2>
          
          {fetchingContact ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={contactSettings.address}
                  onChange={(e) => setContactSettings({
                    ...contactSettings,
                    address: e.target.value
                  })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder={"Line 1: Street / Building\nLine 2: Area, City\nLine 3: State - Pincode"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={contactSettings.phone}
                    onChange={(e) => setContactSettings({
                      ...contactSettings,
                      phone: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="+91 8423796767"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactSettings.email}
                    onChange={(e) => setContactSettings({
                      ...contactSettings,
                      email: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="booking@rentalmeet.in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Availability
                </label>
                <input
                  type="text"
                  value={contactSettings.availability}
                  onChange={(e) => setContactSettings({
                    ...contactSettings,
                    availability: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="24/7 Available"
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Social Media Links (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Facebook</label>
                    <input
                      type="url"
                      value={contactSettings.socialMedia?.facebook || ''}
                      onChange={(e) => setContactSettings({
                        ...contactSettings,
                        socialMedia: {
                          ...contactSettings.socialMedia,
                          facebook: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Twitter</label>
                    <input
                      type="url"
                      value={contactSettings.socialMedia?.twitter || ''}
                      onChange={(e) => setContactSettings({
                        ...contactSettings,
                        socialMedia: {
                          ...contactSettings.socialMedia,
                          twitter: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Instagram</label>
                    <input
                      type="url"
                      value={contactSettings.socialMedia?.instagram || ''}
                      onChange={(e) => setContactSettings({
                        ...contactSettings,
                        socialMedia: {
                          ...contactSettings.socialMedia,
                          instagram: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">LinkedIn</label>
                    <input
                      type="url"
                      value={contactSettings.socialMedia?.linkedin || ''}
                      onChange={(e) => setContactSettings({
                        ...contactSettings,
                        socialMedia: {
                          ...contactSettings.socialMedia,
                          linkedin: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Filter Settings */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Settings (Browse Page)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Capacity Min</label>
                    <input
                      type="number"
                      min="0"
                      value={contactSettings.filterSettings?.capacityMin || 0}
                      onChange={(e) => setContactSettings({
                        ...contactSettings,
                        filterSettings: {
                          ...contactSettings.filterSettings,
                          capacityMin: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Capacity Max</label>
                    <input
                      type="number"
                      min="0"
                      value={contactSettings.filterSettings?.capacityMax || 0}
                      onChange={(e) => setContactSettings({
                        ...contactSettings,
                        filterSettings: {
                          ...contactSettings.filterSettings,
                          capacityMax: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Price Min (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={contactSettings.filterSettings?.priceMin || 0}
                      onChange={(e) => setContactSettings({
                        ...contactSettings,
                        filterSettings: {
                          ...contactSettings.filterSettings,
                          priceMin: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Price Max (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={contactSettings.filterSettings?.priceMax || 0}
                      onChange={(e) => setContactSettings({
                        ...contactSettings,
                        filterSettings: {
                          ...contactSettings.filterSettings,
                          priceMax: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Yeh values Browse Venues page ke Capacity aur Price sliders ko control karengi.</p>
              </div>

              <button
                onClick={handleSaveContact}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Contact Information'}
              </button>
            </div>
          )}
        </div>

        {/* Terms & Conditions Settings */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-dark-800 mb-6 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary-500" />
            Terms & Conditions Management
          </h2>
          
          {fetchingTerms ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quotation Validity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quotation Validity (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.quotationValidity}
                  onChange={(e) => setSettings({
                    ...settings,
                    quotationValidity: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Number of days the quotation remains valid</p>
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Terms
                </label>
                <textarea
                  value={settings.paymentTerms}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentTerms: e.target.value
                  })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Cancellation Policy */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cancellation Policy
                </label>
                <textarea
                  value={settings.cancellationPolicy}
                  onChange={(e) => setSettings({
                    ...settings,
                    cancellationPolicy: e.target.value
                  })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Booking Terms Points */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Booking Terms & Conditions (Point by Point)
                  </label>
                  <button
                    onClick={() => {
                      const newTerms = [...settings.bookingTerms];
                      newTerms.push({ 
                        point: '', 
                        order: newTerms.length + 1 
                      });
                      setSettings({
                        ...settings,
                        bookingTerms: newTerms
                      });
                    }}
                    className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    + Add Point
                  </button>
                </div>
                
                <div className="space-y-3">
                  {settings.bookingTerms.map((term, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-primary-100 text-primary-600 font-bold rounded-lg">
                        {index + 1}
                      </div>
                      <textarea
                        value={term.point}
                        onChange={(e) => {
                          const newTerms = [...settings.bookingTerms];
                          newTerms[index].point = e.target.value;
                          setSettings({
                            ...settings,
                            bookingTerms: newTerms
                          });
                        }}
                        rows="2"
                        placeholder={`Enter term point ${index + 1}...`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => {
                          const newTerms = settings.bookingTerms.filter((_, i) => i !== index);
                          // Reorder
                          newTerms.forEach((t, i) => t.order = i + 1);
                          setSettings({
                            ...settings,
                            bookingTerms: newTerms
                          });
                        }}
                        className="flex-shrink-0 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 These terms will be displayed in the booking form and quotation. Make sure they are clear and comprehensive.
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Terms & Conditions'}
              </button>
            </div>
          )}
        </div>
      </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
