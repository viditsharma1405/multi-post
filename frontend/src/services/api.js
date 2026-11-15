/**
 * API Service for communicating with the FastAPI Multi-Platform Posting backend.
 * Endpoints:
 * - GET  /health   -> { status: "ok", platforms_configured: { ... }, version: "1.0.0" }
 * - POST /posting  -> { success: boolean, summary: { ... }, results: [ ... ] }
 */

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Retrieve the active API base URL, supporting a localStorage runtime override if set in Settings.
 */
export function getApiBaseUrl() {
  const customUrl = localStorage.getItem('multipost_api_override');
  return (customUrl && customUrl.trim()) ? customUrl.trim().replace(/\/+$/, '') : DEFAULT_BASE_URL;
}

/**
 * Update the custom API base URL in localStorage.
 */
export function setApiBaseUrl(url) {
  if (!url || url.trim() === DEFAULT_BASE_URL) {
    localStorage.removeItem('multipost_api_override');
  } else {
    localStorage.setItem('multipost_api_override', url.trim().replace(/\/+$/, ''));
  }
}

/**
 * Reset API base URL to default.
 */
export function resetApiBaseUrl() {
  localStorage.removeItem('multipost_api_override');
}

/**
 * Check backend connection and retrieve live platform configuration status.
 * @returns {Promise<{ ok: boolean, data?: any, error?: string }>}
 */
export async function checkBackendHealth() {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        ok: false,
        error: `Server responded with HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      ok: true,
      data,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    let errorMsg = 'Could not connect to backend server';
    if (err.name === 'AbortError') {
      errorMsg = 'Connection timed out while reaching backend';
    } else if (err.message) {
      errorMsg = `Connection failed: ${err.message}`;
    }
    return {
      ok: false,
      error: errorMsg,
    };
  }
}

/**
 * Publish a message to all five configured platforms via POST /posting.
 * @param {string} message - Content to be published (must have <= 200 chars and exactly one URL).
 * @returns {Promise<{ ok: boolean, data?: any, errors?: string[], status: number }>}
 */
export async function publishPost(message) {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  // Multi-platform posting includes external API calls + public GET verifications, allow up to 35s
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch(`${baseUrl}/posting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json().catch(() => null);

    if (res.status === 200 && json) {
      return {
        ok: true,
        data: json,
        status: 200,
      };
    }

    if (res.status === 422) {
      // Pydantic validation error
      const errorList = json?.errors || (json?.detail ? (Array.isArray(json.detail) ? json.detail.map(d => `${d.loc?.join(' -> ')}: ${d.msg}`) : [String(json.detail)]) : ['Input validation failed']);
      return {
        ok: false,
        errors: errorList,
        status: 422,
      };
    }

    if (res.status === 400) {
      return {
        ok: false,
        errors: [json?.detail || 'Bad request'],
        status: 400,
      };
    }

    // HTTP 500 or other errors
    const errorMsg = json?.detail || json?.error || `Server error (HTTP ${res.status})`;
    return {
      ok: false,
      errors: [errorMsg],
      status: res.status,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    let message = 'Failed to communicate with backend';
    if (err.name === 'AbortError') {
      message = 'Request timed out waiting for backend platforms to respond (exceeded 35s)';
    } else if (err.message) {
      message = `Network error: ${err.message}`;
    }
    return {
      ok: false,
      errors: [message],
      status: 0,
    };
  }
}
