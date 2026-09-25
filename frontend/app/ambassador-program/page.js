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
  ChevronDown,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CreditCard,
  Building2,
  FileCheck,
  TrendingUp,
  Coins
} from 'lucide-react';

export default function AmbassadorProgramPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const tiers = [
    {
      level: 'Level-1',
      title: 'Venue Ambassador',
      eligibility: '0–50 Verified Venues',
      reward: '₹100',
      suffix: '/- Per Venue',
      badge: 'Bronze Explorer',
      gradient: 'from-amber-500 to-amber-700',
      badgeBg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      bgCard: 'bg-gradient-to-b from-amber-50/40 to-white dark:from-slate-800 dark:to-slate-850',
      tag: 'Starting Level',
      perks: ['+ Bonus per venue', '+ Weekly/Monthly Incentive', '+ 25% of Royalty Income*']
    },
    {
      level: 'Level-2',
      title: 'Venue Explorer',
      eligibility: '51–100 Verified Venues',
      reward: '₹125',
      suffix: '/- Per Venue',
      badge: 'Silver Champion',
      gradient: 'from-slate-600 to-slate-800',
      badgeBg: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-200',
      border: 'border-slate-300 dark:border-slate-700',
      bgCard: 'bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-850',
      tag: '+25% Higher Payout',
      perks: ['+ Bonus per venue', '+ Weekly/Monthly Incentive', '+ 25% of Royalty Income*']
    },
    {
      level: 'Level-3',
      title: 'Venue Champion',
      eligibility: '101–150 Verified Venues',
      reward: '₹150',
      suffix: '/- Per Venue',
      badge: 'Gold Master',
      gradient: 'from-yellow-500 to-amber-600',
      badgeBg: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/80 dark:text-yellow-300',
      border: 'border-yellow-300 dark:border-yellow-700/60',
      bgCard: 'bg-gradient-to-b from-yellow-50/40 to-white dark:from-slate-800 dark:to-slate-850',
      tag: '+50% Higher Payout',
      perks: ['+ Bonus per venue', '+ Weekly/Monthly Incentive', '+ 25% of Royalty Income*']
    },
    {
      level: 'Level-4',
      title: 'Venue Master',
      eligibility: '150+ Verified Venues',
      reward: '₹200',
      suffix: '/- Per Venue',
      badge: 'City Legend',
      gradient: 'from-primary-500 to-orange-600',
      badgeBg: 'bg-primary-100 text-primary-900 dark:bg-primary-950/80 dark:text-primary-300',
      border: 'border-primary-300 dark:border-primary-700',
      bgCard: 'bg-gradient-to-b from-orange-50/50 to-white dark:from-slate-800 dark:to-slate-850',
      tag: '+100% Higher Payout',
      perks: ['+ Bonus per venue', '+ Weekly/Monthly Incentive', '+ 25% of Royalty Income*']
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
      icon: Flame,
      color: 'text-amber-500',
      accentBg: 'bg-amber-500/10 border-amber-500/20'
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
      color: 'text-blue-500',
      accentBg: 'bg-blue-500/10 border-blue-500/20'
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
      color: 'text-purple-500',
      accentBg: 'bg-purple-500/10 border-purple-500/20'
    }
  ];

  const payoutSchedule = [
    { type: 'Per-Venue Payout', freq: 'Weekly', time: 'Every Monday', icon: Coins },
    { type: 'Daily Streak Bonus', freq: 'Weekly', time: 'Every Monday', icon: Flame },
    { type: 'Weekly Streak Bonus', freq: 'Weekly', time: 'Every Monday', icon: Target },
    { type: 'Monthly Champion Award', freq: 'Monthly', time: '1st of following month', icon: Trophy },
    { type: 'Royalty Income', freq: 'Monthly', time: '7th of following month', icon: TrendingUp }
  ];

  const awards = [
    {
      rank: '1ST POSITION',
      title: 'RentalMeet Star Performer',
      reward: 'Rs. 25,000',
      color: 'from-amber-400 to-yellow-600',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
      medal: '🥇'
    },
    {
      rank: '2ND POSITION',
      title: 'RentalMeet Silver Performer',
      reward: 'Rs. 15,000',
      color: 'from-slate-300 to-slate-500',
      bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
      medal: '🥈'
    },
    {
      rank: '3RD POSITION',
      title: 'RentalMeet Bronze Performer',
      reward: 'Rs. 10,000',
      color: 'from-amber-700 to-amber-900',
      bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      medal: '🥉'
    }
  ];

  const steps = [
    { num: '01', title: 'Apply as Ambassador', desc: 'Fill the simple online application form with basic KYC and bank details.', icon: FileCheck },
    { num: '02', title: 'Search Nearby Venues', desc: 'Discover Meeting Venues, Auditoriums, Hotels, Banquet halls, Marriage Lawns, and other Venues.', icon: Building2 },
    { num: '03', title: 'Collect & Upload Info', desc: 'Use our 7-step venue listing wizard to submit photos, amenities, pricing & owner contact.', icon: CreditCard },
    { num: '04', title: 'Admin Verification', desc: 'Our team verifies the venue and documents within 24 hours.', icon: ShieldCheck },
    { num: '05', title: '7-Days Streak & 25% Share', desc: 'Complete a 7-day power streak to unlock Rs. 1,000 cash bonus + 25% recurring profit share on all bookings for 1 Full Year (365 Days)!', icon: Zap },
    { num: '06', title: '30-Days Streak & 25% Share', desc: 'Complete a 30-day power streak to unlock Rs. 5,000 cash bonus + 25% recurring profit share on all bookings for 1 Full Year (365 Days)!', icon: Trophy }
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased selection:bg-primary-500 selection:text-white">
      <Navbar />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-15 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Glow blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/15 dark:bg-primary-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Top Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                &quot;Join RentalMeet&apos;s Venue Ambassador Program and start earning today.&quot;
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black tracking-tight leading-[1.15]">
                Join India&apos;s Fastest Growing Venue Network as a <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-primary-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  &quot;Venue Ambassador&quot;
                </span>
              </h1>

              {/* Sub-headline */}
              <div className="space-y-1">
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 font-semibold italic">
                  &quot;No investment. No experience needed. Just find venues and start earning.&quot;
                </p>
                <p className="text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                  &quot;AnyTime..Any Where&quot;
                </p>
              </div>

              {/* Value Proposition Box */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/90 dark:bg-slate-850/90 backdrop-blur-md border border-amber-300/60 dark:border-amber-700/40 shadow-xl text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                Earn <span className="font-black text-primary-600 dark:text-primary-400 text-lg">₹100 to ₹200 per Verified Venue</span> + Daily Bonus + Weekly/Monthly Incentive.
                <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-slate-700">
                  <span className="text-amber-700 dark:text-amber-300 font-bold">
                    Additional - 25% Recurring Profit Share &quot;Royalty Income&quot; on bookings for 12 months.
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    (Requires 7-Days or 30-Days Streak for unlock)
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/register-ambassador"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-500 hover:to-orange-500 text-white rounded-xl font-black text-base shadow-xl shadow-primary-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                >
                  Register Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login?role=ambassador"
                  className="w-full sm:w-auto px-8 py-4 border-2 border-slate-300 dark:border-slate-700 hover:border-primary-500 rounded-xl font-bold text-base text-slate-800 dark:text-slate-200 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm"
                >
                  Ambassador Login
                </Link>
              </div>

            </div>

            {/* Right Column: Hero Image from Word Document */}
            <div className="lg:col-span-5 flex justify-center items-center relative">
              <div className="relative w-full max-w-[420px] lg:max-w-none">
                {/* Decorative background glow circle */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-primary-500/30 rounded-3xl filter blur-2xl -z-10 transform scale-95" />
                
                {/* Ambassador image from Word doc */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 group">
                  <img
                    src="/ambassador-assets/image1.png"
                    alt="RentalMeet Venue Ambassador Program - Daily Earning ₹2,500"
                    className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. 4-TIER INCOME STRUCTURE */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 border border-amber-300/40">
              <Award className="w-3.5 h-3.5 text-amber-600" /> TIERED GROWTH LADDER
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Venue Listing Income Structure</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
              As you list more verified venues, your earning rate automatically increases from Rs.100 to Rs.200 per venue!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${tier.border} ${tier.bgCard} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${tier.badgeBg} shadow-sm`}>
                      {tier.level}
                    </span>
                    <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400">{tier.tag}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tier.title}</h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">({tier.eligibility})</p>

                  <div className="my-5 p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 text-center shadow-inner">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Payout Rate</p>
                    <div className="flex items-baseline justify-center gap-1 mt-0.5">
                      <span className="text-3xl font-black text-primary-600 dark:text-primary-400">{tier.reward}</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{tier.suffix}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium pb-4">
                    {tier.perks.map((p, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <BadgeCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span>Badge: {tier.badge}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PERFORMANCE STREAKS & CHALLENGES */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-3 border border-blue-300/40">
              <Zap className="w-3.5 h-3.5 text-blue-600" /> HIGH PERFORMANCE STREAKS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Daily, Weekly &amp; Monthly Challenges</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
              Accelerate your earnings with bonus payouts for consistent venue acquisition streaks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {challenges.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-850 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${c.accentBg} ${c.color} border`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                        {c.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{c.title}</h3>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-1">{c.target}</p>

                    <div className="mt-4 p-3.5 rounded-xl bg-white dark:bg-slate-900/70 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Sample Payout Calculation:</p>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400">{c.example}</p>
                    </div>

                    {c.note && (
                      <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
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
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Potential</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{c.total}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. 25% ROYALTY INCOME UNLOCK & RECURRING CALCULATOR */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
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

          {/* 2 Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: 7-Day Power Streak */}
            <div className="bg-slate-900/90 border-2 border-amber-500/40 p-7 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span><strong>25% Royalty Profit Share:</strong> Unlocked on all listed venues for 1 Full Year (365 Days).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Total Weekly Potential:</strong> Up to ₹6,250 / week earnings.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Unlock Duration:</span>
                <span className="font-bold text-amber-300">12 Months (365 Days)</span>
              </div>
            </div>

            {/* Card 2: 30-Day Monthly Champion */}
            <div className="bg-slate-900/90 border-2 border-purple-500/40 p-7 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span><strong>25% Royalty Profit Share:</strong> Unlocked on all listed venues for 1 Full Year (365 Days).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Total Monthly Potential:</strong> Up to ₹36,250 / month earnings.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Unlock Duration:</span>
                <span className="font-bold text-purple-300">12 Months (365 Days)</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PAYOUT SCHEDULE */}
      {/* ========================================================================= */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider mb-2 border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-primary-600" /> AUTOMATED DISBURSEMENTS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              PAYOUT SCHEDULE
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Transparent &amp; timely automated processing schedule for all earnings
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-850">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">Payout Type</th>
                  <th className="p-4">Frequency</th>
                  <th className="p-4">Processing Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payoutSchedule.map((p, i) => {
                  const RowIcon = p.icon;
                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <RowIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span>{p.type}</span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {p.freq}
                        </span>
                      </td>
                      <td className="p-4 text-primary-600 dark:text-primary-400 font-bold font-mono">{p.time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. RECOGNITION & CASH PRIZES - Monthly Star Performer Awards */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-300/40">
              <Trophy className="w-3.5 h-3.5 text-amber-600" /> RECOGNITION &amp; CASH PRIZES
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Monthly Star Performer Awards
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Every month, top-performing Venue Ambassadors across India win massive cash awards and leadership honors.
            </p>
          </div>

          {/* 3 Positions Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {awards.map((a, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <span className="text-4xl block mb-2">{a.medal}</span>
                <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${a.bg} inline-block mb-2 border`}>
                  {a.rank}
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{a.title}</h4>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-3 font-mono">{a.reward}</p>
              </div>
            ))}
          </div>

          {/* Terms & Conditions Box Under Star Performer */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="py-3 px-6 border-b border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800 text-center font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Terms &amp; Conditions
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700 text-xs">
              
              {/* Left Column */}
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {/* 1. ELIGIBILITY CRITERIA */}
                <div className="p-5 space-y-2">
                  <h4 className="font-black text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                    ELIGIBILITY CRITERIA
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>Ambassador must have <strong>150+ Verified Venues</strong> in a single calendar month to be eligible for any award.</li>
                    <li>Only verified and approved venues will be counted towards the 150+ venue target.</li>
                    <li>Venues must be new listings and not previously registered on RentalMeet.</li>
                  </ul>
                </div>

                {/* 2. SELECTION PROCESS */}
                <div className="p-5 space-y-2">
                  <h4 className="font-black text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                    SELECTION PROCESS
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>Winners will be selected based on the highest number of verified venues in a month.</li>
                    <li>In case of a tie, the Ambassador with the higher conversion rate (bookings generated) will be ranked higher.</li>
                  </ul>
                </div>
              </div>

              {/* Right Column */}
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {/* 3. AWARD DISTRIBUTION */}
                <div className="p-5 space-y-2">
                  <h4 className="font-black text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                    AWARD DISTRIBUTION
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>Cash prizes will be credited to the winner&apos;s registered bank account within 15 working days after the month ends.</li>
                    <li>Winners will be announced on the 1st week of the following month.</li>
                    <li>TDS will be deducted as per applicable Indian tax laws.</li>
                  </ul>
                </div>

                {/* 4. GENERAL CONDITIONS */}
                <div className="p-5 space-y-2">
                  <h4 className="font-black text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                    GENERAL CONDITIONS
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>RentalMeet reserves the right to verify all claims before awarding prizes.</li>
                    <li>Any fraudulent activity will lead to disqualification and forfeiture of the award.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. HOW IT WORKS (6 STEPS) */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider mb-2 border border-slate-200 dark:border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-primary-600" /> EASY ONBOARDING
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Start earning in 6 easy steps with zero complicated paperwork.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {steps.map((s, idx) => {
              const StepIcon = s.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-black text-primary-600 dark:text-primary-400 font-mono">{s.num}</span>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700">
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
                      {s.title}
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. *TERMS & CONDITION (2x2 STRUCTURED GRID) */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              *Terms &amp; Condition
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Official guidelines, streak standards, payouts &amp; compliance policy</p>
          </div>

          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700 text-xs">
              
              {/* Left Column */}
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                
                {/* STREAK CONDITIONS */}
                <div className="p-6 space-y-3">
                  <h4 className="font-black text-primary-600 dark:text-primary-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" /> STREAK CONDITIONS
                  </h4>
                  
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">Daily Streak Conditions</p>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                      <li>The 5 venues must be verified on the same calendar day.</li>
                      <li>All venues must meet RentalMeet&apos;s verification standards.</li>
                      <li>Venues must be new (not previously listed on RentalMeet).</li>
                      <li>Payouts are processed weekly after verification.</li>
                    </ul>
                  </div>

                  <div className="space-y-1 pt-1">
                    <p className="font-bold text-slate-900 dark:text-white">Weekly Streak Conditions</p>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                      <li>Ambassador must maintain consistent daily activity (minimum 5 venues/day).</li>
                      <li>If a day is missed, the weekly streak bonus may be reduced or forfeited.</li>
                      <li>Weekly payouts are processed every Monday for the previous week.</li>
                    </ul>
                  </div>

                  <div className="space-y-1 pt-1">
                    <p className="font-bold text-slate-900 dark:text-white">Monthly Champion Conditions</p>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                      <li>The 150 venues must be verified within a single calendar month.</li>
                      <li>All venues must meet verification standards.</li>
                      <li>Monthly awards are announced on the 1st of the following month.</li>
                    </ul>
                  </div>
                </div>

                {/* TERMS OF PAYOUT */}
                <div className="p-6 space-y-2">
                  <h4 className="font-black text-primary-600 dark:text-primary-400 uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-500" /> TERMS OF PAYOUT
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>All payouts are subject to verification and approval by RentalMeet.</li>
                    <li>Payouts are made via UPI/bank transfer only.</li>
                    <li>Ambassadors must submit correct UPI ID or Bank Account details.</li>
                    <li>RentalMeet is not responsible for payments lost due to incorrect bank details.</li>
                    <li>TDS (Tax Deducted at Source) will be deducted as per applicable Indian tax laws.</li>
                    <li>Payouts may be withheld if any fraud or misrepresentation is detected.</li>
                  </ul>
                </div>

                {/* GENERAL TERMS */}
                <div className="p-6 space-y-2">
                  <h4 className="font-black text-primary-600 dark:text-primary-400 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> GENERAL TERMS
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>RentalMeet reserves the right to modify the payout structure at any time with prior notice.</li>
                    <li>All decisions regarding payouts and bonuses are final and binding.</li>
                    <li>The Ambassador Program is subject to RentalMeet&apos;s overall Terms of Service.</li>
                    <li>Any disputes will be subject to the jurisdiction of Bhopal, Madhya Pradesh.</li>
                    <li>These Terms &amp; Conditions are effective from the date of enrollment.</li>
                  </ul>
                </div>

              </div>

              {/* Right Column */}
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                
                {/* ROYALTY CONDITIONS */}
                <div className="p-6 space-y-3">
                  <h4 className="font-black text-primary-600 dark:text-primary-400 uppercase tracking-wide flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> ROYALTY CONDITIONS
                  </h4>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>Royalty applies only to venues listed by the Ambassador.</li>
                    <li>Royalty is calculated on the <strong>Platform Fee</strong>, not the total booking amount.</li>
                    <li>Royalty is paid monthly after booking completion and payment realization.</li>
                    <li>If a venue is removed from RentalMeet, royalty on that venue ceases.</li>
                    <li>Royalty is non-transferable and non-inheritable.</li>
                    <li>Royalty is not applicable on cancelled, refunded, or disputed bookings.</li>
                  </ul>

                  <p className="font-bold text-slate-900 dark:text-white pt-1">
                    To be eligible for 25% Royalty Income, the Ambassador must:
                  </p>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
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
                <div className="p-6 space-y-3">
                  <h4 className="font-black text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> DISQUALIFICATION &amp; FORFEITURE
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    RentalMeet reserves the right to <strong>disqualify an Ambassador and forfeit payouts</strong> if:
                  </p>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-outside ml-4">
                    <li>False or misleading venue information is provided.</li>
                    <li>Venues are listed without owner consent.</li>
                    <li>The Ambassador engages in fraudulent activity.</li>
                    <li>Multiple accounts are created by the same person.</li>
                    <li>The Ambassador violates RentalMeet&apos;s Code of Conduct.</li>
                    <li>Venues are found to be non-existent or duplicate.</li>
                  </ul>

                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                    <p>• <strong>Inactive Ambassador:</strong> If an Ambassador does not list even 1 venue within 30 days, their Ambassador ID will be blocked/deactivated.</p>
                    <p>• <strong>Reactivation Fee:</strong> To reactivate a blocked/deactivated Ambassador ID, a fee of <strong>Rs.500/-</strong> must be paid.</p>
                    <p>• <strong>Repeated Inactivity:</strong> If the Ambassador remains inactive again for 30 days after reactivation, the ID will be permanently deactivated without refund.</p>
                    <p>• <strong>No Payouts on Blocked ID:</strong> Any pending payouts will be held until the ID is reactivated.</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQS) - ACCORDION */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-950/60 text-yellow-900 dark:text-yellow-200 text-xs font-bold uppercase tracking-wider mb-3 border border-yellow-300 dark:border-yellow-700">
              <Sparkles className="w-3.5 h-3.5 text-yellow-600" /> GOT QUESTIONS?
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions (FAQs)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Everything you need to know about rewards, streaks, royalties &amp; payouts
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-primary-400 dark:border-primary-600 bg-primary-50/20 dark:bg-slate-800 shadow-md'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex justify-between items-center gap-4 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-primary-600 dark:text-primary-400' : ''
                      }`}
                    />
                  </button>
                  
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60 whitespace-pre-line">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. CTA BANNER */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-orange-600 to-amber-600 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Build Your Venue Acquisition Income?
          </h2>
          <p className="text-base sm:text-lg text-white/90 font-medium max-w-2xl mx-auto leading-relaxed">
            &quot;Find Venues. Create Income. Build India&apos;s Largest Venue Network.&quot;
            <br />
            <span className="text-sm font-normal text-white/80">Free registration with automated weekly and monthly payouts.</span>
          </p>
          <div className="pt-2">
            <Link
              href="/register-ambassador"
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-base shadow-2xl hover:bg-slate-100 transition-all transform hover:-translate-y-1 active:scale-95"
            >
              Register Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
