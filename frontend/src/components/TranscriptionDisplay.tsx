import React from 'react';

interface TranscriptionDisplayProps {
  transcription: string;
  onCopy?: () => void;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ transcription, onCopy }) => {
  if (!transcription) return null;
  return (
    <div className="mt-6 animate-fade-in hidden sm:block">
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-primary-800 font-medium mb-1">Transcription</p>
            <p className="text-primary-700 text-sm">{transcription}</p>
          </div>
          {onCopy && (
            <button
              onClick={onCopy}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-primary-100 transition-colors"
              title="Copy transcription"
              aria-label="Copy transcription text"
            >
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionDisplay;
