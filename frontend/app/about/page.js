'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Building2, Target, Heart, Shield, Sparkles, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative py-16 bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-bold text-primary-500 uppercase tracking-[0.2em] mb-4">About Us</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-slate-100 mb-6">
              About RentalMeet
            </h1>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                RentalMeet is a premium platform for renting meeting spaces and event venues, designed for every occasion—from professional corporate meetings and conferences to celebrations and special events. It focuses on delivering luxury venues equipped with world-class facilities to ensure exceptional experiences.
              </p>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Operated by <span className="font-bold text-slate-900 dark:text-slate-100">Yuwaka EduTech Pvt. Ltd.</span>, RentalMeet is dedicated to serving professionals, entrepreneurs, and corporations by offering high-quality meeting rooms, conference halls, and event spaces. The platform aims to simplify the often complex process of discovering and booking top-tier venues, recognizing that the right environment can turn an ordinary meeting into a breakthrough moment.
              </p>
            </div>
          </div>
        </section>

        {/* Vision & Mission Section */}
        <section className="py-16 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Vision */}
              <div className="bg-gradient-to-br from-primary-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 border border-primary-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Our Vision</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  To become the global standard for premium professional meeting spaces — redefining how the world comes together to collaborate, innovate, and celebrate. We envision a future where every important conversation, strategy session, product launch, or milestone celebration happens in environments that inspire greatness, foster meaningful connections, and leave a lasting impression. By blending cutting-edge technology, timeless luxury, and thoughtful design, RentalMeet aims to set the benchmark for professional hospitality globally.
                </p>
              </div>

              {/* Mission */}
              <div className="bg-gradient-to-br from-primary-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 border border-primary-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Our Mission</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  To simplify and elevate the entire experience of discovering, booking, and hosting events in world-class meeting rooms, conference halls, training spaces, and celebration venues. We are passionately committed to removing the friction, uncertainty, and compromise that professionals and organizations often face when searching for the perfect space. By curating only the finest luxury venues with state-of-the-art facilities, seamless digital booking tools, transparent pricing, and exceptional customer support, we empower our users to focus on what truly matters: their goals, their guests, and their success.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Commitment Section */}
        <section className="py-16 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 mb-4">Our Commitment</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                We stand by three core pillars that guide every interaction, venue partnership, and booking on the RentalMeet platform:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Transparency */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-4">Transparency</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Honest, upfront pricing with no hidden fees, clear availability in real time, detailed venue information, and open communication at every step so you always know exactly what to expect.
                </p>
              </div>

              {/* Luxury Hospitality */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-4">Luxury Hospitality</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  From impeccably maintained spaces and premium amenities to attentive on-site support and personalized service touches, we deliver an elevated, 5-star experience that makes every guest feel valued and every host proud.
                </p>
              </div>

              {/* Seamless Technology Integration */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-4">Seamless Technology Integration</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Intuitive, fast, and reliable digital tools that let you browse inspiring venues, compare options, book instantly, manage reservations, handle payments securely, and even access virtual tours or smart room controls — so planning feels effortless rather than overwhelming.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Closing Statement */}
        <section className="py-16 bg-white dark:bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-12 shadow-2xl">
              <Heart className="w-12 h-12 text-white mx-auto mb-6" />
              <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                Together, these commitments ensure that RentalMeet isn't just a booking platform — it's a trusted partner in turning your vision into reality, one exceptional gathering at a time.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
