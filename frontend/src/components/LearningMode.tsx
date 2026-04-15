import React, { useState } from 'react';
import SignBreakdown from './SignBreakdown';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 flex flex-col"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Learning mode - step by step signs"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-theme-primary">Learning Mode</h2>
            <p className="text-xs text-theme-secondary mt-0.5">
              Step {currentStep + 1} of {totalSteps}
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

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-theme-secondary rounded-full mb-6">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Current sign */}
        <div className="flex flex-col items-center justify-center min-h-[200px] mb-6">
          {approximateWord && (
            <p className="text-lg font-semibold text-primary-600 mb-4">
              "{approximateWord}"
            </p>
          )}
          <div className="transform scale-150 mb-4">
            {isValidFSW ? (
              <fsw-sign
                sign={currentToken}
                style={{
                  direction: 'ltr' as const,
                  display: 'block',
                  color: 'var(--text-primary)',
                  fill: 'var(--text-primary)',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))',
                }}
              />
            ) : (
              <p className="text-sm text-theme-muted">Invalid sign token</p>
            )}
          </div>
          <p className="text-xs text-theme-muted font-mono">{currentToken}</p>
          <details className="mt-3">
            <summary className="text-sm text-teal-600 cursor-pointer hover:underline">Show symbol breakdown</summary>
            <div className="mt-2">
              <SignBreakdown fswToken={currentToken} />
            </div>
          </details>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex gap-1">
            {signWriting.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-primary-500' : 'bg-theme-tertiary'
                }`}
                aria-label={`Go to sign ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1))}
            disabled={currentStep === totalSteps - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
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
