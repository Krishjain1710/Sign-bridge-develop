import React from 'react';
import type { AppSettings } from '../hooks/useSettings';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onReset: () => void;
  onClose: () => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdate,
  onReset,
  onClose,
  currentTheme,
  onThemeChange,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card panel-slide-in relative w-full max-w-sm h-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-theme-primary flex-shrink-0">
          <div>
            <h2 id="settings-title" className="text-lg font-bold text-theme-primary">Settings</h2>
            <p className="text-xs text-theme-secondary mt-0.5">Customize your experience</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-theme-secondary transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Theme Section */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3">Appearance</h3>
            <div className="grid grid-cols-3 gap-2">
              {['light', 'dark', 'high-contrast'].map(theme => (
                <button
                  key={theme}
                  onClick={() => onThemeChange(theme)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                    currentTheme === theme
                      ? 'bg-primary-500 text-white'
                      : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
                  }`}
                >
                  {theme === 'high-contrast' ? 'High Contrast' : theme}
                </button>
              ))}
            </div>
          </section>

          {/* Audio Section */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3">Audio</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-theme-secondary mb-1 block">Recording Source</label>
                <div className="flex gap-2">
                  {(['mic', 'system'] as const).map(src => (
                    <button
                      key={src}
                      onClick={() => onUpdate({ recordingSource: src })}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                        settings.recordingSource === src
                          ? 'bg-primary-500 text-white'
                          : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
                      }`}
                    >
                      {src === 'mic' ? 'Microphone' : 'System Audio'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-theme-secondary mb-1 block">
                  Max Recording Time: {Math.floor(settings.maxRecordingTime / 60)}m {settings.maxRecordingTime % 60}s
                </label>
                <input
                  type="range"
                  min={30}
                  max={600}
                  step={30}
                  value={settings.maxRecordingTime}
                  onChange={e => onUpdate({ maxRecordingTime: Number(e.target.value) })}
                  className="w-full accent-primary-500"
                />
              </div>
            </div>
          </section>

          {/* Translation Section */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3">Translation</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-theme-secondary">Auto-translate on punctuation</span>
                <div
                  className={`w-9 h-5 rounded-full transition-colors flex items-center ${
                    settings.autoTranslate ? 'bg-primary-500' : 'bg-secondary-300'
                  }`}
                  onClick={() => onUpdate({ autoTranslate: !settings.autoTranslate })}
                  role="switch"
                  aria-checked={settings.autoTranslate}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                    settings.autoTranslate ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-theme-secondary">Simplify text by default</span>
                <div
                  className={`w-9 h-5 rounded-full transition-colors flex items-center ${
                    settings.simplifyTextDefault ? 'bg-primary-500' : 'bg-secondary-300'
                  }`}
                  onClick={() => onUpdate({ simplifyTextDefault: !settings.simplifyTextDefault })}
                  role="switch"
                  aria-checked={settings.simplifyTextDefault}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                    settings.simplifyTextDefault ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </div>
              </label>
            </div>
          </section>

          {/* Display Section */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3">Display</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-theme-secondary mb-1 block">
                  Sign Size: {settings.signSize}px
                </label>
                <input
                  type="range"
                  min={16}
                  max={64}
                  step={4}
                  value={settings.signSize}
                  onChange={e => onUpdate({ signSize: Number(e.target.value) })}
                  className="w-full accent-primary-500"
                />
              </div>
            </div>
          </section>

          {/* Metrics Section */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3">Developer</h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-theme-secondary">Show performance metrics</span>
              <div
                className={`w-9 h-5 rounded-full transition-colors flex items-center ${
                  settings.showMetrics ? 'bg-primary-500' : 'bg-secondary-300'
                }`}
                onClick={() => onUpdate({ showMetrics: !settings.showMetrics })}
                role="switch"
                aria-checked={settings.showMetrics}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                  settings.showMetrics ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </div>
            </label>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-xs text-theme-secondary">
              <div className="flex justify-between">
                <span>Translate</span>
                <kbd className="px-2 py-0.5 rounded bg-theme-secondary font-mono">Ctrl+Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>Record</span>
                <kbd className="px-2 py-0.5 rounded bg-theme-secondary font-mono">Ctrl+R</kbd>
              </div>
              <div className="flex justify-between">
                <span>Close/Cancel</span>
                <kbd className="px-2 py-0.5 rounded bg-theme-secondary font-mono">Esc</kbd>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-sm font-semibold text-theme-primary mb-3">About</h3>
            <div className="text-xs text-theme-secondary space-y-1">
              <p><span className="font-medium">VocaSign</span> v1.0.0</p>
              <p>AI-Powered Voice-to-Sign Translator</p>
              <p className="text-theme-muted">Edge AI Consumer Utility Application</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-primary flex-shrink-0">
          <button
            onClick={onReset}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
