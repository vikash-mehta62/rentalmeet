'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "How do I book a meeting room?",
    answer: "Simply browse our collection of spaces, select your preferred date, time, and duration, and click 'Book Now'. You can also customize your booking with additional facilities.",
  },
  {
    question: "What is included in the 'Room Rent'?",
    answer: "The room rent includes the use of the space and all 'Free Facilities' listed for that specific room, such as high-speed WiFi and basic presentation tools.",
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer: "Yes, you can cancel or reschedule up to 24 hours before your booking time. Please refer to our Terms & Conditions for the full cancellation policy.",
  },
  {
    question: "Are refreshments provided?",
    answer: "Complimentary water and coffee are provided in most rooms. Gourmet catering and premium beverage services can be added as 'Paid Facilities' during the booking process.",
  },
];

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950">
      <Navbar />

      <main className="pt-36 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Title */}
          <div className="text-center mb-8">
            <span className="inline-block border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs px-4 py-1 rounded-full mb-4">
              FAQs
            </span>
            <h1
              className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 leading-tight whitespace-nowrap"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Frequently Asked Questions
            </h1>
          </div>

          {/* Accordion Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-4 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-8 pb-5">
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
