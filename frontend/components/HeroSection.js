'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroSection() {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000); // Auto-slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [slides.length]);

  const fetchSlides = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hero-slides`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setSlides(data.data);
      } else {
        // Fallback to default slide if no slides found
        setSlides([{
          title: 'Book Your Perfect Venue',
          subtitle: 'With RentalMeet',
          description: 'Premium meeting venues and event spaces for 1-1000 persons, fully equipped with world-class facilities. Book by the hour and experience premium hospitality.',
          image: '/her-img2.jpg',
          buttonText: 'Browse Venues',
          buttonLink: '/venues'
        }]);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
      // Fallback to default slide
      setSlides([{
        title: 'Book Your Perfect Venue',
        subtitle: 'With RentalMeet',
        description: 'Premium meeting venues and event spaces for 1-1000 persons, fully equipped with world-class facilities. Book by the hour and experience premium hospitality.',
        image: '/her-img2.jpg',
        buttonText: 'Browse Venues',
        buttonLink: '/venues'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <section className="relative min-h-[calc(100vh-102px)] w-full overflow-hidden mt-[102px] bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </section>
    );
  }

  const slide = slides[currentSlide];

  return (
    <section className="relative min-h-[calc(100vh-102px)] min-h-[calc(100dvh-102px)] w-full overflow-hidden mt-[102px] flex flex-col justify-center items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={slide.image || '/her-img2.jpg'}
          alt={slide.title || 'RentalMeet Venues'}
          fill
          className="object-cover transition-opacity duration-700"
          priority
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-8 pb-32 sm:pb-36 md:pb-40 flex flex-col items-center">
        <h1
          style={{ fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif" }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight drop-shadow-lg"
        >
          {slide.title || 'Book Your Perfect Venue'}{' '}
          <span style={{ color: '#F59F0A' }}>With RentalMeet</span>
        </h1>
        {slide.description && (
          <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            {slide.description}
          </p>
        )}
      </div>

      {/* Navigation Arrows - Only show if multiple slides */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2.5 rounded-full transition-all duration-300 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2.5 rounded-full transition-all duration-300 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute top-4 right-6 flex gap-1.5 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-primary-500 w-6'
                    : 'bg-white/50 w-2 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}


