import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Compose from './pages/Compose';
import HistoryPage from './pages/History';
import Integrations from './pages/Integrations';
import SettingsPage from './pages/Settings';
import { checkBackendHealth } from './services/api';
import { getLocalHistory, saveHistoryItem, clearLocalHistory } from './utils/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    checking: true,
    data: null,
    error: null,
  });

  // Publishing history state
  const [history, setHistory] = useState([]);

  // Latest broadcast results for review
  const [latestResult, setLatestResult] = useState(null);

  // Load health status
  const fetchHealth = useCallback(async () => {
    setBackendStatus((prev) => ({ ...prev, checking: true }));
    const res = await checkBackendHealth();
    if (res.ok) {
      setBackendStatus({
        connected: true,
        checking: false,
        data: res.data,
        error: null,
      });
    } else {
      setBackendStatus({
        connected: false,
        checking: false,
        data: null,
        error: res.error,
      });
    }
  }, []);

  // Initial load: check health and retrieve history
  useEffect(() => {
    fetchHealth();
    setHistory(getLocalHistory());

    // Periodically re-check health every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Handler for successful publish run
  const handlePublishSuccess = (data) => {
    // 1. Save to local storage
    const saved = saveHistoryItem({
      message: data.message,
      success: data.response.success,
      summary: data.response.summary,
      results: data.response.results,
    });

    // 2. Update state
    setHistory(getLocalHistory());
    setLatestResult({
      message: data.message,
      response: data.response,
    });

    // Auto-scroll to results
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
    }, 150);
  };

  // Handler for clearing history
  const handleClearHistory = () => {
    clearLocalHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col lg:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        backendStatus={backendStatus}
        onRefreshHealth={fetchHealth}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        
        {/* Dynamic Dashboard Header */}
        <Header
          currentTab={currentTab}
          backendStatus={backendStatus}
          onRefreshHealth={fetchHealth}
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              backendStatus={backendStatus}
              onRefreshHealth={fetchHealth}
              onPublishSuccess={handlePublishSuccess}
              latestResult={latestResult}
              onDismissResult={() => setLatestResult(null)}
              onNavigateToCompose={() => {
                setCurrentTab('compose');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToHistory={() => {
                setCurrentTab('history');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              historyCount={history.length}
            />
          )}

          {currentTab === 'compose' && (
            <Compose
              backendStatus={backendStatus}
              onPublishSuccess={handlePublishSuccess}
              latestResult={latestResult}
              onDismissResult={() => setLatestResult(null)}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage
              history={history}
              onClearHistory={handleClearHistory}
              onNavigateToCompose={() => {
                setCurrentTab('compose');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentTab === 'integrations' && (
            <Integrations
              backendStatus={backendStatus}
              onRefreshHealth={fetchHealth}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              backendStatus={backendStatus}
              onRefreshHealth={fetchHealth}
              onClearHistory={handleClearHistory}
              historyCount={history.length}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="py-4 px-8 border-t border-slate-800/60 text-center text-xs text-slate-500">
          <p>
            MultiPost • One message. Five platforms. Zero repetitive work.
          </p>
        </footer>

      </div>

    </div>
  );
}
