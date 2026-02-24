/**
 * TypeScript types for API responses and models
 * Central location for all API-related type definitions
 */

// Authentication & User Types
export interface AuthToken {
  id: string;
  role: 'admin' | 'teacher' | 'guard' | 'student' | 'tutor';
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  id: string;
  password: string;
}

export interface StudentLoginRequest {
  studentId: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

// Teacher Types
export interface Teacher {
  id: string;
  name: string;
  permissionLevel: 'admin' | 'teacher' | 'guard' | 'tutor';
  photoUrl?: string;
  password?: string;
}

export interface CreateTeacherRequest {
  id: string;
  name: string;
  permissionLevel: string;
  password?: string;
}

// Student Types
export interface Student {
  id: string;
  name: string;
  photoUrl?: string;
  year?: number;
  class?: string;
}

export interface CreateStudentRequest {
  id: string;
  name: string;
  year?: number;
  class?: string;
}

export interface UpdateStudentPhotoRequest {
  photoUrl: string;
}

// Card Types
export interface Card {
  uid: string;
  lastAssigned?: string;
  isValid: number;
}

export interface CreateCardRequest {
  uid: string;
  lastAssigned?: string;
  isValid: number;
}

export interface Permission {
  id?: string;
  associatedCard: string;
  assignedStudent: string;
  isValid: number;
  isRecurring?: number;
  recurrencePattern?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface CreatePermissionRequest {
  associatedCard: string;
  assignedStudent: string;
  isValid: number;
  isRecurring?: number;
  recurrencePattern?: string;
  startDate?: string;
  endDate?: string;
}

// Access Log Types
export interface AccessLog {
  id: number;
  direction: string;
  student: string;
  card: string;
  wasApproved: number;
  timestamp: string;
  verified_by?: string;
}

// Guard Validation Types
export interface ValidateCardRequest {
  cardUID: string;
}

export interface ValidateCardResponse {
  valid: boolean;
  studentId?: string;
  studentName?: string;
  photoUrl?: string;
  message?: string;
  error?: string;
}

export interface VerifyFaceRequest {
  snapshotImage: string;
  cardUID: string;
}

export interface VerifyFaceResponse {
  match: boolean;
  similarity?: number;
  distance?: number;
  message?: string;
  error?: string;
}

// Admin Dashboard Types
export interface DashboardData {
  totalStudents?: number;
  totalCards?: number;
  totalTeachers?: number;
  recentLogs?: AccessLog[];
  cardStatus?: {
    valid: number;
    invalid: number;
  };
}

// Error Response Type
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

// Generic API Response Wrapper (for pagination)
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}
