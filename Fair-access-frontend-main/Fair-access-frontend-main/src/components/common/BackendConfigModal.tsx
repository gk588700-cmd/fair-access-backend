import React, { useState } from 'react';
import { X, Server, Check, AlertCircle, RefreshCw, Sparkles, Copy, CheckCheck } from 'lucide-react';
import { useBackend } from '../../context/BackendContext';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({ isOpen, onClose }) => {
  const { baseUrl, setBaseUrl, mode, setMode, isConnected, checkConnection, isCheckingConnection, latencyMs, lastError } = useBackend();
  const [inputUrl, setInputUrl] = useState(baseUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBaseUrl(inputUrl);
    setSaveSuccess(true);
    await checkConnection();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(null), 1500);
  };

  const endpoints = [
    { method: 'GET', path: '/', desc: 'Project information & description' },
    { method: 'GET', path: '/health', desc: 'Backend health check & uptime' },
    { method: 'GET', path: '/config', desc: 'Current rate-limit settings' },
    { method: 'PUT', path: '/config', desc: 'Update rate-limit settings' },
    { method: 'POST', path: '/submit', desc: 'Process student submission' },
    { method: 'GET', path: '/sessions', desc: 'Active sessions list' },
    { method: 'GET', path: '/history?limit=50', desc: 'Recent request audit log' },
    { method: 'POST', path: '/sessions/{session_id}/clear', desc: 'Clear a session counter' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#211A35]/40 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E9E0FD] p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E8FE]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F3EEFF] text-[#6C3BDB]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#211A35]">Backend API Configuration</h2>
              <p className="text-xs text-[#7B6E96]">Centralized endpoint & connectivity settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8E7EAF] hover:text-[#211A35] hover:bg-[#F3EEFF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="mt-5 p-4 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'
              }`}
            />
            <div>
              <p className="text-xs font-bold text-[#211A35]">
                {mode === 'sandbox'
                  ? 'Interactive Demo Sandbox Mode'
                  : isConnected
                  ? `Connected to FastAPI (${latencyMs}ms)`
                  : 'Backend Disconnected'}
              </p>
              <p className="text-[11px] text-[#7B6E96]">
                Target: <span className="font-mono font-medium">{baseUrl}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => checkConnection()}
            disabled={isCheckingConnection}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E9E0FD] text-xs font-semibold text-[#6C3BDB] hover:bg-[#F3EEFF] transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-spin' : ''}`} />
            <span>Test Ping</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mt-5">
          <label className="block text-xs font-bold text-[#211A35] mb-2">Backend Mode</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMode('live')}
              className={`p-3 rounded-2xl text-left border transition-all ${
                mode === 'live'
                  ? 'border-[#6C3BDB] bg-[#F3EEFF]/60 ring-2 ring-[#6C3BDB]/20'
                  : 'border-[#E9E0FD] bg-white hover:bg-[#FAF8FE]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#211A35]">Live FastAPI</span>
                {mode === 'live' && <span className="w-2 h-2 rounded-full bg-[#6C3BDB]" />}
              </div>
              <p className="text-[11px] text-[#7B6E96]">Sends real HTTP requests to your local Python server.</p>
            </button>

            <button
              type="button"
              onClick={() => setMode('sandbox')}
              className={`p-3 rounded-2xl text-left border transition-all ${
                mode === 'sandbox'
                  ? 'border-[#6C3BDB] bg-[#F3EEFF]/60 ring-2 ring-[#6C3BDB]/20'
                  : 'border-[#E9E0FD] bg-white hover:bg-[#FAF8FE]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#211A35]">Demo Sandbox</span>
                {mode === 'sandbox' && <Sparkles className="w-3.5 h-3.5 text-[#6C3BDB]" />}
              </div>
              <p className="text-[11px] text-[#7B6E96]">Zero-setup interactive simulation for presentations.</p>
            </button>
          </div>
        </div>

        {/* URL Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#211A35] mb-1.5">
              FastAPI Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E9E0FD] focus:outline-hidden focus:border-[#6C3BDB] focus:ring-2 focus:ring-[#6C3BDB]/20 text-xs font-mono text-[#211A35]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C3BDB] to-[#45219A] text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-opacity"
              >
                {saveSuccess ? 'Saved!' : 'Save URL'}
              </button>
            </div>
            <p className="text-[11px] text-[#8E7EAF] mt-1">
              Default: <code className="bg-[#F3EEFF] text-[#45219A] px-1 py-0.5 rounded">http://127.0.0.1:8000</code>. You can change this if running on a custom port or ngrok tunnel.
            </p>
          </div>
        </form>

        {/* Endpoints List */}
        <div className="mt-6 pt-5 border-t border-[#F0E8FE]">
          <h3 className="text-xs font-bold text-[#211A35] mb-3">Implemented API Endpoints Contract</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {endpoints.map((ep) => (
              <div
                key={ep.path + ep.method}
                className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8FE] border border-[#E9E0FD]/70 text-xs hover:bg-[#F3EEFF]/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                      ep.method === 'GET'
                        ? 'bg-[#E0F2FE] text-[#0369A1]'
                        : ep.method === 'POST'
                        ? 'bg-[#ECFDF5] text-[#047857]'
                        : 'bg-[#FEF3C7] text-[#B45309]'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-[11px] text-[#211A35] font-semibold">{ep.path}</span>
                  <span className="text-[11px] text-[#8E7EAF] hidden sm:inline">— {ep.desc}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`${baseUrl}${ep.path}`)}
                  className="p-1 rounded text-[#8E7EAF] hover:text-[#45219A] transition-colors"
                  title="Copy full URL"
                >
                  {copiedEndpoint === `${baseUrl}${ep.path}` ? (
                    <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#F0E8FE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F3EEFF] text-[#45219A] font-semibold text-xs hover:bg-[#E9E0FD] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
