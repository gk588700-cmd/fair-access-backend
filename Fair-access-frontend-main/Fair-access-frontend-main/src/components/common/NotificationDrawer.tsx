import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, AlertOctagon, Info, Trash2 } from 'lucide-react';
import { useBackend } from '../../context/BackendContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, clearNotifications, markNotificationsRead } = useBackend();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-[#211A35]/30 backdrop-blur-xs transition-opacity"
        onClick={() => {
          markNotificationsRead();
          onClose();
        }}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-[#E9E0FD] flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#F0E8FE] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#F3EEFF] text-[#6C3BDB]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#211A35]">Activity Notifications</h3>
                <p className="text-[11px] text-[#7B6E96]">{notifications.length} events recorded</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="p-1.5 rounded-lg text-[#8E7EAF] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  markNotificationsRead();
                  onClose();
                }}
                className="p-1.5 rounded-lg text-[#8E7EAF] hover:text-[#211A35] hover:bg-[#F3EEFF] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#8E7EAF]">
                <Bell className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-xs font-semibold text-[#645681]">No notifications yet</p>
                <p className="text-[11px] mt-1">Actions and rate limit status alerts will appear here in real time.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const icon =
                  n.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  ) : n.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                  ) : n.type === 'error' ? (
                    <AlertOctagon className="w-4 h-4 text-[#EF4444]" />
                  ) : (
                    <Info className="w-4 h-4 text-[#6C3BDB]" />
                  );

                return (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E9E0FD] hover:border-[#D5C2FA] transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#211A35] truncate">{n.title}</p>
                          <span className="text-[10px] font-mono text-[#8E7EAF] shrink-0">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#645681] mt-1 leading-relaxed">{n.message}</p>
                        {n.session_id && (
                          <div className="mt-2 text-[10px] font-mono text-[#6C3BDB] bg-white px-2 py-0.5 rounded-md border border-[#E9E0FD] inline-block">
                            session: {n.session_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
