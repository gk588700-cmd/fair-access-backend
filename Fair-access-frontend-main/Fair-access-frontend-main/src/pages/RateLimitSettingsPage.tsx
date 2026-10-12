import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Clock,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { RateLimitConfig } from '../types';
import { useBackend } from '../context/BackendContext';
import { BackendDisconnectedBanner } from '../components/common/BackendDisconnectedBanner';

export const RateLimitSettingsPage: React.FC = () => {
  const { isConnected, mode, addNotification } = useBackend();

  const [config, setConfig] = useState<RateLimitConfig>({
    window_seconds: 60,
    max_requests: 5,
    slowdown_seconds: 15,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setIsLoading(true);
    setSaveStatus(null);
    try {
      const data = await api.getConfig();
      if (data) {
        setConfig({
          window_seconds: Number(data.window_seconds) || 60,
          max_requests: Number(data.max_requests) || 5,
          slowdown_seconds: Number(data.slowdown_seconds) || 15,
        });
      }
    } catch (err: any) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'Failed to load configuration from backend',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [isConnected, mode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSaveStatus(null);

    // Validation
    if (config.window_seconds <= 0 || config.window_seconds > 3600) {
      setValidationError('Time window must be between 1 and 3600 seconds.');
      return;
    }
    if (config.max_requests <= 0 || config.max_requests > 100) {
      setValidationError('Max requests must be between 1 and 100.');
      return;
    }
    if (config.slowdown_seconds <= 0 || config.slowdown_seconds > 600) {
      setValidationError('Slowdown duration must be between 1 and 600 seconds.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateConfig(config);
      setSaveStatus({
        type: 'success',
        message: res.message || 'Rate limit settings successfully updated on backend!',
      });
      addNotification({
        type: 'success',
        title: 'Rate Limit Policy Updated',
        message: `Window: ${config.window_seconds}s | Max: ${config.max_requests} req | Slowdown: ${config.slowdown_seconds}s`,
      });
    } catch (err: any) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'Failed to save settings to backend.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (preset: RateLimitConfig) => {
    setConfig(preset);
    setValidationError(null);
    setSaveStatus(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <BackendDisconnectedBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#211A35]">
            Rate Limit Policy Configuration
          </h2>
          <p className="text-xs text-[#7B6E96] mt-0.5">
            Configure the sliding window token constraints to prevent submission denial of service
          </p>
        </div>

        <button
          onClick={fetchConfig}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#45219A] border border-[#E9E0FD] hover:bg-[#F3EEFF] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#6C3BDB]' : ''}`} />
          <span>Reload Config</span>
        </button>
      </div>

      {/* Save Status Alert */}
      {saveStatus && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            saveStatus.type === 'success'
              ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button onClick={() => setSaveStatus(null)} className="text-current opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-7">
          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Time Window in Seconds */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#211A35] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6C3BDB]" />
                  <span>Time Window (Seconds)</span>
                </label>
                <span className="font-mono font-bold text-xs text-[#6C3BDB]">
                  {config.window_seconds}s
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={3600}
                required
                value={config.window_seconds}
                onChange={(e) => setConfig({ ...config, window_seconds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs font-mono text-[#211A35]"
              />
              <p className="text-[11px] text-[#8E7EAF] mt-1">
                Duration of the sliding rolling window used to tally consecutive requests per student session.
              </p>
            </div>

            {/* 2. Maximum Allowed Requests */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#211A35] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#6C3BDB]" />
                  <span>Maximum Allowed Requests</span>
                </label>
                <span className="font-mono font-bold text-xs text-[#6C3BDB]">
                  {config.max_requests} req
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={config.max_requests}
                onChange={(e) => setConfig({ ...config, max_requests: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs font-mono text-[#211A35]"
              />
              <p className="text-[11px] text-[#8E7EAF] mt-1">
                Maximum submissions permitted before triggering warnings or mandatory cooldown delay.
              </p>
            </div>

            {/* 3. Slowdown Duration */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#211A35] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6C3BDB]" />
                  <span>Slowdown / Cooldown Duration (Seconds)</span>
                </label>
                <span className="font-mono font-bold text-xs text-[#6C3BDB]">
                  {config.slowdown_seconds}s
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={600}
                required
                value={config.slowdown_seconds}
                onChange={(e) => setConfig({ ...config, slowdown_seconds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs font-mono text-[#211A35]"
              />
              <p className="text-[11px] text-[#8E7EAF] mt-1">
                Forced wait period imposed when the student attempts to flood the portal beyond max requests.
              </p>
            </div>

            {validationError && (
              <p className="text-xs text-[#DC2626] bg-[#FEF2F2] p-3 rounded-xl border border-[#FECACA]">
                {validationError}
              </p>
            )}

            {/* Purple Save Settings Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6C3BDB] to-[#45219A] text-white text-xs font-bold shadow-md shadow-[#6C3BDB]/25 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Backend API (PUT /config)...</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Presets & Simulator Explainer Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Preset Profiles */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#736394] mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#6C3BDB]" />
              <span>Recommended Presets</span>
            </h3>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => applyPreset({ window_seconds: 60, max_requests: 5, slowdown_seconds: 15 })}
                className="w-full text-left p-3 rounded-2xl border border-[#E9E0FD] hover:border-[#6C3BDB] hover:bg-[#F3EEFF]/50 transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#211A35]">Standard Portal (Default)</span>
                  <span className="text-[10px] font-mono text-[#6C3BDB]">5 req / 60s</span>
                </div>
                <p className="text-[11px] text-[#7B6E96]">
                  Balanced setting for general academic assignment submissions.
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({ window_seconds: 30, max_requests: 3, slowdown_seconds: 30 })}
                className="w-full text-left p-3 rounded-2xl border border-[#E9E0FD] hover:border-[#6C3BDB] hover:bg-[#F3EEFF]/50 transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#211A35]">Strict Examination Mode</span>
                  <span className="text-[10px] font-mono text-[#6C3BDB]">3 req / 30s</span>
                </div>
                <p className="text-[11px] text-[#7B6E96]">
                  Strictly mitigates automated script attempts and brute-force submissions.
                </p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset({ window_seconds: 60, max_requests: 10, slowdown_seconds: 10 })}
                className="w-full text-left p-3 rounded-2xl border border-[#E9E0FD] hover:border-[#6C3BDB] hover:bg-[#F3EEFF]/50 transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#211A35]">High-Traffic Exam Rush</span>
                  <span className="text-[10px] font-mono text-[#6C3BDB]">10 req / 60s</span>
                </div>
                <p className="text-[11px] text-[#7B6E96]">
                  Allows higher tolerance during critical deadline hours before applying backoff.
                </p>
              </button>
            </div>
          </div>

          {/* Policy Simulation Visualizer */}
          <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-[#FAF8FE] to-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#736394] mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#6C3BDB]" />
              <span>Policy Evaluation Behavior</span>
            </h3>

            <div className="space-y-2 text-xs text-[#4B5563] pt-1">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#E9E0FD]">
                <span className="w-5 h-5 rounded-md bg-[#ECFDF5] text-[#059669] font-mono text-[10px] font-bold flex items-center justify-center">
                  1..{Math.max(1, config.max_requests - 1)}
                </span>
                <span className="text-[11px]">
                  <strong>ALLOW:</strong> Immediate server processing
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#E9E0FD]">
                <span className="w-5 h-5 rounded-md bg-[#FEF3C7] text-[#B45309] font-mono text-[10px] font-bold flex items-center justify-center">
                  {config.max_requests}
                </span>
                <span className="text-[11px]">
                  <strong>WARN:</strong> Warning banner on submission form
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#E9E0FD]">
                <span className="w-5 h-5 rounded-md bg-[#FEF2F2] text-[#DC2626] font-mono text-[10px] font-bold flex items-center justify-center">
                  &gt;{config.max_requests}
                </span>
                <span className="text-[11px]">
                  <strong>SLOW:</strong> Mandatory {config.slowdown_seconds}s backoff timer
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
