/**
 * TMDB API Service — Tamil Movies & Web Series
 * Uses The Movie Database (TMDB) for metadata
 * Uses multiple embed providers for streaming
 *
 * 🔧 FIX: Updated all embed server URLs to currently working domains (May 2025)
 */

const TMDB_API_KEY = 'c45a857c193f6302f2b5061c3b85e743';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Detect dev mode
const isDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

// In dev: Vite proxy → same-origin → zero CORS
// In prod: Worker → TMDB
// In dev: Vite proxy → same-origin → zero CORS
// In prod: Worker → TMDB
const TMDB_BASE = isDev
  ? '/tmdb-api/3'
  : 'https://misty-math-6546.hillsmaster999.workers.dev/tmdb';

/* ===== Helper — Fetches TMDB data through proxy ===== */
export async function tmdbFetch(endpoint, params = {}) {
  const searchParams = new URLSearchParams({ api_key: TMDB_API_KEY, ...params });
  const fullUrl = `${TMDB_BASE}${endpoint}?${searchParams.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(fullUrl, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`[TMDB] ${endpoint}:`, error);
    // Fallback: If primary worker fails, try direct (might work in some browsers)
    if (!isDev && !fullUrl.includes('api.themoviedb.org')) {
      try {
        const directUrl = `https://api.themoviedb.org/3${endpoint}?${searchParams.toString()}`;
        const res2 = await fetch(directUrl);
        if (res2.ok) return await res2.json();
      } catch (e2) {
        console.warn('[TMDB] Direct fallback also failed');
      }
    }
    throw error;
  }
}

/* ===== Image URLs ===== */
export function getPosterUrl(path, size = 'w500') {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

export function getBackdropUrl(path, size = 'w1280') {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

/* ===== Streaming Embed URLs =====
   🔧 FIX: Updated to currently working domains (May 2025)
   Server 1: vidlink.pro — Primary, best quality
   Server 2: vidsrc.icu — Active mirror, reliable
   Server 3: embed.su  — Stable alternative
   Server 4: multiembed.mov — Multi-source fallback
   ================================= */
const SERVERS = {
  vidlink:     'https://vidlink.pro',
  vidsrc_icu:  'https://vidsrc.icu/embed',
  embed_su:    'https://embed.su/embed',
  multiembed:  'https://multiembed.mov',
};

export function getMovieEmbedUrl(tmdbId, server = 'vidlink') {
  switch (server) {
    case 'vidsrc_icu':
      return `${SERVERS.vidsrc_icu}/movie/${tmdbId}`;
    case 'embed_su':
      return `${SERVERS.embed_su}/movie/${tmdbId}`;
    case 'multiembed':
      return `${SERVERS.multiembed}/?video_id=${tmdbId}&tmdb=1`;
    case 'vidlink':
    default:
      return `${SERVERS.vidlink}/movie/${tmdbId}?primaryColor=1ed760&autoplay=false&audio=ta`;
  }
}

export function getTvEmbedUrl(tmdbId, season = 1, episode = 1, server = 'vidlink') {
  switch (server) {
    case 'vidsrc_icu':
      return `${SERVERS.vidsrc_icu}/tv/${tmdbId}/${season}/${episode}`;
    case 'embed_su':
      return `${SERVERS.embed_su}/tv/${tmdbId}/${season}/${episode}`;
    case 'multiembed':
      return `${SERVERS.multiembed}/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
    case 'vidlink':
    default:
      return `${SERVERS.vidlink}/tv/${tmdbId}/${season}/${episode}?primaryColor=1ed760&autoplay=false&audio=ta`;
  }
}

/* ===== Tamil Movies ===== */
export async function getTamilMovies(page = 1) {
  return tmdbFetch('/discover/movie', {
    with_original_language: 'ta',
    sort_by: 'popularity.desc',
    page: page.toString(),
    'vote_count.gte': '10',
    include_adult: 'false'
  });
}

export async function getTamilMoviesByYear(year, page = 1) {
  return tmdbFetch('/discover/movie', {
    with_original_language: 'ta',
    primary_release_year: year.toString(),
    sort_by: 'popularity.desc',
    page: page.toString(),
    include_adult: 'false'
  });
}

export async function getLatestTamilMovies(page = 1) {
  const year = new Date().getFullYear();
  return tmdbFetch('/discover/movie', {
    with_original_language: 'ta',
    primary_release_year: year.toString(),
    sort_by: 'release_date.desc',
    page: page.toString(),
    include_adult: 'false'
  });
}

export async function getTopRatedTamilMovies(page = 1) {
  return tmdbFetch('/discover/movie', {
    with_original_language: 'ta',
    sort_by: 'vote_average.desc',
    'vote_count.gte': '100',
    page: page.toString(),
    include_adult: 'false'
  });
}

export async function getTamilMoviesByGenre(genreId, page = 1) {
  return tmdbFetch('/discover/movie', {
    with_original_language: 'ta',
    with_genres: genreId.toString(),
    sort_by: 'popularity.desc',
    page: page.toString(),
    include_adult: 'false'
  });
}

/* ===== Tamil TV / Web Series ===== */
export async function getTamilTVShows(page = 1) {
  return tmdbFetch('/discover/tv', {
    with_original_language: 'ta',
    sort_by: 'popularity.desc',
    page: page.toString(),
    include_adult: 'false'
  });
}

export async function getLatestTamilTV(page = 1) {
  return tmdbFetch('/discover/tv', {
    with_original_language: 'ta',
    sort_by: 'first_air_date.desc',
    page: page.toString(),
    'vote_count.gte': '5',
  });
}

/* ===== Trending ===== */
export async function getTrendingMovies(timeWindow = 'week') {
  return tmdbFetch(`/trending/movie/${timeWindow}`);
}

export async function getTrendingTV(timeWindow = 'week') {
  return tmdbFetch(`/trending/tv/${timeWindow}`);
}

/* ===== Search ===== */
export async function searchMovies(query, page = 1) {
  return tmdbFetch('/search/movie', { query, page: page.toString() });
}

export async function searchTV(query, page = 1) {
  return tmdbFetch('/search/tv', { query, page: page.toString() });
}

export async function searchMulti(query, page = 1) {
  return tmdbFetch('/search/multi', { query, page: page.toString() });
}

/* ===== Details ===== */
export async function getMovieDetails(id) {
  return tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,videos,similar,recommendations' });
}

export async function getTVDetails(id) {
  return tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,videos,similar,recommendations,seasons' });
}

export async function getTVSeasonDetails(tvId, seasonNumber) {
  return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
}

/* ===== Genres ===== */
export async function getMovieGenres() {
  return tmdbFetch('/genre/movie/list');
}

export async function getTVGenres() {
  return tmdbFetch('/genre/tv/list');
}

/* ===== All-Language Popular (for suggestions) ===== */
export async function getPopularMovies(page = 1) {
  return tmdbFetch('/movie/popular', { page: page.toString() });
}

export async function getNowPlayingMovies(page = 1) {
  return tmdbFetch('/movie/now_playing', { page: page.toString(), region: 'IN' });
}

export async function getUpcomingMovies(page = 1) {
  return tmdbFetch('/movie/upcoming', { page: page.toString(), region: 'IN' });
}

/* ===== Bollywood / Hindi ===== */
export async function getHindiMovies(page = 1) {
  return tmdbFetch('/discover/movie', {
    with_original_language: 'hi',
    sort_by: 'popularity.desc',
    page: page.toString(),
  });
}

/* ===== Telugu ===== */
export async function getTeluguMovies(page = 1) {
  return tmdbFetch('/discover/movie', {
    with_original_language: 'te',
    sort_by: 'popularity.desc',
    page: page.toString(),
  });
}

/* ===== Malayalam ===== */
export async function getMalayalamMovies(page = 1) {
  return tmdbFetch('/discover/movie', {
    with_original_language: 'ml',
    sort_by: 'popularity.desc',
    page: page.toString(),
  });
}
