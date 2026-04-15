import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';

interface StepDef {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const STEPS: StepDef[] = [
  {
    key: 'transcribe',
    label: 'Listen',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    key: 'translate',
    label: 'Translate',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  {
    key: 'signs',
    label: 'Signs',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    key: 'animate',
    label: 'Animate',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const PipelineProgress: React.FC = () => {
  const { loading, errors, pipelineStatus, transcription, signWriting, poseFile } = useTranslation();

  const isAnyActive = Object.values(loading).some(Boolean);
  if (!isAnyActive && pipelineStatus === 'idle') return null;

  const hasTranscription = transcription.trim().length > 0;
  const hasSignWriting = signWriting.length > 0;
  const hasPose = poseFile != null;

  const getStepState = (key: string): 'idle' | 'active' | 'done' | 'error' => {
    if (errors[key as keyof typeof errors]) return 'error';

    switch (key) {
      case 'transcribe':
        if (loading.transcribing) return 'active';
        return hasTranscription ? 'done' : 'idle';
      case 'translate':
        if (loading.translating) return 'active';
        return hasSignWriting ? 'done' : 'idle';
      case 'signs':
        if (loading.generatingSigns) return 'active';
        return hasSignWriting ? 'done' : 'idle';
      case 'animate':
        if (loading.generatingAnimation) return 'active';
        return hasPose ? 'done' : 'idle';
      default:
        return 'idle';
    }
  };

  return (
    <div className="bg-theme-secondary border-b border-theme-primary">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => {
            const state = getStepState(step.key);
            return (
              <React.Fragment key={step.key}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      state === 'active'
                        ? 'bg-teal-500 text-white stage-active'
                        : state === 'done'
                        ? 'bg-teal-500 text-white'
                        : state === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-theme-tertiary text-theme-muted'
                    }`}
                  >
                    {state === 'done' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : state === 'error' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    state === 'active' ? 'text-teal-600' : state === 'done' ? 'text-teal-600' : 'text-theme-muted'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 rounded-full bg-theme-tertiary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        getStepState(STEPS[i + 1].key) !== 'idle' ? 'bg-teal-500 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PipelineProgress);
