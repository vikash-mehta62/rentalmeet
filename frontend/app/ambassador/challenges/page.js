'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import {
  Zap,
  Target,
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  Sparkles,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';

export default function AmbassadorChallengesPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const { challenges, profile, profitShareStatus } = data || {};
  const todayCount = challenges?.todayVerifiedCount || 0;
  const dailyTarget = 5;

  const dailyProgress = Math.min(100, Math.round((todayCount / dailyTarget) * 100));

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-300" /> HIGH PERFORMANCE STREAKS
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Daily, Weekly &amp; <span className="text-amber-300">Monthly Challenges</span>
            </h1>
            <p className="text-xs text-blue-100 font-light mt-1 max-w-xl">
              Accelerate your earnings with bonus payouts for consistent venue acquisition streaks.
            </p>
          </div>

          <Link
            href="/ambassador/add-venue"
            className="px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-primary-600" /> List Venue Now
          </Link>
        </div>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Challenge 1: Daily 5-Venues */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-amber-600 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-full border border-amber-200">
                Daily Streak
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">Daily 5-Venues Challenge</h3>
            <p className="text-xs text-slate-500 mt-1">Minimum 5 Verified Venues in 1 Day.</p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                <span>Today&apos;s Progress</span>
                <span className="text-slate-900 dark:text-white">{todayCount} / {dailyTarget} Venues</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Sample Payout Calculation:</p>
              <div className="flex justify-between">
                <span>5 × ₹100</span>
                <span className="font-bold">₹500/-</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Bonus 5 × ₹50</span>
                <span>₹250/-</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Total Potential:</span>
                <span className="text-green-600">₹750/- Per Day</span>
              </div>
            </div>

            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-3 italic">
              *Note - You will get ₹50/- bonus for listing each venue after 5 venues in a day (verified on same day).
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {todayCount >= dailyTarget ? (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Today&apos;s Goal Achieved! Bonus Credited.
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                {dailyTarget - todayCount} more venues needed today for +₹250 bonus.
              </span>
            )}
          </div>
        </div>

        {/* Challenge 2: 7-Day Power Streak */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-blue-600 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 rounded-full border border-blue-200">
                Weekly Streak
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">7-Day Power Streak</h3>
            <p className="text-xs text-slate-500 mt-1">5 Venues Daily or 35 Venues per Week.</p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 font-semibold mb-1">Fixed Incentive</p>
              <p className="text-2xl font-black text-blue-600">₹1,000/- Fixed</p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Sample Payout Calculation:</p>
              <div className="flex justify-between">
                <span>35 × ₹100:</span>
                <span className="font-bold">₹3,500/-</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Bonus 35 × ₹50:</span>
                <span>₹1,750/-</span>
              </div>
              <div className="flex justify-between text-blue-600 font-bold">
                <span>Fixed Incentive:</span>
                <span>₹1,000/-</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Total Potential:</span>
                <span className="text-green-600">₹6,250/- Per Week</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300">
              ⚡ Unlock 25% Royalty Income for 12 Months
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Payout processed weekly every Monday.
          </div>
        </div>

        {/* Challenge 3: 30-Day Monthly Champion */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-purple-600 px-3 py-1 bg-purple-50 dark:bg-purple-950/40 rounded-full border border-purple-200">
                Monthly Champion
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">30-Day Venue Champion</h3>
            <p className="text-xs text-slate-500 mt-1">150 Venues in 1 Month.</p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 font-semibold mb-1">Fixed Monthly Incentive</p>
              <p className="text-2xl font-black text-purple-600">₹5,000/- Fixed</p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-800 dark:text-slate-200">Sample Payout Calculation:</p>
              <div className="flex justify-between">
                <span>50 × ₹100 (Lv-1):</span>
                <span>₹5,000/-</span>
              </div>
              <div className="flex justify-between">
                <span>50 × ₹125 (Lv-2):</span>
                <span>₹6,250/-</span>
              </div>
              <div className="flex justify-between">
                <span>50 × ₹150 (Lv-3):</span>
                <span>₹7,500/-</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Bonus 150 × ₹50:</span>
                <span>₹7,500/-</span>
              </div>
              <div className="flex justify-between text-purple-600 font-bold">
                <span>Fixed Incentive:</span>
                <span>₹5,000/-</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Total Potential:</span>
                <span className="text-green-600">₹36,250/- Per Month</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300">
              🏆 Unlock 25% Royalty Income for 12 Months
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Monthly awards announced on the 1st of following month.
          </div>
        </div>
      </div>

      {/* 7-DAYS or 30-DAYS POWER STREAK UNLOCKABLE REWARD (2 CARDS) */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-purple-800/40 shadow-xl space-y-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            7-DAYS or 30-DAYS POWER STREAK UNLOCKABLE REWARD
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            25% Share of Platform Profit For 1 Full Year (365 Days)
          </h2>
          <p className="text-xs text-slate-300 font-light mt-1">
            Your earning does not stop at venue listing. Complete your <strong>7-Days or 30-Days Power Streak</strong> to unlock a <strong>25% cut of RentalMeet&apos;s profit</strong> on every customer booking across all your listed venues for a full 12 months (1 Year).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-800/90 border border-amber-500/40 space-y-2">
            <span className="text-xs font-bold text-amber-400">Option 1: 7-Day Power Streak</span>
            <p className="text-sm font-bold text-white">5 Venues Daily OR 35 Venues in a Week</p>
            <p className="text-xs text-slate-300">Unlocks ₹1,000 Cash Bonus + 25% Recurring Profit Share on all bookings for 1 Full Year (365 Days)!</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/90 border border-purple-500/40 space-y-2">
            <span className="text-xs font-bold text-purple-400">Option 2: 30-Day Venue Champion</span>
            <p className="text-sm font-bold text-white">150 Venues in 1 Month</p>
            <p className="text-xs text-slate-300">Unlocks ₹5,000 Cash Bonus + 25% Recurring Profit Share on all bookings for 1 Full Year (365 Days)!</p>
          </div>
        </div>
      </div>

      {/* Inactivity & Disqualification Warning Card */}
      <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
        <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Important Ambassador Inactivity Rules:
        </p>
        <p>• <strong>Inactive Ambassador:</strong> If you do not list even 1 venue within 30 days, your Ambassador ID will be blocked/deactivated.</p>
        <p>• <strong>Reactivation Fee:</strong> To reactivate a blocked/deactivated Ambassador ID, a fee of ₹500/- must be paid.</p>
        <p>• <strong>Repeated Inactivity:</strong> If inactive again for 30 days after reactivation, the ID will be permanently deactivated without refund.</p>
      </div>
    </div>
  );
}
