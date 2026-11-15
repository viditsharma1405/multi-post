import React from 'react';
import { 
  Menu, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Wifi, 
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
        return {
          title: 'Publishing Operations',
          subtitle: 'Monitor broadcast pipelines and broadcast live across all 5 networks.',
        };
      case 'compose':
        return {
          title: 'Compose Post',
          subtitle: 'Craft and dispatch announcements simultaneously to Bluesky, Mastodon, Dev.to, Telegram, and Discord.',
        };
      case 'history':
        return {
          title: 'Publishing History',
          subtitle: 'Review recent broadcast runs stored in local browser storage.',
        };
      case 'integrations':
        return {
          title: 'Platform Integrations',
          subtitle: 'Live connection status and capability specifications for each supported channel.',
        };
      case 'settings':
        return {
          title: 'System Settings',
          subtitle: 'Configure backend endpoints and manage local application preferences.',
        };
      default:
        return {
          title: 'MultiPost Dashboard',
          subtitle: 'Multi-platform social distribution engine.',
        };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: Mobile trigger & Titles */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>{title}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{subtitle}</p>
          </div>
        </div>

        {/* Right: Date, Backend Indicator & Config Ratio */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentDate}</span>
          </div>

          {/* Backend Connection Indicator */}
          <div 
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              backendStatus.checking
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : backendStatus.connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {backendStatus.checking ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Checking connection...</span>
              </>
            ) : backendStatus.connected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold">Backend Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold">Backend Disconnected</span>
                <button
                  onClick={onRefreshHealth}
                  className="ml-1 underline text-[11px] hover:text-rose-200"
                >
                  Retry
                </button>
              </>
            )}
          </div>

          {/* Overall Platform Configuration Ratio */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Readiness:</span>
            <span className={`font-semibold ${readyCount === totalPlatforms ? 'text-emerald-400' : readyCount > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
              {backendStatus.connected ? `${readyCount}/${totalPlatforms} Platforms Active` : '—'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
