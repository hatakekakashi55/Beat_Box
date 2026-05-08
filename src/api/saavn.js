/**
 * saavn.js — JioSaavn API Client
 *
 * In DEV mode: Uses Vite's built-in proxy → same-origin requests → ZERO CORS!
 * In PROD mode: Uses your Cloudflare Worker or direct API with fallback.
 *
 * Stream playback: Direct JioSaavn CDN URLs (aac.saavncdn.com) — <audio>
 * elements don't have CORS restrictions, so 320kbps plays directly.
 *
 * 🔧 Preview Fix: Strips `_p` marker from CDN URLs for full songs.
 */

// ══════════════════════════════════════════════════════════════
//  CONFIGURATION
// ══════════════════════════════════════════════════════════════

// Your Cloudflare Worker URL (deploy cloudflare-worker.js to it)
const WORKER_URL = 'https://misty-math-6546.hillsmaster999.workers.dev';
const API_VERSION = '2.1.2'; // Force rebuild hash

// Detect if we're in dev mode (Vite dev server with proxy)
const isDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

// In dev: Vite proxy handles everything (same-origin, no CORS)
// In prod: Use worker or direct API
// In production: ONLY use Worker (direct API calls get CORS blocked by browser!)
// In dev: Vite proxy handles CORS for us
const API_INSTANCES = isDev
  ? ['/saavn-api']       // Vite dev proxy → Worker
  : [WORKER_URL];        // Cloudflare Worker ONLY (adds CORS headers)

// YouTube search endpoint
const YOUTUBE_API = isDev
  ? '/youtube-api'                           // Vite dev proxy → www.youtube.com
  : `${WORKER_URL}/youtube`;                 // Worker proxy in prod

let currentInstanceIndex = 0;

/**
 * Smart fetch with automatic failover across all proxy instances.
 */
async function apiFetch(path, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${path}?${queryString}` : path;

  const ordered = [
    API_INSTANCES[currentInstanceIndex],
    ...API_INSTANCES.filter((_, i) => i !== currentInstanceIndex),
  ];

  let lastError = null;

  for (let i = 0; i < ordered.length; i++) {
    const base = ordered[i];
    const fullUrl = `${base}${url}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(fullUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const idx = API_INSTANCES.indexOf(base);
      if (idx !== -1) currentInstanceIndex = idx;

      return json?.data ?? json;
    } catch (err) {
      lastError = err;
      // Only log as debug to avoid console spamming the user
      console.debug(`[Saavn] ${base} failed: ${err.message}`);
      continue;
    }
  }

  console.error(`[Saavn] All instances failed for: ${url}`);
  throw lastError || new Error('All API instances failed');
}

// ══════════════════════════════════════════════════════════════
//  NORMALIZE
// ══════════════════════════════════════════════════════════════

function normalizeSong(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || raw.title || 'Unknown',
    title: raw.name || raw.title || 'Unknown',
    type: raw.type || 'song',
    year: raw.year || '',
    duration: raw.duration || 0,
    label: raw.label || '',
    language: raw.language || '',
    playCount: raw.playCount || raw.play_count || 0,
    hasLyrics: raw.hasLyrics || raw.has_lyrics || false,
    image: raw.image || [],
    primaryArtists:
      typeof raw.primaryArtists === 'string'
        ? raw.primaryArtists
        : raw.artists?.primary?.map((a) => a.name).join(', ') ||
          raw.primaryArtists || raw.subtitle || 'Unknown Artist',
    artists: raw.artists || null,
    album: raw.album?.name || raw.album || '',
    downloadUrl: raw.downloadUrl || raw.download_url || [],
    url: raw.url || '',
    copyright: raw.copyright || '',
    explicitContent: raw.explicitContent || false,
  };
}

function normalizeAlbum(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || raw.title || 'Unknown Album',
    title: raw.name || raw.title || 'Unknown Album',
    type: 'album',
    year: raw.year || '',
    language: raw.language || '',
    playCount: raw.playCount || raw.play_count || 0,
    image: raw.image || [],
    primaryArtists:
      typeof raw.primaryArtists === 'string'
        ? raw.primaryArtists
        : raw.artists?.primary?.map((a) => a.name).join(', ') || 'Various Artists',
    artist:
      typeof raw.primaryArtists === 'string'
        ? raw.primaryArtists
        : raw.artists?.primary?.map((a) => a.name).join(', ') || 'Various Artists',
    songCount: raw.songCount || raw.song_count || 0,
    url: raw.url || '',
    songs: (raw.songs || []).map(normalizeSong),
  };
}

function normalizePlaylist(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || raw.title || 'Unknown Playlist',
    title: raw.name || raw.title || 'Unknown Playlist',
    type: 'playlist',
    subtitle: raw.subtitle || '',
    fanCount: raw.fanCount || raw.fan_count || 0,
    followerCount: raw.followerCount || raw.fan_count || 0,
    image: raw.image || [],
    songCount: raw.songCount || raw.song_count || 0,
    url: raw.url || '',
    songs: (raw.songs || []).map(normalizeSong),
  };
}

function normalizeArtist(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || raw.title || 'Unknown Artist',
    title: raw.name || raw.title || 'Unknown Artist',
    type: 'artist',
    image: raw.image || [],
    url: raw.url || '',
    description: raw.description || raw.subtitle || '',
    followerCount: raw.followerCount || 0,
  };
}

// ══════════════════════════════════════════════════════════════
//  SEARCH APIs
// ══════════════════════════════════════════════════════════════

export async function globalSearch(query) {
  if (!query) return null;
  try {
    const data = await apiFetch('/api/search', { query });
    return {
      topQuery: {
        results: (data?.topQuery?.results || []).map((r) => ({
          ...r, id: r.id, title: r.title || r.name, name: r.name || r.title,
          type: r.type, image: r.image || [],
          description: r.description || r.subtitle || '',
        })),
      },
      songs: { results: (data?.songs?.results || []).map(normalizeSong) },
      albums: { results: (data?.albums?.results || []).map(normalizeAlbum) },
      artists: { results: (data?.artists?.results || []).map(normalizeArtist) },
      playlists: { results: (data?.playlists?.results || []).map(normalizePlaylist) },
    };
  } catch (err) {
    console.error('[Saavn] globalSearch failed:', err);
    return null;
  }
}

export async function searchSongs(query, limit = 20) {
  if (!query) return { results: [] };
  try {
    const data = await apiFetch('/api/search/songs', { query, limit });
    return { results: (data?.results || data || []).map(normalizeSong) };
  } catch (err) {
    console.error('[Saavn] searchSongs failed:', err);
    return { results: [] };
  }
}

export async function searchAlbums(query, limit = 20) {
  if (!query) return { results: [] };
  try {
    const data = await apiFetch('/api/search/albums', { query, limit });
    return { results: (data?.results || data || []).map(normalizeAlbum) };
  } catch (err) {
    console.error('[Saavn] searchAlbums failed:', err);
    return { results: [] };
  }
}

export async function searchArtists(query, limit = 20) {
  if (!query) return { results: [] };
  try {
    const data = await apiFetch('/api/search/artists', { query, limit });
    return { results: (data?.results || data || []).map(normalizeArtist) };
  } catch (err) {
    console.error('[Saavn] searchArtists failed:', err);
    return { results: [] };
  }
}

export async function searchPlaylists(query, limit = 20) {
  if (!query) return { results: [] };
  try {
    const data = await apiFetch('/api/search/playlists', { query, limit });
    return { results: (data?.results || data || []).map(normalizePlaylist) };
  } catch (err) {
    console.error('[Saavn] searchPlaylists failed:', err);
    return { results: [] };
  }
}

// ══════════════════════════════════════════════════════════════
//  DETAIL APIs
// ══════════════════════════════════════════════════════════════

export async function getAlbumById(id) {
  if (!id) return null;
  try { return normalizeAlbum(await apiFetch('/api/albums', { id })); }
  catch (err) { console.error('[Saavn] getAlbumById failed:', err); return null; }
}

export async function getPlaylistById(id) {
  if (!id) return null;
  try { return normalizePlaylist(await apiFetch('/api/playlists', { id })); }
  catch (err) { console.error('[Saavn] getPlaylistById failed:', err); return null; }
}

export async function getSongById(id) {
  if (!id) return null;
  try {
    const data = await apiFetch(`/api/songs/${id}`);
    const songs = Array.isArray(data) ? data : data?.songs || [data];
    return songs.map(normalizeSong)[0] || null;
  } catch (err) { console.error('[Saavn] getSongById failed:', err); return null; }
}

export async function getSongSuggestions(songId, limit = 20) {
  if (!songId) return [];
  try {
    const data = await apiFetch(`/api/songs/${songId}/suggestions`, { limit });
    const results = Array.isArray(data) ? data : data?.results || data?.songs || [];
    return results.map(normalizeSong).filter((s) => s && s.id);
  } catch (err) { console.error('[Saavn] getSongSuggestions failed:', err); return []; }
}

// ══════════════════════════════════════════════════════════════
//  STREAM VARIANT GENERATOR
// ══════════════════════════════════════════════════════════════

function stripPreviewMarker(url) {
  if (!url || typeof url !== 'string') return url;
  return url.replace(/_p\.mp4/g, '.mp4').replace(/_p\.m4a/g, '.m4a').replace(/_p\.aac/g, '.aac');
}

function upgradeQuality(url, targetKbps) {
  if (!url || typeof url !== 'string') return url;
  return url.replace(/_\d+\.mp4/g, `_${targetKbps}.mp4`)
    .replace(/_\d+\.m4a/g, `_${targetKbps}.m4a`)
    .replace(/_\d+\.aac/g, `_${targetKbps}.aac`);
}

export function getAllStreamVariants(downloadUrls) {
  if (!downloadUrls || !Array.isArray(downloadUrls) || downloadUrls.length === 0) return [];

  const variants = [];
  const seen = new Set();

  function add(url, quality, proxy) {
    if (!url || seen.has(url)) return;
    seen.add(url);
    variants.push({ url, quality, proxy });
  }

  const qualityOrder = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
  const sorted = [...downloadUrls].sort((a, b) => {
    const ai = qualityOrder.indexOf(a.quality);
    const bi = qualityOrder.indexOf(b.quality);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // Phase 1: Direct CDN URLs (strip preview marker)
  for (const item of sorted) {
    const rawUrl = item.url || item.link;
    if (!rawUrl) continue;
    const fullUrl = stripPreviewMarker(rawUrl);
    add(fullUrl, item.quality, 'direct');
    if (fullUrl !== rawUrl) add(rawUrl, item.quality, 'direct-raw');
  }

  // Phase 2: Quality-upgraded variants
  const firstUrl = sorted[0]?.url || sorted[0]?.link;
  if (firstUrl) {
    const stripped = stripPreviewMarker(firstUrl);
    for (const q of ['320', '160', '96']) {
      add(upgradeQuality(stripped, q), `${q}kbps`, 'upgraded');
    }
  }

  // Phase 3: Worker-proxied streams (fallback for blocked CDN)
  if (!isDev) {
    for (const item of sorted.slice(0, 2)) {
      const rawUrl = item.url || item.link;
      if (!rawUrl) continue;
      const fullUrl = stripPreviewMarker(rawUrl);
      add(`${WORKER_URL}/stream?url=${encodeURIComponent(fullUrl)}`, item.quality, 'worker-proxy');
    }
  }

  return variants;
}

// ══════════════════════════════════════════════════════════════
//  YOUTUBE VIDEO SEARCH
// ══════════════════════════════════════════════════════════════

/**
 * Get a YouTube video for a song.
 * Uses Piped API for privacy and better CORS handling.
 */
export async function getYouTubeVideoUrl(songName, artistName) {
  if (!songName) return null;

  // 🔧 FIX: Clean and shorten query to avoid 403 blocks
  // e.g., "Monica (From "Coolie") (Tamil)" -> "Monica Coolie"
  const cleanName = songName
    .replace(/\(From.*?\)/g, '')
    .replace(/\(Tamil\)/g, '')
    .replace(/\(Telugu\)/g, '')
    .replace(/\(Hindi\)/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();
    
  // Use only the first artist if there are multiple
  const firstArtist = (artistName || '').split(',')[0].trim();
  
  const query = `${cleanName} ${firstArtist} official music video`.trim();
  
  // Directly hit YouTube via our proxy or worker
  const searchUrl = isDev 
    ? `${YOUTUBE_API}/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`
    : `${YOUTUBE_API}/search?q=${encodeURIComponent(query)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(searchUrl, { 
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/json'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (isDev) {
      // Scrape HTML directly from YouTube
      const html = await res.text();
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        const videoId = match[1];
        return {
          videoId,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          title: songName,
        };
      }
    } else {
      // Our worker returns JSON
      const data = await res.json();
      const items = data?.items || [];
      if (items.length > 0) {
        const videoId = items[0].url?.replace('/watch?v=', '');
        if (videoId) {
          return {
            videoId,
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
            thumbnail: items[0].thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            title: items[0].title || songName,
          };
        }
      }
    }
  } catch (err) {
    console.warn(`[YT] Search failed:`, err.message);
  }

  return null;
}

/**
 * Get a vertical YouTube short for a song (Spotify Clips feature).
 */
export async function getYouTubeShortUrl(songName, artistName) {
  if (!songName) return null;

  const cleanName = songName
    .replace(/\(From.*?\)/g, '')
    .replace(/\(Tamil\)/g, '')
    .replace(/\(Telugu\)/g, '')
    .replace(/\(Hindi\)/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();
    
  const firstArtist = (artistName || '').split(',')[0].trim();
  // Search for the official music video with strict terms to avoid remakes/covers
  const query = `${cleanName} ${firstArtist} official music video`.trim();
  
  // Use a more aggressive filtering query for better results
  const searchUrl = isDev 
    ? `${YOUTUBE_API}/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D` // sp=EgIQAQ%3D%3D filters for videos only
    : `${YOUTUBE_API}/search?q=${encodeURIComponent(query)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(searchUrl, { signal: controller.signal, headers: { 'Accept': 'text/html,application/json' } });
    clearTimeout(timeout);
    if (!res.ok) return null;

    if (isDev) {
      const html = await res.text();
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        return {
          videoId: match[1],
          embedUrl: `https://www.youtube-nocookie.com/embed/${match[1]}`,
          thumbnail: `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`,
        };
      }
    } else {
      const data = await res.json();
      const items = data?.items || [];
      if (items.length > 0) {
        const videoId = items[0].url?.replace('/watch?v=', '');
        if (videoId) {
          return {
            videoId,
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
            thumbnail: items[0].thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          };
        }
      }
    }
  } catch (err) {
    console.warn(`[YT Shorts] Search failed:`, err.message);
  }
  return null;
}
