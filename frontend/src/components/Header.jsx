import React from 'react';
import { 
  Menu, 
  Calendar, 
  RefreshCw, 
  WifiOff 
} from 'lucide-react';

export default function Header({ 
  currentTab, 
  backendStatus, 
  onRefreshHealth, 
  onToggleMobileMenu 
}) {
  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const platformsConfigured = backendStatus?.data?.platforms_configured || {};
  const readyCount = Object.values(platformsConfigured).filter(Boolean).length;
  const totalPlatforms = 5;

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'compose':
        return 'Compose Post';
      case 'history':
        return 'Publishing History';
      case 'integrations':
        return 'Platform Integrations';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const title = getPageTitle();

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile trigger & Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
            {title}
          </h1>
        </div>

        {/* Right: Date & Backend Indicator */}
        <div className="flex items-center space-x-3">
          {/* Date Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentDate}</span>
          </div>

          {/* Backend Connection Indicator */}
          <div 
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              backendStatus.checking
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : backendStatus.connected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {backendStatus.checking ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                <span>Checking...</span>
              </>
            ) : backendStatus.connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-400" />
                <span>Disconnected</span>
                <button
                  onClick={onRefreshHealth}
                  className="ml-1 underline text-[11px] hover:text-rose-200"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
