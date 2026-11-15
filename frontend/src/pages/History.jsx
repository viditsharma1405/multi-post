import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  X,
  Send,
  Eye
} from 'lucide-react';
import PlatformResult from '../components/PlatformResult';

export default function HistoryPage({ 
  history = [], 
  onClearHistory, 
  onNavigateToCompose 
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'success', 'partial', 'failed'

  const filteredHistory = history.filter((item) => {
    const successful = item.summary?.successful ?? 0;
    const total = item.summary?.total ?? 5;
    if (filter === 'success') return successful === total;
    if (filter === 'partial') return successful > 0 && successful < total;
    if (filter === 'failed') return successful === 0;
    return true;
  });

  const formatDate = (isoString) => {
    try {
      const dt = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(dt);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Stored locally in browser</span>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-indigo-400 font-mono">{history.length} records</span>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear your local publishing history?')) {
                onClearHistory();
              }
            }}
            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      {history.length > 0 && (
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 text-xs">
          <span className="text-slate-500 font-medium mr-2">Filter:</span>
          {[
            { id: 'all', label: `All Runs (${history.length})` },
            { id: 'success', label: 'All Succeeded' },
            { id: 'partial', label: 'Partial Success' },
            { id: 'failed', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* History Cards / Table */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const successful = item.summary?.successful ?? 0;
            const failed = item.summary?.failed ?? 0;
            const total = item.summary?.total ?? 5;
            const isFullSuccess = successful === total;
            const isPartial = successful > 0 && successful < total;

            return (
              <div 
                key={item.id}
                className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(item.timestamp)}</span>
                    <span>•</span>
                    <span className="font-mono">{item.id}</span>
                  </div>

                  <p className="text-sm text-slate-200 font-sans line-clamp-2 break-words">
                    {item.message}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end space-x-4 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  {/* Status Pills */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`px-2.5 py-1 rounded-full font-semibold text-[11px] flex items-center space-x-1 ${
                      isFullSuccess
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isPartial
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {isFullSuccess && <CheckCircle2 className="w-3 h-3" />}
                      {isPartial && <CheckCircle2 className="w-3 h-3" />}
                      {!isFullSuccess && !isPartial && <XCircle className="w-3 h-3" />}
                      <span>{successful}/{total} Delivered</span>
                    </span>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 font-semibold text-xs border border-slate-800 flex items-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Results</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/30 border border-slate-800/60">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mb-4">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No publishing history yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filter === 'all'
              ? 'When you publish your first announcement, the complete multi-platform result will be recorded here.'
              : 'No runs found matching the selected filter criteria.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={onNavigateToCompose}
              className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
              <span>Compose Your First Broadcast</span>
            </button>
          )}
        </div>
      )}

      {/* Run Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Broadcast Run Results</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {selectedItem.id} • {formatDate(selectedItem.timestamp)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Body */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                Published Content
              </span>
              <p className="text-slate-200 leading-relaxed font-sans break-words">{selectedItem.message}</p>
            </div>

            {/* Platform Results List */}
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Platform Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedItem.results?.map((res) => (
                  <PlatformResult key={res.platform} result={res} />
                ))}
              </div>
            </div>

            {/* Modal Close Button */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
