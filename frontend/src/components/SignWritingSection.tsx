import React from 'react';
import SignWritingDisplay from './SignWritingDisplay';

interface SignWritingSectionProps {
  signWriting: string[];
  isGeneratingSigns: boolean;
  onCopyFSW?: () => void;
  onToggleFavorite?: () => void;
  isFavorited?: boolean;
  onOpenLearningMode?: () => void;
}

const SignWritingSection: React.FC<SignWritingSectionProps> = ({ signWriting, isGeneratingSigns, onCopyFSW, onToggleFavorite, isFavorited, onOpenLearningMode }) => (
  <div className="card card-signwriting xl:col-span-3 h-full" role="region" aria-label="SignWriting output">
    <div className="card h-full flex flex-col bg-white dark:bg-theme-secondary shadow-sm sm:shadow-xl hover:shadow-md sm:hover:shadow-2xl transition-all duration-300 border border-theme-input sm:border-0 rounded-2xl sm:rounded-xl p-2 sm:p-6" aria-live="polite">
      <div className="pb-3 sm:pb-6 border-b border-theme-primary">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-xl sm:rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-theme-primary">
              SignWriting
            </h2>
            <p className="text-xs sm:text-xs text-theme-secondary">
              Visual notation system
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 pt-2 sm:pt-6">
        <div className="flex items-center justify-between mb-2 sm:mb-4 px-1 sm:px-2">
          <span className="text-[10px] sm:text-xs font-medium text-theme-secondary">
            {isGeneratingSigns ? 'Processing...' : `${signWriting.length} sign${signWriting.length !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-2">
            {onCopyFSW && (
              <button
                onClick={onCopyFSW}
                className="p-1 rounded hover:bg-theme-secondary transition-colors"
                title="Copy FSW notation"
                aria-label="Copy SignWriting notation"
              >
                <svg className="w-3.5 h-3.5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isGeneratingSigns ? 'bg-warning-500 animate-pulse' : signWriting.length > 0 ? 'bg-success-500' : 'bg-secondary-400'}`}></div>
              <span className="text-[10px] sm:text-xs text-theme-secondary">
                {isGeneratingSigns ? 'Loading' : signWriting.length > 0 ? 'Ready' : 'Empty'}
              </span>
            </div>
          </div>
        </div>
        {isGeneratingSigns ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 loading-spinner mx-auto mb-2 sm:mb-4" style={{borderTopColor: 'var(--purple-500)', borderRightColor: 'var(--purple-500)'}}></div>
              <p className="text-xs sm:text-sm font-medium text-theme-secondary">Processing signs...</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {signWriting.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-theme-secondary mb-1">Your signs will appear here</p>
                <p className="text-xs text-theme-muted">Translate text to see SignWriting notation</p>
              </div>
            ) : (
            <div className="h-full max-h-[350px] overflow-y-auto px-2">
              <div className={signWriting.length === 0 ? 'flex justify-center items-center h-full w-full' : ''}>
                <SignWritingDisplay
                  fswTokens={signWriting.length === 0 ? [] : signWriting}
                  direction="col"
                  className="w-full min-w-0 flex-col overflow-y-auto h-full"
                  signSize={24}
                />
              </div>
            </div>
            <div className="mt-4 px-2">
              <div className="flex items-center justify-center gap-3">
                {onToggleFavorite && (
                  <button
                    onClick={onToggleFavorite}
                    className="flex items-center gap-1 text-xs text-theme-muted hover:text-danger-500 transition-colors"
                    aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg className={`w-4 h-4 ${isFavorited ? 'text-danger-500 fill-current' : ''}`} fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isFavorited ? 'Saved' : 'Save'}
                  </button>
                )}
                {onOpenLearningMode && (
                  <button
                    onClick={onOpenLearningMode}
                    className="flex items-center gap-1 text-xs text-theme-muted hover:text-primary-500 transition-colors"
                    aria-label="Open learning mode"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Learn
                  </button>
                )}
                <p className="text-xs text-theme-muted">
                  Hover for details
                </p>
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default React.memo(SignWritingSection); 