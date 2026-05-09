import express from 'express';
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
 * If an instance returns 403 or fails, it automatically falls back to the next one.
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
      // Rotate to the next instance
      currentIndex = (currentIndex + 1) % PIPED_INSTANCES.length;
      attempts++;
    }
  }

  throw new Error(`All proxy instances failed. Last error: ${lastError?.message}`);
}

/**
 * GET /api/yt/search?q=song+name
 * Searches for songs and removes any mention of "YouTube"
 */
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query parameter (q)' });

  try {
    // Filter=music_songs searches specifically for music to avoid random videos
    const data = await fetchWithRotation(`/search?q=${encodeURIComponent(query)}&filter=music_songs`);
    
    // Clean up results to avoid showing YouTube specific text
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
    res.status(502).json({ error: 'Search proxy failed', details: err.message });
  }
});

/**
 * GET /api/yt/stream/:videoId
 * Fetches highest quality audio stream and a video stream (for clips)
 */
router.get('/stream/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  
  try {
    const data = await fetchWithRotation(`/streams/${videoId}`);
    
    // Get highest quality audio stream (usually opus or m4a)
    const audioStreams = data.audioStreams || [];
    const bestAudio = audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];

    // Get a standard video stream for "clips" (e.g. 720p or 480p mp4, without watermark)
    const videoStreams = data.videoStreams || [];
    const bestVideo = videoStreams.find(v => v.videoOnly === false && v.mimeType.includes('mp4')) 
                   || videoStreams.find(v => v.mimeType.includes('mp4'));

    if (!bestAudio) {
      return res.status(404).json({ error: 'No audio stream found' });
    }

    // Clean metadata (no YT mentions)
    res.json({
      id: videoId,
      title: data.title,
      artist: data.uploader,
      thumbnail: data.thumbnailUrl,
      audioUrl: bestAudio.url,
      audioBitrate: bestAudio.bitrate,
      videoClipUrl: bestVideo ? bestVideo.url : null,
      source: 'External CDN' // Generic source name
    });

  } catch (err) {
    res.status(502).json({ error: 'Stream fetch failed', details: err.message });
  }
});

export default router;
