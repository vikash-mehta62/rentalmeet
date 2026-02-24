'use client';

import { Star } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      rating: 5,
      text: '"RentalMeet has transformed how we organize our monthly board meetings. The spaces are top-notch and the booking process is seamless."',
      name: 'Rajesh Kumar',
      position: 'CEO, Techinnova Solutions',
      avatar: '👨‍💼'
    },
    {
      rating: 5,
      text: '"The attention to detail and premium facilities at their venues are unmatched. Highly recommend for any corporate event."',
      name: 'Sneha Sharma',
      position: 'Event Director, Global Connect',
      avatar: '👩‍💼'
    },
    {
      rating: 5,
      text: '"Finding high-quality meeting spaces was always a challenge until we found RentalMeet. Their service is truly professional."',
      name: 'Amit Patel',
      position: 'Founder, Startup Hub',
      avatar: '👨‍💻'
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">TESTIMONIALS</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            What Our Clients Say
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#F89D09] text-[#F89D09]" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                {testimonial.text}
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
