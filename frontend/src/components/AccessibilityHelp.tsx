import React from 'react';

interface AccessibilityHelpProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: 'Ctrl + Enter', action: 'Translate current text' },
  { keys: 'Ctrl + R', action: 'Start/stop recording' },
  { keys: 'Escape', action: 'Close active panel' },
];

const AccessibilityHelp: React.FC<AccessibilityHelpProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-lg w-full mx-4 mb-0 sm:mb-0 rounded-b-none sm:rounded-2xl p-6 panel-slide-in max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading text-theme-primary">Keyboard Shortcuts & Help</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-theme-tertiary transition-colors" aria-label="Close help panel">
            <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-theme-secondary mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center justify-between px-3 py-2 rounded-lg bg-theme-secondary">
                <kbd className="px-2 py-1 rounded bg-theme-tertiary text-xs font-mono text-theme-primary">{shortcut.keys}</kbd>
                <span className="text-sm text-theme-secondary">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-theme-secondary mb-3">How VocaSign Works</h3>
          <ol className="space-y-3 text-sm text-theme-secondary">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full gradient-teal text-white text-xs flex items-center justify-center flex-shrink-0">1</span>
              <span><strong>Input:</strong> Speak into your microphone or type text in the input area.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0">2</span>
              <span><strong>Translation:</strong> Your text is translated into SignWriting (FSW) notation for American Sign Language.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center flex-shrink-0">3</span>
              <span><strong>Animation:</strong> A 3D skeleton animation shows you how to sign each word.</span>
            </li>
          </ol>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-theme-secondary mb-3">Accessibility</h3>
          <ul className="space-y-2 text-sm text-theme-secondary">
            <li>All buttons and controls have descriptive labels for screen readers.</li>
            <li>Use Tab to navigate between controls, Enter/Space to activate.</li>
            <li>High contrast theme available in Settings for improved visibility.</li>
            <li>Animation playback can be controlled with on-screen buttons.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityHelp;
