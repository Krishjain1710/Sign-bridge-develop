import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { usePanel } from '../contexts/PanelContext';

const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ru', label: 'Russian' },
];

const Toolbar: React.FC = () => {
  const { simplifyEnabled, setSimplifyEnabled, inputLanguage, setInputLanguage } = useTranslation();
  const { openPanel } = usePanel();

  return (
    <div className="border-b border-theme-primary bg-theme-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-theme-muted">Language:</label>
            <select
              value={inputLanguage}
              onChange={(e) => setInputLanguage(e.target.value)}
              className="text-sm px-2 py-1 rounded-lg bg-theme-primary border border-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
              aria-label="Input language"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={simplifyEnabled} onChange={(e) => setSimplifyEnabled(e.target.checked)} className="sr-only" />
              <div className={`w-9 h-5 rounded-full transition-colors duration-200 ${simplifyEnabled ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'}`} role="switch" aria-checked={simplifyEnabled}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 mt-0.5 ${simplifyEnabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <span className="text-sm font-medium text-theme-secondary">Simplify</span>
          </label>
          <button onClick={() => openPanel('phraseBook')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-theme-primary border border-theme-primary hover:bg-theme-tertiary transition-all text-sm font-medium text-theme-secondary btn-press">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Phrase Book
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Toolbar);
