'use client';

import { CheckCircle2 } from 'lucide-react';

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-start relative">
        {/* Progress Line Background */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-dark-200 -z-10 mx-12"></div>
        
        {/* Progress Line Active */}
        <div 
          className="absolute top-8 left-0 h-1 bg-gradient-orange transition-all duration-700 ease-out -z-10 mx-12"
          style={{ 
            width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}%)`,
            maxWidth: 'calc(100% - 96px)'
          }}
        ></div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          
          return (
            <div key={step.number} className="flex flex-col items-center flex-1 relative">
              {/* Step Circle */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 ${
                  isCompleted
                    ? 'bg-success text-white shadow-lg scale-100'
                    : isActive
                    ? 'bg-gradient-orange text-white shadow-glow scale-110 ring-4 ring-primary-200'
                    : 'bg-dark-100 text-dark-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-7 h-7 animate-scale-in" strokeWidth={2.5} />
                ) : (
                  <Icon className="w-7 h-7" strokeWidth={2} />
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-3 text-center">
                <span className={`text-xs font-semibold block transition-colors ${
                  isActive 
                    ? 'text-primary-600' 
                    : isCompleted 
                    ? 'text-success' 
                    : 'text-dark-500'
                }`}>
                  {step.title}
                </span>
                
                {/* Step Number Badge */}
                {isActive && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full font-bold animate-pulse-slow">
                    Step {step.number}
                  </span>
                )}
                
                {/* Completed Check */}
                {isCompleted && (
                  <span className="inline-block mt-1 text-xs text-success font-medium">
                    ✓ Done
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

