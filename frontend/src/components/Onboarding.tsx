import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Speak or Type',
    description: 'Use your microphone or type any text you want translated into sign language.',
    icon: (
      <svg className="w-16 h-16 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: 'See SignWriting',
    description: 'Your words are translated into SignWriting notation — a visual writing system for sign language.',
    icon: (
      <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    title: 'Watch the Animation',
    description: 'See a 3D skeleton animate the signs — showing you exactly how to sign each word.',
    icon: (
      <svg className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-md w-full mx-4 text-center p-8">
        <div className="flex justify-end mb-4">
          <button onClick={onComplete} className="text-sm text-theme-muted hover:text-theme-secondary transition-colors">Skip</button>
        </div>
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-theme-secondary flex items-center justify-center">{step.icon}</div>
        </div>
        <h2 className="text-heading text-theme-primary mb-3">{step.title}</h2>
        <p className="text-body text-theme-secondary mb-8">{step.description}</p>
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? 'bg-teal-500 w-6' : i < currentStep ? 'bg-teal-300' : 'bg-gray-300'}`} />
          ))}
        </div>
        <button onClick={handleNext} className="w-full py-3 rounded-xl gradient-teal text-white font-semibold btn-press transition-all hover:shadow-lg">
          {currentStep < STEPS.length - 1 ? 'Next' : 'Get Started'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
