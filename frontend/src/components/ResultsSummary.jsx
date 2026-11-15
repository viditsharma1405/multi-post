import React from 'react';
import PlatformResult from './PlatformResult';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  BarChart3, 
  Layers, 
  RotateCcw,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';

export default function ResultsSummary({ resultData, onDismiss, onComposeAnother }) {
  if (!resultData) return null;

  const { response, message } = resultData;
  const summary = response?.summary || {};
  const results = response?.results || [];

  const total = summary.total ?? results.length ?? 5;
  const successful = summary.successful ?? results.filter(r => r.status === 'success').length;
  const failed = summary.failed ?? results.filter(r => r.status === 'failed').length;

  // Calculate dynamic success rate percentage
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

  // Banner message
  let bannerTheme = '';
  let bannerTitle = '';
  let bannerIcon = null;

  if (successful === total && total > 0) {
    bannerTheme = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    bannerTitle = 'All platforms published successfully!';
    bannerIcon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  } else if (successful > 0) {
    bannerTheme = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
    bannerTitle = `Published successfully to ${successful} out of ${total} platforms.`;
    bannerIcon = <Sparkles className="w-5 h-5 text-indigo-400" />;
  } else {
    bannerTheme = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
    bannerTitle = 'Publishing failed on all platforms.';
    bannerIcon = <XCircle className="w-5 h-5 text-rose-400" />;
  }

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden mt-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header Result Banner */}
      <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${bannerTheme}`}>
        <div className="flex items-center space-x-3">
          {bannerIcon}
          <div>
            <h3 className="font-bold text-base tracking-tight text-white">{bannerTitle}</h3>
            <p className="text-xs opacity-90 font-medium">Broadcast run completed</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onComposeAnother && (
            <button
              onClick={onComposeAnother}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-xs font-semibold text-white border border-slate-700 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Compose New</span>
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Dismiss results view"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Published message snippet */}
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block mb-1">
              Dispatched Payload
            </span>
            <p className="text-slate-200 font-sans leading-relaxed break-words">{message}</p>
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Platforms */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Platforms</span>
              <Layers className="w-4 h-4 text-slate-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">{total}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Concurrent destinations</span>
          </div>

          {/* Successful */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
              <span>Successful</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-400 tracking-tight">{successful}</div>
            <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Delivered updates</span>
          </div>

          {/* Failed */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
              <span>Failed</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-400 tracking-tight">{failed}</div>
            <span className="text-[10px] text-rose-500/80 mt-0.5 block">Errors isolated</span>
          </div>

          {/* Success Rate */}
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
            <div className="flex items-center justify-between text-indigo-400 text-xs font-medium">
              <span>Success Rate</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-indigo-400 tracking-tight">{successRate}%</div>
            <span className="text-[10px] text-indigo-400/80 mt-0.5 block">Calculated dynamically</span>
          </div>
        </div>

        {/* Section title for individual platforms */}
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Per-Platform Breakdown</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              5 of 5 Platforms Isolated
            </span>
          </h4>
        </div>

        {/* 5 Individual Platform Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((item) => (
            <PlatformResult key={item.platform} result={item} />
          ))}
        </div>
      </div>

    </div>
  );
}
