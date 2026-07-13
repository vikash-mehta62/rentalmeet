'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PlayCircle } from 'lucide-react';

export default function HowToUse() {
  const tutorials = [
    {
      title: "How to Register as User (Step-by-Step Video Tutorial)",
      description: "Learn how to quickly create a user account and start booking premium venues for your events.",
      videoId: "placeholder-user" // Replace with actual video ID or URL
    },
    {
      title: "How to Register Your Venue (Step-by-Step Video Tutorial)",
      description: "A complete guide for venue owners to list their properties and reach more customers.",
      videoId: "placeholder-venue"
    },
    {
      title: "How to Register as Vendor (Step-by-Step Video Tutorial)",
      description: "Discover how vendors can join our platform to offer premium services to event organizers.",
      videoId: "placeholder-vendor"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-4">
              How to Use RentalMeet
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Watch our step-by-step video tutorials to get started with the platform.
            </p>
          </div>

          <div className="space-y-12">
            {tutorials.map((tutorial, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
                {/* Video Placeholder */}
                <div className="md:w-2/5 bg-slate-100 dark:bg-slate-800 relative group flex items-center justify-center min-h-[250px] md:min-h-full">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-300" />
                  <PlayCircle className="w-16 h-16 text-primary-500/80 group-hover:text-primary-500 group-hover:scale-110 transition-all duration-300" />
                  <p className="absolute bottom-4 left-0 right-0 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Video coming soon
                  </p>
                </div>

                {/* Content */}
                <div className="p-8 md:w-3/5 flex flex-col justify-center">
                  <div className="inline-block px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-full mb-4">
                    Tutorial {index + 1}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                    {tutorial.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {tutorial.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
