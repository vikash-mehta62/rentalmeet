'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Smartphone } from 'lucide-react';

export default function CTASection() {
  const router = useRouter();

  return (
    <section className="py-5 px-6 bg-[#F59F0A]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Content */}
        <div className="flex-1 text-left">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
            Ready to Book Your Venue?
          </h2>
          <p className="text-base opacity-90 mb-3 max-w-2xl text-gray-900">
            Transform your meetings with our premium venues. Download our app to manage bookings on the go.
          </p>

          <button
            onClick={() => router.push('/venues')}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg"
          >
            Browse All Venues
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: App Download QR Codes */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white/20 p-6 rounded-2xl backdrop-blur-sm border border-white/30">
          {/* iOS QR */}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
                <span className="text-[9px] text-gray-500 font-bold uppercase">iOS QR Code</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-900 font-semibold text-sm">
              <Smartphone className="w-3.5 h-3.5" />
              <span>App Store</span>
            </div>
          </div>

          {/* Android QR */}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
                <span className="text-[9px] text-gray-500 font-bold uppercase">Android QR</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-900 font-semibold text-sm">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Play Store</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

