import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ShieldAlert,
  Send,
  Zap,
  ChevronRight,
  Database,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api';
import { ActiveSession, RequestRecord, RateLimitConfig, BackendHealthResponse, PageView } from '../types';
import { useBackend } from '../context/BackendContext';
import { BackendDisconnectedBanner } from '../components/common/BackendDisconnectedBanner';

interface OverviewPageProps {
  onNavigate: (page: PageView) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { isConnected, mode, latencyMs } = useBackend();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [history, setHistory] = useState<RequestRecord[]>([]);
  const [config, setConfig] = useState<RateLimitConfig | null>(null);
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sessionsData, historyData, configData, healthData] = await Promise.all([
        api.getSessions().catch(() => []),
        api.getHistory(50).catch(() => []),
        api.getConfig().catch(() => null),
        api.getHealth().catch(() => null),
      ]);

      setSessions(sessionsData);
      setHistory(historyData);
      setConfig(configData);
      setHealth(healthData);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [isConnected, mode]);

  // Derived statistics from real backend responses
  const stats = useMemo(() => {
    const totalRequests = history.length;
    const normalRequests = history.filter((h) => h.decision === 'allow').length;
    const activeSessionsCount = sessions.length;
    const flaggedSessionsCount = sessions.filter(
      (s) => s.status === 'flagged' || s.requests_in_window > (config?.max_requests ?? 5)
    ).length;

    return {
      activeSessions: activeSessionsCount,
      requestsMonitored: totalRequests,
      normalRequests: normalRequests,
      flaggedSessions: flaggedSessionsCount,
    };
  }, [sessions, history, config]);

  // Activity breakdown buckets for mini-chart
  const chartData = useMemo(() => {
    if (history.length === 0) return [];
    // Group requests into 6 recent chronological slots
    const reversed = [...history].reverse();
    const bucketSize = Math.max(1, Math.ceil(reversed.length / 8));
    const buckets: { timeLabel: string; count: number; allowed: number; throttled: number }[] = [];

    for (let i = 0; i < reversed.length; i += bucketSize) {
      const slice = reversed.slice(i, i + bucketSize);
      const allowed = slice.filter((s) => s.decision === 'allow').length;
      const throttled = slice.filter((s) => s.decision !== 'allow').length;
      const firstTime = slice[0]?.timestamp ? new Date(slice[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Slot ${i / bucketSize + 1}`;
      buckets.push({
        timeLabel: firstTime,
        count: slice.length,
        allowed,
        throttled,
      });
    }
    return buckets.slice(-8);
  }, [history]);

  return (
    <div className="space-y-6">
      <BackendDisconnectedBanner />

      {/* Header controls strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#211A35]">
            Telemetry & Fair Queue State
          </h2>
          <p className="text-xs text-[#7B6E96] mt-0.5">
            Sliding window rate limit monitor protecting academic submission forms
          </p>
        </div>

        <div className="flex items-center gap-2">
          {config && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E9E0FD] text-xs text-[#645681]">
              <Clock className="w-3.5 h-3.5 text-[#6C3BDB]" />
              <span>Window: <strong className="text-[#211A35] font-mono">{config.window_seconds}s</strong></span>
              <span>·</span>
              <span>Max: <strong className="text-[#211A35] font-mono">{config.max_requests} req</strong></span>
            </div>
          )}

          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#45219A] border border-[#E9E0FD] hover:bg-[#F3EEFF] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#6C3BDB]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Four Attractive iOS Glassmorphism Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Active Sessions */}
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-[#C4AFFD] transition-all duration-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#F3EEFF] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#736394] tracking-wide uppercase">
              Active Sessions
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#F3EEFF] text-[#6C3BDB] flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#211A35] font-mono tabular-nums tracking-tight">
            {isLoading && sessions.length === 0 ? '—' : stats.activeSessions}
          </div>
          <p className="text-xs text-[#8E7EAF] mt-1.5 leading-snug">
            Currently active student browser sessions tracked by backend
          </p>
        </div>

        {/* 2. Requests Monitored */}
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-[#C4AFFD] transition-all duration-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#F3EEFF] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#736394] tracking-wide uppercase">
              Requests Monitored
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#F3EEFF] text-[#6C3BDB] flex items-center justify-center">
              <Activity className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#211A35] font-mono tabular-nums tracking-tight">
            {isLoading && history.length === 0 ? '—' : stats.requestsMonitored}
          </div>
          <p className="text-xs text-[#8E7EAF] mt-1.5 leading-snug">
            Total submission attempts logged in the backend history
          </p>
        </div>

        {/* 3. Normal Requests */}
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-[#C4AFFD] transition-all duration-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#ECFDF5] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#736394] tracking-wide uppercase">
              Normal Requests
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#211A35] font-mono tabular-nums tracking-tight">
            {isLoading && history.length === 0 ? '—' : stats.normalRequests}
          </div>
          <p className="text-xs text-[#8E7EAF] mt-1.5 leading-snug">
            Processed successfully within configured threshold
          </p>
        </div>

        {/* 4. Flagged Sessions */}
        <div className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:border-[#C4AFFD] transition-all duration-200">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FEF2F2] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#736394] tracking-wide uppercase">
              Flagged Sessions
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#211A35] font-mono tabular-nums tracking-tight">
            {isLoading && sessions.length === 0 ? '—' : stats.flaggedSessions}
          </div>
          <p className="text-xs text-[#8E7EAF] mt-1.5 leading-snug">
            Exceeded rate window or triggered fair access delay
          </p>
        </div>
      </div>

      {/* Activity Chart & Quick Submission Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Chart & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Activity Visualizer */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#211A35]">
                  Submission Traffic Distribution
                </h3>
                <p className="text-xs text-[#7B6E96]">
                  Allowed vs Throttled attempts across recent chronological intervals
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#059669]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
                  <span>Allowed</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#DC2626]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
                  <span>Delayed/Warned</span>
                </span>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E9E0FD] rounded-2xl">
                <Activity className="w-8 h-8 text-[#A78BFA] opacity-40 mb-2" />
                <p className="text-xs font-semibold text-[#645681]">No request history recorded yet</p>
                <p className="text-[11px] text-[#8E7EAF] mt-1 max-w-sm">
                  Send student form submissions to see the fair access traffic distribution visualizer.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-8 gap-2 items-end h-40 pt-4 px-2">
                  {chartData.map((bucket, idx) => {
                    const maxVal = Math.max(...chartData.map((b) => b.count), 1);
                    const totalHeight = Math.min(100, Math.max(15, (bucket.count / maxVal) * 100));
                    const allowedHeight = (bucket.allowed / (bucket.count || 1)) * totalHeight;
                    const throttledHeight = totalHeight - allowedHeight;

                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-end group">
                        <div className="text-[10px] font-mono text-[#736394] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                          {bucket.count}
                        </div>
                        <div
                          className="w-full max-w-[28px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-300"
                          style={{ height: `${totalHeight}%` }}
                        >
                          {throttledHeight > 0 && (
                            <div
                              className="w-full bg-[#EF4444] transition-all"
                              style={{ height: `${throttledHeight}%` }}
                              title={`${bucket.throttled} delayed`}
                            />
                          )}
                          <div
                            className="w-full bg-[#6C3BDB] transition-all"
                            style={{ height: `${allowedHeight}%` }}
                            title={`${bucket.allowed} allowed`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[#8E7EAF] mt-2 truncate w-full text-center">
                          {bucket.timeLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recent Requests Table Preview */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#211A35]">Recent Submission Decisions</h3>
                <p className="text-xs text-[#7B6E96]">Latest requests evaluated by the rate-limiting filter</p>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-[#6C3BDB] hover:text-[#45219A] flex items-center gap-1 transition-colors"
              >
                <span>View Full Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8E7EAF]">
                No recent submission records logged.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#F0E8FE] text-[11px] font-semibold text-[#736394]">
                      <th className="py-2.5 px-3">Request ID</th>
                      <th className="py-2.5 px-3">Session</th>
                      <th className="py-2.5 px-3">Window Count</th>
                      <th className="py-2.5 px-3">Decision</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E8FE] text-xs">
                    {history.slice(0, 5).map((req) => (
                      <tr key={req.request_id} className="hover:bg-[#FAF8FE] transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-[#45219A] truncate max-w-[130px]">
                          {req.request_id}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#645681] truncate max-w-[130px]">
                          {req.session_id}
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-[#211A35]">
                          {req.requests_in_window}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              req.decision === 'allow'
                                ? 'bg-[#ECFDF5] text-[#047857]'
                                : req.decision === 'warn'
                                ? 'bg-[#FEF3C7] text-[#B45309]'
                                : 'bg-[#FEF2F2] text-[#B91C1C]'
                            }`}
                          >
                            {req.decision}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#8E7EAF] font-mono text-[11px] whitespace-nowrap">
                          {new Date(req.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Action & Health Diagnostics */}
        <div className="space-y-6">
          {/* Quick Submission Shortcut */}
          <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-white via-white to-[#F8F5FF]">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C3BDB] to-[#9D71FD] text-white flex items-center justify-center shadow-md shadow-[#6C3BDB]/20 mb-3.5">
              <Send className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-bold text-[#211A35]">Submit Form as Student</h3>
            <p className="text-xs text-[#7B6E96] mt-1 leading-relaxed">
              Experience the fair access submission mechanism from a student's browser perspective.
            </p>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => onNavigate('submission')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-[#6C3BDB] to-[#45219A] text-white text-xs font-bold shadow-md shadow-[#6C3BDB]/25 hover:opacity-95 transition-opacity"
              >
                <span>Go to Student Form</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white border border-[#E9E0FD] text-[#45219A] text-xs font-semibold hover:bg-[#F3EEFF] transition-colors"
              >
                <span>Adjust Window Limits</span>
                <ChevronRight className="w-4 h-4 text-[#8E7EAF]" />
              </button>
            </div>
          </div>

          {/* Backend Health Diagnostics Panel */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#211A35]">Backend Health Status</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  health?.status === 'healthy' || health?.status === 'ok'
                    ? 'bg-[#ECFDF5] text-[#047857]'
                    : isConnected
                    ? 'bg-[#F3EEFF] text-[#6C3BDB]'
                    : 'bg-[#FEF2F2] text-[#B91C1C]'
                }`}
              >
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#F0E8FE]">
                <span className="text-[#736394] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#6C3BDB]" />
                  <span>Probe Latency</span>
                </span>
                <span className="font-mono font-bold text-[#211A35]">{latencyMs} ms</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#F0E8FE]">
                <span className="text-[#736394] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#6C3BDB]" />
                  <span>Active Sessions</span>
                </span>
                <span className="font-mono font-bold text-[#211A35]">{sessions.length}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#F0E8FE]">
                <span className="text-[#736394] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6C3BDB]" />
                  <span>Uptime</span>
                </span>
                <span className="font-mono text-[#211A35]">
                  {health?.uptime_seconds ? `${Math.floor(health.uptime_seconds / 60)} min` : 'Active'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#736394]">Engine Version</span>
                <span className="font-mono text-[11px] text-[#8E7EAF]">{health?.version || 'FastAPI 1.0'}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('status')}
              className="mt-4 w-full py-2 rounded-xl text-center text-xs font-semibold text-[#6C3BDB] hover:bg-[#F3EEFF] transition-colors"
            >
              Full Diagnostics & Architecture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
