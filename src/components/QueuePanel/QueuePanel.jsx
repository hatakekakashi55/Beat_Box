import React from 'react';
import { IoClose } from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import { getMediumQualityImage, decodeHTML, getArtistNames } from '../../utils/helpers';
import './QueuePanel.css';

export default function QueuePanel() {
  const {
    currentSong, queue, queueIndex, showQueue,
    toggleQueue, removeFromQueue, playSong,
  } = usePlayer();

  if (!showQueue) return null;

  const upcomingSongs = queue.slice(queueIndex + 1);

  return (
    <div className="queue-panel" id="queue-panel">
      <div className="queue-panel__header">
        <h2 className="queue-panel__title">Queue</h2>
        <button
          className="queue-panel__close"
          onClick={toggleQueue}
          id="queue-close-btn"
          aria-label="Close queue"
        >
          <IoClose />
        </button>
      </div>

      {/* Now Playing */}
      {currentSong && (
        <div className="queue-panel__now-playing">
          <div className="queue-panel__section-label">Now Playing</div>
          <div className="queue-panel__current">
            <img
              className="queue-panel__current-image"
              src={getMediumQualityImage(currentSong.image)}
              alt={decodeHTML(currentSong.name)}
            />
            <div className="queue-panel__current-info">
              <div className="queue-panel__current-title">
                {decodeHTML(currentSong.name)}
              </div>
              <div className="queue-panel__current-artist">
                {getArtistNames(currentSong.artists, currentSong.primaryArtists)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="queue-panel__list">
        {upcomingSongs.length > 0 && (
          <div className="queue-panel__section-label" style={{ marginBottom: 8 }}>
            Next Up ({upcomingSongs.length})
          </div>
        )}

        {upcomingSongs.map((song, i) => (
          <div
            key={`${song.id}-${i}`}
            className="queue-panel__item"
            onClick={() => playSong(song, queue, queueIndex + 1 + i)}
          >
            <img
              className="queue-panel__item-image"
              src={getMediumQualityImage(song.image)}
              alt={decodeHTML(song.name)}
              loading="lazy"
            />
            <div className="queue-panel__item-info">
              <div className="queue-panel__item-title">{decodeHTML(song.name)}</div>
              <div className="queue-panel__item-artist">{getArtistNames(song.artists, song.primaryArtists)}</div>
            </div>
            <button
              className="queue-panel__item-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeFromQueue(queueIndex + 1 + i);
              }}
              aria-label="Remove from queue"
            >
              <IoClose />
            </button>
          </div>
        ))}

        {upcomingSongs.length === 0 && (
          <div className="queue-panel__empty">
            No songs in queue.<br />Add songs to see them here.
          </div>
        )}
      </div>
    </div>
  );
}
