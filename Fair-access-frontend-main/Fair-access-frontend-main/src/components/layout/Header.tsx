import React from 'react';
import {
  Menu,
  Bell,
  RefreshCw,
  Server,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { PageView } from '../../types';
import { useBackend } from '../../context/BackendContext';

interface HeaderProps {
  currentPage: PageView;
  onOpenMobileMenu: () => void;
  onOpenNotifications: () => void;
  onOpenBackendModal: () => void;
}

const pageTitles: Record<PageView, { title: string; subtitle: string }> = {
  overview: {
    title: 'Overview Dashboard',
    subtitle: 'Real-time telemetry and rate-limiting metrics',
  },
  submission: {
    title: 'Student Submission',
    subtitle: 'Submit assignments with fair access token verification',
  },
  sessions: {
    title: 'Session Monitoring',
    subtitle: 'Inspect student session sliding windows and threshold counters',
  },
  history: {
    title: 'Request History',
    subtitle: 'Audit log of requests, decisions, and acceptance statuses',
  },
  settings: {
    title: 'Rate Limit Settings',
    subtitle: 'Tune sliding window, max burst threshold, and cooldown timer',
  },
  status: {
    title: 'System Status & Architecture',
    subtitle: 'FastAPI health check, endpoint diagnostics, and design overview',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileMenu,
  onOpenNotifications,
  onOpenBackendModal,
}) => {
  const { isConnected, isCheckingConnection, latencyMs, mode, checkConnection, unreadCount } = useBackend();
  const currentInfo = pageTitles[currentPage];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-[#E9E0FD] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#645681] hover:text-[#211A35] hover:bg-[#F3EEFF] transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-[#8E7EAF]">
            <span>Fair Access</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#6C3BDB] font-semibold truncate">{currentInfo.title}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#211A35] truncate mt-0.5">
            {currentInfo.title}
          </h1>
        </div>
      </div>

      {/* Right: Backend Connection Status Pill, Notifications & Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Backend Connection Indicator */}
        <button
          onClick={onOpenBackendModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer ${
            isConnected
              ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] hover:bg-[#D1FAE5]'
              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] hover:bg-[#FEE2E2]'
          }`}
          title="Click to view Backend configuration & endpoints"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-[#10B981]' : 'bg-[#EF4444]'
            }`}
          />
          <span className="hidden sm:inline font-medium">
            {mode === 'sandbox'
              ? 'Demo Sandbox'
              : isConnected
              ? `FastAPI: Connected (${latencyMs}ms)`
              : 'Backend Disconnected'}
          </span>
          <span className="sm:hidden">
            {isConnected ? 'Online' : 'Offline'}
          </span>
          <Settings2 className="w-3.5 h-3.5 opacity-60" />
        </button>

        {/* Refresh connectivity check button */}
        <button
          onClick={() => checkConnection()}
          disabled={isCheckingConnection}
          title="Re-check Backend Connection"
          className="p-2 rounded-xl text-[#736394] hover:text-[#45219A] hover:bg-[#F3EEFF] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isCheckingConnection ? 'animate-spin text-[#6C3BDB]' : ''}`} />
        </button>

        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-[#736394] hover:text-[#45219A] hover:bg-[#F3EEFF] transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6C3BDB] ring-2 ring-white" />
          )}
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#E9E0FD]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6C3BDB] to-[#A78BFA] flex items-center justify-center text-white text-xs font-bold shadow-xs">
            FA
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-[#211A35] leading-none">Student Portal</p>
            <p className="text-[11px] text-[#8E7EAF] leading-none mt-1">CS Dept Evaluator</p>
          </div>
        </div>
      </div>
    </header>
  );
};
