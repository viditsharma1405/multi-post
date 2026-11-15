import React from 'react';
import { 
  LayoutDashboard, 
  Send, 
  History, 
  Share2, 
  Settings, 
  Zap, 
  RefreshCw,
  X
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  backendStatus, 
  onRefreshHealth,
  isMobileOpen,
  setIsMobileOpen
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'compose', label: 'Compose Post', icon: Send, badge: 'Core' },
    { id: 'history', label: 'Publishing History', icon: History },
    { id: 'integrations', label: 'Platform Integrations', icon: Share2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const configuredCount = backendStatus?.data?.platforms_configured
    ? Object.values(backendStatus.data.platforms_configured).filter(Boolean).length
    : 0;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0E1526] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0E1526] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-white">MultiPost</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Broadcast Gateway</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button 
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Minimal Footer */}
        <div className="p-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${backendStatus.connected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            <span className="text-[11px] text-slate-400">
              {backendStatus.connected ? 'FastAPI 4000' : 'Backend Offline'}
            </span>
          </div>
          <button
            onClick={onRefreshHealth}
            className="text-slate-400 hover:text-slate-200"
            title="Refresh status"
          >
            <RefreshCw className={`w-3 h-3 ${backendStatus.checking ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
}
