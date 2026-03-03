export async function recordAudio(durationMs = 5000): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus',
  });

  const chunks: BlobPart[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start();

  await new Promise((res) => setTimeout(res, durationMs));
  mediaRecorder.stop();

  await new Promise((res) => (mediaRecorder.onstop = res));

  stream.getTracks().forEach((t) => t.stop());

  return new Blob(chunks, { type: 'audio/webm' });
}
