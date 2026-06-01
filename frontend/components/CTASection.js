'use client';

import { Smartphone } from 'lucide-react';
import Image from 'next/image';

export default function CTASection() {
  return (
    <section className="py-5 px-6 bg-[#F59F0A]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Content */}
        <div className="flex-1 text-left">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
            Ready to Book Your Venue?
          </h2>
          <p className="text-base opacity-90 mb-3 max-w-2xl text-gray-900">
            Download the RentalMeet app for faster booking, instant confirmations, and easy venue management on the go.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://example.com/ios-app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-bold px-5 py-3 rounded-xl transition-all duration-300 shadow-lg"
            >
              <Smartphone className="w-4 h-4" />
              Download for iOS
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.rentalmeetapp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-bold px-5 py-3 rounded-xl transition-all duration-300 shadow-lg"
            >
              <Smartphone className="w-4 h-4" />
              Download for Android
            </a>
          </div>
        </div>

        {/* Right Side: QR + Download Links */}
        <div id="app-download" className="w-full md:w-auto grid grid-cols-2 gap-6 bg-white/20 px-6 py-5 rounded-2xl backdrop-blur-sm border border-white/30">
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <div className="w-28 h-28 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
                <span className="text-[9px] text-gray-500 font-bold uppercase">iOS QR</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900">Scan for iOS</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <Image
                src="/android-qr-code.png"
                alt="Android QR Code"
                width={112}
                height={112}
                className="rounded-lg"
              />
            </div>
            <p className="text-sm font-semibold text-gray-900">Scan for Android</p>
          </div>
        </div>

      </div>
    </section>
  );
}

