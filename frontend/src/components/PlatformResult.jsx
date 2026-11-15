import React from 'react';
import PlatformIcon from './PlatformIcon';
import { PLATFORMS_METADATA } from '../utils/platforms';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Globe, 
  Lock, 
  EyeOff, 
  Clock, 
  Calendar,
  AlertOctagon
} from 'lucide-react';

export default function PlatformResult({ result }) {
  const {
    platform,
    status,
    posted_url,
    public_access,
    date,
    time,
    error
  } = result;

  const meta = PLATFORMS_METADATA[platform] || {
    name: platform,
    protocol: 'API Service',
  };

  const isSuccess = status === 'success';

  return (
    <div 
      className={`rounded-2xl p-5 border transition-all duration-200 ${
        isSuccess
          ? 'bg-[#131D31] border-slate-800 hover:border-slate-700'
          : 'bg-[#181824]/60 border-rose-950/40 hover:border-rose-900/50'
      }`}
    >
      {/* Top Header: Platform Identity & Status Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shadow-inner">
            <PlatformIcon platform={platform} size={22} className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {meta.name}
            </h4>
          </div>
        </div>

        {/* Success / Failed Badge */}
        {isSuccess ? (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Success</span>
          </span>
        ) : (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        )}
      </div>

      {/* Middle: Details & Meta */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
        {/* Timestamp */}
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center space-x-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Published:</span>
          </span>
          <span className="font-mono text-slate-300">
            {date && time ? `${date} ${time}` : date || time || '—'}
          </span>
        </div>

        {/* Public Accessibility Badge (Do not interpret null as false!) */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Public Visibility:</span>
          {public_access === true ? (
            <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
              <Globe className="w-3.5 h-3.5" />
              <span>Publicly accessible</span>
            </span>
          ) : public_access === false ? (
            <span className="inline-flex items-center space-x-1 text-amber-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Not publicly accessible</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-slate-400 font-medium">
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Unknown / Not available</span>
            </span>
          )}
        </div>

        {/* Error Details (if failed) */}
        {!isSuccess && error && (
          <div className="mt-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 text-[11px] font-mono break-all flex items-start space-x-2">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Footer: View Post Action */}
      {posted_url && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 truncate max-w-[160px] font-mono">
            {posted_url}
          </span>
          <a
            href={posted_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition-all group"
          >
            <span>View Post</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      )}
    </div>
  );
}
