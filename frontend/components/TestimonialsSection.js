'use client';

import { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default reviews (fallback if no reviews in database)
  const defaultReviews = [
    {
      _id: '1',
      name: 'Rajesh Kumar',
      role: 'CEO, TechSolutions',
      rating: 5,
      description: 'RentalMeet has transformed how we organize our monthly board meetings. The spaces are top-notch and the booking process is seamless.'
    },
    {
      _id: '2',
      name: 'Sneha Sharma',
      role: 'Event Director, Global Connect',
      rating: 5,
      description: 'The attention to detail and premium facilities at their venues are unmatched. Highly recommend for any corporate event.'
    },
    {
      _id: '3',
      name: 'Amit Patel',
      role: 'Founder, Startup Hub',
      rating: 5,
      description: 'Finding high-quality meeting venues was always a challenge until we found RentalMeet. Their service is truly professional.'
    }
  ];

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`);
      const data = await response.json();
      if (data.success && data.reviews.length > 0) {
        setReviews(data.reviews.slice(0, 3)); // Show only first 3
      } else {
        // Use default reviews if no reviews in database
        setReviews(defaultReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Use default reviews on error
      setReviews(defaultReviews);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">TESTIMONIALS</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            What Our Clients Say
          </h2>
          <p className="text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            Hear from our satisfied clients about their experience with RentalMeet
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 relative group border border-transparent dark:border-slate-800"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-12 h-12 text-primary-500" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed mb-6 italic">
                "{review.description}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                {review.profileImage ? (
                  <img
                    src={review.profileImage}
                    alt={review.name}
                    className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">
                      {review.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-slate-100">{review.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-300">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 rounded-full shadow-md border border-transparent dark:border-slate-800">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">👤</span>
                </div>
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Trusted by 500+ clients
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
