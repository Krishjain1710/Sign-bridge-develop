import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import ApiService from '../services/ApiService';
import { useToast } from './ToastContext';
import { useTranslationHistory } from '../hooks/useTranslationHistory';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';

interface LoadingStates {
  transcribing: boolean;
  simplifying: boolean;
  translating: boolean;
  generatingSigns: boolean;
  generatingAnimation: boolean;
}

interface StageErrors {
  transcribe?: string;
  simplify?: string;
  translate?: string;
  pose?: string;
}

type PipelineStatus = 'idle' | 'running' | 'complete' | 'partial-error';

interface TranslationContextValue {
  inputText: string;
  setInputText: (text: string) => void;
  transcription: string;
  signWriting: string[];
  poseFile: Blob | null;
  loading: LoadingStates;
  errors: StageErrors;
  pipelineStatus: PipelineStatus;
  simplifyEnabled: boolean;
  setSimplifyEnabled: (v: boolean) => void;
  inputLanguage: string;
  setInputLanguage: (lang: string) => void;
  triggerTranslation: (text: string) => Promise<void>;
  handleRecordComplete: (audioBlob: Blob) => Promise<void>;
  handleSimplifyAndTranslate: () => Promise<{ original: string; simplified: string } | null>;
  cancelTranslation: () => void;
  retryStage: (stage: keyof StageErrors) => void;
  history: ReturnType<typeof useTranslationHistory>['history'];
  addHistoryEntry: ReturnType<typeof useTranslationHistory>['addEntry'];
  clearHistory: ReturnType<typeof useTranslationHistory>['clearHistory'];
  metrics: ReturnType<typeof usePerformanceMetrics>['metrics'];
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inputText, setInputText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [signWriting, setSignWriting] = useState<string[]>([]);
  const [poseFile, setPoseFile] = useState<Blob | null>(null);
  const [simplifyEnabled, setSimplifyEnabled] = useState(false);
  const [inputLanguage, setInputLanguage] = useState('auto');
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('idle');

  const [loading, setLoading] = useState<LoadingStates>({
    transcribing: false,
    simplifying: false,
    translating: false,
    generatingSigns: false,
    generatingAnimation: false,
  });

  const [errors, setErrors] = useState<StageErrors>({});

  const abortRef = useRef<AbortController | null>(null);
  const lastTextRef = useRef<string>('');

  const { addToast } = useToast();
  const { history, addEntry: addHistoryEntry, clearHistory } = useTranslationHistory();
  const { metrics, startTimer, endTimer, setPipelineTime } = usePerformanceMetrics();

  const setLoadingField = useCallback((field: keyof LoadingStates, value: boolean) => {
    setLoading(prev => ({ ...prev, [field]: value }));
  }, []);

  const setErrorField = useCallback((field: keyof StageErrors, value: string | undefined) => {
    setErrors(prev => ({ ...prev, [field]: value }));
  }, []);

  const cancelTranslation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const triggerTranslation = useCallback(async (text: string) => {
    cancelTranslation();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    lastTextRef.current = text;
    setTranscription(text);
    setSignWriting([]);
    setPoseFile(null);
    setErrors({});
    setPipelineStatus('running');
    setLoading({
      transcribing: false,
      simplifying: false,
      translating: true,
      generatingSigns: true,
      generatingAnimation: true,
    });

    const pipelineStart = performance.now();
    let hasError = false;

    try {
      let textToTranslate = text;

      if (simplifyEnabled) {
        setLoadingField('simplifying', true);
        try {
          startTimer('simplify');
          const res = await ApiService.simplifyText(text, signal);
          endTimer('simplify');
          textToTranslate = res.simplified_text || text;
          if (res.warning) {
            addToast(res.warning, 'info', 3000);
          }
        } catch (err) {
          if (signal.aborted) return;
          const detail = err instanceof Error ? err.message : String(err);
          console.error('[simplify] failed:', err);
          setErrorField('simplify', `Simplification failed: ${detail}`);
          addToast(`Simplify failed: ${detail}`, 'error', 5000);
          hasError = true;
        } finally {
          setLoadingField('simplifying', false);
        }
      }

      if (signal.aborted) return;

      try {
        startTimer('translate');
        const translateRes = await ApiService.translateSignWriting(textToTranslate, signal);
        endTimer('translate');
        const rawFsw = translateRes.signwriting || '';
        const fswTokens = rawFsw.trim().split(/\s+/).filter(t => t.length > 0);
        setSignWriting(fswTokens);
        setLoadingField('generatingSigns', false);
        addHistoryEntry(text, fswTokens);

        if (signal.aborted) return;

        if (fswTokens.length > 0) {
          try {
            startTimer('pose');
            const poseRes = await ApiService.generatePose(fswTokens.join(' '), signal);
            endTimer('pose');
            const { pose_data, data_format } = poseRes;
            if (data_format === 'binary_base64' && pose_data) {
              const binary = atob(pose_data);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              setPoseFile(new Blob([bytes], { type: 'application/octet-stream' }));
            }
          } catch (err) {
            if (signal.aborted) return;
            const detail = err instanceof Error ? err.message : String(err);
            console.error('[pose] failed:', err);
            setErrorField('pose', `Animation generation failed: ${detail}`);
            addToast(`Animation failed: ${detail}`, 'error', 5000);
            hasError = true;
          }
        }
      } catch (err) {
        if (signal.aborted) return;
        const detail = err instanceof Error ? err.message : String(err);
        console.error('[translate] failed:', err);
        setErrorField('translate', `SignWriting translation failed: ${detail}`);
        addToast(`Translate failed: ${detail}`, 'error', 5000);
        hasError = true;
      }

      setLoadingField('generatingAnimation', false);
      setPipelineTime(Math.round(performance.now() - pipelineStart));
      setPipelineStatus(hasError ? 'partial-error' : 'complete');
      if (!hasError) {
        addToast('Translation complete', 'success', 2000);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setPipelineStatus('partial-error');
    } finally {
      setLoading({
        transcribing: false,
        simplifying: false,
        translating: false,
        generatingSigns: false,
        generatingAnimation: false,
      });
    }
  }, [simplifyEnabled, cancelTranslation, addToast, addHistoryEntry, startTimer, endTimer, setPipelineTime, setLoadingField, setErrorField]);

  const handleRecordComplete = useCallback(async (audioBlob: Blob) => {
    setLoadingField('transcribing', true);
    setErrors({});
    setInputText('');
    setSignWriting([]);
    setPoseFile(null);
    setTranscription('');

    try {
      startTimer('transcribe');
      const res = await ApiService.transcribe(audioBlob, inputLanguage !== 'auto' ? inputLanguage : undefined);
      endTimer('transcribe');
      const text = res.text || '';
      setInputText(text);
      setLoadingField('transcribing', false);
      addToast('Transcription complete', 'success', 2000);
      await triggerTranslation(text);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error('[transcribe] failed:', err);
      setErrorField('transcribe', `Transcription failed: ${detail}`);
      addToast(`Transcription failed: ${detail}`, 'error', 5000);
      setLoadingField('transcribing', false);
    }
  }, [triggerTranslation, inputLanguage, addToast, startTimer, endTimer, setLoadingField, setErrorField]);

  const handleSimplifyAndTranslate = useCallback(async () => {
    try {
      const res = await ApiService.simplifyText(inputText);
      return { original: inputText, simplified: res.simplified_text || inputText };
    } catch {
      addToast('Failed to simplify text', 'error');
      return null;
    }
  }, [inputText, addToast]);

  const retryStage = useCallback((stage: keyof StageErrors) => {
    setErrorField(stage, undefined);
    if (stage === 'translate' || stage === 'simplify') {
      triggerTranslation(lastTextRef.current);
    } else if (stage === 'pose' && signWriting.length > 0) {
      cancelTranslation();
      const controller = new AbortController();
      abortRef.current = controller;
      (async () => {
        setLoadingField('generatingAnimation', true);
        try {
          const poseRes = await ApiService.generatePose(signWriting.join(' '), controller.signal);
          if (controller.signal.aborted) return;
          const { pose_data, data_format } = poseRes;
          if (data_format === 'binary_base64' && pose_data) {
            const binary = atob(pose_data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            setPoseFile(new Blob([bytes], { type: 'application/octet-stream' }));
          }
          setPipelineStatus('complete');
        } catch {
          if (controller.signal.aborted) return;
          setErrorField('pose', 'Animation generation failed');
        } finally {
          setLoadingField('generatingAnimation', false);
        }
      })();
    }
  }, [signWriting, triggerTranslation, cancelTranslation, setLoadingField, setErrorField]);

  return (
    <TranslationContext.Provider
      value={{
        inputText, setInputText,
        transcription, signWriting, poseFile,
        loading, errors, pipelineStatus,
        simplifyEnabled, setSimplifyEnabled,
        inputLanguage, setInputLanguage,
        triggerTranslation, handleRecordComplete,
        handleSimplifyAndTranslate, cancelTranslation, retryStage,
        history, addHistoryEntry, clearHistory,
        metrics,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider');
  return ctx;
}
