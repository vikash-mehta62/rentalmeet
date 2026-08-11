'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  Zap,
  Award,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Trophy,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function AmbassadorDashboardPage() {
  const { token, user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to fetch dashboard data');
      }
    } catch {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 text-red-700 dark:text-red-300">
        <p className="font-bold">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { profile, stats, progress, challenges, recentVenues, recentRewards } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Partner Overview Strip */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-black tracking-wider uppercase font-mono">
              ID: {profile?.ambassadorId || 'RM-AMB-PARTNER'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
              {profile?.badge || 'Bronze Explorer'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-xs font-bold">
              {progress?.currentLevel || 'LV.1'} (₹{progress?.currentRate || 100}/venue)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Here is your live venue acquisition status, rewards, and booking revenue share.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/ambassador/add-venue"
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> List Venue
          </Link>
        </div>
      </div>

      {/* Tier Progress & Daily 5-Venue Challenge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tier Progress Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-amber-500 via-primary-600 to-orange-600 text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                {progress?.currentLevel} • {progress?.tierTitle}
              </span>
              <span className="text-xl font-black">₹{progress?.currentRate} <span className="text-xs font-normal">/ Verified Venue</span></span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black">
              {progress?.approvedCount || 0} Verified Venues Approved
            </h3>
            <p className="text-xs text-amber-100 font-light mt-1">
              List {Math.max(0, (progress?.nextTierTarget || 50) - (progress?.approvedCount || 0))} more verified venues to upgrade to next tier!
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-white/20">
            <div className="flex justify-between text-xs font-bold mb-1.5 text-amber-100">
              <span>Progress to Next Tier</span>
              <span>{progress?.progressPercentage || 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progress?.progressPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily 5-Venue Challenge Meter */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Daily 5-Venues Challenge</h4>
                  <p className="text-[11px] text-slate-500">Earn +₹50 Bonus Per Venue Today</p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-600 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 rounded-full border border-amber-200 dark:border-amber-800">
                +₹250 Bonus
              </span>
            </div>

            <div className="my-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Today&apos;s Verified Count</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {challenges?.todayVerifiedCount || 0} / {challenges?.dailyTarget || 5}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-500 font-semibold">Daily Bonus Earned</p>
                <p className="text-base font-black text-green-600 mt-0.5">
                  ₹{challenges?.dailyBonusEarned || 0}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/ambassador/challenges"
            className="w-full py-2 text-center rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 mt-2"
          >
            View Weekly &amp; Monthly Streaks <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Wallet Balance */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Wallet Balance</span>
            <div className="p-2 bg-green-100 dark:bg-green-950/60 text-green-600 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₹{(profile?.walletBalance || 0).toLocaleString('en-IN')}
          </p>
          <Link
            href="/ambassador/earnings"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:underline mt-2.5"
          >
            Withdraw to UPI/Bank <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Total Venues Submitted */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Listed</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats?.totalSubmitted || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-2.5">
            <span className="text-green-600 font-bold">{stats?.approvedCount || 0} Approved</span> • <span className="text-amber-600 font-bold">{stats?.pendingCount || 0} Pending</span>
          </p>
        </div>

        {/* Instant Listing Rewards */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Instant Listing Income</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₹{(stats?.instantListingEarnings || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-2.5 font-medium">From approved venue listings</p>
        </div>

        {/* 25% Booking Revenue Share */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">25% Booking Share</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600">
            ₹{(stats?.bookingShareEarnings || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-2.5 font-medium">12-Month recurring booking revenue</p>
        </div>
      </div>

      {/* Tables: Recent Venues & Recent Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Listed Venues */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Venues Listed</h3>
              <p className="text-[11px] text-slate-500">Status of your submitted spaces</p>
            </div>
            <Link
              href="/ambassador/venues"
              className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
            >
              View All ({stats?.totalSubmitted || 0}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentVenues?.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No venues listed yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Start listing nearby hotels, banquets, or meeting rooms.</p>
              <Link
                href="/ambassador/add-venue"
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-slate-950 rounded-xl text-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5" /> List First Venue
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2.5">Venue Name</th>
                    <th className="pb-2.5">City</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentVenues.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        {v.businessName}
                      </td>
                      <td className="py-2.5 text-slate-500">{v.location?.city || 'N/A'}</td>
                      <td className="py-2.5">
                        {v.status === 'approved' ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : v.status === 'rejected' ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-[10px] inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Review
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/venues/${v.sku || v._id}`}
                          target="_blank"
                          className="text-slate-400 hover:text-primary-600 font-medium inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Rewards & Credits */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Credits</h3>
              <p className="text-[11px] text-slate-500">Latest earnings added to your wallet</p>
            </div>
            <Link
              href="/ambassador/earnings"
              className="text-xs font-bold text-primary-600 hover:underline"
            >
              Ledger <ArrowRight className="w-3 h-3 inline" />
            </Link>
          </div>

          {recentRewards?.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Award className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No reward transactions yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Rewards appear instantly when venues are approved.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentRewards.map((r) => (
                <div
                  key={r._id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex justify-between items-center"
                >
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {r.rewardType === 'listing_reward' ? 'Instant Listing Reward' :
                       r.rewardType === 'daily_challenge' ? 'Daily Challenge Bonus' :
                       r.rewardType === 'booking_revenue_share' ? '25% Booking Profit Share' : 'Achievement Bonus'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{r.description}</p>
                  </div>
                  <span className="text-xs font-black text-green-600 flex-shrink-0">
                    +₹{r.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
