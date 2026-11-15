import React from 'react';
import PlatformCard from '../components/PlatformCard';
import PostComposer from '../components/PostComposer';
import ResultsSummary from '../components/ResultsSummary';
import { ORDERED_PLATFORMS } from '../utils/platforms';
import { 
  Zap, 
  Send, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  TrendingUp, 
  Clock,
  ArrowRight
} from 'lucide-react';

export default function Dashboard({ 
  backendStatus, 
  onRefreshHealth,
  onPublishSuccess, 
  latestResult, 
  onDismissResult,
  onNavigateToCompose,
  onNavigateToHistory,
  historyCount = 0
}) {
  const platformsConfigured = backendStatus?.data?.platforms_configured || {};
  const readyCount = Object.values(platformsConfigured).filter(Boolean).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Simultaneous Multi-Platform Engine</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            One message. Five platforms. Zero repetitive work.
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            MultiPost broadcasts your marketing updates and developer announcements concurrently to 
            <span className="text-sky-400 font-semibold"> Bluesky</span>, 
            <span className="text-indigo-400 font-semibold"> Mastodon</span>, 
            <span className="text-emerald-400 font-semibold"> Dev.to</span>, 
            <span className="text-cyan-400 font-semibold"> Telegram</span>, and 
            <span className="text-violet-400 font-semibold"> Discord</span> with isolated fault tolerance.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToCompose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Compose New Post</span>
            </button>
            <button
              onClick={onNavigateToHistory}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/60 transition-all flex items-center space-x-2"
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>View History ({historyCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Platform Status Section Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Platform Pipelines</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {readyCount} of 5 Active
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Live platform configuration retrieved from backend environment.</p>
          </div>
          
          <button
            onClick={onRefreshHealth}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Refresh Status
          </button>
        </div>

        {/* 5 Platform Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ORDERED_PLATFORMS.map((plat) => (
            <PlatformCard
              key={plat}
              platformKey={plat}
              isConfigured={Boolean(platformsConfigured[plat])}
            />
          ))}
        </div>
      </div>

      {/* Core Post Composer Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-white tracking-tight">Quick Broadcast</h3>
          <p className="text-xs text-slate-400 mt-0.5">Submit your update with exactly one target URL (max 200 characters).</p>
        </div>

        <PostComposer 
          onPublishSuccess={onPublishSuccess}
          platformsConfigured={platformsConfigured}
          isBackendConnected={backendStatus.connected}
        />
      </div>

      {/* Latest Result View (if present) */}
      {latestResult && (
        <ResultsSummary 
          resultData={latestResult}
          onDismiss={onDismissResult}
          onComposeAnother={onNavigateToCompose}
        />
      )}

    </div>
  );
}
