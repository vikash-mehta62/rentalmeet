'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AboutRentalMeet() {
  return (
    <section className="py-10 lg:py-14 bg-white dark:bg-slate-950" aria-labelledby="about-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Label */}
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-wider mb-2">
            About RentalMeet
          </p>

          {/* H2 */}
          <h2
            id="about-heading"
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-5"
          >
            India's Smart Venue Booking Platform
          </h2>

          {/* Body */}
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            RentalMeet is a one-stop platform designed to simplify venue discovery and booking for
            businesses, organizations, and event planners. Whether you're organizing a corporate meeting,
            training session, conference, seminar, workshop, product launch, or networking event,
            RentalMeet connects you with verified venues across India.
          </p>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            Our platform allows users to browse venue options, compare facilities, check availability,
            and book seamlessly through web and mobile applications.
          </p>

          {/* CTA */}
          <Link
            href="/venues"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F59F0A] hover:bg-[#D97706] text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm"
          >
            Explore Venues <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
