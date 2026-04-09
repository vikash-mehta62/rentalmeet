'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ChevronDown, HelpCircle, Building2, Users, Mail, Phone } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

const CATEGORY_LABELS = {
  venue_seekers: { label: 'For Venue Seekers', icon: Users, color: 'amber' },
  venue_owners:  { label: 'For Venue Owners',  icon: Building2, color: 'blue' },
  general:       { label: 'General',            icon: HelpCircle, color: 'slate' },
};

export default function FAQsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetch(`${API}/faqs`)
      .then(r => r.json())
      .then(d => { if (d.success) setFaqs(d.faqs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS).filter(c => faqs.some(f => f.category === c))];

  const filtered = activeCategory === 'all' ? faqs : faqs.filter(f => f.category === activeCategory);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-36 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Title */}
          <div className="text-center mb-10">
            <span className="inline-block border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs px-4 py-1 rounded-full mb-4">
              FAQs
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Frequently Asked Questions
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm">Everything you need to know about RentalMeet</p>
          </div>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {categories.map(cat => {
                const meta = CATEGORY_LABELS[cat];
                const Icon = meta?.icon;
                return (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                      activeCategory === cat
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    {Icon && <Icon size={14} />}
                    {cat === 'all' ? 'All Questions' : meta?.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* FAQ Accordion */}
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No FAQs found.</div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {filtered.map((faq, i) => (
                <div key={faq._id} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100 pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openIndex === i && (
                    <div className="px-8 pb-6">
                      <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Contact */}
          <div className="mt-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-6 text-center">Quick Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <Users className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">For Venue Seekers</p>
                <a href="mailto:support@rentalmeet.com" className="text-sm text-amber-600 hover:underline flex items-center justify-center gap-1">
                  <Mail size={12} />support@rentalmeet.com
                </a>
              </div>
              <div className="text-center p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <Building2 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">For Venue Owners</p>
                <a href="mailto:venues@rentalmeet.com" className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1">
                  <Mail size={12} />venues@rentalmeet.com
                </a>
              </div>
            </div>
            <p className="text-center text-sm text-slate-400 mt-4">
              Website: <a href="https://www.rentalmeet.com" className="text-amber-500 hover:underline">www.rentalmeet.com</a>
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
