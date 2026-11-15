import React from 'react';
import PlatformIcon from '../components/PlatformIcon';
import { PLATFORMS_METADATA, ORDERED_PLATFORMS } from '../utils/platforms';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Integrations({ backendStatus, onRefreshHealth }) {
  const platformsConfigured = backendStatus?.data?.platforms_configured || {};

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-300">
      {ORDERED_PLATFORMS.map((plat) => {
        const meta = PLATFORMS_METADATA[plat];
        const isConfigured = Boolean(platformsConfigured[plat]);

        return (
          <div 
            key={plat}
            className={`p-4 rounded-xl border transition-all duration-150 flex items-center justify-between gap-4 ${
              isConfigured
                ? 'bg-[#111827] border-slate-800'
                : 'bg-[#111827]/40 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-2 flex-shrink-0">
                <PlatformIcon platform={plat} size={22} className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">{meta.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {meta.description}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              {isConfigured ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700/40">
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Not configured</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
