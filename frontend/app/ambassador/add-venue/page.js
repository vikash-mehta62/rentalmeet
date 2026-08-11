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
import {
  Building2,
  MapPin,
  Utensils,
  IndianRupee,
  Image,
  FileText,
  CheckCircle2,
  Award,
  Sparkles
} from 'lucide-react';

export default function AmbassadorAddVenuePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { formData } = useVenueFormStore();
  const currentStep = formData.step;

  useEffect(() => {
    if (!token) {
      router.push('/login?role=ambassador');
      return;
    }
  }, [token, router]);

  const steps = [
    { number: 1, title: 'Basic Info', icon: Building2, component: Step1BasicInfo },
    { number: 2, title: 'Location', icon: MapPin, component: Step2Location },
    { number: 3, title: 'Amenities', icon: Utensils, component: Step3Amenities },
    { number: 4, title: 'Pricing', icon: IndianRupee, component: Step4Pricing },
    { number: 5, title: 'Photos', icon: Image, component: Step5Photos },
    { number: 6, title: 'Documents', icon: FileText, component: Step6OwnerDocs },
    { number: 7, title: 'Review & Submit', icon: CheckCircle2, component: Step7Terms },
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Info Strip */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              List &amp; Onboard a New Venue
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Verified listings earn <span className="font-bold text-primary-600">₹100–₹200 instant reward</span> + <span className="font-bold text-amber-600">25% recurring booking profit share</span> for 12 months.
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-700/60 self-start sm:self-auto shadow-xs">
          Step {currentStep} of 7
        </div>
      </div>

      {/* 7-Step Progress Indicators */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto pb-4 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.number;
            const isCurrent = currentStep === s.number;

            return (
              <div key={s.number} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? 'bg-green-500 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 ring-4 ring-primary-100 dark:ring-primary-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="hidden lg:block text-left pr-2">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Step {s.number}</p>
                  <p className={`text-xs font-bold ${isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {s.title}
                  </p>
                </div>
                {s.number < 7 && <div className="hidden sm:block w-4 h-0.5 bg-slate-200 dark:bg-slate-800 mx-1" />}
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
          <CurrentStepComponent />
        </div>
      </div>
    </div>
  );
}
