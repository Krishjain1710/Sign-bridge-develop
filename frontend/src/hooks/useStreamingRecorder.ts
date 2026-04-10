import { useState, useCallback, useRef } from 'react';
import ApiService from '../services/ApiService';

interface StreamingRecorderOptions {
  language?: string;
  onTranscriptionUpdate: (text: string) => void;
  onSentenceComplete: (sentence: string) => void;
  chunkDurationMs?: number;
}

export function useStreamingRecorder({
  language,
  onTranscriptionUpdate,
  onSentenceComplete,
  chunkDurationMs = 3000,
}: StreamingRecorderOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const accumulatedTextRef = useRef('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processChunk = useCallback(async (blob: Blob) => {
    if (blob.size < 1000) return;

    try {
      const res = await ApiService.transcribe(blob, language !== 'auto' ? language : undefined);
      const newText = res.text?.trim();
      if (!newText) return;

      accumulatedTextRef.current += (accumulatedTextRef.current ? ' ' : '') + newText;
      onTranscriptionUpdate(accumulatedTextRef.current);

      if (/[.!?]$/.test(newText)) {
        onSentenceComplete(accumulatedTextRef.current);
        accumulatedTextRef.current = '';
      }
    } catch {
      // Ignore chunk errors — next chunk will pick up
    }
  }, [language, onTranscriptionUpdate, onSentenceComplete]);

  const startStreaming = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      accumulatedTextRef.current = '';

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          processChunk(e.data);
        }
      };

      recorder.start(chunkDurationMs);
      setIsStreaming(true);
    } catch {
      setIsStreaming(false);
    }
  }, [chunkDurationMs, processChunk]);

  const stopStreaming = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    setIsStreaming(false);

    if (accumulatedTextRef.current.trim()) {
      onSentenceComplete(accumulatedTextRef.current);
      accumulatedTextRef.current = '';
    }
  }, [onSentenceComplete]);

  return { isStreaming, startStreaming, stopStreaming };
}
