import React, { useEffect, useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Download,
  Code,
  X,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import { RequestRecord, DecisionType } from '../types';
import { useBackend } from '../context/BackendContext';
import { BackendDisconnectedBanner } from '../components/common/BackendDisconnectedBanner';

export const RequestHistoryPage: React.FC = () => {
  const { isConnected, mode } = useBackend();
  const [history, setHistory] = useState<RequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [decisionFilter, setDecisionFilter] = useState<'all' | DecisionType>('all');
  const [selectedRecord, setSelectedRecord] = useState<RequestRecord | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await api.getHistory(limit);
      setHistory(records);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch request history from backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [limit, isConnected, mode]);

  const filteredRecords = useMemo(() => {
    return history.filter((rec) => {
      const matchesSearch =
        rec.request_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.form_data?.name && rec.form_data.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rec.form_data?.assignment && rec.form_data.assignment.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDecision = decisionFilter === 'all' || rec.decision === decisionFilter;

      return matchesSearch && matchesDecision;
    });
  }, [history, searchQuery, decisionFilter]);

  const exportCsv = () => {
    if (history.length === 0) return;
    const headers = ['Request ID', 'Session ID', 'Timestamp', 'Window Count', 'Decision', 'Accepted', 'Student', 'Assignment'];
    const rows = history.map((r) => [
      r.request_id,
      r.session_id,
      r.timestamp,
      r.requests_in_window,
      r.decision,
      r.accepted ? 'Yes' : 'No',
      r.form_data?.name || '',
      `"${(r.form_data?.assignment || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fair_access_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <BackendDisconnectedBanner />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#211A35]">
            Request Audit History
          </h2>
          <p className="text-xs text-[#7B6E96] mt-0.5">
            Backend event log tracking submission rate decisions and verification statuses
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#645681] border border-[#E9E0FD] hover:bg-[#FAF8FE] text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => fetchHistory()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#45219A] border border-[#E9E0FD] hover:bg-[#F3EEFF] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#6C3BDB]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8E7EAF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request ID, session, student..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs text-[#211A35]"
          />
        </div>

        {/* Decision & Limit selectors */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Decision tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#FAF8FE] rounded-xl border border-[#E9E0FD]">
            {(['all', 'allow', 'warn', 'slow'] as const).map((dec) => (
              <button
                key={dec}
                onClick={() => setDecisionFilter(dec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  decisionFilter === dec
                    ? 'bg-white text-[#45219A] shadow-xs'
                    : 'text-[#736394] hover:text-[#211A35]'
                }`}
              >
                {dec}
              </button>
            ))}
          </div>

          {/* Limit selector */}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E9E0FD] text-xs font-semibold text-[#45219A] focus:outline-hidden"
          >
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {isLoading && history.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-6 h-6 text-[#6C3BDB] animate-spin mb-3" />
            <p className="text-xs font-semibold text-[#645681]">Loading audit history...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-semibold text-[#991B1B]">Unable to load request history</p>
            <p className="text-[11px] text-[#7F1D1D]">{error}</p>
            <button
              onClick={() => fetchHistory()}
              className="px-4 py-2 rounded-xl bg-[#F3EEFF] text-[#6C3BDB] text-xs font-semibold hover:bg-[#E9E0FD]"
            >
              Try Again
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <History className="w-8 h-8 text-[#A78BFA] opacity-40 mx-auto" />
            <p className="text-xs font-bold text-[#645681]">No Requests Found</p>
            <p className="text-[11px] text-[#8E7EAF] max-w-sm mx-auto">
              {searchQuery || decisionFilter !== 'all'
                ? 'No submission matches your active filters.'
                : 'Requests sent via the Student Submission form will be tracked here in real time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0E8FE] bg-[#FAF8FE]/80 text-[11px] font-bold text-[#736394]">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Window Count</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Acceptance Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8FE] text-xs">
                {filteredRecords.map((rec) => (
                  <tr key={rec.request_id} className="hover:bg-[#FAF8FE]/80 transition-colors">
                    {/* Request ID */}
                    <td className="py-3 px-4 font-mono font-bold text-[#45219A] truncate max-w-[140px]">
                      {rec.request_id}
                    </td>

                    {/* Session ID */}
                    <td className="py-3 px-4 font-mono text-[#645681] truncate max-w-[140px]">
                      {rec.session_id}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-[11px] text-[#736394] whitespace-nowrap">
                      {new Date(rec.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    {/* Requests in window */}
                    <td className="py-3 px-4 font-mono font-bold text-[#211A35] tabular-nums">
                      {rec.requests_in_window}
                    </td>

                    {/* Decision Badge */}
                    <td className="py-3 px-4">
                      {rec.decision === 'allow' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ALLOW</span>
                        </span>
                      )}
                      {rec.decision === 'warn' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>WARN</span>
                        </span>
                      )}
                      {rec.decision === 'slow' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                          <Clock className="w-3 h-3" />
                          <span>SLOW</span>
                        </span>
                      )}
                    </td>

                    {/* Acceptance status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          rec.accepted ? 'text-[#059669]' : 'text-[#DC2626]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.accepted ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                        <span>{rec.accepted ? 'Accepted' : 'Not Accepted'}</span>
                      </span>
                    </td>

                    {/* View Details */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="p-1.5 rounded-lg text-[#8E7EAF] hover:text-[#6C3BDB] hover:bg-[#F3EEFF] transition-colors"
                        title="View payload"
                      >
                        <Code className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal for Selected Request */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#211A35]/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E9E0FD] space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E8FE]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#6C3BDB]" />
                <h3 className="text-base font-bold text-[#211A35]">Request Details</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-[#8E7EAF] hover:text-[#211A35]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD] space-y-2">
                <div className="flex justify-between py-1 border-b border-[#F0E8FE]">
                  <span className="text-[#736394]">Request ID</span>
                  <span className="font-mono font-bold text-[#45219A]">{selectedRecord.request_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0E8FE]">
                  <span className="text-[#736394]">Session ID</span>
                  <span className="font-mono text-[#211A35]">{selectedRecord.session_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0E8FE]">
                  <span className="text-[#736394]">Decision / Status</span>
                  <span className="font-bold uppercase text-[#6C3BDB]">
                    {selectedRecord.decision} ({selectedRecord.accepted ? 'Accepted' : 'Rejected'})
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#736394]">Requests in Window</span>
                  <span className="font-mono font-bold text-[#211A35]">{selectedRecord.requests_in_window}</span>
                </div>
              </div>

              {selectedRecord.form_data && (
                <div>
                  <h4 className="font-bold text-[#211A35] mb-1.5">Submitted Form Data</h4>
                  <div className="p-3.5 rounded-2xl bg-[#F8F5FF] border border-[#E9E0FD] space-y-1.5 text-[11px]">
                    <p><strong className="text-[#45219A]">Student:</strong> {selectedRecord.form_data.name} ({selectedRecord.form_data.student_id})</p>
                    <p><strong className="text-[#45219A]">Assignment:</strong> {selectedRecord.form_data.assignment}</p>
                    {selectedRecord.form_data.description && (
                      <p className="text-[#645681] italic mt-1 pt-1 border-t border-[#E9E0FD]">
                        "{selectedRecord.form_data.description}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedRecord.message && (
                <div>
                  <h4 className="font-bold text-[#211A35] mb-1">Backend Explanation Message</h4>
                  <p className="p-3 rounded-xl bg-white border border-[#E9E0FD] text-[11px] text-[#4B5563]">
                    {selectedRecord.message}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#F0E8FE] flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-[#F3EEFF] text-[#45219A] font-semibold text-xs hover:bg-[#E9E0FD]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
