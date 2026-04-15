import React, { useState } from 'react';
import { phraseBook } from '../data/phraseBook';

interface PhraseBookProps {
  onSelectPhrase: (text: string) => void;
  onClose: () => void;
}

const PhraseBook: React.FC<PhraseBookProps> = ({ onSelectPhrase, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(phraseBook[0].id);

  const currentCategory = phraseBook.find(c => c.id === activeCategory) || phraseBook[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg mx-4 max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="phrasebook-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-theme-primary">
          <div>
            <h2 id="phrasebook-title" className="text-lg font-bold text-theme-primary">Quick Phrases</h2>
            <p className="text-xs text-theme-secondary mt-0.5">Tap a phrase to translate instantly</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-theme-secondary transition-colors"
            aria-label="Close phrase book"
          >
            <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 p-3 overflow-x-auto border-b border-theme-primary">
          {phraseBook.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === category.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Phrases Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentCategory.phrases.map(phrase => (
              <button
                key={phrase.id}
                onClick={() => {
                  onSelectPhrase(phrase.text);
                  onClose();
                }}
                className="text-left p-3 rounded-xl border border-theme-primary hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-150 group"
              >
                <span className="text-sm font-medium text-theme-primary group-hover:text-primary-600 transition-colors">
                  {phrase.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhraseBook;
