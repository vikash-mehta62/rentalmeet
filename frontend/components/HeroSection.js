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
      <section className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden mt-[102px] bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </section>
    );
  }

  const slide = slides[currentSlide];

  return (
    <section className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden mt-[102px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={slide.image}
          alt={slide.title}
          fill
          className="object-cover transition-opacity duration-500"
          priority
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative h-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
        {/* Main Heading */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
          {slide.title}
          {slide.subtitle && (
            <>
              <br />
              <span className="text-primary-500">{slide.subtitle}</span>
            </>
          )}
        </h1>

        {/* Description */}
        {slide.description && (
          <p className="text-white/90 text-base md:text-lg max-w-2xl mb-8 leading-relaxed px-4 animate-fade-in">
            {slide.description}
          </p>
        )}

        {/* CTA Button */}
        <Link 
          href={slide.buttonLink}
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-md transition-all duration-300 transform hover:scale-105 animate-fade-in"
        >
          {slide.buttonText}
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 8l4 4m0 0l-4 4m4-4H3" 
            />
          </svg>
        </Link>
      </div>

      {/* Navigation Arrows - Only show if multiple slides */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-primary-500 w-8'
                    : 'bg-white/50 hover:bg-white/70'
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


