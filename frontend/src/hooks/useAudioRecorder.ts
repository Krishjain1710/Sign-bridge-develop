// useAudioRecorder.ts

import { useRef, useState } from "react";

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [recording, setRecording] = useState(false);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
    setRecording(true);
  }

  async function stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return;

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: "audio/webm" // ✅ IMPORTANT
        });
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
  };
}
