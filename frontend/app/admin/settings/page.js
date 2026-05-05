'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import AdminLayout from '@/components/admin/AdminLayout';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Settings as SettingsIcon, Save, X, Plus, FileText, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const defaultContact = {
  address: '', address2: '',
  phone: '', phone2: '',
  email: '', email2: '',
  availability: '',
  filterSettings: { capacityMin: 10, capacityMax: 1000, priceMin: 1000, priceMax: 1000000 },
  socialMedia: { facebook: '', twitter: '', instagram: '', linkedin: '', youtube: '', whatsapp: '' }
};

const DEFAULT_VENUE_TERMS = `RentalMeet Venue Owner Agreement

1. Commission Agreement
• I agree to pay RentalMeet platform service fee on all confirmed bookings
• Platform fee will be deducted before payout
• Payouts processed within 24-48 hours after event completion

2. Venue Standards
• Maintain venue as described in listing
• Provide all promised amenities and facilities
• Ensure venue is clean and ready before each booking

3. Booking Management
• Respond to booking requests within 2 hours
• Honor confirmed bookings
• Update calendar regularly

4. Legal Compliance
• Have all necessary permits and licenses
• Comply with fire safety and building regulations
• Maintain adequate insurance coverage`;

export default function AdminSettings() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('contact');
  const [loading, setLoading] = useState(false);
  const [fetchingTerms, setFetchingTerms] = useState(false);
  const [fetchingContact, setFetchingContact] = useState(false);
  const [contactSettings, setContactSettings] = useState(defaultContact);
  const [venueOnboardingTerms, setVenueOnboardingTerms] = useState(DEFAULT_VENUE_TERMS);
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

  useEffect(() => {
    if (token) { fetchTerms(); fetchContactSettings(); }
  }, [token]);

  const fetchContactSettings = async () => {
    setFetchingContact(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/contact-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setContactSettings({ ...defaultContact, ...data.data, socialMedia: { ...defaultContact.socialMedia, ...(data.data.socialMedia || {}) } });
      }
    } catch (e) { console.error(e); }
    finally { setFetchingContact(false); }
  };

  const fetchTerms = async () => {
    setFetchingTerms(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/terms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.terms) {
        setSettings(prev => ({
          ...prev,
          bookingTerms: data.terms.bookingTerms || prev.bookingTerms,
          cancellationPolicy: data.terms.cancellationPolicy || prev.cancellationPolicy,
          paymentTerms: data.terms.paymentTerms || prev.paymentTerms,
          quotationValidity: data.terms.quotationValidity || prev.quotationValidity
        }));
        if (data.terms.venueOnboardingTerms) {
          setVenueOnboardingTerms(data.terms.venueOnboardingTerms);
        }
      }
    } catch (e) { console.error(e); }
    finally { setFetchingTerms(false); }
  };

  const handleSaveVenueTerms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/terms`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, venueOnboardingTerms })
      });
      const data = await res.json();
      data.success ? toast.success('Venue T&C saved!') : toast.error(data.message || 'Failed');
    } catch { toast.error('Failed to save'); }
    finally { setLoading(false); }
  };

  const handleSaveContact = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/contact-settings`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(contactSettings)
      });
      const data = await res.json();
      data.success ? toast.success('Contact settings saved!') : toast.error(data.message || 'Failed');
    } catch (e) { toast.error('Failed to save'); }
    finally { setLoading(false); }
  };

  const handleSaveTerms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/terms`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      data.success ? toast.success('Terms & Conditions updated!') : toast.error(data.message || 'Failed');
    } catch (e) { toast.error('Failed to save'); }
    finally { setLoading(false); }
  };

  const setSocial = (key, val) => setContactSettings(prev => ({
    ...prev, socialMedia: { ...prev.socialMedia, [key]: val }
  }));

  const setFilter = (key, val) => setContactSettings(prev => ({
    ...prev, filterSettings: { ...prev.filterSettings, [key]: parseInt(val) || 0 }
  }));

  const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm";
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1";

  const socialFields = [
    { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/rentalmeet' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/rentalmeet' },
    { key: 'twitter',   label: 'Twitter / X', placeholder: 'https://twitter.com/rentalmeet' },
    { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/rentalmeet' },
    { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@rentalmeet' },
    { key: 'whatsapp',  label: 'WhatsApp',  placeholder: 'https://wa.me/919425796767' },
  ];

  return (
    <AdminLayout title="Settings" subtitle="Configure platform settings">
      <PermissionGuard permission="settings">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {[
              { id: 'contact', label: 'Contact Info', icon: SettingsIcon },
              { id: 'terms', label: 'Booking T&C', icon: FileText },
              { id: 'venue-terms', label: 'Venue Onboarding T&C', icon: Building2 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Contact Information ── */}
          {activeTab === 'contact' && <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-dark-800 mb-6 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-primary-500" />
              Contact Information
            </h2>

            {fetchingContact ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Address 1 (Primary)</label>
                    <textarea
                      value={contactSettings.address}
                      onChange={e => setContactSettings({ ...contactSettings, address: e.target.value })}
                      rows={3} className={inputCls}
                      placeholder="G-137, Gautam Nagar, Near Chetak Bridge, Bhopal"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Address 2 (Optional)</label>
                    <textarea
                      value={contactSettings.address2}
                      onChange={e => setContactSettings({ ...contactSettings, address2: e.target.value })}
                      rows={3} className={inputCls}
                      placeholder="Branch / Second office address"
                    />
                  </div>
                </div>

                {/* Phones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Phone 1 (Primary)</label>
                    <input type="text" value={contactSettings.phone}
                      onChange={e => setContactSettings({ ...contactSettings, phone: e.target.value })}
                      className={inputCls} placeholder="+91 9425796767" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone 2 (Optional)</label>
                    <input type="text" value={contactSettings.phone2}
                      onChange={e => setContactSettings({ ...contactSettings, phone2: e.target.value })}
                      className={inputCls} placeholder="+91 8423796767" />
                  </div>
                </div>

                {/* Emails */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email 1 (Primary)</label>
                    <input type="email" value={contactSettings.email}
                      onChange={e => setContactSettings({ ...contactSettings, email: e.target.value })}
                      className={inputCls} placeholder="booking@rentalmeet.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Email 2 (Optional)</label>
                    <input type="email" value={contactSettings.email2}
                      onChange={e => setContactSettings({ ...contactSettings, email2: e.target.value })}
                      className={inputCls} placeholder="support@rentalmeet.com" />
                  </div>
                </div>

                {/* Our Presence */}
                <div>
                  <label className={labelCls}>Our Presence</label>
                  <input type="text" value={contactSettings.availability}
                    onChange={e => setContactSettings({ ...contactSettings, availability: e.target.value })}
                    className={inputCls} placeholder="INDIA | UAE | USA" />
                </div>

                {/* Social Media */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Social Media Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {socialFields.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                        <input type="url" value={contactSettings.socialMedia?.[key] || ''}
                          onChange={e => setSocial(key, e.target.value)}
                          className={inputCls} placeholder={placeholder} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filter Settings */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Filter Settings (Browse Page Sliders)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'capacityMin', label: 'Capacity Min' },
                      { key: 'capacityMax', label: 'Capacity Max' },
                      { key: 'priceMin',    label: 'Price Min (₹)' },
                      { key: 'priceMax',    label: 'Price Max (₹)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-600 mb-1">{label}</label>
                        <input type="number" min="0"
                          value={contactSettings.filterSettings?.[key] || 0}
                          onChange={e => setFilter(key, e.target.value)}
                          className={inputCls} />
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveContact} disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors">
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Contact Information'}
                </button>
              </div>
            )}
          </div>}

          {/* ── Terms & Conditions (Booking) ── */}
          {activeTab === 'terms' && <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-dark-800 mb-6 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-primary-500" />
              Terms & Conditions Management
            </h2>

            {fetchingTerms ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className={labelCls}>Quotation Validity (Days)</label>
                  <input type="number" min="1" value={settings.quotationValidity}
                    onChange={e => setSettings({ ...settings, quotationValidity: parseInt(e.target.value) })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Payment Terms</label>
                  <textarea value={settings.paymentTerms}
                    onChange={e => setSettings({ ...settings, paymentTerms: e.target.value })}
                    rows={2} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Cancellation Policy</label>
                  <textarea value={settings.cancellationPolicy}
                    onChange={e => setSettings({ ...settings, cancellationPolicy: e.target.value })}
                    rows={3} className={inputCls} />
                </div>

                {/* Booking Terms Points */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelCls}>Booking Terms (Point by Point)</label>
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        bookingTerms: [...prev.bookingTerms, { point: '', order: prev.bookingTerms.length + 1 }]
                      }))}
                      className="flex items-center gap-1 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Point
                    </button>
                  </div>
                  <div className="space-y-3">
                    {settings.bookingTerms.map((term, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-primary-100 text-primary-600 font-bold rounded-lg text-sm">
                          {i + 1}
                        </div>
                        <textarea
                          value={term.point}
                          onChange={e => {
                            const updated = [...settings.bookingTerms];
                            updated[i].point = e.target.value;
                            setSettings({ ...settings, bookingTerms: updated });
                          }}
                          rows={2} placeholder={`Term point ${i + 1}...`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                        <button
                          onClick={() => {
                            const updated = settings.bookingTerms.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, order: idx + 1 }));
                            setSettings({ ...settings, bookingTerms: updated });
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
                    💡 These terms will appear in the booking form and quotation PDF.
                  </p>
                </div>

                <button onClick={handleSaveTerms} disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors">
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Terms & Conditions'}
                </button>
              </div>
            )}
          </div>}

          {/* ── Venue Onboarding T&C ── */}
          {activeTab === 'venue-terms' && <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-dark-800 mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-500" />
              Venue Onboarding Terms & Conditions
            </h2>

            {fetchingTerms ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Terms & Conditions (shown during venue registration)
                  </label>
                  <textarea
                    value={venueOnboardingTerms}
                    onChange={e => setVenueOnboardingTerms(e.target.value)}
                    rows={18}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                    placeholder="Enter venue onboarding terms..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Use plain text with line breaks. This will be shown to venue owners during registration (Step 7).
                  </p>
                </div>

                <button
                  onClick={handleSaveVenueTerms}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Venue T&C'}
                </button>
              </div>
            )}
          </div>}

        </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
