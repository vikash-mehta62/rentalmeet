'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  Camera, Save, Lock, Eye, EyeOff, User, Copy, Users, Gift
} from 'lucide-react';
import CustomerLayout from '@/components/customer/CustomerLayout';

export default function CustomerProfile() {
  const { user, token, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState({ type: '', text: '' });

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
    <CustomerLayout title="My Profile" subtitle="Manage your account settings">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
            <div className="text-center">
              {/* Profile Picture */}
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto">
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-100">
                      <User className="w-16 h-16 text-primary-500" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="text-2xl font-bold text-dark-800 mb-1">{user?.name}</h2>
              <p className="text-gray-600 mb-2">{user?.email}</p>
              <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                Customer
              </span>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'profile'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('referral')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'referral'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Referral Code
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'password'
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Profile Form */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={profileData.state}
                      onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
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
        </div>
      </div>

      {/* Danger Zone - Delete Account */}
      <DeleteAccountSection token={token} />

    </CustomerLayout>
  );
}

function DeleteAccountSection({ token }) {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6">
      <h3 className="text-base font-bold text-red-700 mb-1">Danger Zone</h3>
      <p className="text-sm text-red-600 mb-4">Deleting your account is permanent. Active bookings must be cancelled first.</p>
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Delete Account
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-red-700">Are you sure?</p>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
