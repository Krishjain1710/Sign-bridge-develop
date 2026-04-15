import { useEffect } from 'react';

interface ShortcutHandlers {
  onTranslate?: () => void;
  onRecord?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({ onTranslate, onRecord, onEscape }: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter → Translate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onTranslate) {
        e.preventDefault();
        onTranslate();
      }

      // Ctrl+R → Record (prevent browser refresh)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && onRecord) {
        e.preventDefault();
        onRecord();
      }

      // Escape → Close modals/recording
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTranslate, onRecord, onEscape]);
}
