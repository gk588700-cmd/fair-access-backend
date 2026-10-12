import React from 'react';
import {
  LayoutDashboard,
  Send,
  Activity,
  History,
  Sliders,
  Server,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { PageView } from '../../types';
import { useBackend } from '../../context/BackendContext';

interface SidebarProps {
  currentPage: PageView;
  onSelectPage: (page: PageView) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpen,
  onCloseMobile,
}) => {
  const { studentSessionId, regenerateSessionId, mode, setMode, isConnected } = useBackend();

  const navItems: { id: PageView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'submission', label: 'Student Submission', icon: <Send className="w-5 h-5" /> },
    { id: 'sessions', label: 'Session Monitoring', icon: <Activity className="w-5 h-5" /> },
    { id: 'history', label: 'Request History', icon: <History className="w-5 h-5" /> },
    { id: 'settings', label: 'Rate Limit Settings', icon: <Sliders className="w-5 h-5" /> },
    { id: 'status', label: 'System Status', icon: <Server className="w-5 h-5" /> },
  ];

  const handleNavClick = (page: PageView) => {
    onSelectPage(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#211A35]/30 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 z-50 flex flex-col justify-between
          bg-white/90 backdrop-blur-xl border-r border-[#E9E0FD] p-5 shadow-[4px_0_24px_rgba(108,59,219,0.04)]
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div>
          {/* Logo & Project Brand */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C3BDB] to-[#9D71FD] flex items-center justify-center text-white shadow-md shadow-[#6C3BDB]/25">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-[#211A35]">Fair Access</span>
              </div>
              <p className="text-xs text-[#7B6E96] font-medium leading-none mt-0.5">
                Academic Web Forms
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 group
                    ${
                      isActive
                        ? 'bg-[#F3EEFF] text-[#45219A] shadow-xs'
                        : 'text-[#645681] hover:text-[#211A35] hover:bg-[#FAF8FE]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-colors duration-150 ${
                        isActive ? 'text-[#6C3BDB]' : 'text-[#8E7EAF] group-hover:text-[#6C3BDB]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6C3BDB]" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Active Student Session & Backend Mode Card */}
        <div className="space-y-3 pt-4 border-t border-[#F0E8FE]">
          {/* Active Session Card */}
          <div className="p-3 rounded-2xl bg-[#F8F5FF] border border-[#E9E0FD]/80">
            <div className="flex items-center justify-between text-xs text-[#736394] mb-1.5">
              <span className="font-medium">My Student Session</span>
              <button
                onClick={regenerateSessionId}
                title="Regenerate unique student browser session ID"
                className="text-[#6C3BDB] hover:text-[#45219A] p-1 rounded-lg hover:bg-white/80 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="font-mono text-xs font-semibold text-[#45219A] truncate bg-white px-2 py-1.5 rounded-xl border border-[#E9E0FD]">
              {studentSessionId}
            </div>
          </div>

          {/* Engine Mode Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E9E0FD] text-xs">
            <span className="text-[#645681] font-medium pl-1">
              {mode === 'live' ? 'FastAPI Backend' : 'Demo Sandbox'}
            </span>
            <button
              onClick={() => setMode(mode === 'live' ? 'sandbox' : 'live')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                mode === 'sandbox'
                  ? 'bg-[#F3EEFF] text-[#6C3BDB] border border-[#D5C2FA]'
                  : 'bg-[#6C3BDB] text-white hover:bg-[#45219A]'
              }`}
            >
              {mode === 'live' ? 'Live' : 'Sandbox'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
