import express from 'express';
import playdl from 'play-dl';
import { ofetch } from 'ofetch';

const router = express.Router();

// List of public Piped API instances for rotation (Bypasses 403s on Render)
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.smnz.de',
  'https://pipedapi.adminforge.de',
  'https://piped-api.lunar.icu'
];

let currentIndex = 0;

/**
 * Helper to fetch data with automatic Proxy Instance Rotation
 */
async function fetchWithRotation(endpoint) {
  let attempts = 0;
  let lastError = null;

  while (attempts < PIPED_INSTANCES.length) {
    const instance = PIPED_INSTANCES[currentIndex];
    const url = `${instance}${endpoint}`;

    try {
      console.log(`[Piped Proxy] Trying ${instance} for ${endpoint}`);
      const data = await ofetch(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      return data;
    } catch (err) {
      console.warn(`[Piped Proxy] Failed on ${instance} - ${err.message}`);
      lastError = err;
      currentIndex = (currentIndex + 1) % PIPED_INSTANCES.length;
      attempts++;
    }
  }
  throw new Error(`All piped instances failed. ${lastError?.message}`);
}

/**
 * GET /api/yt/search?q=song+name
 * Priority 1: play-dl (Direct search)
 * Priority 2: Piped API (Fallback)
 */
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query (q)' });

  try {
    console.log(`[YT Proxy] Searching: ${query}`);
    
    // Try play-dl first
    try {
      const results = await playdl.search(query, { limit: 10, source: { youtube: 'video' } });
      if (results && results.length > 0) {
        console.log(`[YT Proxy] play-dl search success: ${results.length} results`);
        const cleanResults = results.map(item => ({
          id: item.id,
          title: item.title,
          artist: item.channel?.name || 'Unknown Artist',
          thumbnail: item.thumbnails[0]?.url,
          duration: item.durationInSec || 0,
          type: 'song'
        }));
        return res.json({ results: cleanResults });
      }
    } catch (err) {
      console.warn(`[YT Proxy] play-dl search failed, falling back to Piped: ${err.message}`);
    }

    // Fallback to Piped
    const data = await fetchWithRotation(`/search?q=${encodeURIComponent(query)}&filter=music_songs`);
    const cleanResults = data.items.map(item => ({
      id: item.url.replace('/watch?v=', ''),
      title: item.title,
      artist: item.uploaderName || 'Unknown Artist',
      thumbnail: item.thumbnail,
      duration: item.duration || 0,
      type: 'song'
    }));

    res.json({ results: cleanResults });
  } catch (err) {
    console.error(`[YT Proxy] Global search failure:`, err);
    res.status(502).json({ error: 'YouTube search failed', details: err.message });
  }
});

/**
 * GET /api/yt/stream/:videoId
 * Priority 1: play-dl (Extracts direct URLs)
 * Priority 2: Piped API (Fallback)
 */
router.get('/stream/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  console.log(`[YT Proxy] Streaming: ${videoId}`);

  try {
    // Try play-dl first
    try {
      const stream = await playdl.stream(videoId, { quality: 2 }); // quality 2 is usually high audio
      if (stream && stream.url) {
        console.log(`[YT Proxy] play-dl stream success`);
        return res.json({
          id: videoId,
          audioUrl: stream.url,
          source: 'Direct YT CDN'
        });
      }
    } catch (err) {
      console.warn(`[YT Proxy] play-dl stream failed, falling back to Piped: ${err.message}`);
    }

    // Fallback to Piped
    const data = await fetchWithRotation(`/streams/${videoId}`);
    const bestAudio = data.audioStreams?.sort((a, b) => b.bitrate - a.bitrate)[0];
    const bestVideo = data.videoStreams?.find(v => v.videoOnly === false && v.mimeType.includes('mp4'));

    if (!bestAudio) throw new Error('No audio stream found in Piped response');

    res.json({
      id: videoId,
      title: data.title,
      artist: data.uploader,
      thumbnail: data.thumbnailUrl,
      audioUrl: bestAudio.url,
      audioBitrate: bestAudio.bitrate,
      videoClipUrl: bestVideo ? bestVideo.url : null,
      source: 'Piped Proxy'
    });
  } catch (err) {
    console.error(`[YT Proxy] Global stream failure:`, err);
    res.status(502).json({ error: 'Stream fetch failed', details: err.message });
  }
});

export default router;
