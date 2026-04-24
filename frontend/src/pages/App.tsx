import React, { useState, useCallback } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { usePanel } from '../contexts/PanelContext';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';
import Toolbar from '../components/Toolbar';
import InputSection from '../components/InputSection';
import SignWritingSection from '../components/SignWritingSection';
import AnimationSection from '../components/AnimationSection';
import TranscriptionDisplay from '../components/TranscriptionDisplay';
import PipelineProgress from '../components/PipelineProgress';
import PanelRenderer from '../components/PanelRenderer';
import SimplifyChoiceModal from '../components/SimplifyChoiceModal';
import AudioRecorder from '../components/AudioRecorder';
import MetricsOverlay from '../components/MetricsOverlay';
import ToastContainer from '../components/Toast';
import Onboarding from '../components/Onboarding';
import { useOnboarding } from '../hooks/useOnboarding';
import '../index.css';

function App() {
  const translation = useTranslation();
  const { activePanel, closePanel, openPanel } = usePanel();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { settings } = useSettings();
  const { isComplete: onboardingComplete, complete: completeOnboarding } = useOnboarding();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSource, setRecordingSource] = useState<'mic' | 'system'>('mic');
  const [showSimplifyModal, setShowSimplifyModal] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState('');
  const [pendingOriginalText, setPendingOriginalText] = useState('');

  const handleSimplifyAndTranslate = useCallback(async () => {
    const result = await translation.handleSimplifyAndTranslate();
    if (result) {
      setSimplifiedText(result.simplified);
      setPendingOriginalText(result.original);
      setShowSimplifyModal(true);
    }
  }, [translation]);

  const handleSimplifyModalSelect = useCallback((choice: 'original' | 'simplified') => {
    setShowSimplifyModal(false);
    const text = choice === 'simplified' ? simplifiedText : pendingOriginalText;
    translation.setInputText(text);
    translation.triggerTranslation(text);
  }, [simplifiedText, pendingOriginalText, translation]);

  const handleToggleFavorite = useCallback(() => {
    if (!translation.inputText.trim() || translation.signWriting.length === 0) return;
    if (isFavorite(translation.inputText)) {
      const fav = favorites.find(f => f.text === translation.inputText);
      if (fav) removeFavorite(fav.id);
    } else {
      addFavorite(translation.inputText, translation.signWriting);
    }
  }, [translation.inputText, translation.signWriting, isFavorite, addFavorite, removeFavorite, favorites]);

  useKeyboardShortcuts({
    onTranslate: translation.inputText.trim() ? () => {
      if (translation.simplifyEnabled) handleSimplifyAndTranslate();
      else translation.triggerTranslation(translation.inputText);
    } : undefined,
    onRecord: () => setIsRecording(prev => !prev),
    onEscape: () => {
      if (isRecording) setIsRecording(false);
      else if (showSimplifyModal) setShowSimplifyModal(false);
      else if (activePanel) closePanel();
    },
  });

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen transition-all duration-300">
      <Header />
      <Toolbar />
      <PipelineProgress />

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
          <ErrorBoundary fallbackMessage="Input section encountered an error">
            <InputSection
              inputText={translation.inputText}
              setInputText={translation.setInputText}
              isTranscribing={translation.loading.transcribing}
              isRecording={isRecording}
              handleRecordClick={() => setIsRecording(prev => !prev)}
              handleSimplifyAndTranslate={handleSimplifyAndTranslate}
              triggerTranslation={translation.triggerTranslation}
              simplifyText={translation.simplifyEnabled}
              isTranslating={translation.loading.translating}
              onCopy={translation.inputText.trim() ? () => copyToClipboard(translation.inputText) : undefined}
              onOpenPhraseBook={() => openPanel('phraseBook')}
            />
          </ErrorBoundary>

          <ErrorBoundary fallbackMessage="SignWriting section encountered an error">
            <SignWritingSection
              signWriting={translation.signWriting}
              isGeneratingSigns={translation.loading.generatingSigns}
              onCopyFSW={translation.signWriting.length > 0 ? () => copyToClipboard(translation.signWriting.join(' ')) : undefined}
              onToggleFavorite={translation.signWriting.length > 0 ? handleToggleFavorite : undefined}
              isFavorited={isFavorite(translation.inputText)}
              onOpenLearningMode={translation.signWriting.length > 0 ? () => {} : undefined}
            />
          </ErrorBoundary>

          <ErrorBoundary fallbackMessage="Animation section encountered an error">
            <AnimationSection
              poseFile={translation.poseFile}
              isGeneratingAnimation={translation.loading.generatingAnimation}
            />
          </ErrorBoundary>
        </div>
        <div className="mt-6 relative z-10">
          <TranscriptionDisplay
            transcription={translation.transcription}
            onCopy={translation.transcription ? () => copyToClipboard(translation.transcription) : undefined}
          />
        </div>
        {showSimplifyModal && (
          <SimplifyChoiceModal
            original={pendingOriginalText}
            simplified={simplifiedText}
            onSelect={handleSimplifyModalSelect}
            onClose={() => setShowSimplifyModal(false)}
          />
        )}
      </main>

      {isRecording && (
        <AudioRecorder
          onRecordingComplete={(blob) => {
            setIsRecording(false);
            translation.handleRecordComplete(blob);
          }}
          recordingSource={recordingSource}
          setRecordingSource={setRecordingSource}
          onClose={() => setIsRecording(false)}
        />
      )}

      <PanelRenderer />
      <MetricsOverlay metrics={translation.metrics} visible={settings.showMetrics} />
      <ToastContainer />
      {!onboardingComplete && <Onboarding onComplete={completeOnboarding} />}
    </div>
  );
}

export default App;
