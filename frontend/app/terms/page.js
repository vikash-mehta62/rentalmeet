'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const terms = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing and using RentalMeet, you agree to be bound by these Terms & Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.',
  },
  {
    title: '2. Booking and Payments',
    content:
      'All bookings are subject to availability. Payments must be settled at the venue or through our authorized online payment gateways as specified during the booking process. RentalMeet reserves the right to cancel any booking in case of non-payment or fraudulent activity.',
  },
  {
    title: '3. Usage Policy',
    content:
      'Users are expected to maintain the decorum of the professional environment. Any damage to the property or facilities will be charged to the user. Illegal activities, harassment, or misuse of the venue are strictly prohibited and may result in immediate termination of the booking without refund.',
  },
  {
    title: '4. Cancellation Policy',
    content:
      'Cancellations made 24 hours prior to the booking time are eligible for a full refund or rescheduling. Cancellations made within 24 hours of the booking time may be subject to a cancellation fee as determined by the venue owner.',
  },
  {
    title: '5. Venue Listings',
    content:
      'RentalMeet acts as a marketplace connecting venue owners and customers. We do not own or operate the listed venues. All venue details, pricing, and availability are provided by the respective venue owners. RentalMeet is not responsible for any inaccuracies in venue listings.',
  },
  {
    title: '6. User Accounts',
    content:
      'You are responsible for maintaining the confidentiality of your account credentials. Any activity that occurs under your account is your responsibility. Please notify us immediately of any unauthorized use of your account.',
  },
  {
    title: '7. Intellectual Property',
    content:
      'All content on RentalMeet, including logos, text, graphics, and software, is the property of Yuwaka EduTech Pvt. Ltd. and is protected by applicable intellectual property laws. You may not reproduce or distribute any content without prior written permission.',
  },
  {
    title: '8. Limitation of Liability',
    content:
      'RentalMeet shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform or services. Our total liability in any matter related to the services is limited to the amount paid by you for the specific booking in question.',
  },
  {
    title: '9. Privacy',
    content:
      'Your use of RentalMeet is also governed by our Privacy Policy, which is incorporated into these Terms & Conditions by reference. Please review our Privacy Policy to understand our practices.',
  },
  {
    title: '10. Changes to Terms',
    content:
      'RentalMeet reserves the right to modify these Terms & Conditions at any time. Changes will be effective immediately upon posting to the platform. Continued use of the platform after any changes constitutes your acceptance of the new terms.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950">
      <Navbar />

      <main className="pt-36 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Title */}
          <div className="text-center mb-8">
            <span className="inline-block border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs px-4 py-1 rounded-full mb-4">
              Legal
            </span>
            <h1
              className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Terms &amp; Conditions
            </h1>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 md:p-10 shadow-sm space-y-8">
            {terms.map((item, index) => (
              <div key={index}>
                <h2
                  className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {item.title}
                </h2>
                <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.content}
                </p>
                {index < terms.length - 1 && (
                  <hr className="mt-8 border-slate-100 dark:border-slate-700" />
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            Last updated: April 2026 · Operated by Yuwaka EduTech Pvt. Ltd.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
