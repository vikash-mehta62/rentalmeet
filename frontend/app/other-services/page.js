'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  UtensilsCrossed, 
  Sparkles, 
  Camera, 
  Music, 
  Flower2, 
  Shield, 
  Star, 
  Truck,
  Phone,
  Mail
} from 'lucide-react';

export default function OtherServicesPage() {
  const services = [
    {
      id: 'catering',
      icon: UtensilsCrossed,
      title: 'Catering Services',
      description: 'Exquisite culinary experiences tailored to your event\'s theme and guest preferences.',
      image: '/services/catering.jpg',
      partners: [
        'Royal Flavors Catering',
        'Elite Buffet Solutions',
        'Spice Garden Events'
      ],
      categories: [
        'North Indian',
        'South Indian',
        'Chinese',
        'Continental',
        'Fusion Buffets'
      ]
    },
    {
      id: 'makeup',
      icon: Sparkles,
      title: 'Makeup & Beauty',
      description: 'Professional grooming and beauty services to help you look your best for any occasion.',
      image: '/services/makeup.jpg',
      partners: [
        'Glow Studio by Priya',
        'Modern Bride Artists',
        'Executive Grooming Co.'
      ],
      categories: [
        'Bridal',
        'Party/Event',
        'Corporate',
        'HD Makeup'
      ]
    },
    {
      id: 'photography',
      icon: Camera,
      title: 'Photography & Video',
      description: 'Capture every moment with our professional photography and cinematic video services.',
      image: '/services/photography.jpg',
      partners: [
        'Pixel Perfect Studios',
        'Cinematic Stories',
        'Event Moments Media'
      ],
      categories: [
        'Candid',
        'Traditional',
        'Cinematic',
        'Drone'
      ]
    },
    {
      id: 'entertainment',
      icon: Music,
      title: 'Entertainment Services',
      description: 'Live music, dance troupes, and theatrical performances to keep your guests mesmerized.',
      image: '/services/entertainment.jpg',
      partners: [
        'Vibe Entertainment',
        'The Live Band Collective',
        'Indie Artists Hub'
      ],
      categories: [
        'Live Bands',
        'DJs',
        'Solo Singers',
        'Instrumentalists',
        'Dance Troupes',
        'Solo Dancers',
        'Flash Mob',
        'Traditional Forms',
        'Stand-up Comedians',
        'Improv Groups',
        'Theatre Performances'
      ]
    },
    {
      id: 'decor',
      icon: Flower2,
      title: 'Decor & Floral Services',
      description: 'Transform your venue with breathtaking floral arrangements and theme-based decorations.',
      image: '/services/decor.jpg',
      partners: [
        'Decor Dreams',
        'Floral Fantasies',
        'The Theme Studio'
      ],
      categories: [
        'Stage Decoration',
        'Entrance Decor',
        'Table Decor',
        'Fresh Flowers',
        'Artificial Flowers',
        'Special Installations',
        'Traditional',
        'Modern',
        'Seasonal',
        'Corporate',
        'Cultural'
      ]
    },
    {
      id: 'security',
      icon: Shield,
      title: 'Security & Bouncers',
      description: 'Ensuring the safety and smooth flow of your event with professional security personnel.',
      image: '/services/security.jpg',
      partners: [
        'Guardian Shield Security',
        'Elite Bouncer Squad',
        'SafeEvent Personnel'
      ],
      categories: [
        'Basic Security',
        'Event Team',
        'VIP Detail',
        'Crowd Management'
      ]
    },
    {
      id: 'celebrity',
      icon: Star,
      title: 'Celebrity Services',
      description: 'Add star power to your event with appearances by Bollywood, TV, and Social Media stars.',
      image: '/services/celebrity.jpg',
      partners: [],
      celebrities: [
        'Star A (Bollywood)',
        'Star B (TV Actor)',
        'Star C (Influencer)'
      ],
      categories: [
        'Bollywood Actors',
        'TV Stars',
        'Web Series Stars',
        'Influencers'
      ]
    },
    {
      id: 'logistics',
      icon: Truck,
      title: 'Logistics & Support',
      description: 'End-to-end transportation and professional event staffing to ensure seamless operations.',
      image: '/services/logistics.jpg',
      partners: [
        'Elite Logistics Solutions',
        'Staffing Pros',
        'Premium Event Support'
      ],
      categories: [
        'Shuttle Services',
        'Luxury Car Rentals',
        'Bus Rentals',
        'Airport Transfers',
        'Hosts/Hostesses',
        'Registration Staff',
        'Ushers',
        'Crowd Managers',
        'Waiters/Servers',
        'Bartenders',
        'Chefs/Cooks',
        'Clean-up Crew'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-slate-950">
      <Navbar />

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="relative py-16 bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-bold text-primary-500 uppercase tracking-[0.2em] mb-4">Beyond Venues</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-slate-100 mb-6">
              Other Premium Services
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mx-auto">
              We provide end-to-end event solutions. From gourmet catering to celebrity appearances, RentalMeet ensures every detail of your event is handled with professional excellence.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <div 
                    key={service.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Service Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                      <div className="absolute top-4 left-4 w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
                        <Icon className="w-6 h-6 text-primary-500" />
                      </div>
                      <Icon className="w-24 h-24 text-primary-200 dark:text-slate-600" />
                    </div>

                    {/* Service Content */}
                    <div className="p-6">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-3">
                        {service.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Partners */}
                      {service.partners && service.partners.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Partner Vendors
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {service.partners.map((partner, idx) => (
                              <span 
                                key={idx}
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium"
                              >
                                {partner}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Celebrity Roster */}
                      {service.celebrities && service.celebrities.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Celebrity Roster
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {service.celebrities.map((celebrity, idx) => (
                              <span 
                                key={idx}
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium"
                              >
                                {celebrity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Categories */}
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {service.categories.map((category, idx) => (
                            <span 
                              key={idx}
                              className="px-3 py-1.5 bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400 rounded-lg text-xs font-semibold border border-primary-100 dark:border-slate-700"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:border-primary-500 hover:text-primary-500 transition-all">
                          Book with Space
                        </button>
                        <button className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl">
                          Direct Booking
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-primary-500 to-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              Ready to customize your event?
            </h2>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Contact our dedicated event planners to bundle these services with your venue booking for an exclusive RentalMeet experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a 
                href="tel:+919425796767"
                className="flex items-center gap-3 px-8 py-4 bg-white text-primary-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-xl hover:shadow-2xl"
              >
                <Phone className="w-5 h-5" />
                +91 9425796767
              </a>
              <a 
                href="mailto:booking@rentalmeet.in"
                className="flex items-center gap-3 px-8 py-4 bg-white text-primary-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-xl hover:shadow-2xl"
              >
                <Mail className="w-5 h-5" />
                booking@rentalmeet.in
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
