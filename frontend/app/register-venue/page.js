'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueFormStore, useAuthStore } from '@/lib/store';
import Step1BasicInfo from '@/components/venue-form/Step1BasicInfo';
import Step2Location from '@/components/venue-form/Step2Location';
import Step3Amenities from '@/components/venue-form/Step3Amenities';
import Step4Pricing from '@/components/venue-form/Step4Pricing';
import Step5Photos from '@/components/venue-form/Step5Photos';
import Step6OwnerDocs from '@/components/venue-form/Step6OwnerDocs';
import Step7Terms from '@/components/venue-form/Step7Terms';
import { Building2, MapPin, Utensils, IndianRupee, Image, FileText, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function RegisterVenue() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { formData } = useVenueFormStore();
  const currentStep = formData.step;

  // Protect route - only logged-in owners can access
  useEffect(() => {
    if (!token) {
      alert('Please login first to register your venue');
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'owner') {
      alert('Only venue owners can register venues');
      router.push('/');
      return;
    }
  }, [token, user, router]);

  const steps = [
    { number: 1, title: 'Basic Info', icon: Building2, component: Step1BasicInfo },
    { number: 2, title: 'Location', icon: MapPin, component: Step2Location },
    { number: 3, title: 'Amenities', icon: Utensils, component: Step3Amenities },
    { number: 4, title: 'Pricing', icon: IndianRupee, component: Step4Pricing },
    { number: 5, title: 'Photos', icon: Image, component: Step5Photos },
    { number: 6, title: 'Documents', icon: FileText, component: Step6OwnerDocs },
    { number: 7, title: 'Terms', icon: CheckCircle2, component: Step7Terms },
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Header */}
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 animate-slide-up border border-gray-100">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-dark-800 mb-3">
              Register Your <span className="gradient-text">Venue</span>
            </h1>
            <p className="text-lg text-gray-600">Complete all steps to list your venue on RentalMeet</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-14">
            <div className="relative">
              {/* Background Line */}
              <div className="absolute top-7 left-0 right-0 h-1 bg-gray-200 rounded-full" />
              
              {/* Active Progress Line */}
              <div
                className="absolute top-7 left-0 h-1 bg-primary-500 rounded-full transition-all duration-500 ease-in-out"
                style={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
              />
              
              <div className="relative flex justify-between">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isCompleted = currentStep > step.number;
                  const isActive = currentStep === step.number;
                  
                  return (
                    <div
                      key={step.number}
                      className="flex flex-col items-center text-center w-full"
                    >
                      {/* Circle */}
                      <div
                        className={`w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all duration-300 ease-in-out ${
                          isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : isActive
                            ? "bg-primary-500 border-primary-500 text-white shadow-lg scale-105"
                            : "bg-white border-gray-300 text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      
                      {/* Label */}
                      <span
                        className={`mt-3 text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? "text-primary-600"
                            : isCompleted
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step Info Card */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-dark-800">
                  Step {currentStep}: {steps[currentStep - 1].title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in all required details to continue
                </p>
              </div>
              
              <div className="bg-primary-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                {currentStep} / {steps.length}
              </div>
            </div>
          </div>

          {/* Current Step Form */}
          <div className="animate-fade-in">
            <CurrentStepComponent />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Need help? Contact us at{' '}
            <a href="mailto:venues@rentalmeet.com" className="text-primary-500 font-semibold hover:underline">
              venues@rentalmeet.com
            </a>
            {' '}or call{' '}
            <a href="tel:07554545348" className="text-primary-500 font-semibold hover:underline">
              0755-4545348
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
