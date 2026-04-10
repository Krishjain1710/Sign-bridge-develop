import React from 'react';
import { usePanel } from '../contexts/PanelContext';
import { useTranslation } from '../contexts/TranslationContext';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../contexts/ThemeContext';
import HistoryPanel from './HistoryPanel';
import FavoritesPanel from './FavoritesPanel';
import SettingsPanel from './SettingsPanel';
import PhraseBook from './PhraseBook';
import LearningMode from './LearningMode';
import AccessibilityHelp from './AccessibilityHelp';

const PanelRenderer: React.FC = () => {
  const { activePanel, closePanel } = usePanel();
  const { inputText, setInputText, signWriting, history, clearHistory, triggerTranslation } = useTranslation();
  const { favorites, removeFavorite } = useFavorites();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  if (!activePanel) return null;

  switch (activePanel) {
    case 'history':
      return (
        <HistoryPanel
          history={history}
          onReplay={(entry) => {
            setInputText(entry.inputText);
            closePanel();
          }}
          onClear={clearHistory}
          onClose={closePanel}
        />
      );

    case 'favorites':
      return (
        <FavoritesPanel
          favorites={favorites}
          onReplay={(entry) => {
            setInputText(entry.text);
            closePanel();
          }}
          onRemove={removeFavorite}
          onClose={closePanel}
        />
      );

    case 'settings':
      return (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onReset={resetSettings}
          onClose={closePanel}
          currentTheme={theme}
          onThemeChange={(t) => setTheme(t as 'light' | 'dark' | 'high-contrast')}
        />
      );

    case 'phraseBook':
      return (
        <PhraseBook
          onSelectPhrase={(text) => {
            setInputText(text);
            triggerTranslation(text);
            closePanel();
          }}
          onClose={closePanel}
        />
      );

    case 'learningMode':
      if (signWriting.length === 0) return null;
      return (
        <LearningMode
          signWriting={signWriting}
          inputText={inputText}
          onClose={closePanel}
        />
      );

    case 'accessibility':
      return <AccessibilityHelp onClose={closePanel} />;

    default:
      return null;
  }
};

export default PanelRenderer;
