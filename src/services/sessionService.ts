import { api } from './api';
import type { SessionResponse, SessionJoinResponse, StudentHistoryResponse } from '../types';

export const sessionService = {
  createSession: async (courseId: string): Promise<SessionResponse> => {
    const response = await api.post<SessionResponse>(`/courses/${courseId}/sessions`);
    return response.data;
  },

  getSessionByCode: async (code: string): Promise<SessionResponse> => {
    const response = await api.get<SessionResponse>(`/sessions/${code}`);
    return response.data;
  },

  joinSession: async (code: string): Promise<SessionJoinResponse> => {
    const response = await api.post<SessionJoinResponse>(`/sessions/${encodeURIComponent(code)}/join`);
    return response.data;
  },

  getStudentHistory: async (): Promise<StudentHistoryResponse[]> => {
    const response = await api.get<StudentHistoryResponse[]>('/student/history');
    return response.data;
  },

  endSession: async (code: string): Promise<SessionResponse> => {
    const response = await api.put<SessionResponse>(`/sessions/${code}/end`);
    return response.data;
  },
};
