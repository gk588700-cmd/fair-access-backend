import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, BackendMode } from '../services/api';
import { BackendHealthResponse, SystemNotification } from '../types';

interface BackendContextType {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  mode: BackendMode;
  setMode: (mode: BackendMode) => void;
  isConnected: boolean;
  isCheckingConnection: boolean;
  latencyMs: number;
  lastError: string | null;
  health: BackendHealthResponse | null;
  checkConnection: () => Promise<boolean>;
  studentSessionId: string;
  regenerateSessionId: () => string;
  notifications: SystemNotification[];
  addNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp'>) => void;
  clearNotifications: () => void;
  unreadCount: number;
  markNotificationsRead: () => void;
}

const BackendContext = createContext<BackendContextType | null>(null);

const STORAGE_KEY_STUDENT_SESSION = 'fair_access_student_session_id';

function generateRandomSessionId(): string {
  const rand = Math.random().toString(36).substring(2, 9);
  return `sess_${rand}`;
}

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baseUrl, setBaseUrlState] = useState<string>(api.getBaseUrl());
  const [mode, setModeState] = useState<BackendMode>(api.getMode());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [studentSessionId, setStudentSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENT_SESSION);
      if (saved) return saved;
      const created = generateRandomSessionId();
      localStorage.setItem(STORAGE_KEY_STUDENT_SESSION, created);
      return created;
    }
    return generateRandomSessionId();
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      type: 'info',
      title: 'Fair Access System Initialized',
      message: 'Monitoring academic web form submission rate thresholds.',
    },
  ]);

  const addNotification = useCallback((notif: Omit<SystemNotification, 'id' | 'timestamp'>) => {
    const newNotif: SystemNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
    setUnreadCount((c) => c + 1);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markNotificationsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const regenerateSessionId = useCallback(() => {
    const newId = generateRandomSessionId();
    setStudentSessionId(newId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STUDENT_SESSION, newId);
    }
    addNotification({
      type: 'info',
      title: 'New Student Session Generated',
      message: `Active session set to: ${newId}`,
      session_id: newId,
    });
    return newId;
  }, [addNotification]);

  const setBaseUrl = useCallback((newUrl: string) => {
    api.setBaseUrl(newUrl);
    setBaseUrlState(api.getBaseUrl());
  }, []);

  const setMode = useCallback((newMode: BackendMode) => {
    api.setMode(newMode);
    setModeState(newMode);
    addNotification({
      type: 'info',
      title: newMode === 'sandbox' ? 'Switched to Demo Sandbox' : 'Switched to Live FastAPI Backend',
      message:
        newMode === 'sandbox'
          ? 'Running in-browser interactive simulator with standard FastAPI contract.'
          : `Connecting to live FastAPI backend at ${api.getBaseUrl()}`,
    });
  }, [addNotification]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsCheckingConnection(true);
    try {
      const res = await api.checkHealth();
      setIsConnected(res.isConnected);
      setLatencyMs(res.latencyMs);
      if (res.isConnected) {
        setHealth(res.health || null);
        setLastError(null);
      } else {
        setHealth(null);
        setLastError(res.error || 'Connection failed');
      }
      return res.isConnected;
    } catch (err: any) {
      setIsConnected(false);
      setLatencyMs(0);
      setHealth(null);
      setLastError(err.message || 'Connection failed');
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  // Check connection on mount and every 15 seconds if in live mode
  useEffect(() => {
    checkConnection();
    const interval = setInterval(() => {
      checkConnection();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkConnection, mode, baseUrl]);

  return (
    <BackendContext.Provider
      value={{
        baseUrl,
        setBaseUrl,
        mode,
        setMode,
        isConnected,
        isCheckingConnection,
        latencyMs,
        lastError,
        health,
        checkConnection,
        studentSessionId,
        regenerateSessionId,
        notifications,
        addNotification,
        clearNotifications,
        unreadCount,
        markNotificationsRead,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};
