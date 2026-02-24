'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  const router = useRouter();

  return (
    <section className="py-20 px-4 sm:px-6 bg-[#F89D09]">
      <div className="max-w-4xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Ready to Book Your Venue?
        </h2>

        {/* Description */}
        <p className="text-base md:text-lg text-gray-800 mb-8 max-w-2xl mx-auto">
          Transform your meetings with our premium venues. Browse our collection and find the perfect venue for your next event.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => router.push('/venues')}
          className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-bold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Browse All Venues
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
