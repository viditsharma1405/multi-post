import React from 'react';
import PostComposer from '../components/PostComposer';
import ResultsSummary from '../components/ResultsSummary';
import { 
  Send, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

export default function Compose({ 
  backendStatus, 
  onPublishSuccess, 
  latestResult, 
  onDismissResult 
}) {
  const platformsConfigured = backendStatus?.data?.platforms_configured || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <Send className="w-6 h-6 text-indigo-400" />
          <span>Compose New Broadcast</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Draft your update below. The backend validates message bounds, isolates platform credentials, and posts concurrently.
        </p>
      </div>

      {/* Guidelines Accordion / Tips Card */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Publishing Rules Enforced by Backend</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px]">
          <div className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
            <span><strong>Character Limit:</strong> Maximum 200 characters including spaces and link.</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
            <span><strong>CTA Link:</strong> Exactly one valid HTTP or HTTPS URL is required.</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
            <span><strong>Fault Isolation:</strong> Failure on one platform does not interrupt sibling platforms.</span>
          </div>
        </div>
      </div>

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
