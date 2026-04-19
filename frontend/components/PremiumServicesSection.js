'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Utensils, Sparkles, Camera, Music, Flower2, Truck, Shield, Package, ArrowRight } from 'lucide-react';

const CATEGORY_ICONS = {
  'Catering & Food': Utensils,
  'Photography & Video': Camera,
  'Decoration & Flowers': Flower2,
  'Entertainment & Music': Music,
  'Event Management': Package,
  'AV & Tech Equipment': Package,
  'Transportation': Truck,
  'Security Services': Shield,
  'Cleaning Services': Package,
  'Other': Package,
};

const CATEGORY_IMAGES = {
  'Catering & Food': 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80',
  'Photography & Video': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
  'Decoration & Flowers': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80',
  'Entertainment & Music': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
  'Event Management': 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
  'AV & Tech Equipment': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Transportation': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
  'Security Services': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&q=80',
  'Cleaning Services': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
  'Other': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
};

export default function PremiumServicesSection() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor-services/categories`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.categories?.length) {
          setCategories(d.categories.slice(0, 6));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fallback static if no services yet
  const fallback = [
    { category: 'Catering & Food', vendors: 8, minPrice: 350 },
    { category: 'Photography & Video', vendors: 6, minPrice: 15000 },
    { category: 'Decoration & Flowers', vendors: 7, minPrice: 8000 },
    { category: 'Entertainment & Music', vendors: 9, minPrice: 7000 },
    { category: 'Event Management', vendors: 5, minPrice: 10000 },
    { category: 'Transportation', vendors: 4, minPrice: 800 },
  ];

  const display = categories;

  return (
    <section className="py-5 lg:py-5 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-4">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Premium Services
          </p>
          <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Complete Your Event
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Book verified vendors for catering, photography, entertainment, decor and more — all in one place.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-200 dark:bg-slate-800 rounded-xl h-52 animate-pulse" />
            ))}
          </div>
        ) : display.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No services available yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {display.map((svc) => {
              const Icon = CATEGORY_ICONS[svc.category] || Package;
              const image = svc.featuredImage || CATEGORY_IMAGES[svc.category] || CATEGORY_IMAGES['Other'];
              const categoryId = svc.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '').replace(/--/g, '-');
              return (
                <div
                  key={svc.category}
                  onClick={() => router.push(`/other-services?category=${encodeURIComponent(svc.category)}`)}
                  className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-[16/8] overflow-hidden">
                    <img src={image} alt={svc.category} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-semibold text-gray-800 dark:text-slate-100 px-2.5 py-1 rounded-full">
                        <Icon className="h-3 w-3 text-primary-500" />
                        {svc.vendors} Vendor{svc.vendors !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-primary-500 flex-shrink-0" />
                      <h3 className="font-serif text-base font-semibold text-gray-900 dark:text-slate-100 group-hover:text-primary-500 transition-colors">
                        {svc.category}
                      </h3>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        {svc.minPrice > 0 && (
                          <>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500">Starting from</span>
                            <div className="text-base font-bold text-primary-500">
                              ₹{svc.minPrice.toLocaleString('en-IN')}
                            </div>
                          </>
                        )}
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
        )}

        <div className="text-center mt-5">
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
