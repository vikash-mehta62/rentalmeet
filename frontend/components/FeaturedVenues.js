'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Users, Star, ArrowRight } from 'lucide-react';

export default function FeaturedVenues() {
  const router = useRouter();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedVenues();
  }, []);

  const fetchFeaturedVenues = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues?limit=6`);
      const data = await response.json();
      if (data.success) {
        setVenues(data.venues.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-5 px-4 sm:px-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Our Venues</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 leading-10" style={{ fontFamily: 'Georgia, serif' }}>
              Featured Venues at RentalMeet
            </h2>
            <p className="mt-3 text-sm md:text-base text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
              Discover our handpicked selection of premium venues designed to make every meeting and event exceptional.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-slate-800 rounded-xl h-80 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Our Venues</p>
        <h2 
className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100"
>
Featured Venues at RentalMeet
</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            Discover our handpicked selection of premium venues designed to make every meeting and event exceptional.
          </p>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => {
            const featuredImage = venue.images?.find((img) => img.isFeatured)?.url || venue.images?.[0]?.url || '/hero-img.jpg';
            
            return (
              <div
                key={venue._id}
                onClick={() => router.push(`/venues/${venue.sku}`)}
                className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent dark:border-slate-800"
              >
                {/* Image Container */}
                <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-slate-800">
                  <img
                    src={featuredImage}
                    alt={venue.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Watermark */}
                  <div className="watermark-logo">
                    <img src="/logo.png" alt="" draggable={false} />
                  </div>

                  {/* Capacity Badge */}
                  <div className="absolute top-3 left-3 bg-white dark:bg-slate-900 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                    <Users className="w-3.5 h-3.5 text-gray-800 dark:text-slate-200" />
                    <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                      {venue.capacity} persons
                    </span>
                  </div>

                  {/* Rating Badge */}
                  {(venue.rating > 0 || venue.averageRating > 0) && (
                    <div className="absolute top-3 right-3 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Star className="w-3.5 h-3.5 text-[#F59F0A] fill-[#F59F0A]" />
                      <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                        {(venue.rating || venue.averageRating)?.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Category Label */}
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Meeting Room ({venue.capacity <= 20 ? '11-20' : 
                     venue.capacity <= 40 ? '31-40' : 
                     venue.capacity <= 50 ? '41-50' : 
                     venue.capacity <= 100 ? '50-100' : 
                     venue.capacity <= 200 ? '100-200' : 
                     venue.capacity <= 500 ? '200-500' : 
                     '500-600'} persons)
                  </p>

                  {/* Venue Name */}
                  <h3 className="font-serif text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2 line-clamp-1 group-hover:text-primary-500 transition-colors">
                    {venue.businessName}
                  </h3>

                  {/* Address row */}
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2 line-clamp-1">
                    {[venue.location?.area, venue.location?.city, venue.location?.state].filter(Boolean).join(', ') || venue.location?.address || 'Address not available'}
                  </p>
                  {venue.activeCoupons?.length > 0 && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Save {venue.activeCoupons[0].discountType === 'percentage'
                          ? `${venue.activeCoupons[0].discountValue}%${venue.activeCoupons[0].maxDiscount ? ` (max Rs.${venue.activeCoupons[0].maxDiscount})` : ''}`
                          : `Rs.${venue.activeCoupons[0].discountValue}`} off
                      </span>
                    </div>
                  )}

                  {/* Amenities Icons */}
                  <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                    </svg>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                    </svg>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                    </svg>
                    <span className="text-xs text-gray-500">+13 more</span>
                  </div>

                  {/* Price and Button */}
                  <div className="flex items-end justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Starting from</p>
                      <p className="text-lg font-bold text-[#F59F0A]">
                        {venue.pricing?.perHour?.weekday?.toLocaleString('en-IN') || 0}
                        <span className="text-xs font-normal text-gray-500 dark:text-slate-400"></span>
                      </p>
                    </div>
                    <button className="bg-[#F59F0A] hover:bg-[#D97706] text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 text-sm whitespace-nowrap">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-5">
          <button
            onClick={() => router.push('/venues')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F59F0A] hover:bg-[#D97706] text-white rounded-lg text-sm font-semibold transition-all duration-300"
          >
            View All Venues <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}




