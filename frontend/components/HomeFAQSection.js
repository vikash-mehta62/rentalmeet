'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: 'What is RentalMeet?',
    answer:
      'RentalMeet is an online venue booking platform that helps businesses find and book conference halls, meeting rooms, training rooms, hotels, and event venues across India.',
  },
  {
    question: 'Can I book venues through the mobile app?',
    answer:
      'Yes, RentalMeet offers a mobile application for convenient venue search and booking. Download it for iOS or Android to manage reservations on the go.',
  },
  {
    question: 'Are venue prices transparent?',
    answer:
      'Yes, venue details and pricing information are clearly displayed for easy comparison. There are no hidden charges — what you see is what you pay.',
  },
  {
    question: 'Which cities does RentalMeet serve?',
    answer:
      'RentalMeet is expanding across major cities and business destinations throughout India, covering both metro areas and emerging business hubs.',
  },
  {
    question: 'Can I book venues for corporate events?',
    answer:
      'Absolutely. RentalMeet specializes in venue solutions for meetings, conferences, training programs, workshops, and corporate events of all scales.',
  },
];

export default function HomeFAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => setOpenIndex(openIndex === index ? null : index);

  return (
    <section className="py-10 lg:py-14 bg-white dark:bg-slate-950" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-wider mb-2">FAQs</p>
          <h2
            id="faq-heading"
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100"
          >
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggle(index)}
                aria-expanded={openIndex === index}
                className="w-full flex items-center justify-between px-5 py-4 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-4 bg-white dark:bg-slate-900">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
