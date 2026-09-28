'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
  Coins,
  Shield,
  HelpCircle,
  Users,
  Compass,
  Crown,
  Search,
  Upload,
  Check,
  Percent,
  DollarSign,
  Send,
  Lock,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  LogIn
} from 'lucide-react';

// ── Tier Ladder Data ──────────────────────────────────────────────────────────
const TIERS = [
  {
    level: 'Level 1',
    title: 'Venue Ambassador',
    range: '0–50 verified venues',
    payout: '₹100',
    note: 'per verified venue',
    color: '#b7791f',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    icon: Compass
  },
  {
    level: 'Level 2',
    title: 'Venue Explorer',
    range: '51–100 verified venues',
    payout: '₹125',
    note: '25% higher payout',
    color: '#c05621',
    bgLight: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800/60',
    icon: Zap
  },
  {
    level: 'Level 3',
    title: 'Venue Champion',
    range: '101–150 verified venues',
    payout: '₹150',
    note: '50% higher payout',
    color: '#b83280',
    bgLight: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-200 dark:border-pink-800/60',
    icon: Trophy
  },
  {
    level: 'Level 4',
    title: 'Venue Master',
    range: '150+ verified venues',
    payout: '₹200',
    note: '100% higher payout',
    color: '#805ad5',
    bgLight: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800/60',
    icon: Crown
  }
];

// ── Streaks & Challenges ──────────────────────────────────────────────────────
const STREAKS = [
  {
    label: 'Daily streak',
    title: 'Daily 5-Venue Challenge',
    target: 'List at least 5 verified venues in one day.',
    calculation: [
      '5 × ₹100 = ₹500',
      '5 × ₹50 bonus = ₹250',
      'Total potential = ₹750 / day'
    ],
    reward: '₹50 bonus for every venue listed after the first 5 that day.',
    icon: Flame,
    color: 'bg-amber-500 text-amber-500',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
  },
  {
    label: 'Weekly streak',
    title: '7-Day Power Streak',
    target: 'List 5 venues daily, or 35 verified venues in one week.',
    calculation: [
      '35 × ₹100 = ₹3,500',
      '35 × ₹50 bonus = ₹1,750',
      'Fixed incentive = ₹1,000',
      'Total potential = ₹6,250 / week'
    ],
    reward: 'Unlocks 25% recurring royalty income for 12 months.',
    icon: Zap,
    color: 'bg-orange-600 text-orange-600',
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
  },
  {
    label: 'Monthly champion',
    title: '30-Day Venue Champion',
    target: 'List 150 verified venues in one calendar month.',
    calculation: [
      'Level payouts = ₹18,750',
      '150 × ₹50 bonus = ₹7,500',
      'Fixed incentive = ₹5,000',
      'Total potential = ₹36,250 / month'
    ],
    reward: 'Unlocks 25% recurring royalty income for 12 months.',
    icon: Trophy,
    color: 'bg-purple-600 text-purple-600',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
  }
];

// ── How it works steps ────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    number: '01',
    title: 'Apply as Ambassador',
    description: 'Complete our simple online registration with your basic profile, KYC, and payout details.',
    icon: FileCheck
  },
  {
    number: '02',
    title: 'Search Nearby Venues',
    description: 'Find meeting rooms, hotels, auditoriums, banquet halls, marriage lawns, and more.',
    icon: Search
  },
  {
    number: '03',
    title: 'Collect & Upload Info',
    description: 'Use the 7-step venue listing wizard to submit photos, amenities, pricing, and owner contact.',
    icon: Upload
  },
  {
    number: '04',
    title: 'Admin Verification',
    description: 'Our verification team reviews the venue and documents within 24 hours.',
    icon: ShieldCheck
  },
  {
    number: '05',
    title: 'Complete a 7-Day Streak',
    description: 'Earn a ₹1,000 cash bonus and unlock 25% recurring profit share for one full year (365 days).',
    icon: Flame
  },
  {
    number: '06',
    title: 'Complete a 30-Day Streak',
    description: 'Earn a ₹5,000 cash bonus and unlock 25% recurring profit share for one full year (365 days).',
    icon: Crown
  }
];

// ── FAQ Items ─────────────────────────────────────────────────────────────────
const FAQS = [
  {
    question: 'What is the RentalMeet Venue Ambassador Program?',
    answer: 'It is a program where you earn money by finding and listing venues such as hotels, banquet halls, meeting rooms, and auditoriums on RentalMeet. You earn per verified venue, unlock streak bonuses, and can earn a share of the platform profit on bookings.'
  },
  {
    question: 'How much can I earn per verified venue?',
    answer: 'You can earn ₹100 to ₹200 per verified venue depending on your level tier. You can also receive a ₹50 bonus for every venue listed after the first five venues in a single day.'
  },
  {
    question: 'What is the 25% royalty income and how do I unlock it?',
    answer: "It is a 25% share of RentalMeet's platform fee earned from bookings at venues you listed. Complete either the 7-Day Streak or the 30-Day Streak to unlock it. The royalty is valid for 12 months from venue verification."
  },
  {
    question: 'What is the difference between the 7-Day Streak and the 30-Day Streak?',
    answer: 'The 7-Day Streak requires 5 venues daily or 35 venues in a week and unlocks a ₹1,000 cash bonus plus 25% royalty. The 30-Day Streak requires 150 venues in one month and unlocks a ₹5,000 cash bonus plus 25% royalty.'
  },
  {
    question: 'How long does the 25% royalty income last?',
    answer: 'Royalty income is valid for 12 months (one year / 365 days) from the date the venue is verified. After 12 months, royalty is no longer paid on bookings for that venue.'
  },
  {
    question: 'What happens if I do not list any venue for 30 days?',
    answer: 'Your Ambassador ID will be automatically blocked or deactivated if you do not list even one venue within 30 days of approval. Reactivation requires a ₹500 fee. Repeated inactivity after reactivation may result in permanent deactivation without refund.'
  },
  {
    question: 'When and how will I receive my payments?',
    answer: 'Per-venue payouts and streak bonuses are processed weekly every Monday. Monthly Champion Awards are processed on the 1st of the following month, and royalty income is processed on the 7th of the following month. Payments are made through UPI or bank transfer only.'
  },
  {
    question: 'Do I need to pay any fee to join?',
    answer: 'No. There is no joining fee and the program is 100% free to join. A ₹500 fee applies only if your ID is deactivated due to 30-day inactivity and you choose to reactivate it.'
  },
  {
    question: 'How are the Monthly Star Performer Awards decided?',
    answer: 'To be eligible, you must have 150 or more verified venues in a single calendar month. Winners are selected by the highest number of verified venues. In case of a tie, booking conversion rate and then verification time are used.'
  },
  {
    question: 'What are the cash prizes for the Monthly Star Performer Awards?',
    answer: 'The 1st position receives ₹25,000, the 2nd position receives ₹15,000, and the 3rd position receives ₹10,000. Prizes are subject to verification and applicable TDS.'
  },
  {
    question: 'Can I list any venue?',
    answer: 'You can list meeting venues, auditoriums, hotels, banquet halls, marriage lawns, and other supported venue types. The venue must be new to RentalMeet and meet the platform\'s verification standards.'
  },
  {
    question: 'What documents do I need to submit for a venue?',
    answer: 'You need to submit complete venue details, photos, amenities, pricing details, and owner contact information through RentalMeet\'s simple venue listing process.'
  },
  {
    question: 'How long does it take for a venue to get verified?',
    answer: 'RentalMeet\'s team verifies the venue details and documents within 24 hours after submission, subject to receiving complete and accurate information.'
  },
  {
    question: 'Is there any penalty for providing false information?',
    answer: 'Yes. False or misleading information, listing venues without owner consent, or fraudulent activity can lead to disqualification and forfeiture of pending payouts.'
  },
  {
    question: 'Can I transfer my Ambassador ID or royalty income?',
    answer: 'No. The Ambassador ID and royalty income are non-transferable and non-inheritable.'
  },
  {
    question: 'What happens to my royalty if a venue is removed?',
    answer: 'If a venue is removed from RentalMeet, royalty on that specific venue ceases immediately.'
  },
  {
    question: 'Do I get royalty on cancelled or refunded bookings?',
    answer: 'No. Royalty is not applicable on cancelled, refunded, or disputed bookings. Royalty is paid only after booking completion and payment realization.'
  },
  {
    question: 'Which court has jurisdiction for disputes?',
    answer: 'Any disputes are subject to the jurisdiction of the courts of Bhopal, Madhya Pradesh, India.'
  }
];

// ── Terms Categories ──────────────────────────────────────────────────────────
const PROGRAM_TERMS = [
  {
    title: 'Streak conditions',
    icon: Flame,
    items: [
      'The five venues must be verified on the same calendar day for the Daily Streak.',
      "All venues must meet RentalMeet's verification standards and be new listings.",
      'Weekly streaks require consistent daily activity of at least 5 venues per day; a missed day may reduce or forfeit the bonus.',
      'Weekly payouts are processed every Monday for the previous week.',
      'The 150 venues for the Monthly Champion challenge must be verified within a single calendar month.',
      'Monthly awards are announced on the 1st of the following month.'
    ]
  },
  {
    title: 'Royalty conditions',
    icon: Percent,
    items: [
      'Royalty applies only to venues listed by the Ambassador and is calculated on the platform fee, not the total booking amount.',
      'Complete either the 7-Day Streak (5 venues daily or 35 weekly) or the 30-Day Streak (150 venues in one month) to qualify.',
      'If neither streak is completed, the Ambassador is not eligible for 25% royalty income.',
      'Royalty eligibility is calculated monthly based on streak completion.',
      'Once eligible, royalty applies to all eligible venues listed during that streak period for 12 months from verification.',
      'Royalty is non-transferable, non-inheritable, and does not apply to cancelled, refunded, or disputed bookings.',
      'After 12 months, no royalty is paid on bookings for that venue.'
    ]
  },
  {
    title: 'Terms of payout',
    icon: CreditCard,
    items: [
      'All payouts are subject to verification and approval by RentalMeet and are paid by UPI or bank transfer only.',
      'Ambassadors must submit correct UPI ID or bank account details. RentalMeet is not responsible for payments lost due to incorrect details.',
      'TDS will be deducted according to applicable Indian tax laws.',
      'Payouts may be withheld if any fraud or misrepresentation is detected.'
    ]
  },
  {
    title: 'General terms',
    icon: ShieldCheck,
    items: [
      'RentalMeet may modify the payout structure with prior notice. Payout decisions are final and binding.',
      "The Ambassador Program is subject to RentalMeet's overall Terms of Service.",
      'These terms are effective from the date of enrollment.',
      'Disputes are subject to the jurisdiction of Bhopal, Madhya Pradesh.'
    ]
  },
  {
    title: 'Disqualification & forfeiture',
    icon: AlertTriangle,
    items: [
      'RentalMeet may disqualify an Ambassador and forfeit payouts for false or misleading venue information.',
      'Venues must not be listed without owner consent and must not be non-existent or duplicates.',
      "Creating multiple accounts or violating RentalMeet's Code of Conduct may lead to disqualification.",
      'No pending payouts are released while an Ambassador ID is blocked; they remain held until reactivation.',
      'Repeated inactivity for 30 days after reactivation may permanently deactivate the ID without refund.'
    ]
  },
  {
    title: 'Award conditions',
    icon: Trophy,
    items: [
      'Only verified and approved new listings count toward the 150+ venue award target.',
      "Cash prizes are credited to the winner's registered bank account within 15 working days after the month ends.",
      'Winners are announced in the first week of the following month and TDS is deducted as applicable.',
      "Awards are non-transferable and non-negotiable. RentalMeet's award decision is final and binding."
    ]
  }
];

export default function VenueAmbassadorPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── 1. Hero Section ────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24">
          {/* Background image & deep gradients */}
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1511578314322-379afb476865?w=2000&q=85')"
            }}
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(24,18,10,0.95),rgba(44,28,8,0.82),rgba(12,12,12,0.65))]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.28),transparent_42%)]" />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
            {/* Left Hero Content */}
            <div className="max-w-3xl text-white">
              <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-amber-300/40 bg-amber-400/15 text-amber-200 backdrop-blur-md text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>RentalMeet Business Opportunity</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-serif leading-tight">
                Become a Venue <span className="text-amber-300">Ambassador</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base sm:text-lg lg:text-xl text-white/85 leading-relaxed font-light">
                Join India&apos;s fastest-growing venue network and start earning today from every verified venue you discover.
              </p>

              {/* Badges checklist */}
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/90">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-300" /> No investment
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-300" /> No experience needed
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-300" /> Work anytime, anywhere
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register-ambassador"
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-amber-400 text-amber-950 font-bold hover:bg-amber-300 shadow-lg shadow-amber-500/25 transition-all text-sm sm:text-base"
                >
                  <span>Register Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl border border-white/30 bg-white/10 text-white font-semibold backdrop-blur-sm hover:bg-white/20 transition-all text-sm sm:text-base"
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right Hero Earning Card (Glassmorphic) */}
            <div className="rounded-2xl border border-white/20 bg-black/40 text-white shadow-2xl backdrop-blur-md p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">Your earning potential</p>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                    ₹100–₹200 <span className="text-xs font-normal text-white/70">/ verified venue</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['₹50', 'daily bonus after 5 venues'],
                  ['₹1,000', '7-day streak incentive'],
                  ['₹5,000', '30-day streak incentive'],
                  ['25%', 'royalty for 12 months']
                ].map(([val, desc], idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-xs">
                    <p className="text-xl font-bold text-amber-300 font-mono">{val}</p>
                    <p className="mt-1 text-xs leading-snug text-white/75 font-medium">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/75">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Official RentalMeet Program
                </span>
                <Link href="/register-ambassador" className="text-amber-300 font-bold hover:underline inline-flex items-center gap-1">
                  Full KYC Registration <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Metric Highlights Bar ───────────────────────────────────── */}
        <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 px-4 py-6 sm:grid-cols-4 sm:px-6 lg:px-8">
            {[
              ['₹200', 'top per-venue payout'],
              ['₹750', 'daily earning potential'],
              ['₹36,250', 'monthly champion potential'],
              ['365 days', 'royalty earning window']
            ].map(([val, label], idx) => (
              <div key={idx} className="px-3 text-center first:pl-0 last:pr-0 sm:px-6">
                <p className="font-serif text-2xl font-bold text-primary-600 dark:text-primary-400 sm:text-3xl font-mono">
                  {val}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Tiered Growth Ladder ────────────────────────────────────── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="inline-block px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                Tiered growth ladder
              </span>
              <h2 className="font-serif text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white">
                Your payout grows as you grow
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                List more verified venues and automatically move up to a higher earning rate.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {TIERS.map((tier, idx) => {
                const Icon = tier.icon;
                return (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col justify-between"
                  >
                    {/* Top Color Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: tier.color }} />

                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {tier.level}
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {tier.title}
                          </h3>
                        </div>
                        <div
                          className="rounded-xl p-2.5"
                          style={{ color: tier.color, backgroundColor: `${tier.color}18` }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                        {tier.range}
                      </p>

                      <div className="mt-4 flex items-baseline gap-1.5">
                        <span className="font-serif text-3xl sm:text-4xl font-bold font-mono" style={{ color: tier.color }}>
                          {tier.payout}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {tier.note}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        Daily and streak bonuses
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        25% royalty opportunity
                      </p>
                    </div>

                    {idx < TIERS.length - 1 && (
                      <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-400 shadow-sm xl:block z-10">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. High Performance Streaks ────────────────────────────────── */}
        <section className="bg-slate-100/70 dark:bg-slate-900/50 py-16 lg:py-24 border-y border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="inline-block px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                High performance streaks
              </span>
              <h2 className="font-serif text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white">
                Daily, weekly & monthly challenges
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Consistency unlocks bonus payouts and a recurring share of RentalMeet&apos;s platform profit.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {STREAKS.map((streak, idx) => {
                const Icon = streak.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${streak.color.split(' ')[0]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {streak.label}
                        </p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {streak.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {streak.target}
                      </p>

                      {/* Calculation Box */}
                      <div className="mt-5 space-y-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 text-xs font-mono">
                        {streak.calculation.map((line, lIdx) => (
                          <p
                            key={lIdx}
                            className={
                              lIdx === streak.calculation.length - 1
                                ? 'border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-slate-900 dark:text-white text-sm'
                                : 'text-slate-600 dark:text-slate-400'
                            }
                          >
                            {line}
                          </p>
                        ))}
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400">
                        <Sparkles className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                        <span>{streak.reward}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 5. 25% Share of Platform Profit ────────────────────────────── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-primary-200 dark:border-primary-900/40 bg-primary-50/40 dark:bg-slate-900 shadow-xl">
              <div className="grid lg:grid-cols-[1fr_1.2fr]">
                {/* Left Dark Gradient Box */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-white sm:p-10 lg:p-12 flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full border border-white/30 bg-white/15 text-xs font-bold uppercase tracking-wider text-white mb-4">
                      Unlockable reward
                    </span>
                    <h2 className="font-serif text-3xl font-bold sm:text-4xl leading-tight">
                      25% share of platform profit
                    </h2>
                    <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/85">
                      Complete either the 7-Day or 30-Day Power Streak and earn a share of RentalMeet&apos;s platform fee on bookings across the venues you listed.
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xs">
                    <Clock className="h-5 w-5 shrink-0 text-amber-300" />
                    <span className="text-xs sm:text-sm font-semibold">
                      Valid for 12 months / 365 days from venue verification
                    </span>
                  </div>
                </div>

                {/* Right Feature Grid */}
                <div className="grid gap-4 p-6 sm:p-8 lg:p-10 sm:grid-cols-2 bg-white dark:bg-slate-900">
                  {[
                    ['7-Day Streak', '5 venues daily or 35 venues per week', '₹1,000 cash bonus'],
                    ['30-Day Streak', '150 verified venues in one month', '₹5,000 cash bonus'],
                    ['Paid monthly', 'After booking completion and payment realization', 'On platform fee only'],
                    ['Built for growth', 'Every level keeps your royalty opportunity', 'Non-transferable income']
                  ].map(([title, desc, highlight], idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-5 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{title}</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                      </div>
                      <p className="mt-3 text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> {highlight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. How It Works (6 Steps) ──────────────────────────────────── */}
        <section id="how-it-works" className="bg-white dark:bg-slate-900 py-16 lg:py-24 border-y border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="inline-block px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                How it works
              </span>
              <h2 className="font-serif text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white">
                Start earning in six simple steps
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                No complicated paperwork. Find great venues, submit the right details, and let RentalMeet verify them.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {HOW_IT_WORKS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-6 shadow-xs hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">
                        {step.number}
                      </span>
                      <div className="rounded-xl bg-primary-100 dark:bg-primary-950/60 p-2.5 text-primary-600 dark:text-primary-400">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="mt-5 text-base font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 7. Monthly Star Performer Awards ───────────────────────────── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="inline-block px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Recognition & cash prizes
                </span>
                <h2 className="font-serif text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white">
                  Monthly Star Performer Awards
                </h2>
                <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  Top-performing Ambassadors with 150+ verified venues in a single calendar month can win cash awards and leadership recognition.
                </p>

                {/* Podium Cards */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    ['1st', '₹25,000', 'Star Performer', 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'],
                    ['2nd', '₹15,000', 'Silver Performer', 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'],
                    ['3rd', '₹10,000', 'Bronze Performer', 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800']
                  ].map(([rank, prize, title, theme], idx) => (
                    <div key={idx} className={`rounded-2xl border p-5 text-center shadow-xs ${theme}`}>
                      <Trophy className="mx-auto h-7 w-7 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {rank} position
                      </p>
                      <p className="mt-1 text-2xl font-black font-mono">{prize}</p>
                      <p className="mt-1 text-xs font-semibold">{title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Award Eligibility Box */}
              <div className="rounded-3xl border border-primary-200 dark:border-primary-900/40 bg-primary-50/50 dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary-600 p-3 text-white">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Award eligibility</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">What counts toward the award leaderboard</p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {[
                    '150+ verified venues in one calendar month',
                    'Only new, verified, and approved listings count',
                    'Winners are announced in the first week of the following month',
                    'Cash prizes are credited within 15 working days after month-end',
                    'Ties are decided by booking conversion rate, then verification time'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. Payout Schedule Table ───────────────────────────────────── */}
        <section className="bg-slate-100/70 dark:bg-slate-900/50 py-16 lg:py-24 border-y border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <span className="inline-block px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                Payout schedule
              </span>
              <h2 className="font-serif text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white">
                Know when you get paid
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-primary-50 dark:bg-slate-800 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-4 font-bold">Payout type</th>
                    <th className="px-5 py-4 font-bold">Frequency</th>
                    <th className="px-5 py-4 font-bold">Processing time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    ['Per-venue payout', 'Weekly', 'Every Monday'],
                    ['Daily streak bonus', 'Weekly', 'Every Monday'],
                    ['Weekly streak bonus', 'Weekly', 'Every Monday'],
                    ['Monthly Champion Award', 'Monthly', '1st of following month'],
                    ['Royalty income', 'Monthly', '7th of following month']
                  ].map(([type, freq, proc], idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{type}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{freq}</td>
                      <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">{proc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Payments are made via UPI or bank transfer. TDS is deducted as per applicable Indian tax laws.
            </p>
          </div>
        </section>

        {/* ── 9. FAQs Accordion (18 Items) ───────────────────────────────── */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <span className="inline-block px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                Frequently asked questions
              </span>
              <h2 className="font-serif text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white">
                Everything you need to know
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : 'text-slate-400'}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-850/30">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 10. Program Terms & Inactivity Rule ─────────────────────────── */}
        <section className="bg-white dark:bg-slate-900 py-16 lg:py-24 border-y border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <span className="inline-block px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
                Program terms
              </span>
              <h2 className="font-serif text-3xl font-bold sm:text-4xl text-slate-900 dark:text-white">
                Clear rules for a fair program
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Please review these key conditions before applying. Full participation is subject to RentalMeet&apos;s Terms of Service.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {PROGRAM_TERMS.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-5 shadow-xs flex flex-col">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-3">
                      <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />
                      <span>{cat.title}</span>
                    </h3>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {cat.items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* 30-Day Auto Inactivity Warning Callout */}
            <div className="mt-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 p-5 text-xs sm:text-sm text-rose-900 dark:text-rose-200 shadow-xs">
              <p className="font-bold flex items-center gap-2 text-rose-700 dark:text-rose-300 text-sm">
                <AlertTriangle className="h-4 w-4" /> 30-Day Inactivity and Auto-Deactivation Policy
              </p>
              <p className="mt-2 leading-relaxed">
                If an Ambassador does not list even one venue within 30 days of approval, the Ambassador ID will be automatically blocked/deactivated. Reactivation requires a ₹500 fee. Repeated inactivity after reactivation may lead to permanent deactivation without refund, and pending payouts remain held until reactivation.
              </p>
            </div>
          </div>
        </section>

        {/* ── 11. Apply / Registration & Login Section ───────────────────────────── */}
        <section id="apply" className="scroll-mt-24 bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900 py-16 text-white lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="inline-block px-3 py-1 rounded-full border border-white/25 bg-white/15 text-xs font-bold uppercase tracking-wider text-white mb-4">
                Ready to get started?
              </span>
              <h2 className="font-serif text-3xl font-bold sm:text-4xl leading-tight">
                Join as a Venue Ambassador Today
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/85">
                Start earning ₹100–₹200 per verified venue + unlock 25% recurring royalty on bookings for 1 full year (365 days).
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
              
              {/* Box 1: New Ambassador Registration */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-7 sm:p-9 shadow-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-xs font-bold uppercase">
                      New Registration
                    </span>
                    <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-slate-800 text-primary-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                    Register as Ambassador
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Fill the official registration form with your mobile/email OTP verification, KYC documents, and bank/UPI details to receive your official Ambassador ID.
                  </p>

                  <ul className="mt-6 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>100% Free registration (Zero fee)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Instant mobile &amp; email OTP verification</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Direct payouts via UPI or Bank Transfer</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Dedicated Ambassador Dashboard &amp; Tracking</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href="/register-ambassador"
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-primary-600 to-orange-600 hover:from-primary-500 hover:to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Open Ambassador Registration Form</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Box 2: Existing Ambassador Login */}
              <div className="rounded-3xl bg-slate-850/90 text-white p-7 sm:p-9 shadow-2xl border border-white/20 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase">
                      Already Registered?
                    </span>
                    <div className="p-2.5 rounded-xl bg-white/10 text-amber-300">
                      <Lock className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold font-serif text-white">
                    Ambassador Login
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Already have an active Ambassador account? Log in to your personal dashboard to track verified venues, monitor streak bonuses, and view weekly payouts.
                  </p>

                  <ul className="mt-6 space-y-3 text-xs text-slate-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Track venue verification &amp; approval status</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Real-time daily, weekly &amp; monthly streak counter</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>25% royalty income balance &amp; disbursement history</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Submit new venues via 7-step wizard</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <Link
                    href="/login?role=ambassador"
                    className="w-full py-3.5 px-6 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Login to Ambassador Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── 12. Bottom Banner ──────────────────────────────────────────── */}
        <section className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Already have a venue to host events? List it directly on RentalMeet.
            </p>
            <Link
              href="/register-venue"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              List Your Venue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
