import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Terminal, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useBackend } from '../../context/BackendContext';

export const BackendDisconnectedBanner: React.FC = () => {
  const { isConnected, mode, setMode, checkConnection, isCheckingConnection, baseUrl, lastError } = useBackend();
  const [showInstructions, setShowInstructions] = useState(false);

  if (isConnected || mode === 'sandbox') {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#FFF5F5] to-[#FAF5FF] border border-[#FECACA] p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#FEE2E2] text-[#DC2626] shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#991B1B]">
              Backend Disconnected ({baseUrl})
            </h3>
            <p className="text-xs text-[#7F1D1D] mt-0.5 leading-relaxed">
              Unable to reach your FastAPI server. Make sure your local server is running with CORS enabled.
            </p>
            {lastError && (
              <p className="text-[11px] font-mono text-[#B91C1C] mt-1 bg-white/70 px-2 py-1 rounded-md border border-[#FCA5A5]/60 inline-block">
                Error: {lastError}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => checkConnection()}
            disabled={isCheckingConnection}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#991B1B] border border-[#FECACA] hover:bg-[#FEE2E2] text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-spin' : ''}`} />
            <span>Retry Connection</span>
          </button>

          <button
            onClick={() => setMode('sandbox')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6C3BDB] to-[#45219A] text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Demo Sandbox</span>
          </button>

          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-[#6C3BDB] hover:bg-[#F3EEFF] transition-colors"
          >
            <span>Run Server</span>
            {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="mt-4 pt-4 border-t border-[#FCD34D]/40 text-xs text-[#374151] space-y-3">
          <p className="font-semibold text-[#211A35]">
            Quick Start: Running your local FastAPI backend for Fair Access
          </p>
          <div className="bg-[#1E1735] text-[#E0D3FE] p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto space-y-2">
            <p className="text-white/60"># 1. Install FastAPI & Uvicorn</p>
            <p className="text-[#A78BFA]">pip install fastapi uvicorn</p>
            <p className="text-white/60"># 2. Run your server on port 8000</p>
            <p className="text-[#A78BFA]">uvicorn main:app --reload --host 127.0.0.1 --port 8000</p>
          </div>
          <p className="text-[11px] text-[#6B7280]">
            <span className="font-semibold text-[#211A35]">Important:</span> Ensure FastAPI has <code className="bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] text-[#6C3BDB]">CORSMiddleware</code> configured with <code className="bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] text-[#6C3BDB]">allow_origins=["*"]</code> so the browser frontend can communicate with <code className="bg-white px-1.5 py-0.5 rounded border border-[#E5E7EB] text-[#6C3BDB]">http://127.0.0.1:8000</code>.
          </p>
        </div>
      )}
    </div>
  );
};
