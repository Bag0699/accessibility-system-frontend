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

export interface SessionAttendance {
  sessionId: string;
  studentId: string;
  joinedAt: string;
  endedAt: string | null;
}

export interface SessionJoinResponse {
  id: string;
  code: string;
  courseName: string;
  teacherName: string;
  isActive: boolean;
  startedAt: string;
}

export interface StudentHistoryResponse {
  sessionId: string;
  code: string;
  courseName: string;
  teacherName: string;
  joinedAt: string;
  endedAt: string;
}

export interface UserPreferences {
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  theme: 'light' | 'dark';
  language: string;
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
