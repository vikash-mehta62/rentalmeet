'use client';

import {
  BadgeCheck,
  Zap,
  MapPin,
  BadgeDollarSign,
  Smartphone,
  HeadphonesIcon,
} from 'lucide-react';

const REASONS = [
  {
    icon: BadgeCheck,
    title: 'Verified Venues',
    description: 'Access a curated network of trusted venues and hotels.',
    color: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600', border: 'border-green-100 dark:border-green-800' },
  },
  {
    icon: Zap,
    title: 'Easy Booking Process',
    description: 'Search, compare, and confirm bookings in minutes.',
    color: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'text-yellow-500', border: 'border-yellow-100 dark:border-yellow-800' },
  },
  {
    icon: MapPin,
    title: 'Nationwide Coverage',
    description: 'Discover venues in major cities and emerging business hubs across India.',
    color: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-500', border: 'border-blue-100 dark:border-blue-800' },
  },
  {
    icon: BadgeDollarSign,
    title: 'Transparent Pricing',
    description: 'No hidden charges. Compare options and book confidently.',
    color: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-500', border: 'border-purple-100 dark:border-purple-800' },
  },
  {
    icon: Smartphone,
    title: 'Mobile App Convenience',
    description: 'Manage venue bookings anytime, anywhere.',
    color: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-500', border: 'border-orange-100 dark:border-orange-800' },
  },
  {
    icon: HeadphonesIcon,
    title: 'Dedicated Support',
    description: 'Get assistance before, during, and after your booking.',
    color: { bg: 'bg-teal-50 dark:bg-teal-900/20', icon: 'text-teal-600', border: 'border-teal-100 dark:border-teal-800' },
  },
];

export default function WhyChooseRentalMeet() {
  return (
    <section className="py-10 lg:py-14 bg-[#f9f8f5] dark:bg-slate-900" aria-labelledby="why-choose-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-wider mb-2">
            Why Choose Us
          </p>
          <h2
            id="why-choose-heading"
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100"
          >
            Why Businesses Choose RentalMeet
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {REASONS.map((reason, index) => {
            const Icon = reason.icon;
            const c = reason.color;
            return (
              <div
                key={index}
                className={`${c.bg} border ${c.border} rounded-xl p-6 hover:shadow-md transition-all duration-300`}
              >
                <div className={`w-11 h-11 ${c.bg} border ${c.border} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
                  {reason.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {reason.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
