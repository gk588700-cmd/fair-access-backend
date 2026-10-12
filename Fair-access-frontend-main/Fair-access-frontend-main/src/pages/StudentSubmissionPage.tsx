import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  User,
  Hash,
  BookOpen,
  FileText,
  AlertOctagon,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { StudentFormData, SubmissionPayload, SubmissionResponse } from '../types';
import { useBackend } from '../context/BackendContext';
import { BackendDisconnectedBanner } from '../components/common/BackendDisconnectedBanner';

export const StudentSubmissionPage: React.FC = () => {
  const { studentSessionId, regenerateSessionId, addNotification, isConnected, mode } = useBackend();

  const [formData, setFormData] = useState<StudentFormData>({
    name: 'Govardhan Iyer',
    student_id: 'STU-2026-CS88',
    assignment: 'Distributed Systems: Fair Queue Rate Limiter',
    description: 'Implementation of token bucket rate limiting on academic forms to guarantee equitable queueing during traffic spikes.',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [burstProgress, setBurstProgress] = useState<{ current: number; total: number } | null>(null);

  // Countdown timer for slow / cooldown state
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const generateRequestId = (): string => {
    const timestamp = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 7);
    return `req_${timestamp}_${rand}`;
  };

  const executeSubmission = async (overrideRequestId?: string): Promise<SubmissionResponse> => {
    const reqId = overrideRequestId || generateRequestId();
    const payload: SubmissionPayload = {
      session_id: studentSessionId,
      request_id: reqId,
      form_data: { ...formData },
    };

    const res = await api.submit(payload);

    // Update notifications and cooldown
    if (res.decision === 'allow') {
      addNotification({
        type: 'success',
        title: 'Assignment Submitted (Allowed)',
        message: res.message || 'Submission accepted within fair threshold.',
        session_id: studentSessionId,
        request_id: reqId,
      });
    } else if (res.decision === 'warn') {
      addNotification({
        type: 'warning',
        title: 'High Request Frequency (Warning)',
        message: res.message || 'Warning threshold reached.',
        session_id: studentSessionId,
        request_id: reqId,
      });
    } else if (res.decision === 'slow') {
      const waitSec = res.retry_after_seconds || res.retry_duration || 15;
      setCooldownRemaining(waitSec);
      addNotification({
        type: 'error',
        title: 'Rate Limit Enforced (Slow/Delay)',
        message: `Cooldown active: ${waitSec}s. ${res.message || ''}`,
        session_id: studentSessionId,
        request_id: reqId,
      });
    }

    return res;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || cooldownRemaining > 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await executeSubmission();
      setSubmissionResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit form to backend.');
      setSubmissionResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Burst Click Test: Simulates rapid consecutive clicks to showcase fair rate limiting in real-time
  const runBurstSimulation = async () => {
    if (isSubmitting || burstProgress) return;
    setBurstProgress({ current: 0, total: 4 });
    setErrorMessage(null);

    for (let i = 1; i <= 4; i++) {
      setBurstProgress({ current: i, total: 4 });
      try {
        const res = await executeSubmission();
        setSubmissionResult(res);
        // Small delay between bursts
        await new Promise((r) => setTimeout(r, 400));
      } catch (err: any) {
        setErrorMessage(err.message || 'Burst submission failed');
        break;
      }
    }
    setBurstProgress(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <BackendDisconnectedBanner />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#211A35]">
            Student Assignment Portal
          </h2>
          <p className="text-xs text-[#7B6E96] mt-0.5">
            Fair access validation protects server capacity during concurrent deadline submissions
          </p>
        </div>

        {/* Browser Session info badge */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E9E0FD] text-xs flex items-center gap-2">
            <span className="text-[#8E7EAF]">Current Session:</span>
            <span className="font-mono font-bold text-[#45219A]">{studentSessionId}</span>
          </div>
          <button
            onClick={() => {
              regenerateSessionId();
              setSubmissionResult(null);
              setCooldownRemaining(0);
            }}
            title="Start new student browser session"
            className="p-2 rounded-xl bg-white border border-[#E9E0FD] text-[#6C3BDB] hover:bg-[#F3EEFF] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Form + Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-[#211A35] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#6C3BDB]" />
                <span>Student Full Name</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alice Henderson"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs text-[#211A35] transition-all"
              />
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-xs font-bold text-[#211A35] mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#6C3BDB]" />
                <span>University Student ID</span>
              </label>
              <input
                type="text"
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="e.g. STU-2026-CS88"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs font-mono text-[#211A35] transition-all"
              />
            </div>

            {/* Assignment Title */}
            <div>
              <label className="block text-xs font-bold text-[#211A35] mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#6C3BDB]" />
                <span>Assignment Title</span>
              </label>
              <input
                type="text"
                required
                value={formData.assignment}
                onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                placeholder="e.g. CS401 Lab 4: Rate Limiting Algorithms"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs text-[#211A35] transition-all"
              />
            </div>

            {/* Assignment Description */}
            <div>
              <label className="block text-xs font-bold text-[#211A35] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#6C3BDB]" />
                <span>Assignment Description / Code Summary</span>
              </label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a summary of your academic submission..."
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs text-[#211A35] transition-all resize-none"
              />
            </div>

            {/* Submit Button & Fast burst test */}
            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isSubmitting || cooldownRemaining > 0}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6C3BDB] to-[#45219A] text-white text-xs font-bold shadow-md shadow-[#6C3BDB]/25 hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Fair Access Token...</span>
                  </>
                ) : cooldownRemaining > 0 ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Cooldown active: Wait {cooldownRemaining}s</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Assignment</span>
                  </>
                )}
              </button>

              {/* Hackathon Burst Test Button */}
              <button
                type="button"
                onClick={runBurstSimulation}
                disabled={isSubmitting || burstProgress !== null || cooldownRemaining > 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#FAF8FE] border border-[#E9E0FD] text-[#6C3BDB] hover:bg-[#F3EEFF] text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {burstProgress
                    ? `Simulating burst (${burstProgress.current}/${burstProgress.total})...`
                    : 'Simulate Rapid Clicks (Trigger Fair Limiter)'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Feedback / Result Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Status Display Card */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#736394] mb-3">
              Submission Feedback & Decision
            </h3>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
                  <span>Submission Error</span>
                </div>
                <p className="text-[11px] text-[#7F1D1D]">{errorMessage}</p>
              </div>
            )}

            {!errorMessage && !submissionResult && (
              <div className="py-12 text-center text-xs text-[#8E7EAF] space-y-2">
                <ShieldCheck className="w-10 h-10 text-[#6C3BDB]/40 mx-auto" />
                <p className="font-semibold text-[#645681]">Ready for Submission</p>
                <p className="text-[11px] max-w-xs mx-auto">
                  Click Submit to evaluate your browser's submission frequency against the configured fair access policy.
                </p>
              </div>
            )}

            {submissionResult && (
              <div className="space-y-4">
                {/* Decision Banner */}
                {submissionResult.decision === 'allow' && (
                  <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
                    <div className="flex items-center gap-2 text-[#047857] font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      <span>Decision: ALLOW (Accepted)</span>
                    </div>
                    <p className="text-xs text-[#065F46] leading-relaxed">
                      {submissionResult.message || 'Your assignment was successfully received and queued.'}
                    </p>
                  </div>
                )}

                {submissionResult.decision === 'warn' && (
                  <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
                    <div className="flex items-center gap-2 text-[#B45309] font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                      <span>Decision: WARN (Approaching Limit)</span>
                    </div>
                    <p className="text-xs text-[#92400E] leading-relaxed">
                      {submissionResult.message ||
                        'Warning: You are approaching the maximum allowed attempts in this window.'}
                    </p>
                    <p className="text-[11px] text-[#78350F] italic">
                      Note: Repeated rapid clicks will cause temporary slowdown to protect other students.
                    </p>
                  </div>
                )}

                {submissionResult.decision === 'slow' && (
                  <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-2">
                    <div className="flex items-center gap-2 text-[#B91C1C] font-bold text-xs">
                      <Clock className="w-4 h-4 text-[#EF4444]" />
                      <span>Decision: SLOW (Rate Limit Cooldown)</span>
                    </div>
                    <p className="text-xs text-[#991B1B] leading-relaxed">
                      {submissionResult.message || 'Rate limit threshold exceeded. Please slow down.'}
                    </p>
                    {cooldownRemaining > 0 && (
                      <div className="p-3 rounded-xl bg-white border border-[#FECACA] flex items-center justify-between">
                        <span className="text-xs text-[#7F1D1D] font-medium">Cooldown Timer:</span>
                        <span className="font-mono font-extrabold text-sm text-[#DC2626]">
                          {cooldownRemaining}s remaining
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Audit details metadata */}
                <div className="p-4 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD] space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#F0E8FE]">
                    <span className="text-[#736394]">Request ID</span>
                    <span className="font-mono text-[#45219A] text-[11px]">{submissionResult.request_id}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#F0E8FE]">
                    <span className="text-[#736394]">Requests in Window</span>
                    <span className="font-mono font-bold text-[#211A35]">
                      {submissionResult.requests_in_window ?? submissionResult.current_count ?? 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#F0E8FE]">
                    <span className="text-[#736394]">Acceptance State</span>
                    <span className={`font-semibold ${submissionResult.accepted ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                      {submissionResult.accepted ? 'Accepted' : 'Not Accepted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#736394]">Server Timestamp</span>
                    <span className="font-mono text-[10px] text-[#8E7EAF]">
                      {submissionResult.timestamp ? new Date(submissionResult.timestamp).toLocaleTimeString() : 'Now'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Educational Note */}
          <div className="p-4 rounded-2xl bg-[#F8F5FF] border border-[#E9E0FD] text-xs text-[#645681]">
            <p className="font-bold text-[#211A35] mb-1">Why Fair Access Matters</p>
            <p className="text-[11px] leading-relaxed text-[#736394]">
              During peak submission deadlines (e.g. 11:59 PM), students with fast scripts or panic re-clicking create server bottlenecks that block students on slower connections. Fair Access uses per-session sliding windows so everyone gets equitable queue access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
