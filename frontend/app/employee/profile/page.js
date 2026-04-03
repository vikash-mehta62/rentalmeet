'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import EmployeeLayout from '@/components/employee/EmployeeLayout';
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeProfile() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    state: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token || user?.role !== 'employee') {
      router.push('/login');
      return;
    }
    setFormData(prev => ({
      ...prev,
      name: user?.name || '',
      phone: user?.phone || '',
      city: user?.city || '',
      state: user?.state || ''
    }));
  }, [token, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          state: formData.state
        })
      });
      const data = await response.json();
      if (data.success) {
        setAuth(data.user, token);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Password changed successfully!');
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!token || user?.role !== 'employee') return null;

  const details = user?.employeeDetails || {};

  return (
    <EmployeeLayout activePage="profile">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Read-only Job Info */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark-800 mb-4">Employee Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Employee ID', user?.userId],
              ['Position', details.position],
              ['Department', details.department],
              ['Employment Type', details.employmentType],
              ['Joining Date', details.joiningDate ? new Date(details.joiningDate).toLocaleDateString('en-IN') : 'N/A'],
              ['Email', user?.email]
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Editable Profile */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark-800 mb-4">Update Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} maxLength="10"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" name="city" value={formData.city} onChange={handleChange}
                    placeholder="Your city"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" name="state" value={formData.state} onChange={handleChange}
                    placeholder="Your state"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-2.5 font-semibold disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark-800 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { name: 'currentPassword', label: 'Current Password' },
              { name: 'newPassword', label: 'New Password' },
              { name: 'confirmPassword', label: 'Confirm New Password' }
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} name={name}
                    value={formData[name]} onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </EmployeeLayout>
  );
}
