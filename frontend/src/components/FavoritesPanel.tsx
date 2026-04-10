import React from 'react';
import { type FavoriteEntry } from '../hooks/useFavorites';

interface FavoritesPanelProps {
  favorites: FavoriteEntry[];
  onReplay: (entry: FavoriteEntry) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ favorites, onReplay, onRemove, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card panel-slide-in relative w-full max-w-sm h-full max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-theme-primary">
          <div>
            <h2 id="favorites-title" className="text-lg font-bold text-theme-primary">Favorites</h2>
            <p className="text-xs text-theme-secondary mt-0.5">{favorites.length} saved translation{favorites.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-theme-secondary transition-colors"
            aria-label="Close favorites"
          >
            <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <svg className="w-12 h-12 text-theme-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-sm text-theme-secondary">No favorites yet</p>
              <p className="text-xs text-theme-muted mt-1">Star translations to save them here</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {favorites.map(entry => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl border border-theme-primary hover:border-primary-300 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button
                      onClick={() => {
                        onReplay(entry);
                        onClose();
                      }}
                      className="text-left flex-1"
                    >
                      <p className="text-sm font-medium text-theme-primary line-clamp-2 hover:text-primary-500 transition-colors">
                        {entry.text}
                      </p>
                    </button>
                    <button
                      onClick={() => onRemove(entry.id)}
                      className="flex-shrink-0 p-1 rounded hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                      aria-label="Remove from favorites"
                    >
                      <svg className="w-4 h-4 text-danger-400 hover:text-danger-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-theme-secondary">
                    {entry.signWriting.length} sign{entry.signWriting.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPanel;
