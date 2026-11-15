import React from 'react';
import PlatformIcon from './PlatformIcon';
import { PLATFORMS_METADATA } from '../utils/platforms';
import { CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function PlatformCard({ platformKey, isConfigured, onSelect }) {
  const meta = PLATFORMS_METADATA[platformKey] || {
    name: platformKey,
    protocol: 'Custom Integration',
    tagline: 'Platform Service',
  };

  return (
    <div 
      className={`group rounded-xl p-4 border transition-all duration-200 ${
        isConfigured
          ? 'bg-[#111827] border-slate-800 hover:border-slate-700'
          : 'bg-[#111827]/40 border-slate-800/60 opacity-60 hover:opacity-80'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-2">
          <PlatformIcon platform={platformKey} size={20} className="w-5 h-5" />
        </div>

        {isConfigured ? (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Configured</span>
          </span>
        ) : (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>Not configured</span>
          </span>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-semibold text-white">
          {meta.name}
        </h3>
      </div>
    </div>
  );
}
