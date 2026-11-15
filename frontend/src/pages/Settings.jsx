import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Cpu,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl } from '../services/api';

export default function SettingsPage({ 
  backendStatus, 
  onRefreshHealth, 
  onClearHistory,
  historyCount = 0 
}) {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    setApiBaseUrl(apiUrl);
    setSavedSuccess(true);
    onRefreshHealth();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetApiUrl = () => {
    resetApiBaseUrl();
    setApiUrl(getApiBaseUrl());
    setSavedSuccess(true);
    onRefreshHealth();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <SettingsIcon className="w-6 h-6 text-indigo-400" />
          <span>System Settings</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Configure API endpoints, manage client cache, and review system diagnostics.
        </p>
      </div>

      {/* Backend API Base URL Configuration */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Server className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Backend Connection Endpoint</h3>
            <p className="text-xs text-slate-400">Configure the base URL of your FastAPI server.</p>
          </div>
        </div>

        <form onSubmit={handleSaveApiUrl} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              API Base URL
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:4000"
                required
                className="flex-1 bg-[#0B0F19] text-slate-100 px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 text-sm font-mono outline-none"
              />
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Update & Reconnect</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetApiUrl}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  title="Reset to default (http://localhost:4000)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Default: <code className="font-mono text-slate-400">http://localhost:4000</code>. Set via <code className="font-mono text-slate-400">VITE_API_BASE_URL</code> environment variable.
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>API endpoint updated and reconnecting...</span>
            </div>
          )}
        </form>
      </div>

      {/* Backend Live Diagnostics */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-md">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Server Diagnostics</h3>
            <p className="text-xs text-slate-400">Raw payload received from /health endpoint.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-slate-800/80 text-xs">
            <span className="text-slate-400">Health Status:</span>
            <span className="font-mono font-bold text-emerald-400">
              {backendStatus.data?.status || (backendStatus.connected ? 'ok' : 'offline')}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-slate-800/80 text-xs">
            <span className="text-slate-400">Server API Version:</span>
            <span className="font-mono text-slate-200">
              {backendStatus.data?.version || '1.0.0'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-slate-800/80 text-xs">
            <span className="text-slate-400">Active Platforms:</span>
            <span className="font-mono text-indigo-400 font-semibold">
              {backendStatus.data?.platforms_configured
                ? Object.entries(backendStatus.data.platforms_configured)
                    .filter(([_, ready]) => ready)
                    .map(([name]) => name)
                    .join(', ') || 'None'
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Client Data Management */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Browser History Cache</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Currently holding <span className="text-indigo-400 font-semibold">{historyCount}</span> historical broadcast records in local browser memory.
            </p>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Clear all local browser publishing records?')) {
                onClearHistory();
              }
            }}
            disabled={historyCount === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              historyCount > 0
                ? 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge History</span>
          </button>
        </div>
      </div>

    </div>
  );
}
