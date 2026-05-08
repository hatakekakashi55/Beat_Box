/**
 * BeatBox Ultimate CORS Proxy — Cloudflare Worker v3.0
 *
 * Proxies:
 *  1. JioSaavn API + GenerateAuthToken Decryption for HD audio
 *  2. Audio streams from JioSaavn CDN
 *  3. YouTube search via scraping
 *  4. TMDB API (for movies section)
 */

const SAAVN_UPSTREAMS = ['https://saavn.dev', 'https://jiosaavn-api.vercel.app'];
const PIPED_INSTANCES = ['https://pipedapi.kavin.rocks', 'https://api.piped.privacydev.net'];
const TMDB_BASE = 'https://api.themoviedb.org/3';
const JIOSAAVN = 'https://www.jiosaavn.com/api.php';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    
    try {
      if (url.pathname === '/stream') return handleStreamProxy(request, url);
      if (url.pathname === '/api/link') return handleAuthTokenRedirect(request, url);
      if (url.pathname.startsWith('/youtube/')) return handleYouTubeProxy(request, url);
      if (url.pathname.startsWith('/tmdb/')) return handleTMDBProxy(request, url);
      if (url.pathname.startsWith('/api/')) return handleSaavnProxy(request, url);
      
      if (url.pathname === '/' || url.pathname === '/health') {
        return ok({ status: 'ok', service: 'BeatBox Proxy v3', ts: new Date().toISOString() });
      }
      return ok({ error: 'Not Found' }, 404);
    } catch (err) {
      return ok({ error: err.message }, 500);
    }
  },
};

// ═══════════════════════════════════════════════════════════════
//  JIOSAAVN HD STREAM GENERATOR (Reverse Engineering)
// ═══════════════════════════════════════════════════════════════

async function handleAuthTokenRedirect(request, url) {
  const enc = url.searchParams.get('enc');
  const bitrate = url.searchParams.get('bitrate') || '320';
  if (!enc) return ok({ error: 'Missing encrypted media url' }, 400);

  const reqUrl = `${JIOSAAVN}?__call=song.generateAuthToken&url=${encodeURIComponent(enc)}&bitrate=${bitrate}&api_version=4&_format=json&ctx=web6dot0&_marker=0`;
  try {
    const res = await fetchTimeout(reqUrl, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } }, 6000);
    const data = await res.json();
    
    if (data && data.auth_url) {
      // Direct the browser seamlessly to the signed Akamai CDN url
      return Response.redirect(data.auth_url, 302);
    }
    return ok({ error: 'Token generation failed', data }, 500);
  } catch (e) {
    return ok({ error: 'Auth token network error', details: e.message }, 502);
  }
}

// ═══════════════════════════════════════════════════════════════
//  JIOSAAVN PROXY — API Router
// ═══════════════════════════════════════════════════════════════

async function handleSaavnProxy(request, url) {
  const origin = url.origin;
  return directJioSaavn(url, origin);
}

async function directJioSaavn(url, origin) {
  const p = url.pathname;
  const q = url.searchParams.get('q') || url.searchParams.get('query') || '';
  const n = url.searchParams.get('n') || url.searchParams.get('limit') || '20';
  const id = url.searchParams.get('id') || '';
  let apiUrl, type, forceType;

  if (p === '/api/search') {
    apiUrl = `${JIOSAAVN}?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${enc(q)}`;
    type = 'auto';
  } else if (p === '/api/search/songs') {
    apiUrl = `${JIOSAAVN}?__call=search.getResults&_format=json&_marker=0&cc=in&p=1&q=${enc(q)}&n=${n}`;
    type = 'list'; forceType = 'song';
  } else if (p === '/api/search/albums') {
    apiUrl = `${JIOSAAVN}?__call=search.getAlbumResults&_format=json&_marker=0&cc=in&p=1&q=${enc(q)}&n=${n}`;
    type = 'list'; forceType = 'album';
  } else if (p === '/api/search/artists') {
    apiUrl = `${JIOSAAVN}?__call=search.getArtistResults&_format=json&_marker=0&cc=in&p=1&q=${enc(q)}&n=${n}`;
    type = 'list'; forceType = 'artist';
  } else if (p === '/api/search/playlists') {
    apiUrl = `${JIOSAAVN}?__call=search.getPlaylistResults&_format=json&_marker=0&cc=in&p=1&q=${enc(q)}&n=${n}`;
    type = 'list'; forceType = 'playlist';
  } else if (p === '/api/albums') {
    apiUrl = `${JIOSAAVN}?__call=content.getAlbumDetails&_format=json&_marker=0&cc=in&albumid=${enc(id)}`;
    type = 'detail';
  } else if (p === '/api/playlists') {
    apiUrl = `${JIOSAAVN}?__call=playlist.getDetails&_format=json&_marker=0&cc=in&listid=${enc(id)}`;
    type = 'detail';
  } else {
    const sugMatch = p.match(/^\/api\/songs\/([^/]+)\/suggestions$/);
    const songMatch = p.match(/^\/api\/songs\/([^/]+)$/);
    if (sugMatch) {
      apiUrl = `${JIOSAAVN}?__call=reco.getreco&_format=json&_marker=0&cc=in&pid=${enc(sugMatch[1])}&n=${n}`;
      type = 'sug';
    } else if (songMatch) {
      apiUrl = `${JIOSAAVN}?__call=song.getDetails&_format=json&_marker=0&cc=in&pids=${enc(songMatch[1])}`;
      type = 'song';
    } else {
      return ok({ error: 'Unknown endpoint' }, 404);
    }
  }

  try {
    const r = await fetchTimeout(apiUrl, { headers: { 'User-Agent': UA } }, 10000);
    if (!r.ok) return ok({ error: `JioSaavn ${r.status}` }, 502);
    const text = await r.text();
    let raw;
    try { raw = JSON.parse(text); } catch { return ok({ error: 'Bad JSON from JioSaavn' }, 502); }

    let out;
    if (type === 'auto') out = fmtAuto(raw, origin);
    else if (type === 'list') out = fmtList(raw, forceType, origin);
    else if (type === 'detail') out = fmtDetail(raw, origin);
    else if (type === 'song') out = fmtSongDetail(raw, origin);
    else out = fmtSuggestions(raw, origin);

    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600', ...CORS_HEADERS },
    });
  } catch (err) {
    return ok({ error: 'Direct JioSaavn failed: ' + err.message }, 502);
  }
}

// ── Normalizers ──

function imgs(u) {
  if (!u) return [];
  if (Array.isArray(u)) return u;
  const b = u.replace(/-\d+x\d+\./, '-{R}.');
  return [
    { quality: '50x50', link: b.replace('{R}', '50x50') },
    { quality: '150x150', link: b.replace('{R}', '150x150') },
    { quality: '500x500', link: b.replace('{R}', '500x500') },
  ];
}

function dlUrls(preview, encUrl, origin) {
  // Use Cloudflare worker redirect for authenticated Akamai stream tokens
  if (encUrl && origin) {
    const base = `${origin}/api/link?enc=${enc(encUrl)}`;
    return [
      { quality: '320kbps', link: `${base}&bitrate=320` },
      { quality: '160kbps', link: `${base}&bitrate=160` },
      { quality: '96kbps', link: `${base}&bitrate=96` },
      { quality: '48kbps', link: `${base}&bitrate=48` },
    ];
  }
  
  // Fallback hack for old songs without encrypted media url
  if (!preview) return [];
  let base = preview.replace(/_p\.(mp4|m4a|mp3|aac)$/, '.$1');
  base = base.replace('preview.saavncdn.com', 'aac.saavncdn.com');
  return [
    { quality: '320kbps', link: base.replace(/_\d+\./, '_320.') },
    { quality: '160kbps', link: base.replace(/_\d+\./, '_160.') },
    { quality: '96kbps', link: base.replace(/_\d+\./, '_96.') },
    { quality: '48kbps', link: base.replace(/_\d+\./, '_48.') },
  ];
}

function nSong(r, origin) {
  if (!r) return null;
  const mi = r.more_info || {};
  const encUrl = r.encrypted_media_url || mi.encrypted_media_url || '';
  return {
    id: r.id || r.songid,
    name: r.song || r.title || r.name || 'Unknown',
    title: r.song || r.title || r.name || 'Unknown',
    type: 'song',
    year: r.year || mi.year || '',
    duration: parseInt(r.duration || mi.duration || 0),
    label: r.label || mi.label || '',
    language: r.language || mi.language || '',
    playCount: parseInt(r.play_count || mi.play_count || 0),
    hasLyrics: r.has_lyrics === 'true' || r.has_lyrics === true || mi.has_lyrics === 'true',
    image: imgs(r.image),
    primaryArtists: r.primary_artists || mi.primary_artists || r.music || r.subtitle || '',
    album: r.album || mi.album || '',
    downloadUrl: dlUrls(r.media_preview_url || mi.media_preview_url || mi.vlink || r.vlink, encUrl, origin),
    url: r.perma_url || r.url || '',
  };
}

function nAlbum(r, origin) {
  if (!r) return null;
  return {
    id: r.albumid || r.id,
    name: r.title || r.name || r.album || 'Unknown Album',
    title: r.title || r.name || r.album || 'Unknown Album',
    type: 'album',
    year: r.year || '',
    language: r.language || '',
    playCount: parseInt(r.play_count || 0),
    image: imgs(r.image),
    primaryArtists: r.primary_artists || r.music || r.subtitle || 'Various Artists',
    songCount: parseInt(r.song_count || (r.songs ? r.songs.length : 0)),
    url: r.perma_url || r.url || '',
    songs: (r.songs || []).map(s => nSong(s, origin)),
  };
}

function nArtist(r) {
  if (!r) return null;
  return {
    id: r.id, name: r.title || r.name || '', title: r.title || r.name || '',
    type: 'artist', image: imgs(r.image), url: r.perma_url || r.url || '',
    description: r.description || r.subtitle || '',
  };
}

function nPlaylist(r, origin) {
  if (!r) return null;
  return {
    id: r.id || r.listid,
    name: r.title || r.name || r.listname || '',
    title: r.title || r.name || r.listname || '',
    type: 'playlist', image: imgs(r.image),
    songCount: r.song_count || r.list_count || (r.songs ? r.songs.length : 0),
    url: r.perma_url || r.url || '',
    songs: (r.songs || []).map(s => nSong(s, origin)),
  };
}

function fmtAuto(raw, origin) {
  const f = (i, t) => ({
    id: i.id || i.albumid || i.listid || '',
    name: i.title || i.name || i.song || '',
    title: i.title || i.name || i.song || '',
    type: t,
    image: imgs(i.image),
    primaryArtists: i.primary_artists || i.music || i.description || i.subtitle || '',
    album: i.album || '',
    url: i.perma_url || i.url || ''
  });
  return {
    data: {
      topQuery: { results: [] },
      songs: { results: (raw.songs?.data || []).map(i => f(i, 'song')) },
      albums: { results: (raw.albums?.data || []).map(i => f(i, 'album')) },
      artists: { results: (raw.artists?.data || []).map(i => f(i, 'artist')) },
      playlists: { results: (raw.playlists?.data || []).map(i => f(i, 'playlist')) },
    },
  };
}

function fmtList(raw, forceType, origin) {
  const results = raw.results || [];
  return {
    data: {
      results: results.map(i => {
        const t = forceType || i.type || 'song';
        if (t === 'album') return nAlbum(i, origin);
        if (t === 'artist') return nArtist(i);
        if (t === 'playlist') return nPlaylist(i, origin);
        return nSong(i, origin);
      }),
      total: parseInt(raw.total || results.length)
    }
  };
}

function fmtDetail(raw, origin) {
  if (raw.songs) {
    return { data: raw.listid ? nPlaylist(raw, origin) : nAlbum(raw, origin) };
  }
  return { data: raw };
}

function fmtSongDetail(raw, origin) {
  const songs = Object.values(raw).filter(s => s && s.id);
  return { data: songs.map(s => nSong(s, origin)) };
}

function fmtSuggestions(raw, origin) {
  const songs = Array.isArray(raw) ? raw : Object.values(raw).filter(s => s && s.id);
  return { data: songs.map(s => nSong(s, origin)) };
}

// ═══════════════════════════════════════════════════════════════
//  AUDIO STREAM PROXY
// ═══════════════════════════════════════════════════════════════

async function handleStreamProxy(request, url) {
  const streamUrl = url.searchParams.get('url');
  if (!streamUrl) return ok({ error: 'Missing url' }, 400);

  const allowed = ['saavncdn.com', 'jiosaavn.com', 'jiotune.com'];
  try {
    const h = new URL(streamUrl).hostname;
    if (!allowed.some(d => h.endsWith(d))) return ok({ error: 'Blocked CDN' }, 403);
  } catch { return ok({ error: 'Invalid URL' }, 400); }

  try {
    const headers = { 'User-Agent': 'BeatBox/3.0' };
    const range = request.headers.get('Range');
    if (range) headers['Range'] = range;
    const r = await fetch(streamUrl, { headers });
    const rh = { 'Content-Type': r.headers.get('Content-Type') || 'audio/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=3600', ...CORS_HEADERS };
    const cl = r.headers.get('Content-Length'); if (cl) rh['Content-Length'] = cl;
    const cr = r.headers.get('Content-Range'); if (cr) rh['Content-Range'] = cr;
    return new Response(r.body, { status: r.status, headers: rh });
  } catch (err) {
    return ok({ error: 'Stream error: ' + err.message }, 502);
  }
}

// ═══════════════════════════════════════════════════════════════
//  YOUTUBE PROXY
// ═══════════════════════════════════════════════════════════════

async function handleYouTubeProxy(request, url) {
  const query = url.searchParams.get('q');
  if (!query) return ok({ error: 'Missing q' }, 400);

  try {
    const r = await fetchTimeout(`https://www.youtube.com/results?search_query=${enc(query)}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
    }, 8000);
    const html = await r.text();
    const m = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (m) return ok({ items: [{ url: `/watch?v=${m[1]}`, thumbnail: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`, title: query }] });
  } catch {}

  for (const inst of PIPED_INSTANCES) {
    try {
      const r = await fetchTimeout(`${inst}/search?q=${enc(query)}&filter=videos`, {}, 8000);
      if (!r.ok) continue;
      const d = await r.json();
      const items = (d.items || []).filter(i => i.type === 'video').map(i => ({ url: i.url, thumbnail: i.thumbnail, title: i.title }));
      if (items.length > 0) return ok({ items });
    } catch { continue; }
  }
  return ok({ error: 'YouTube search failed' }, 502);
}

// ═══════════════════════════════════════════════════════════════
//  TMDB PROXY
// ═══════════════════════════════════════════════════════════════

async function handleTMDBProxy(request, url) {
  const tmdbPath = url.pathname.replace('/tmdb', '') + url.search;
  try {
    const r = await fetchTimeout(`${TMDB_BASE}${tmdbPath}`, { headers: { 'User-Agent': UA } }, 12000);
    const body = await r.text();
    return new Response(body, { status: r.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600', ...CORS_HEADERS } });
  } catch (err) {
    return ok({ error: 'TMDB error: ' + err.message }, 502);
  }
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function ok(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

function enc(s) { return encodeURIComponent(s); }

async function fetchTimeout(url, opts = {}, ms = 8000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { ...opts, signal: c.signal }); clearTimeout(t); return r; }
  catch (e) { clearTimeout(t); throw e; }
}
