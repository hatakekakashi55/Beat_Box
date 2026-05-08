import express from 'express';
import cors from 'cors';
import { gotScraping } from 'got-scraping';
import { ofetch } from 'ofetch';
import * as cheerio from 'cheerio';
import { parse } from 'node-html-parser';
import { FingerprintGenerator } from 'fingerprint-generator';
import FormData from 'form-data';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

const JIOSAAVN = 'https://www.jiosaavn.com/api.php';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// ═══════════════════════════════════════════════════════════════
// INIXA STEALTH ENGINE — Identity Faker & Browser Fingerprinting
// ═══════════════════════════════════════════════════════════════
const fpGen = new FingerprintGenerator({
  browsers: [{ name: 'chrome', minVersion: 120 }],
  devices: ['desktop'],
  operatingSystems: ['windows'],
});

function buildStealthHeaders() {
  const fp = fpGen.getFingerprint();
  return {
    ...fp.headers,
    'Upgrade-Insecure-Requests': '1',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  };
}

// ═══════════════════════════════════════════════════════════════
// LIGHTWEIGHT EVENT LOGGER
// ═══════════════════════════════════════════════════════════════
function log(tool, action, status = 'running') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', running: '🔄' };
  console.log(`[Proxy-${tool}] ${icons[status] || '🔄'} ${action}`);
}

// ═══════════════════════════════════════════════════════════════
// NORMALIZE HELPERS
// ═══════════════════════════════════════════════════════════════
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

function dlUrls(preview) {
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

function nSong(r) {
  if (!r) return null;
  const mi = r.more_info || {};
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
    downloadUrl: dlUrls(r.media_preview_url || mi.media_preview_url || mi.vlink || r.vlink),
    url: r.perma_url || r.url || '',
  };
}

function nAlbum(r) {
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
    songs: (r.songs || []).map(nSong),
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

function nPlaylist(r) {
  if (!r) return null;
  return {
    id: r.id || r.listid,
    name: r.title || r.name || r.listname || '',
    title: r.title || r.name || r.listname || '',
    type: 'playlist', image: imgs(r.image),
    songCount: r.song_count || r.list_count || (r.songs ? r.songs.length : 0),
    url: r.perma_url || r.url || '',
    songs: (r.songs || []).map(nSong),
  };
}

function fmtAuto(raw) {
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

function fmtList(raw, forceType) {
  const results = raw.results || [];
  return {
    data: {
      results: results.map(i => {
        const t = forceType || i.type || 'song';
        if (t === 'album') return nAlbum(i);
        if (t === 'artist') return nArtist(i);
        if (t === 'playlist') return nPlaylist(i);
        return nSong(i);
      }),
      total: parseInt(raw.total || results.length)
    }
  };
}

function fmtDetail(raw) {
  if (raw.songs) {
    return { data: raw.listid ? nPlaylist(raw) : nAlbum(raw) };
  }
  return { data: raw };
}

function fmtSongDetail(raw) {
  const songs = Object.values(raw).filter(s => s && s.id);
  return { data: songs.map(nSong) };
}

function fmtSuggestions(raw) {
  const songs = Array.isArray(raw) ? raw : Object.values(raw).filter(s => s && s.id);
  return { data: songs.map(nSong) };
}

const enc = encodeURIComponent;

// ═══════════════════════════════════════════════════════════════
// HTTP ROUTER: JIOSAAVN (Using gotScraping for TLS bypass)
// ═══════════════════════════════════════════════════════════════
app.get('/api/*', async (req, res) => {
  const p = req.path;
  const q = req.query.q || req.query.query || '';
  const n = req.query.n || req.query.limit || '20';
  const id = req.query.id || '';

  let apiUrl, type, forceType;

  if (p === '/api/search') {
    apiUrl = `${JIOSAAVN}?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${enc(q)}`;
    type = 'auto';
  } else if (p === '/api/search/songs') {
    apiUrl = `${JIOSAAVN}?__call=search.getResults&_format=json&_marker=0&cc=in&p=1&q=${enc(q)}&n=${n}`;
    type = 'list';
    forceType = 'song';
  } else if (p === '/api/search/albums') {
    apiUrl = `${JIOSAAVN}?__call=search.getAlbumResults&_format=json&_marker=0&cc=in&p=1&q=${enc(q)}&n=${n}`;
    type = 'list';
    forceType = 'album';
  } else if (p === '/api/search/artists') {
    apiUrl = `${JIOSAAVN}?__call=search.getArtistResults&_format=json&_marker=0&cc=in&p=1&q=${enc(q)}&n=${n}`;
    type = 'list';
    forceType = 'artist';
  } else if (p === '/api/search/playlists') {
    apiUrl = `${JIOSAAVN}?__call=search.getPlaylistResults&_format=json&_marker=0&cc=in&p=1&q=${enc(q)}&n=${n}`;
    type = 'list';
    forceType = 'playlist';
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
      return res.status(404).json({ error: 'Unknown endpoint' });
    }
  }

  log('JioSaavn', `Fetching ${type}: ${apiUrl.split('__call=')[1].split('&')[0]}`, 'running');

  try {
    // 👑 got-scraping for ultimate stealth (TLS Client JS equivalent)
    const resp = await gotScraping.get({
      url: apiUrl,
      responseType: 'json',
      headers: buildStealthHeaders(),
      timeout: { request: 10000 },
      http2: true, // Bypass Cloudflare HTTP/1.1 checks
    });

    const raw = resp.body;
    let out;
    if (type === 'auto') out = fmtAuto(raw);
    else if (type === 'list') out = fmtList(raw, forceType);
    else if (type === 'detail') out = fmtDetail(raw);
    else if (type === 'song') out = fmtSongDetail(raw);
    else out = fmtSuggestions(raw);

    log('JioSaavn', `Success: ${type}`, 'success');
    res.json(out);
  } catch (err) {
    log('JioSaavn', `Error: ${err.message}`, 'error');
    res.status(502).json({ error: 'JioSaavn fetch failed', details: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// STREAM PROXY (Native JS stream to bypass CORS)
// ═══════════════════════════════════════════════════════════════
app.get('/stream', async (req, res) => {
  const streamUrl = req.query.url;
  if (!streamUrl) return res.status(400).json({ error: 'Missing url' });

  try {
    const headers = buildStealthHeaders();
    if (req.headers.range) headers['Range'] = req.headers.range;

    log('Stream', `Proxying ${streamUrl.split('?')[0].slice(-30)}`, 'running');
    
    const streamRes = await fetch(streamUrl, { headers });
    
    res.status(streamRes.status);
    streamRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    // Force allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    if (streamRes.body) {
      const reader = streamRes.body.getReader();
      const push = async () => {
        const { done, value } = await reader.read();
        if (done) return res.end();
        res.write(Buffer.from(value));
        push();
      };
      push();
    } else {
      res.end();
    }
  } catch (err) {
    log('Stream', `Error: ${err.message}`, 'error');
    res.status(502).json({ error: 'Stream fetch failed' });
  }
});

// ═══════════════════════════════════════════════════════════════
// YOUTUBE (Using Cheerio + Node-Html-Parser)
// ═══════════════════════════════════════════════════════════════
app.get('/youtube/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing q' });

  log('YouTube', `Searching: ${query}`, 'running');
  try {
    const htmlRes = await gotScraping.get({
      url: `https://www.youtube.com/results?search_query=${enc(query)}`,
      responseType: 'text',
      headers: buildStealthHeaders(),
      timeout: { request: 8000 }
    });
    
    // Combining Node-Html-Parser and Cheerio speed
    const root = parse(htmlRes.body);
    const htmlText = root.toString();
    const $ = cheerio.load(htmlText);
    
    const match = $('script').text().match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (match) {
      log('YouTube', `Found video: ${match[1]}`, 'success');
      return res.json({ items: [{ url: `/watch?v=${match[1]}`, thumbnail: `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`, title: query }] });
    }
    throw new Error('No videoId matched');
  } catch (err) {
    log('YouTube', `Error: ${err.message}`, 'error');
    res.status(502).json({ error: 'YouTube search failed' });
  }
});

// ═══════════════════════════════════════════════════════════════
// TMDB PROXY (Using ofetch for raw speed)
// ═══════════════════════════════════════════════════════════════
app.get('/tmdb/*', async (req, res) => {
  const path = req.path.replace('/tmdb', '');
  const url = `${TMDB_BASE}${path}?${new URLSearchParams(req.query)}`;
  try {
    const resp = await ofetch(url, { headers: buildStealthHeaders() });
    res.json(resp);
  } catch (err) {
    res.status(502).json({ error: 'TMDB fetch failed' });
  }
});

app.get('/', (req, res) => res.json({ status: 'Operational', service: 'BeatBox Proxy Engine', mode: 'Vercel-Ready' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n[BeatBox Proxy] Stealth Engine running on http://localhost:${PORT}\n`);
});
