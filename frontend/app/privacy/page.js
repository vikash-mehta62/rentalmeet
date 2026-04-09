'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Building2, Mail, Phone, User, Lock, Database, Eye, Trash2, Clock } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#0f172a] text-white pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 text-amber-400" />
            <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">RentalMeet — Yuwaka EduTech Pvt. Ltd. &nbsp;|&nbsp; Last updated: April 2026</p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10">

        {/* 1. Introduction */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">1</span>
            Introduction
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-700 leading-relaxed">
            <p>
              <strong>Yuwaka EduTech Pvt. Ltd.</strong>, the owner and operator of <strong>RentalMeet</strong>, is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our platform.
            </p>
            <p className="mt-3">By using RentalMeet, you consent to the practices described in this policy.</p>
          </div>
        </section>

        {/* 2. Company Information */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">2</span>
            Company Information
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Company Name', 'Yuwaka EduTech Pvt. Ltd.'],
                  ['Brand', 'RentalMeet'],
                  ['Corporate Office', 'RentalMeet, CV-8, 403 Supertech Capetown, Sector-74, Noida-201304'],
                  ['Registered Office', 'Bhopal, Madhya Pradesh'],
                  ['Contact', 'info@rentalmeet.com'],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="px-5 py-3 font-semibold text-gray-500 w-40 bg-gray-50">{label}</td>
                    <td className="px-5 py-3 text-gray-800">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Information We Collect */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">3</span>
            Information We Collect
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">User Type</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">Information Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="px-5 py-3 font-semibold text-gray-800 align-top">Space Seekers</td>
                  <td className="px-5 py-3 text-gray-700">Name, email, phone number, company name, booking preferences, payment details & ID proof.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-gray-800 align-top">Venue Owners</td>
                  <td className="px-5 py-3 text-gray-700">Name, business name, email, phone, address, GST, business documents, bank details, venue photos & ID proof.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-gray-800 align-top">Service Vendors</td>
                  <td className="px-5 py-3 text-gray-700">Name, business name, contact details, service categories, portfolio, bank details & ID proof.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-semibold text-gray-800 align-top">Automatically</td>
                  <td className="px-5 py-3 text-gray-700">IP address, device type, browser, usage data, location data, cookies.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. How We Use Your Information */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">4</span>
            How We Use Your Information
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">Purpose</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Service Delivery', 'Process bookings, facilitate communication, handle payments'],
                  ['Account Management', 'Create accounts, verify identity'],
                  ['Customer Support', 'Respond to inquiries, resolve issues'],
                  ['Improvement', 'Analyze usage, enhance features'],
                  ['Communication', 'Send confirmations, updates, promotions (with consent)'],
                  ['Legal Compliance', 'Comply with laws, prevent fraud'],
                ].map(([purpose, desc]) => (
                  <tr key={purpose}>
                    <td className="px-5 py-3 font-semibold text-gray-800 align-top w-48">{purpose}</td>
                    <td className="px-5 py-3 text-gray-700">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Information Sharing */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">5</span>
            Information Sharing
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-700 space-y-4">
            <div>
              <p className="font-semibold text-gray-900 mb-1">When You Book a Venue</p>
              <p>We share with the venue owner: your name, contact details, and booking information.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">When You List Your Venue</p>
              <p>We share with space seekers: venue details, pricing, and availability.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Third-Party Service Providers</p>
              <ul className="space-y-1 ml-4">
                <li><span className="font-medium">Payment Gateways:</span> Razorpay</li>
                <li><span className="font-medium">Cloud Storage:</span> AWS, Google Cloud</li>
                <li><span className="font-medium">Analytics:</span> Google Analytics</li>
                <li><span className="font-medium">Communication:</span> Email/SMS providers</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-800 mb-2">What We Do NOT Do</p>
              <ul className="space-y-1 text-green-700">
                <li>✓ Do NOT sell your personal information</li>
                <li>✓ Do NOT rent your data</li>
                <li>✓ Do NOT share for marketing without consent</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6. Data Security */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">6</span>
            Data Security
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">Measure</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">Implementation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Encryption', 'SSL/TLS 256-bit'],
                  ['Secure Storage', 'Restricted access servers'],
                  ['Payment Security', 'PCI-DSS compliant gateway'],
                  ['Access Control', 'Role-based employee access'],
                ].map(([measure, impl]) => (
                  <tr key={measure}>
                    <td className="px-5 py-3 font-semibold text-gray-800">{measure}</td>
                    <td className="px-5 py-3 text-gray-700">{impl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Data Retention */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">7</span>
            Data Retention
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">Data Type</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Account Information', 'Until deletion + 5 years'],
                  ['Booking Records', '5 years'],
                  ['Payment Transactions', '7 years (legal requirement)'],
                  ['Communications', '2 years'],
                ].map(([type, retention]) => (
                  <tr key={type}>
                    <td className="px-5 py-3 font-semibold text-gray-800">{type}</td>
                    <td className="px-5 py-3 text-gray-700">{retention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 8. Your Rights */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">8</span>
            Your Rights
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">Right</th>
                  <th className="px-5 py-3 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">How to Exercise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Access', 'Email info@rentalmeet.com'],
                  ['Correction', 'Email support@rentalmeet.com'],
                  ['Deletion', 'Email support@rentalmeet.com'],
                  ['Withdraw Consent', 'Unsubscribe from marketing'],
                ].map(([right, how]) => (
                  <tr key={right}>
                    <td className="px-5 py-3 font-semibold text-gray-800">{right}</td>
                    <td className="px-5 py-3 text-gray-700">{how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-sm text-amber-800 font-medium">
              Response Time: Within 30 days
            </div>
          </div>
        </section>

        {/* 9. Cookies */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">9</span>
            Cookies
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-700">
            We use <strong>essential</strong>, <strong>preference</strong>, <strong>analytics</strong>, and <strong>marketing</strong> cookies.
            You can manage cookies through your browser settings.
          </div>
        </section>

        {/* 10. Grievance Officer */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">10</span>
            Grievance Officer
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Name', 'Mr. Mohsin Khan'],
                  ['Company', 'Yuwaka EduTech Pvt. Ltd.'],
                  ['Email', 'support@rentalmeet.com'],
                  ['Phone', '+91-94257-96767'],
                  ['Response', '24 hours acknowledgment; 30 days resolution'],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="px-5 py-3 font-semibold text-gray-500 w-32 bg-gray-50">{label}</td>
                    <td className="px-5 py-3 text-gray-800">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 11. Contact Us */}
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black">11</span>
            Contact Us
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-700 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span><strong>Privacy Concerns:</strong> <a href="mailto:support@rentalmeet.com" className="text-amber-600 hover:underline">support@rentalmeet.com</a></span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span><strong>General Inquiries:</strong> <a href="mailto:info@rentalmeet.com" className="text-amber-600 hover:underline">info@rentalmeet.com</a></span>
            </div>
            <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
              <Building2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span><strong>Corporate Office:</strong> RentalMeet, CV-8, 403 Supertech Capetown, Sector-74, Noida-201304</span>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
