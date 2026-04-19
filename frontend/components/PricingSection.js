'use client';

import { Clock, Shield, Headphones, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PricingSection() {
  const router = useRouter();

  const pricingPlans = [
    {
      duration: '1 Hour',
      priceRange: 'Rs.1,000 - Rs.5,000',
      description: 'Based on venues size and facilities',
      popular: false
    },
    {
      duration: '2 Hours',
      priceRange: 'Rs.1,800 - Rs.9,000',
      description: 'Based on venues size and facilities',
      popular: false
    },
    {
      duration: '4 Hours',
      priceRange: 'Rs.3,000 - Rs.15,000',
      description: 'Based on venues size and facilities',
      popular: true
    },
    {
      duration: 'Full Day',
      priceRange: 'Rs.6,000 - Rs.30,000',
      description: 'Based on venues size and facilities',
      popular: false
    }
  ];

  const whyChooseUs = [
    {
      icon: Shield,
      title: 'Premium Security',
      description: 'State-of-the-art security systems and personnel ensure complete safety for your events.'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Our dedicated team is available around the clock to assist with any requirements.'
    },
    {
      icon: CheckCircle,
      title: 'Instant Booking',
      description: 'Quick and easy online booking with instant confirmation for your convenience.'
    }
  ];

  return (
    <>
      {/* Pricing Section */}
      <section className="py-5 px-4 sm:px-6 bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pricing</p>
        <h2 
className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100"
>              Exclusive Packages
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
              Flexible pricing options tailored to your needs. Choose the duration that works best for you.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white dark:bg-slate-900 rounded-xl p-6 transition-all duration-300 border border-transparent dark:border-slate-800 ${
                  plan.popular
                    ? 'border-2 border-[#F59F0A] shadow-lg scale-105'
                    : 'border border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Most Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#F59F0A] text-white text-xs font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-[#FFFBEB] rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#F59F0A]" />
                  </div>
                </div>

                {/* Duration */}
                <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-slate-100 text-center mb-3">
                  {plan.duration}
                </h3>

                {/* Price Range */}
                <p className="text-2xl font-bold text-[#F59F0A] text-center mb-2">
                  {plan.priceRange}
                </p>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-slate-300 text-center mb-4">
                  {plan.description}
                </p>

                {/* Book Now Button */}
                <button
                  onClick={() => router.push('/venues')}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-[#F59F0A] text-white hover:bg-[#D97706]'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-[#F59F0A] hover:text-[#F59F0A]'
                  }`}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-5 px-4 sm:px-6 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Why Choose Us</p>
        <h2 
className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100"
>              Trusted by Professionals
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {whyChooseUs.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center"
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-[#FFFBEB] rounded-full flex items-center justify-center">
                      <Icon className="w-8 h-8 text-[#F59F0A]" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-slate-100 mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}




