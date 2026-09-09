import { api } from './api';
import type { CourseResponse } from '../types';

export const courseService = {
  createCourse: async (name: string): Promise<CourseResponse> => {
    const response = await api.post<CourseResponse>('/courses', { name });
    return response.data;
  },

  getCourses: async (): Promise<CourseResponse[]> => {
    const response = await api.get<CourseResponse[]>('/courses');
    return response.data;
  },
};
