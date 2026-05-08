import React from 'react';
import { IoHeart, IoPlay, IoShuffle } from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import SongRow from '../../components/SongRow/SongRow';
import { shuffleArray } from '../../utils/helpers';
import '../Library/Library.css';

export default function LikedSongs() {
  const { likedSongs, playSong } = usePlayer();

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      playSong(likedSongs[0], likedSongs, 0);
    }
  };

  const handleShuffle = () => {
    if (likedSongs.length > 0) {
      const shuffled = shuffleArray(likedSongs);
      playSong(shuffled[0], shuffled, 0);
    }
  };

  return (
    <div className="library-page" id="liked-songs-page">
      {/* Header */}
      <div className="collection-header">
        <div
          className="collection-header__icon"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
        >
          <IoHeart />
        </div>
        <div className="collection-header__info">
          <div className="collection-header__type">Playlist</div>
          <h1 className="collection-header__title">Liked Songs</h1>
          <div className="collection-header__meta">
            <span>{likedSongs.length}</span> songs
          </div>
        </div>
      </div>

      {likedSongs.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button className="collection-play-btn" onClick={handlePlayAll} id="play-all-liked">
            <IoPlay className="collection-play-btn__icon" />
            Play All
          </button>
          <button
            className="collection-play-btn"
            onClick={handleShuffle}
            style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            id="shuffle-liked"
          >
            <IoShuffle className="collection-play-btn__icon" />
            Shuffle
          </button>
        </div>
      )}

      {/* Song List */}
      {likedSongs.length > 0 ? (
        <>
          <div className="collection-list-header">
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span>Duration</span>
          </div>
          <div className="collection-list">
            {likedSongs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i}
                queue={likedSongs}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="collection-empty">
          <div className="collection-empty__icon"><IoHeart /></div>
          <div className="collection-empty__title">Songs you like will appear here</div>
          <div className="collection-empty__text">
            Save songs by tapping the heart icon.
          </div>
        </div>
      )}
    </div>
  );
}
