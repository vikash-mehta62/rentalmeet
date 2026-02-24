'use client';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import SearchFilter from '@/components/SearchFilter';
import FeaturedVenues from '@/components/FeaturedVenues';
import FacilitiesSection from '@/components/FacilitiesSection';
import PricingSection from '@/components/PricingSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Navbar yahan transparent handle hoga */}
      <Navbar />

      <main>
        {/* Hero Section: No padding-top so image goes behind navbar */}
        <section className="relative">
          <HeroSection />
        </section>

        {/* Search Filter: Slightly overlapping Hero Section like Replit */}
        <section className="relative z-30 -mt-8 md:-mt-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <SearchFilter />
          </div>
        </section>

        {/* Featured Venues Section */}
        <FeaturedVenues />

        {/* Facilities Section */}
        <FacilitiesSection />

        {/* Pricing and Why Choose Us Sections */}
        <PricingSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}