/**
 * TypeScript Definitions for Fair Access Academic Web Forms
 */

export type DecisionType = 'allow' | 'warn' | 'slow';

export type SessionStatusType = 'normal' | 'warn' | 'flagged';

export interface StudentFormData {
  name: string;
  student_id: string;
  assignment: string;
  description: string;
}

export interface SubmissionPayload {
  session_id: string;
  request_id: string;
  form_data: StudentFormData;
}

export interface SubmissionResponse {
  decision: DecisionType;
  message: string;
  session_id: string;
  request_id: string;
  timestamp?: string;
  accepted?: boolean;
  requests_in_window?: number;
  current_count?: number;
  max_requests?: number;
  retry_after_seconds?: number;
  retry_duration?: number;
  window_seconds?: number;
}

export interface ActiveSession {
  session_id: string;
  requests_in_window: number;
  status: SessionStatusType;
  last_active?: string;
  first_seen?: string;
  student_id?: string;
  student_name?: string;
}

export interface RequestRecord {
  request_id: string;
  session_id: string;
  timestamp: string;
  requests_in_window: number;
  decision: DecisionType;
  accepted: boolean;
  message?: string;
  form_data?: Partial<StudentFormData>;
}

export interface RateLimitConfig {
  window_seconds: number;
  max_requests: number;
  slowdown_seconds: number;
}

export interface BackendHealthResponse {
  status: string;
  uptime_seconds?: number;
  timestamp?: string;
  version?: string;
  active_sessions_count?: number;
  total_requests?: number;
  database?: string;
}

export interface ProjectInfoResponse {
  name?: string;
  title?: string;
  version?: string;
  description?: string;
  algorithm?: string;
  author?: string;
  status?: string;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  session_id?: string;
  request_id?: string;
}

export type PageView = 
  | 'overview'
  | 'submission'
  | 'sessions'
  | 'history'
  | 'settings'
  | 'status';
