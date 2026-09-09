import { api } from './api';
import type { SessionResponse, TranscriptionResponse } from '../types';

export const transcriptionService = {
  getCourseHistory: async (courseId: string): Promise<SessionResponse[]> => {
    const response = await api.get<SessionResponse[]>(`/courses/${courseId}/history`);
    return response.data;
  },

  getSessionTranscriptions: async (code: string): Promise<TranscriptionResponse[]> => {
    const response = await api.get<TranscriptionResponse[]>(`/sessions/${code}/transcriptions`);
    return response.data;
  },
};
