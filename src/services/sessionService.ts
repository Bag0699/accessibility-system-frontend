import { api } from './api';
import type { SessionResponse } from '../types';

export const sessionService = {
  createSession: async (courseId: string): Promise<SessionResponse> => {
    const response = await api.post<SessionResponse>(`/courses/${courseId}/sessions`);
    return response.data;
  },

  getSessionByCode: async (code: string): Promise<SessionResponse> => {
    const response = await api.get<SessionResponse>(`/sessions/${code}`);
    return response.data;
  },

  endSession: async (code: string): Promise<SessionResponse> => {
    const response = await api.put<SessionResponse>(`/sessions/${code}/end`);
    return response.data;
  },
};
