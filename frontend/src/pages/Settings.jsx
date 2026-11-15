import React, { useState } from 'react';
import { 
  Server, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  RotateCcw 
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
    <div className="space-y-4 max-w-3xl mx-auto animate-in fade-in duration-300">
      
      {/* Backend API Base URL Configuration */}
      <div className="p-5 rounded-xl bg-[#111827] border border-slate-800">
        <div className="flex items-center space-x-2.5 mb-3">
          <Server className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">API Base URL</h3>
        </div>

        <form onSubmit={handleSaveApiUrl} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:4000"
              required
              className="flex-1 bg-[#0B0F19] text-slate-100 px-3.5 py-2 rounded-lg border border-slate-800 focus:border-indigo-500 text-xs font-mono outline-none"
            />
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={handleResetApiUrl}
                className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                title="Reset to default (http://localhost:4000)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>API endpoint updated.</span>
            </div>
          )}
        </form>
      </div>

      {/* Local History Cache Management */}
      <div className="p-5 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Browser History</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {historyCount} broadcast records stored in localStorage
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Clear all local browser publishing records?')) {
              onClearHistory();
            }
          }}
          disabled={historyCount === 0}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
            historyCount > 0
              ? 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/40'
              : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-800'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

    </div>
  );
}
