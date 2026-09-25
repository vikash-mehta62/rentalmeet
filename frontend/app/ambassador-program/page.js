'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Award,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Trophy,
  BadgeCheck,
  ChevronDown
} from 'lucide-react';

export default function AmbassadorProgramPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const tiers = [
    {
      level: 'Level-1',
      title: 'Venue Ambassador',
      eligibility: '0–50 Verified Venues',
      reward: '₹100/- Per Venue',
      badge: 'Bronze Explorer',
      color: 'from-amber-600 to-amber-700',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      tag: 'Starting Level',
      perks: ['+ Bonus', '+ Weekly/Monthly Incentive', '+ 25% of Royalty Income*']
    },
    {
      level: 'Level-2',
      title: 'Venue Explorer',
      eligibility: '51–100 Verified Venues',
      reward: '₹125/- Per Venue',
      badge: 'Silver Champion',
      color: 'from-slate-500 to-slate-700',
      bgLight: 'bg-slate-50 dark:bg-slate-800/40',
      border: 'border-slate-300 dark:border-slate-700',
      tag: '+25% Higher Payout',
      perks: ['+ Bonus', '+ Weekly/Monthly Incentive', '+ 25% of Royalty Income*']
    },
    {
      level: 'Level-3',
      title: 'Venue Champion',
      eligibility: '101–150 Verified Venues',
      reward: '₹150/- Per Venue',
      badge: 'Gold Master',
      color: 'from-yellow-500 to-amber-600',
      bgLight: 'bg-yellow-50 dark:bg-yellow-950/30',
      border: 'border-yellow-300 dark:border-yellow-700',
      tag: '+50% Higher Payout',
      perks: ['+ Bonus', '+ Weekly/Monthly Incentive', '+ 25% of Royalty Income*']
    },
    {
      level: 'Level-4',
      title: 'Venue Master',
      eligibility: '150+ Verified Venues',
      reward: '₹200/- Per Venue',
      badge: 'City Legend',
      color: 'from-primary-600 to-orange-600',
      bgLight: 'bg-primary-50 dark:bg-primary-950/30',
      border: 'border-primary-300 dark:border-primary-800',
      tag: '+100% Higher Payout',
      perks: ['+ Bonus', '+ Weekly/Monthly Incentive', '+ 25% of Royalty Income*']
    }
  ];

  const challenges = [
    {
      title: 'Daily 5-Venues Challenge',
      target: 'Minimum 5 Verified Venues in 1 Day',
      bonus: '+₹50 / Venue Extra Bonus',
      example: '5 × ₹100 = ₹500 + Bonus 5 × ₹50 = ₹250',
      total: '₹750/- Per Day',
      note: '*You will get ₹50/- bonus for listing each venue after 5 venues in a day. Applies only to venues verified on same day.',
      tag: 'Daily Streak',
      icon: Zap,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/50'
    },
    {
      title: '7-Day Power Streak',
      target: '5 Venues Daily or 35 Venues per Week',
      bonus: '₹1,000 Fixed Weekly Incentive',
      example: '35 × ₹100 (₹3,500) + Bonus 35 × ₹50 (₹1,750) + Fixed (₹1,000)',
      total: '₹6,250/- Per Week',
      unlock: '⚡ Unlock 25% Royalty Income for 12 Months',
      tag: 'Weekly Streak',
      icon: Target,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50'
    },
    {
      title: '30-Day Venue Champion',
      target: '150 Venues in 1 Month',
      bonus: '₹5,000 Fixed Monthly Incentive',
      example: '50×₹100 (₹5k) + 50×₹125 (₹6.25k) + 50×₹150 (₹7.5k) + Bonus 150×₹50 (₹7.5k) + Fixed ₹5k',
      total: '₹36,250/- Per Month',
      unlock: '🏆 Unlock 25% Royalty Income for 12 Months',
      tag: 'Monthly Champion',
      icon: Trophy,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50'
    }
  ];

  const payoutSchedule = [
    { type: 'Per-Venue Payout', freq: 'Weekly', time: 'Every Monday' },
    { type: 'Daily Streak Bonus', freq: 'Weekly', time: 'Every Monday' },
    { type: 'Weekly Streak Bonus', freq: 'Weekly', time: 'Every Monday' },
    { type: 'Monthly Champion Award', freq: 'Monthly', time: '1st of following month' },
    { type: 'Royalty Income', freq: 'Monthly', time: '7th of following month' }
  ];

  const awards = [
    { rank: '1ST POSITION', title: 'RentalMeet Star Performer', reward: 'Rs. 25,000' },
    { rank: '2ND POSITION', title: 'RentalMeet Silver Performer', reward: 'Rs. 15,000' },
    { rank: '3RD POSITION', title: 'RentalMeet Bronze Performer', reward: 'Rs. 10,000' }
  ];

  const steps = [
    { num: '01', title: 'Apply as Ambassador', desc: 'Fill the simple online application form with basic KYC and bank details.' },
    { num: '02', title: 'Search Nearby Venues', desc: 'Discover Meeting Venues, Auditoriums, Hotels, Banquet halls, Marriage Lawns, and other Venues.' },
    { num: '03', title: 'Collect & Upload Info', desc: 'Use our 7-step venue listing wizard to submit photos, amenities, pricing & owner contact.' },
    { num: '04', title: 'Admin Verification', desc: 'Our team verifies the venue and documents within 24 hours' },
    { num: '05', title: '7-Days Streak & 25% Share', desc: 'Complete a 7-day power streak to unlock Rs. 1,000 cash bonus + 25% recurring profit share on all bookings for 1 Full Year (365 Days)!' },
    { num: '06', title: '30-Days Streak & 25% Share', desc: 'Complete a 30-day power streak to unlock Rs. 5,000 cash bonus + 25% recurring profit share on all bookings for 1 Full Year (365 Days)!' }
  ];

  const faqs = [
    {
      q: '1. What is the RentalMeet Venue Ambassador Program?',
      a: 'It is a program where you earn money by finding and listing venues (like hotels, banquet halls, meeting rooms) on the RentalMeet platform. You earn per verified venue, unlock streak bonuses, and get a share of the platform\'s profit on bookings.'
    },
    {
      q: '2. How much can I earn per venue?',
      a: 'You can earn Rs. 100 to Rs. 200 per verified venue. Additionally, you get a Rs. 50 bonus for every venue listed after the first 5 venues in a single day.'
    },
    {
      q: '3. What is the "25% Royalty Income" and how do I unlock it?',
      a: 'It is a 25% share of RentalMeet\'s platform fee earned from bookings at venues you listed. This income is paid to you for 12 months from the date the venue is verified.\n\nTo unlock this royalty, you must complete either a 7-Day Streak or a 30-Day Streak.'
    },
    {
      q: '4. What is the difference between the 7-Day Streak and the 30-Day Streak?',
      a: '• 7-Day Streak: List 5 venues daily OR 35 venues in a week. This unlocks Rs. 1,000 cash bonus + 25% royalty.\n• 30-Day Streak: List 150 venues in a month. This unlocks Rs. 5,000 cash bonus + 25% royalty.'
    },
    {
      q: '5. How long does the 25% royalty income last?',
      a: 'The royalty income is valid for 12 months (1 year / 365 Days) from the date of venue verification. After 12 months, you will not receive any royalty on bookings for that venue.'
    },
    {
      q: '6. What happens if I don\'t list any venue for 30 days?',
      a: 'If you do not list even 1 venue within 30 days, your Ambassador ID will be blocked/deactivated. To reactivate it, you will need to pay a Rs. 500 reactivation fee. If inactive again for 30 days after reactivation, the ID will be permanently deactivated without refund.'
    },
    {
      q: '7. When and how will I receive my payments?',
      a: '• Per-Venue Payouts & Streak Bonuses: Processed weekly, every Monday.\n• Monthly Champion Award: Processed on the 1st of the following month.\n• Royalty Income: Processed monthly on the 7th of the following month.\nPayments are made via UPI or bank transfer only.'
    },
    {
      q: '8. Do I need to pay any fee to join the program?',
      a: 'No, there is no joining fee. The program is 100% free to join. However, a Rs. 500 fee applies only if your ID is deactivated due to inactivity and you wish to reactivate it.'
    },
    {
      q: '9. How are the Monthly Star Performer Awards decided?',
      a: 'To be eligible, you must have 150+ verified venues in a single calendar month. Winners are chosen based on the highest number of verified venues. In case of a tie, the ambassador with the higher booking conversion rate wins.'
    },
    {
      q: '10. What are the cash prizes for the Monthly Star Performer Awards?',
      a: '• 1st Position: Rs. 25,000 (RentalMeet Star Performer)\n• 2nd Position: Rs. 15,000 (RentalMeet Silver Performer)\n• 3rd Position: Rs. 10,000 (RentalMeet Bronze Performer)'
    },
    {
      q: '11. Can I list any venue?',
      a: 'You can list meeting venues, auditoriums, hotels, banquet halls, marriage lawns, and other venues (as per our Venues Category). The venue must be new (not already listed on RentalMeet) and must meet RentalMeet\'s verification standards.'
    },
    {
      q: '12. What documents do I need to submit for a venue?',
      a: 'You need to submit Venue complete details, Photos, Amenities, Pricing details, and Owner contact information using RentalMeet\'s 7-step venue listing wizard.'
    },
    {
      q: '13. How long does it take for a venue to get verified?',
      a: 'After you submit the venue details, RentalMeet\'s team verifies the venue and documents within 24 hours.'
    },
    {
      q: '14. Is there any penalty for providing false information?',
      a: 'Yes. If you provide false or misleading information, list venues without owner consent, or engage in fraudulent activity, you will be disqualified and all pending payouts will be forfeited.'
    },
    {
      q: '15. Can I transfer my Ambassador ID or royalty income to someone else?',
      a: 'No. The Ambassador ID and royalty income are non-transferable and non-inheritable.'
    },
    {
      q: '16. What happens to my royalty if a venue is removed from RentalMeet?',
      a: 'If a venue is removed from RentalMeet, the royalty on that specific venue will cease immediately.'
    },
    {
      q: '17. Do I get royalty on cancelled or refunded bookings?',
      a: 'No. Royalty is not applicable on cancelled, refunded, or disputed bookings.'
    },
    {
      q: '18. Which court has jurisdiction for any disputes?',
      a: 'Any disputes will be subject to the jurisdiction of the courts of Bhopal, Madhya Pradesh, India.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-amber-50/60 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              &quot;Join RentalMeet&apos;s Venue Ambassador Program and start earning today.&quot;
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-heading tracking-tight leading-tight">
              Join India&apos;s Fastest Growing Venue Network as a <br />
              <span className="text-primary-600">&quot;Venue Ambassador&quot;</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-700 dark:text-slate-200 font-semibold italic">
              &quot;No investment. No experience needed. Just find venues and start earning.&quot;
              <span className="block text-sm text-primary-600 font-bold not-italic mt-1">&quot;AnyTime..Any Where&quot;</span>
            </p>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 max-w-3xl mx-auto text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium">
              Earn <span className="font-black text-primary-600">₹100 to ₹200 per Verified Venue</span> + Daily Bonus + Weekly/Monthly Incentive.
              <br />
              <span className="text-amber-700 dark:text-amber-300 font-bold">
                Additional - 25% Recurring Profit Share &quot;Royalty Income&quot; on bookings for 12 months.
              </span>
              <span className="text-xs block text-slate-500 dark:text-slate-400 mt-0.5">
                (Requires 7-Days or 30-Days Streak for unlock)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register-ambassador"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-primary-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
              >
                Register Now <ArrowRight className="w-5 h-5" />
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
                <p className="text-2xl font-black text-green-600">25% Royalty</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">12-Month Profit Share</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-2xl font-black text-blue-600">₹25,000</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Star Monthly Award</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4-Tier Income Structure */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Award className="w-3.5 h-3.5" /> TIERED GROWTH LADDER
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Venue Listing Income Structure</h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2">
              As you list more verified venues, your earning rate automatically increases from Rs.100 to Rs.200 per venue!
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
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">({tier.eligibility})</p>

                  <div className="my-6 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 font-medium">Payout Rate</p>
                    <p className="text-2xl font-black text-primary-600 mt-0.5">{tier.reward}</p>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium pb-4">
                    {tier.perks.map((p, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
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

      {/* 3. Challenges & Streak Bonuses */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" /> HIGH PERFORMANCE STREAKS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Daily, Weekly &amp; Monthly Challenges</h2>
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
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Sample Payout Calculation:</p>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400">{c.example}</p>
                    </div>

                    {c.note && (
                      <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                        {c.note}
                      </p>
                    )}

                    {c.unlock && (
                      <div className="mt-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <span>{c.unlock}</span>
                      </div>
                    )}
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

      {/* 4. 7-DAYS or 30-DAYS POWER STREAK UNLOCKABLE REWARD */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> 7-DAYS or 30-DAYS POWER STREAK UNLOCKABLE REWARD
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              25% Share of Platform Profit <br />
              <span className="text-primary-400">For 1 Full Year (365 Days)</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base font-light max-w-2xl mx-auto">
              Your earning does not stop at venue listing. Complete your <span className="font-bold text-amber-400">7-Days or 30-Days Power Streak</span> to unlock a <span className="font-bold text-white">25% cut of RentalMeet&apos;s profit</span> on every customer booking across all your listed venues for a full 12 months (1 Year).
            </p>
          </div>

          {/* 2 Cards Grid for 7 Days & 30 Days Streaks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            
            {/* Card 1: 7-Day Power Streak */}
            <div className="bg-slate-800/90 border-2 border-amber-500/40 p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase border border-amber-500/30">
                    Option 1: Weekly Power Streak
                  </span>
                  <Target className="w-6 h-6 text-amber-400" />
                </div>

                <h3 className="text-2xl font-black text-white">7-Days Power Streak</h3>
                <p className="text-xs text-amber-300 font-bold">5 Venues Daily OR 35 Venues in a Week</p>

                <div className="space-y-2.5 pt-2 text-sm text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span><strong>₹1,000 Cash Bonus:</strong> Instant fixed weekly performance reward.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>25% Royalty Profit Share:</strong> Unlocked on all listed venues for 1 Full Year (365 Days).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Total Weekly Potential:</strong> Up to ₹6,250 / week earnings.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-400">Unlock Duration:</span>
                <span className="font-bold text-amber-300">12 Months (365 Days)</span>
              </div>
            </div>

            {/* Card 2: 30-Day Monthly Champion */}
            <div className="bg-slate-800/90 border-2 border-purple-500/40 p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase border border-purple-500/30">
                    Option 2: Monthly Champion
                  </span>
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>

                <h3 className="text-2xl font-black text-white">30-Days Power Streak</h3>
                <p className="text-xs text-purple-300 font-bold">150 Venues in 1 Calendar Month</p>

                <div className="space-y-2.5 pt-2 text-sm text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span><strong>₹5,000 Cash Bonus:</strong> Instant fixed monthly achievement reward.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span><strong>25% Royalty Profit Share:</strong> Unlocked on all listed venues for 1 Full Year (365 Days).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Total Monthly Potential:</strong> Up to ₹36,250 / month earnings.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center text-xs">
                <span className="text-slate-400">Unlock Duration:</span>
                <span className="font-bold text-purple-300">12 Months (365 Days)</span>
              </div>
            </div>
          </div>

          {/* Booking Revenue Example & Recurring Calculator */}
          <div className="bg-slate-800/80 border border-slate-700 p-8 rounded-3xl shadow-2xl space-y-6 max-w-4xl mx-auto">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary-400">
              Booking Revenue Example
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700">
                <p className="text-xs text-slate-400">Customer Booking Value</p>
                <p className="text-xl font-bold text-white mt-1">₹10,000</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700">
                <p className="text-xs text-slate-400">RentalMeet Commission (~15%)</p>
                <p className="text-xl font-bold text-white mt-1">₹1,500</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700">
                <p className="text-xs text-slate-400">Ambassador Share (25% of Profit)</p>
                <p className="text-xl font-black text-green-400 mt-1">₹375 / booking</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 text-center sm:text-left sm:flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-medium">Recurring Income Example (100 Venues @ 10 bookings/month):</p>
                <p className="text-sm text-slate-300 mt-0.5">Total Bookings: 1,000 | Profit: ₹10,00,000</p>
              </div>
              <p className="text-2xl font-black text-green-400 mt-2 sm:mt-0">₹2,50,000 / month recurring</p>
            </div>
            <p className="text-[11px] text-slate-400 text-center italic">*Note - Actual income depends on venue performance and bookings.</p>
          </div>
        </div>
      </section>

      {/* 5. PAYOUT SCHEDULE */}
      <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              PAYOUT SCHEDULE
            </h2>
          </div>

          <div className="overflow-hidden border border-black dark:border-slate-700">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-black dark:border-slate-700">
                <tr>
                  <th className="p-3 border-r border-black dark:border-slate-700">Payout Type</th>
                  <th className="p-3 border-r border-black dark:border-slate-700">Frequency</th>
                  <th className="p-3">Processing Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black dark:divide-slate-700 bg-white dark:bg-slate-900">
                {payoutSchedule.map((p, i) => (
                  <tr key={i}>
                    <td className="p-3 font-medium text-slate-900 dark:text-white border-r border-black dark:border-slate-700">{p.type}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 border-r border-black dark:border-slate-700">{p.freq}</td>
                    <td className="p-3 text-slate-900 dark:text-slate-200">{p.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. RECOGNITION & CASH PRIZES - Monthly Star Performer Awards */}
      <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
              RECOGNITION &amp; CASH PRIZES
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-500 tracking-tight">
              Monthly Star Performer Awards
            </h2>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-300 mt-2 font-medium">
              Every month, top-performing Venue Ambassadors across India win massive cash awards and leadership honors.
            </p>
          </div>

          {/* 3 Positions Table */}
          <div className="border border-black dark:border-slate-700 mb-6 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-black dark:divide-slate-700 text-center text-xs">
              {awards.map((a, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900">
                  <span className="font-bold text-slate-900 dark:text-white block uppercase">
                    {a.rank}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 mt-1">{a.title}</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{a.reward}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Terms & Conditions Box Under Star Performer */}
          <div className="border border-black dark:border-slate-700">
            <div className="py-2 px-4 border-b border-black dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white">
              Terms &amp; Conditions
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black dark:divide-slate-700 text-xs">
              
              {/* Left Column */}
              <div className="divide-y divide-black dark:divide-slate-700">
                {/* 1. ELIGIBILITY CRITERIA */}
                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-red-600 uppercase tracking-wide">
                    ELIGIBILITY CRITERIA
                  </h4>
                  <ul className="space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>Ambassador must have 150+ Verified Venues in a single calendar month to be eligible for any award.</li>
                    <li>Only verified and approved venues will be counted towards the 150+ venue target.</li>
                    <li>Venues must be new listings and not previously registered on RentalMeet.</li>
                  </ul>
                </div>

                {/* 2. SELECTION PROCESS */}
                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-red-600 uppercase tracking-wide">
                    SELECTION PROCESS
                  </h4>
                  <ul className="space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>Winners will be selected based on the highest number of verified venues in a month.</li>
                    <li>In case of a tie, the Ambassador with the higher conversion rate (bookings generated) will be ranked higher.</li>
                  </ul>
                </div>
              </div>

              {/* Right Column */}
              <div className="divide-y divide-black dark:divide-slate-700">
                {/* 3. AWARD DISTRIBUTION */}
                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-red-600 uppercase tracking-wide">
                    AWARD DISTRIBUTION
                  </h4>
                  <ul className="space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>Cash prizes will be credited to the winner&apos;s registered bank account within 15 working days after the month ends.</li>
                    <li>Winners will be announced on the 1st week of the following month.</li>
                    <li>TDS will be deducted as per applicable Indian tax laws.</li>
                  </ul>
                </div>

                {/* 4. GENERAL CONDITIONS */}
                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-red-600 uppercase tracking-wide">
                    GENERAL CONDITIONS
                  </h4>
                  <ul className="space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>RentalMeet reserves the right to verify all claims before awarding prizes.</li>
                    <li>Any fraudulent activity will lead to disqualification and forfeiture of the award.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 7. How It Works */}
      <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-500 tracking-tight">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-300 mt-1 font-medium">
              Start earning in 6 easy steps with zero complicated paperwork.
            </p>
          </div>

          <div className="border border-black dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-black dark:divide-slate-700 text-center text-xs">
              {steps.map((s, idx) => (
                <div key={idx} className="p-4 flex flex-col justify-start bg-white dark:bg-slate-900">
                  <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {s.num}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 min-h-[32px] flex items-center justify-center">
                    {s.title}
                  </h3>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed text-left sm:text-center">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 8. *Terms & Condition */}
      <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold italic text-slate-900 dark:text-white">
              *Terms &amp; Condition
            </h2>
          </div>

          <div className="border border-black dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black dark:divide-slate-700 text-xs">
              
              {/* Left Box (Top-Left & Bottom-Left) */}
              <div className="divide-y divide-black dark:divide-slate-700">
                
                {/* STREAK CONDITIONS */}
                <div className="p-5 space-y-3">
                  <h4 className="font-bold text-red-600 uppercase tracking-wide">
                    STREAK CONDITIONS
                  </h4>
                  
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Daily Streak Conditions</p>
                    <ul className="mt-1 space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                      <li>The 5 venues must be verified on the same calendar day.</li>
                      <li>All venues must meet RentalMeet&apos;s verification standards.</li>
                      <li>Venues must be new (not previously listed on RentalMeet).</li>
                      <li>Payouts are processed weekly after verification.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Weekly Streak Conditions</p>
                    <ul className="mt-1 space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                      <li>Ambassador must maintain consistent daily activity (minimum 5 venues/day).</li>
                      <li>If a day is missed, the weekly streak bonus may be reduced or forfeited.</li>
                      <li>Weekly payouts are processed every Monday for the previous week.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Monthly Champion Conditions</p>
                    <ul className="mt-1 space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                      <li>The 150 venues must be verified within a single calendar month.</li>
                      <li>All venues must meet verification standards.</li>
                      <li>Monthly awards are announced on the 1st of the following month.</li>
                    </ul>
                  </div>
                </div>

                {/* TERMS OF PAYOUT */}
                <div className="p-5 space-y-2">
                  <h4 className="font-bold text-red-600 uppercase tracking-wide">
                    TERMS OF PAYOUT
                  </h4>
                  <ul className="space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>All payouts are subject to verification and approval by RentalMeet.</li>
                    <li>Payouts are made via UPI/bank transfer only.</li>
                    <li>Ambassadors must submit correct UPI ID or Bank Account details.</li>
                    <li>RentalMeet is not responsible for payments lost due to incorrect bank details.</li>
                    <li>TDS (Tax Deducted at Source) will be deducted as per applicable Indian tax laws.</li>
                    <li>Payouts may be withheld if any fraud or misrepresentation is detected.</li>
                  </ul>
                </div>

                {/* GENERAL TERMS */}
                <div className="p-5 space-y-2">
                  <h4 className="font-bold text-red-600 uppercase tracking-wide">
                    GENERAL TERMS
                  </h4>
                  <ul className="space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>RentalMeet reserves the right to modify the payout structure at any time with prior notice.</li>
                    <li>All decisions regarding payouts and bonuses are final and binding.</li>
                    <li>The Ambassador Program is subject to RentalMeet&apos;s overall Terms of Service.</li>
                    <li>Any disputes will be subject to the jurisdiction of Bhopal, Madhya Pradesh.</li>
                    <li>These Terms &amp; Conditions are effective from the date of enrollment.</li>
                  </ul>
                </div>

              </div>

              {/* Right Box (Top-Right & Bottom-Right) */}
              <div className="divide-y divide-black dark:divide-slate-700">
                
                {/* ROYALTY CONDITIONS */}
                <div className="p-5 space-y-3">
                  <h4 className="font-bold text-red-600 uppercase tracking-wide">
                    ROYALTY CONDITIONS
                  </h4>
                  <ul className="space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>Royalty applies only to venues listed by the Ambassador.</li>
                    <li>Royalty is calculated on the <strong>Platform Fee</strong>, not the total booking amount.</li>
                    <li>Royalty is paid monthly after booking completion and payment realization.</li>
                    <li>If a venue is removed from RentalMeet, royalty on that venue ceases.</li>
                    <li>Royalty is non-transferable and non-inheritable.</li>
                    <li>Royalty is not applicable on cancelled, refunded, or disputed bookings.</li>
                  </ul>

                  <p className="font-bold text-slate-900 dark:text-white pt-1">
                    To be eligible for 25% Royalty Income , the Ambassador must:
                  </p>
                  <ul className="space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>Complete either the <strong>7-Day Streak OR the 30-Day Streak</strong> challenge.</li>
                    <li>7-Day Streak: 5 venues daily OR 35 venues per week.</li>
                    <li>30-Day Streak: 150 venues in 1 month.</li>
                    <li>If neither streak is completed, the Ambassador will <strong>NOT</strong> be eligible for 25% royalty income.</li>
                    <li>Royalty eligibility is calculated monthly based on streak completion.</li>
                    <li>Once eligible, royalty applies to all venues listed during that streak period.</li>
                    <li>Royalty remains valid for <strong>12 months</strong> from the date of venue verification.</li>
                    <li>After 12 months: No royalty will be paid on bookings for that venue.</li>
                    <li>Royalty is not applicable on cancelled, refunded, or disputed bookings.</li>
                  </ul>
                </div>

                {/* DISQUALIFICATION & FORFEITURE */}
                <div className="p-5 space-y-3">
                  <h4 className="font-bold text-red-600 uppercase tracking-wide">
                    DISQUALIFICATION &amp; FORFEITURE
                  </h4>
                  <p className="text-slate-800 dark:text-slate-300">
                    RentalMeet reserves the right to <strong>disqualify an Ambassador and forfeit payouts</strong> if:
                  </p>
                  <ul className="space-y-1 text-slate-800 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>False or misleading venue information is provided.</li>
                    <li>Venues are listed without owner consent.</li>
                    <li>The Ambassador engages in fraudulent activity.</li>
                    <li>Multiple accounts are created by the same person.</li>
                    <li>The Ambassador violates RentalMeet&apos;s Code of Conduct.</li>
                    <li>Venues are found to be non-existent or duplicate.</li>
                    <li><strong>Inactive Ambassador:</strong> If an Ambassador does not list even 1 venue within 30 days, their Ambassador ID will be blocked/deactivated.</li>
                    <li><strong>Reactivation Fee:</strong> To reactivate a blocked/deactivated Ambassador ID, a fee of Rs.500/- must be paid.</li>
                    <li><strong>Repeated Inactivity:</strong> If the Ambassador remains inactive again for 30 days after reactivation, the ID will be permanently deactivated without refund.</li>
                    <li><strong>No Payouts on Blocked ID:</strong> Any pending payouts will be held until the ID is reactivated.</li>
                  </ul>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 9. Frequently Asked Questions (FAQs) - Collapsible Accordions */}
      <section className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <span className="bg-yellow-300 text-black font-bold px-3 py-1.5 text-sm inline-block rounded-sm">
              Frequently Asked Questions (FAQs)
            </span>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/60 dark:bg-slate-800/60 transition-all hover:border-slate-400 dark:hover:border-slate-500"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-4.5 flex justify-between items-center gap-4 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-primary-600' : ''
                      }`}
                    />
                  </button>
                  
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60 whitespace-pre-line bg-white dark:bg-slate-900/40">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 10. CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-primary-600 via-orange-600 to-amber-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Ready to Build Your Venue Acquisition Income?
          </h2>
          <p className="text-base text-white/90 font-light max-w-2xl mx-auto mb-8">
            &quot;Find Venues. Create Income. Build India&apos;s Largest Venue Network.&quot;
            <br />
            Free registration with instant payout setup.
          </p>
          <Link
            href="/register-ambassador"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-base shadow-2xl hover:bg-slate-100 transition-all transform hover:-translate-y-1"
          >
            Register Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
