'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative h-[80vh] md:h-[90vh] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/her-img2.jpg"
          alt="Premium Venue"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative h-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight max-w-4xl" style={{ fontFamily: 'Georgia, serif' }}>
          Book Your Perfect Space
          <br />
          <span className="text-primary-500">With RentalMeet</span>
        </h1>

        {/* Description */}
        <p className="text-white/90 text-base md:text-lg max-w-2xl mb-8 leading-relaxed px-4">
          Premium meeting spaces and event venues for 1-1000 persons, fully equipped with world-class facilities. 
          Book by the hour and experience premium hospitality.
        </p>

        {/* CTA Button */}
        <Link 
          href="/venues"
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-md transition-all duration-300 transform hover:scale-105"
        >
          Browse Venues
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 8l4 4m0 0l-4 4m4-4H3" 
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}

