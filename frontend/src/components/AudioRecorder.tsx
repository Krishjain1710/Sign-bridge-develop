import { useAudioRecorder } from "../hooks/useAudioRecorder";
import ApiService from "../services/ApiService";

export default function AudioRecorder() {
  const { startRecording, stopRecording, recording } = useAudioRecorder();

  async function handleStop() {
    try {
      const audioBlob = await stopRecording();

      if (!audioBlob) {
        console.error("No audio blob returned");
        return;
      }

      const result = await ApiService.transcribe(audioBlob);
      console.log("Transcription:", result.text);
    } catch (err) {
      console.error("Transcription failed:", err);
    }
  }

  return (
    <div>
      {!recording ? (
        <button onClick={startRecording}>Start</button>
      ) : (
        <button onClick={handleStop}>Stop</button>
      )}
    </div>
  );
}
