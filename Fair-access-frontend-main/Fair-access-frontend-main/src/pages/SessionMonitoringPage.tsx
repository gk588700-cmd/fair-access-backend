import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  Search,
  RefreshCw,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  User,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { ActiveSession, RateLimitConfig } from '../types';
import { useBackend } from '../context/BackendContext';
import { BackendDisconnectedBanner } from '../components/common/BackendDisconnectedBanner';

export const SessionMonitoringPage: React.FC = () => {
  const { isConnected, mode, addNotification } = useBackend();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [config, setConfig] = useState<RateLimitConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'warn' | 'flagged'>('all');
  const [clearingSessionId, setClearingSessionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sessionsData, configData] = await Promise.all([
        api.getSessions(),
        api.getConfig().catch(() => null),
      ]);
      setSessions(sessionsData);
      setConfig(configData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [isConnected, mode]);

  const handleClearSession = async (sessionId: string) => {
    setClearingSessionId(sessionId);
    setActionMessage(null);
    try {
      const res = await api.clearSession(sessionId);
      setActionMessage({
        type: 'success',
        text: res.message || `Counter cleared for ${sessionId}`,
      });
      addNotification({
        type: 'info',
        title: 'Session Counter Cleared',
        message: `Cleared rate-limit counter for ${sessionId}`,
        session_id: sessionId,
      });
      // Refresh list
      await fetchSessions();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || `Failed to clear session ${sessionId}`,
      });
    } finally {
      setClearingSessionId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((sess) => {
      const matchesSearch =
        sess.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sess.student_name && sess.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sess.student_id && sess.student_id.toLowerCase().includes(searchQuery.toLowerCase()));

      let computedStatus = sess.status;
      if (config) {
        if (sess.requests_in_window > config.max_requests) {
          computedStatus = 'flagged';
        } else if (sess.requests_in_window >= config.max_requests) {
          computedStatus = 'warn';
        } else {
          computedStatus = 'normal';
        }
      }

      const matchesStatus = statusFilter === 'all' || computedStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchQuery, statusFilter, config]);

  return (
    <div className="space-y-6">
      <BackendDisconnectedBanner />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#211A35]">
            Session Monitoring
          </h2>
          <p className="text-xs text-[#7B6E96] mt-0.5">
            Real-time inspection of active student windows and burst limits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {config && (
            <span className="text-xs text-[#736394] px-3 py-1.5 rounded-xl bg-white border border-[#E9E0FD]">
              Threshold: <strong className="font-mono text-[#211A35]">{config.max_requests} req</strong> / {config.window_seconds}s
            </span>
          )}
          <button
            onClick={() => fetchSessions()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#45219A] border border-[#E9E0FD] hover:bg-[#F3EEFF] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#6C3BDB]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-current opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8E7EAF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by session ID or student..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs text-[#211A35]"
          />
        </div>

        {/* Status segmented filters */}
        <div className="flex items-center gap-1 p-1 bg-[#FAF8FE] rounded-xl border border-[#E9E0FD] w-full md:w-auto">
          {(['all', 'normal', 'warn', 'flagged'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-white text-[#45219A] shadow-xs'
                  : 'text-[#736394] hover:text-[#211A35]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Table Card */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {isLoading && sessions.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-6 h-6 text-[#6C3BDB] animate-spin mb-3" />
            <p className="text-xs font-semibold text-[#645681]">Loading active sessions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-[#DC2626] mx-auto" />
            <p className="text-xs font-semibold text-[#991B1B]">Unable to load sessions</p>
            <p className="text-[11px] text-[#7F1D1D]">{error}</p>
            <button
              onClick={() => fetchSessions()}
              className="px-4 py-2 rounded-xl bg-[#F3EEFF] text-[#6C3BDB] text-xs font-semibold hover:bg-[#E9E0FD]"
            >
              Try Again
            </button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Activity className="w-8 h-8 text-[#A78BFA] opacity-40 mx-auto" />
            <p className="text-xs font-bold text-[#645681]">No Active Sessions Found</p>
            <p className="text-[11px] text-[#8E7EAF] max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filter options.'
                : 'Submissions from student browsers will appear here with active sliding window counters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0E8FE] bg-[#FAF8FE]/80 text-[11px] font-bold text-[#736394]">
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Student Info</th>
                  <th className="py-3 px-4">Requests in Window</th>
                  <th className="py-3 px-4">Session Status</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8FE] text-xs">
                {filteredSessions.map((sess) => {
                  let effectiveStatus = sess.status;
                  if (config) {
                    if (sess.requests_in_window > config.max_requests) {
                      effectiveStatus = 'flagged';
                    } else if (sess.requests_in_window >= config.max_requests) {
                      effectiveStatus = 'warn';
                    } else {
                      effectiveStatus = 'normal';
                    }
                  }

                  const isClearing = clearingSessionId === sess.session_id;

                  return (
                    <tr key={sess.session_id} className="hover:bg-[#FAF8FE]/80 transition-colors">
                      {/* Session ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#45219A]">
                        {sess.session_id}
                      </td>

                      {/* Student info */}
                      <td className="py-3.5 px-4">
                        {sess.student_name ? (
                          <div>
                            <p className="font-semibold text-[#211A35]">{sess.student_name}</p>
                            <p className="text-[10px] font-mono text-[#8E7EAF]">{sess.student_id}</p>
                          </div>
                        ) : (
                          <span className="text-[#8E7EAF] italic">Anonymous Student</span>
                        )}
                      </td>

                      {/* Requests in window */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-[#211A35] tabular-nums text-sm">
                            {sess.requests_in_window}
                          </span>
                          {config && (
                            <span className="text-[10px] text-[#8E7EAF]">
                              / {config.max_requests} max
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Session status: Purple for normal, Amber for warning, Soft red for flagged */}
                      <td className="py-3.5 px-4">
                        {effectiveStatus === 'normal' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F3EEFF] text-[#6C3BDB] border border-[#E0D3FE]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6C3BDB]" />
                            <span>Normal</span>
                          </span>
                        )}
                        {effectiveStatus === 'warn' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            <span>Warning</span>
                          </span>
                        )}
                        {effectiveStatus === 'flagged' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                            <span>Flagged</span>
                          </span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#736394]">
                        {sess.last_active
                          ? new Date(sess.last_active).toLocaleTimeString()
                          : 'Recent'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleClearSession(sess.session_id)}
                          disabled={isClearing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E9E0FD] text-[#6C3BDB] hover:bg-[#F3EEFF] hover:text-[#45219A] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                          title="Clear session counter"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
                          <span>{isClearing ? 'Clearing...' : 'Clear Counter'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
