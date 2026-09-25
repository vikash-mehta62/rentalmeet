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
  Sparkles,
  Target
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

  const { profile, stats, progress, challenges, profitShareStatus, recentVenues, recentRewards } = data || {};

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
            {profitShareStatus?.profitShareUnlocked ? (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1">
                🔓 25% Profit Share Active (1 Year)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1">
                🔒 25% Share (7-Day Streak Required)
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-xs text-slate-500">
            RentalMeet Official Ambassador Portal • Direct Venue Acquisition &amp; Profit Sharing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="p-3 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/ambassador/add-venue"
            className="px-5 py-3 bg-gradient-to-r from-primary-500 to-amber-500 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Onboard Venue
          </Link>
        </div>
      </div>

      {/* 3 Status Cards: Daily Status, Weekly Status & Monthly Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        
        {/* CARD 1: DAILY STATUS */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  <Zap className="w-3 h-3 text-amber-400" /> Daily Streak
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1.5">Daily Status</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-300 font-mono">
                  {challenges?.todayVerifiedCount || 0} / {challenges?.dailyTarget || 5} Venues
                </span>
                <span className="block text-[10px] text-slate-400">Target: 5 / Day</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5 my-2">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(100, Math.round(((challenges?.todayVerifiedCount || 0) / (challenges?.dailyTarget || 5)) * 100))}%` }}
              />
            </div>

            {/* 2-Col Box */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-slate-400 block text-[9px] font-medium">Today&apos;s Venues</span>
                <span className="font-bold text-white text-xs">{challenges?.todayVerifiedCount || 0} / 5</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-slate-400 block text-[9px] font-medium">Daily Bonus</span>
                <span className="font-bold text-amber-400 text-xs">
                  {(challenges?.todayVerifiedCount || 0) >= 5 ? `+₹${250 + ((challenges?.todayVerifiedCount || 0) - 5) * 50}` : '+₹250'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Subtext */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium truncate max-w-[200px]">
              {(challenges?.todayVerifiedCount || 0) >= 5
                ? '✅ Goal Reached! (+₹50/extra)'
                : `${Math.max(0, 5 - (challenges?.todayVerifiedCount || 0))} more needed today`}
            </span>
            <span className="text-amber-400 font-bold flex-shrink-0">⚡ +₹50/venue</span>
          </div>
        </div>

        {/* CARD 2: WEEKLY STATUS (7-Day Power Streak) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                  <Target className="w-3 h-3 text-blue-400" /> Weekly Streak
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1.5">Weekly Status</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-blue-300 font-mono">
                  {profitShareStatus?.streakDaysCompleted || 0} / 7 Days
                </span>
                <span className="block text-[10px] text-slate-400">Target: 35 Venues</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5 my-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${profitShareStatus?.streakProgressPercentage || 0}%` }}
              />
            </div>

            {/* 2-Col Box */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-slate-400 block text-[9px] font-medium">Active Days</span>
                <span className="font-bold text-white text-xs">{profitShareStatus?.streakDaysCompleted || 0} / 7 Days</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-slate-400 block text-[9px] font-medium">Streak Venues</span>
                <span className="font-bold text-blue-400 text-xs">{profitShareStatus?.totalStreakVenues || 0} / 35</span>
              </div>
            </div>
          </div>

          {/* Footer Subtext */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium truncate max-w-[200px]">
              {profitShareStatus?.profitShareUnlocked
                ? `🔓 25% Share Active (${profitShareStatus?.daysRemaining || 365}d left)`
                : `${profitShareStatus?.streakDaysRemaining || 7} more 5-venue days needed`}
            </span>
            <span className="text-blue-400 font-bold flex-shrink-0">₹1,000 Bonus</span>
          </div>
        </div>

        {/* CARD 3: MONTHLY STATUS (30-Day Venue Champion) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                  <Trophy className="w-3 h-3 text-purple-400" /> Monthly Champion
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1.5">Monthly Status</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-purple-300 font-mono">
                  {challenges?.thisMonthVerifiedCount || stats?.approvedCount || 0} / 150 Venues
                </span>
                <span className="block text-[10px] text-slate-400">Target: 150 / Mo</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5 my-2">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(100, Math.round(((challenges?.thisMonthVerifiedCount || stats?.approvedCount || 0) / 150) * 100))}%` }}
              />
            </div>

            {/* 2-Col Box */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-slate-400 block text-[9px] font-medium">Month Venues</span>
                <span className="font-bold text-white text-xs">{challenges?.thisMonthVerifiedCount || stats?.approvedCount || 0} / 150</span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-slate-400 block text-[9px] font-medium">Champion Reward</span>
                <span className="font-bold text-purple-400 text-xs">₹5,000 Cash</span>
              </div>
            </div>
          </div>

          {/* Footer Subtext */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-medium truncate max-w-[200px]">
              {(challenges?.thisMonthVerifiedCount || stats?.approvedCount || 0) >= 150
                ? '🏆 Monthly Champion Achieved!'
                : `${Math.max(0, 150 - (challenges?.thisMonthVerifiedCount || stats?.approvedCount || 0))} more to unlock ₹5k 🏆`}
            </span>
            <span className="text-purple-400 font-bold flex-shrink-0">25% Royalty</span>
          </div>
        </div>

      </div>

      {/* Tier Progress & Daily 5-Venue Challenge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tier Progress Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-primary-600 via-amber-600 to-orange-700 text-white p-6 sm:p-7 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-amber-200">Current Tier Level</span>
              <span className="text-xs font-black px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white">
                {progress?.currentLevel || 'LV.1'} • {progress?.tierTitle || 'Venue Explorer'}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black mt-3">
              {progress?.approvedCount || 0} Verified Venues Approved
            </h3>
            <p className="text-xs text-amber-100 font-light mt-1">
              List {Math.max(0, (progress?.nextTierTarget || 50) - (progress?.approvedCount || 0))} more verified venues to upgrade to next tier!
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-white/20 relative z-10">
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
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">25% Booking Share</span>
            <div className={`p-2 rounded-xl ${profitShareStatus?.profitShareUnlocked ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-purple-600">
              ₹{(stats?.bookingShareEarnings || 0).toLocaleString('en-IN')}
            </p>
            {profitShareStatus?.profitShareUnlocked ? (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                🔓 1-Yr Active
              </span>
            ) : (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                🔒 Locked
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            {profitShareStatus?.profitShareUnlocked
              ? `Active for 1 Year (${profitShareStatus?.daysRemaining || 365} days left)`
              : `Requires 7-Day Streak to unlock 1-Yr 25% Share (${profitShareStatus?.streakDaysCompleted || 0}/7 Days)`
            }
          </p>
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
