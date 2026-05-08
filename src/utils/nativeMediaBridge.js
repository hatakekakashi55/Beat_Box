/**
 * Native Media Bridge — Syncs song metadata from JS to Android MusicService
 * This sends broadcast intents to update the native MediaStyle notification
 * with song title, artist, artwork, and playback state.
 *
 * 🔧 FIX: Added retry mechanism for bridge calls, better error handling,
 *    and debounce to prevent spamming the native layer.
 */

// Safe check for Capacitor — works in both web and native builds
const isAndroid = typeof window !== 'undefined' && window.Capacitor?.getPlatform?.() === 'android';

let _lastUpdateTime = 0;
const MIN_UPDATE_INTERVAL = 300; // ms — debounce rapid updates

/**
 * Update the native Android media notification with current song info
 * 🔧 FIX: Added debounce and retry for reliability
 */
export function updateNativeNotification({ title, artist, artwork, isPlaying }) {
  if (!isAndroid) return;

  // Debounce rapid updates (prevents notification flicker)
  const now = Date.now();
  if (now - _lastUpdateTime < MIN_UPDATE_INTERVAL) {
    // Schedule a delayed update instead of dropping it
    setTimeout(() => {
      _doUpdate(title, artist, artwork, isPlaying);
    }, MIN_UPDATE_INTERVAL);
    return;
  }

  _lastUpdateTime = now;
  _doUpdate(title, artist, artwork, isPlaying);
}

function _doUpdate(title, artist, artwork, isPlaying) {
  try {
    // Call native bridge via WebView JavascriptInterface
    if (window.BeatBoxBridge && typeof window.BeatBoxBridge.updateMediaNotification === 'function') {
      window.BeatBoxBridge.updateMediaNotification(
        title || 'BeatBox',
        artist || '',
        artwork || '',
        !!isPlaying
      );
    } else {
      // Bridge not ready yet — retry after a short delay
      setTimeout(() => {
        try {
          if (window.BeatBoxBridge && typeof window.BeatBoxBridge.updateMediaNotification === 'function') {
            window.BeatBoxBridge.updateMediaNotification(
              title || 'BeatBox',
              artist || '',
              artwork || '',
              !!isPlaying
            );
          }
        } catch (e) {
          console.warn('[NativeMediaBridge] Retry failed:', e);
        }
      }, 1000);
    }
  } catch (e) {
    console.warn('[NativeMediaBridge] Failed to update notification:', e);
  }
}

/**
 * Register listener for native media control actions (play/pause/next/prev from notification)
 */
export function registerNativeMediaListener(callbacks) {
  if (!isAndroid) return () => {};

  const handler = (event) => {
    const action = event.detail?.action;
    if (!action) return;

    switch (action) {
      case 'play':
        callbacks.onPlay?.();
        break;
      case 'pause':
        callbacks.onPause?.();
        break;
      case 'next':
        callbacks.onNext?.();
        break;
      case 'prev':
        callbacks.onPrev?.();
        break;
    }
  };

  window.addEventListener('beatbox-media-action', handler);
  return () => window.removeEventListener('beatbox-media-action', handler);
}
