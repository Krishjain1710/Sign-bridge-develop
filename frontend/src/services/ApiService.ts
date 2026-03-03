import axios from 'axios';
import { API_ENDPOINTS } from '../config';

/* =========================
   Types
========================= */

export interface TranscribeResponse {
  text: string;
}

export interface SimplifyTextResponse {
  simplified_text: string;
}

export interface TranslateSignWritingResponse {
  signwriting: string;
}

export interface GeneratePoseResponse {
  format: string;
  frames: number;
  joints_per_frame: number;
  pose: number[][][]; // [frame][joint][xyz]
}

/* =========================
   API Service
========================= */

const ApiService = {
  /* ---------- Transcribe ---------- */
  async transcribe(audioBlob: Blob): Promise<TranscribeResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await axios.post<TranscribeResponse>(
      API_ENDPOINTS.TRANSCRIBE,
      formData
      // ✅ DO NOT set Content-Type manually
    );

    return response.data;
  },

  /* ---------- Simplify Text ---------- */
  async simplifyText(text: string): Promise<SimplifyTextResponse> {
    const response = await axios.post<SimplifyTextResponse>(
      API_ENDPOINTS.SIMPLIFY_TEXT,
      { text }
    );
    return response.data;
  },

  /* ---------- Translate → SignWriting ---------- */
  async translateSignWriting(text: string): Promise<TranslateSignWritingResponse> {
    const response = await axios.post<TranslateSignWritingResponse>(
      API_ENDPOINTS.TRANSLATE_SIGNWRITING,
      { text }
    );
    return response.data;
  },

  /* ---------- Generate Pose (FIXED) ---------- */
  async generatePose(signwriting: string): Promise<GeneratePoseResponse> {
    const response = await axios.post<GeneratePoseResponse>(
      API_ENDPOINTS.GENERATE_POSE,
      { signwriting } // ✅ THIS IS THE FIX
    );

    return response.data;
  },
};

export default ApiService;
