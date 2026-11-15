import React from 'react';
import PostComposer from '../components/PostComposer';
import ResultsSummary from '../components/ResultsSummary';

export default function Compose({ 
  backendStatus, 
  onPublishSuccess, 
  latestResult, 
  onDismissResult 
}) {
  const platformsConfigured = backendStatus?.data?.platforms_configured || {};
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Primary Composer Card */}
      <PostComposer 
        onPublishSuccess={onPublishSuccess}
        platformsConfigured={platformsConfigured}
        isBackendConnected={backendStatus.connected}
      />

      {/* Live Publishing Results View */}
      {latestResult && (
        <ResultsSummary 
          resultData={latestResult}
          onDismiss={onDismissResult}
          onComposeAnother={() => {
            onDismissResult();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

    </div>
  );
}
