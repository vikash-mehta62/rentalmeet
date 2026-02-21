'use client';

import { CheckCircle2 } from 'lucide-react';

export default function PremiumStepper({ steps, currentStep }) {
  return (
    <div className="mb-14">
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-7 left-0 right-0 h-1 bg-gray-200 rounded-full" />
        
        {/* Active Progress Line with Gradient */}
        <div
          className="absolute top-7 left-0 h-1 rounded-full transition-all duration-500 ease-in-out bg-gradient-to-r from-primary-500 to-primary-600"
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
                className="flex flex-col items-center text-center w-full group"
              >
                {/* Circle with Hover Effect */}
                <div
                  className={`w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all duration-300 ease-in-out cursor-pointer ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white hover:scale-110 hover:shadow-xl"
                      : isActive
                      ? "bg-primary-500 border-primary-500 text-white shadow-lg scale-105 hover:shadow-[0_0_25px_rgba(244,160,0,0.4)]"
                      : "bg-white border-gray-300 text-gray-400 hover:border-gray-400 hover:scale-105"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                
                {/* Label with Hover Effect */}
                <span
                  className={`mt-3 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "text-primary-600"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-500 group-hover:text-gray-700"
                  }`}
                >
                  {step.title}
                </span>
                
                {/* Optional: Step Number on Hover */}
                {!isActive && !isCompleted && (
                  <span className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Step {step.number}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
