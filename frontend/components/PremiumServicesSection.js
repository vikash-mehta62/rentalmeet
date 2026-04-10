'use client';

import { useRouter } from 'next/navigation';
import { Utensils, Sparkles, Camera, Music, Flower2, Truck, ArrowRight } from 'lucide-react';

const services = [
  {
    category: 'Catering',
    icon: Utensils,
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80',
    startingPrice: 350,
    unit: 'Per Plate',
    description: 'Multi-cuisine buffets, live counters & welcome drinks for 50–5000 guests.',
    vendors: 8,
    id: 'catering',
  },
  {
    category: 'Photography & Video',
    icon: Camera,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
    startingPrice: 15000,
    unit: 'Per Event',
    description: 'Candid, cinematic & drone photography for weddings and corporate events.',
    vendors: 6,
    id: 'photography',
  },
  {
    category: 'Makeup & Beauty',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
    startingPrice: 3500,
    unit: 'Per Session',
    description: 'HD bridal & party makeup by award-winning artists. On-location available.',
    vendors: 5,
    id: 'makeup',
  },
  {
    category: 'Entertainment',
    icon: Music,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
    startingPrice: 7000,
    unit: 'Per Event',
    description: 'Live bands, DJs, comedians & dance troupes for every occasion.',
    vendors: 9,
    id: 'entertainment',
  },
  {
    category: 'Decor & Floral',
    icon: Flower2,
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80',
    startingPrice: 8000,
    unit: 'Per Event',
    description: 'Theme-based stage, entrance & table décor with fresh floral arrangements.',
    vendors: 7,
    id: 'decor',
  },
  {
    category: 'Logistics & Support',
    icon: Truck,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
    startingPrice: 800,
    unit: 'Per Service',
    description: 'Shuttle, luxury cars, hosts, waiters & bartenders for seamless events.',
    vendors: 4,
    id: 'logistics',
  },
];

export default function PremiumServicesSection() {
  const router = useRouter();

  return (
    <section className="py-14 lg:py-20 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Premium Services
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Complete Your Event
          </h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Book verified vendors for catering, photography, entertainment, decor and more — all in one place.
          </p>
        </div>

        {/* Cards Grid — 1 col mobile, 2 sm, 3 lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.id}
                onClick={() => router.push(`/other-services?category=${svc.id}`)}
                className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-[16/8] overflow-hidden">
                  <img
                    src={svc.image}
                    alt={svc.category}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* Vendor count badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-semibold text-gray-800 dark:text-slate-100 px-2.5 py-1 rounded-full">
                      <Icon className="h-3 w-3 text-primary-500" />
                      {svc.vendors} Vendors
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary-500 flex-shrink-0" />
                    <h3 className="font-serif text-base font-semibold text-gray-900 dark:text-slate-100 group-hover:text-primary-500 transition-colors">
                      {svc.category}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                    {svc.description}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">Starting from</span>
                      <div className="text-base font-bold text-primary-500">
                        ₹{svc.startingPrice.toLocaleString()}
                        <span className="text-xs font-normal text-gray-400 dark:text-slate-500 ml-1">{svc.unit}</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-200 hover:border-primary-500 hover:text-primary-500 transition-all">
                      Explore
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All */}
        <div className="text-center mt-10">
          <button
            onClick={() => router.push('/other-services')}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-200 hover:border-primary-500 hover:text-primary-500 transition-all"
          >
            View All Premium Services <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
