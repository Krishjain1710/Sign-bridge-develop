import { useState, useCallback } from 'react';
import config from '../config';

export interface AppSettings {
  // Audio
  recordingSource: 'mic' | 'system';
  maxRecordingTime: number;

  // Translation
  autoTranslate: boolean;
  simplifyTextDefault: boolean;
  inputLanguage: string;

  // Display
  signSize: number;
  animationFPS: number;

  // Metrics
  showMetrics: boolean;
}

const STORAGE_KEY = 'signbridge-settings';

const DEFAULT_SETTINGS: AppSettings = {
  recordingSource: 'mic',
  maxRecordingTime: config.MAX_RECORDING_TIME,
  autoTranslate: true,
  simplifyTextDefault: false,
  inputLanguage: 'auto',
  signSize: config.DEFAULT_SIGN_SIZE,
  animationFPS: config.ANIMATION_FPS,
  showMetrics: false,
};

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch { /* localStorage unavailable */ }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* localStorage unavailable */ }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { settings, updateSettings, resetSettings };
}
