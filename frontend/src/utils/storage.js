/**
 * Local browser storage management for MultiPost publishing history.
 * NOTE: This is strictly local browser storage and not server-side persistence.
 */

const HISTORY_KEY = 'multipost_local_history_v1';
const MAX_HISTORY_ITEMS = 50;

/**
 * Retrieve the saved publishing history array from localStorage.
 * @returns {Array<object>}
 */
export function getLocalHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse local publishing history:', err);
    return [];
  }
}

/**
 * Save a new publishing attempt result to localStorage.
 * @param {object} item - { id, message, timestamp, response, summary }
 */
export function saveHistoryItem(item) {
  try {
    const history = getLocalHistory();
    const newItem = {
      id: item.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: item.timestamp || new Date().toISOString(),
      message: item.message,
      success: item.success,
      summary: item.summary,
      results: item.results,
    };

    const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return newItem;
  } catch (err) {
    console.error('Failed to save to local publishing history:', err);
    return null;
  }
}

/**
 * Clear all local browser publishing history.
 */
export function clearLocalHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (err) {
    console.error('Failed to clear local publishing history:', err);
    return false;
  }
}
