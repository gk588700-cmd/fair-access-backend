/**
 * In-Browser Sandbox Backend Engine
 * Used strictly when the user EXPLICITLY switches to "Interactive Demo Mode"
 * in environments where a local FastAPI server cannot run (e.g. mobile or remote preview).
 * Implements the exact same FastAPI endpoints and schema:
 * - GET /
 * - GET /health
 * - GET /config
 * - PUT /config
 * - POST /submit
 * - GET /sessions
 * - GET /history?limit=50
 * - POST /sessions/{session_id}/clear
 */

import {
  ActiveSession,
  BackendHealthResponse,
  ProjectInfoResponse,
  RateLimitConfig,
  RequestRecord,
  SubmissionPayload,
  SubmissionResponse,
} from '../types';

class SandboxBackendState {
  private config: RateLimitConfig = {
    window_seconds: 60,
    max_requests: 5,
    slowdown_seconds: 15,
  };

  private sessions: Map<string, { requests: { timestamp: number; request_id: string }[]; student_id?: string; student_name?: string }> = new Map();
  private history: RequestRecord[] = [];
  private startTime = Date.now();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = Date.now();
    const seeded = [
      {
        reqId: 'req_init_981',
        sessionId: 'sess_alice_772',
        studentId: 'STU2026-01',
        name: 'Alice Henderson',
        assignment: 'CS401: Distributed Systems Lab 3',
        offsetSec: 140,
        decision: 'allow' as const,
        count: 1,
      },
      {
        reqId: 'req_init_982',
        sessionId: 'sess_bob_304',
        studentId: 'STU2026-02',
        name: 'Bob Martinez',
        assignment: 'CS401: Distributed Systems Lab 3',
        offsetSec: 75,
        decision: 'allow' as const,
        count: 2,
      },
      {
        reqId: 'req_init_983',
        sessionId: 'sess_bot_999',
        studentId: 'STU2026-99',
        name: 'Automated Script Test',
        assignment: 'CS401: Distributed Systems Lab 3',
        offsetSec: 35,
        decision: 'warn' as const,
        count: 4,
      },
      {
        reqId: 'req_init_984',
        sessionId: 'sess_bot_999',
        studentId: 'STU2026-99',
        name: 'Automated Script Test',
        assignment: 'CS401: Distributed Systems Lab 3',
        offsetSec: 10,
        decision: 'slow' as const,
        count: 6,
      },
    ];

    for (const item of seeded) {
      const timeMs = now - item.offsetSec * 1000;
      const iso = new Date(timeMs).toISOString();

      if (!this.sessions.has(item.sessionId)) {
        this.sessions.set(item.sessionId, {
          requests: [],
          student_id: item.studentId,
          student_name: item.name,
        });
      }
      this.sessions.get(item.sessionId)!.requests.push({
        timestamp: timeMs,
        request_id: item.reqId,
      });

      this.history.unshift({
        request_id: item.reqId,
        session_id: item.sessionId,
        timestamp: iso,
        requests_in_window: item.count,
        decision: item.decision,
        accepted: item.decision === 'allow',
        message:
          item.decision === 'allow'
            ? 'Submission accepted within fair threshold'
            : item.decision === 'warn'
            ? 'Warning: Request rate approaching window threshold'
            : 'Rate limit exceeded. Fair access cooldown active.',
        form_data: {
          name: item.name,
          student_id: item.studentId,
          assignment: item.assignment,
        },
      });
    }
  }

  public getProjectInfo(): ProjectInfoResponse {
    return {
      name: 'Fair Access to Academic Web Forms',
      version: '1.2.0-fastapi',
      description: 'Adaptive token & sliding window rate limiter ensuring equitable queue access during assignment deadlines and course registration spikes.',
      algorithm: 'Sliding Window Counter with Progressive Backoff',
      author: 'Govardhan Academic Security Lab',
      status: 'operational',
    };
  }

  public getHealth(): BackendHealthResponse {
    return {
      status: 'healthy',
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      version: '1.2.0',
      active_sessions_count: this.sessions.size,
      total_requests: this.history.length,
      database: 'in-memory-fastapi-mock',
    };
  }

  public getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<RateLimitConfig>): RateLimitConfig {
    this.config = {
      window_seconds: Number(newConfig.window_seconds ?? this.config.window_seconds),
      max_requests: Number(newConfig.max_requests ?? this.config.max_requests),
      slowdown_seconds: Number(newConfig.slowdown_seconds ?? this.config.slowdown_seconds),
    };
    return { ...this.config };
  }

  public submit(payload: SubmissionPayload): SubmissionResponse {
    const now = Date.now();
    const windowMs = this.config.window_seconds * 1000;
    const windowStart = now - windowMs;

    let sessionData = this.sessions.get(payload.session_id);
    if (!sessionData) {
      sessionData = {
        requests: [],
        student_id: payload.form_data?.student_id,
        student_name: payload.form_data?.name,
      };
      this.sessions.set(payload.session_id, sessionData);
    } else {
      sessionData.student_id = payload.form_data?.student_id;
      sessionData.student_name = payload.form_data?.name;
    }

    // Filter requests in current sliding window
    sessionData.requests = sessionData.requests.filter((r) => r.timestamp >= windowStart);

    // Current count BEFORE this submission
    const currentWindowCount = sessionData.requests.length + 1;
    sessionData.requests.push({ timestamp: now, request_id: payload.request_id });

    let decision: 'allow' | 'warn' | 'slow';
    let message = '';
    let retryAfter: number | undefined = undefined;
    let accepted = false;

    if (currentWindowCount <= this.config.max_requests - 1) {
      decision = 'allow';
      accepted = true;
      message = `Submission processed successfully. Request ${currentWindowCount} of ${this.config.max_requests} in current ${this.config.window_seconds}s window.`;
    } else if (currentWindowCount === this.config.max_requests) {
      decision = 'warn';
      accepted = true;
      message = `Warning: You have reached the maximum threshold of ${this.config.max_requests} requests. Next submission will trigger fair access cooldown.`;
    } else {
      decision = 'slow';
      accepted = false;
      retryAfter = this.config.slowdown_seconds;
      message = `Submission delayed. You have exceeded ${this.config.max_requests} requests in ${this.config.window_seconds}s. Please wait ${retryAfter} seconds to protect fair server access for other students.`;
    }

    const iso = new Date(now).toISOString();

    const record: RequestRecord = {
      request_id: payload.request_id,
      session_id: payload.session_id,
      timestamp: iso,
      requests_in_window: currentWindowCount,
      decision,
      accepted,
      message,
      form_data: {
        name: payload.form_data?.name,
        student_id: payload.form_data?.student_id,
        assignment: payload.form_data?.assignment,
        description: payload.form_data?.description,
      },
    };

    this.history.unshift(record);

    return {
      decision,
      message,
      session_id: payload.session_id,
      request_id: payload.request_id,
      timestamp: iso,
      accepted,
      requests_in_window: currentWindowCount,
      current_count: currentWindowCount,
      max_requests: this.config.max_requests,
      retry_after_seconds: retryAfter,
      retry_duration: retryAfter,
      window_seconds: this.config.window_seconds,
    };
  }

  public getSessions(): ActiveSession[] {
    const now = Date.now();
    const windowMs = this.config.window_seconds * 1000;
    const windowStart = now - windowMs;

    const result: ActiveSession[] = [];

    this.sessions.forEach((data, sessionId) => {
      // Clean up requests outside window
      const activeInWindow = data.requests.filter((r) => r.timestamp >= windowStart);
      const count = activeInWindow.length;

      let status: 'normal' | 'warn' | 'flagged' = 'normal';
      if (count > this.config.max_requests) {
        status = 'flagged';
      } else if (count >= this.config.max_requests) {
        status = 'warn';
      }

      const lastTimestamp = data.requests.length > 0 ? data.requests[data.requests.length - 1].timestamp : now;

      result.push({
        session_id: sessionId,
        requests_in_window: count,
        status,
        last_active: new Date(lastTimestamp).toISOString(),
        student_id: data.student_id,
        student_name: data.student_name,
      });
    });

    // Sort by requests descending
    result.sort((a, b) => b.requests_in_window - a.requests_in_window);
    return result;
  }

  public getHistory(limit = 50): RequestRecord[] {
    return this.history.slice(0, limit);
  }

  public clearSession(sessionId: string): { status: string; message: string; session_id: string } {
    if (this.sessions.has(sessionId)) {
      this.sessions.get(sessionId)!.requests = [];
    }
    return {
      status: 'success',
      message: `Session ${sessionId} rate-limiting counter cleared`,
      session_id: sessionId,
    };
  }
}

export const sandboxBackend = new SandboxBackendState();
