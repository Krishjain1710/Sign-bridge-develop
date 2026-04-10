import React from 'react';
import { type HistoryEntry } from '../hooks/useTranslationHistory';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onReplay: (entry: HistoryEntry) => void;
  onClear: () => void;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onReplay, onClear, onClose }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      {/* Panel */}
      <div
        className="card panel-slide-in relative w-full max-w-sm h-full max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-theme-primary">
          <div>
            <h2 id="history-title" className="text-lg font-bold text-theme-primary">Translation History</h2>
            <p className="text-xs text-theme-secondary mt-0.5">{history.length} translation{history.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs px-3 py-1.5 rounded-lg text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-theme-secondary transition-colors"
              aria-label="Close history"
            >
              <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <svg className="w-12 h-12 text-theme-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-theme-secondary">No translations yet</p>
              <p className="text-xs text-theme-muted mt-1">Your translations will appear here</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {history.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => {
                    onReplay(entry);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-xl border border-theme-primary hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-theme-primary line-clamp-2">
                      {entry.inputText}
                    </p>
                    <span className="text-[10px] text-theme-muted whitespace-nowrap flex-shrink-0">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-theme-secondary">
                    {entry.signWriting.length} sign{entry.signWriting.length !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
