/**
 * Format seconds into MM:SS format
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format large numbers (e.g., play count) into human readable format
 */
export function formatPlayCount(count) {
  if (!count) return '0';
  if (count >= 10000000) return `${(count / 10000000).toFixed(1)}Cr`;
  if (count >= 100000) return `${(count / 100000).toFixed(1)}L`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Decode HTML entities from API response
 */
export function decodeHTML(html) {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

export function getHighQualityImage(images) {
  if (!images) return '/placeholder.jpg';
  if (typeof images === 'string') return images || '/placeholder.jpg';
  if (!Array.isArray(images) || images.length === 0) return '/placeholder.jpg';
  const img = images.find(i => i.quality === '500x500') || images[images.length - 1];
  return img?.url || img?.link || '/placeholder.jpg';
}

export function getMediumQualityImage(images) {
  if (!images) return '/placeholder.jpg';
  if (typeof images === 'string') return images || '/placeholder.jpg';
  if (!Array.isArray(images) || images.length === 0) return '/placeholder.jpg';
  const img = images.find(i => i.quality === '150x150') || images[0];
  return img?.url || img?.link || '/placeholder.jpg';
}

/**
 * 🔧 Strip preview marker from JioSaavn CDN URLs.
 * Preview URLs contain `_96_p.mp4` — the `_p` means preview (truncated ~1min).
 * Full song URLs are `_96.mp4`, `_320.mp4` without `_p`.
 */
function stripPreviewMarker(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Remove preview marker
  return url
    .replace(/_p\.mp4/g, '.mp4')
    .replace(/_p\.m4a/g, '.m4a')
    .replace(/_p\.aac/g, '.aac');
}

/**
 * Get the best download URL (320kbps preferred)
 * Handles both old schema (url) and new schema (link)
 * 🔧 FIX: Also strips _p preview marker from URLs for full song playback
 */
export function getBestDownloadUrl(downloadUrls, dataSaver = false) {
  if (!downloadUrls || downloadUrls.length === 0) return null;
  
  if (dataSaver) {
    const lowQuality = downloadUrls.find(d => d.quality === '96kbps')
      || downloadUrls.find(d => d.quality === '48kbps')
      || downloadUrls.find(d => d.quality === '12kbps')
      || downloadUrls[0];
    return stripPreviewMarker(lowQuality?.url || lowQuality?.link || null);
  }

  const best = downloadUrls.find(d => d.quality === '320kbps')
    || downloadUrls.find(d => d.quality === '160kbps')
    || downloadUrls.find(d => d.quality === '96kbps')
    || downloadUrls[downloadUrls.length - 1];
  return stripPreviewMarker(best?.url || best?.link || null);
}

/**
 * Get primary artist names — works with both:
 *  - New API schema: primaryArtists is already a string
 *  - Old API schema: artists.primary is an array of {name}
 */
export function getArtistNames(artists, primaryArtistsStr) {
  // New API already normalises to string in saavn.js normalizeSong()
  if (primaryArtistsStr && typeof primaryArtistsStr === 'string') {
    return decodeHTML(primaryArtistsStr);
  }
  // Old-style artists object
  if (artists?.primary && Array.isArray(artists.primary)) {
    return artists.primary.map(a => decodeHTML(a.name)).join(', ');
  }
  return 'Unknown Artist';
}

/**
 * Generate a random gradient for cards
 */
const gradientColors = [
  ['#1a1a2e', '#16213e'],
  ['#2d1b4e', '#1a1a2e'],
  ['#1b3a4b', '#0a0a0a'],
  ['#3d1c02', '#1a1a2e'],
  ['#1c3d1c', '#0a0a0a'],
  ['#3d1c3d', '#1a1a2e'],
  ['#1c2d3d', '#0a0a0a'],
  ['#2e1a1a', '#1a1a2e'],
];

export function getRandomGradient(seed = 0) {
  const pair = gradientColors[seed % gradientColors.length];
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
}

/**
 * Debounce function for search input
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
