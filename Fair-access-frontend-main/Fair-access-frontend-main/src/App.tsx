/**
 * Fair Access to Academic Web Forms
 * Modern, responsive frontend dashboard with Apple iOS glassmorphism design.
 * Built with React, TypeScript, and Tailwind CSS.
 */

import React, { useState } from 'react';
import { PageView } from './types';
import { BackendProvider } from './context/BackendContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { BackendConfigModal } from './components/common/BackendConfigModal';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { StudentSubmissionPage } from './pages/StudentSubmissionPage';
import { SessionMonitoringPage } from './pages/SessionMonitoringPage';
import { RequestHistoryPage } from './pages/RequestHistoryPage';
import { RateLimitSettingsPage } from './pages/RateLimitSettingsPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] via-[#F8F5FF] to-[#F1EAFF] flex text-[#211A35] font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenBackendModal={() => setIsBackendModalOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'overview' && <OverviewPage onNavigate={setCurrentPage} />}
          {currentPage === 'submission' && <StudentSubmissionPage />}
          {currentPage === 'sessions' && <SessionMonitoringPage />}
          {currentPage === 'history' && <RequestHistoryPage />}
          {currentPage === 'settings' && <RateLimitSettingsPage />}
          {currentPage === 'status' && <SystemStatusPage />}
        </main>
      </div>

      {/* Modals & Overlays */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <BackendConfigModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BackendProvider>
      <AppContent />
    </BackendProvider>
  );
}
