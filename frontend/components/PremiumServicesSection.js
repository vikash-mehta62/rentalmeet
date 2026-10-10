'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Utensils, Sparkles, Camera, Music, Flower2, Truck, Shield,
  Package, Star, MapPin, CheckCircle2, ArrowRight, Building2
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Catering': Utensils,
  'Catering & Food': Utensils,
  'Makeup & Beauty': Sparkles,
  'Photography': Camera,
  'Photography & Video': Camera,
  'Entertainment': Music,
  'Entertainment & Music': Music,
  'Decor & Floral': Flower2,
  'Decoration & Flowers': Flower2,
  'Security': Shield,
  'Security Services': Shield,
  'Celebrity': Package,
  'Logistics & Support': Truck,
  'Event Management': Package,
  'AV & Tech Equipment': Package,
  'Transportation': Truck,
  'Cleaning Services': Package,
  'Other': Package,
};

const CATEGORY_FALLBACK_IMAGES = {
  'Catering': 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
  'Catering & Food': 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
  'Makeup & Beauty': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
  'Photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  'Photography & Video': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  'Entertainment': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  'Entertainment & Music': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  'Decor & Floral': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
  'Decoration & Flowers': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
  'Security': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80',
  'Security Services': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80',
  'Celebrity': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  'Logistics & Support': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
  'Event Management': 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
  'AV & Tech Equipment': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Transportation': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
  'Cleaning Services': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
  'Other': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
};

export default function PremiumServicesSection() {
  const router = useRouter();
  const [vendorServices, setVendorServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor-services?limit=16`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.services)) {
          setVendorServices(d.services);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching vendor services:', err);
        setLoading(false);
      });
  }, []);

  return (
    <section className="py-6 lg:py-8 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-5">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Premium Vendor Services
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Complete Your Event
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Book trusted & verified event professionals for catering, photography, decor, DJ, makeup, and security — all at transparent prices.
          </p>
        </div>

        {/* Actual Vendor Services Grid (4 Columns on Desktop, up to 16 cards max) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-slate-800 rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        ) : vendorServices.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
            <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-2" />
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">No vendor services available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {vendorServices.map((svc) => {
              const Icon = CATEGORY_ICONS[svc.category] || Package;
              const cardImage = svc.featuredImage || svc.images?.[0] || CATEGORY_FALLBACK_IMAGES[svc.category] || '/hero-img.jpg';
              const targetUrl = svc.slug
                ? `/other-services/${svc.slug}`
                : `/other-services/${svc._id}`;
              const companyName = svc.companyName || svc.vendor?.companyName || svc.vendor?.name || 'Verified Vendor';
              const locationText = [svc.city, svc.state].filter(Boolean).join(', ') || 'Available on request';

              return (
                <div
                  key={svc._id}
                  onClick={() => router.push(targetUrl)}
                  className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  {/* Card Image & Badges */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-slate-700">
                    <img
                      src={cardImage}
                      alt={svc.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Top-Left Category Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-[11px] font-semibold text-gray-800 dark:text-slate-100 px-2 py-0.5 rounded-full shadow-sm">
                        <Icon className="h-3 w-3 text-primary-500" />
                        {svc.category}
                      </span>
                    </div>

                    {/* Top-Right Verified Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    </div>

                    {/* Bottom City Overlay */}
                    <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-white text-xs font-medium drop-shadow-sm">
                      <MapPin className="h-3.5 w-3.5 text-primary-400" />
                      <span>{locationText}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Service Title */}
                      <h3 className="font-serif text-sm sm:text-base font-bold text-gray-900 dark:text-slate-100 group-hover:text-primary-500 transition-colors line-clamp-1 mb-1">
                        {svc.title}
                      </h3>

                      {/* Vendor / Company Name */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 mb-2">
                        <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="truncate font-medium">{companyName}</span>
                      </div>
                    </div>

                    {/* Rating & Pricing Row */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 mt-2 flex items-end justify-between">
                      <div>
                        {svc.startingPrice > 0 ? (
                          <>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 block leading-tight">
                              Starting from
                            </span>
                            <div className="text-sm font-bold text-primary-600 dark:text-primary-400">
                              ₹{Number(svc.startingPrice).toLocaleString('en-IN')}{' '}
                              <span className="text-[10px] font-normal text-gray-500">onwards</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                            Price on request
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-bold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{svc.rating ? Number(svc.rating).toFixed(1) : '5.0'}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(targetUrl);
                        }}
                        className="w-full py-1.5 px-3 bg-gray-50 dark:bg-slate-700/50 hover:bg-primary-50 dark:hover:bg-primary-950/30 border border-gray-200 dark:border-slate-600 hover:border-primary-400 text-gray-800 dark:text-slate-200 hover:text-primary-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/other-services')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F59F0A] hover:bg-[#D97706] text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Explore All Vendor Services <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
