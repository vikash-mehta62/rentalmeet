'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  MessageCircle, Phone, Mail, BookOpen,
  ChevronDown, Send, Clock, CheckCircle, HelpCircle, Building2, Users
} from 'lucide-react';

const CATEGORY_LABELS = {
  venue_seekers: { label: 'For Venue Seekers', icon: Users },
  venue_owners:  { label: 'For Venue Owners',  icon: Building2 },
  general:       { label: 'General',            icon: HelpCircle },
};

const CATEGORIES = [
  'Select a category',
  'Booking Issues',
  'Payment & Billing',
  'Venue Related',
  'Technical Issues',
  'General Feedback',
  'Other',
];

export default function CustomerSupportPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', category: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/faqs`)
      .then(r => r.json())
      .then(d => { if (d.success) setFaqs(d.faqs); })
      .catch(() => {})
      .finally(() => setFaqLoading(false));
  }, []);

  const faqCategories = ['all', ...Object.keys(CATEGORY_LABELS).filter(c => faqs.some(f => f.category === c))];
  const filteredFaqs = activeCategory === 'all' ? faqs : faqs.filter(f => f.category === activeCategory);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — wire to your API as needed
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-36 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="text-center mb-12">
            <span className="inline-block border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs px-4 py-1 rounded-full mb-4">
              Support
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Customer Support
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm max-w-xl mx-auto">
              We're here to help you with any questions or issues. Our dedicated support team is ready to assist you 24/7.
            </p>
          </div>

          {/* Support Options */}
          <div className="mb-12">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 text-center mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              How Can We Help You?
            </h2>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
              Choose the support option that works best for you
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with our support team instantly', badge: '24/7 Available', color: 'amber' },
                { icon: Phone, title: 'Phone Support', desc: 'Speak directly with our experts', badge: 'Mon-Sat, 9 AM - 7 PM', color: 'blue' },
                { icon: Mail, title: 'Email Support', desc: 'Send us detailed inquiries', badge: 'Response within 24 hours', color: 'green' },
                { icon: BookOpen, title: 'Help Center', desc: 'Browse our knowledge base', badge: 'Self-service anytime', color: 'purple' },
              ].map(({ icon: Icon, title, desc, badge, color }) => (
                <div key={title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm text-center hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                    color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    color === 'blue'  ? 'bg-blue-50 dark:bg-blue-900/20' :
                    color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                                        'bg-purple-50 dark:bg-purple-900/20'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      color === 'amber' ? 'text-amber-500' :
                      color === 'blue'  ? 'text-blue-500' :
                      color === 'green' ? 'text-green-500' :
                                          'text-purple-500'
                    }`} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-[15px]">{title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">{desc}</p>
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                    color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    color === 'blue'  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  }`}>
                    {badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 text-center mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
              Find quick answers to common questions about our services
            </p>

            {/* Category tabs */}
            {faqCategories.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {faqCategories.map(cat => {
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

            {faqLoading ? (
              <div className="text-center py-10 text-slate-400">Loading FAQs...</div>
            ) : filteredFaqs.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No FAQs found.</div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {filteredFaqs.map((faq, i) => (
                  <div key={faq._id || i} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                    <button
                      onClick={() => toggle(i)}
                      className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100 pr-4">{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openIndex === i && (
                      <div className="px-8 pb-6">
                        <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  Still Need Help?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Send us a detailed message and our support team will get back to you within 24 hours
                </p>

                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-2">Message Sent!</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">We'll get back to you within 24 hours.</p>
                    <button
                      onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', category: '', message: '' }); }}
                      className="mt-6 text-sm text-amber-600 hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your Name"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Your Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="Your Email"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        required
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="Subject"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="category"
                        required
                        value={form.category}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c === 'Select a category' ? '' : c} disabled={c === 'Select a category'}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Your Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Describe your issue in detail..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                    >
                      <Send size={15} />
                      {loading ? 'Sending...' : 'Send Support Request'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar contact info */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                Need Immediate Assistance?
              </h3>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Email Support</p>
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} /> Response within 24 hours</span>
                  </div>
                </div>
                <a href="mailto:booking@rentalmeet.com" className="text-sm text-amber-600 hover:underline break-all">
                  booking@rentalmeet.com
                </a>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Phone Support</p>
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} /> Mon-Sat, 9 AM - 7 PM</span>
                  </div>
                </div>
                <a href="tel:+916260959428" className="text-sm text-amber-600 hover:underline">
                  +91 62609 59428
                </a>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 p-6">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Connect with verified experts instantly.</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">Your project success is our top priority.</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
