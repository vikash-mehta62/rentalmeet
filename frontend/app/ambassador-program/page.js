'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Award,
  TrendingUp,
  ShieldCheck,
  Zap,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calculator,
  ChevronDown,
  Gift,
  Target,
  Trophy,
  BadgeCheck
} from 'lucide-react';

export default function AmbassadorProgramPage() {
  // Interactive Calculator State
  const [venuesListed, setVenuesListed] = useState(25);
  const [avgBookingsPerVenue, setAvgBookingsPerVenue] = useState(5);
  const [openFaq, setOpenFaq] = useState(null);

  // Calculate rate based on tier
  const getRate = (count) => {
    if (count >= 500) return 200;
    if (count >= 201) return 150;
    if (count >= 51) return 125;
    return 100;
  };

  const getTierName = (count) => {
    if (count >= 500) return 'LV.4 City Venue Partner';
    if (count >= 201) return 'LV.3 Venue Master';
    if (count >= 51) return 'LV.2 Venue Champion';
    return 'LV.1 Venue Explorer';
  };

  const currentRate = getRate(venuesListed);
  const currentTier = getTierName(venuesListed);
  const listingEarnings = venuesListed * currentRate;

  // Challenge bonuses estimate
  const challengeBonus = venuesListed >= 150 ? 5000 + (venuesListed * 50) : venuesListed >= 35 ? 1000 + (venuesListed * 50) : venuesListed >= 5 ? venuesListed * 50 : 0;

  // 25% booking profit share estimate (assuming approx ₹1,500 profit per booking, 25% = ₹375)
  const estProfitPerBooking = 1000;
  const bookingSharePerMonth = Math.round(venuesListed * avgBookingsPerVenue * (estProfitPerBooking * 0.25));
  const totalProjectedMonthly = listingEarnings + challengeBonus + bookingSharePerMonth;

  const tiers = [
    {
      level: 'LV.1',
      title: 'Venue Explorer',
      eligibility: '0–50 Verified Venues',
      reward: '₹100 / Venue',
      badge: 'Bronze Explorer',
      color: 'from-amber-600 to-amber-700',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      tag: 'Starting Level'
    },
    {
      level: 'LV.2',
      title: 'Venue Champion',
      eligibility: '51–200 Verified Venues',
      reward: '₹125 / Venue',
      badge: 'Silver Champion',
      color: 'from-slate-500 to-slate-700',
      bgLight: 'bg-slate-50 dark:bg-slate-800/40',
      border: 'border-slate-300 dark:border-slate-700',
      tag: '+25% Higher Reward'
    },
    {
      level: 'LV.3',
      title: 'Venue Master',
      eligibility: '201–500 Verified Venues',
      reward: '₹150 / Venue',
      badge: 'Gold Master',
      color: 'from-yellow-500 to-amber-600',
      bgLight: 'bg-yellow-50 dark:bg-yellow-950/30',
      border: 'border-yellow-300 dark:border-yellow-700',
      tag: '+50% Higher Reward'
    },
    {
      level: 'LV.4',
      title: 'City Venue Partner',
      eligibility: '500+ Verified Venues',
      reward: '₹200 / Venue',
      badge: 'City Legend',
      color: 'from-primary-600 to-orange-600',
      bgLight: 'bg-primary-50 dark:bg-primary-950/30',
      border: 'border-primary-300 dark:border-primary-800',
      tag: '2x Top Tier Partner'
    }
  ];

  const challenges = [
    {
      title: 'Daily 5-Venues Challenge',
      target: '5 Verified Venues in 1 Day',
      bonus: '+₹50 / Venue Extra Bonus',
      example: '5 × ₹100 = ₹500 + Challenge Bonus 5 × ₹50 = ₹250',
      total: '₹750 / Day',
      tag: 'Daily Streak',
      icon: Zap,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/50'
    },
    {
      title: '7-Day Power Streak',
      target: '5 Venues Daily (35 Venues / Week)',
      bonus: '₹1,000 Fixed Weekly Achievement Bonus',
      example: '35 × ₹100 (₹3,500) + Daily Bonus (₹1,750) + Fixed Bonus (₹1,000)',
      total: '₹6,250 / Week',
      tag: 'Weekly Streak',
      icon: Target,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50'
    },
    {
      title: '30-Day Venue Champion',
      target: '150 Venues in 1 Month',
      bonus: '₹5,000 Fixed Monthly Achievement Bonus',
      example: '150 × ₹100 (₹15,000) + Daily Bonus (₹7,500) + Fixed Bonus (₹5,000)',
      total: '₹27,500 / Month',
      tag: 'Monthly Champion',
      icon: Trophy,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50'
    }
  ];

  const awards = [
    { rank: '1st Position', title: 'RentalMeet Star Performer', reward: '₹25,000', icon: '🏆' },
    { rank: '2nd Position', title: 'Silver Performer', reward: '₹15,000', icon: '🥈' },
    { rank: '3rd Position', title: 'Bronze Performer', reward: '₹10,000', icon: '🥉' },
    { rank: 'Top City Partner', title: 'City Legend Special Recognition', reward: 'Partner Honor', icon: '⭐' }
  ];

  const steps = [
    { num: '01', title: 'Apply as Ambassador', desc: 'Fill the simple online application form with basic KYC and bank details.' },
    { num: '02', title: 'Search Nearby Venues', desc: 'Discover hotels, banquet halls, training centres, coaching, and meeting spaces.' },
    { num: '03', title: 'Collect & Upload Info', desc: 'Use our 7-step venue listing wizard to submit photos, amenities, pricing & owner contact.' },
    { num: '04', title: 'Admin Verification', desc: 'Our team verifies the venue and documents within 24–48 hours.' },
    { num: '05', title: '7-Day Streak & 25% Share', desc: 'Complete a 7-day power streak to unlock ₹1,000 cash bonus + 25% recurring profit share on all bookings for 1 Full Year (365 Days)!' }
  ];

  const faqs = [
    {
      q: 'Who can join the RentalMeet Venue Ambassador Program?',
      a: 'Anyone! Students, freelancers, sales executives, working professionals, and homemakers can join this flexible part-time or freelance program to earn significant instant and recurring income.'
    },
    {
      q: 'How does the Instant Listing Reward work?',
      a: 'As soon as your submitted venue is verified and approved by the RentalMeet team, your wallet is instantly credited based on your tier level: LV.1 (₹100), LV.2 (₹125), LV.3 (₹150), LV.4 (₹200).'
    },
    {
      q: 'How do I unlock the 25% 12-Month Booking Revenue Share?',
      a: 'To unlock your 1-Year (365 Days) 25% Booking Profit Share, simply complete the 7-Day Power Streak by listing venues actively. Once unlocked, every time a customer books any venue you onboarded, you receive a 25% share of RentalMeet’s platform profit on that booking for a full 12 months!'
    },
    {
      q: 'How do I withdraw my earnings?',
      a: 'You can request a withdrawal anytime directly to your UPI ID or Bank Account with a minimum threshold of just ₹100. Payouts are processed securely and swiftly.'
    },
    {
      q: 'Is there any joining fee?',
      a: 'No! The RentalMeet Venue Ambassador Program is 100% free to join with zero upfront costs.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-amber-50/60 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 text-xs font-bold uppercase tracking-wider animate-bounce-subtle">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              RentalMeet™ Venue Ambassador Program
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-heading tracking-tight leading-tight">
              Find Venues. <span className="text-primary-600">Create Income.</span> <br />
              Build India&apos;s Largest Network.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-light max-w-2xl mx-auto">
              Earn <span className="font-semibold text-slate-900 dark:text-white">₹100 to ₹200 per verified venue</span> + daily streak bonuses + <span className="font-semibold text-primary-600">25% recurring profit share</span> on bookings for 12 months.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register-ambassador"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-primary-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
              >
                Apply as Ambassador <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login?role=ambassador"
                className="w-full sm:w-auto px-8 py-4 border-2 border-slate-300 dark:border-slate-700 hover:border-primary-500 rounded-2xl font-bold text-base text-slate-800 dark:text-slate-200 transition-all hover:bg-white dark:hover:bg-slate-800"
              >
                Ambassador Login
              </Link>
            </div>

            {/* Metric Badges */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-2xl font-black text-primary-600">₹100 - ₹200</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Per Verified Venue</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-2xl font-black text-amber-600">+₹250/Day</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">5-Venue Daily Bonus</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-2xl font-black text-green-600">25% Profit Share</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">12-Month Recurring</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-2xl font-black text-blue-600">₹25,000</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Star Monthly Award</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Calculator className="w-3.5 h-3.5" /> Interactive Earning Simulator
            </div>
            <h2 className="text-3xl font-black tracking-tight">Calculate Your Monthly Income</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              See how instant listing rewards, challenge bonuses, and 25% recurring booking shares compound over time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Controls */}
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/60 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Venues you can list per month:
                  </label>
                  <span className="text-lg font-black text-primary-600">{venuesListed} Venues</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={venuesListed}
                  onChange={(e) => setVenuesListed(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>5 (Part-time)</span>
                  <span>50 (Champion)</span>
                  <span>100 (Master)</span>
                  <span>200+ (Partner)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Avg. monthly bookings per venue:
                  </label>
                  <span className="text-lg font-black text-amber-600">{avgBookingsPerVenue} Bookings</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={avgBookingsPerVenue}
                  onChange={(e) => setAvgBookingsPerVenue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>1 Booking</span>
                  <span>5 Bookings</span>
                  <span>10 Bookings</span>
                  <span>20 Bookings</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] text-slate-500 font-semibold">Your Tier Level</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currentTier}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] text-slate-500 font-semibold">Listing Reward Rate</p>
                  <p className="text-sm font-bold text-primary-600 mt-0.5">₹{currentRate} / Venue</p>
                </div>
              </div>
            </div>

            {/* Results Display */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-xs font-black uppercase tracking-widest text-primary-400 mb-6">
                Projected Monthly Income
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Instant Listing Income:</span>
                  <span className="font-bold text-white">₹{listingEarnings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Streak & Challenge Bonus:</span>
                  <span className="font-bold text-amber-400">+₹{challengeBonus.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">25% Booking Share (Est):</span>
                  <span className="font-bold text-green-400">+₹{bookingSharePerMonth.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-slate-700 my-2" />
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-white">Total Potential:</span>
                  <span className="text-3xl font-black text-primary-400">
                    ₹{totalProjectedMonthly.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </span>
                </div>
              </div>

              <Link
                href="/register-ambassador"
                className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-slate-900 font-black rounded-xl text-center text-sm transition-all block shadow-lg active:scale-95"
              >
                Join Now to Earn ₹{totalProjectedMonthly.toLocaleString('en-IN')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Tier Income Structure */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Award className="w-3.5 h-3.5" /> Tiered Growth Ladder
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Venue Listing Income Structure</h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
              As you list more verified venues, your earning rate automatically increases from ₹100 to ₹200 per venue!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-3xl border ${tier.border} ${tier.bgLight} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm">
                      {tier.level}
                    </span>
                    <span className="text-[11px] font-bold text-primary-600">{tier.tag}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tier.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tier.eligibility}</p>

                  <div className="my-6 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 font-medium">Reward Rate</p>
                    <p className="text-2xl font-black text-primary-600 mt-0.5">{tier.reward}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <BadgeCheck className="w-4 h-4 text-primary-600" />
                  <span>Badge: {tier.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges & Streak Bonuses */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" /> High Performance Streaks
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Daily, Weekly & Monthly Challenges</h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
              Accelerate your earnings with bonus payouts for consistent venue acquisition streaks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {challenges.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl ${c.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {c.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{c.title}</h3>
                    <p className="text-xs font-semibold text-primary-600 mt-1">{c.target}</p>

                    <div className="mt-4 p-3.5 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Calculation:</p>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400">{c.example}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 font-medium">Total Potential</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{c.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 25% Recurring Booking Revenue Share Model */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> 7-Day Power Streak Unlockable Reward
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                25% Share of Platform Profit <br />
                <span className="text-primary-400">For 1 Full Year (365 Days)</span>
              </h2>
              <p className="text-slate-300 text-base font-light">
                Your earning does not stop at venue listing. Complete your <span className="font-bold text-amber-400">7-Day Power Streak</span> to unlock a <span className="font-bold text-white">25% cut of RentalMeet&apos;s profit</span> on every customer booking across all your venues for a full 12 months (1 Year).
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span><strong>7-Day Streak Unlock:</strong> Complete 7 active listing days to activate 1-Year (365-Day) 25% profit sharing.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  <span>Real-time booking revenue credited directly to your wallet.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  <span>The more active venues you list, the higher your monthly recurring income.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  <span>Transparent dashboard with per-booking breakdown.</span>
                </div>
              </div>
            </div>

            {/* Example Card */}
            <div className="bg-slate-800/90 border border-slate-700 p-8 rounded-3xl shadow-2xl space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary-400">
                Booking Revenue Example
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Customer Booking Value:</span>
                  <span className="font-bold text-white">₹10,000</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">RentalMeet Commission (~15%):</span>
                  <span className="font-bold text-white">₹1,500</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-700">
                  <span className="text-slate-400">Ambassador Share (25% of Profit):</span>
                  <span className="font-bold text-primary-400">₹375 / booking</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80">
                <p className="text-xs text-slate-400 font-medium">If you list 100 venues averaging 10 bookings/month:</p>
                <p className="text-2xl font-black text-green-400 mt-1">₹2,50,000 / month recurring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Awards Showcase */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Trophy className="w-3.5 h-3.5" /> Recognition & Cash Prizes
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Monthly Star Performer Awards</h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
              Every month, top-performing Venue Ambassadors across India win massive cash awards and leadership honors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {awards.map((a, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:scale-105 transition-all shadow-sm"
              >
                <div className="text-4xl mb-3">{a.icon}</div>
                <span className="text-[11px] font-black uppercase tracking-wider text-primary-600">{a.rank}</span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{a.title}</h4>
                <p className="text-2xl font-black text-amber-600 mt-3">{a.reward}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-Step Working Process */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">How It Works</h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
              Start earning in 5 easy steps with zero complicated paperwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative"
              >
                <span className="text-3xl font-black text-primary-500/25 block mb-2">{s.num}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-light leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 cursor-pointer bg-slate-50 dark:bg-slate-800/60"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="flex justify-between items-center gap-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{f.q}</h3>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </div>
                {openFaq === idx && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-primary-600 via-orange-600 to-amber-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Ready to Build Your Venue Acquisition Income?
          </h2>
          <p className="text-base text-white/90 font-light max-w-2xl mx-auto mb-8">
            Join thousands of Venue Ambassadors across 250+ Indian cities today. Free registration with instant payout setup.
          </p>
          <Link
            href="/register-ambassador"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-base shadow-2xl hover:bg-slate-100 transition-all transform hover:-translate-y-1"
          >
            Apply Now - It&apos;s Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
