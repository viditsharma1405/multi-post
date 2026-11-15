import React, { useState, useMemo } from 'react';
import { 
  Send, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { analyzeMessageUrls } from '../utils/urlValidator';
import { publishPost } from '../services/api';

export default function PostComposer({ 
  onPublishSuccess, 
  platformsConfigured = {}, 
  isBackendConnected = true 
}) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState([]);

  // Character limit calculations
  const MAX_CHARS = 200;
  const charCount = message.length;
  const isOverLimit = charCount > MAX_CHARS;
  const charsRemaining = MAX_CHARS - charCount;

  // Real-time URL analysis matching backend RFC rules
  const urlAnalysis = useMemo(() => {
    return analyzeMessageUrls(message);
  }, [message]);

  // Overall client validation status
  const isFormValid = useMemo(() => {
    if (!message.trim()) return false;
    if (isOverLimit) return false;
    if (!urlAnalysis.isValid) return false;
    return true;
  }, [message, isOverLimit, urlAnalysis]);

  const handleClear = () => {
    setMessage('');
    setApiErrors([]);
  };

  // Submission handler
  const handlePublish = async (e) => {
    e?.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setApiErrors([]);

    try {
      const response = await publishPost(message);

      if (response.ok && response.data) {
        // Backend successfully orchestrated the post
        onPublishSuccess({
          message,
          response: response.data,
        });
      } else {
        // API returned 422, 400, 500, or network error
        setApiErrors(response.errors || ['An unexpected error occurred while publishing.']);
      }
    } catch (err) {
      setApiErrors([err.message || 'Network communication failed.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl shadow-lg overflow-hidden">
      {/* Composer Card Header */}
      <div className="px-5 py-3.5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Compose Post</h2>
        <span className="text-xs text-slate-500">Max 200 characters • 1 link required</span>
      </div>

      {/* Composer Form Body */}
      <form onSubmit={handlePublish} className="p-6">
        {/* Textarea Container */}
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
            placeholder="What would you like to share across your platforms? (e.g. Check out our latest platform release https://example.com)"
            rows={5}
            className={`w-full bg-[#0B0F19] text-slate-100 placeholder-slate-500 rounded-xl p-4 text-sm md:text-base border transition-all duration-200 outline-none resize-none focus:ring-2 ${
              isOverLimit
                ? 'border-rose-500/60 focus:ring-rose-500/20'
                : 'border-slate-800 focus:border-indigo-500/80 focus:ring-indigo-500/20'
            }`}
          />

          {/* Quick Clear button */}
          {message && !isSubmitting && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Clear message"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Feedback Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: URL Validation Pill */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Link Status:</span>
            {urlAnalysis.status === 'valid' ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] truncate max-w-[200px] sm:max-w-xs">{urlAnalysis.singleValidUrl}</span>
              </span>
            ) : urlAnalysis.status === 'multiple_urls' ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-medium">
                <XCircle className="w-3.5 h-3.5" />
                <span>Multiple URLs detected (only 1 allowed)</span>
              </span>
            ) : urlAnalysis.status === 'invalid_scheme' ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{urlAnalysis.message}</span>
              </span>
            ) : urlAnalysis.status === 'invalid_format' ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{urlAnalysis.message}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/80">
                <LinkIcon className="w-3 h-3 text-slate-500" />
                <span>1 HTTP/HTTPS URL required</span>
              </span>
            )}
          </div>

          {/* Right: Character Counter with Circular Indicator */}
          <div className="flex items-center space-x-3">
            <span className={`font-mono font-medium text-xs ${
              isOverLimit 
                ? 'text-rose-400 font-bold' 
                : charsRemaining <= 20 
                ? 'text-amber-400' 
                : 'text-slate-400'
            }`}>
              {charCount} / {MAX_CHARS}
            </span>

            {/* Visual Progress Pill */}
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-200 ${
                  isOverLimit 
                    ? 'bg-rose-500' 
                    : charsRemaining <= 20 
                    ? 'bg-amber-400' 
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, (charCount / MAX_CHARS) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* API Error Messages Callout (HTTP 422 or network failures) */}
        {apiErrors.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-rose-200">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Backend Validation Error</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-rose-300/90 pl-1">
              {apiErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Backend offline warning banner */}
        {!isBackendConnected && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Backend server is currently offline. Ensure Uvicorn is active on port 4000.</span>
            </div>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-end">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting || !isBackendConnected}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold text-xs md:text-sm flex items-center justify-center space-x-2 transition-all duration-200 ${
              isFormValid && !isSubmitting && isBackendConnected
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-600/20 active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Publishing to 5 platforms...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish to All Platforms</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
