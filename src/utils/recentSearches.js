/**
 * Recent Searches — LocalStorage utility
 * Stores up to 8 recent search queries for quick access.
 */

const STORAGE_KEY = 'uxbeat_recent_searches';
const MAX_RECENT = 8;

export function getRecentSearches() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query) {
  if (!query || query.trim().length < 2) return;
  const trimmed = query.trim();
  const current = getRecentSearches().filter(q => q !== trimmed);
  const updated = [trimmed, ...current].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeRecentSearch(query) {
  const updated = getRecentSearches().filter(q => q !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY);
}
