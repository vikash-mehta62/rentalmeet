'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVenueFormStore, useAuthStore } from '@/lib/store';
import Step1BasicInfo from '@/components/venue-form/Step1BasicInfo';
import Step2Location from '@/components/venue-form/Step2Location';
import Step3Amenities from '@/components/venue-form/Step3Amenities';
import Step4Pricing from '@/components/venue-form/Step4Pricing';
import Step5Photos from '@/components/venue-form/Step5Photos';
import Step6OwnerDocs from '@/components/venue-form/Step6OwnerDocs';
import Step7Terms from '@/components/venue-form/Step7Terms';
import { Building2, MapPin, Utensils, IndianRupee, Image, FileText, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditVenue() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { formData, setFormData, resetForm } = useVenueFormStore();
  const currentStep = formData.step;

  // Fetch venue data and populate form
  useEffect(() => {
    if (!token) {
      alert('Please login first');
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'owner') {
      alert('Only venue owners can edit venues');
      router.push('/');
      return;
    }

    if (params.id) {
      fetchVenueData();
    }
  }, [token, user, params.id, router]);

  const fetchVenueData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/venues/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch venue');

      const venue = await response.json();
      
      // Populate form with existing venue data
      setFormData({
        ...formData,
        venueId: venue._id, // Store venue ID for update
        businessName: venue.businessName || '',
        venueType: venue.venueType || [],
        description: venue.description || '',
        capacity: venue.capacity || '',
        areaSqft: venue.areaSqft || '',
        location: venue.location || formData.location,
        amenities: venue.amenities || formData.amenities,
        pricing: venue.pricing || formData.pricing,
        availability: venue.availability || formData.availability,
        images: venue.images || [],
        documents: venue.documents || formData.documents,
        isEditMode: true // Flag to indicate edit mode
      });
    } catch (error) {
      toast.error('Failed to load venue data');
      console.error(error);
      router.push('/owner/dashboard');
    }
  };

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

  if (!formData.venueId && params.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-soft sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/owner/dashboard" className="flex items-center space-x-2 group">
              <ArrowLeft className="w-5 h-5 text-dark-600 group-hover:text-primary-500 transition-colors" />
              <span className="text-dark-600 group-hover:text-primary-500 font-medium transition-colors">Back to Dashboard</span>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-orange rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold font-heading text-dark-700">
                Rental<span className="text-primary-500">Meet</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 animate-slide-up border border-gray-100">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-dark-800 mb-3">
              Edit Your <span className="gradient-text">Venue</span>
            </h1>
            <p className="text-lg text-gray-600">Update your venue details</p>
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
                  Update the details as needed
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
              0755-4545-348
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
