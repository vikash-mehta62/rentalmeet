'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import EmployeeLayout from '@/components/employee/EmployeeLayout';
import { User, Gift, Copy, Users, Briefcase, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    if (!token || user?.role !== 'employee') {
      router.push('/login');
    }
  }, [token, user]);

  if (!token || user?.role !== 'employee') return null;

  const details = user?.employeeDetails || {};

  return (
    <EmployeeLayout activePage="dashboard">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 rounded-2xl shadow-lg mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Welcome, {user?.name}!</h1>
        <p className="text-primary-100 text-sm">{details.position || 'Employee'} · {details.department || 'N/A'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-dark-800">Profile Info</h3>
              <p className="text-xs text-gray-500">{user?.userId}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800 truncate ml-2">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-800">{user?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                details.employmentType === 'Permanent' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>{details.employmentType || 'N/A'}</span>
            </div>
            {details.joiningDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Joined</span>
                <span className="font-medium text-gray-800">{new Date(details.joiningDate).toLocaleDateString('en-IN')}</span>
              </div>
            )}
          </div>
          <Link href="/employee/profile" className="mt-4 block text-center text-sm font-semibold text-primary-600 hover:text-primary-700">
            Update Profile →
          </Link>
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-dark-800">Job Details</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Position</span>
              <span className="font-medium text-gray-800">{details.position || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Department</span>
              <span className="font-medium text-gray-800">{details.department || 'N/A'}</span>
            </div>
            {(user?.city || user?.state) && (
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />Location</span>
                <span className="font-medium text-gray-800">{[user?.city, user?.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Referral Card */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Referral Code</h3>
              <p className="text-xs text-white/80">Share & Earn</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
            <p className="text-xs text-white/80 mb-1">Your Code</p>
            <p className="text-2xl font-black tracking-wider">{user?.referralCode || 'N/A'}</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{user?.referralCount || 0} Referrals</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user?.referralCode || '');
                setCopyMessage('Copied!');
                setTimeout(() => setCopyMessage(''), 2000);
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copyMessage || 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
