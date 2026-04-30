'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { FileText, Mail, Phone, Building2 } from 'lucide-react';

const Section = ({ num, title, children }) => (
  <section>
    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
      <span className="w-7 h-7 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0">{num}</span>
      {title}
    </h2>
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
      {children}
    </div>
  </section>
);

const Table = ({ headers, rows }) => (
  <div className="overflow-x-auto -mx-1">
    <table className="w-full text-sm border-collapse">
      {headers && (
        <thead>
          <tr className="bg-gray-50 dark:bg-slate-800">
            {headers.map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider border border-gray-100 dark:border-slate-700">{h}</th>)}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-100 dark:border-slate-700 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className={`px-4 py-2.5 border border-gray-100 dark:border-slate-700 ${j === 0 ? 'font-semibold text-slate-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800/50 w-40' : 'text-slate-600 dark:text-slate-300'}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950 flex flex-col">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#0f172a] text-white pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-8 h-8 text-amber-400" />
            <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>Terms &amp; Conditions</h1>
          <p className="text-slate-400 text-sm">RentalMeet — Yuwaka EduTech Pvt. Ltd. &nbsp;|&nbsp; Last updated: April 2026</p>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">

        {/* 1. Introduction */}
        <Section num="1" title="Introduction">
          <p>Welcome to <strong>RentalMeet</strong>! These Terms and Conditions ("Terms") govern your use of the RentalMeet platform, including our website, mobile application, and related services (collectively, the "Platform"). RentalMeet is owned and operated by <strong>Yuwaka EduTech Pvt. Ltd.</strong>, a company incorporated under the Companies Act, 2013, having its registered office in Bhopal, Madhya Pradesh.</p>
          <p className="mt-3">By accessing or using RentalMeet, you agree to be bound by these Terms.</p>
          <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-amber-800 dark:text-amber-300">
            <strong>Important:</strong> RentalMeet is an intermediary platform connecting Space Seekers (individuals/businesses booking venues) and Venue Owners (those listing spaces). We do not own, operate, or control any venue listed on our Platform.
          </div>
        </Section>

        {/* 2. Company Information */}
        <Section num="2" title="Company Information">
          <Table rows={[
            ['Company Name', 'Yuwaka EduTech Pvt. Ltd.'],
            ['Brand Name', 'RentalMeet'],
            ['CIN', 'U85301MP2023PTC066019'],
            ['GSTIN', '23AABCY6855D1ZC'],
            ['PAN', 'AABCY6855D'],
            ['Registered Office', 'Bhopal, Madhya Pradesh'],
            ['Contact Email', 'info@rentalmeet.com'],
            ['Contact Phone', '+91-62609-59428'],
          ]} />
        </Section>

        {/* 3. Definitions */}
        <Section num="3" title="Definitions">
          <Table headers={['Term', 'Meaning']} rows={[
            ['"RentalMeet" / "We" / "Us" / "Our"', 'The platform owned and operated by Yuwaka EduTech Pvt. Ltd.'],
            ['"Yuwaka EduTech"', 'The parent company, Yuwaka EduTech Pvt. Ltd.'],
            ['"Platform"', 'Our website, mobile app, and all related services'],
            ['"Space Seeker" / "User"', 'Anyone using the Platform to book a venue'],
            ['"Venue Owner" / "Host"', 'Anyone listing a venue on the Platform'],
            ['"Booking"', 'A confirmed reservation of a venue'],
            ['"Commission"', 'The fee charged to Venue Owners for bookings (15%)'],
          ]} />
        </Section>

        {/* 4. Eligibility & Accounts */}
        <Section num="4" title="Eligibility & Accounts">
          <ul className="space-y-2">
            {[
              'You must be 18 years or older to use RentalMeet',
              'You must provide accurate, complete information during registration',
              'You are responsible for all activity under your account',
              'Keep your password confidential – do not share it',
              'RentalMeet/Yuwaka EduTech Pvt. Ltd. reserves the right to verify your identity and business documents',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* 5. Booking & Payment */}
        <Section num="5" title="Booking & Payment">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-3">For Space Seekers:</p>
          <Table headers={['Item', 'Details']} rows={[
            ['Booking Confirmation', 'Instant after payment for instant-book venues; within 24 hours for request-based venues'],
            ['Payment', 'Full amount due at time of booking'],
            ['Security Deposit', 'If required, disclosed before booking; refundable within 3-7 days after check-out'],
            ['Payment Methods', 'Credit/Debit Cards, UPI, Net Banking, Wallets (processed via Razorpay)'],
          ]} />
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-5 mb-3">For Venue Owners:</p>
          <ul className="space-y-2">
            {[
              'Commission: As per Commission Policy/Platform Fees Policy on all successful bookings',
              'Payout: Processed within 3-5 business days after booking completion',
              'Cancellation Penalty: If you cancel a confirmed booking, you may be penalized',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* 6. Cancellation & Refund */}
        <Section num="6" title="Cancellation & Refund Policy">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Standard Cancellation Policy (Space Seekers):</p>
          <Table headers={['Cancellation Timing', 'Refund']} rows={[
            ['More than 48 hours before', '100% refund (minus gateway charges)'],
            ['24-48 hours before', '50% refund'],
            ['Less than 24 hours before', 'No refund'],
            ['No-show', 'No refund'],
          ]} />
          <p className="mt-3 text-xs text-slate-500 italic">Note: Some venues may have different policies – check the listing before booking.</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-5 mb-3">Venue Owner Cancellation:</p>
          <ul className="space-y-2">
            {[
              'Guest receives full refund',
              'Host may be charged a penalty (Rs.1,000 or more)',
              'Repeated cancellations may lead to account suspension',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* 7. User Conduct */}
        <Section num="7" title="User Conduct">
          <p className="mb-3">You agree <strong>NOT</strong> to:</p>
          <ul className="space-y-2 mb-4">
            {[
              'Use the Platform for illegal activities',
              'Provide false or misleading information',
              'Circumvent the Platform to book off-platform',
              'Harass, discriminate, or cause harm to others',
              'Post offensive, fraudulent, or copyright-infringing content',
              'Scrape, crawl, or data mine our Platform',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-red-400 font-bold mt-0.5">·</span>{item}</li>
            ))}
          </ul>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-xs">
            Violation may result in: Account suspension, termination, and legal action by RentalMeet / Yuwaka EduTech Pvt. Ltd.
          </div>
        </Section>

        {/* 8. Venue Owner Responsibilities */}
        <Section num="8" title="Venue Owner Responsibilities">
          <p className="mb-3">As a Venue Owner, you agree to:</p>
          <ul className="space-y-2">
            {[
              'Provide accurate listing information and photos',
              'Maintain high standards of cleanliness and safety',
              'Honor confirmed bookings without cancellation',
              'Respond to inquiries within 3 hours',
              'Comply with all applicable laws (GST, fire safety, licenses etc.)',
              'Not discriminate against any guest',
              'Have appropriate insurance coverage (recommended)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* 9. Space Seeker Responsibilities */}
        <Section num="9" title="Space Seeker Responsibilities">
          <p className="mb-3">As a Space Seeker, you agree to:</p>
          <ul className="space-y-2">
            {[
              'Provide accurate booking information',
              'Respect the venue – no damage, no exceeding capacity',
              'Comply with venue rules communicated by the Host',
              'Pay for damages caused during your booking',
              'Leave the venue in clean condition',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* 10. Disclaimers & Limitation of Liability */}
        <Section num="10" title="Disclaimers & Limitation of Liability">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">No Warranty</p>
          <p className="mb-4">The Platform is provided "AS IS" and "AS AVAILABLE." RentalMeet/Yuwaka EduTech Pvt. Ltd. does not warrant that the Platform will be uninterrupted, error-free, or secure. We do not endorse or guarantee any venue listed on our Platform.</p>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Limitation of Liability</p>
          <p className="mb-3">To the maximum extent permitted by law, RentalMeet/Yuwaka EduTech Pvt. Ltd. shall <strong>NOT</strong> be liable for:</p>
          <ul className="space-y-2 mb-4">
            {[
              'Any indirect, incidental, or consequential damages',
              'Loss of profits, data, or business',
              'Personal injury or property damage arising from your use of any venue',
              'Disputes between users',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-slate-400 font-bold mt-0.5">·</span>{item}</li>
            ))}
          </ul>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Our total liability shall not exceed:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span>For Space Seekers: The amount paid to RentalMeet in the preceding 12 months</li>
            <li className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span>For Venue Owners: Rs.10,000 or commission earned in preceding 12 months</li>
          </ul>
        </Section>

        {/* 11. Indemnification */}
        <Section num="11" title="Indemnification">
          <p className="mb-3">You agree to indemnify and hold harmless Yuwaka EduTech Pvt. Ltd. and its officers, employees, and agents from any claims, damages, or expenses arising from:</p>
          <ul className="space-y-2">
            {[
              'Your use of the Platform',
              'Your violation of these Terms',
              'Your transactions with other users',
              'Your content posted on the Platform',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* 12. Termination */}
        <Section num="12" title="Termination">
          <p className="mb-3">We may suspend or terminate your account immediately for:</p>
          <ul className="space-y-2 mb-4">
            {[
              'Violation of these Terms',
              'Fraudulent or illegal activity',
              'Multiple cancellations (for Hosts)',
              'Non-payment of dues',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-red-400 font-bold mt-0.5">·</span>{item}</li>
            ))}
          </ul>
          <p>Upon termination, you lose access to your account, and active bookings may be cancelled. Certain obligations (payments, indemnification) survive termination.</p>
        </Section>

        {/* 13. Dispute Resolution */}
        <Section num="13" title="Dispute Resolution">
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span><span><strong>Governing Law:</strong> These Terms are governed by the laws of India</span></li>
            <li className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span><span><strong>Jurisdiction:</strong> Courts in Bhopal, Madhya Pradesh have exclusive jurisdiction</span></li>
            <li className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">·</span><span><strong>Arbitration:</strong> Any dispute shall be resolved through arbitration under the Arbitration and Conciliation Act, 1996, with venue in Bhopal</span></li>
          </ul>
        </Section>

        {/* 14. Modifications */}
        <Section num="14" title="Modifications">
          <p>Yuwaka EduTech Pvt. Ltd. may update these Terms at any time. Material changes will be notified via email or platform notice. Your continued use after changes constitutes acceptance.</p>
        </Section>

        {/* 15. Grievance Officer */}
        <Section num="15" title="Grievance Officer">
          <p className="text-xs text-slate-500 mb-3 italic">In compliance with the Information Technology Act, 2000:</p>
          <Table rows={[
            ['Name', 'Mr. Mohsin Khan'],
            ['Designation', 'Grievance Officer, Yuwaka EduTech Pvt. Ltd.'],
            ['Email', 'support@rentalmeet.com'],
            ['Phone', '+91-94257-96767'],
            ['Response', 'Acknowledged within 24 hours; resolved within 30 days'],
          ]} />
        </Section>

        {/* 16. Contact Us */}
        <Section num="16" title="Contact Us">
          <Table headers={['Purpose', 'Contact']} rows={[
            ['General Inquiries', 'info@rentalmeet.com'],
            ['Support', 'support@rentalmeet.com'],
            ['Venue Partnerships', 'venues@rentalmeet.com'],
            ['Legal Notices', 'info@rentalmeet.com'],
          ]} />
        </Section>

        {/* Agreement Banner */}
        <div className="bg-[#0f172a] text-white rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-300 leading-relaxed">
            By using RentalMeet, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <a href="mailto:info@rentalmeet.com" className="hover:text-amber-400 transition-colors flex items-center gap-1"><Mail size={11} />info@rentalmeet.com</a>
            <span>·</span>
            <span className="flex items-center gap-1"><Building2 size={11} />Bhopal, Madhya Pradesh</span>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
