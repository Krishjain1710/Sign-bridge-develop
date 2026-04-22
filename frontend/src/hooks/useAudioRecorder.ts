// useAudioRecorder.ts

import { useRef, useState } from "react";

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [recording, setRecording] = useState(false);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus" // ✅ REQUIRED FOR WHISPER
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      setRecording(true);
    } catch (err) {
      // Clean up the stream if MediaRecorder creation fails
      stream.getTracks().forEach(t => t.stop());
      throw err;
    }
  }

  async function stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        setRecording(false);
        reject(new Error('Recorder not initialized'));
        return;
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: "audio/webm"
        });
        // Stop all tracks to release the microphone
        recorder.stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        resolve(audioBlob);
      };

      recorder.stop();
    });
  }

  return {
    startRecording,
    stopRecording,
    recording,
    stream: streamRef.current,
  };
}
