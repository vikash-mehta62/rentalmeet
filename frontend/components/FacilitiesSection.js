'use client';

import { Armchair, Projector, Wifi, UtensilsCrossed, Shield, Headphones, Car, Coffee } from 'lucide-react';

export default function FacilitiesSection() {
  const facilities = [
    {
      icon: Armchair,
      title: 'Ergonomic Seating',
      description: 'Premium ergonomic chairs designed for comfort during extended meetings.',
      includes: ['Lumbar Support', 'Adjustable Armrest']
    },
    {
      icon: Projector,
      title: 'HD Projection',
      description: 'State-of-the-art projectors and screens for crystal-clear presentations.',
      includes: ['4K Projector', 'Surround Sound']
    },
    {
      icon: Wifi,
      title: 'High-Speed WiFi',
      description: 'Blazing-fast internet connectivity for seamless video calls and streaming.',
      includes: ['1Gbps fiber', 'Guest Network']
    },
    {
      icon: UtensilsCrossed,
      title: 'Gourmet Catering',
      description: 'Professional catering services with customizable menu options.',
      includes: ['Indian', 'Continental', 'Live']
    },
    {
      icon: Shield,
      title: '24/7 Security',
      description: 'Round-the-clock security personnel and advanced surveillance systems.',
      includes: ['Bouncers', 'CCTV', 'Guards']
    },
    {
      icon: Headphones,
      title: 'Tech Support',
      description: 'Dedicated technical staff to assist with all your audiovisual needs.',
      includes: ['AV Team', 'Event Crew']
    },
    {
      icon: Car,
      title: 'Ample Parking',
      description: 'Secure parking facilities with easy access for all attendees.',
      includes: ['Valet', 'Covered']
    },
    {
      icon: Coffee,
      title: 'Refreshments',
      description: 'Complimentary coffee, tea, and refreshments throughout your booking.',
      includes: ['Tea', 'Coffee', 'Snacks']
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">FACILITIES</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Unparalleled Amenities
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Every space comes equipped with premium facilities to ensure your meeting runs flawlessly.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {facilities.map((facility, index) => {
            const Icon = facility.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 text-center"
              >
                {/* Icon */}
                <div className="w-14 h-14 bg-primary-50 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Icon className="w-7 h-7 text-primary-500" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {facility.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {facility.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

