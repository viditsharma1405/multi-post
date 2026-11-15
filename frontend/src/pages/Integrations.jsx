import React from 'react';
import PlatformIcon from '../components/PlatformIcon';
import { PLATFORMS_METADATA, ORDERED_PLATFORMS } from '../utils/platforms';
import { 
  Share2, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  ExternalLink, 
  Terminal,
  Info
} from 'lucide-react';

export default function Integrations({ backendStatus, onRefreshHealth }) {
  const platformsConfigured = backendStatus?.data?.platforms_configured || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <Share2 className="w-6 h-6 text-indigo-400" />
          <span>Platform Integrations</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Review destination network protocols, endpoints, and live readiness reported by the FastAPI backend.
        </p>
      </div>

      {/* Security notice regarding credentials */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start space-x-3">
        <ShieldAlert className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Security Architecture:</span>
          <p className="mt-0.5 text-slate-400">
            For maximum security, API secrets, OAuth tokens, and bot credentials are managed exclusively on the backend in your server's <code className="text-indigo-300 font-mono text-[11px]">.env</code> file. The frontend communicates only with the orchestrator and never has access to raw credentials.
          </p>
        </div>
      </div>

      {/* Detailed Integration Cards */}
      <div className="space-y-4">
        {ORDERED_PLATFORMS.map((plat) => {
          const meta = PLATFORMS_METADATA[plat];
          const isConfigured = Boolean(platformsConfigured[plat]);

          return (
            <div 
              key={plat}
              className={`p-6 rounded-2xl border transition-all duration-200 ${
                isConfigured
                  ? 'bg-[#111827] border-slate-800 shadow-md'
                  : 'bg-[#111827]/40 border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                
                {/* Platform Identity */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2.5 shadow-inner flex-shrink-0">
                    <PlatformIcon platform={plat} size={28} className="w-7 h-7" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">{meta.name}</h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${meta.badgeColor}`}>
                        {meta.protocol}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      {meta.description}
                    </p>
                  </div>
                </div>

                {/* Configuration Indicator */}
                <div className="sm:self-center flex-shrink-0">
                  {isConfigured ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active & Configured</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/80">
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Not Configured</span>
                    </span>
                  )}
                </div>

              </div>

              {/* Technical Specifications Sub-bar */}
              <div className="mt-5 pt-4 border-t border-slate-800/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Public URL Structure:</span>
                  <code className="text-[11px] font-mono text-slate-300 block mt-0.5 break-all">
                    {meta.urlFormat}
                  </code>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Accessibility Behavior:</span>
                  <span className="text-slate-300 text-[11px] block mt-0.5">
                    {meta.authGated 
                      ? 'Requires platform login / server membership (public_access=false)'
                      : 'Public unauthenticated GET verification supported'}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Backend environment reference card */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400">
        <h4 className="font-bold text-white text-sm flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Configuring Keys on Server</span>
        </h4>
        <p className="mt-1 text-slate-400 leading-relaxed">
          To activate additional platforms, edit the <code className="text-indigo-300 font-mono text-[11px]">.env</code> file in the backend root directory. When you save your changes, the server's file watcher will automatically hot-reload and enable the destination in real time.
        </p>
      </div>

    </div>
  );
}
