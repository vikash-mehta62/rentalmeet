'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-950">
      <Navbar />

      <main className="pt-36 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 text-center mb-8"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            About RentalMeet
          </h1>

          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 md:p-10 shadow-sm">

            {/* Intro */}
            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed text-[15px]">
              <p>
                RentalMeet is a premium platform for renting meeting spaces and event venues, designed for every
                occasion—from professional corporate meetings and conferences to celebrations and special events.
                It focuses on delivering luxury venues equipped with world-class facilities to ensure exceptional
                experiences.
              </p>
              <p>
                Operated by <span className="font-semibold text-slate-900 dark:text-slate-100">Yuwaka EduTech Pvt. Ltd.</span>, RentalMeet is dedicated to serving professionals,
                entrepreneurs, and corporations by offering high-quality meeting rooms, conference halls, and event
                spaces. The platform aims to simplify the often complex process of discovering and booking top-tier
                venues, recognizing that the right environment can turn an ordinary meeting into a breakthrough
                moment.
              </p>
            </div>

            <hr className="my-8 border-slate-100 dark:border-slate-700" />

            {/* Vision & Mission */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2
                  className="text-xl font-black text-slate-900 dark:text-slate-100 mb-3"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Our Vision
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px]">
                  To become the global standard for premium professional meeting spaces — redefining how the world
                  comes together to collaborate, innovate, and celebrate. We envision a future where every important
                  conversation, strategy session, product launch, or milestone celebration happens in environments
                  that inspire greatness, foster meaningful connections, and leave a lasting impression. By blending
                  cutting-edge technology, timeless luxury, and thoughtful design, RentalMeet aims to set the
                  benchmark for professional hospitality globally.
                </p>
              </div>
              <div>
                <h2
                  className="text-xl font-black text-slate-900 dark:text-slate-100 mb-3"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Our Mission
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px]">
                  To simplify and elevate the entire experience of discovering, booking, and hosting events in
                  world-class meeting rooms, conference halls, training spaces, and celebration venues. We are
                  passionately committed to removing the friction, uncertainty, and compromise that professionals
                  and organizations often face when searching for the perfect space. By curating only the finest
                  luxury venues with state-of-the-art facilities, seamless digital booking tools, transparent
                  pricing, and exceptional customer support, we empower our users to focus on what truly matters:
                  their goals, their guests, and their success.
                </p>
              </div>
            </div>

            <hr className="my-8 border-slate-100 dark:border-slate-700" />

            {/* Our Commitment */}
            <div>
              <h2
                className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Our Commitment
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-[15px] mb-6">
                We stand by three core pillars that guide every interaction, venue partnership, and booking on the
                RentalMeet platform:
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-bold text-primary-500 mb-2 text-[15px]">Transparency</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[14px]">
                    Honest, upfront pricing with no hidden fees, clear availability in real time, detailed venue
                    information, and open communication at every step so you always know exactly what to expect.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-primary-500 mb-2 text-[15px]">Luxury Hospitality</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[14px]">
                    From impeccably maintained spaces and premium amenities to attentive on-site support and
                    personalized service touches, we deliver an elevated, 5-star experience that makes every guest
                    feel valued and every host proud.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-primary-500 mb-2 text-[15px]">Seamless Technology Integration</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[14px]">
                    Intuitive, fast, and reliable digital tools that let you browse inspiring venues, compare
                    options, book instantly, manage reservations, handle payments securely, and even access virtual
                    tours or smart room controls — so planning feels effortless rather than overwhelming.
                  </p>
                </div>
              </div>
            </div>

            <hr className="my-8 border-slate-100 dark:border-slate-700" />

            {/* Closing */}
            <p className="text-slate-500 dark:text-slate-400 text-[14px] italic text-center leading-relaxed">
              Together, these commitments ensure that RentalMeet isn't just a booking platform — it's a trusted
              partner in turning your vision into reality, one exceptional gathering at a time.
            </p>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
