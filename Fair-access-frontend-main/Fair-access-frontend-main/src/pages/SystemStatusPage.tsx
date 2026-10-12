import React, { useEffect, useState } from 'react';
import {
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Code2,
  FileCheck,
  Layers,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { BackendHealthResponse, ProjectInfoResponse } from '../types';
import { useBackend } from '../context/BackendContext';
import { BackendDisconnectedBanner } from '../components/common/BackendDisconnectedBanner';

export const SystemStatusPage: React.FC = () => {
  const { isConnected, mode, baseUrl, latencyMs, checkConnection, isCheckingConnection } = useBackend();
  const [projectInfo, setProjectInfo] = useState<ProjectInfoResponse | null>(null);
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [info, hlth] = await Promise.all([
        api.getProjectInfo().catch(() => null),
        api.getHealth().catch(() => null),
      ]);
      setProjectInfo(info);
      setHealth(hlth);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isConnected, mode]);

  const fastapiSampleCode = `# FastAPI Backend Contract for Fair Access to Academic Web Forms
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import time

app = FastAPI(title="Fair Access API", version="1.0.0")

# Crucial for browser frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = {
    "window_seconds": 60,
    "max_requests": 5,
    "slowdown_seconds": 15
}

# In-memory storage for hackathon prototype
sessions: Dict[str, list] = {}
history: list = []

@app.get("/")
def get_info():
    return {
        "name": "Fair Access to Academic Web Forms",
        "version": "1.0.0",
        "description": "Rate-limiting algorithm for equitable form submissions"
    }

@app.get("/health")
def get_health():
    return {"status": "healthy", "uptime_seconds": 3600, "active_sessions_count": len(sessions)}

@app.get("/config")
def get_config():
    return config

@app.put("/config")
def update_config(new_config: dict):
    config.update(new_config)
    return {"status": "success", "config": config}

@app.get("/sessions")
def get_sessions():
    now = time.time()
    result = []
    for sess_id, timestamps in sessions.items():
        recent = [t for t in timestamps if t >= now - config["window_seconds"]]
        status = "normal" if len(recent) < config["max_requests"] else ("warn" if len(recent) == config["max_requests"] else "flagged")
        result.append({"session_id": sess_id, "requests_in_window": len(recent), "status": status})
    return result

@app.get("/history")
def get_history(limit: int = 50):
    return history[:limit]

@app.post("/submit")
def submit_form(payload: dict):
    now = time.time()
    sess_id = payload["session_id"]
    req_id = payload["request_id"]
    
    if sess_id not in sessions:
        sessions[sess_id] = []
    
    # filter sliding window
    sessions[sess_id] = [t for t in sessions[sess_id] if t >= now - config["window_seconds"]]
    current_count = len(sessions[sess_id]) + 1
    sessions[sess_id].append(now)
    
    if current_count <= config["max_requests"] - 1:
        decision = "allow"
        msg = f"Accepted. Request {current_count} in {config['window_seconds']}s window."
    elif current_count == config["max_requests"]:
        decision = "warn"
        msg = f"Warning: Threshold reached ({config['max_requests']} requests)."
    else:
        decision = "slow"
        msg = f"Please wait {config['slowdown_seconds']}s cooldown before retrying."
    
    record = {
        "request_id": req_id,
        "session_id": sess_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "requests_in_window": current_count,
        "decision": decision,
        "accepted": decision == "allow",
        "form_data": payload.get("form_data", {})
    }
    history.insert(0, record)
    return record

@app.post("/sessions/{session_id}/clear")
def clear_session(session_id: str):
    sessions[session_id] = []
    return {"status": "success", "message": "Counter cleared", "session_id": session_id}
`;

  const copyCode = () => {
    navigator.clipboard.writeText(fastapiSampleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <BackendDisconnectedBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#211A35]">
            System Status & Academic Architecture
          </h2>
          <p className="text-xs text-[#7B6E96] mt-0.5">
            Backend health diagnostics, connectivity probes, and project overview
          </p>
        </div>

        <button
          onClick={() => {
            checkConnection();
            fetchData();
          }}
          disabled={isLoading || isCheckingConnection}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#45219A] border border-[#E9E0FD] hover:bg-[#F3EEFF] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isCheckingConnection ? 'animate-spin text-[#6C3BDB]' : ''}`} />
          <span>Run Diagnostic</span>
        </button>
      </div>

      {/* Connectivity & Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection status card */}
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#736394] uppercase tracking-wider">
              Connection
            </span>
            <span
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-[#10B981]' : 'bg-[#EF4444]'
              }`}
            />
          </div>
          <div className="text-xl font-extrabold text-[#211A35]">
            {mode === 'sandbox'
              ? 'Demo Sandbox'
              : isConnected
              ? 'FastAPI Online'
              : 'Disconnected'}
          </div>
          <p className="text-xs font-mono text-[#8E7EAF] mt-1 truncate">
            {baseUrl}
          </p>
        </div>

        {/* Latency Probe */}
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#736394] uppercase tracking-wider">
              Probe Latency
            </span>
            <Activity className="w-4 h-4 text-[#6C3BDB]" />
          </div>
          <div className="text-xl font-extrabold text-[#211A35] font-mono tabular-nums">
            {latencyMs} ms
          </div>
          <p className="text-xs text-[#8E7EAF] mt-1">
            Roundtrip ping to <code className="font-mono text-[#6C3BDB]">/health</code>
          </p>
        </div>

        {/* Health status */}
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#736394] uppercase tracking-wider">
              Health Status
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-xl font-extrabold text-[#211A35] capitalize">
            {health?.status || (isConnected ? 'Operational' : 'Unavailable')}
          </div>
          <p className="text-xs text-[#8E7EAF] mt-1">
            Uptime: <span className="font-mono">{health?.uptime_seconds ? `${health.uptime_seconds}s` : 'Active'}</span>
          </p>
        </div>
      </div>

      {/* Project Information Details (GET /) */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-sm font-bold text-[#211A35] mb-4 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#6C3BDB]" />
          <span>Project Information (GET /)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD]">
            <span className="text-[#8E7EAF] block mb-1">Project Name</span>
            <span className="font-bold text-[#211A35]">
              {projectInfo?.name || projectInfo?.title || 'Fair Access to Academic Web Forms'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD]">
            <span className="text-[#8E7EAF] block mb-1">Backend Version</span>
            <span className="font-mono font-bold text-[#45219A]">
              {projectInfo?.version || 'FastAPI 1.0.0'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD]">
            <span className="text-[#8E7EAF] block mb-1">Core Algorithm</span>
            <span className="font-semibold text-[#211A35]">
              {projectInfo?.algorithm || 'Sliding Window Token Bucket'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD]">
            <span className="text-[#8E7EAF] block mb-1">System Status</span>
            <span className="font-semibold text-[#059669]">
              {projectInfo?.status || 'All services operational'}
            </span>
          </div>
        </div>

        {projectInfo?.description && (
          <p className="mt-4 text-xs text-[#645681] leading-relaxed bg-[#F8F5FF] p-3.5 rounded-2xl border border-[#E9E0FD]">
            {projectInfo.description}
          </p>
        )}
      </div>

      {/* Architectural Overview for Hackathon Presentation */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#6C3BDB]" />
          <h3 className="text-sm font-bold text-[#211A35]">
            Fair Access Architecture & Academic Impact
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD] space-y-1.5">
            <h4 className="font-bold text-[#45219A]">1. The Academic Rush Problem</h4>
            <p className="text-[#645681] leading-relaxed text-[11px]">
              During course registration and midnight assignment deadlines, portals face immense concurrent bursts. Fast automated scripts or rapid panic re-clicking saturate backend worker threads, completely locking out students on mobile data or slower connections.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD] space-y-1.5">
            <h4 className="font-bold text-[#45219A]">2. The Fair Access Solution</h4>
            <p className="text-[#645681] leading-relaxed text-[11px]">
              Rather than completely blocking IP addresses (which punishes entire campus dorms or lab subnets sharing a single NAT gateway), Fair Access enforces granular, per-session sliding windows with graceful progressive backoff (allow → warn → slow).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD] space-y-1.5">
            <h4 className="font-bold text-[#45219A]">3. Equity & Transparency</h4>
            <p className="text-[#645681] leading-relaxed text-[11px]">
              Students receive transparent countdown timers and queue placement notifications rather than cryptic 502/504 Bad Gateway crashes. Legitimate submissions are guaranteed processing without unfair queue jumping.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Code Reference Accordion / Card */}
      <div className="glass-card rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#6C3BDB]" />
            <h3 className="text-sm font-bold text-[#211A35]">
              FastAPI Implementation Code Contract
            </h3>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E9E0FD] text-xs font-semibold text-[#6C3BDB] hover:bg-[#F3EEFF] transition-colors"
          >
            {copiedCode ? <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied!' : 'Copy Python Code'}</span>
          </button>
        </div>

        <p className="text-xs text-[#7B6E96]">
          You can run this minimal script locally to provide the exact REST API expected by this dashboard.
        </p>

        <div className="rounded-2xl bg-[#1E1735] p-4 text-[11px] font-mono text-[#E0D3FE] overflow-x-auto max-h-72">
          <pre>{fastapiSampleCode}</pre>
        </div>
      </div>
    </div>
  );
};
