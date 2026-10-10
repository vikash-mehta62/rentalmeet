'use client';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import SearchFilter from '@/components/SearchFilter';
import FeaturedVenues from '@/components/FeaturedVenues';
import PremiumServicesSection from '@/components/PremiumServicesSection';
import FacilitiesSection from '@/components/FacilitiesSection';
import WhyChooseRentalMeet from '@/components/WhyChooseRentalMeet';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import LatestBlogsSection from '@/components/LatestBlogsSection';
import Footer from '@/components/Footer';
import HomePopupModal from '@/components/HomePopupModal';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950">
      {/* Home Announcement / Promotional Popup Modal */}
      <HomePopupModal />

      {/* Navbar yahan transparent handle hoga */}
      <Navbar />

      <main>
        {/* Hero Section: No padding-top so image goes behind navbar */}
        <section className="relative">
          <HeroSection />
        </section>

        {/* Search Filter - floating over bottom of full-size Hero Section */}
        <section className="relative z-30 -mt-20 sm:-mt-24 md:-mt-28 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <SearchFilter />
          </div>
        </section>

        {/* Featured Venues Section */}
        <FeaturedVenues />

        {/* Premium Services Section */}
        <PremiumServicesSection />

        {/* Facilities Section */}
        <FacilitiesSection />

        {/* Why Choose RentalMeet Section */}
        <WhyChooseRentalMeet />

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
