import React, { useState } from 'react';
import SignBreakdown from './SignBreakdown';
import LearningVideoSection from './LearningVideoSection';

interface LearningModeProps {
  signWriting: string[];
  inputText: string;
  onClose: () => void;
}

const LearningMode: React.FC<LearningModeProps> = ({ signWriting, inputText, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Approximate word-to-sign mapping by splitting input into words
  const words = inputText.trim().split(/\s+/);
  const totalSteps = signWriting.length;

  if (totalSteps === 0) return null;

  const currentToken = signWriting[currentStep];
  // Best-effort word mapping (signs don't always map 1:1 to words)
  const approximateWord = currentStep < words.length ? words[currentStep] : '';

  const isValidFSW = /^[MBLRSW0-9a-fxp.+-]+$/i.test(currentToken);

  const learningTips = [
    { icon: '🪞', text: 'Practice in front of a mirror to check your form.' },
    { icon: '🖐️', text: 'Relax your hands; fluid motion is key to natural signing.' },
    { icon: '🗣️', text: 'Mouth the words while signing to improve clarity.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="relative w-full max-w-lg my-8 rounded-2xl shadow-2xl p-6 flex flex-col"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Learning mode - step by step signs"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-theme-primary">Interactive Tutor</h2>
            <p className="text-xs text-theme-secondary mt-0.5">
              Breaking down: <span className="font-semibold text-primary-600">"{inputText}"</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-theme-secondary transition-colors"
            aria-label="Close learning mode"
          >
            <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* Progress bar */}
          <div className="sticky top-0 bg-inherit pt-1 pb-4 z-10">
            <div className="flex justify-between text-[10px] uppercase font-bold text-theme-muted mb-1 px-1">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-theme-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Current sign display */}
          <div className="flex flex-col items-center justify-center min-h-[180px] py-4 bg-theme-secondary/30 rounded-xl mb-6 border border-theme-tertiary">
            {approximateWord && (
              <div className="mb-4 text-center">
                <span className="text-xs uppercase tracking-widest font-bold text-theme-muted">Signing</span>
                <p className="text-2xl font-bold text-primary-600">
                  {approximateWord}
                </p>
              </div>
            )}
            <div className="transform scale-150 mb-6 py-4">
              {isValidFSW ? (
                <fsw-sign
                  sign={currentToken}
                  style={{
                    direction: 'ltr' as const,
                    display: 'block',
                    color: 'var(--text-primary)',
                    fill: 'var(--text-primary)',
                    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))',
                  }}
                />
              ) : (
                <div className="text-center p-4">
                  <svg className="w-8 h-8 text-theme-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-theme-muted">Animation placeholder</p>
                </div>
              )}
            </div>
            
            <details className="w-full px-6">
              <summary className="text-xs font-bold text-teal-600 cursor-pointer hover:text-teal-700 transition-colors list-none flex items-center justify-center gap-1 uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Symbol Breakdown
              </summary>
              <div className="mt-4 pb-2 border-t border-theme-tertiary pt-4">
                <SignBreakdown fswToken={currentToken} />
              </div>
            </details>
          </div>

          {/* Learning Methods & Resources */}
          <div className="grid grid-cols-1 gap-6 mb-4">
            {/* YouTube Resources */}
            <LearningVideoSection query={approximateWord || inputText} />

            {/* Pro Tips */}
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 dark:bg-primary-900/10 dark:border-primary-900/20">
              <h3 className="text-sm font-bold text-primary-700 dark:text-primary-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Pro Practice Tips
              </h3>
              <ul className="space-y-3">
                {learningTips.map((tip, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-lg leading-none">{tip.icon}</span>
                    <span className="text-xs text-theme-secondary leading-relaxed">
                      {tip.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation - Fixed at bottom */}
        <div className="flex items-center justify-between pt-6 border-t border-theme-tertiary mt-2">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>

          <div className="flex gap-1.5">
            {signWriting.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-primary-500' : 'w-1.5 bg-theme-tertiary hover:bg-theme-secondary'
                }`}
                aria-label={`Go to sign ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1))}
            disabled={currentStep === totalSteps - 1}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 transition-all active:scale-95"
          >
            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningMode;
