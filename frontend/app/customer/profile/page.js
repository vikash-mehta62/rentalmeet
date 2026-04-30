'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Camera, Save, Lock, Eye, EyeOff, User, Copy, Users, Gift,
  Upload, CheckCircle2, AlertCircle, ShieldCheck
} from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';
import toast from 'react-hot-toast';
import { State, City } from 'country-state-city';

function CustomerProfileInner() {
  const { user, token, updateUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Open KYC tab if ?tab=kyc in URL
  useEffect(() => {
    if (searchParams?.get('tab') === 'kyc') setActiveTab('kyc');
  }, [searchParams]);

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    profilePicture: '',
    gstNumber: '',
    companyName: '',
    panNumber: ''
  });

  // Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const stateOptions = useMemo(() => State.getStatesOfCountry('IN'), []);
  const cityOptions = useMemo(
    () => (selectedStateCode ? City.getCitiesOfState('IN', selectedStateCode) : []),
    [selectedStateCode]
  );

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        profilePicture: user.profilePicture || '',
        gstNumber: user.gstNumber || '',
        companyName: user.companyName || '',
        panNumber: user.panNumber || ''
      });
      setProfilePicturePreview(user.profilePicture || '');
    }
  }, [user]);

  useEffect(() => {
    const matchedState = stateOptions.find((s) => s.name === profileData.state);
    setSelectedStateCode(matchedState?.isoCode || '');
  }, [profileData.state, stateOptions]);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let profilePictureUrl = profileData.profilePicture;

      // Upload profile picture if changed
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append('file', profilePictureFile);
        formData.append('folder', 'profiles');

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          profilePictureUrl = uploadData.url;
        }
      }

      // Update profile
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...profileData,
          profilePicture: profilePictureUrl
        })
      });

      const data = await response.json();

      if (data.success) {
        updateUser(data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setProfilePictureFile(null);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout activePage="profile" fullWidth title="My Profile" subtitle="Manage your account settings">
      {/* Message Alert */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Forms */}
        <div className="w-full">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <button onClick={() => setActiveTab('profile')}
                className={`flex-shrink-0 px-5 py-4 font-semibold text-sm transition-colors ${activeTab === 'profile' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-800'}`}>
                Profile
              </button>
              <button onClick={() => setActiveTab('kyc')}
                className={`flex-shrink-0 px-5 py-4 font-semibold text-sm transition-colors flex items-center gap-1.5 ${activeTab === 'kyc' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-800'}`}>
                KYC / ID Verify
                {(!user?.kyc?.idProof || !user?.kyc?.selfie || !user?.kyc?.addressProof) && (
                  <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />
                )}
              </button>
              <button onClick={() => setActiveTab('referral')}
                className={`flex-shrink-0 px-5 py-4 font-semibold text-sm transition-colors ${activeTab === 'referral' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-800'}`}>
                Referral
              </button>
              <button onClick={() => setActiveTab('password')}
                className={`flex-shrink-0 px-5 py-4 font-semibold text-sm transition-colors ${activeTab === 'password' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-gray-600 hover:text-gray-800'}`}>
                Password
              </button>
            </div>
          </div>

          {/* Profile Form */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="border-b border-gray-100 pb-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="relative inline-block">
                      <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200">
                        {profilePicturePreview ? (
                          <img
                            src={profilePicturePreview}
                            alt={user?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-100">
                            <User className="w-14 h-14 text-primary-500" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
                        <Camera className="w-4.5 h-4.5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex-1 w-full sm:w-auto">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          placeholder="Full Name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            placeholder="Phone Number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          />
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            placeholder="Email Address"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          Customer
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                    <select
                      value={selectedStateCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const selected = stateOptions.find((s) => s.isoCode === code);
                        setSelectedStateCode(code);
                        setProfileData((p) => ({ ...p, state: selected?.name || '', city: '' }));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="">Select State</option>
                      {stateOptions.map((s) => (
                        <option key={s.isoCode} value={s.isoCode}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <select
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      disabled={!selectedStateCode}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${!selectedStateCode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value="">{selectedStateCode ? 'Select City' : 'Select State First'}</option>
                      {cityOptions.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={profileData.pincode}
                      onChange={(e) => setProfileData({ ...profileData, pincode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* GST Details Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-dark-800 mb-4">GST & Business Details (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        GST Number
                      </label>
                      <input
                        type="text"
                        value={profileData.gstNumber}
                        onChange={(e) => setProfileData({ ...profileData, gstNumber: e.target.value.toUpperCase() })}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none uppercase"
                        maxLength={15}
                      />
                      <p className="text-xs text-gray-500 mt-1">15-character GST identification number</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company/Business Name
                      </label>
                      <input
                        type="text"
                        value={profileData.companyName}
                        onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                        placeholder="Your Company Name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={profileData.panNumber}
                        onChange={(e) => setProfileData({ ...profileData, panNumber: e.target.value.toUpperCase() })}
                        placeholder="ABCDE1234F"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none uppercase"
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-500 mt-1">10-character PAN number</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Referral Code Tab */}
          {activeTab === 'referral' && (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <div className="space-y-6">
                {/* Referral Code Display */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark-800">Your Referral Code</h3>
                      <p className="text-sm text-gray-600">Share with friends and earn rewards!</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Your Code</p>
                      <p className="text-3xl font-bold text-blue-600 tracking-wider">
                        {user?.referralCode || 'Loading...'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user?.referralCode || '');
                        setMessage({ type: 'success', text: 'Referral code copied to clipboard!' });
                        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>

                {/* Referral Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Total Referrals</p>
                        <p className="text-3xl font-bold text-purple-900">{user?.referralCount || 0}</p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600">People who joined using your code</p>
                  </div>

                  {user?.referredBy && (
                    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <Gift className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-sm text-green-700 font-medium">Referred By</p>
                          <p className="text-lg font-bold text-green-900">{user.referredBy.name}</p>
                        </div>
                      </div>
                      <p className="text-xs text-green-600">Code: {user.referredByCode}</p>
                    </div>
                  )}
                </div>

                {/* Referral List */}
                {user?.referrals && user.referrals.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-dark-800 mb-4">Your Referrals</h4>
                    <div className="space-y-3">
                      {user.referrals.map((referral, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-dark-800">{referral.user?.name || 'User'}</p>
                              <p className="text-xs text-gray-500">{referral.user?.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {referral.user?.role || 'User'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(referral.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* How it Works */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-bold text-dark-800 mb-4">How Referral Works</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                      <div>
                        <p className="font-semibold text-dark-800">Share Your Code</p>
                        <p className="text-sm text-gray-600">Share your unique referral code with friends and family</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                      <div>
                        <p className="font-semibold text-dark-800">They Sign Up</p>
                        <p className="text-sm text-gray-600">When they register using your code, they become your referral</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                      <div>
                        <p className="font-semibold text-dark-800">Earn Rewards</p>
                        <p className="text-sm text-gray-600">Get exclusive benefits and rewards for each successful referral</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password Form */}
          {activeTab === 'password' && (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Change Password
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* KYC Tab */}
          {activeTab === 'kyc' && (
            <KYCSection token={token} user={user} updateUser={updateUser} />
          )}
        </div>
      </div>

      {/* Danger Zone - Delete Account */}
      <DeleteAccountSection token={token} />

    </CustomerLayout>
  );
}

function KYCSection({ token, user, updateUser }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [kycData, setKycData] = useState(null); // fresh from API
  const [idProofType, setIdProofType] = useState('Aadhaar');
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofBackFile, setIdProofBackFile] = useState(null);
  const [addressProofFile, setAddressProofFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const NEEDS_BACK = ['Aadhaar', 'Voter ID'];

  // Fetch fresh user data when tab opens
  useEffect(() => {
    if (!token) return;
    setFetching(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setKycData(data.user?.kyc || {});
          setIdProofType(data.user?.kyc?.idProofType || 'Aadhaar');
          updateUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [token]);

  const kyc = kycData ?? (user?.kyc || {});
  const idDone      = !!kyc.idProof;
  const idBackDone  = !!kyc.idProofBack;
  const selfieDone  = !!kyc.selfie;
  const addressDone = !!kyc.addressProof;
  const needsBack   = NEEDS_BACK.includes(idProofType);
  const kycComplete = idDone && selfieDone && addressDone && (!needsBack || idBackDone);

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
      setSelfieFile(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
      closeCamera();
    }, 'image/jpeg', 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraOpen(false);
  };

  useEffect(() => () => closeCamera(), []);

  const handleUpload = async () => {
    const hasNew = idProofFile || idProofBackFile || addressProofFile || selfieFile;
    if (!hasNew) { toast.error('No new files selected'); return; }
    if (!idDone && !idProofFile) { toast.error('Please upload ID proof front'); return; }
    if (needsBack && !idBackDone && !idProofBackFile) { toast.error(`Please upload ${idProofType} back side`); return; }
    if (!addressDone && !addressProofFile) { toast.error('Please upload address proof'); return; }
    if (!selfieDone && !selfieFile) { toast.error('Please take or upload a selfie'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      if (idProofFile) { fd.append('idProof', idProofFile); fd.append('idProofType', idProofType); }
      if (idProofBackFile) fd.append('idProofBack', idProofBackFile);
      if (addressProofFile) fd.append('addressProof', addressProofFile);
      if (selfieFile) fd.append('selfie', selfieFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/kyc-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        updateUser(data.user);
        setKycData(data.user?.kyc || {});
        setIdProofFile(null); setIdProofBackFile(null); setAddressProofFile(null); setSelfieFile(null);
        toast.success('KYC updated successfully!');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch { toast.error('Upload failed'); }
    finally { setLoading(false); }
  };

  // Reusable upload box
  const UploadBox = ({ label, existingUrl, newFile, onNew, onClear, accept = 'image/*,.pdf', color = 'primary' }) => {
    const preview = newFile ? URL.createObjectURL(newFile) : existingUrl;
    const isNew = !!newFile;
    const isExisting = !newFile && !!existingUrl;
    return (
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
        {preview ? (
          <div className="relative rounded-xl overflow-hidden border-2 border-green-400">
            <img src={preview} alt={label} className="w-full h-36 object-contain bg-gray-50" />
            <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 ${isNew ? 'bg-primary-600' : 'bg-green-600'}`}>
              <span className="text-white text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {isNew ? 'New â€” ready to save' : 'Uploaded'}
              </span>
              <div className="flex gap-2">
                {isExisting && (
                  <a href={existingUrl} target="_blank" rel="noopener noreferrer"
                    className="text-white/80 hover:text-white text-xs underline">View</a>
                )}
                <label className="text-white/80 hover:text-white text-xs underline cursor-pointer">
                  Re-upload
                  <input type="file" accept={accept} className="hidden"
                    onChange={e => { const f = e.target.files[0]; if (f) onNew(f); }} />
                </label>
                {isNew && (
                  <button onClick={onClear} className="text-white/80 hover:text-white text-xs">âœ•</button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all
            ${color === 'orange' ? 'border-orange-300 hover:border-orange-400 hover:bg-orange-50' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'}`}>
            <Upload className={`w-7 h-7 mb-1.5 ${color === 'orange' ? 'text-orange-400' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-500">Click to upload</span>
            <span className="text-xs text-gray-400 mt-0.5">JPG, PNG, PDF (max 10MB)</span>
            <input type="file" accept={accept} className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) onNew(f); }} />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <ShieldCheck className={`w-6 h-6 ${kycComplete ? 'text-green-500' : 'text-amber-500'}`} />
        <div>
          <h3 className="font-bold text-gray-900">KYC Verification</h3>
          <p className="text-xs text-gray-500">Required to book venues on RentalMeet</p>
        </div>
        {kycComplete && (
          <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : (<>

      {!kycComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Complete KYC to unlock venue booking. Upload ID proof, address proof and take a real-time selfie.</p>
        </div>
      )}

      <div className="space-y-5">
        {/* ID Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ID Proof Type</label>
          <select value={idProofType}
            onChange={e => { setIdProofType(e.target.value); setIdProofFile(null); setIdProofBackFile(null); }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500">
            {['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className={`grid grid-cols-1 ${needsBack ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-5 items-start`}>
          {/* Front */}
          <UploadBox
            label={needsBack ? `${idProofType} â€” Front Side *` : `Upload ${idProofType} *`}
            existingUrl={kyc.idProof}
            newFile={idProofFile}
            onNew={setIdProofFile}
            onClear={() => setIdProofFile(null)}
          />

          {/* Back â€” only for Aadhaar / Voter ID */}
          {needsBack && (
            <UploadBox
              label={`${idProofType} â€” Back Side *`}
              existingUrl={kyc.idProofBack}
              newFile={idProofBackFile}
              onNew={setIdProofBackFile}
              onClear={() => setIdProofBackFile(null)}
              color="orange"
            />
          )}

          <UploadBox
            label="Address Proof *"
            existingUrl={kyc.addressProof}
            newFile={addressProofFile}
            onNew={setAddressProofFile}
            onClear={() => setAddressProofFile(null)}
            color="orange"
          />

          {/* Selfie */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Real-time Selfie *
              {selfieDone && !selfieFile && <span className="ml-2 text-green-600 text-xs font-normal">âœ“ Uploaded</span>}
            </label>

            {cameraOpen ? (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border-2 border-primary-400" style={{ maxHeight: 220 }} />
                <div className="flex gap-2">
                  <button onClick={captureSelfie} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" /> Capture
                  </button>
                  <button onClick={closeCamera} className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold">Cancel</button>
                </div>
              </div>
            ) : selfieFile ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-primary-400">
                <img src={URL.createObjectURL(selfieFile)} alt="Selfie" className="w-full h-36 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-primary-600">
                  <span className="text-white text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> New â€” ready to save</span>
                  <button onClick={() => setSelfieFile(null)} className="text-white/80 hover:text-white text-xs">âœ•</button>
                </div>
              </div>
            ) : kyc.selfie ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-green-400">
                <img src={kyc.selfie} alt="Selfie" className="w-full h-36 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-green-600">
                  <span className="text-white text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</span>
                  <div className="flex gap-3">
                    <a href={kyc.selfie} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-xs underline">View</a>
                    <button onClick={openCamera} className="text-white/80 hover:text-white text-xs underline">Retake</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={openCamera} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-sm">
                  <Camera className="w-4 h-4" /> Open Camera
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 text-sm text-gray-500 font-semibold">
                  <Upload className="w-4 h-4" /> Upload Photo
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files[0]; if (f) setSelfieFile(f); }} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        {(idProofFile || idProofBackFile || addressProofFile || selfieFile) && (
          <button onClick={handleUpload} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
            {loading ? 'Uploading...' : <><CheckCircle2 className="w-4 h-4" /> Save KYC Documents</>}
          </button>
        )}
      </div>
      </>)}
    </div>
  );
}

function DeleteAccountSection({ token }) {
  const { logout, user, updateUser } = useAuthStore();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        logout();
        router.push('/');
      } else {
        alert(data.message || 'Could not delete account');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Temporarily deactivate your account? You can reactivate by logging in again.')) return;
    setDeactivateLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/deactivate-account`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        logout();
        router.push('/');
      } else {
        alert(data.message || 'Could not deactivate account');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setDeactivateLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Temporary Deactivate */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <h3 className="text-base font-bold text-yellow-700 mb-1">Temporarily Deactivate Account</h3>
        <p className="text-sm text-yellow-600 mb-4">
          Your account will be hidden. You can reactivate it anytime by logging in again.
        </p>
        <button
          onClick={handleDeactivate}
          disabled={deactivateLoading}
          className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {deactivateLoading ? 'Processing...' : 'Deactivate Account'}
        </button>
      </div>

      {/* Permanent Delete */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h3 className="text-base font-bold text-red-700 mb-1">Delete Account Permanently</h3>
        <p className="text-sm text-red-600 mb-1">
          Your account will be scheduled for deletion. You have <strong>1 month</strong> to recover it by contacting support.
        </p>
        <p className="text-xs text-red-500 mb-4">After 1 month, all data will be permanently deleted and cannot be recovered.</p>
        {!confirm ? (
          <button onClick={() => setConfirm(true)}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors">
            Delete Account
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm font-semibold text-red-700">Are you absolutely sure?</p>
            <button onClick={handleDelete} disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {loading ? 'Deleting...' : 'Yes, Delete My Account'}
            </button>
            <button onClick={() => setConfirm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerProfile() {
  return (
    <Suspense fallback={null}>
      <CustomerProfileInner />
    </Suspense>
  );
}
