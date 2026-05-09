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
import CryptoJS from 'crypto-js';

// ══════════════════════════════════════════════════════════════
//  CONFIGURATION
// ══════════════════════════════════════════════════════════════

// Your deployed Cloudflare Worker URL (Replace with your actual workers.dev URL after deploying)
const WORKER_URL = 'https://saavn-proxy-vercel.vercel.app';
const API_VERSION = '2.1.2'; // Force rebuild hash

// Detect if we're in dev mode (Vite dev server with proxy)
const isDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.endsWith('.local')
);

// Fallback public instances of sumitkolhe/jiosaavn-api 
// (In case primary goes down or hits limits)
const PUBLIC_FALLBACKS = [
  WORKER_URL,
  'https://jiosaavn-api-privatecvc2.vercel.app',
  'https://saavn.me'
];

// Dev: Browser -> /saavn-api -> Vite Proxy -> Cloudflare Worker
// Prod: Browser -> Worker directly (saavn.dev is DNS-blocked by ISPs)
const API_INSTANCES = isDev 
  ? ['/saavn-api'] 
  : [WORKER_URL, 'https://jiosaavn-api-privatecvc2.vercel.app'];

// YouTube search endpoint (Piped API proxy or direct via worker)
const YOUTUBE_API = isDev
  ? '/youtube-api'                           
  : `${WORKER_URL}/youtube`;

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
      const timeout = setTimeout(() => controller.abort(), 60000);

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

function generateDownloadLinks(encryptedMediaUrl) {
  if (!encryptedMediaUrl) return [];
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(encryptedMediaUrl) },
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    const decUrl = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decUrl) return [];
    
    // Convert to mp4 extension for higher qualities
    const cleanUrl = decUrl.replace(/_96\.mp4|_320\.mp4|_160\.mp4/g, '');
    
    return [
      { quality: '12kbps', url: decUrl.replace(/_96\.mp4|_320\.mp4|_160\.mp4/g, '_12.mp4') },
      { quality: '48kbps', url: decUrl.replace(/_96\.mp4|_320\.mp4|_160\.mp4/g, '_48.mp4') },
      { quality: '96kbps', url: decUrl.replace(/_96\.mp4|_320\.mp4|_160\.mp4/g, '_96.mp4') },
      { quality: '160kbps', url: decUrl.replace(/_96\.mp4|_320\.mp4|_160\.mp4/g, '_160.mp4') },
      { quality: '320kbps', url: decUrl.replace(/_96\.mp4|_320\.mp4|_160\.mp4/g, '_320.mp4') },
    ];
  } catch (err) {
    console.error('[Saavn] Decryption failed:', err);
    return [];
  }
}

function normalizeSong(raw) {
  if (!raw) return null;

  let dLinks = raw.downloadUrl || raw.download_url;
  if ((!dLinks || dLinks.length === 0) && raw.encrypted_media_url) {
    dLinks = generateDownloadLinks(raw.encrypted_media_url);
  } else if (!Array.isArray(dLinks) && typeof dLinks === 'string') {
    dLinks = [{ quality: '320kbps', url: dLinks }];
  } else if (!dLinks) {
    dLinks = [];
  }
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
    downloadUrl: dLinks,
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
  if (!downloadUrls?.length) return [];

  const variants = [];
  const seen = new Set();
  const qualityOrder = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];

  const sorted = [...downloadUrls].sort((a, b) =>
    qualityOrder.indexOf(a.quality) - qualityOrder.indexOf(b.quality)
  );

  for (const item of sorted) {
    const rawUrl = item.url || item.link;
    if (!rawUrl || seen.has(rawUrl)) continue;
    seen.add(rawUrl);
    // ✅ Direct CDN URL — no proxy needed!
    variants.push({ url: rawUrl, quality: item.quality, proxy: 'direct' });
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
    const timeout = setTimeout(() => controller.abort(), 60000);

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
    const timeout = setTimeout(() => controller.abort(), 60000);
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

/**
 * Get direct audio stream URL from Piped proxy for a given song
 */
export async function getYouTubeAudioStream(songName, artistName) {
  if (!songName) return null;

  const cleanName = songName
    .replace(/\(From.*?\)/g, '')
    .replace(/\(Tamil\)/g, '')
    .replace(/\(Telugu\)/g, '')
    .replace(/\(Hindi\)/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();
    
  const firstArtist = (artistName || '').split(',')[0].trim();
  const query = `${cleanName} ${firstArtist} official audio`.trim();
  
  const baseUrl = isDev ? '' : WORKER_URL;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    // 1. Search for video using our ytProxy backend
    const searchRes = await fetch(`${baseUrl}/api/yt/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (!searchRes.ok) throw new Error(`Search HTTP ${searchRes.status}`);
    const searchData = await searchRes.json();
    
    const videoId = searchData?.results?.[0]?.id;
    if (!videoId) return null;

    // 2. Fetch stream from our ytProxy backend
    const streamController = new AbortController();
    const streamTimeout = setTimeout(() => streamController.abort(), 25000);
    
    const streamRes = await fetch(`${baseUrl}/api/yt/stream/${videoId}`, {
      signal: streamController.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(streamTimeout);

    if (!streamRes.ok) throw new Error(`Stream HTTP ${streamRes.status}`);
    const streamData = await streamRes.json();

    return streamData.audioUrl || null;
  } catch (err) {
    console.warn(`[YT Stream] Fetch failed:`, err.message);
    return null;
  }
}

export async function wakeUpBackend() {
  try {
    const url = WORKER_URL;
    fetch(url).catch(() => {});
  } catch (e) {}
}
