'use client';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import SearchFilter from '@/components/SearchFilter';
import FeaturedVenues from '@/components/FeaturedVenues';
import VenueCategoriesSection from '@/components/VenueCategoriesSection';
import PremiumServicesSection from '@/components/PremiumServicesSection';
import FacilitiesSection from '@/components/FacilitiesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import LatestBlogsSection from '@/components/LatestBlogsSection';
import Footer from '@/components/Footer';




export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950">
      {/* Navbar yahan transparent handle hoga */}
      <Navbar />

      <main>
        {/* Hero Section: No padding-top so image goes behind navbar */}
        <section className="relative">
          <HeroSection />
        </section>

        {/* Search Filter */}
        <section className="relative z-30 -mt-4 md:-mt-6 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <SearchFilter />
          </div>
        </section>

        {/* Featured Venues Section */}
        <FeaturedVenues />

        {/* Venue Categories Section */}
        <VenueCategoriesSection />

        {/* Premium Services Section */}
        <PremiumServicesSection />

        {/* Facilities Section */}
        <FacilitiesSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Latest Blog Posts */}
        <LatestBlogsSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
