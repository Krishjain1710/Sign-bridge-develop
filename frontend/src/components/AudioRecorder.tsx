import React, { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  recordingSource: 'mic' | 'system';
  setRecordingSource: (source: 'mic' | 'system') => void;
  onClose: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  recordingSource,
  setRecordingSource,
  onClose,
}) => {
  const { startRecording, stopRecording, recording, stream: recorderStream } = useAudioRecorder();
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    handleStart();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    // Don't stop stream tracks here - the useAudioRecorder hook owns the stream
    streamRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  };

  const handleStart = async () => {
    try {
      await startRecording();
      if (!mountedRef.current) return;

      // Set up audio level visualization reusing the recording stream
      try {
        if (!recorderStream || !mountedRef.current) return;
        streamRef.current = recorderStream;
        const audioContext = new AudioContext();
        audioCtxRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(recorderStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const updateLevel = () => {
          if (!mountedRef.current || !analyserRef.current) return;
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
          setAudioLevel(avg / 255);
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch {
        // Visualization is optional - recording still works without it
      }
    } catch {
      if (mountedRef.current) onClose();
    }
  };

  const handleStop = async () => {
    try {
      const audioBlob = await stopRecording();
      cleanup();
      if (audioBlob) {
        onRecordingComplete(audioBlob);
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      onClose();
    }
  };

  const handleCancel = () => {
    if (recording) {
      stopRecording().catch(() => {});
    }
    cleanup();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate visualization bars based on audio level
  const bars = Array.from({ length: 20 }, (_, i) => {
    const barLevel = Math.sin((i / 20) * Math.PI) * audioLevel;
    return Math.max(0.1, barLevel);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl p-8 shadow-2xl"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-theme-secondary transition-colors"
          aria-label="Cancel recording"
        >
          <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-theme-primary">Recording</h2>
          <p className="text-sm text-theme-secondary mt-1">
            {recordingSource === 'mic' ? 'Microphone' : 'System Audio'}
          </p>
        </div>

        {/* Source toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setRecordingSource('mic')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              recordingSource === 'mic'
                ? 'bg-primary-500 text-white'
                : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
            }`}
          >
            Microphone
          </button>
          <button
            onClick={() => setRecordingSource('system')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              recordingSource === 'system'
                ? 'bg-primary-500 text-white'
                : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
            }`}
          >
            System Audio
          </button>
        </div>

        {/* Audio visualization */}
        <div className="flex items-end justify-center gap-1 h-20 mb-6">
          {bars.map((level, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-primary-500 transition-all duration-75"
              style={{
                height: `${Math.max(8, level * 80)}px`,
                opacity: 0.4 + level * 0.6,
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <span className="text-3xl font-mono font-bold text-theme-primary">
            {formatTime(duration)}
          </span>
        </div>

        {/* Recording indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-3 h-3 rounded-full bg-danger-500 animate-pulse" />
          <span className="text-sm font-medium text-danger-500">Recording...</span>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleCancel}
            className="px-6 py-3 rounded-xl text-sm font-medium bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStop}
            className="px-6 py-3 rounded-xl text-sm font-medium bg-danger-500 text-white hover:bg-danger-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="6" width="8" height="8" rx="1" />
            </svg>
            Stop Recording
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
