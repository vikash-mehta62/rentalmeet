'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Smartphone } from 'lucide-react';

export default function CTASection() {
  const router = useRouter();

  return (
    <section className="py-20 px-6 bg-[#F59F0A]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Left Side: Content */}
        <div className="flex-1 text-left">
        <h2 
className="text-[52px] md:text-[64px] font-semibold leading-[1.1] text-gray-900 dark:text-slate-100"
style={{ fontFamily: 'Playfair Display, serif' }}
>            Ready to Book Your Venue?
          </h2>
          <p className="text-lg md:text-xl text-gray-900/80 mb-10 max-w-xl">
            Transform your meetings with our premium venues. Download our app to manage bookings on the go.
          </p>

          <button
            onClick={() => router.push('/venues')}
            className="inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            Browse All Venues
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: App Download QR Codes */}
        <div className="flex flex-col sm:flex-row gap-6 bg-white/20 p-8 rounded-3xl backdrop-blur-sm border border-white/30">
          {/* iOS QR */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              {/* Dummy QR Placeholder */}
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
                <span className="text-[10px] text-gray-500 font-bold uppercase">iOS QR Code</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <Smartphone className="w-4 h-4" />
              <span>App Store</span>
            </div>
          </div>

          {/* Android QR */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Android QR</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <Smartphone className="w-4 h-4" />
              <span>Play Store</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}