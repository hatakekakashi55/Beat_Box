import React from 'react';
import { IoPlay, IoPause, IoHeart, IoHeartOutline } from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import { getHighQualityImage, decodeHTML, getArtistNames } from '../../utils/helpers';
import './SongCard.css';

export default function SongCard({ song, queue, index, style }) {
  const { playSong, currentSong, isPlaying, togglePlay, toggleLike, isLiked } = usePlayer();

  if (!song) return null;

  const isCurrentSong = currentSong?.id === song.id;
  const liked = isLiked(song.id);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song, queue || [song], index || 0);
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    toggleLike(song);
  };

  return (
    <div
      className="song-card"
      onClick={handlePlay}
      style={style}
      id={`song-card-${song.id}`}
    >
      <div className="song-card__image-wrapper">
        <img
          className="song-card__image"
          src={getHighQualityImage(song.image)}
          alt={decodeHTML(song.name)}
          loading="lazy"
        />
        <button
          className="song-card__play-btn"
          onClick={handlePlay}
          aria-label={isCurrentSong && isPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentSong && isPlaying ? <IoPause /> : <IoPlay />}
        </button>
      </div>

      <button
        className={`song-card__like-btn ${liked ? 'liked' : ''}`}
        onClick={handleLike}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        {liked ? <IoHeart /> : <IoHeartOutline />}
      </button>

      <div className="song-card__title-row">
        {isCurrentSong && isPlaying && (
          <div className="song-card__playing">
            <div className="song-card__playing-bar" style={{ height: 6 }} />
            <div className="song-card__playing-bar" style={{ height: 10 }} />
            <div className="song-card__playing-bar" style={{ height: 4 }} />
          </div>
        )}
        <div className="song-card__title">{decodeHTML(song.name)}</div>
      </div>
      <div className="song-card__subtitle">{getArtistNames(song.artists, song.primaryArtists)}</div>
    </div>
  );
}
