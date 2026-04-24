import axios from 'axios';
import { API_ENDPOINTS } from '../config';

// Default timeout of 60 seconds to prevent indefinite hangs
axios.defaults.timeout = 60000;

export interface HealthResponse {
  status: 'ready' | 'loading';
  models: { whisper: boolean; signwriting: boolean };
}

export interface TranscribeResponse {
  text: string;
  detected_language?: string;
}

export interface SimplifyTextResponse {
  simplified_text: string;
  warning?: string;
}

export interface TranslateSignWritingResponse {
  signwriting: string;
}

export interface GeneratePoseResponse {
  pose_data: string;
  data_format: string;
  frames?: number;
  joints_per_frame?: number;
  movements?: string[];
}

export interface ApiError {
  error: string;
  code: string;
  stage: string;
}

const ApiService = {
  async checkHealth(): Promise<HealthResponse> {
    const response = await axios.get<HealthResponse>(API_ENDPOINTS.HEALTH);
    return response.data;
  },

  async transcribe(audioBlob: Blob, language?: string, signal?: AbortSignal): Promise<TranscribeResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    if (language) {
      formData.append('language', language);
    }
    const response = await axios.post<TranscribeResponse>(
      API_ENDPOINTS.TRANSCRIBE,
      formData,
      { signal },
    );
    return response.data;
  },

  async simplifyText(text: string, signal?: AbortSignal): Promise<SimplifyTextResponse> {
    const response = await axios.post<SimplifyTextResponse>(
      API_ENDPOINTS.SIMPLIFY_TEXT,
      { text },
      { signal },
    );
    return response.data;
  },

  async translateSignWriting(text: string, signal?: AbortSignal): Promise<TranslateSignWritingResponse> {
    const response = await axios.post<TranslateSignWritingResponse>(
      API_ENDPOINTS.TRANSLATE_SIGNWRITING,
      { text },
      { signal },
    );
    return response.data;
  },

  async generatePose(text: string, signwriting: string, signal?: AbortSignal): Promise<GeneratePoseResponse> {
    const response = await axios.post<GeneratePoseResponse>(
      API_ENDPOINTS.GENERATE_POSE,
      { text, signwriting },
      { signal },
    );
    return response.data;
  },
};

export default ApiService;
