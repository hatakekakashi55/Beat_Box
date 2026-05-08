import React from 'react';
import { IoTime, IoPlay, IoShuffle } from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import SongRow from '../../components/SongRow/SongRow';
import { shuffleArray } from '../../utils/helpers';
import '../Library/Library.css';

export default function RecentlyPlayed() {
  const { recentlyPlayed, playSong } = usePlayer();

  const handlePlayAll = () => {
    if (recentlyPlayed.length > 0) {
      playSong(recentlyPlayed[0], recentlyPlayed, 0);
    }
  };

  const handleShuffle = () => {
    if (recentlyPlayed.length > 0) {
      const shuffled = shuffleArray(recentlyPlayed);
      playSong(shuffled[0], shuffled, 0);
    }
  };

  return (
    <div className="library-page" id="recent-page">
      {/* Header */}
      <div className="collection-header">
        <div
          className="collection-header__icon"
          style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}
        >
          <IoTime />
        </div>
        <div className="collection-header__info">
          <div className="collection-header__type">Playlist</div>
          <h1 className="collection-header__title">Recently Played</h1>
          <div className="collection-header__meta">
            <span>{recentlyPlayed.length}</span> songs
          </div>
        </div>
      </div>

      {recentlyPlayed.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button className="collection-play-btn" onClick={handlePlayAll} id="play-all-recent">
            <IoPlay className="collection-play-btn__icon" />
            Play All
          </button>
          <button
            className="collection-play-btn"
            onClick={handleShuffle}
            style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            id="shuffle-recent"
          >
            <IoShuffle className="collection-play-btn__icon" />
            Shuffle
          </button>
        </div>
      )}

      {/* Song List */}
      {recentlyPlayed.length > 0 ? (
        <>
          <div className="collection-list-header">
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span>Duration</span>
          </div>
          <div className="collection-list">
            {recentlyPlayed.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i}
                queue={recentlyPlayed}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="collection-empty">
          <div className="collection-empty__icon"><IoTime /></div>
          <div className="collection-empty__title">Listen to your first song</div>
          <div className="collection-empty__text">
            Songs you play will be saved here so you can easily find them again.
          </div>
        </div>
      )}
    </div>
  );
}
