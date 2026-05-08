import React, { useState, useRef } from 'react';
import { IoPlay, IoHeart, IoHeartOutline, IoEllipsisHorizontal, IoAdd } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { getMediumQualityImage, decodeHTML, getArtistNames, formatDuration } from '../../utils/helpers';
import SongContextMenu from '../SongContextMenu/SongContextMenu';
import SongDetails from '../SongDetails/SongDetails';
import './SongRow.css';

export default function SongRow({ song, index, queue, showAlbum = true, showImage = true }) {
  const { playSong, currentSong, isPlaying, togglePlay, toggleLike, isLiked, addToQueue } = usePlayer();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!song) return null;

  const isCurrentSong = currentSong?.id === song.id;
  const liked = isLiked(song.id);

  const handleClick = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song, queue || [song], index || 0);
    }
  };

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showQueueToast, setShowQueueToast] = useState(false);
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);

  const handleLike = (e) => {
    e.stopPropagation();
    toggleLike(song);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const onTouchMove = (e) => {
    if (!isSwiping.current) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    // Only allow swipe right
    if (diff > 0 && diff < 100) {
      setSwipeOffset(diff);
    }
  };

  const onTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    
    // If swiped enough to the right (e.g. > 60px)
    if (swipeOffset > 60) {
      addToQueue(song);
      setShowQueueToast(true);
      setTimeout(() => setShowQueueToast(false), 2000); // hide toast after 2s
    }
    setSwipeOffset(0); // bounce back
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    setShowContextMenu(true);
  };

  const navigate = useNavigate();
  const handleAlbumClick = (e) => {
    e.stopPropagation();
    if (song.album?.id) {
      navigate(`/album/${song.album.id}`);
    }
  };

  return (
    <>
      <div className="song-row-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background icon revealed on swipe */}
        <div className="song-row__swipe-action" style={{ opacity: swipeOffset > 30 ? 1 : 0 }}>
          <IoAdd size={24} color="#00d2ff" />
        </div>

        <div
          className={`song-row ${isCurrentSong && isPlaying ? 'playing' : ''} ${showQueueToast ? 'queued' : ''}`}
          onClick={handleClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ 
            animationDelay: `${(index || 0) * 30}ms`,
            transform: `translateX(${swipeOffset}px)`,
            transition: isSwiping.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
          id={`song-row-${song.id}`}
        >
        {/* Number / Playing indicator */}
        <div className="song-row__number">
          <span className="song-row__number-text">
            {isCurrentSong && isPlaying ? '' : (index != null ? index + 1 : '')}
          </span>
          <div className="song-row__playing-bars">
            <div className="song-row__bar" style={{ height: 6 }} />
            <div className="song-row__bar" style={{ height: 10 }} />
            <div className="song-row__bar" style={{ height: 4 }} />
          </div>
          <div className="song-row__number-play">
            <IoPlay />
          </div>
        </div>

        {/* Song Info */}
        <div className="song-row__info">
          {showImage && (
            <img
              className="song-row__image"
              src={getMediumQualityImage(song.image)}
              alt={decodeHTML(song.name)}
              loading="lazy"
            />
          )}
          <div className="song-row__details">
            <div className="song-row__title">{decodeHTML(song.name)}</div>
            <div className="song-row__artist">{getArtistNames(song.artists, song.primaryArtists)}</div>
          </div>
        </div>

        {/* Album */}
        {showAlbum && (
          <div className="song-row__album" onClick={handleAlbumClick}>
            {decodeHTML(song.album?.name || '')}
          </div>
        )}

        {/* Actions */}
        <div className="song-row__actions">
          <button
            className={`song-row__like-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            {liked ? <IoHeart /> : <IoHeartOutline />}
          </button>
          <span className="song-row__duration">
            {formatDuration(song.duration)}
          </span>
          <button
            className="song-row__more-btn"
            onClick={handleMoreClick}
            aria-label="More options"
            title="More options"
          >
            <IoEllipsisHorizontal />
          </button>
        </div>
        </div>
      </div>

      {/* Context Menu (Spotify Bottom Sheet) */}
      {showContextMenu && (
        <SongContextMenu
          song={song}
          onClose={() => setShowContextMenu(false)}
          onShowDetails={(s) => setShowDetails(true)}
        />
      )}

      {/* Song Details Modal */}
      {showDetails && (
        <SongDetails
          song={song}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}
