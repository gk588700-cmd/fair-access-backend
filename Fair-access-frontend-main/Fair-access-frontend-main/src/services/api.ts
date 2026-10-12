/**
 * Centralized API Service for Fair Access Backend
 *
 * Configurable base URL defaulting to http://127.0.0.1:8000
 * Handles real HTTP calls to FastAPI with timeout and error handling.
 * Also supports an explicit Sandbox mode toggle for offline presentations.
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
import { sandboxBackend } from './sandboxBackend';

const STORAGE_KEY_API_URL = 'fair_access_api_url';
const STORAGE_KEY_MODE = 'fair_access_backend_mode'; // 'live' | 'sandbox'

export type BackendMode = 'live' | 'sandbox';

export class ApiService {
  private baseUrl: string;
  private mode: BackendMode;

  constructor() {
    const savedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_API_URL) : null;
    this.baseUrl = savedUrl || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    const savedMode = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_MODE) : null) as BackendMode | null;
    this.mode = savedMode || 'live';
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    // Strip trailing slash
    const clean = url.trim().replace(/\/+$/, '');
    this.baseUrl = clean;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_API_URL, clean);
    }
  }

  public getMode(): BackendMode {
    return this.mode;
  }

  public setMode(mode: BackendMode): void {
    this.mode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errDetail = response.statusText;
        try {
          const body = await response.json();
          errDetail = body.detail || body.message || JSON.stringify(body);
        } catch {
          // ignore json parse error
        }
        throw new Error(`HTTP ${response.status}: ${errDetail}`);
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out after 6 seconds.`);
      }
      throw new Error(err.message || 'Network error reaching backend');
    }
  }

  /**
   * Health & Connection Check
   */
  public async checkHealth(): Promise<{ isConnected: boolean; latencyMs: number; health?: BackendHealthResponse; error?: string }> {
    if (this.mode === 'sandbox') {
      const start = performance.now();
      const health = sandboxBackend.getHealth();
      const latencyMs = Math.round(performance.now() - start);
      return { isConnected: true, latencyMs, health };
    }

    const start = performance.now();
    try {
      const health = await this.request<BackendHealthResponse>('/health');
      const latencyMs = Math.round(performance.now() - start);
      return { isConnected: true, latencyMs, health };
    } catch (err: any) {
      return {
        isConnected: false,
        latencyMs: 0,
        error: err.message || 'Cannot reach FastAPI server at ' + this.baseUrl,
      };
    }
  }

  /**
   * GET / - Project info
   */
  public async getProjectInfo(): Promise<ProjectInfoResponse> {
    if (this.mode === 'sandbox') {
      return sandboxBackend.getProjectInfo();
    }
    return this.request<ProjectInfoResponse>('/');
  }

  /**
   * GET /health - Backend health
   */
  public async getHealth(): Promise<BackendHealthResponse> {
    if (this.mode === 'sandbox') {
      return sandboxBackend.getHealth();
    }
    return this.request<BackendHealthResponse>('/health');
  }

  /**
   * GET /config - Current rate-limit settings
   */
  public async getConfig(): Promise<RateLimitConfig> {
    if (this.mode === 'sandbox') {
      return sandboxBackend.getConfig();
    }
    return this.request<RateLimitConfig>('/config');
  }

  /**
   * PUT /config - Update rate-limit settings
   */
  public async updateConfig(config: RateLimitConfig): Promise<{ status: string; config?: RateLimitConfig; message?: string }> {
    if (this.mode === 'sandbox') {
      const updated = sandboxBackend.updateConfig(config);
      return { status: 'success', config: updated, message: 'Settings saved successfully' };
    }
    return this.request<{ status: string; config?: RateLimitConfig; message?: string }>('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * POST /submit - Process a student submission
   */
  public async submit(payload: SubmissionPayload): Promise<SubmissionResponse> {
    if (this.mode === 'sandbox') {
      return sandboxBackend.submit(payload);
    }
    return this.request<SubmissionResponse>('/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * GET /sessions - Active session information
   */
  public async getSessions(): Promise<ActiveSession[]> {
    if (this.mode === 'sandbox') {
      return sandboxBackend.getSessions();
    }
    const response = await this.request<any>('/sessions');
    // Flexible handler if backend returns { sessions: [...] } or array directly
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.sessions)) {
      return response.sessions;
    }
    return [];
  }

  /**
   * GET /history?limit=50 - Recent request history
   */
  public async getHistory(limit = 50): Promise<RequestRecord[]> {
    if (this.mode === 'sandbox') {
      return sandboxBackend.getHistory(limit);
    }
    const response = await this.request<any>(`/history?limit=${limit}`);
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.history)) {
      return response.history;
    }
    return [];
  }

  /**
   * POST /sessions/{session_id}/clear - Clear a session counter
   */
  public async clearSession(sessionId: string): Promise<{ status: string; message: string; session_id: string }> {
    if (this.mode === 'sandbox') {
      return sandboxBackend.clearSession(sessionId);
    }
    return this.request<{ status: string; message: string; session_id: string }>(
      `/sessions/${encodeURIComponent(sessionId)}/clear`,
      {
        method: 'POST',
      }
    );
  }
}

export const api = new ApiService();
