'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Star,
  Sparkles,
  Building2,
  TrendingUp,
  MapPin
} from 'lucide-react';

export default function AmbassadorLeaderboardPage() {
  const { token } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ambassador/leaderboard`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setLeaderboard(j.leaderboard || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const awards = [
    { rank: '1st Prize', title: 'Star Performer of the Month', reward: '₹25,000 Cash', icon: '👑', color: 'from-amber-400 to-amber-600' },
    { rank: '2nd Prize', title: 'Silver Performer Award', reward: '₹15,000 Cash', icon: '🥈', color: 'from-slate-400 to-slate-600' },
    { rank: '3rd Prize', title: 'Bronze Performer Award', reward: '₹10,000 Cash', icon: '🥉', color: 'from-orange-400 to-orange-600' },
    { rank: 'City Legend', title: 'Top City Partner Honor', reward: 'Special Certificate', icon: '⭐', color: 'from-blue-500 to-indigo-600' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-primary-600 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" /> All-India Rankings
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Ambassador <span className="text-amber-200">Leaderboard &amp; Awards</span>
          </h1>
          <p className="text-xs text-amber-100 font-light mt-1 max-w-xl">
            Compete with Venue Acquisition Partners across 250+ Indian cities and win monthly cash prizes!
          </p>
        </div>
      </div>

      {/* Monthly Cash Awards Grid */}
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Monthly Star Awards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {awards.map((a, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden"
            >
              <div className="text-3xl mb-2">{a.icon}</div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary-600">{a.rank}</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{a.title}</h4>
              <p className="text-xl font-black text-amber-600 mt-2">{a.reward}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Ambassadors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Pan-India Rankings
        </h3>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading ranking standings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No leaderboard data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3 w-16">Rank</th>
                  <th className="pb-3">Ambassador</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Level / Badge</th>
                  <th className="pb-3 text-right">Verified Venues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {leaderboard.map((a, idx) => (
                  <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-black text-slate-900 dark:text-white">
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                    </td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {a.userId?.name || 'Ambassador Partner'}
                    </td>
                    <td className="py-3 text-slate-500">
                      {a.addressDetails?.city || 'India'}
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                        {a.level} • {a.badge}
                      </span>
                    </td>
                    <td className="py-3 text-right font-black text-primary-600 text-sm">
                      {a.totalVenuesApproved || 0} Venues
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
