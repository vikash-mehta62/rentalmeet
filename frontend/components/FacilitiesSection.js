'use client';

import {
  Armchair,
  Projector,
  Wifi,
  UtensilsCrossed,
  Shield,
  Headphones,
  Car,
  Coffee
} from 'lucide-react';

export default function FacilitiesSection() {

  const facilities = [
    {
      icon: Armchair,
      title: 'Ergonomic Seating',
      description:
        'Premium ergonomic chairs designed for comfort during extended meetings.',
      includes: ['Lumbar Support', 'Adjustable Armrest']
    },
    {
      icon: Projector,
      title: 'HD Projection',
      description:
        'State-of-the-art projectors and screens for crystal-clear presentations.',
      includes: ['4K Projector', 'Surround Sound']
    },
    {
      icon: Wifi,
      title: 'High-Speed WiFi',
      description:
        'Blazing-fast internet connectivity for seamless video calls and streaming.',
      includes: ['1Gbps fiber', 'Guest Network']
    },
    {
      icon: UtensilsCrossed,
      title: 'Gourmet Catering',
      description:
        'Professional catering services with customizable menu options.',
      includes: ['Indian', 'Continental', 'Live']
    },
    {
      icon: Shield,
      title: '24/7 Security',
      description:
        'Round-the-clock security personnel and advanced surveillance systems.',
      includes: ['Bouncers', 'CCTV', 'Guards']
    },
    {
      icon: Headphones,
      title: 'Tech Support',
      description:
        'Dedicated technical staff to assist with all your audiovisual needs.',
      includes: ['AV Team', 'Event Crew']
    },
    {
      icon: Car,
      title: 'Ample Parking',
      description:
        'Secure parking facilities with easy access for all attendees.',
      includes: ['Valet', 'Covered']
    },
    {
      icon: Coffee,
      title: 'Refreshments',
      description:
        'Complimentary coffee, tea, and refreshments throughout your booking.',
      includes: ['Tea', 'Coffee', 'Snacks']
    }
  ];

  return (
<section className="py-5 px-4 sm:px-6 bg-[#f9f8f5] dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-4">

          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Facilities
          </p>

           <h2 
className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100"
>
            Unparalleled Amenities
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
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
                className="bg-[#f9f8f5] dark:bg-slate-900 rounded-xl p-4 hover:shadow-md transition-all duration-300 border shadow-sm border-gray-200 dark:border-slate-800 text-center"
              >
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-2 mx-auto">
                  <Icon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-slate-100 mb-1">
                  {facility.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
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



