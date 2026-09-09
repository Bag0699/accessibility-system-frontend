export type Role = 'STUDENT' | 'TEACHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export interface CourseResponse {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
}

export interface SessionResponse {
  id: string;
  code: string;
  courseId: string;
  courseName: string;
  createdAt: string;
  isActive: boolean;
}

export interface TranscriptionResponse {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface TranscriptionMessageRequest {
  text: string;
  startTime: number;
  endTime: number;
}
