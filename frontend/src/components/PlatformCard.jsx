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
      className={`relative group overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
        isConfigured
          ? 'bg-gradient-to-b from-[#151F33] to-[#0F172A] border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5'
          : 'bg-[#0F172A]/40 border-slate-800/60 opacity-80 hover:opacity-100 hover:border-slate-700/80'
      }`}
    >
      {/* Background subtle radial glow on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

      <div className="flex items-start justify-between">
        {/* Platform Brand Icon */}
        <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2.5 shadow-md">
          <PlatformIcon platform={platformKey} size={24} className="w-6 h-6" />
        </div>

        {/* Configuration Status Badge */}
        {isConfigured ? (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Configured</span>
          </span>
        ) : (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>Not Configured</span>
          </span>
        )}
      </div>

      {/* Name and Tagline */}
      <div className="mt-4">
        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
          {meta.name}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{meta.tagline}</p>
      </div>

      {/* Protocol / Endpoint capability tag */}
      <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-medium">Protocol</span>
        <span className="text-slate-300 font-mono text-[10px] bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
          {meta.protocol}
        </span>
      </div>
    </div>
  );
}
