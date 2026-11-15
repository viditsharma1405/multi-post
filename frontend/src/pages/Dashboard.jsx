import React from 'react';
import PlatformCard from '../components/PlatformCard';
import PostComposer from '../components/PostComposer';
import ResultsSummary from '../components/ResultsSummary';
import { ORDERED_PLATFORMS } from '../utils/platforms';

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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Platform Status Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300 tracking-tight">
            Target Platforms
          </h2>
          <span className="text-xs text-slate-500">
            {readyCount} of 5 configured
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ORDERED_PLATFORMS.map((plat) => (
            <PlatformCard
              key={plat}
              platformKey={plat}
              isConfigured={Boolean(platformsConfigured[plat])}
            />
          ))}
        </div>
      </div>

      {/* Post Composer */}
      <div>
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
