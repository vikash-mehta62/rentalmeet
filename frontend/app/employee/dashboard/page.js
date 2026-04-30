'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import EmployeeLayout from '@/components/employee/EmployeeLayout';
import { User, Gift, Copy, Users, Briefcase, MapPin, Share2 } from 'lucide-react';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [copyMessage, setCopyMessage] = useState('');
  const [fullUser, setFullUser] = useState(null);

  useEffect(() => {
    if (!token || user?.role !== 'employee') {
      router.push('/login');
    }
  }, [token, user, router]);

  useEffect(() => {
    if (!token || user?.role !== 'employee') return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) setFullUser(data.user);
      })
      .catch(() => {});
  }, [token, user?.role]);

  if (!token || user?.role !== 'employee') return null;

  const profileUser = fullUser || user;
  const details = profileUser?.employeeDetails || {};
  const referralCode = profileUser?.referralCode || '';
  const referralCount = profileUser?.referralCount || 0;

  const buildReferralLink = (target) => {
    const code = referralCode;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const baseMap = {
      customer: `${origin}/register-customer`,
      venue: `${origin}/register?role=owner`,
      vendor: `${origin}/register?role=vendor`
    };
    const baseUrl = baseMap[target] || baseMap.customer;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}ref=${encodeURIComponent(code)}`;
  };

  const handleCopyLink = async (target) => {
    const link = buildReferralLink(target);
    try {
      await navigator.clipboard.writeText(link);
      setCopyMessage(`${target}-copied`);
      setTimeout(() => setCopyMessage(''), 1800);
    } catch {
      setCopyMessage('copy-failed');
      setTimeout(() => setCopyMessage(''), 1800);
    }
  };

  const handleShareLink = async (target) => {
    const link = buildReferralLink(target);
    const titleMap = {
      customer: 'Register as Customer',
      venue: 'Register as Venue Owner',
      vendor: 'Register as Vendor Partner'
    };
    const text = `Use my referral code (${referralCode || ''}) and join RentalMeet.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: titleMap[target], text, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        setCopyMessage(`${target}-shared`);
        setTimeout(() => setCopyMessage(''), 1800);
      }
    } catch {}
  };

  return (
    <EmployeeLayout activePage="dashboard">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 rounded-2xl shadow-lg mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Welcome, {profileUser?.name || user?.name}!</h1>
        <p className="text-primary-100 text-sm">{details.position || 'Employee'} · {details.department || 'N/A'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            Update Profile {'->'}
          </Link>
        </div>

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

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Referral Code</h3>
              <p className="text-xs text-white/80">Share & Earn Rewards</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-3">
            <p className="text-xs text-white/80 mb-1">Your Code</p>
            <p className="text-2xl font-black tracking-wider">{referralCode || 'N/A'}</p>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{referralCount} Referrals</span>
            </div>
            <span className="text-xs text-white/80">Copy + Share links</span>
          </div>
          <div className="space-y-2">
            {[
              { key: 'customer', label: 'Customer to Customer' },
              { key: 'venue', label: 'Customer to Venue' },
              { key: 'vendor', label: 'Customer to Vendor' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-2 bg-white/10 rounded-lg px-2.5 py-2">
                <span className="text-[11px] font-semibold">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyLink(item.key)}
                    className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copyMessage === `${item.key}-copied` ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleShareLink(item.key)}
                    className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                    {copyMessage === `${item.key}-shared` ? 'Shared' : 'Share'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
