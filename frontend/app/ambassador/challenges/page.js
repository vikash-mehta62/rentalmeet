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
  PlusCircle
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

  const { challenges, profile } = data || {};
  const todayCount = challenges?.todayVerifiedCount || 0;
  const dailyTarget = 5;
  const weeklyTarget = 35;
  const monthlyTarget = 150;

  const dailyProgress = Math.min(100, Math.round((todayCount / dailyTarget) * 100));

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-300" /> High Performance Program
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Challenges &amp; <span className="text-amber-300">Power Streaks</span>
            </h1>
            <p className="text-xs text-blue-100 font-light mt-1 max-w-xl">
              Complete daily, weekly, and monthly venue listing goals to unlock massive achievement bonuses!
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
                Daily Goal
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">Daily 5-Venues Challenge</h3>
            <p className="text-xs text-slate-500 mt-1">Get 5 verified venue listings approved in 1 single day.</p>

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
              <div className="flex justify-between">
                <span>Standard Reward:</span>
                <span className="font-bold">5 × ₹100 = ₹500</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Challenge Bonus:</span>
                <span>5 × ₹50 = +₹250</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Total Daily Potential:</span>
                <span className="text-green-600">₹750 / day</span>
              </div>
            </div>
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
            <p className="text-xs text-slate-500 mt-1">List 5 venues daily for 7 consecutive days (35 total venues).</p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 font-semibold mb-1">Fixed Weekly Bonus</p>
              <p className="text-2xl font-black text-blue-600">+₹1,000 Cash Bonus</p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Standard Reward:</span>
                <span className="font-bold">35 × ₹100 = ₹3,500</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Daily Streak Bonus:</span>
                <span>35 × ₹50 = +₹1,750</span>
              </div>
              <div className="flex justify-between text-blue-600 font-bold">
                <span>Weekly Fixed Bonus:</span>
                <span>+₹1,000</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Total Weekly Potential:</span>
                <span className="text-green-600">₹6,250 / week</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Streak resets weekly every Monday at 00:00 AM IST.
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
                Monthly Trophy
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">30-Day Venue Champion</h3>
            <p className="text-xs text-slate-500 mt-1">List 150 verified venues within a calendar month.</p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 font-semibold mb-1">Fixed Monthly Bonus</p>
              <p className="text-2xl font-black text-purple-600">+₹5,000 Cash Bonus</p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Standard Reward:</span>
                <span className="font-bold">150 × ₹100 = ₹15,000</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Daily Challenge Bonus:</span>
                <span>150 × ₹50 = +₹7,500</span>
              </div>
              <div className="flex justify-between text-purple-600 font-bold">
                <span>Monthly Fixed Bonus:</span>
                <span>+₹5,000</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Total Monthly Potential:</span>
                <span className="text-green-600">₹27,500 / month</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Automatically upgrades badge to <span className="font-bold text-slate-700 dark:text-slate-200">Gold Master</span>!
          </div>
        </div>
      </div>
    </div>
  );
}
