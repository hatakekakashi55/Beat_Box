/**
 * Share Song — Uses Web Share API (works great on Android)
 * Falls back to clipboard copy on desktop.
 */

import { decodeHTML, getArtistNames } from './helpers';

export async function shareSong(song) {
  if (!song) return;

  const title = decodeHTML(song.name || song.title || 'Check out this song');
  const artist = getArtistNames(song.artists, song.primaryArtists);
  const text = `🎵 ${title} — ${artist}\n\nListening on UX Beat 🎧`;
  const url = song.url || song.perma_url || '';

  try {
    if (navigator.share) {
      await navigator.share({
        title: `${title} — ${artist}`,
        text,
        url: url || undefined,
      });
      return true;
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return 'copied';
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[Share] Failed:', err);
    }
    return false;
  }
}
